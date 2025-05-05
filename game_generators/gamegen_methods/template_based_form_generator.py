from typing import Dict, Any, Optional, List, Tuple
import json

from gamegen_methods.game_generator_base import GameGenerator


class TemplateBasedFormGenerator(GameGenerator):
    """
    Template-based game generator that uses two sequential LLM calls:
    1. First call to design the game following a form-based approach using the game design system prompt
    2. Second call to implement the game code using the code generation system prompt
    """

    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for the template-based method
        This is required by the GameGenerator base class but not used directly in this implementation,
        as we use separate methods for each stage.
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """
        # We don't use this directly in the template-based implementation
        # but implement it to satisfy the abstract base class requirement
        return self.generate_game_design_prompt(game_concept)

    def extract_game_design(self, output: str) -> str:
        """
        Extract the game design from the output
        """
        pattern = r"<game_design>\s*(.*?)\s*</game_design>"
        return output

    def generate_game_design_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt for the game designer LLM
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the game designer LLM
        """
        prompt = f"""
TASK: Design a 2D video game based on the following game concept.
Game concept: {game_concept}

INSTRUCTIONS:
First, analyze the concept:
1. Identify key game elements explicitly requested in the game concept
2. Determine what elements are missing and can be developed beyond the concept to make the game more interesting going beyond the concept. Make sure the game elements are consistent and aligned with the concept, enriching the gameplay experience.

Create a comprehensive game design following this structure.

OUTPUT INSTRUCTIONS:
Output only the game design in the following format with NO OTHER TEXT:

<game_design>
# Game Overview
- Concept Summary: [2-3 sentences explaining the core idea]
- Target Experience: [What players should feel while playing]

# Character and Story
[Describe the player character and other characters including their capabilities, motivations, and roles.]

# Entities and objects in the game
- Player Character: [Abilities, movement, actions, controls]
- Enemies/NPCs: [Types, behaviors, abilities]
- Items/Power-ups: [Types, effects, acquisition]
- Obstacles/Challenges: [Various challenges players will face]

# Core Gameplay
- Primary Mechanics: [Describe 2-4 key gameplay mechanics.]
- Progression System: [How players advance through the game? Are there levels or just a continuous gameplay? ]
- Player Objectives: [Define clear goals/win conditions. What is the player trying to achieve? What are sub-goals? What can be the side-quests?]

# Game World
- Environment: [Setting, theme, world structure]
- Visual Style: [Viewpoint, color palette, animations]
</game_design>

Focus on creating an interesting and playable 2D game design that follows the game concept but feel free to add more elements to create a more interesting game going beyond the game concept.
"""
        output = self.model_api.call(
            user_prompt=prompt,
            system_prompt=self.game_design_system_prompt,
            verbose=self.verbose,
        )

        game_design = self.extract_game_design(output)
        return game_design

    def generate_code_generation_prompt(self, game_design: str) -> str:
        """
        Generate user prompt for the game developer LLM
        
        Args:
            game_concept: The original game concept
            game_design: The output from the game designer LLM
            
        Returns:
            User prompt for the game developer LLM
        """
        prompt = f"""
TASK: Implement a 2D video game for the following game design.
Game design: {game_design}

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
        Generate a game from the given concept using the template-based method
        
        Args:
            game_concept: The game concept in natural language
            concept_path: Optional path to the original concept file
            
        Returns:
            Dictionary containing game data and any intermediate outputs
        """
        try:
            # Step 1: Generate the game design using the first LLM call
            design_prompt = self.generate_game_design_prompt(game_concept)
            
            if self.verbose:
                print(f"Calling game designer LLM with game concept: {game_concept[:100]}...")
            
            game_design = self.model_api.call(
                user_prompt=design_prompt,
                system_prompt=self.game_design_system_prompt,
                verbose=self.verbose,
            )
            
            # Step 2: Generate the game code using the second LLM call
            code_generation_prompt = self.generate_code_generation_prompt(game_concept, game_design)
            
            if self.verbose:
                print(f"Calling game developer LLM with game design...")
            
            response = self.model_api.call(
                user_prompt=code_generation_prompt,
                system_prompt=self.code_generation_system_prompt,
                verbose=self.verbose,
            )
            
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": self.game_design_system_prompt},
                {"role": "user", "content": design_prompt},
                {"role": "assistant", "content": game_design},
                {"role": "system", "content": self.code_generation_system_prompt},
                {"role": "user", "content": code_generation_prompt},
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
                intermediate_outputs={
                    "game_design": game_design,
                    "full_response": response
                },
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
                "game_design": game_design,
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in game generation: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise
