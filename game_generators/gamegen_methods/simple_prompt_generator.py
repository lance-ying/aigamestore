from typing import Dict, Any, Optional, List, Tuple
import json

from gamegen_methods.game_generator_base import GameGenerator


class SimplePromptGenerator(GameGenerator):
    """
    Simple prompt game generator that uses a single LLM call with concatenated system prompts
    to generate both the game design and code implementation.
    """

    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for the simple prompt method
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """
        prompt = f"""
TASK: Implement a 2D video game that follows the game concept.
Game concept: {game_concept}

Output instructions:
Output the code plan and game files in this format with NO OTHER TEXT:

<plan>
... (code plan in maximum 5 sentences)
</plan>

<game_description>
... (game description to introduce the game to the user in maximum 3 sentences. Keep it short and concise.)
</game_description>

<game_controls>
... (game controls as a list of key bindings, Key: Action)
</game_controls>

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

    def generate_game(self, game_concept: str, concept_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a game from the given concept using the simple prompt method
        
        Args:
            game_concept: The game concept in natural language
            concept_path: Optional path to the original concept file
            
        Returns:
            Dictionary containing game data and any intermediate outputs
        """
        try:
            # Generate user prompt
            user_prompt = self.generate_user_prompt(game_concept)
            
            # Concatenate system prompts for design and code generation
            combined_system_prompt = self.game_design_system_prompt + "\n\n" + self.code_generation_system_prompt
            
            # Call the LLM with the combined system prompt and user prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            response = self.model_api.call(
                user_prompt=user_prompt,
                system_prompt=combined_system_prompt,
                verbose=self.verbose,
            )
            
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": combined_system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Extract game components from response
            title = self.extract_title(response)
            game_description = self.extract_game_description(response)
            game_controls = self.extract_game_controls(response)
            game_plan = self.extract_game_plan(response)
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
                game_plan=game_plan,
                concept_path=concept_path,
                genre=genre,
                intermediate_outputs={"full_response": response},
                conversation_log=conversation_log,
                use_ecs=self.use_ecs,
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
                "game_plan": game_plan,
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in game generation: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise 