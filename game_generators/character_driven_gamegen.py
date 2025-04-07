import os
import re
import yaml
import random
from typing import Tuple, Optional, Dict, Any, List
from pathlib import Path

from openai import OpenAI
from .base_game_generator import BaseGameGenerator


class CharacterDrivenGameGenerator(BaseGameGenerator):
    """
    Character-driven game generator that uses LLMs to simulate characters
    improving their own mechanics in the game.
    """

    method_name = "character_driven"

    def __init__(self, config_path: str = "config/gamegen/character_driven_prompt.yaml"):
        """
        Initialize the character-driven game generator
        
        Args:
            config_path: Path to the configuration YAML file
        """
        super().__init__(config_path)
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if not self.client.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
        
        # Set default model
        self.model = self.config.get("model", "gpt-3.5-turbo")
        
    def generate_prompt(self, genre: str, num_players: int, 
                        game_description: str = "", character_definitions: str = "") -> str:
        """
        Generate the game creation prompt
        
        Args:
            genre: Game genre
            num_players: Number of players
            game_description: Optional custom game description
            character_definitions: Optional character definitions
            
        Returns:
            str: Generated prompt
        """
        # If no game description provided, create a default one
        if not game_description:
            genre_article = "an" if genre[0].lower() in ['a', 'e', 'i', 'o', 'u'] else "a"
            game_description = f"Generate {genre_article} {genre} game with {num_players} characters. Human will control 1 character."
        
        # If no character definitions provided, generate them
        if not character_definitions:
            character_definitions = self.sample_character_info(game_description, num_players)
        
        # Construct the prompt similar to generate_games_oai.py
        instructions = self.generate_instructions()
        
        prompt = (
            f"Game description: {game_description}\n"
            f"{character_definitions}\n"
            f"Instructions for the game dynamics code:\n"
            f"{instructions}\n"
            "Do NOT include any rendering or display code.\n"
            "\nOutput your answer as two Markdown code blocks with language tags, exactly as follows:\n"
            "1. First, a description block labeled with ```description containing a detailed explanation of the game.\n"
            "2. Second, a game title block labeled with ```game_title containing just the title of the game.\n"
            "3. The third code block should be labeled with ```javascript and contain the complete working JavaScript game dynamics code (game.js).\n"
        )
        
        return prompt
    
    def generate_instructions(self) -> str:
        """
        Generate instructions for the model
        
        Returns:
            str: Generated instructions
        """
        instructions = super().generate_default_instructions()
        instructions += (
            "- Create a modular design with separate functions for game dynamics and character behaviors\n"
            "- Each character should have its own policy function that determines its behavior\n"
            "- Environment components should be independent and have their own behaviors\n"
            "- The game should be playable with keyboard controls\n"
            "- No audio should be used in the game\n"
            "- Display the game state of the human player and score if applicable\n"
            "- Choice of libraries: [p5.js, p5.play, matter.js]\n"
            "- GENERATE ONLY GAME DYNAMICS: Provide code for only the game dynamics module which is responsible for managing the game state and updating the game state based on the actions of all characters including the human player.\n"
            "- The policy for each AI character should be modularized into a separate function and called with the current game state. This function should be faithful to the description of the AI character.\n"
        )
        return instructions
    
    def sample_character_info(self, game_description: str, num_agents: int) -> str:
        """
        Generate character definitions for the game
        
        Args:
            game_description: Game description
            num_agents: Number of agents/characters
            
        Returns:
            str: Character definitions
        """
        sample_prompt = (
            f"Provide environment, environment components (up to 20), and character definitions for {num_agents} characters based on the following game description: \n{game_description}\n"
            "Please provide a name, role, state representation with the relevant variables and their types/ranges, keys for the allowed actions, impact of each action on the state, and behaviors.\n"
            f"Follow the following format:\n\n"
            "Environment: theme: ..., global_state: ..., components: [list of independent elements in the environment]\n\n"
            "Component [i]: name: ..., role: ..., state: ..., behavior: ..., appearance: ...\n"
            "Character [i]: name: ..., role: ..., state: ..., actions: ..., objectives: ..., success_criteria: ..., failure_criteria: ...\n"
            "Relationships between characters: (character [i], character [j], relationship: ...)\n"
            "IMPORTANT: The Environment components should act completely independently of the characters' states. They should have their own behaviors, animations, and state changes that occur regardless of what the player or other characters are doing. "
            "These components create the living, dynamic world that the game takes place in."
        )
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": sample_prompt}]
        )
        
        return response.choices[0].message.content.strip()
    
    def character_agent_policy(self, agent_index: int, current_js: str, 
                               current_description: str) -> Tuple[str, Optional[str]]:
        """
        Simulate a character agent proposing improvements to its own mechanics
        
        Args:
            agent_index: Index of the character
            current_js: Current JavaScript code
            current_description: Current game description
            
        Returns:
            Tuple of (proposal, updated_description)
        """
        # Extract character information from description
        char_info = ""
        match = re.search(rf"Character\s+{agent_index}:\s*(.*?)(?=Character|\n\n|$)", 
                          current_description, re.DOTALL)
        if match:
            char_info = match.group(1).strip()
        else:
            char_info = f"No specific character definition found for Character {agent_index}"

        # Try to find the character's policy function in the code
        policy_match = re.search(
            rf"function\s+(?:update|policy|behavior|move|control)Character{agent_index}\s*\(.*?\)\s*\{{.*?\}}", 
            current_js, re.DOTALL | re.IGNORECASE
        )
        
        policy_code = ""
        if policy_match:
            policy_code = policy_match.group(0)
        else:
            # Try alternate naming patterns
            alt_policy_match = re.search(
                rf"function\s+(?:update|policy|behavior|move|control)[A-Za-z]*?{agent_index}\s*\(.*?\)\s*\{{.*?\}}", 
                current_js, re.DOTALL | re.IGNORECASE
            )
            if alt_policy_match:
                policy_code = alt_policy_match.group(0)

        prompt = (
            f"As Character Agent {agent_index}, review your character information and policy code below.\n"
            "Your task is to propose improvements for the section of the game code controlling your character. "
            "Focus specifically on improving the policy/behavior function that determines how your character acts. "
            "Propose changes along with the corresponding function calls in the game dynamics code in a structured manner.\n\n"
            "Your Character Information:\n"
            f"{char_info}\n\n"
            f"Your Current Policy Code:\n"
            f"{policy_code if policy_code else 'No specific policy function found for your character.'}\n\n"
            "Provide specific suggestions to improve your character's policy by:\n"
            "1. Making the behavior more interesting and dynamic\n"
            "2. Better aligning with your character's role and objectives\n"
            "3. Improving the decision-making logic\n"
            "Your proposal:"
        )
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content.strip(), None
    
    def environment_agent_policy(self, current_js: str, current_description: str, 
                                 round_number: int = 1, 
                                 allow_description_update: bool = True) -> Tuple[str, Optional[str]]:
        """
        Simulate an environment agent proposing improvements to environment components
        
        Args:
            current_js: Current JavaScript code
            current_description: Current game description
            round_number: Current round number in the debate
            allow_description_update: Whether to allow updating the game description
            
        Returns:
            Tuple of (proposal, updated_description)
        """
        if allow_description_update:
            desc_instruction = "If you want to update the game description, include an 'Updated Game Description:' section with <updated_game_description> tags with your proposed new game description; otherwise, leave it blank. No sounds."
        else:
            desc_instruction = "Do NOT update the game description; only propose improvements to gameplay mechanics and user engagement."

        # Extract environment information from character_definitions
        env_info = ""
        components_info = []
        
        # Extract environment section
        env_match = re.search(r"Environment:\s*(.*?)(?=Component|\n\n|$)", 
                              current_description, re.DOTALL)
        if env_match:
            env_info = env_match.group(1).strip()
        
        # Extract components
        components_matches = re.finditer(
            r"Component\s+\d+:\s*(.*?)(?=Component|\n\n|Character|$)", 
            current_description, re.DOTALL
        )
        for match in components_matches:
            components_info.append(match.group(1).strip())
        
        prompt = (
            f"As the Environment Agent, review the current game code, environment information, and components below.\n"
            "Your task is to propose specific improvements to enhance the environment dynamics and component behaviors. "
            "Propose changes along with the corresponding function calls in the game dynamics code in a structured manner."
            "Focus on making the independent components of the environment more interesting, interactive, and autonomous.\n\n"
            
            "Environment Information:\n"
            f"{env_info}\n\n"
            
            "Environment Components:\n"
            f"{chr(10).join([f'- {comp}' for comp in components_info])}\n\n"
            "IMPORTANT: Ensure that environmental components maintain their independence and autonomy. "
            "They should function according to their own rules and patterns, not directly in response to player state or actions unless it is part of their role.\n\n"
            f"{desc_instruction}\n"
            "Game Code:\n---------------------------\n"
            f"{current_js}\n---------------------------\n"
            "Your proposal:"
        )
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        resp_text = response.choices[0].message.content.strip()
        updated_description = None
        
        # Check if there's an updated game description
        match = re.search(r"<updated_game_description>(.*?)</updated_game_description>", 
                          resp_text, re.DOTALL | re.IGNORECASE)
        if allow_description_update and match:
            candidate = match.group(1).strip()
            if candidate:
                updated_description = candidate
                
        return resp_text, updated_description
    
    def apply_proposals(self, proposals: List[str], current_js: str) -> str:
        """
        Apply the proposals from agents to the game code
        
        Args:
            proposals: List of proposals from agents
            current_js: Current JavaScript code
            
        Returns:
            str: Updated JavaScript code
        """
        proposals_text = "\n".join([f"{i+1}. {p}" for i, p in enumerate(proposals)])
        
        modularity_instructions = (
            "Important: Apply the proposals to the specified functions in the game dynamics code."
            "The updated JavaScript game code must include only the dynamics part with these key considerations:\n"
            "1. Maintain the structure of environment components and character policies\n"
            "2. Ensure that the code is syntactically correct and faithful to the instruction and description of the game.\n"
            "3. Make sure that the generated code makes the game engaging and interesting to play.\n"
            "4. Do NOT modify or include any rendering or display code.\n\n"
        )
        
        prompt = (
            modularity_instructions +
            "Below is the current JavaScript game code and a list of proposals from various agents on how to improve it for the game dynamics module:\n\n"
            "Current Code (Game Dynamics Only):\n---------------------------\n"
            f"{current_js}\n---------------------------\n\n"
            "Proposals:\n"
            f"{proposals_text}\n\n"
            "Please apply all these proposals to the code and produce the updated JavaScript game dynamics code in a markdown code block using the language tag \"```javascript\". "
            "Only output the updated code in that code block, without any additional commentary."
        )
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        resp_text = response.choices[0].message.content
        code_match = re.search(r"```javascript\s*(.*?)```", resp_text, re.DOTALL)
        updated_code = code_match.group(1).strip() if code_match else current_js
        
        return updated_code
    
    def generate_rendering_code(self, game_description: str, character_definitions: str, 
                                dynamics_js: str) -> str:
        """
        Generate rendering code for the game dynamics
        
        Args:
            game_description: Game description
            character_definitions: Character definitions
            dynamics_js: Game dynamics JavaScript code
            
        Returns:
            str: Combined JavaScript code with rendering
        """
        template = (
            "Write the rendering code for a javascript game."
            "The game description is as follows:\n{game_description}\n\n"
            "The character definitions are as follows:\n{character_definitions}\n\n"
            "The game dynamics code is as follows:\n\n"
            "{dynamics_code}\n\n"
            "Update the code by adding separate rendering code that is responsible for rendering the game state."
            "This function should take the current game state and actions of all characters as input."
            "Rendering should include game start, game end, and ongoing visual updates, while preserving the existing game dynamics logic.\n\n"
            "You may use any of these libraries: [p5.js, p5.play, matter.js] for your rendering implementation.\n\n"
            "Pay special attention to rendering the independent environmental components. These components should:\n"
            "1. Be rendered with their own animations and visual effects\n"
            "2. Have distinct visual styles that fit the overall theme of the game\n"
            "Output the complete, updated JavaScript code as a Markdown code block labeled with ```javascript."
        )
        
        prompt = template.format(
            game_description=game_description, 
            character_definitions=character_definitions, 
            dynamics_code=dynamics_js
        )
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        resp_text = response.choices[0].message.content
        js_match = re.search(r"```javascript\s*(.*?)```", resp_text, re.DOTALL)
        rendering_code = js_match.group(1).strip() if js_match else dynamics_js
        
        return rendering_code
    
    def simulate_debate(self, js_code: str, game_description: str, 
                        character_definitions: str, num_agents: int, 
                        rounds: int = 3, 
                        allow_description_update: bool = True) -> Tuple[str, str]:
        """
        Simulate a debate between character agents to improve the game
        
        Args:
            js_code: Initial JavaScript code
            game_description: Game description
            character_definitions: Character definitions
            num_agents: Number of agents
            rounds: Number of debate rounds
            allow_description_update: Whether to allow updating the game description
            
        Returns:
            Tuple of (improved_js_code, final_description)
        """
        current_js = js_code
        current_description = game_description + "\n\n" + character_definitions
        debate_log = ""
        
        for r in range(1, rounds+1):
            print(f"--- Round {r} ---")
            proposals = []
            
            # Environment Agent policy
            env_proposal, updated_description = self.environment_agent_policy(
                current_js, current_description, r, allow_description_update
            )
            proposals.append(f"Environment Agent: {env_proposal}")
            
            if allow_description_update and updated_description:
                current_description = updated_description
                print(f"Updated game description in round {r}")
            
            # Character Agents policies
            for i in range(1, num_agents+1):
                char_proposal, _ = self.character_agent_policy(i, current_js, current_description)
                proposals.append(f"Character Agent {i}: {char_proposal}")
                print(f"Character Agent {i} made a proposal in round {r}")
            
            round_log = f"Round {r} proposals:\n" + "\n".join(proposals) + "\n"
            debate_log += round_log
            print(f"--- End of Round {r} ---\n")
            
            # Aggregate all proposals and update the dynamics code
            current_js = self.apply_proposals(proposals, current_js)
        
        print("\n--- Complete Debate Log ---")
        print(debate_log)
        print("--- End of Debate Log ---\n")
        
        return current_js, current_description
    
    def generate_game(self, genre: str, num_players: int, game_description: str = "", 
                      character_definitions: str = "", num_rounds: int = 3, 
                      allow_description_update: bool = True) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate a character-driven game
        
        Args:
            genre: Game genre
            num_players: Number of players
            game_description: Optional custom game description
            character_definitions: Optional character definitions
            num_rounds: Number of debate rounds
            allow_description_update: Whether to allow updating the game description
            
        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
        """
        # Generate initial prompt
        prompt = self.generate_prompt(genre, num_players, game_description, character_definitions)
        
        # Generate initial game code
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        full_response = response.choices[0].message.content
        
        # Extract description, game title, and JavaScript code
        description_match = re.search(r"```description\s*(.*?)```", full_response, re.DOTALL)
        description = description_match.group(1).strip() if description_match else ""
        
        game_title = self._extract_game_title(full_response)
        
        js_match = re.search(r"```javascript\s*(.*?)```", full_response, re.DOTALL)
        if not js_match:
            raise ValueError("No JavaScript code found in the response")
        
        initial_js_code = js_match.group(1).strip()
        
        # If no character definitions provided, extract them from the description
        if not character_definitions and description:
            character_definitions = description
        
        # Simulate debate to improve the game
        improved_js_code, final_description = self.simulate_debate(
            initial_js_code, 
            game_description if game_description else description,
            character_definitions,
            num_players,
            num_rounds,
            allow_description_update
        )
        
        # Generate rendering code
        final_js_code = self.generate_rendering_code(
            final_description, 
            character_definitions, 
            improved_js_code
        )
        
        # Create HTML from template
        html_content = self._generate_html(
            game_title, 
            description, 
            [("game.js", final_js_code)]
        )
        
        return html_content, [("game.js", final_js_code)], game_title, description, full_response 