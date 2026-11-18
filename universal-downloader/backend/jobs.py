import os
import threading
import time
import uuid
from typing import Any, Dict, List, Optional

class JobManager:
    """Thread-safe in-memory job tracker for video download tasks."""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_job(
        self,
        url: str,
        title: str,
        ext: str,
        quality_tag: str,
        is_audio: bool = False,
        thumbnail: Optional[str] = None
    ) -> str:
        job_id = str(uuid.uuid4())
        job_data = {
            "id": job_id,
            "url": url,
            "title": title,
            "ext": ext,
            "quality_tag": quality_tag,
            "is_audio": is_audio,
            "thumbnail": thumbnail,
            "status": "pending",  # pending, downloading, processing, completed, failed, cancelled
            "progress": 0.0,
            "downloaded_bytes": 0,
            "total_bytes": 0,
            "speed": "0 KB/s",
            "eta": 0,
            "eta_formatted": "--:--",
            "filename": "",
            "file_path": "",
            "filesize": 0,
            "filesize_formatted": "0 MB",
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time(),
        }
        with self._lock:
            self._jobs[job_id] = job_data
        return job_id

    def update_job(self, job_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        with self._lock:
            if job_id not in self._jobs:
                return None
            self._jobs[job_id].update(kwargs)
            self._jobs[job_id]["updated_at"] = time.time()
            return dict(self._jobs[job_id])

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if job_id not in self._jobs:
                return None
            return dict(self._jobs[job_id])

    def list_jobs(self) -> List[Dict[str, Any]]:
        with self._lock:
            # Sort newest first
            return sorted(
                [dict(j) for j in self._jobs.values()],
                key=lambda x: x["created_at"],
                reverse=True
            )

    def delete_job(self, job_id: str) -> bool:
        with self._lock:
            job = self._jobs.pop(job_id, None)
        if job and job.get("file_path") and os.path.exists(job["file_path"]):
            try:
                os.remove(job["file_path"])
            except Exception:
                pass
        return job is not None

# Global instance
job_manager = JobManager()
