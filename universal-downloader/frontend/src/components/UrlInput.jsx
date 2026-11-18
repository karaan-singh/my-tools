import React from 'react';

const POPULAR_PLATFORMS = [
  { name: 'YouTube', icon: '▶' },
  { name: 'TikTok', icon: '📱' },
  { name: 'X / Twitter', icon: '𝕏' },
  { name: 'Instagram', icon: '📸' },
  { name: 'Vimeo', icon: '🎬' },
  { name: 'Reddit', icon: '👾' },
  { name: 'SoundCloud', icon: '🎧' },
  { name: 'Facebook', icon: '👥' },
];

export default function UrlInput({ url, setUrl, onInspect, loading }) {
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
      onInspect();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '28px' }}>
      <label style={{
        display: 'block',
        fontSize: '0.88rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#bae6fd', /* Light blue */
        fontWeight: 700,
        marginBottom: '12px'
      }}>
        Paste Video or Media URL
      </label>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.88)',
        border: '1px solid rgba(244, 114, 182, 0.35)',
        borderRadius: '16px',
        padding: '6px 8px 6px 18px',
        gap: '10px',
        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4), 0 0 15px rgba(244, 114, 182, 0.1)',
        transition: 'border-color 0.25s ease'
      }}>
        <span style={{ fontSize: '18px', color: '#f472b6' }}>🔗</span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://www.youtube.com/watch?v=... or TikTok, Twitter, Vimeo URL"
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '1.05rem',
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
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#bae6fd',
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

        <button
          onClick={onInspect}
          disabled={loading || !url.trim()}
          className="glow-btn"
          style={{
            borderRadius: '12px',
            padding: '12px 28px',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? (
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
      </div>

      {/* Platform Chips in soft Light Blue & Light Pink */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '4px' }}>Supported:</span>
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
