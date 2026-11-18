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
    <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '28px' }}>
      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.15)',
          gap: '4px'
        }}>
          <button
            onClick={() => setMode('inspect')}
            style={{
              background: mode === 'inspect' ? 'linear-gradient(135deg, #f472b6, #ec4899)' : 'transparent',
              color: mode === 'inspect' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mode === 'inspect' ? '0 4px 14px rgba(244, 114, 182, 0.4)' : 'none'
            }}
          >
            <span>🎬</span>
            <span>Single Video Downloader</span>
          </button>

          <button
            onClick={() => setMode('scan')}
            style={{
              background: mode === 'scan' ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)' : 'transparent',
              color: mode === 'scan' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mode === 'scan' ? '0 4px 14px rgba(56, 189, 248, 0.4)' : 'none'
            }}
          >
            <span>🌐</span>
            <span>Website Video Scanner (Find All Videos)</span>
          </button>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {mode === 'scan' 
            ? 'Detects HTML5 videos, embedded players, & direct files on any page'
            : 'Inspects specific video & audio streams'}
        </span>
      </div>

      <label style={{
        display: 'block',
        fontSize: '0.88rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: mode === 'scan' ? '#bae6fd' : '#fbcfe8',
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
        background: 'rgba(15, 23, 42, 0.88)',
        border: mode === 'scan' ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(244, 114, 182, 0.45)',
        borderRadius: '16px',
        padding: '6px 8px 6px 18px',
        gap: '10px',
        boxShadow: mode === 'scan' 
          ? 'inset 0 2px 6px rgba(0, 0, 0, 0.4), 0 0 15px rgba(56, 189, 248, 0.15)'
          : 'inset 0 2px 6px rgba(0, 0, 0, 0.4), 0 0 15px rgba(244, 114, 182, 0.15)',
        transition: 'all 0.25s ease'
      }}>
        <span style={{ fontSize: '18px', color: mode === 'scan' ? '#38bdf8' : '#f472b6' }}>
          {mode === 'scan' ? '🌐' : '🔗'}
        </span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'scan'
            ? "https://example.com/article, blog post, or page containing videos..."
            : "https://www.youtube.com/watch?v=... or TikTok, Twitter, Vimeo URL"
          }
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '1.02rem',
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
            background: 'rgba(226, 232, 240, 0.1)',
            border: '1px solid rgba(226, 232, 240, 0.25)',
            color: '#cbd5e1',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '0.88rem',
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
              borderRadius: '12px',
              padding: '12px 26px',
              fontSize: '0.98rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #f472b6 100%)'
            }}
          >
            {loading && loadingAction === 'scan' ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid #0f172a',
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
              borderRadius: '12px',
              padding: '12px 26px',
              fontSize: '0.98rem',
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
                  border: '2px solid #0f172a',
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
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '4px' }}>Works on:</span>
        {POPULAR_PLATFORMS.map((p, idx) => {
          const isPink = idx % 2 === 0;
          return (
            <span
              key={p.name}
              style={{
                background: isPink ? 'rgba(244, 114, 182, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                border: isPink ? '1px solid rgba(244, 114, 182, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                color: isPink ? '#fbcfe8' : '#bae6fd',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
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
