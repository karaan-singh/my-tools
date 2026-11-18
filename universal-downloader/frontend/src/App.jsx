import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import FormatSelector from './components/FormatSelector';
import DownloadProgress from './components/DownloadProgress';
import DownloadHistory from './components/DownloadHistory';
import { extractMedia, startDownload, getJobStatus, getHistory, deleteHistoryItem } from './services/api';

export default function App() {
  const [url, setUrl] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  const pollTimerRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const items = await getHistory();
      setHistory(items);
    } catch (e) {
      // ignore
    }
  };

  // Inspect video URL
  const handleInspect = async () => {
    if (!url.trim()) return;
    setErrorMessage('');
    setInspectLoading(true);
    setMediaInfo(null);

    try {
      const data = await extractMedia(url.trim());
      setMediaInfo(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to inspect URL.');
    } finally {
      setInspectLoading(false);
    }
  };

  // Start download job
  const handleDownload = async (payload) => {
    setErrorMessage('');
    try {
      const res = await startDownload(payload);
      if (res.job_id) {
        startPollingJob(res.job_id);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate download.');
    }
  };

  // Poll job status every second
  const startPollingJob = (jobId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);
        setActiveJob(job);

        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(pollTimerRef.current);
          fetchHistory();
        }
      } catch (err) {
        clearInterval(pollTimerRef.current);
      }
    }, 1000);
  };

  // Delete history item
  const handleDeleteHistory = async (jobId) => {
    try {
      await deleteHistoryItem(jobId);
      if (activeJob && activeJob.id === jobId) {
        setActiveJob(null);
      }
      fetchHistory();
    } catch (err) {
      // ignore
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 80px 20px' }}>
      <Header />

      <UrlInput
        url={url}
        setUrl={setUrl}
        onInspect={handleInspect}
        loading={inspectLoading}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          padding: '16px 20px',
          borderRadius: '14px',
          marginBottom: '24px',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Download Progress */}
      {activeJob && (
        <DownloadProgress job={activeJob} />
      )}

      {/* Inspected Video Details */}
      {mediaInfo && (
        <>
          <MediaPreview info={mediaInfo} />
          <FormatSelector
            info={mediaInfo}
            onDownload={handleDownload}
            downloading={activeJob && activeJob.status === 'downloading'}
          />
        </>
      )}

      {/* Session Download History */}
      <DownloadHistory
        history={history}
        onDelete={handleDeleteHistory}
      />

      {/* Footer Info */}
      <footer style={{
        marginTop: '60px',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '0.82rem',
        lineHeight: '1.6',
        borderTop: '1px solid rgba(226, 232, 240, 0.1)',
        paddingTop: '24px'
      }}>
        <p>⚡ Powered by <b>yt-dlp</b>, <b>FFmpeg</b>, <b>FastAPI</b> & <b>React</b>.</p>
        <p style={{ marginTop: '4px' }}>
          Please only download media you own or have explicit authorization to download. Respect copyright and platform terms.
        </p>
      </footer>
    </div>
  );
}
