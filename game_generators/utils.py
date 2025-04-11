import os
from typing import Dict, Any, Optional, List, Union
from openai import OpenAI

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
        "3.5-sonnet": "claude-3-5-sonnet-20240620",
        "3.5-haiku": "claude-3-5-haiku-20241022",
        "3.5-sonnet": "claude-3-5-sonnet-20241022",
        "3.7-sonnet": "claude-3-7-sonnet-20250219",
    }

    def __init__(self, model_name: str = "openai:gpt-3.5-turbo"):
        """
        Initialize the API handler

        Args:
            model_name: String in format "provider:model"
                      (e.g., "openai:gpt-3.5-turbo", "claude:claude-3-haiku", "gemini:gemini-1.5-pro")
        """
        self.model_provider, self.model = self._parse_model_name(model_name)
        self.client = self._initialize_client()

    def _parse_model_name(self, model_name: str) -> tuple[str, str]:
        """Parse the model name string to extract provider and model name"""
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            provider = provider.lower()

            # Handle Claude model names
            if provider == "claude":
                # Convert shorthand names to full model names
                if model in ["3.5-sonnet", "3.5-haiku", "3.7-sonnet"]:
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

        elif self.model_provider == "claude":
            if anthropic is None:
                raise ImportError(
                    "The 'anthropic' package is required to use Claude models. "
                    "Install it with 'pip install anthropic'."
                )
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        elif self.model_provider == "gemini":
            if genai is None:
                raise ImportError(
                    "The 'google-generativeai' package is required to use Gemini models. "
                    "Install it with 'pip install google-generativeai'."
                )
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            return genai

        raise ValueError(
            f"Unsupported model provider: {self.model_provider}. "
            "Supported providers are 'openai', 'claude', and 'gemini'."
        )

    def call(
        self,
        user_prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        debug: bool = False,
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
            debug: Whether to print debug information
            **kwargs: Additional model-specific parameters

        Returns:
            str: The model's response text
        """
        # Construct messages list
        messages = []

        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history)

        # Add the current user prompt
        messages.append({"role": "user", "content": user_prompt})

        if debug:
            print(f"\n{BLUE}Debug: API Call{RESET}")
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
            if self.model_provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_completion_tokens=max_tokens,
                    **kwargs,
                )
                result = response.choices[0].message.content

            elif self.model_provider == "claude":
                claude_messages = []

                # Add chat history if provided
                if chat_history:
                    for msg in chat_history:
                        role = msg["role"]
                        if role not in ["user", "assistant"]:
                            continue  # Skip other roles
                        claude_messages.append(
                            {"role": role, "content": msg["content"]}
                        )

                # Add the current user prompt
                claude_messages.append({"role": "user", "content": user_prompt})

                claude_params = {
                    "model": self.model,
                    "messages": claude_messages,
                    "max_tokens": max_tokens if max_tokens is not None else 4096,
                    **kwargs,
                }

                # Only add temperature if it's provided and valid
                if temperature is not None:
                    claude_params["temperature"] = temperature

                # Add system prompt if provided
                if system_prompt:
                    claude_params["system"] = system_prompt

                response = self.client.messages.create(**claude_params)
                result = response.content[0].text

            elif self.model_provider == "gemini":
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

            if debug:
                print(f"{YELLOW}Model Response:\n{result}{RESET}")

            return result

        except Exception as e:
            error_msg = f"Error calling {self.model_provider} API: {str(e)}"
            if debug:
                print(f"{RED}{error_msg}{RESET}")
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
                debug=True,
            )
            print(f"Test 1 Result: {response}")

            # Test 2: With system prompt
            print(f"\n{GREEN}Test 2: With system prompt{RESET}")
            response = api.call(
                user_prompt="What is your role?",
                system_prompt="You are a friendly math tutor who loves numbers.",
                temperature=0.7 if "claude" in model_name else None,
                debug=True,
            )
            print(f"Test 2 Result: {response}")

            # Test 3: With chat history
            print(f"\n{GREEN}Test 3: With chat history{RESET}")
            response = api.call(
                user_prompt="What should I do next?",
                system_prompt="You are a helpful coding assistant.",
                chat_history=[
                    {"role": "user", "content": "I want to learn programming."},
                    {
                        "role": "assistant",
                        "content": "That's great! What languages interest you?",
                    },
                    {"role": "user", "content": "Python seems cool."},
                ],
                temperature=0.7 if "claude" in model_name else None,
                debug=True,
            )
            print(f"Test 3 Result: {response}")

            print(f"\n{GREEN}All tests passed for {model_name}!{RESET}")

        except Exception as e:
            print(f"\n{RED}Error testing {model_name}: {str(e)}{RESET}")

    # Test OpenAI
    run_test("openai:gpt-4o")

    # Test Claude (if available)
    if anthropic:
        # Test with the correct model name
        run_test("claude:3.5-sonnet")
    else:
        print(
            f"\n{YELLOW}Skipping Claude tests - anthropic package not installed{RESET}"
        )

    # Test Gemini (if available)
    if genai:
        run_test("gemini:gemini-1.5-pro")
    else:
        print(
            f"\n{YELLOW}Skipping Gemini tests - google-generativeai package not installed{RESET}"
        )
