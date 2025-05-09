from typing import Dict, Any, Optional, List, Tuple
import json

from gamegen_methods.game_generator_base import GameGenerator


class SimplePromptXMLGenerator(GameGenerator):
    """
    Simple prompt game generator that uses a single LLM call with concatenated system prompts
    to generate both the game design and code implementation.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.use_baseline = kwargs.get('use_baseline', False)

    def generate_user_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for the simple prompt method
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """
        output_format = self.get_output_format()
        if self.use_baseline:
            instructions = self.get_baseline_instructions()
            output_format = self.get_baseline_output_format()
        elif self.use_ecs:
            instructions = self.get_ecs_instructions()
        else:
            instructions = self.get_non_ecs_instructions()
        task = f"""
<task>
Implement an interesting game based on the game concept input from the user.
<game_concept>
{game_concept}
</game_concept>
</task>"""
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
            user_prompt = self.generate_user_prompt(game_concept)
            system_prompt = self.get_system_prompt()
            # Call the LLM with the combined system prompt and user prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            if self.use_baseline:
                response = self.model_api.call(
                    user_prompt=user_prompt,
                    verbose=self.verbose,
                    temperature=0.7,
                    top_p=0.9,
                )
            else:
                response = self.model_api.call(
                    user_prompt=user_prompt,
                    system_prompt=system_prompt,
                    verbose=self.verbose,
                    temperature=0.7,
                    top_p=0.9,
                )
            
            # Prepare conversation log for saving
            conversation_log = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": response}
            ]
            
            # Extract game components from response
            title = self.extract_title(response)
            game_description = self.extract_game_description(response)
            game_controls = self.extract_game_controls(response)
            game_plan =  self.extract_game_plan(response)
            html_code = self.extract_code_block(response, "html") or ""
            game_design = self.extract_game_design(response)


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
                game_design=game_design,
                concept_path=concept_path,
                genre=genre,
                intermediate_outputs={"full_response": response},
                conversation_log=conversation_log,
                use_ecs=self.use_ecs,
                use_baseline=self.use_baseline,
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
    
    def extract_ai_testing(self, response: str) -> List[Dict[str, str]]:
        """
        Extract the ai testing from the response
        """
        ai_testing_output = self.extract_code_block(response, "ai_testing")
        if ai_testing_output:
            return ai_testing_output
        else:
            return []
    
    def get_ecs_instructions(self) -> str:
        """
        Get the instructions for the ECS architecture
        """
        instructions = open("game_generators/system_prompts/single_prompt_instructions_ecs.txt", "r").read()
        return instructions

    def get_non_ecs_instructions(self) -> str:
        """
        Get the instructions for the non-ECS architecture
        """
        instructions = open("game_generators/system_prompts/single_prompt_instructions_noecs.txt", "r").read()
        return instructions
    
    def get_baseline_instructions(self) -> str:
        """
        Get the instructions for the baseline architecture
        """
        instructions = open("game_generators/system_prompts/baseline_instructions.txt", "r").read()
        return instructions
    
    def get_system_prompt(self) -> str:
        """
        Get the system prompt
        """
        system_prompt = open("game_generators/system_prompts/single_prompt_sysprompt_withai.txt", "r").read()
        return system_prompt

    def get_output_format(self) -> str:
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
        <button id="ai_test_1ModeBtn" class="control-button" onclick="window.setControlMode('AI_TEST_1')">AI (Win)</button>
        <button id="ai_test_2ModeBtn" class="control-button" onclick="window.setControlMode('AI_TEST_2')">AI (NAME OF TEST)</button>
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

<output_instructions>
Output the code plan and game files in this format with NO OTHER TEXT:

<game_design>
<game_elements_from_game_concept>
... (List of game elements like characters, objects, mechanics, etc. from the game concept)
</game_elements_from_game_concept>
<game_elements_beyond_game_concept>
... (List of game elements like characters, objects, mechanics, etc. beyond the concept. Make it interesting, consistent with the concept, and feasible to implement in code.)
</game_elements_beyond_game_concept>
</game_design>

<game_description>
... (game description to introduce the game to the user in maximum 3 sentences. Keep it short and concise.)
</game_description>

<game_controls>
... (game controls as a list of key bindings, Key: Action)
</game_controls>

<ai_testing>
<AI_TEST_1>
<testing>(write in 1-2 sentences "What are you testing?")</testing>
<strategy>(write in 1-2 sentences "How are you testing it?" )</strategy>
<expected_outcome>(write in 1-2 sentences "What is the expected outcome?")</expected_outcome>
</AI_TEST_1>
// Add tests (<=5) as needed along with the expected outcome, strategy, and testing
</ai_testing>

For the javascript files:
<code filename="{{name}}.{{extension}}">
... (code)
</code>

HTML following the <example_html> template (output last):
<code filename="index.html">
... (html code)
</code>
</output_instructions>
"""
        return output_format
    
    def get_baseline_output_format(self) -> str:
        """
        Get the output format for the baseline architecture
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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js"></script>
    <script type="module" src="game.js"></script>
  </body>
</html>
</example_html>

<output_instructions>
Output the game files in this format with NO OTHER TEXT:

For the javascript files:
<code filename="{{name}}.{{extension}}">
... (code)
</code>

HTML following the <example_html> template (output last):
<code filename="index.html">
... (html code)
</code>
</output_instructions>
"""
        return output_format