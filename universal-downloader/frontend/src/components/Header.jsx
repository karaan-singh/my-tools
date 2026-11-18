import React from 'react';

export default function Header() {
  return (
    <header style={{ marginBottom: '32px' }}>
      <div className="glass-panel" style={{
        padding: '30px 38px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Soft Accent Border along top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #fbcfe8 0%, #f472b6 40%, #38bdf8 70%, #bae6fd 100%)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #fbcfe8 0%, #bae6fd 100%)',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
              }}>
                ⚡
              </span>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '2.15rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em'
              }}>
                Universal Video Downloader
              </h1>
            </div>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>
              Inspect, stream, and download video or audio in <span style={{ color: '#db2777', fontWeight: 600 }}>1080p, 4K, 720p</span> &amp; <span style={{ color: '#0284c7', fontWeight: 600 }}>320 kbps MP3</span> with FFmpeg.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#fdf2f8',
              border: '1px solid #fbcfe8',
              color: '#9d174d',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              yt-dlp Engine
            </span>
            <span style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              FFmpeg Merged
            </span>
            <span style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
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
