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
    <div className="glass-panel" style={{ padding: '26px 30px', marginBottom: '28px', background: '#ffffff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#0f172a',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          Select Download Quality
        </h3>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          gap: '4px'
        }}>
          <button
            onClick={() => { setTab('video'); setSelectedFormat(videoOptions[0]); }}
            style={{
              background: tab === 'video' ? '#ffffff' : 'transparent',
              color: tab === 'video' ? '#be185d' : '#64748b',
              border: tab === 'video' ? '1px solid #fbcfe8' : 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: tab === 'video' ? '0 2px 6px rgba(0, 0, 0, 0.05)' : 'none'
            }}
          >
            <span>🎬</span>
            <span>Video (+Audio)</span>
          </button>

          <button
            onClick={() => { setTab('audio'); setSelectedFormat(audioOptions[0]); }}
            style={{
              background: tab === 'audio' ? '#ffffff' : 'transparent',
              color: tab === 'audio' ? '#0369a1' : '#64748b',
              border: tab === 'audio' ? '1px solid #bae6fd' : 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: tab === 'audio' ? '0 2px 6px rgba(0, 0, 0, 0.05)' : 'none'
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
          const isVideo = tab === 'video';

          const cardBg = isSelected 
            ? (isVideo ? '#fdf2f8' : '#f0f9ff') 
            : '#f8fafc';
          const cardBorder = isSelected 
            ? (isVideo ? '2px solid #ec4899' : '2px solid #0ea5e9') 
            : '1px solid #e2e8f0';
          const titleColor = isSelected 
            ? (isVideo ? '#be185d' : '#0369a1') 
            : '#0f172a';

          return (
            <div
              key={idx}
              onClick={() => setSelectedFormat(opt)}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 4px 12px rgba(15, 23, 42, 0.06)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: titleColor,
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    {opt.quality_tag}
                  </span>
                  {opt.resolution && (
                    <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '6px' }}>
                      ({opt.resolution})
                    </span>
                  )}
                </div>

                <span style={{
                  background: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {opt.ext}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: '#64748b' }}>
                <span>{opt.filesize_formatted || 'High Bitrate'}</span>
                {opt.fps && <span>{opt.fps} FPS</span>}
                {opt.title && <span>{opt.title}</span>}
              </div>

              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: isVideo ? '#ec4899' : '#0ea5e9',
                  color: '#ffffff',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
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
          padding: '15px',
          borderRadius: '12px',
          fontSize: '1.05rem',
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
