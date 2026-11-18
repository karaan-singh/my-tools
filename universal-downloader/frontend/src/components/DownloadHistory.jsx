import React from 'react';
import { getFileDownloadUrl } from '../services/api';

export default function DownloadHistory({ history, onDelete }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#ffffff',
        fontFamily: "'Space Grotesk', sans-serif",
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📜</span>
        <span>Recent Downloads ({history.length})</span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'rgba(30, 8, 40, 0.65)',
              border: '1px solid rgba(226, 232, 240, 0.12)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: 1 }}>
              <span style={{ fontSize: '20px' }}>
                {item.is_audio ? '🎵' : '🎬'}
              </span>
              <div>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>{item.quality_tag}</span> &nbsp;|&nbsp;
                  <span>{item.filesize_formatted}</span> &nbsp;|&nbsp;
                  <span>{item.ext.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.status === 'completed' && (
                <a
                  href={getFileDownloadUrl(item.id)}
                  download={item.filename}
                  style={{
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    color: '#fbbf24',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⬇️ Save
                </a>
              )}

              <button
                onClick={() => onDelete(item.id)}
                title="Delete from server"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
