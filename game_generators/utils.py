import os
import sys
from typing import Dict, Any, Optional, List, Union
from openai import OpenAI
import json
import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from game_generators.prompts import GREEN, YELLOW, RED, BLUE, RESET

# Import additional clients based on model type
try:
    import anthropic
except ImportError:
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
        # Add conversation history
        self.conversation_history = []

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
        use_history: bool = True,
        max_tokens: Optional[int] = 40000,
        temperature: Optional[float] = None,
        verbose: bool = False,
        max_retries: int = 3,
        **kwargs,
    ) -> str:
        """
        Make an API call to the selected model

        Args:
            user_prompt: The main user prompt/question
            system_prompt: Optional system prompt to set context/behavior
            use_history: Whether to include conversation history in the call
            max_tokens: Optional maximum number of tokens in response
            temperature: Optional temperature parameter for response randomness
            verbose: Whether to print verbose information
            **kwargs: Additional model-specific parameters

        Returns:
            str: The model's response text
        """
        # Construct messages list
        messages = []

        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Add conversation history if enabled
        if use_history:
            messages.extend(self.conversation_history)

        # Add the current user prompt
        messages.append({"role": "user", "content": user_prompt})

        if verbose:
            print(f"\n{BLUE}verbose: API Call{RESET}")
            if system_prompt:
                print(f"{BLUE}System Prompt:{RESET}\n{system_prompt}")
            if use_history:
                print("======================================================")
                print(f"{BLUE}Conversation History:{RESET}\n")
                for msg in self.conversation_history:
                    if msg["role"] == "user":
                        print(
                            f"{GREEN}{msg['role'].title()}: {msg['content'][:300]} \n...{RESET}"
                        )
                    else:
                        print(
                            f"{YELLOW}{msg['role'].title()}: {msg['content'][:300]} \n...{RESET}"
                        )
                print("======================================================")
            print(f"{GREEN}User Prompt:{RESET}\n{user_prompt}")

        try:
            if self.model_provider == "anthropic":
                claude_messages = []

                if system_prompt:
                    claude_messages.append({"role": "system", "content": system_prompt})

                # Add conversation history if enabled
                if use_history:
                    for msg in self.conversation_history:
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

                # Store the conversation exchange
                self.conversation_history.append(
                    {"role": "user", "content": user_prompt}
                )
                self.conversation_history.append(
                    {"role": "assistant", "content": result}
                )

                return result

            elif self.model_provider == "openai":
                # Ensure messages are in the correct format for OpenAI
                openai_messages = []

                # Add system prompt if provided
                if system_prompt:
                    openai_messages.append({"role": "system", "content": system_prompt})

                # Add conversation history if enabled
                if use_history:
                    for msg in self.conversation_history:
                        role = msg["role"]
                        if role not in ["user", "assistant"]:
                            continue
                        openai_messages.append(
                            {"role": role, "content": msg["content"]}
                        )

                # Add current user prompt
                openai_messages.append({"role": "user", "content": user_prompt})

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=openai_messages,
                    max_completion_tokens=min(max_tokens, 16384),
                    **kwargs,
                )
                result = response.choices[0].message.content

            elif self.model_provider == "google":
                model = self.client.GenerativeModel(model_name=self.model)
                # Convert messages to Gemini format
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

            # Store the conversation exchange
            self.conversation_history.append({"role": "user", "content": user_prompt})
            self.conversation_history.append({"role": "assistant", "content": result})

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
            if role == "system":
                formatted.append(f"Instructions: {content}")
            else:
                formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    def get_call_history(self) -> List[Dict[str, Any]]:
        """Return the list of all API calls made"""
        return self.call_history

    def clear_conversation_history(self):
        """Clear the stored conversation history"""
        self.conversation_history = []

    def save_conversation_history(self, filename: str):
        """Save the conversation history to a file"""
        with open(filename, "w") as f:
            json.dump(self.conversation_history, f, indent=2)

    def save_call_history(self, filename: str):
        """Save the call history to a file"""
        with open(filename, "w") as f:
            json.dump(self.call_history, f, indent=2)

    def load_conversation_history(self, filename: str):
        """Load the conversation history from a file"""
        with open(filename, "r") as f:
            self.conversation_history = json.load(f)

    def load_call_history(self, filename: str):
        """Load the call history from a file"""
        with open(filename, "r") as f:
            self.call_history = json.load(f)


if __name__ == "__main__":
    """Test different model providers"""

    def run_test(model_name: str):
        """Helper function to run a test for a specific model"""
        print(f"\n{BLUE}Testing {model_name}{RESET}")
        print("-" * 50)

        try:
            api = ModelAPI(model_name)

            # Test 1: Simple prompt
            print(f"\n{GREEN}Test 1: Simple prompt{RESET}")
            response = api.call(
                user_prompt="What is 2+2? Answer in one word.",
                temperature=(
                    0.7 if "claude" in model_name else None
                ),  # Claude needs explicit temperature
                verbose=True,
            )
            print(f"Test 1 Result: {response}")

            # Test 2: With system prompt
            print(f"\n{GREEN}Test 2: With system prompt{RESET}")
            response = api.call(
                user_prompt="What is your role?",
                system_prompt="You are a friendly math tutor who loves numbers.",
                temperature=0.7 if "claude" in model_name else None,
                verbose=True,
            )
            print(f"Test 2 Result: {response}")

            # Test 3: With chat history
            print(f"\n{GREEN}Test 3: With chat history{RESET}")
            response = api.call(
                user_prompt="What should I do next?",
                system_prompt="You are a helpful coding assistant.",
                use_history=True,
                temperature=0.7 if "claude" in model_name else None,
                verbose=True,
            )
            print(f"Test 3 Result: {response}")

            api.save_call_history("call_history.json")
            api.save_conversation_history("conversation_history.json")

            print(f"\n{GREEN}All tests passed for {model_name}!{RESET}")

        except Exception as e:
            print(f"\n{RED}Error testing {model_name}: {str(e)}{RESET}")

    # # Test OpenAI
    run_test("openai:gpt-4o")

    # # Test Claude (if available)
    # if anthropic:
    #     # Test with the correct model name
    #     run_test("anthropic:claude-3.7-sonnet")
    # else:
    #     print(
    #         f"\n{YELLOW}Skipping Claude tests - anthropic package not installed{RESET}"
    #     )

    # # Test Gemini (if available)
    # if genai:
    #     run_test("google:gemini-2.0-flash")
    # else:
    #     print(
    #         f"\n{YELLOW}Skipping Gemini tests - google-generativeai package not installed{RESET}"
    #     )
