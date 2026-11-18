const API_BASE = '/api';

export async function extractMedia(url) {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to extract video information.');
  }
  return data.data;
}

export async function startDownload(payload) {
  const res = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to start download job.');
  }
  return data;
}

export async function getJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch job status.');
  }
  return data.job;
}

export async function getHistory() {
  const res = await fetch(`${API_BASE}/history`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch history.');
  }
  return data.jobs || [];
}

export async function deleteHistoryItem(jobId) {
  const res = await fetch(`${API_BASE}/history/${jobId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to delete item.');
  }
  return data;
}

export function getFileDownloadUrl(jobId) {
  return `${API_BASE}/download/${jobId}/file`;
}
