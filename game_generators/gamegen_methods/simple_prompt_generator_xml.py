from typing import Dict, Any, Optional, List, Tuple
import json

from gamegen_methods.game_generator_base import GameGenerator


class SimplePromptEXPGenerator(GameGenerator):
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
        prompt = """
You are a creative professional JavaScript game developer with expertise in implementing 2D video games with consistent gameplay and aesthetic design using p5.js. 

TASK: You will be given a game concept for a 2D video game from a video game enthusiast. You will implement an interesting and fun 2D video game that is consistent with the game concept to be played and enjoyed by players with different skill levels.
The game concept will be a few sentences defining some elements of the game leaving room for your creativity and expertise in making the game more interesting. You should enrich the game adding elements and mechanics beyond the game concept with your creativity and expertise as a game designer. 
The game must be fully playable with clear win/lose conditions that players can achieve. The game should provide multiple paths to victory while maintaining an appropriate level of challenge, preventing it from being frustrating or boring for the player. You will also implement AI testing code that can verify different aspects of gameplay, including win conditions, mechanics, and edge cases.
You are encouraged to write as much code as you can to make the game more interesting and aesthetically pleasing. Your code must be error-free, fully functional, and allow the player to make progress towards the final goal in a beautifully designed game.

Game Concept: {game_concept}

"""
        
        if self.use_ecs:
            instructions = self.get_ecs_instructions()
        else:
            instructions = self.get_non_ecs_instructions()
        
        prompt = prompt + instructions
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
            
            # Call the LLM with the combined system prompt and user prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            response = self.model_api.call(
                user_prompt=user_prompt,
                verbose=self.verbose,
            )
            
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": self.get_system_prompt()},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Extract game components from response
            title = self.extract_title(response)
            game_description = self.extract_game_description(response)
            game_controls = self.extract_game_controls(response)
            game_plan =  self.extract_game_plan(response)
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

    def get_ecs_instructions(self) -> str:
        """
        Get the instructions for the ECS architecture
        """
        instructions = open("system_prompts/single_prompt_instructions_ecs.txt", "r").read()
        return instructions

    def get_non_ecs_instructions(self) -> str:
        """
        Get the instructions for the non-ECS architecture
        """
        instructions = open("system_prompts/single_prompt_instructions_nonecs.txt", "r").read()
        return instructions
    
    def get_system_prompt(self) -> str:
        """
        Get the system prompt
        """
        system_prompt = open("system_prompts/single_prompt_sysprompt_withai.txt", "r").read()
        return system_prompt
