import React from 'react';
import { getFileDownloadUrl } from '../services/api';

export default function DownloadHistory({ history, onDelete }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '26px 30px', marginTop: '32px', background: '#ffffff' }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#0f172a',
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
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: 1 }}>
              <span style={{ fontSize: '20px' }}>
                {item.is_audio ? '🎵' : '🎬'}
              </span>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  <span style={{ color: '#be185d', fontWeight: 600 }}>{item.quality_tag}</span> &nbsp;|&nbsp;
                  <span style={{ color: '#0369a1' }}>{item.filesize_formatted}</span> &nbsp;|&nbsp;
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
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    color: '#0369a1',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
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
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
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
