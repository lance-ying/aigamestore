import os
import logging
import time
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

try:
    from google import genai  # type: ignore
    from google.genai import types  # type: ignore
except Exception:
    genai = None  # type: ignore
    types = None  # type: ignore


class GeminiEvaluator:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash-preview-04-17") -> None:
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY required for VLM evaluation")
        if genai is None or types is None:
            raise ImportError("google-genai is required. Install google-genai.")
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name

    def _ensure_mp4(self, path: str) -> str:
        # If already mp4, return as-is
        if path.lower().endswith(".mp4"):
            return path
        if shutil.which("ffmpeg") is None:
            raise RuntimeError("ffmpeg not found. Please install ffmpeg for video conversion.")
        src = Path(path)
        out_path = src.with_suffix(".mp4")
        # Try a fast remux first; fallback to lossless H.264
        try:
            proc = subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(src),
                    "-c:v",
                    "copy",
                    "-c:a",
                    "copy",
                    "-movflags",
                    "+faststart",
                    str(out_path),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )
        except Exception:
            proc2 = subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(src),
                    "-c:v",
                    "libx264",
                    "-preset",
                    "veryfast",
                    "-crf",
                    "0",
                    "-pix_fmt",
                    "yuv420p",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "192k",
                    "-movflags",
                    "+faststart",
                    str(out_path),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )
        return str(out_path)

    def _wait_until_active(self, file_name: str, timeout_s: int = 120, poll_interval_s: float = 1.5) -> Optional[Any]:
        start = time.time()
        file_obj = None
        while time.time() - start < timeout_s:
            try:
                file_obj = self.client.files.get(name=file_name)
                state = getattr(file_obj, "state", None) or getattr(file_obj, "metadata", {}).get("state")
                if state == "ACTIVE":
                    return file_obj
            except Exception:
                pass
            time.sleep(poll_interval_s)
        return file_obj

    def evaluate_video(self, video_path: str, prompt: str) -> Optional[str]:
        if not os.path.exists(video_path):
            logging.error(f"Video not found: {video_path}")
            return None
        # Ensure mp4 before upload
        try:
            video_path = self._ensure_mp4(video_path)
        except Exception as e:
            logging.error(f"Failed to convert video to mp4: {e}")
            return None

        video_file = self.client.files.upload(file=video_path)
        file_name = getattr(video_file, "name", None) or getattr(video_file, "id", None)
        active_file = None
        if file_name:
            active_file = self._wait_until_active(file_name)
        if not active_file:
            logging.error("Uploaded video is not ACTIVE; aborting VLM call")
            return None

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_uri(file_uri=active_file.uri, mime_type=active_file.mime_type),
                    types.Part.from_text(text=prompt),
                ],
            )
        ]
        cfg = types.GenerateContentConfig(response_mime_type="text/plain")
        resp = self.client.models.generate_content(model=self.model_name, contents=contents, config=cfg)
        return getattr(resp, "text", None)


