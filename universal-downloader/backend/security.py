import ipaddress
import os
import re
import socket
import time
from typing import Tuple
from urllib.parse import urlparse

# Private / reserved IPv4 & IPv6 networks to block against SSRF
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local / Cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),     # Multicast
    ipaddress.ip_network("240.0.0.0/4"),     # Reserved
    ipaddress.ip_network("::1/128"),         # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),        # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),       # IPv6 link-local
]

def is_ip_blocked(ip_str: str) -> bool:
    """Check if an IP string belongs to any private, loopback, or reserved range."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in net for net in BLOCKED_NETWORKS) or ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local
    except ValueError:
        return True

def validate_url(url: str) -> Tuple[bool, str]:
    """
    Validate a user-supplied URL against SSRF attacks, non-HTTP protocols, and localhost access.
    Returns (is_valid, error_message_or_normalized_url).
    """
    if not url or not isinstance(url, str):
        return False, "URL cannot be empty."

    url = url.strip()
    if len(url) > 2048:
        return False, "URL is too long (maximum 2048 characters)."

    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL format."

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported protocol '{parsed.scheme}'. Only HTTP and HTTPS URLs are allowed."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must contain a valid domain name or public host."

    # Direct check for localhost aliases
    lower_host = hostname.lower()
    if lower_host in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "metadata.google.internal"):
        return False, "Access to localhost or internal network hosts is strictly prohibited."

    # DNS Resolution check to prevent DNS rebinding to internal addresses
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for item in addr_info:
            ip_str = item[4][0]
            if is_ip_blocked(ip_str):
                return False, f"URL resolves to a restricted or private network address ({ip_str})."
    except socket.gaierror:
        return False, f"Could not resolve host '{hostname}'. Please check the URL domain."
    except Exception as e:
        return False, f"Hostname resolution error: {str(e)}"

    return True, url

def sanitize_filename(name: str, max_length: int = 150) -> str:
    """Remove unsafe characters and directory traversal markers from filename."""
    # Replace invalid path chars on Windows / Linux
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    clean = clean.replace("\n", " ").replace("\r", " ").strip()
    clean = re.sub(r"\s+", " ", clean)
    if not clean:
        clean = f"download_{int(time.time())}"
    return clean[:max_length]

def cleanup_old_files(directory: str, max_age_seconds: int = 7200):
    """Delete files in the directory older than max_age_seconds (default 2 hours)."""
    if not os.path.exists(directory):
        return
    now = time.time()
    for root, _, files in os.walk(directory):
        for file in files:
            if file.startswith("."):
                continue
            path = os.path.join(root, file)
            try:
                if os.path.isfile(path):
                    if now - os.path.getmtime(path) > max_age_seconds:
                        os.remove(path)
            except Exception:
                pass
