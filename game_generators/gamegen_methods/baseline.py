from typing import Dict, Any, Optional
import json
import re

from gamegen_methods.game_generator_base import GameGenerator


class BaselineGenerator(GameGenerator):
    """
    Baseline game generator that uses a single LLM call with a simple baseline system prompt
    to generate both the game design and code implementation. The system prompt is a simpler version of the code_generation.txt system prompt.
    """

    def __init__(
        self,
        model_name: str = "anthropic:claude-3.7-sonnet",
        verbose: bool = False,
        baseline_system_prompt_path: str = "game_generators/system_prompts/baseline_sysprompt.txt",
        thinking: bool = False,
        thinking_budget: Optional[int] = None,
        **kwargs
    ):
        """
        Initialize the baseline generator

        Args:
            model_name: Name of the LLM model to use
            verbose: Whether to print verbose output
            baseline_system_prompt_path: Path to the baseline system prompt
            thinking: Whether to enable thinking mode for supported models
            thinking_budget: Number of tokens to allocate for thinking
            **kwargs: Additional keyword arguments to pass to the parent class
        """
        super().__init__(model_name=model_name, verbose=verbose, thinking=thinking, thinking_budget=thinking_budget, **kwargs)
        
        # Load baseline system prompt
        with open(baseline_system_prompt_path, "r") as f:
            self.baseline_system_prompt = f.read()

    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for the baseline method
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """
        prompt = f"""
TASK: Implement a 2D video game that follows the game concept.
Game concept: {game_concept}

Output instructions:
Output game files in this format with NO OTHER TEXT:

For the javascript files:
<code filename="{{name}}.{{extension}}">
... (code)
</code>

HTML (output last):
<code filename="index.html">
... (html code)
</code>
"""
        return prompt

    def extract_game_controls(self, text: str) -> str:
        """
        Extract game controls from text
        
        Args:
            text: The text containing the game controls
            
        Returns:
            The extracted game controls
        """
        pattern = r"<game_controls>\s*(.*?)\s*</game_controls>"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""

    def generate_game(self, game_concept: str, concept_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a game from the given concept using the baseline method
        
        Args:
            game_concept: The game concept in natural language
            concept_path: Optional path to the original concept file
            
        Returns:
            Dictionary containing game data and any intermediate outputs
        """
        try:
            # Generate user prompt
            user_prompt = self.generate_user_prompt(game_concept)
            
            # Use the baseline system prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            response = self.model_api.call(
                user_prompt=user_prompt,
                system_prompt=self.baseline_system_prompt,
                verbose=self.verbose,
                thinking=self.thinking,
                thinking_budget=self.thinking_budget,
            )
            
            # Handle thinking mode response
            thinking_content = ""
            if self.thinking and isinstance(response, dict):
                # Thinking mode enabled - extract the actual response
                thinking_content = response.get("thinking", "")
                response = response.get("content", response)
            
            # Prepare conversation log for saving (include thinking if available)
            conversation_log = [
                {"role": "system", "content": self.baseline_system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Add thinking content to conversation log if available
            if thinking_content:
                conversation_log.append({"role": "thinking", "content": thinking_content})
            
            # Extract game components from response
            title = self.extract_title(response)
            game_description = self.extract_game_description(response)
            game_controls = self.extract_game_controls(response)
            html_code = self.extract_code_block(response, "html") or ""
            
            # Get JavaScript files
            js_code_dict = self.extract_code_block(response, "javascript")
            js_files = []
            for filename, code in js_code_dict.items():
                js_files.append((filename, code))
            
            # Parse genre from concept file if available
            genre = None
            if concept_path:
                try:
                    with open(concept_path, 'r') as f:
                        concept_data = json.load(f)
                        genre = concept_data.get('genre', None)
                except Exception as e:
                    if self.verbose:
                        print(f"Failed to load genre from concept file: {e}")
            
            # Save the game files
            game_dir = self.save_games(
                title=title,
                html_code=html_code,
                js_files=js_files,
                game_description=game_description,
                game_controls=game_controls,
                game_concept=game_concept,
                concept_path=concept_path,
                genre=genre,
                game_plan="",
                use_ecs=False,
                intermediate_outputs={"full_response": response},
                conversation_log=conversation_log
            )
            
            if self.verbose:
                print(f"Game generated successfully at: {game_dir}")
            
            return {
                "title": title,
                "html_code": html_code,
                "js_files": js_files,
                "game_description": game_description,
                "game_controls": game_controls,
                "game_dir": game_dir,
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in game generation: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise
