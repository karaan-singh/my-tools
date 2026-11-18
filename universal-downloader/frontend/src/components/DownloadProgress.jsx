import React from 'react';
import { getFileDownloadUrl } from '../services/api';

export default function DownloadProgress({ job }) {
  if (!job) return null;

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isProcessing = job.status === 'processing';

  return (
    <div className="glass-panel" style={{
      padding: '24px 28px',
      marginBottom: '28px',
      border: isCompleted 
        ? '1px solid rgba(56, 189, 248, 0.6)' 
        : (isFailed 
          ? '1px solid rgba(239, 68, 68, 0.6)' 
          : '1px solid rgba(244, 114, 182, 0.4)')
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>
            {isCompleted ? '🎉' : (isFailed ? '❌' : '⏳')}
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
              {job.title}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
              Target: <span style={{ color: '#fbcfe8', fontWeight: 600 }}>{job.quality_tag}</span> &nbsp;|&nbsp; 
              <span style={{ color: '#bae6fd', fontWeight: 600 }}>{job.ext.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <span style={{
          background: isCompleted 
            ? 'rgba(56, 189, 248, 0.2)' 
            : (isFailed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(244, 114, 182, 0.2)'),
          color: isCompleted 
            ? '#7dd3fc' 
            : (isFailed ? '#f87171' : '#fbcfe8'),
          border: isCompleted 
            ? '1px solid rgba(56, 189, 248, 0.45)' 
            : (isFailed ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(244, 114, 182, 0.45)'),
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'capitalize'
        }}>
          {isProcessing ? 'Merging Audio & Video...' : job.status}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div style={{
        height: '12px',
        background: 'rgba(15, 23, 42, 0.85)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.12)',
        marginBottom: '12px'
      }}>
        <div style={{
          height: '100%',
          width: `${job.progress}%`,
          background: 'linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #38bdf8 85%, #bae6fd 100%)',
          borderRadius: '8px',
          transition: 'width 0.3s ease',
          boxShadow: '0 0 14px rgba(244, 114, 182, 0.5)'
        }} />
      </div>

      {/* Stats Row */}
      {!isCompleted && !isFailed && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: '#cbd5e1',
          marginBottom: '10px'
        }}>
          <div>
            <b>Progress:</b> <span style={{ color: '#fbcfe8' }}>{job.progress}%</span>
          </div>
          <div>
            <b>Speed:</b> <span style={{ color: '#bae6fd' }}>{job.speed || 'Calculating...'}</span>
          </div>
          <div>
            <b>ETA:</b> {job.eta_formatted || '--:--'}
          </div>
        </div>
      )}

      {/* Error state */}
      {isFailed && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '0.88rem',
          marginTop: '8px'
        }}>
          ⚠️ {job.error || 'Download failed. Please verify that this video is publicly accessible.'}
        </div>
      )}

      {/* Finished State: 1-Click Save File Button */}
      {isCompleted && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href={getFileDownloadUrl(job.id)}
            download={job.filename}
            className="glow-btn"
            style={{
              textDecoration: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⬇️ Save File to Computer</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>({job.filesize_formatted})</span>
          </a>
        </div>
      )}
    </div>
  );
}
