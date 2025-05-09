from typing import Dict, Any, Optional, List, Tuple
import json

from gamegen_methods.game_generator_base import GameGenerator


class TwoStepXMLGenerator(GameGenerator):
    """
    Two step game generator that uses two LLM calls with concatenated system prompts
    to generate the game design and code implementation.
    """

    def generate_user_prompt(self, game_concept: str) -> str:
        pass

    def generate_game_design_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for the simple prompt method
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """        

        instructions = self.get_gdd_instructions()

        output_format = self.get_game_design_output_format()
        task = f"""
Here is the game concept from the user:
<task>
<game_concept>{game_concept}</game_concept>
</task>"""
        prompt = instructions + task + output_format
        return prompt

    def generate_code_prompt(self, game_design: str) -> str:
        """
        Generate user prompt from game design for the simple prompt method
        """
        if self.use_ecs:
            instructions = self.get_ecs_code_instructions()
        else:
            instructions = self.get_non_ecs_code_instructions()
        output_format = self.get_code_output_format()
        task = f"""
Generate the game code for the following game design:
<task>
<game_design>{game_design}</game_design>
</task>
"""
        prompt = instructions + task + output_format
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
            system_prompt_game_design = self.get_system_prompt_game_design()
            system_prompt_game_code = self.get_system_prompt_game_code()
            game_design_prompt = self.generate_game_design_prompt(game_concept)
            # Call the LLM with the combined system prompt and user prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            response_game_design = self.model_api.call(
                user_prompt=game_design_prompt,
                system_prompt=system_prompt_game_design,
                verbose=self.verbose,
                temperature=1.0,
                top_p=0.9,
            )

            game_design = self.extract_game_design(response_game_design)

            game_code_prompt = self.generate_code_prompt(game_design)
            
            response = self.model_api.call(
                user_prompt=game_code_prompt,
                system_prompt=system_prompt_game_code,
                verbose=self.verbose,
                temperature=0.2,
                top_p=0.9,
            )
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": system_prompt_game_design},
                {"role": "user", "content": game_design_prompt},
                {"role": "assistant", "content": response_game_design},
                {"role": "system", "content": system_prompt_game_code},
                {"role": "user", "content": game_code_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Extract game components from response
            title = self.extract_title(response)
            game_description = self.extract_game_description(response)
            game_controls = self.extract_game_controls(response)
            game_plan =  self.extract_game_plan(response)
            html_code = self.extract_code_block(response, "html") or ""
            
            ai_testing_list = self.extract_ai_testing(response)
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
                "ai_testing": ai_testing_list,
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in game generation: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise

    def get_gdd_instructions(self) -> str:
        """
        Get the instructions for the game design document
        """
        instructions = open("game_generators/system_prompts/two_step_gdd_instructions.txt", "r").read()
        return instructions
    
    def get_ecs_code_instructions(self) -> str:
        """
        Get the instructions for the ECS architecture
        """
        instructions = open("game_generators/system_prompts/two_step_code_instructions_ecs.txt", "r").read()
        return instructions

    def get_non_ecs_code_instructions(self) -> str:
        """
        Get the instructions for the non-ECS architecture
        """
        instructions = open("game_generators/system_prompts/two_step_code_instructions_noecs.txt", "r").read()
        return instructions
    
    def get_system_prompt_game_design(self) -> str:
        """
        Get the system prompt
        """
        system_prompt = open("game_generators/system_prompts/two_step_sysprompt_gdd.txt", "r").read()
        return system_prompt
    
    def get_system_prompt_game_code(self) -> str:
        """
        Get the system prompt
        """
        system_prompt = open("game_generators/system_prompts/two_step_sysprompt_code.txt", "r").read()
        return system_prompt
    
    def get_game_design_output_format(self) -> str:
        """
        Get the output format
        """
        output_format = """
Output format:

<game_design>
... (game design <= 2000 words)
</game_design>
        """
        return output_format
    
    def get_code_output_format(self) -> str:
        """
        Get the output format
        """
        output_format = """

# HTML REFERENCE TEMPLATE
<example_html>
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #222; }
      body { display: flex; flex-direction: column; justify-content: center; align-items: center; }
      canvas { border: 1px solid #333; width: 600px !important; height: 400px !important; }
      .control-buttons { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; justify-content: center; }
      .control-button { padding: 8px 16px; cursor: pointer; background: #444; color: #fff; border: none; border-radius: 4px; }
      .control-button.active { background: #007bff; } /* active button for current control mode */
    </style>
  </head>
  <body>
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 id="gameTitle" style="color: #fff; font-family: Arial, sans-serif; margin-bottom: 10px;">{game_title}</h1>
      <div class="control-buttons">
        <button id="humanModeBtn" class="control-button active" onclick="window.setControlMode('HUMAN')">Human Mode</button>
        <button id="ai_winModeBtn" class="control-button" onclick="window.setControlMode('AI_WIN')">AI (Win)</button>
        <button id="ai_test_mechanicsModeBtn" class="control-button" onclick="window.setControlMode('AI_TEST_MECHANICS')">AI (Test Mechanics)</button>
        <!-- Add more AI mode buttons with correct ID convention -->
      </div>
      <p id="gameDescription" style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;">{game_description}</p>
      <p id="gameControls" style="color: #ccc; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.4;">{game_controls}</p>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js"></script>
    <script type="module" src="game.js"></script>
  </body>
</html>
</example_html>

Output instructions:
Output game information and game code in this format with NO OTHER TEXT:

<game_description>
... (game description to introduce the game to the user in maximum 3 sentences. Keep it short and concise.)
</game_description>

<game_controls>
... (game controls as a list of key bindings, Key: Action)
</game_controls>

<code_plan>
... (code plan in maximum 5 sentences)
</code_plan>

<ai_testing>
<{ai_test_name_WIN}>
... (write in 1 sentence "What are you testing?" , start with "Testing:")
... (write in 1 sentence "How are you testing it?" , start with "Strategy:")
... (write in 1 sentence "What is the expected outcome?" , start with "Expected outcome:")
</{ai_test_name_WIN}>
// Add more ai_test_TESTNAME as needed where TESTNAME is the name of the test (WIN, MECHANICS, etc.)
</ai_testing>

For the javascript files:
<code filename="{{name}}.{{extension}}">
... (code)
</code>

HTML following the <example_html> template (output last):
<code filename="index.html">
... (html code)
</code>
"""
        return output_format