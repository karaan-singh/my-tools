import React from 'react';

export default function Header() {
  return (
    <header style={{ marginBottom: '32px' }}>
      <div className="glass-panel" style={{
        padding: '30px 38px',
        background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.12) 0%, rgba(17, 24, 39, 0.88) 50%, rgba(56, 189, 248, 0.14) 100%)',
        border: '1px solid rgba(244, 114, 182, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient Top Light Beam */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #f472b6, #38bdf8, transparent)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #38bdf8 100%)',
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 18px rgba(244, 114, 182, 0.4), 0 2px 10px rgba(56, 189, 248, 0.3)'
              }}>
                ⚡
              </span>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '2.25rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffffff 0%, #fbcfe8 40%, #7dd3fc 80%, #bae6fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                Universal Video Downloader
              </h1>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.5' }}>
              Extract, stream, and download video or audio in <span style={{ color: '#fbcfe8', fontWeight: 600 }}>1080p, 4K, 720p</span> &amp; <span style={{ color: '#7dd3fc', fontWeight: 600 }}>320 kbps MP3</span> with FFmpeg.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(244, 114, 182, 0.16)',
              border: '1px solid rgba(244, 114, 182, 0.45)',
              color: '#fbcfe8',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              🌸 yt-dlp Engine
            </span>
            <span style={{
              background: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#bae6fd',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              ❄️ FFmpeg Merged
            </span>
            <span style={{
              background: 'rgba(192, 132, 252, 0.16)',
              border: '1px solid rgba(192, 132, 252, 0.45)',
              color: '#e9d5ff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              🛡️ SSRF Guarded
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
