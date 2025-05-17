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
        self.use_basic = kwargs.get('use_basic', False)
        self.temperature = kwargs.get('temperature', 1.0)
        self.top_p = kwargs.get('top_p', 0.9)
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
        elif self.use_basic:
            instructions = self.get_basic_non_ecs_instructions()
        elif self.use_ecs:
            instructions = self.get_ecs_instructions()
        else:
            instructions = self.get_non_ecs_instructions()
        task = f"""
<task>
Implement a fun and playable game based on the game concept input from the user.
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
            if self.use_basic:
                system_prompt = self.get_basic_system_prompt()
            else:
                system_prompt = self.get_system_prompt()
            # Call the LLM with the combined system prompt and user prompt
            if self.verbose:
                print(f"Calling LLM with game concept: {game_concept[:100]}...")
                
            if self.use_baseline:
                response = self.model_api.call(
                    user_prompt=user_prompt,
                    verbose=self.verbose,
                    temperature=self.temperature,
                    top_p=self.top_p,
                )
            else:
                response = self.model_api.call(
                    user_prompt=user_prompt,
                    system_prompt=system_prompt,
                    verbose=self.verbose,
                    temperature=self.temperature,
                    top_p=self.top_p,
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
            automated_testing_list = self.extract_automated_testing(response)
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
                automated_testing=automated_testing_list,
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
                "automated_testing": automated_testing_list,
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
        instructions = open("game_generators/system_prompts/single_prompt_instructions_ecs.txt", "r").read()
        return instructions

    def get_non_ecs_instructions(self) -> str:
        """
        Get the instructions for the non-ECS architecture
        """
        instructions = open("game_generators/system_prompts/single_prompt_instructions_noecs.txt", "r").read()
        return instructions
    
    def get_basic_non_ecs_instructions(self) -> str:
        """
        Get the instructions for the non-ECS architecture
        """
        instructions = open("game_generators/system_prompts/single_prompt_basic_instructions.txt", "r").read()
        return instructions
    
    def get_baseline_instructions(self) -> str:
        """
        Get the instructions for the baseline architecture
        """
        instructions = open("game_generators/system_prompts/baseline_instructions.txt", "r").read()
        return instructions
    
    def get_basic_system_prompt(self) -> str:
        """
        Get the system prompt for the basic architecture
        """
        system_prompt = open("game_generators/system_prompts/single_prompt_basic_sysprompt.txt", "r").read()
        return system_prompt

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
        <button id="test_1_ModeBtn" class="control-button" onclick="window.setControlMode('TEST_1')">TEST (Win)</button>
        <button id="test_2_ModeBtn" class="control-button" onclick="window.setControlMode('TEST_2')">TEST (NAME OF TEST)</button>
        <!-- Add more test buttons with correct ID convention and click handlers -->
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

<game_description>
... (Decscribe the game to the player, the objective, what they need to know to play and enjoy the game. Don't mention the controls here. Keep it short and concise.)
</game_description>

<game_controls>
... (Game controls as a list of key bindings, Key: Action)
</game_controls>

Write the automated testing plan:
<automated_testing>
<TEST_1>
<test_description>(write in 1-2 sentences "What are you testing and the intent of the test?")</test_description>
<strategy_description>(write in 1-2 sentences "What is your gameplay strategy to test it?")</strategy_description>
<expected_outcome>(write in 1-2 sentences "What is the expected outcome? When do you consider the test successful?")</expected_outcome>
</TEST_1>
// Add more tests (<=5) as needed
</automated_testing>

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
    
