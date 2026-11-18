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
      background: '#ffffff',
      border: isCompleted 
        ? '1.5px solid #38bdf8' 
        : (isFailed 
          ? '1.5px solid #f87171' 
          : '1.5px solid #f472b6')
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>
            {isCompleted ? '🎉' : (isFailed ? '❌' : '⏳')}
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
              {job.title}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Target: <span style={{ color: '#db2777', fontWeight: 600 }}>{job.quality_tag}</span> &nbsp;|&nbsp; 
              <span style={{ color: '#0284c7', fontWeight: 600 }}>{job.ext.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <span style={{
          background: isCompleted 
            ? '#f0f9ff' 
            : (isFailed ? '#fef2f2' : '#fdf2f8'),
          color: isCompleted 
            ? '#0369a1' 
            : (isFailed ? '#dc2626' : '#9d174d'),
          border: isCompleted 
            ? '1px solid #bae6fd' 
            : (isFailed ? '1px solid #fecaca' : '1px solid #fbcfe8'),
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
        height: '10px',
        background: '#f1f5f9',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        marginBottom: '12px'
      }}>
        <div style={{
          height: '100%',
          width: `${job.progress}%`,
          background: 'linear-gradient(90deg, #f472b6 0%, #38bdf8 100%)',
          borderRadius: '6px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Stats Row */}
      {!isCompleted && !isFailed && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.84rem',
          color: '#64748b',
          marginBottom: '8px'
        }}>
          <div>
            <b>Progress:</b> <span style={{ color: '#db2777' }}>{job.progress}%</span>
          </div>
          <div>
            <b>Speed:</b> <span style={{ color: '#0284c7' }}>{job.speed || 'Calculating...'}</span>
          </div>
          <div>
            <b>ETA:</b> {job.eta_formatted || '--:--'}
          </div>
        </div>
      )}

      {/* Error state */}
      {isFailed && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '0.88rem',
          marginTop: '8px'
        }}>
          ⚠️ {job.error || 'Download failed. Please verify that this video is publicly accessible.'}
        </div>
      )}

      {/* Finished State: Save File Button */}
      {isCompleted && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href={getFileDownloadUrl(job.id)}
            download={job.filename}
            className="glow-btn"
            style={{
              textDecoration: 'none',
              padding: '13px 26px',
              borderRadius: '10px',
              fontSize: '0.98rem',
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
