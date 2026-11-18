import React from 'react';

export default function WebsiteScannerResults({ scanData, onSelectVideo }) {
  if (!scanData) return null;

  const { page_title, page_url, total_found, videos } = scanData;

  return (
    <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px' }}>🌐</span>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Website Scan Results
            </h3>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            Page: <span style={{ color: '#fbcfe8', fontWeight: 600 }}>{page_title || page_url}</span>
          </div>
        </div>

        <span style={{
          background: 'rgba(56, 189, 248, 0.16)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          color: '#bae6fd',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          ✨ {total_found} {total_found === 1 ? 'Video' : 'Videos'} Found
        </span>
      </div>

      {total_found === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px dashed rgba(226, 232, 240, 0.2)',
          borderRadius: '14px',
          padding: '30px',
          textAlign: 'center',
          color: '#cbd5e1'
        }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>No downloadable videos detected on this web page.</p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>
            The page might use dynamic DRM encryption or require user login to render media.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '16px'
        }}>
          {videos.map((vid, idx) => (
            <div
              key={vid.id || idx}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(244, 114, 182, 0.25)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.25s ease',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Thumbnail / Placeholder */}
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: '#090d16',
                overflow: 'hidden'
              }}>
                {vid.thumbnail ? (
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#bae6fd',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '28px' }}>🎬</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{vid.platform}</span>
                  </div>
                )}

                {vid.duration_formatted && (
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(11, 15, 25, 0.88)',
                    color: '#bae6fd',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    {vid.duration_formatted}
                  </span>
                )}

                <span style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(244, 114, 182, 0.9)',
                  color: '#0f172a',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.02em'
                }}>
                  #{idx + 1}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#bae6fd',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {vid.platform}
                  </span>
                  <span style={{
                    background: 'rgba(244, 114, 182, 0.12)',
                    border: '1px solid rgba(244, 114, 182, 0.3)',
                    color: '#fbcfe8',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}>
                    {vid.source_type}
                  </span>
                </div>

                <div style={{
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  color: '#ffffff',
                  lineHeight: '1.35',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1
                }}>
                  {vid.title}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => onSelectVideo(vid.url)}
                    className="glow-btn"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⚡ Download</span>
                    <span>➜</span>
                  </button>

                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Source Link"
                    style={{
                      background: 'rgba(226, 232, 240, 0.1)',
                      border: '1px solid rgba(226, 232, 240, 0.25)',
                      color: '#cbd5e1',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}
                  >
                    🔗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
