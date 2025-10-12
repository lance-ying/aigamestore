from typing import Dict, Any, Optional, List, Tuple
import json
import os

from gamegen_methods.game_generator_base import GameGenerator


class MultiPassXMLGenerator(GameGenerator):
    """
    Multi-pass game generator that uses N LLM calls to generate the game design and code implementation.
    1. First pass generates the game design
    2. Second pass generates a code plan and function skeletons
    3. Passes 3 to N-1 implement each instruction from the code plan
    4. Final pass generates the ai_controller.js and index.html
    """
    
    def __init__(self, *args, num_passes: int = 4, **kwargs):
        """
        Initialize the MultiPassXMLGenerator
        
        Args:
            num_passes: Number of total passes to make (min 4)
            *args: Arguments to pass to the parent class
            **kwargs: Keyword arguments to pass to the parent class
        """
        super().__init__(*args, **kwargs)
        # Ensure at least 4 passes (design, plan, at least 1 implementation, final)
        self.num_passes = max(4, num_passes)
        if self.verbose:
            print(f"Initialized MultiPassXMLGenerator with {self.num_passes} passes")

    def generate_user_prompt(self, game_concept: str) -> str:
        pass

    def generate_game_design_prompt(self, game_concept: str) -> str:
        """
        Generate user prompt from game concept for game design
        
        Args:
            game_concept: The game concept in natural language
            
        Returns:
            User prompt for the LLM
        """        
        instructions = self.get_gdd_instructions()
        output_format = self.get_game_design_output_format()
        task = f"""
<task>
Write an interesting game design based on the game concept input from the user. Describe it well enough for the game developer to implement it.
<game_concept>
{game_concept}
</game_concept>
</task>"""
        prompt = instructions + task + output_format
        return prompt

    def generate_code_plan_prompt(self, game_design: str) -> str:
        """
        Generate user prompt for the code planning phase
        
        Args:
            game_design: The game design document
            
        Returns:
            User prompt for the LLM
        """
        num_instructions = self.num_passes - 2  # -2 because we need plan + final pass
        if self.use_ecs:
            instructions = self.get_ecs_code_plan_instructions()
        else:
            instructions = self.get_non_ecs_code_plan_instructions()
        
        output_format = self.get_code_plan_output_format(num_instructions)
        task = f"""
<task>
Create a step-by-step plan with {num_instructions} instructions to implement a game based on this design.
Also provide function skeletons with docstrings and pseudocode for all JavaScript files (except ai_controller.js).

<game_design>
{game_design}
</game_design>
</task>
"""
        prompt = instructions + task + output_format
        return prompt

    def generate_implementation_prompt(self, game_design: str, code_so_far: Dict[str, str], 
                                       instruction: str, instruction_index: int) -> str:
        """
        Generate user prompt for the implementation phase
        
        Args:
            game_design: The game design document
            code_so_far: Dictionary of filename to code content
            instruction: The current instruction to implement
            instruction_index: Index of the current instruction
            
        Returns:
            User prompt for the LLM
        """
        if self.use_ecs:
            instructions = self.get_ecs_implementation_instructions()
        else:
            instructions = self.get_non_ecs_implementation_instructions()
        
        # Format the code so far for the prompt
        code_so_far_text = ""
        for filename, code in code_so_far.items():
            code_so_far_text += f"<code filename=\"{filename}\">\n{code}\n</code>\n\n"
        
        output_format = self.get_implementation_output_format()
        task = f"""
<task>
Update the code to only implement the current step.
<current_step>
Current step: {instruction}
</current_step>

<game_design>
{game_design}
</game_design>

Here is the code so far:
{code_so_far_text}
</task>
"""
        prompt = instructions + task + output_format
        return prompt

    def generate_final_pass_prompt(self, game_design: str, code_so_far: Dict[str, str]) -> str:
        """
        Generate user prompt for the final pass (ai_controller.js and index.html)
        
        Args:
            game_design: The game design document
            code_so_far: Dictionary of filename to code content
            
        Returns:
            User prompt for the LLM
        """
        if self.use_ecs:
            instructions = self.get_ecs_final_pass_instructions()
        else:
            instructions = self.get_non_ecs_final_pass_instructions()
        
        # Format the code so far for the prompt
        code_so_far_text = ""
        for filename, code in code_so_far.items():
            code_so_far_text += f"<code filename=\"{filename}\">\n{code}\n</code>\n\n"
        
        output_format = self.get_final_pass_output_format()
        task = f"""
<task>
Create the final files of the game:
1. The ai_controller.js file for automated testing by listing all the tests in the automated_testing section
2. The index.html file

Make sure these files integrate correctly with the existing code and the automated testing validates the chosen aspects of the game.

Here is the code so far:
{code_so_far_text}

Remember to implement all the required automated tests based on the logic of the game and the intended testing strategy.
</task>
"""
        prompt = instructions + task + output_format
        return prompt

    def generate_game(self, game_concept: str, concept_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a game from the given concept using the multi-pass method
        
        Args:
            game_concept: The game concept in natural language
            concept_path: Optional path to the original concept file
            
        Returns:
            Dictionary containing game data and any intermediate outputs
        """
        try:
            # Store conversation log
            conversation_log = []
            
            # PASS 1: Generate game design
            system_prompt_game_design = self.get_system_prompt_game_design()
            game_design_prompt = self.generate_game_design_prompt(game_concept)
            
            if self.verbose:
                print(f"Pass 1/[1...{self.num_passes}]: Generating game design...")
                
            response_game_design = self.model_api.call(
                user_prompt=game_design_prompt,
                system_prompt=system_prompt_game_design,
                verbose=self.verbose,
                temperature=0.9,
                thinking=self.thinking,
                thinking_budget=self.thinking_budget,
            )
            
            # Handle thinking mode response for game design
            thinking_content_design = ""
            if self.thinking and isinstance(response_game_design, dict):
                # Thinking mode enabled - extract the actual response
                thinking_content_design = response_game_design.get("thinking", "")
                response_game_design = response_game_design.get("content", response_game_design)
            
            # Extract game design
            game_design = self.extract_game_design(response_game_design)
            
            # Add to conversation log
            conversation_log.extend([
                {"role": "system", "content": system_prompt_game_design},
                {"role": "user", "content": game_design_prompt},
                {"role": "assistant", "content": response_game_design}
            ])
            
            # Add thinking content to conversation log if available
            if thinking_content_design:
                conversation_log.insert(-1, {"role": "thinking", "content": thinking_content_design})
            
            # PASS 2: Generate code plan and function skeletons
            system_prompt_code_plan = self.get_system_prompt_code_plan()
            code_plan_prompt = self.generate_code_plan_prompt(game_design)
            
            if self.verbose:
                print(f"Pass 2/[1...{self.num_passes}]: Generating code plan and skeletons...")
                
            response_code_plan = self.model_api.call(
                user_prompt=code_plan_prompt,
                system_prompt=system_prompt_code_plan,
                verbose=self.verbose,
                temperature=0.8,
                thinking=self.thinking,
                thinking_budget=self.thinking_budget,
            )
            
            # Handle thinking mode response for code plan
            thinking_content_plan = ""
            if self.thinking and isinstance(response_code_plan, dict):
                # Thinking mode enabled - extract the actual response
                thinking_content_plan = response_code_plan.get("thinking", "")
                response_code_plan = response_code_plan.get("content", response_code_plan)
            
            # Extract code plan and initial code
            code_plan_instructions = self.extract_code_plan(response_code_plan)
            js_files_dict = self.extract_code_block(response_code_plan, "javascript")
            
            # Add to conversation log
            conversation_log.extend([
                {"role": "system", "content": system_prompt_code_plan},
                {"role": "user", "content": code_plan_prompt},
                {"role": "assistant", "content": response_code_plan}
            ])
            
            # Add thinking content to conversation log if available
            if thinking_content_plan:
                conversation_log.insert(-1, {"role": "thinking", "content": thinking_content_plan})
            
            # PASSES 3 to N-1: Implement each instruction
            code_so_far = js_files_dict.copy()
            system_prompt_implementation = self.get_system_prompt_implementation()
            
            for i in range(min(len(code_plan_instructions), self.num_passes - 3)):
                instruction = code_plan_instructions[i]
                
                if self.verbose:
                    print(f"Pass {i+3}/{self.num_passes}: Implementing instruction: {instruction}")
                
                implementation_prompt = self.generate_implementation_prompt(
                    game_design=game_design,
                    code_so_far=code_so_far,
                    instruction=instruction,
                    instruction_index=i
                )
                
                response_implementation = self.model_api.call(
                    user_prompt=implementation_prompt,
                    system_prompt=system_prompt_implementation,
                    verbose=self.verbose,
                    temperature=0.7,
                    thinking=self.thinking,
                    thinking_budget=self.thinking_budget,
                )
                
                # Handle thinking mode response for implementation
                thinking_content_impl = ""
                if self.thinking and isinstance(response_implementation, dict):
                    # Thinking mode enabled - extract the actual response
                    thinking_content_impl = response_implementation.get("thinking", "")
                    response_implementation = response_implementation.get("content", response_implementation)
                
                # Extract updated code
                new_js_files = self.extract_code_block(response_implementation, "javascript")
                
                # Update code_so_far with new code
                for filename, code in new_js_files.items():
                    code_so_far[filename] = code
                
                # Add to conversation log
                conversation_log.extend([
                    {"role": "system", "content": system_prompt_implementation},
                    {"role": "user", "content": implementation_prompt},
                    {"role": "assistant", "content": response_implementation}
                ])
                
                # Add thinking content to conversation log if available
                if thinking_content_impl:
                    conversation_log.insert(-1, {"role": "thinking", "content": thinking_content_impl})
            
            # FINAL PASS: Generate ai_controller.js and index.html
            system_prompt_final = self.get_system_prompt_final_pass()
            final_pass_prompt = self.generate_final_pass_prompt(
                game_design=game_design,
                code_so_far=code_so_far
            )
            
            if self.verbose:
                print(f"Pass {self.num_passes}/{self.num_passes}: Generating final files...")
                
            response_final = self.model_api.call(
                user_prompt=final_pass_prompt,
                system_prompt=system_prompt_final,
                verbose=self.verbose,
                temperature=0.6,
                thinking=self.thinking,
                thinking_budget=self.thinking_budget,
            )
            
            # Handle thinking mode response for final pass
            thinking_content_final = ""
            if self.thinking and isinstance(response_final, dict):
                # Thinking mode enabled - extract the actual response
                thinking_content_final = response_final.get("thinking", "")
                response_final = response_final.get("content", response_final)
            
            # Extract final code
            final_js_files = self.extract_code_block(response_final, "javascript")
            html_code = self.extract_code_block(response_final, "html") or ""
            
            # Add to conversation log
            conversation_log.extend([
                {"role": "system", "content": system_prompt_final},
                {"role": "user", "content": final_pass_prompt},
                {"role": "assistant", "content": response_final}
            ])
            
            # Add thinking content to conversation log if available
            if thinking_content_final:
                conversation_log.insert(-1, {"role": "thinking", "content": thinking_content_final})
            
            # Combine all code
            for filename, code in final_js_files.items():
                code_so_far[filename] = code
            
            # Extract metadata from final response
            title = self.extract_title(response_final)
            game_description = self.extract_game_description(response_final)
            game_controls = self.extract_game_controls(response_final)
            game_plan = self.extract_game_plan(response_final)
            ai_testing_list = self.extract_ai_testing(response_final)
            
            # Format JS files for saving
            js_files = []
            for filename, code in code_so_far.items():
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
                ai_testing=ai_testing_list,
                genre=genre,
                intermediate_outputs={
                    "code_plan": code_plan_instructions,
                    "full_response_final": response_final
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
                "ai_testing": ai_testing_list,
                "code_plan": code_plan_instructions
            }
            
        except Exception as e:
            if self.verbose:
                print(f"Error in game generation: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
            raise
    
    def extract_code_plan(self, response: str) -> List[str]:
        """Extract code plan instructions from the LLM response"""
        start_tag = "<iterative_code_plan>"
        end_tag = "</iterative_code_plan>"
        
        if start_tag in response and end_tag in response:
            start_idx = response.find(start_tag) + len(start_tag)
            end_idx = response.find(end_tag)
            code_plan_text = response[start_idx:end_idx].strip()
            
            # Split by numbered items or newlines
            instructions = []
            for line in code_plan_text.split('\n'):
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('//'):
                    # Remove numbering if present (e.g., "1. ", "Step 1: ")
                    import re
                    cleaned_line = re.sub(r'^(\d+\.|Step \d+:|\* )', '', line).strip()
                    if cleaned_line:
                        instructions.append(cleaned_line)
            
            return instructions
        return []

    def get_gdd_instructions(self) -> str:
        """Get the instructions for the game design document"""
        instructions = open("game_generators/system_prompts/two_step_gdd_instructions.txt", "r").read()
        return instructions
    
    def get_ecs_code_plan_instructions(self) -> str:
        """Get the instructions for the ECS code planning phase"""
        # We'll use the same instructions as the base for now, but this could be customized
        instructions = open("game_generators/system_prompts/two_step_code_instructions_ecs.txt", "r").read()
        return instructions

    def get_non_ecs_code_plan_instructions(self) -> str:
        """Get the instructions for the non-ECS code planning phase"""
        # We'll use the same instructions as the base for now, but this could be customized
        instructions = open("game_generators/system_prompts/two_step_code_instructions_noecs.txt", "r").read()
        return instructions
    
    def get_ecs_implementation_instructions(self) -> str:
        """Get the instructions for the ECS implementation phase"""
        return self.get_ecs_code_plan_instructions()

    def get_non_ecs_implementation_instructions(self) -> str:
        """Get the instructions for the non-ECS implementation phase"""
        return self.get_non_ecs_code_plan_instructions()
    
    def get_ecs_final_pass_instructions(self) -> str:
        """Get the instructions for the ECS final pass"""
        return self.get_ecs_code_plan_instructions()

    def get_non_ecs_final_pass_instructions(self) -> str:
        """Get the instructions for the non-ECS final pass"""
        return self.get_non_ecs_code_plan_instructions()
    
    def get_system_prompt_game_design(self) -> str:
        """Get the system prompt for game design phase"""
        system_prompt = open("game_generators/system_prompts/two_step_sysprompt_gdd.txt", "r").read()
        return system_prompt
    
    def get_system_prompt_code_plan(self) -> str:
        """Get the system prompt for code planning phase"""
        # We can use the same system prompt for code as the two-step generator for now
        system_prompt = open("game_generators/system_prompts/two_step_sysprompt_code.txt", "r").read()
        return system_prompt
    
    def get_system_prompt_implementation(self) -> str:
        """Get the system prompt for implementation phase"""
        # We can use the same system prompt for code as the two-step generator for now
        system_prompt = open("game_generators/system_prompts/two_step_sysprompt_code.txt", "r").read()
        return system_prompt
    
    def get_system_prompt_final_pass(self) -> str:
        """Get the system prompt for final pass"""
        # We can use the same system prompt for code as the two-step generator for now
        system_prompt = open("game_generators/system_prompts/two_step_sysprompt_code.txt", "r").read()
        return system_prompt
    
    def get_game_design_output_format(self) -> str:
        """Get the output format for game design phase"""
        output_format = """
Output format:

<game_design>
... (game design in <= 1000 words)
</game_design>
        """
        return output_format
    
    def get_code_plan_output_format(self, num_instructions: int) -> str:
        """
        Get the output format for code planning phase
        
        Args:
            num_instructions: Number of instructions to generate
            
        Returns:
            Output format string
        """
        output_format = f"""
<output_instructions>
Output the code plan and initial function skeletons in this format:

Write the iterative code plan in this format with {num_instructions} instructions:
<iterative_code_plan>
1. ... (first instruction in 1-2 lines)
... It should only have {num_instructions-1} instructions.
{num_instructions}th instruction should be "Finalize the code for a fully functional game."
</iterative_code_plan>

For each JavaScript file (EXCEPT ai_controller.js):
<code filename="{{name}}.js">
// Function skeletons with docstrings and pseudocode. DO not start coding the game yet.
... (code)
</code>
</output_instructions>
"""
        return output_format
    
    def get_implementation_output_format(self) -> str:
        """Get the output format for implementation phase"""
        output_format = """
<output_instructions>
Output the updated JavaScript files in this format:

For each modified JavaScript file:
<code filename="{{name}}.js">
... (complete based on the current instruction)
</code>
</output_instructions>
"""
        return output_format
    
    def get_final_pass_output_format(self) -> str:
        """Get the output format for final pass"""
        output_format = """
<output_instructions>
Given the code so far, write the ai_controller.js and index.html files in this format:

<game_description>
... (game description to introduce the game to the user in maximum 3 sentences. Keep it short and concise.)
</game_description>

<game_controls>
... (game controls as a list of key bindings, Key: Action)
</game_controls>

<automated_testing>
<TEST_1>
<test_description>(write in 1-2 sentences "What are you testing?")</test_description>
<strategy_description>(write in 1-2 sentences "How are you testing it?" )</strategy_description>
<expected_outcome>(write in 1-2 sentences "What is the expected outcome?")</expected_outcome>
</TEST_1>
// Add tests (<=5) as needed along with the expected outcome, strategy, and testing
</automated_testing>

<code filename="ai_controller.js">
... (complete implementation)
</code>

HTML following a standard template:
<code filename="index.html">
<!doctype html>
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
        <button id="test_1_ModeBtn" class="control-button" onclick="window.setControlMode('TEST_1')">Test (Win)</button>
        <button id="test_2_ModeBtn" class="control-button" onclick="window.setControlMode('TEST_2')">Test (NAME OF TEST)</button>
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
</code>
</output_instructions>
"""
        return output_format 