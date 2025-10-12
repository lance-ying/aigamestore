import os
import logging
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

    def evaluate_video(self, video_path: str, prompt: str) -> Optional[str]:
        if not os.path.exists(video_path):
            logging.error(f"Video not found: {video_path}")
            return None
        video_file = self.client.files.upload(file=video_path)
        # Polling omitted; assume active or short videos
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_uri(file_uri=video_file.uri, mime_type=video_file.mime_type), types.Part.from_text(text=prompt)],
            )
        ]
        cfg = types.GenerateContentConfig(response_mime_type="text/plain")
        resp = self.client.models.generate_content(model=self.model_name, contents=contents, config=cfg)
        return getattr(resp, "text", None)


