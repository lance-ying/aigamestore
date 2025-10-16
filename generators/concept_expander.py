from typing import Any, Dict, Optional
from pathlib import Path
import yaml
import re

from generators.base import GameGenerator
from utils.prompt_formatting.prompt_utils import build_system_prompt


class ConceptExpanderGenerator(GameGenerator):
    """Expands vague game concepts into detailed YAML specifications."""

    def generate_user_prompt(self, vague_concept: Optional[str] = None) -> str:
        """Build the concept expansion prompt."""
        # Load the concept expansion instructions
        instructions_path = Path("prompts/generation/concept_expansion_instructions.md")
        if instructions_path.exists():
            instructions = instructions_path.read_text(encoding="utf-8")
        else:
            # Fallback minimal instructions if file missing
            instructions = self._get_fallback_instructions()

        task = f"""
<task>
Expand the following vague game concept into a detailed game specification:

<vague_concept>
{vague_concept or 'Design your own creative game concept and expand it.'}
</vague_concept>

Provide a comprehensive expansion following the format specified in the instructions above.
</task>
"""
        return instructions + "\n" + task

    def get_system_prompt(self) -> str:
        """Return the system prompt for concept expansion."""
        return build_system_prompt()

    def expand_concept(self, vague_concept: Optional[str] = None) -> Dict[str, Any]:
        """
        Expand a vague concept into detailed YAML specification.

        Args:
            vague_concept: Short, vague game concept (1-2 sentences)

        Returns:
            Dict containing expanded concept data
        """
        user_prompt = self.generate_user_prompt(vague_concept)
        system_prompt = self.get_system_prompt()

        response = self.model_api.call(
            user_prompt=user_prompt,
            system_prompt=system_prompt,
            verbose=self.verbose,
            temperature=self.temperature,
            top_p=self.top_p,
            thinking=self.thinking,
            thinking_budget=self.thinking_budget,
        )

        # Handle dict response (when thinking=True) or string response
        if isinstance(response, dict):
            response_text = response.get("response", "")
            thinking_text = response.get("thinking", "")
        else:
            response_text = response
            thinking_text = ""

        # Extract expanded concept from response
        expanded_concept = self.extract_expanded_concept(response_text)

        return {
            "expanded_concept": expanded_concept,
            "raw_response": response_text,
            "thinking": thinking_text,
            "original_concept": vague_concept,
            "generation_params": {
                "temperature": self.temperature,
                "top_p": self.top_p,
                "thinking": self.thinking,
                "thinking_budget": self.thinking_budget,
                "model": self.model_name,
            },
        }

    def extract_expanded_concept(self, response_text: str) -> Dict[str, Any]:
        """
        Extract the expanded concept YAML from LLM response.

        Args:
            response_text: Raw LLM response text

        Returns:
            Parsed expanded concept as dictionary
        """
        # Try to find YAML block in ```yaml or ```yml code fence
        yaml_match = re.search(
            r"```(?:yaml|yml)\s*\n(.*?)\n```",
            response_text,
            re.DOTALL | re.IGNORECASE
        )

        if yaml_match:
            yaml_content = yaml_match.group(1)
        else:
            # Try to find content between <expanded_concept> tags
            tag_match = re.search(
                r"<expanded_concept>\s*(.*?)\s*</expanded_concept>",
                response_text,
                re.DOTALL
            )
            if tag_match:
                yaml_content = tag_match.group(1)
                # Remove code fence if present within tags
                yaml_content = re.sub(r"```(?:yaml|yml)?\s*\n", "", yaml_content)
                yaml_content = re.sub(r"\n```\s*$", "", yaml_content)
            else:
                # Fallback: try to parse entire response as YAML
                yaml_content = response_text

        # Parse YAML
        try:
            expanded_concept = yaml.safe_load(yaml_content)
            if not isinstance(expanded_concept, dict):
                raise ValueError("Expanded concept must be a dictionary")
            return expanded_concept
        except Exception as e:
            # If parsing fails, return minimal structure with raw content
            return {
                "parse_error": str(e),
                "raw_yaml": yaml_content,
                "concept": {
                    "name": "Parse Error",
                    "core_mechanic": "Failed to parse YAML from response"
                }
            }

    def save_expanded_concept(
        self,
        concept_dict: Dict[str, Any],
        output_path: str,
        include_metadata: bool = True
    ) -> Path:
        """
        Save expanded concept to YAML file.

        Args:
            concept_dict: Expanded concept dictionary
            output_path: Path to save YAML file
            include_metadata: Whether to include generation metadata in output

        Returns:
            Path object of saved file
        """
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Prepare output data
        if include_metadata:
            output_data = concept_dict
        else:
            # Only save the expanded_concept, exclude metadata
            output_data = concept_dict.get("expanded_concept", concept_dict)

        # Write to YAML file
        with output_file.open("w", encoding="utf-8") as f:
            yaml.dump(
                output_data,
                f,
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
                indent=2
            )

        return output_file

    def generate_game(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Not used for ConceptExpander - use expand_concept() instead.
        Implemented to satisfy abstract base class.
        """
        raise NotImplementedError(
            "ConceptExpanderGenerator does not generate games. "
            "Use expand_concept() method instead."
        )

    def _get_fallback_instructions(self) -> str:
        """Fallback instructions if prompt file is missing."""
        return """<instructions>
You are a game design expert. Your task is to expand vague game concepts into detailed,
implementation-ready specifications.

For each vague concept, provide:
1. Detailed visual design (art style, color palette with hex codes, animations)
2. Complete game mechanics (entities, interactions, progression)
3. Explicit win/lose conditions (measurable criteria)
4. Game flow (screen-by-screen specifications)
5. Control scheme (exact key mappings)

Output your expansion as a YAML document within ```yaml code fence.
</instructions>
"""
