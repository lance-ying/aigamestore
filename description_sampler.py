import os
from typing import List
from openai import OpenAI
import argparse
import json

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from google import genai
except ImportError:
    genai = None


class DescriptionSampler:
    """
    Generates multiple unique descriptions of novel, unseen games
    """

    def __init__(self, model_name: str = "openai:o3-mini"):
        """
        Initialize the description sampler

        Args:
            model_name: Name of the AI model to use with provider prefix
                    Format: "provider:model" (e.g., "openai:o3-mini", "claude:claude-3-haiku")
        """
        self.model_provider, self.model = self._parse_model_name(model_name)
        self.client = self._initialize_client()

    def _parse_model_name(self, model_name: str) -> tuple[str, str]:
        """Parse the model name string to extract provider and model name"""
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            return provider.lower(), model
        return "openai", model_name

    def _initialize_client(self):
        """Initialize the appropriate client based on the model provider"""
        if self.model_provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        elif self.model_provider == "claude":
            if anthropic is None:
                raise ImportError(
                    "The 'anthropic' package is required to use Claude models."
                )
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        elif self.model_provider == "gemini":
            if genai is None:
                raise ImportError(
                    "The 'google-generativeai' package is required to use Gemini models."
                )
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            return genai
        else:
            raise ValueError(f"Unsupported model provider: {self.model_provider}")

    def _call_model_api(self, prompt: str) -> str:
        """Call the appropriate model API based on the provider"""
        if self.model_provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}, {"role": "system", "content": "You are a super creative and talented 2D video game designer!"}],
                temperature=1.0,
                max_completion_tokens=6000,
            )
            return response.choices[0].message.content
        elif self.model_provider == "claude":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        elif self.model_provider == "gemini":
            model = self.client.GenerativeModel(model_name=self.model)
            response = model.generate_content(prompt)
            return response.text

    def generate_descriptions(self, num_descriptions: int = 10) -> List[str]:
        """
        Generate multiple unique descriptions of novel, unseen games

        Args:
            num_descriptions: Number of descriptions to generate

        Returns:
            List of game descriptions
        """
        prompt = f"""Imagine {num_descriptions} wildly creative games that break all conventional rules of 2D video game design. 
        Let your imagination run completely free - think impossible mechanics, bizarre concepts, or mind-bending ideas that 
        seem crazy at first glance but become fascinating the more you think about them.

        These could be anything - games that play with reality itself, experiences that challenge what a 'game' even means, 
        or concepts that make players go "I never knew I wanted this until now!"

        Give me {num_descriptions} short descriptions that make me say "wow, I've never thought of anything like that before!"

        Format as:
        [INDEX]. [DESCRIPTION]

        Surprise me with each one!"""

        response = self._call_model_api(prompt)
        return self._parse_descriptions(response)

    def _parse_descriptions(self, response: str) -> List[str]:
        """Parse the response text into a list of descriptions"""
        descriptions = []
        current_description = []

        for line in response.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Check if line starts with a number followed by a period
            if line[0].isdigit() and "." in line:
                if current_description:
                    descriptions.append(" ".join(current_description))
                current_description = [line.split(".", 1)[1].strip()]
            else:
                current_description.append(line)

        # Add the last description
        if current_description:
            descriptions.append(" ".join(current_description))

        return descriptions


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("--num_descriptions", type=int, default=10)
    args = args.parse_args()

    sampler = DescriptionSampler()
    descriptions = sampler.generate_descriptions(args.num_descriptions)

    result = [
        {
            "model": sampler.model,
            "model_provider": sampler.model_provider,
            "descriptions": descriptions,
        }
    ]

    os.makedirs("prompt_descriptions", exist_ok=True)
    if os.path.exists(f"prompt_descriptions/descriptions.json"):
        previous_results = json.load(
            open(
                f"prompt_descriptions/descriptions.json",
                "r",
            )
        )
        result = result + previous_results

    with open(
        f"prompt_descriptions/descriptions.json",
        "w",
    ) as f:
        json.dump(result, f)
