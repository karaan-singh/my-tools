import React from 'react';

export default function WebsiteScannerResults({ scanData, onSelectVideo }) {
  if (!scanData) return null;

  const { page_title, page_url, total_found, videos } = scanData;

  return (
    <div className="glass-panel" style={{ padding: '26px 30px', marginBottom: '32px', background: '#ffffff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px' }}>🌐</span>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0f172a',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Website Scan Results
            </h3>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Page: <span style={{ color: '#be185d', fontWeight: 600 }}>{page_title || page_url}</span>
          </div>
        </div>

        <span style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          color: '#0369a1',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.86rem',
          fontWeight: 700
        }}>
          ✨ {total_found} {total_found === 1 ? 'Video' : 'Videos'} Found
        </span>
      </div>

      {total_found === 0 ? (
        <div style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center',
          color: '#475569'
        }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>No downloadable videos detected on this web page.</p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
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
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
              }}
            >
              {/* Thumbnail / Placeholder */}
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: '#f1f5f9',
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
                    color: '#0369a1',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '28px' }}>🎬</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{vid.platform}</span>
                  </div>
                )}

                {vid.duration_formatted && (
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {vid.duration_formatted}
                  </span>
                )}

                <span style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  color: '#9d174d',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  #{idx + 1}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {vid.platform}
                  </span>
                  <span style={{
                    background: '#fdf2f8',
                    border: '1px solid #fbcfe8',
                    color: '#9d174d',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}>
                    {vid.source_type}
                  </span>
                </div>

                <div style={{
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  color: '#0f172a',
                  lineHeight: '1.4',
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
                      borderRadius: '8px',
                      fontSize: '0.86rem',
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
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      padding: '10px 14px',
                      borderRadius: '8px',
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
