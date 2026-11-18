import React from 'react';

export default function Header() {
  return (
    <header style={{ marginBottom: '32px' }}>
      <div className="glass-panel" style={{
        padding: '28px 36px',
        background: 'linear-gradient(135deg, rgba(46, 12, 61, 0.85) 0%, rgba(24, 6, 34, 0.92) 50%, rgba(245, 158, 11, 0.12) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
              }}>
                ⚡
              </span>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '2.2rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 45%, #cbd5e1 75%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                Universal Video Downloader
              </h1>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.5' }}>
              Extract, stream, and download video or audio in <span style={{ color: '#fbbf24', fontWeight: 600 }}>1080p, 4K, 720p & MP3</span> with FFmpeg audio-merging.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              yt-dlp Engine
            </span>
            <span style={{
              background: 'rgba(226, 232, 240, 0.12)',
              border: '1px solid rgba(226, 232, 240, 0.3)',
              color: '#f8fafc',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              FFmpeg Merged
            </span>
            <span style={{
              background: 'rgba(74, 20, 99, 0.45)',
              border: '1px solid rgba(216, 180, 254, 0.3)',
              color: '#f3e8ff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              SSRF Guarded
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
