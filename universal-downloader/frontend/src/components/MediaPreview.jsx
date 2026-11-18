import React from 'react';

export default function MediaPreview({ info }) {
  if (!info) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: '#ffffff' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Thumbnail with duration badge */}
        <div style={{
          position: 'relative',
          width: '320px',
          maxWidth: '100%',
          aspectRatio: '16/9',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
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
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
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
              background: '#fdf2f8',
              border: '1px solid #fbcfe8',
              color: '#9d174d',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {info.platform}
            </span>

            <span style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              👤 {info.uploader}
            </span>
          </div>

          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: '1.4',
            marginBottom: '10px',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            {info.title}
          </h2>

          {info.description && (
            <p style={{
              color: '#475569',
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
