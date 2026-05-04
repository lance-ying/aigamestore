import os
from typing import Any, Dict, Optional, Tuple

try:
    from openai import OpenAI
except Exception:
    OpenAI = None  # type: ignore

try:
    import anthropic  # type: ignore
except Exception:
    anthropic = None  # type: ignore

try:
    import google.generativeai as genai  # type: ignore
except Exception:
    genai = None  # type: ignore


class ModelClient:
    CLAUDE_ALIASES: Dict[str, str] = {
        "claude-3.7-sonnet": "claude-3-7-sonnet-20250219",
        "claude-4-sonnet": "claude-sonnet-4-20250514",
        "claude-4.5-sonnet": "claude-sonnet-4-5-20250929",
    }

    def __init__(self, model_name: str) -> None:
        self.provider, self.model = self._parse_model_name(model_name)
        self.client = self._build_client()

    def _parse_model_name(self, model_name: str) -> Tuple[str, str]:
        if ":" not in model_name:
            return "openai", model_name
        provider, model = model_name.split(":", 1)
        provider = provider.lower().strip()
        model = model.strip()
        if provider == "anthropic" and model in self.CLAUDE_ALIASES:
            model = self.CLAUDE_ALIASES[model]
        return provider, model

    def _build_client(self) -> Any:
        if self.provider == "openai":
            if OpenAI is None:
                raise ImportError("openai package is required for OpenAI models")
            if not os.getenv("OPENAI_API_KEY"):
                raise RuntimeError("OPENAI_API_KEY is not set. Put it in barebones/.env or export it in your shell.")
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if self.provider == "anthropic":
            if anthropic is None:
                raise ImportError("anthropic package is required for Anthropic models")
            if not os.getenv("ANTHROPIC_API_KEY"):
                raise RuntimeError("ANTHROPIC_API_KEY is not set. Put it in barebones/.env or export it in your shell.")
            return anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                timeout=1800.0,
            )
        if self.provider == "google":
            if genai is None:
                raise ImportError("google-generativeai package is required for Google models")
            if not os.getenv("GOOGLE_API_KEY"):
                raise RuntimeError("GOOGLE_API_KEY is not set. Put it in barebones/.env or export it in your shell.")
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            return genai
        raise ValueError(f"Unsupported model provider: {self.provider}")

    def call(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        max_tokens: int = 24000,
    ) -> str:
        if self.provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_completion_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""

        if self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            parts = []
            for block in getattr(response, "content", []):
                text = getattr(block, "text", None)
                if text:
                    parts.append(text)
            return "".join(parts)

        if self.provider == "google":
            composed = system_prompt.strip() + "\n\n" + user_prompt.strip()
            model = self.client.GenerativeModel(self.model)
            response = model.generate_content(
                composed,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                },
            )
            return getattr(response, "text", "") or ""

        raise ValueError(f"Unsupported model provider: {self.provider}")
