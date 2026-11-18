import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import FormatSelector from './components/FormatSelector';
import DownloadProgress from './components/DownloadProgress';
import DownloadHistory from './components/DownloadHistory';
import WebsiteScannerResults from './components/WebsiteScannerResults';
import { extractMedia, scanWebsite, startDownload, getJobStatus, getHistory, deleteHistoryItem } from './services/api';

export default function App() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('inspect'); // 'inspect' or 'scan'
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(''); // 'inspect' or 'scan'

  const [mediaInfo, setMediaInfo] = useState(null);
  const [scanData, setScanData] = useState(null);
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

  // Inspect specific video URL
  const handleInspect = async (overrideUrl) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) return;

    setErrorMessage('');
    setLoading(true);
    setLoadingAction('inspect');
    setMediaInfo(null);

    try {
      const data = await extractMedia(targetUrl);
      setMediaInfo(data);
      // Scroll to media preview smoothly
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to inspect URL.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  // Scan entire website for all videos
  const handleScan = async () => {
    if (!url.trim()) return;

    setErrorMessage('');
    setLoading(true);
    setLoadingAction('scan');
    setScanData(null);
    setMediaInfo(null);

    try {
      const data = await scanWebsite(url.trim());
      setScanData(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to scan website for videos.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  // User clicked "Download" on one of the discovered videos from the scanner
  const handleSelectScannedVideo = (videoUrl) => {
    setUrl(videoUrl);
    setMode('inspect');
    handleInspect(videoUrl);
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
        onInspect={() => handleInspect()}
        onScan={handleScan}
        mode={mode}
        setMode={setMode}
        loading={loading}
        loadingAction={loadingAction}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '0.94rem',
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

      {/* Website Scanner Discovered Videos Grid */}
      {scanData && (
        <WebsiteScannerResults
          scanData={scanData}
          onSelectVideo={handleSelectScannedVideo}
        />
      )}

      {/* Inspected Video Details & Format Selector */}
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
        color: '#64748b',
        fontSize: '0.84rem',
        lineHeight: '1.6',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '24px'
      }}>
        <p>⚡ Powered by <b>yt-dlp</b>, <b>FFmpeg</b>, <b>FastAPI</b>, <b>BeautifulSoup</b> &amp; <b>React</b>.</p>
        <p style={{ marginTop: '4px' }}>
          Please only download media you own or have explicit authorization to download. Respect copyright and platform terms.
        </p>
      </footer>
    </div>
  );
}
