import React, { useState } from 'react';

export default function FormatSelector({ info, onDownload, downloading }) {
  const [tab, setTab] = useState('video'); // 'video' or 'audio'
  const [selectedFormat, setSelectedFormat] = useState(null);

  if (!info) return null;

  const videoOptions = info.video_options || [];
  const audioOptions = info.audio_options || [];

  // Default selection if none selected
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
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          Select Download Quality
        </h3>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(25, 7, 34, 0.7)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.15)'
        }}>
          <button
            onClick={() => { setTab('video'); setSelectedFormat(videoOptions[0]); }}
            style={{
              background: tab === 'video' ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'transparent',
              color: tab === 'video' ? '#120317' : '#cbd5e1',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🎬</span>
            <span>Video (+Audio)</span>
          </button>

          <button
            onClick={() => { setTab('audio'); setSelectedFormat(audioOptions[0]); }}
            style={{
              background: tab === 'audio' ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'transparent',
              color: tab === 'audio' ? '#120317' : '#cbd5e1',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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
          return (
            <div
              key={idx}
              onClick={() => setSelectedFormat(opt)}
              style={{
                background: isSelected ? 'rgba(74, 20, 99, 0.5)' : 'rgba(30, 8, 40, 0.65)',
                border: isSelected ? '2px solid #fbbf24' : '1px solid rgba(226, 232, 240, 0.14)',
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: isSelected ? '#fbbf24' : '#ffffff',
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
                  background: 'rgba(226, 232, 240, 0.1)',
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span>{opt.filesize_formatted || 'High Bitrate'}</span>
                {opt.fps && <span>{opt.fps} FPS</span>}
                {opt.title && <span>{opt.title}</span>}
              </div>

              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#fbbf24',
                  color: '#120317',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800
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
