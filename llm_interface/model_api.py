import os
import datetime
from typing import Any, Dict, List, Optional, Union

from openai import OpenAI

try:
    import anthropic  # type: ignore
except Exception:
    anthropic = None  # type: ignore

try:
    import google.generativeai as genai  # type: ignore
except Exception:
    genai = None  # type: ignore


class ModelAPI:
    CLAUDE_MODELS: Dict[str, str] = {
        # "claude-3.5-sonnet": "claude-3-5-sonnet-20241022", # Deprecated
        "claude-3.7-sonnet": "claude-3-7-sonnet-20250219",
        "claude-4-sonnet": "claude-sonnet-4-20250514",
        "claude-4.5-sonnet": "claude-sonnet-4-5-20250929",
    }

    def __init__(self, model_name: str = "openai:gpt-4o") -> None:
        self.model_provider, self.model = self._parse_model_name(model_name)
        self.client = self._initialize_client()
        self.call_history: List[Dict[str, Any]] = []

    def _parse_model_name(self, model_name: str) -> tuple[str, str]:
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            provider = provider.lower()
            if provider == "anthropic":
                if model in self.CLAUDE_MODELS:
                    model = self.CLAUDE_MODELS[model]
                elif not any(short in model for short in self.CLAUDE_MODELS.keys()):
                    model = self.CLAUDE_MODELS["claude-4-sonnet"]
            return provider, model
        return "openai", model_name

    def _initialize_client(self) -> Any:
        if self.model_provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if self.model_provider == "anthropic":
            if anthropic is None:
                raise ImportError("anthropic package is required for Claude models")
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        if self.model_provider == "google":
            if genai is None:
                raise ImportError("google-generativeai package is required for Gemini models")
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            return genai
        raise ValueError(f"Unsupported model provider: {self.model_provider}")

    def call(
        self,
        user_prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        thinking: bool = False,
        thinking_budget: Optional[int] = 5000,
        verbose: bool = False,
        max_retries: int = 3,
        image: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Union[str, Dict[str, Any]]:
        messages: List[Dict[str, str]] = []

        MAX_ALLOWED_TOKENS = 40000
        model_max_tokens = {
            "openai": {"o3-mini": 100000, "o4-mini": 100000},
            "anthropic": {
                "claude-3-5-sonnet-20241022": 8192,
                "claude-3-7-sonnet-20250219": 128000,
                "claude-sonnet-4-20250514": 128000,
            },
            "google": {
                "gemini-2.0-flash": 8192,
                "gemini-2.5-flash-preview-04-17": 65536,
                "gemini-2.5-pro-exp-03-25": 65536,
                "gemini-2.5-pro-preview-05-06": 65536,
            },
        }

        if max_tokens is None:
            max_tokens = 40000
        max_tokens = min(MAX_ALLOWED_TOKENS, max_tokens)

        if thinking and thinking_budget:
            max_tokens = max(1, max_tokens - thinking_budget)

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if chat_history:
            messages.extend(chat_history)
        messages.append({"role": "user", "content": user_prompt})

        try:
            prompt_tokens = None
            completion_tokens = None
            total_tokens = None

            if self.model_provider == "anthropic":
                if anthropic is None:
                    raise RuntimeError("Anthropic client unavailable")

                claude_messages: List[Dict[str, str]] = []
                if chat_history:
                    for msg in chat_history:
                        if msg["role"] in ("user", "assistant"):
                            claude_messages.append({"role": msg["role"], "content": msg["content"]})
                claude_messages.append({"role": "user", "content": user_prompt})

                claude_params: Dict[str, Any] = {
                    "model": self.model,
                    "messages": claude_messages,
                    "max_tokens": max_tokens,
                    **kwargs,
                }
                if temperature is not None and not thinking:
                    claude_params["temperature"] = temperature
                if top_p is not None and not thinking:
                    claude_params["top_p"] = top_p
                if system_prompt:
                    claude_params["system"] = system_prompt
                if thinking and thinking_budget:
                    claude_params["thinking"] = {"type": "enabled", "budget_tokens": thinking_budget}

                result_text = ""
                thinking_content = ""
                retry = 0
                while retry < max_retries:
                    try:
                        with self.client.messages.stream(**claude_params) as stream:  # type: ignore[attr-defined]
                            for event in stream:
                                et = getattr(event, "type", None)
                                if et == "content_block_delta":
                                    delta = getattr(event, "delta", None)
                                    if hasattr(delta, "type") and getattr(delta, "type") == "text_delta":
                                        piece = getattr(delta, "text", "")
                                        if verbose and piece:
                                            print(piece, end="", flush=True)
                                        result_text += piece
                                    elif hasattr(delta, "type") and getattr(delta, "type") == "thinking_delta":
                                        tpiece = getattr(delta, "thinking", "")
                                        thinking_content += tpiece
                            # Attempt to read token usage from final message if available
                            try:
                                final_msg = stream.get_final_message()  # type: ignore[attr-defined]
                                usage = getattr(final_msg, "usage", None)
                                if usage is not None:
                                    in_tok = getattr(usage, "input_tokens", None)
                                    out_tok = getattr(usage, "output_tokens", None)
                                    if isinstance(in_tok, int):
                                        prompt_tokens = in_tok
                                    if isinstance(out_tok, int):
                                        completion_tokens = out_tok
                                    if isinstance(prompt_tokens, int) and isinstance(completion_tokens, int):
                                        total_tokens = prompt_tokens + completion_tokens
                            except Exception:
                                pass
                        if verbose:
                            print()
                        break
                    except Exception:
                        retry += 1
                        if retry >= max_retries:
                            response = self.client.messages.create(**claude_params)  # type: ignore[attr-defined]
                            if thinking and hasattr(response, "content"):
                                for block in response.content:  # type: ignore[attr-defined]
                                    if getattr(block, "type", "") == "text":
                                        result_text = getattr(block, "text", "")
                            else:
                                result_text = response.content[0].text  # type: ignore[index]
                            # Capture usage for non-streaming response if present
                            try:
                                usage = getattr(response, "usage", None)
                                if usage is not None:
                                    in_tok = getattr(usage, "input_tokens", None)
                                    out_tok = getattr(usage, "output_tokens", None)
                                    if isinstance(in_tok, int):
                                        prompt_tokens = in_tok
                                    if isinstance(out_tok, int):
                                        completion_tokens = out_tok
                                    if isinstance(prompt_tokens, int) and isinstance(completion_tokens, int):
                                        total_tokens = prompt_tokens + completion_tokens
                            except Exception:
                                pass

                self._record_call(system_prompt, user_prompt, result_text, prompt_tokens, completion_tokens, total_tokens)
                if thinking:
                    return {"thinking": thinking_content, "response": result_text, "model": f"{self.model_provider}:{self.model}"}
                return result_text

            if self.model_provider == "openai":
                if thinking and thinking_budget and self.model in ("o4-mini", "o3-mini"):
                    input_messages = [m for m in messages if m["role"] != "system"]
                    response = self.client.responses.create(  # type: ignore[attr-defined]
                        model=self.model,
                        reasoning={"effort": "medium"},
                        input=input_messages,
                        max_output_tokens=max_tokens,
                    )
                    result_text = getattr(response, "output_text", "")
                    # Capture token usage if provided by the Responses API
                    try:
                        usage = getattr(response, "usage", None)
                        if usage is not None:
                            pt = getattr(usage, "prompt_tokens", None)
                            ct = getattr(usage, "completion_tokens", None)
                            tt = getattr(usage, "total_tokens", None)
                            if not isinstance(pt, int):
                                pt = getattr(usage, "input_tokens", None)
                            if not isinstance(ct, int):
                                ct = getattr(usage, "output_tokens", None)
                            if not isinstance(tt, int) and isinstance(pt, int) and isinstance(ct, int):
                                tt = pt + ct
                            if isinstance(pt, int):
                                prompt_tokens = pt
                            if isinstance(ct, int):
                                completion_tokens = ct
                            if isinstance(tt, int):
                                total_tokens = tt
                    except Exception:
                        pass
                    self._record_call(system_prompt, user_prompt, result_text, prompt_tokens, completion_tokens, total_tokens)
                    return {"thinking": getattr(response, "reasoning", ""), "response": result_text, "model": f"{self.model_provider}:{self.model}"}

                try:
                    stream = self.client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        max_completion_tokens=max_tokens,
                        stream=True,
                        stream_options={"include_usage": True},  # type: ignore[arg-type]
                        **kwargs,
                    )  # type: ignore[attr-defined]
                    result_text = ""
                    for event in stream:  # type: ignore[assignment]
                        delta = getattr(event.choices[0], "delta", None)  # type: ignore[index]
                        if delta and getattr(delta, "content", None):
                            piece = delta.content  # type: ignore[attr-defined]
                            if verbose and piece:
                                print(piece, end="", flush=True)
                            result_text += piece
                        # Try to capture usage at the end of the stream
                        try:
                            usage = getattr(event, "usage", None)
                            if usage is not None:
                                pt = getattr(usage, "prompt_tokens", None)
                                ct = getattr(usage, "completion_tokens", None)
                                tt = getattr(usage, "total_tokens", None)
                                if isinstance(pt, int):
                                    prompt_tokens = pt
                                if isinstance(ct, int):
                                    completion_tokens = ct
                                if isinstance(tt, int):
                                    total_tokens = tt
                        except Exception:
                            pass
                    if verbose:
                        print()
                except Exception:
                    response = self.client.chat.completions.create(  # type: ignore[attr-defined]
                        model=self.model,
                        messages=messages,
                        max_completion_tokens=max_tokens,
                        **kwargs,
                    )
                    result_text = response.choices[0].message.content  # type: ignore[index]
                    # Capture usage for non-streaming response
                    try:
                        usage = getattr(response, "usage", None)
                        if usage is not None:
                            pt = getattr(usage, "prompt_tokens", None)
                            ct = getattr(usage, "completion_tokens", None)
                            tt = getattr(usage, "total_tokens", None)
                            if isinstance(pt, int):
                                prompt_tokens = pt
                            if isinstance(ct, int):
                                completion_tokens = ct
                            if isinstance(tt, int):
                                total_tokens = tt
                    except Exception:
                        pass

                self._record_call(system_prompt, user_prompt, result_text, prompt_tokens, completion_tokens, total_tokens)
                return {"thinking": "", "response": result_text, "model": f"{self.model_provider}:{self.model}"} if thinking else result_text

            if self.model_provider == "google":
                model = self.client.GenerativeModel(model_name=self.model)  # type: ignore[attr-defined]
                prompt = self._format_messages_for_gemini(messages)
                try:
                    result_text = ""
                    for chunk in model.generate_content(
                        prompt,
                        generation_config={"max_output_tokens": max_tokens, "temperature": temperature, **kwargs},
                        stream=True,
                    ):
                        if hasattr(chunk, "text") and chunk.text:
                            piece = chunk.text
                            if verbose and piece:
                                print(piece, end="", flush=True)
                            result_text += piece
                        # Attempt to capture usage metadata if present on chunks
                        try:
                            usage_md = getattr(chunk, "usage_metadata", None)
                            if usage_md is not None:
                                pt = getattr(usage_md, "prompt_token_count", None)
                                ct = getattr(usage_md, "candidates_token_count", None)
                                tt = getattr(usage_md, "total_token_count", None)
                                if isinstance(pt, int):
                                    prompt_tokens = pt
                                if isinstance(ct, int):
                                    completion_tokens = ct
                                if isinstance(tt, int):
                                    total_tokens = tt
                        except Exception:
                            pass
                    if verbose:
                        print()
                except Exception:
                    response = model.generate_content(
                        prompt,
                        generation_config={"max_output_tokens": max_tokens, "temperature": temperature, **kwargs},
                    )
                    result_text = response.text  # type: ignore[attr-defined]
                    # Capture usage metadata for non-streaming response
                    try:
                        usage_md = getattr(response, "usage_metadata", None)
                        if usage_md is not None:
                            pt = getattr(usage_md, "prompt_token_count", None)
                            ct = getattr(usage_md, "candidates_token_count", None)
                            tt = getattr(usage_md, "total_token_count", None)
                            if isinstance(pt, int):
                                prompt_tokens = pt
                            if isinstance(ct, int):
                                completion_tokens = ct
                            if isinstance(tt, int):
                                total_tokens = tt
                    except Exception:
                        pass
                self._record_call(system_prompt, user_prompt, result_text, prompt_tokens, completion_tokens, total_tokens)
                return {"thinking": "", "response": result_text, "model": f"{self.model_provider}:{self.model}"} if thinking else result_text

            raise RuntimeError("Unsupported provider path")

        except Exception as e:
            raise RuntimeError(f"Error calling {self.model_provider} API: {e}")

    def _format_messages_for_gemini(self, messages: List[Dict[str, str]]) -> str:
        formatted: List[str] = []
        for msg in messages:
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            if role == "SYSTEM":
                formatted.append(f"Instructions: {content}")
            else:
                formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    def _record_call(self, system_prompt: Optional[str], user_prompt: str, response: str,
                     prompt_tokens: Optional[int] = None,
                     completion_tokens: Optional[int] = None,
                     total_tokens: Optional[int] = None) -> None:
        self.call_history.append(
            {
                "system_prompt": system_prompt.strip() if system_prompt else None,
                "user_prompt": user_prompt.strip(),
                "response": response.strip(),
                "model": f"{self.model_provider}:{self.model}",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "token_usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                },
            }
        )

    def get_call_history(self) -> List[Dict[str, Any]]:
        return self.call_history


