import os
import sys
from typing import Dict, Any, Optional, List, Union
from openai import OpenAI
import json
import datetime
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from game_generators.prompts import GREEN, YELLOW, RED, BLUE, RESET

# Import additional clients based on model type
try:
    import anthropic

    print(f"Anthropic version: {anthropic.__version__}")

    try:
        from anthropic.types.message_create_params import (
            MessageCreateParamsNonStreaming,
        )

        print("Successfully imported MessageCreateParamsNonStreaming")
    except ImportError as e:
        print(f"Error importing MessageCreateParamsNonStreaming: {e}")

    try:
        from anthropic.types.messages.batch_create_params import Request

        print("Successfully imported Request")
    except ImportError as e:
        print(f"Error importing Request: {e}")

except ImportError as e:
    print(f"Error importing anthropic: {e}")
    anthropic = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None


from dotenv import load_dotenv

load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
os.environ["ANTHROPIC_API_KEY"] = os.getenv("ANTHROPIC_API_KEY")
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")


class ModelAPI:
    """Centralized handler for different model API calls"""

    CLAUDE_MODELS = {
        "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
        "claude-3.7-sonnet": "claude-3-7-sonnet-20250219",
    }

    def __init__(self, model_name: str = "openai:gpt-3.5-turbo"):
        """
        Initialize the API handler

        Args:
            model_name: String in format "provider:model"
                      (e.g., "openai:gpt-3.5-turbo", "anthropic:claude-3-haiku", "google:gemini-1.5-pro")
        """
        self.model_provider, self.model = self._parse_model_name(model_name)
        self.client = self._initialize_client()
        # Add call history list
        self.call_history = []

    def _parse_model_name(self, model_name: str) -> tuple[str, str]:
        """Parse the model name string to extract provider and model name"""
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            provider = provider.lower()

            # Handle Claude model names
            if provider == "anthropic":
                # Convert shorthand names to full model names
                if model in [
                    "claude-3.5-sonnet",
                    "claude-3.5-haiku",
                    "claude-3.7-sonnet",
                ]:
                    model = self.CLAUDE_MODELS[model]
                elif not any(
                    full_name in model for full_name in self.CLAUDE_MODELS.values()
                ):
                    # Default to sonnet if not specified correctly
                    model = self.CLAUDE_MODELS["claude-3-5-sonnet"]

            return provider, model
        return "openai", model_name

    def _initialize_client(self) -> Any:
        """Initialize the appropriate client based on the model provider"""
        if self.model_provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        elif self.model_provider == "anthropic":
            if anthropic is None:
                raise ImportError(
                    "The 'anthropic' package is required to use Claude models. "
                    "Install it with 'pip install anthropic'."
                )
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        elif self.model_provider == "google":
            if genai is None:
                raise ImportError(
                    "The 'google-generativeai' package is required to use Gemini models. "
                    "Install it with 'pip install google-generativeai'."
                )
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            return genai

        raise ValueError(
            f"Unsupported model provider: {self.model_provider}. "
            "Supported providers are 'openai', 'claude', and 'google'."
        )

    def call(
        self,
        user_prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        verbose: bool = False,
        max_retries: int = 3,
        image: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> str:
        """
        Make an API call to the selected model

        Args:
            user_prompt: The main user prompt/question
            system_prompt: Optional system prompt to set context/behavior
            chat_history: Optional list of previous messages in the conversation
            max_tokens: Optional maximum number of tokens in response
            temperature: Optional temperature parameter for response randomness
            verbose: Whether to print verbose information
            **kwargs: Additional model-specific parameters

        Returns:
            str: The model's response text
        """
        # Construct messages list
        messages = []
        MAX_ALLOWED_TOKENS = 40000

        model_max_tokens = {
            "openai": {
                "o3-mini": 100000,
                "o4-mini": 100000,  # Technically exceeds MAX_ALLOWED_TOKENS
            },
            "anthropic": {
                "claude-3.5-sonnet": 8192,
                "claude-3-7-sonnet-20250219": 128000,
            },
            "google": {
                "gemini-2.0-flash": 8192,
                "gemini-2.5-flash-preview-04-17": 65536,
                "gemini-2.5-pro-exp-03-25": 65536,
                "gemini-2.5-pro-preview-05-06": 65536,
            },
        }

        if max_tokens is None:
            max_tokens = model_max_tokens[self.model_provider][self.model]

        max_tokens = min(MAX_ALLOWED_TOKENS, max_tokens)

        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history)

        # Add the current user prompt
        messages.append({"role": "user", "content": user_prompt})

        if verbose:
            print(f"\n{BLUE}verbose: API Call{RESET}")
            if system_prompt:
                print(f"{BLUE}System Prompt:{RESET}\n{system_prompt}")
            if chat_history:
                print(f"{BLUE}Chat History:{RESET}")
                for msg in chat_history:
                    if msg["role"] == "user":
                        print(
                            f"{GREEN}{msg['role'].title()}: {msg['content'][:100]}...{RESET}"
                        )
                    else:
                        print(
                            f"{YELLOW}{msg['role'].title()}: {msg['content'][:100]}...{RESET}"
                        )
            print(f"{GREEN}User Prompt:{RESET}\n{user_prompt}")

        try:
            if self.model_provider == "anthropic":
                claude_messages = []

                # Add chat history if provided
                if chat_history:
                    for msg in chat_history:
                        role = msg["role"]
                        if role not in ["user", "assistant"]:
                            continue
                        claude_messages.append(
                            {"role": role, "content": msg["content"]}
                        )

                # Add the current user prompt
                claude_messages.append({"role": "user", "content": user_prompt})

                claude_params = {
                    "model": self.model,
                    "messages": claude_messages,
                    "max_tokens": max_tokens,
                    **kwargs,
                }

                # Only add temperature if it's provided and valid
                if temperature is not None:
                    claude_params["temperature"] = temperature

                if top_p is not None:
                    claude_params["top_p"] = top_p

                # Add system prompt if provided
                if system_prompt:
                    claude_params["system"] = system_prompt

                if verbose:
                    print(f"\n{BLUE}---> Using streaming for Anthropic API call{RESET}")

                # Use streaming with retries
                result = ""
                retry_count = 0

                while retry_count < max_retries:
                    try:
                        with self.client.messages.stream(**claude_params) as stream:
                            for message in stream:
                                if message.type == "content_block_delta":
                                    text = message.delta.text
                                    result += text
                                    if verbose:
                                        print(text, end="", flush=True)
                                elif message.type == "message_delta":
                                    continue
                                elif message.type == "error":
                                    raise RuntimeError(f"Stream error: {message.error}")
                        # If we get here, the streaming was successful
                        break
                    except Exception as e:
                        retry_count += 1
                        if verbose:
                            print(
                                f"\n{RED}Streaming attempt {retry_count} failed: {str(e)}{RESET}"
                            )
                        if retry_count >= max_retries:
                            if verbose:
                                print(
                                    f"\n{RED}All streaming attempts failed, falling back to non-streaming API call{RESET}"
                                )
                            # Fallback to non-streaming API call
                            response = self.client.messages.create(**claude_params)
                            result = response.content[0].text

                if verbose:
                    print(f"\n{BLUE}API call complete{RESET}")

                # Record the call with cleaner formatting
                call_record = {
                    "system_prompt": system_prompt.strip() if system_prompt else None,
                    "user_prompt": user_prompt.strip(),
                    "response": result.strip(),
                    "model": f"{self.model_provider}:{self.model}",
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
                self.call_history.append(call_record)

                return result

            elif self.model_provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_completion_tokens=max_tokens,
                    **kwargs,
                )
                result = response.choices[0].message.content

            elif self.model_provider == "google":
                model = self.client.GenerativeModel(model_name=self.model)

                if image:  # Handle video/image content
                    response = model.generate_content(
                        [
                            {"text": user_prompt},
                            {
                                "inline_data": {
                                    "mime_type": image["mime_type"],
                                    "data": image["data"],
                                }
                            },
                        ],
                        generation_config={
                            "max_output_tokens": max_tokens,
                            "temperature": temperature,
                            **kwargs,
                        },
                    )
                else:
                    # Regular text-only content
                    prompt = self._format_messages_for_gemini(messages)
                    response = model.generate_content(
                        prompt,
                        generation_config={
                            "max_output_tokens": max_tokens,
                            "temperature": temperature,
                            **kwargs,
                        },
                    )

                result = response.text

            # Record the call with cleaner formatting
            call_record = {
                "system_prompt": system_prompt.strip() if system_prompt else None,
                "user_prompt": user_prompt.strip(),
                "response": result.strip(),
                "model": f"{self.model_provider}:{self.model}",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            self.call_history.append(call_record)

            if verbose:
                print(f"{YELLOW}Model Response:\n{result}{RESET}")
                print(
                    f"{BLUE}Call recorded (Total calls: {len(self.call_history)}){RESET}"
                )

            return result

        except Exception as e:
            error_msg = f"Error calling {self.model_provider} API: {str(e)}"
            if verbose:
                print(f"{RED}{error_msg}{RESET}")
                import traceback

                traceback.print_exc()
            raise RuntimeError(error_msg)

    def _format_messages_for_gemini(self, messages: List[Dict[str, str]]) -> str:
        """Convert chat messages to Gemini's expected format"""
        formatted = []
        for msg in messages:
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            if role == "SYSTEM":
                formatted.append(f"Instructions: {content}")
            else:
                formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    def get_call_history(self) -> List[Dict[str, Any]]:
        """Return the list of all API calls made"""
        return self.call_history

    def batch_call(
        self,
        requests: List[Dict[str, Any]],
        max_tokens: Optional[int] = 40000,
        temperature: Optional[float] = None,
        verbose: bool = False,
    ) -> Dict[str, Any]:
        """
        Make a batch API call to Claude for processing multiple requests asynchronously.
        """
        if self.model_provider != "anthropic":
            raise ValueError("Batch processing is only supported for Claude models")

        # Prepare batch requests using the correct types
        batch_requests = []
        for req in requests:
            # Create messages list
            messages = []

            # Add chat history if provided
            if "chat_history" in req and req["chat_history"]:
                for msg in req["chat_history"]:
                    if msg["role"] not in ["user", "assistant"]:
                        continue
                    messages.append({"role": msg["role"], "content": msg["content"]})

            # Add the user prompt
            messages.append({"role": "user", "content": req["user_prompt"]})

            # Create system messages if provided
            system_messages = None
            if "system_prompt" in req and req["system_prompt"]:
                system_messages = [
                    {
                        "type": "text",
                        "text": req["system_prompt"],
                        "cache_control": {"type": "ephemeral"},
                    }
                ]

            # Create params with proper typing
            params = MessageCreateParamsNonStreaming(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                system=system_messages,
            )

            # Create the properly typed Request object
            batch_requests.append(Request(custom_id=req["custom_id"], params=params))

        try:
            # Create the batch with proper typing
            if verbose:
                print(f"\n{BLUE}Creating batch...{RESET}")
                print(f"{RESET}Batch requests: {batch_requests}{RESET}")

            batch = self.client.messages.batches.create(requests=batch_requests)

            if verbose:
                print(f"\n{BLUE}Batch created with ID: {batch.id}{RESET}")
                print(f"{BLUE}Processing status: {batch.processing_status}{RESET}")
                print(f"{BLUE}Request counts: {batch.request_counts}{RESET}")

            return {
                "batch_id": batch.id,
                "processing_status": batch.processing_status,
                "request_counts": batch.request_counts,
                "created_at": batch.created_at,
                "expires_at": batch.expires_at,
                "results_url": batch.results_url,
            }

        except Exception as e:
            error_msg = f"Error creating batch: {str(e)}"
            if verbose:
                print(f"{RED}{error_msg}{RESET}")
            raise RuntimeError(error_msg)

    def get_batch_status(self, batch_id: str, verbose: bool = False) -> Dict[str, Any]:
        """
        Get the status of a batch request.

        Args:
            batch_id: The ID of the batch to check
            verbose: Whether to print verbose information

        Returns:
            Dict containing batch status information
        """
        if self.model_provider != "anthropic":
            raise ValueError("Batch processing is only supported for Claude models")

        try:
            batch = self.client.messages.batches.retrieve(batch_id)

            if verbose:
                print(
                    f"\n{BLUE}Batch {batch_id} status: {batch.processing_status}{RESET}"
                )
                print(f"{BLUE}Request counts: {batch.request_counts}{RESET}")
                if batch.request_counts.errored > 0:
                    print(
                        f"{RED}Warning: {batch.request_counts.errored} requests have errored{RESET}"
                    )
                if batch.request_counts.expired > 0:
                    print(
                        f"{YELLOW}Warning: {batch.request_counts.expired} requests have expired{RESET}"
                    )

            return {
                "processing_status": batch.processing_status,
                "request_counts": batch.request_counts,
                "results_url": batch.results_url,
                "ended_at": batch.ended_at,
                "is_complete": batch.processing_status == "ended"
                or (
                    batch.request_counts.processing == 0
                    and (
                        batch.request_counts.succeeded > 0
                        or batch.request_counts.errored > 0
                        or batch.request_counts.expired > 0
                    )
                ),
            }

        except Exception as e:
            error_msg = f"Error retrieving batch status: {str(e)}"
            if verbose:
                print(f"{RED}{error_msg}{RESET}")
            raise RuntimeError(error_msg)

    # def get_batch_results(
    #     self, batch_id: str, verbose: bool = False
    # ) -> List[Dict[str, Any]]:
    #     """
    #     Get the results of a completed batch request using the official Anthropic client.
    #     """
    #     if self.model_provider != "anthropic":
    #         raise ValueError("Batch processing is only supported for Claude models")

    #     try:
    #         results = []
    #         if verbose:
    #             print(f"\n{BLUE}Retrieving batch results...{RESET}")

    #         # Stream results directly using the client's built-in method
    #         for result in self.client.messages.batches.results(batch_id):
    #             match result.result.type:
    #                 case "succeeded":
    #                     if verbose:
    #                         print(f"\n{GREEN}Success! {result.custom_id}{RESET}")
    #                     results.append(
    #                         {
    #                             "custom_id": result.custom_id,
    #                             "status": "succeeded",
    #                             "content": (
    #                                 result.result.message.content[0].text
    #                                 if result.result.message.content
    #                                 else ""
    #                             ),
    #                         }
    #                     )
    #                 case "errored":
    #                     if result.result.error.type == "invalid_request":
    #                         if verbose:
    #                             print(
    #                                 f"\n{RED}Validation error for {result.custom_id}: {result.result.error}{RESET}"
    #                             )
    #                     else:
    #                         if verbose:
    #                             print(
    #                                 f"\n{RED}Server error for {result.custom_id}: {result.result.error}{RESET}"
    #                             )
    #                     results.append(
    #                         {
    #                             "custom_id": result.custom_id,
    #                             "status": "errored",
    #                             "error": result.result.error,
    #                         }
    #                     )
    #                 case "expired":
    #                     if verbose:
    #                         print(
    #                             f"\n{YELLOW}Request expired {result.custom_id}{RESET}"
    #                         )
    #                     results.append(
    #                         {
    #                             "custom_id": result.custom_id,
    #                             "status": "expired",
    #                         }
    #                     )

    #         return results

    #     except Exception as e:
    #         error_msg = f"Error retrieving batch results: {str(e)}"
    #         if verbose:
    #             print(f"\n{RED}{error_msg}{RESET}")
    #         raise RuntimeError(error_msg)


if __name__ == "__main__":
    """Test different model providers"""

    def run_test(model_name: str):
        """Helper function to run a test for a specific model"""
        print(f"\n{BLUE}Testing {model_name}{RESET}")
        print("-" * 50)

        try:
            api = ModelAPI(model_name)

            # # Test 1: Simple prompt
            # print(f"\n{GREEN}Test 1: Simple prompt{RESET}")
            # response = api.call(
            #     user_prompt="What is 2+2? Answer in one word.",
            #     temperature=(
            #         0.7 if "claude" in model_name else None
            #     ),  # Claude needs explicit temperature
            #     verbose=True,
            # )
            # print(f"Test 1 Result: {response}")

            # # Test 2: With system prompt
            # print(f"\n{GREEN}Test 2: With system prompt{RESET}")
            # response = api.call(
            #     user_prompt="What is your role?",
            #     system_prompt="You are a friendly math tutor who loves numbers.",
            #     temperature=0.7 if "claude" in model_name else None,
            #     verbose=True,
            # )
            # print(f"Test 2 Result: {response}")

            # # Test 3: With chat history
            # print(f"\n{GREEN}Test 3: With chat history{RESET}")
            # response = api.call(
            #     user_prompt="What should I do next?",
            #     system_prompt="You are a helpful coding assistant.",
            #     chat_history=[
            #         {"role": "user", "content": "I want to learn programming."},
            #         {
            #             "role": "assistant",
            #             "content": "That's great! What languages interest you?",
            #         },
            #         {"role": "user", "content": "Python seems cool."},
            #     ],
            #     temperature=0.7 if "claude" in model_name else None,
            #     verbose=True,
            # )
            # print(f"Test 3 Result: {response}")

            # Test 4: Batch Processing
            if "claude" in model_name:
                print(f"\n{GREEN}Test: Batch Processing{RESET}")

                # Prepare batch requests
                batch_requests = [
                    {
                        "custom_id": "math_1",
                        "user_prompt": "What is 2+2? Answer in one word.",
                        "system_prompt": "You are a helpful tutor. Keep answers brief and precise in 20 words or less.",
                    },
                    {
                        "custom_id": "math_2",
                        "user_prompt": "What is 3+3? Answer in one word.",
                        "system_prompt": "You are a helpful tutor. Keep answers brief and precise in 20 words or less.",
                    },
                ]

                try:
                    # Create batch
                    batch_result = api.batch_call(
                        requests=batch_requests,
                        max_tokens=1024,
                        verbose=True,
                    )
                    print(f"Batch created successfully: {batch_result['batch_id']}")

                    # Poll for completion
                    max_wait_time = 300  # 5 minutes for testing
                    poll_interval = 5  # Check every 5 seconds
                    wait_time = 0

                    while wait_time < max_wait_time:
                        status = api.get_batch_status(
                            batch_result["batch_id"], verbose=True
                        )

                        # Check if processing has ended
                        if status["processing_status"] == "ended":
                            print(f"\n{GREEN}Batch processing completed!{RESET}")

                            # Wait a moment to ensure results_url is available
                            time.sleep(5)

                            # Get and print results
                            print(f"\n{GREEN}Retrieving results...{RESET}")
                            results = api.get_batch_results(
                                batch_result["batch_id"], verbose=True
                            )

                            for result in results:
                                print(
                                    f"\n{GREEN}Result for {result['custom_id']}:{RESET}"
                                )
                                print(f"Status: {result['status']}")
                                if result["status"] == "succeeded":
                                    print(f"Content: {result['content']}")
                                elif "error" in result:
                                    print(f"Error: {result['error']}")
                            break

                        # Check if any requests have succeeded
                        elif status["request_counts"].succeeded > 0:
                            print(
                                f"\n{GREEN}Some results are ready! Current counts:{RESET}"
                            )
                            print(f"Succeeded: {status['request_counts'].succeeded}")
                            print(f"Processing: {status['request_counts'].processing}")
                            print(f"Errored: {status['request_counts'].errored}")
                            print(f"Expired: {status['request_counts'].expired}")

                        print(f"Waiting for batch completion... ({wait_time}s)")
                        time.sleep(poll_interval)
                        wait_time += poll_interval

                    if wait_time >= max_wait_time:
                        print(
                            f"\n{YELLOW}Batch processing still in progress after {max_wait_time} seconds{RESET}"
                        )
                        print(
                            "You may need to retrieve results later using the batch ID:"
                        )
                        print(f"Batch ID: {batch_result['batch_id']}")

                except Exception as e:
                    print(f"\n{RED}Batch Processing test failed: {str(e)}{RESET}")

            print(f"\n{GREEN}All tests passed for {model_name}!{RESET}")

        except Exception as e:
            print(f"\n{RED}Error testing {model_name}: {str(e)}{RESET}")

    # Test OpenAI
    # run_test("openai:gpt-4o")  # Comment out since it doesn't support batch processing

    # Test Claude (if available)
    if anthropic:
        # Test with the correct model name
        run_test(
            "anthropic:claude-3.7-sonnet"
        )  # Using 3.7 since it supports batch processing
    else:
        print(
            f"\n{YELLOW}Skipping Claude tests - anthropic package not installed{RESET}"
        )

    # Test Gemini (if available)
    # if genai:
    #     run_test("google:gemini-2.0-flash")  # Comment out since it doesn't support batch processing
    # else:
    #     print(
    #         f"\n{YELLOW}Skipping Gemini tests - google-generativeai package not installed{RESET}"
    #     )
