import React from 'react';

export default function MediaPreview({ info }) {
  if (!info) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Thumbnail with duration badge */}
        <div style={{
          position: 'relative',
          width: '320px',
          maxWidth: '100%',
          aspectRatio: '16/9',
          borderRadius: '14px',
          overflow: 'hidden',
          backgroundColor: '#1b0726',
          border: '1px solid rgba(226, 232, 240, 0.2)',
          flexShrink: 0
        }}>
          {info.thumbnail ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              🎬 Video Preview
            </div>
          )}

          {info.duration_formatted && (
            <span style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(14, 3, 20, 0.88)',
              color: '#f8fafc',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(226, 232, 240, 0.25)',
              letterSpacing: '0.04em'
            }}>
              {info.duration_formatted}
            </span>
          )}
        </div>

        {/* Video Metadata */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#fbbf24',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {info.platform}
            </span>

            <span style={{
              background: 'rgba(226, 232, 240, 0.12)',
              border: '1px solid rgba(226, 232, 240, 0.25)',
              color: '#f8fafc',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              👤 {info.uploader}
            </span>
          </div>

          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: '1.4',
            marginBottom: '10px',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            {info.title}
          </h2>

          {info.description && (
            <p style={{
              color: '#cbd5e1',
              fontSize: '0.88rem',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {info.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
