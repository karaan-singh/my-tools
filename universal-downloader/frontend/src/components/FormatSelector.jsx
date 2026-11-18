import React, { useState } from 'react';

export default function FormatSelector({ info, onDownload, downloading }) {
  const [tab, setTab] = useState('video'); // 'video' or 'audio'
  const [selectedFormat, setSelectedFormat] = useState(null);

  if (!info) return null;

  const videoOptions = info.video_options || [];
  const audioOptions = info.audio_options || [];

  const activeOptions = tab === 'video' ? videoOptions : audioOptions;
  const currentSelection = selectedFormat || activeOptions[0];

  const handleStart = () => {
    if (!currentSelection) return;
    onDownload({
      url: info.webpage_url,
      title: info.title,
      ext: currentSelection.ext,
      quality_tag: currentSelection.quality_tag,
      format_id: currentSelection.format_id,
      height: currentSelection.height,
      is_audio: tab === 'audio',
      thumbnail: info.thumbnail
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          Select Download Quality
        </h3>

        {/* Tab Toggle with Light Pink & Light Blue */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid rgba(226, 232, 240, 0.15)',
          gap: '4px'
        }}>
          <button
            onClick={() => { setTab('video'); setSelectedFormat(videoOptions[0]); }}
            style={{
              background: tab === 'video' ? 'linear-gradient(135deg, #f472b6, #ec4899)' : 'transparent',
              color: tab === 'video' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '9px 22px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: tab === 'video' ? '0 4px 15px rgba(244, 114, 182, 0.4)' : 'none'
            }}
          >
            <span>🎬</span>
            <span>Video (+Audio)</span>
          </button>

          <button
            onClick={() => { setTab('audio'); setSelectedFormat(audioOptions[0]); }}
            style={{
              background: tab === 'audio' ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)' : 'transparent',
              color: tab === 'audio' ? '#ffffff' : '#cbd5e1',
              border: 'none',
              padding: '9px 22px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: tab === 'audio' ? '0 4px 15px rgba(56, 189, 248, 0.4)' : 'none'
            }}
          >
            <span>🎵</span>
            <span>Audio Only</span>
          </button>
        </div>
      </div>

      {/* Grid of Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {activeOptions.map((opt, idx) => {
          const isSelected = currentSelection === opt;
          const activeBorder = tab === 'video' ? '#f472b6' : '#38bdf8';
          const activeBg = tab === 'video' ? 'rgba(244, 114, 182, 0.12)' : 'rgba(56, 189, 248, 0.12)';
          const activeGlow = tab === 'video' ? '0 0 20px rgba(244, 114, 182, 0.35)' : '0 0 20px rgba(56, 189, 248, 0.35)';

          return (
            <div
              key={idx}
              onClick={() => setSelectedFormat(opt)}
              style={{
                background: isSelected ? activeBg : 'rgba(15, 23, 42, 0.65)',
                border: isSelected ? `2px solid ${activeBorder}` : '1px solid rgba(226, 232, 240, 0.12)',
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isSelected ? activeGlow : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: isSelected ? (tab === 'video' ? '#fbcfe8' : '#bae6fd') : '#ffffff',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    {opt.quality_tag}
                  </span>
                  {opt.resolution && (
                    <span style={{ color: '#cbd5e1', fontSize: '0.85rem', marginLeft: '6px' }}>
                      ({opt.resolution})
                    </span>
                  )}
                </div>

                <span style={{
                  background: 'rgba(226, 232, 240, 0.12)',
                  color: '#f8fafc',
                  border: '1px solid rgba(226, 232, 240, 0.25)',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {opt.ext}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: '#cbd5e1' }}>
                <span>{opt.filesize_formatted || 'High Bitrate'}</span>
                {opt.fps && <span>{opt.fps} FPS</span>}
                {opt.title && <span>{opt.title}</span>}
              </div>

              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: tab === 'video' ? '#f472b6' : '#38bdf8',
                  color: '#ffffff',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Download Button */}
      <button
        onClick={handleStart}
        disabled={downloading || !currentSelection}
        className="glow-btn"
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '14px',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <span>⬇️ Download</span>
        <span>{currentSelection ? `${currentSelection.quality_tag} (${currentSelection.ext.toUpperCase()})` : ''}</span>
      </button>
    </div>
  );
}
