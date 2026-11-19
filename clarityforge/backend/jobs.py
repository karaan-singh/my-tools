"""Thread-safe in-memory job tracking for long-running video enhancement tasks."""

from __future__ import annotations

import os
import threading
import time
import uuid
from typing import Any, Dict, List, Optional


class JobManager:
    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._procs: Dict[str, Any] = {}
        self._lock = threading.Lock()

    def create(self, **fields: Any) -> str:
        job_id = uuid.uuid4().hex[:12]
        now = time.time()
        with self._lock:
            self._jobs[job_id] = {
                "id": job_id,
                "status": "queued",       # queued | analyzing | processing | completed | failed | cancelled
                "stage": "Waiting to start",
                "progress": 0.0,
                "eta_seconds": None,
                "speed": None,
                "error": None,
                "created_at": now,
                "updated_at": now,
                **fields,
            }
        return job_id

    def update(self, job_id: str, **fields: Any) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is not None:
                job.update(fields)
                job["updated_at"] = time.time()

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None

    def public(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Job info without internal file paths."""
        job = self.get(job_id)
        if not job:
            return None
        return {k: v for k, v in job.items() if not k.endswith("_path")}

    def list(self) -> List[Dict[str, Any]]:
        with self._lock:
            ids = list(self._jobs)
        return [j for j in (self.public(i) for i in ids) if j]

    # Process handles (for cancellation)
    def set_process(self, job_id: str, proc: Any) -> None:
        with self._lock:
            self._procs[job_id] = proc

    def clear_process(self, job_id: str) -> None:
        with self._lock:
            self._procs.pop(job_id, None)

    def cancel(self, job_id: str) -> bool:
        with self._lock:
            job = self._jobs.get(job_id)
            proc = self._procs.get(job_id)
            if not job or job["status"] in ("completed", "failed", "cancelled"):
                return False
            job["cancel_requested"] = True
        if proc is not None:
            try:
                proc.kill()
            except Exception:
                pass
        return True

    def cleanup(self, max_age_seconds: int = 7200) -> None:
        """Delete finished jobs (and their files) older than max_age_seconds."""
        cutoff = time.time() - max_age_seconds
        with self._lock:
            stale = [
                jid for jid, j in self._jobs.items()
                if j["updated_at"] < cutoff and j["status"] not in ("queued", "analyzing", "processing")
            ]
            removed = [self._jobs.pop(jid) for jid in stale]
        for job in removed:
            for key, value in job.items():
                if key.endswith("_path") and value and os.path.exists(value):
                    try:
                        os.remove(value)
                    except OSError:
                        pass


job_manager = JobManager()
