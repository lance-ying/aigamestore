from pathlib import Path
import json
import re
from typing import Tuple, Optional, List, Dict
from dataclasses import dataclass
from .code_generator import GameConfig
import os
import shutil
from datetime import datetime


@dataclass
class ImprovementConfig:
    """Configuration for code improvement process"""

    improvement_aspects: List[str] = None

    def __post_init__(self):
        if self.improvement_aspects is None:
            self.improvement_aspects = [
                "game mechanics: make the game more challenging and fun to play",
                "visual design: make the game more visually appealing",
                # "code organization",
                # "performance optimization",
                # "error handling",
                # "user experience",
                # "code readability",
                # "code modularity",
            ]


class CodeImprover:
    """Improves game code through iterative refinement"""

    def __init__(self, model_name: str = "o3-mini", config: ImprovementConfig = None):
        """
        Initialize the code improver
        Args:
            model_name: Name of the model to use for improvements
        """
        self.model_name = model_name
        self.model_id = self._get_model_id()
        self.config = config if config else ImprovementConfig()
        self._init_clients()

    def _get_model_id(self) -> str:
        """Get the actual model ID for API calls"""
        MODEL_MAPPING = {
            "o3-mini": "o3-mini",
            "gpt-4o": "gpt-4o",
            "claude-3.7": "claude-3-7-sonnet-20250219",
            "gemini-2.0": "gemini-2.0-flash-exp",
        }
        return MODEL_MAPPING.get(self.model_name, self.model_name)

    def _init_clients(self):
        """Initialize API clients for different models"""
        try:
            from openai import OpenAI

            self.openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        except ImportError:
            self.openai_client = None

        try:
            from anthropic import Anthropic

            self.anthropic_client = Anthropic(
                api_key=os.environ.get("ANTHROPIC_API_KEY")
            )
        except ImportError:
            self.anthropic_client = None

        try:
            import google.generativeai as genai

            genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
            self.genai = genai
        except ImportError:
            self.genai = None

    def generate_improvement_prompt(
        self, iteration: int = 0, is_global_improvement: bool = True
    ) -> str:
        """Generate a prompt for specific improvement iteration"""
        if is_global_improvement:
            aspect = "whole game"
        else:
            aspect = self.config.improvement_aspects[
                iteration % len(self.config.improvement_aspects)
            ]
        return (
            f"Please try your best to improve the game, but remember NOT to break game dynamics.\n"
            f"Focus on improving the {aspect}.\n"
            "Return the improved code in three markdown blocks:\n"
            "1. ```description for the game description\n"
            "2. ```html for the HTML code\n"
            "3. ```javascript for the JavaScript code\n"
            "For your reference, the JavaScript code is stored in game.js.\n"
            "Make sure to include all three code blocks in your response."
        )

    def improve_game(
        self, game_path: Path, num_iterations: int, is_global_improvement: bool = False
    ) -> List[Dict[str, any]]:
        """
        Improve a game through multiple iterations

        Args:
            game_path: Path to the game directory
            num_iterations: Number of iterations to improve

        Returns:
            List of improvement records for each iteration
        """
        try:
            # Load original game files
            html_path = game_path / "index.html"
            js_path = game_path / "game.js"
            metadata_path = game_path / "metadata.json"
            description_path = game_path / "description.txt"

            if not all(p.exists() for p in [html_path, js_path, metadata_path]):
                raise FileNotFoundError(f"Missing required files in {game_path}")

            with open(html_path, "r", encoding="utf-8") as f:
                original_html = f.read()
            with open(js_path, "r", encoding="utf-8") as f:
                original_js = f.read()
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            with open(description_path, "r", encoding="utf-8") as f:
                original_description = f.read()

            # Create versions directory
            versions_dir = game_path / "versions"
            versions_dir.mkdir(exist_ok=True)

            # Save original as v0
            v0_dir = versions_dir / "v0"
            v0_dir.mkdir(exist_ok=True)
            shutil.copy2(html_path, v0_dir / "index.html")
            shutil.copy2(js_path, v0_dir / "game.js")
            shutil.copy2(metadata_path, v0_dir / "metadata.json")
            shutil.copy2(description_path, v0_dir / "description.txt")
            shutil.copy2(metadata_path, v0_dir / "full_response.txt")

            improvement_records = []
            current_html = original_html
            current_js = original_js
            current_description = original_description
            # Perform iterative improvements
            for i in range(num_iterations):
                try:
                    version_dir = versions_dir / f"v{i+1}"
                    version_dir.mkdir(exist_ok=True)

                    # Generate improvement prompt
                    prompt = self.generate_improvement_prompt(i, is_global_improvement)

                    # Get improved code
                    improved_html, improved_js, improved_description, full_dialogue = (
                        self._improve_code(
                            prompt, current_html, current_js, current_description
                        )
                    )

                    # Save improved version
                    with open(version_dir / "index.html", "w", encoding="utf-8") as f:
                        f.write(improved_html)
                    with open(version_dir / "game.js", "w", encoding="utf-8") as f:
                        f.write(improved_js)
                    with open(
                        version_dir / "description.txt", "w", encoding="utf-8"
                    ) as f:
                        f.write(improved_description)
                    # Save full response
                    with open(
                        version_dir / "full_response.txt", "w", encoding="utf-8"
                    ) as f:
                        f.write(full_dialogue)

                    # Create and save version metadata
                    version_metadata = {
                        **metadata,
                        "version": i + 1,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "changes": self._analyze_changes(
                            current_html,
                            improved_html,
                            current_js,
                            improved_js,
                            current_description,
                            improved_description,
                        ),
                    }
                    with open(
                        version_dir / "metadata.json", "w", encoding="utf-8"
                    ) as f:
                        json.dump(version_metadata, f, indent=2)

                    # Update records
                    improvement_records.append(
                        {"version": i + 1, "path": str(version_dir), **version_metadata}
                    )

                    # Update current code for next iteration
                    current_html = improved_html
                    current_js = improved_js
                    current_description = improved_description
                except Exception as e:
                    print(f"Error in iteration {i+1}: {e}")
                    break

            # Save improvement history
            history = {
                "game_path": str(game_path),
                "total_versions": len(improvement_records) + 1,  # including original
                "improvement_records": improvement_records,
            }
            with open(
                versions_dir / "improvement_history.json", "w", encoding="utf-8"
            ) as f:
                json.dump(history, f, indent=2)

            return improvement_records

        except Exception as e:
            print(f"Error processing game {game_path}: {e}")
            return []

    def _improve_code(
        self, prompt: str, html_code: str, js_code: str, description: str
    ) -> Tuple[str, str, str]:
        """
        Improve the provided code using the AI model

        Args:
            prompt: Improvement prompt
            html_code: Original HTML code
            js_code: Original JavaScript code
            description: Original game description
        Returns:
            Tuple of (improved_html, improved_js, full_response)
        """
        # Combine codes for context
        full_prompt = f"{prompt}\n\nGame Description:\n```description\n{description}\n```\n\nHTML:\n```html\n{html_code}\n```\n\nJavaScript:\n```javascript\n{js_code}\n```"

        # Select appropriate generation method based on model
        if self.model_name.startswith(("gpt", "o3")):
            if not self.openai_client:
                raise RuntimeError("OpenAI client not initialized")

            # print(f"Prompt: {full_prompt}")
            response = self.openai_client.chat.completions.create(
                model=self.model_id,
                messages=[{"role": "user", "content": full_prompt}],
            )
            response_text = response.choices[0].message.content
        elif self.model_name.startswith("claude"):
            if not self.anthropic_client:
                raise RuntimeError("Anthropic client not initialized")
            response = self.anthropic_client.messages.create(
                model=self.model_id, messages=[{"role": "user", "content": full_prompt}]
            )
            response_text = response.content[0].text
        elif self.model_name.startswith("gemini"):
            if not self.genai:
                raise RuntimeError("Gemini client not initialized")
            model = self.genai.GenerativeModel(self.model_id)
            response = model.generate_content(full_prompt)
            response_text = response.text
        else:
            raise ValueError(f"Unsupported model: {self.model_name}")

        # Extract improved code blocks
        improved_html, improved_js, improved_description = self._parse_code_blocks(
            response_text
        )

        if not improved_html or not improved_js:
            raise ValueError("Failed to generate valid improved code")

        full_dialogue = f"Prompt:\n{full_prompt}\n\nResponse:\n{response_text}"
        return improved_html, improved_js, improved_description, full_dialogue

    def _parse_code_blocks(
        self, response_text: str
    ) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Extract HTML, JavaScript and description code blocks from the response"""
        description_match = re.search(
            r"```description\s*(.*?)```", response_text, re.DOTALL
        )
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

        # Set default values if matches are not found
        description = (
            description_match.group(1).strip()
            if description_match
            else "No description provided"
        )
        html_code = html_match.group(1).strip() if html_match else None
        js_code = js_match.group(1).strip() if js_match else None

        if not html_code or not js_code:
            raise ValueError(
                f"Failed to extract code blocks. HTML found: {bool(html_code)}, JS found: {bool(js_code)}"
            )

        return html_code, js_code, description

    def _analyze_changes(
        self,
        old_html: str,
        new_html: str,
        old_js: str,
        new_js: str,
        old_description: str,
        new_description: str,
    ) -> Dict[str, any]:
        """
        Analyze the changes made in the improvement

        Returns:
            Dictionary containing change metrics and analysis
        """
        return {
            "html_diff_lines": len(new_html.splitlines()) - len(old_html.splitlines()),
            "js_diff_lines": len(new_js.splitlines()) - len(old_js.splitlines()),
            "html_changes": self._compute_diff_stats(old_html, new_html),
            "js_changes": self._compute_diff_stats(old_js, new_js),
            "description_diff_lines": len(new_description.splitlines())
            - len(old_description.splitlines()),
            "description_changes": self._compute_diff_stats(
                old_description, new_description
            ),
        }

    def _compute_diff_stats(self, old_code: str, new_code: str) -> Dict[str, int]:
        """Compute basic difference statistics between old and new code"""
        return {
            "additions": sum(
                1 for line in new_code.splitlines() if line not in old_code.splitlines()
            ),
            "deletions": sum(
                1 for line in old_code.splitlines() if line not in new_code.splitlines()
            ),
            "modifications": len(new_code.splitlines()) - len(old_code.splitlines()),
        }
