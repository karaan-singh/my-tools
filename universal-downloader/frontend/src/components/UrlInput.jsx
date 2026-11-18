import React from 'react';

const POPULAR_PLATFORMS = [
  { name: 'YouTube', icon: '▶' },
  { name: 'TikTok', icon: '📱' },
  { name: 'X / Twitter', icon: '𝕏' },
  { name: 'Instagram', icon: '📸' },
  { name: 'Vimeo', icon: '🎬' },
  { name: 'Reddit', icon: '👾' },
  { name: 'SoundCloud', icon: '🎧' },
  { name: 'Any Website (HTML5/Embeds)', icon: '🌐' },
];

export default function UrlInput({
  url,
  setUrl,
  onInspect,
  onScan,
  mode,
  setMode,
  loading,
  loadingAction
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (err) {
      // Fallback
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && url.trim()) {
      if (mode === 'scan') {
        onScan();
      } else {
        onInspect();
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '26px 30px', marginBottom: '28px', background: '#ffffff' }}>
      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          gap: '4px'
        }}>
          <button
            onClick={() => setMode('inspect')}
            style={{
              background: mode === 'inspect' ? '#ffffff' : 'transparent',
              color: mode === 'inspect' ? '#be185d' : '#64748b',
              border: mode === 'inspect' ? '1px solid #fbcfe8' : 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mode === 'inspect' ? '0 2px 6px rgba(0, 0, 0, 0.05)' : 'none'
            }}
          >
            <span>🎬</span>
            <span>Single Video Downloader</span>
          </button>

          <button
            onClick={() => setMode('scan')}
            style={{
              background: mode === 'scan' ? '#ffffff' : 'transparent',
              color: mode === 'scan' ? '#0369a1' : '#64748b',
              border: mode === 'scan' ? '1px solid #bae6fd' : 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mode === 'scan' ? '0 2px 6px rgba(0, 0, 0, 0.05)' : 'none'
            }}
          >
            <span>🌐</span>
            <span>Website Video Scanner</span>
          </button>
        </div>

        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          {mode === 'scan' 
            ? 'Crawl any website for HTML5 videos, iframe embeds & direct files'
            : 'Inspect specific video & audio quality options'}
        </span>
      </div>

      <label style={{
        display: 'block',
        fontSize: '0.86rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: mode === 'scan' ? '#0369a1' : '#be185d',
        fontWeight: 700,
        marginBottom: '10px'
      }}>
        {mode === 'scan'
          ? 'Enter Website URL to Scan for Videos'
          : 'Paste Video or Media URL'}
      </label>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        border: mode === 'scan' ? '1.5px solid #7dd3fc' : '1.5px solid #f472b6',
        borderRadius: '14px',
        padding: '5px 8px 5px 16px',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.2s ease'
      }}>
        <span style={{ fontSize: '18px', color: mode === 'scan' ? '#0ea5e9' : '#ec4899' }}>
          {mode === 'scan' ? '🌐' : '🔗'}
        </span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'scan'
            ? "https://example.com/article, blog post, or webpage..."
            : "https://www.youtube.com/watch?v=... or TikTok, Twitter, Vimeo URL"
          }
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#0f172a',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />

        {url && (
          <button
            onClick={() => setUrl('')}
            disabled={loading}
            title="Clear input"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        )}

        <button
          onClick={handlePaste}
          disabled={loading}
          type="button"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#334155',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '0.86rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          📋 Paste
        </button>

        {mode === 'scan' ? (
          <button
            onClick={onScan}
            disabled={loading || !url.trim()}
            className="glow-btn"
            style={{
              borderRadius: '10px',
              padding: '11px 24px',
              fontSize: '0.94rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #38bdf8 0%, #ec4899 100%)'
            }}
          >
            {loading && loadingAction === 'scan' ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>Scanning Page...</span>
              </>
            ) : (
              <>
                <span>🔍 Scan Website</span>
                <span>➜</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onInspect}
            disabled={loading || !url.trim()}
            className="glow-btn"
            style={{
              borderRadius: '10px',
              padding: '11px 24px',
              fontSize: '0.94rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {loading && loadingAction === 'inspect' ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Inspect Video</span>
                <span>➜</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Platform Chips */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '4px' }}>Works on:</span>
        {POPULAR_PLATFORMS.map((p, idx) => {
          const isPink = idx % 2 === 0;
          return (
            <span
              key={p.name}
              style={{
                background: isPink ? '#fdf2f8' : '#f0f9ff',
                border: isPink ? '1px solid #fbcfe8' : '1px solid #bae6fd',
                color: isPink ? '#9d174d' : '#0369a1',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
