#!/usr/bin/env python3
"""
This script generates a playable JavaScript game embedded in a webpage.
It uses LangChain to construct a structured prompt and the OpenAI API to generate two code blocks:
    - index.html: HTML code that loads p5.js from a CDN and references game.js.
    - game.js: The JavaScript game code with decoupled Dynamics and Rendering modules.

The script specifically uses p5play.js, which is a p5.js library extension that simplifies game development
with physics, sprites, animations, and input handling. It generates games with rich, dynamic environments
that include independent components which act autonomously based on their own internal logic, regardless
of player actions. These components (such as weather systems, background creatures, vegetation, mechanical
elements, day/night cycles, and particle effects) create a living world that feels alive even when the
player is not interacting with it.

Before running, ensure that the environment variable OPENAI_API_KEY is set.
"""

import os
import re
import glob
import random
from openai import OpenAI
from langchain.prompts import PromptTemplate

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not client.api_key:
    print("Error: OPENAI_API_KEY environment variable is not set.")
    exit(1)
selected_openai_model = "o3-mini"  # Default OpenAI model

DEFAULT_ACTIONS = 'Choose from the following actions: [arrow keys, shift, space bar, w, a, s, d]'



def update_games_index():
    """
    Updates (or creates) a central HTML index that lists all game HTML files.
    """
    index_files = glob.glob("index_*.html")

    def get_index(fname):
        try:
            return int(fname.split('_')[1].split('.')[0])
        except Exception:
            return 0
    
    index_files = sorted(index_files, key=get_index)
    central_html = (
        "<html>\n"
        "  <head>\n"
        "    <title>Games Index</title>\n"
        "  </head>\n"
        "  <body>\n"
        "    <h1>Available Games</h1>\n"
        "    <ul>\n"
    )
    for fname in index_files:
        central_html += f'      <li><a href="{fname}">{fname}</a></li>\n'
    central_html += (
        "    </ul>\n"
        "  </body>\n"
        "</html>"
    )
    with open("games_index.html", "w", encoding="utf-8") as f:
        f.write(central_html)
    print("Central index 'games_index.html' has been updated.")

def generate_prompt(game_description, env_character_definitions):
    """
    Constructs a structured prompt using LangChain's PromptTemplate.
    The prompt instructs the model to generate a subset of the code:
      - HTML (index.html) with the choice of libraries and a <script> tag referencing game.js.
      - JavaScript (game.js) containing only the game dynamics module. This module should handle all game state updates, agent behaviors, and the multi-agent debate improvements, but should NOT include any code related to rendering (e.g., start game, end game, drawing, etc.).
      The rendering engine will be generated separately later via a dedicated prompt.
    """
    template = (
        "Game description: {game_description}\n"
        "{env_character_definitions}\n"
        "Instructions for the game dynamics code:\n"
        "- No audio should be used in the game.\n"
        "- Display the game state of the human player and score if applicable.\n"
        "- Choice of libraries: [p5.js, p5.play, matter.js]\n"
        "- GENERATE ONLY GAME DYNAMICS: Provide code for only the game dynamics module which is responsible for managing the game state and updating the game state based on the actions of all characters including the human player.\n"
        "- The policy for each AI character should modularized into a separate function and called with the current game state. This function should be faithful to the description of the AI character. The game dynamics code should be written in JavaScript.\n"
        "Do NOT include any rendering or display code.\n"
        "\nOutput your answer as two Markdown code blocks with language tags, exactly as follows:\n"
        "1. The first code block should be labeled with ```html and contain the full HTML code (index.html) with use of libraries p5.js, p5.play, matter.js and includes a <script> tag referencing 'game.js'.\n"
        "2. The second code block should be labeled with ```javascript and contain the complete working JavaScript game dynamics code (game.js).\n"
    )
    prompt = PromptTemplate(
        input_variables=["game_description", "env_character_definitions"],
        template=template,
    )
    return prompt.format(game_description=game_description, 
                            env_character_definitions=env_character_definitions)


def generate_game_code(prompt):
    """
    Calls the OpenAI API with the provided prompt to generate the game code.
    """
    response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": prompt}]
    )
    game_code = response.choices[0].message.content
    return game_code


def parse_code_blocks(response_text):
    """
    Extracts the HTML and JavaScript code blocks from the API response text.
    It assumes that the response contains Markdown code blocks labeled with "html" and "javascript".
    """
    html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
    js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)
    html_code = html_match.group(1).strip() if html_match else None
    js_code = js_match.group(1).strip() if js_match else None
    return html_code, js_code


def save_files(html_code, js_code):
    """
    Saves the HTML and JavaScript code blocks to "index.html" and "game.js", respectively.
    """
    os.makedirs("games", exist_ok=True)
    game_folders = [d for d in os.listdir("games") if os.path.isdir(os.path.join("games", d)) and d.startswith("game_")]
    next_index = 1
    if game_folders:
        indices = []
        for folder in game_folders:
            try:
                idx = int(folder.split('_')[1])
                indices.append(idx)
            except Exception:
                continue
        if indices:
            next_index = max(indices) + 1

    game_folder = os.path.join("games", f"game_{next_index}")
    os.makedirs(game_folder, exist_ok=True)
    intermediate_folder = os.path.join(game_folder, "intermediate")
    os.makedirs(intermediate_folder, exist_ok=True)

    new_js_filename = os.path.join(game_folder, "game.js")
    new_html_filename = os.path.join(game_folder, "index.html")
    with open(new_html_filename, "w", encoding="utf-8") as html_file:
        html_file.write(html_code)
    with open(new_js_filename, "w", encoding="utf-8") as js_file:
        js_file.write(js_code)
    print(f"Final game files saved in '{game_folder}': '{new_html_filename}' and '{new_js_filename}'.")
    update_games_index()
    return game_folder

def save_intermediate_files(game_folder, html_code, js_code, round_number):
    """
    Saves the intermediate game files for a given round.
    The JS file is saved as "game_intermediate_R{round_number}.js" and the corresponding HTML file as "index_intermediate_R{round_number}.html".
    """
    intermediate_folder = os.path.join(game_folder, "intermediate")
    os.makedirs(intermediate_folder, exist_ok=True)
    new_js_filename = os.path.join(intermediate_folder, f"game_intermediate_R{round_number}.js")
    new_html_filename = os.path.join(intermediate_folder, f"index_intermediate_R{round_number}.html")
    new_html_code = html_code.replace("game.js", f"game_intermediate_R{round_number}.js")
    with open(new_html_filename, "w", encoding="utf-8") as html_file:
        html_file.write(new_html_code)
    with open(new_js_filename, "w", encoding="utf-8") as js_file:
        js_file.write(js_code)
    print(f"Intermediate files for round {round_number} saved in '{intermediate_folder}': '{new_html_filename}', '{new_js_filename}'.")


def sample_success_failure_criteria(initial_game_description):
    """
    Uses the o3-mini model to sample game objectives if none are provided,
    using the provided initial game description as context.
    """
    sample_prompt = (
        f"Game description: {initial_game_description}\n"
        "For this game description, provide a set of criteria for success and failure conditions for a JavaScript game. "
        "They should be engaging, clear, and challenging."
    )
    response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": sample_prompt}]
    )
    return response.choices[0].message.content.strip()


def environment_agent_policy(current_js, current_description, objectives, round_number, allow_description_update=True):
    """
    Queries the Environment Agent's policy to propose improvements for the game dynamics.
    Uses the Environment information from character_definitions to suggest improvements to the environment components.
    If allowed, it can update the game description. Returns a tuple: (proposal, updated_game_description).
    """
    if allow_description_update:
        desc_instruction = "If you want to update the game description, include an 'Updated Game Description:' section with <updated_game_description> tags with your proposed new game description; otherwise, leave it blank. No sounds."
    else:
        desc_instruction = "Do NOT update the game description; only propose improvements to gameplay mechanics and user engagement."

    # Extract environment information from character_definitions
    env_info = ""
    components_info = []
    
    # Extract environment section
    env_match = re.search(r"Environment:\s*(.*?)(?=Component|\n\n|$)", current_description, re.DOTALL)
    if env_match:
        env_info = env_match.group(1).strip()
    
    # Extract components
    components_matches = re.finditer(r"Component\s+\d+:\s*(.*?)(?=Component|\n\n|Character|$)", current_description, re.DOTALL)
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
    response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": prompt}]
    )
    resp_text = response.choices[0].message.content.strip()
    updated_description = None
    match = re.search(r"<updated_game_description>(.*?)</updated_game_description>", resp_text, re.IGNORECASE)
    if allow_description_update and match:
        candidate = match.group(1).strip()
        if candidate:
            updated_description = candidate
    return resp_text, updated_description


def character_agent_policy(agent_index, current_js, current_description):
    """
    Queries the policy for a specific Character Agent.
    Uses character-specific information from character_definitions to suggest improvements to that character's policy.
    Returns a natural language proposal for improving the agent's behavior in the game.
    """
    char_info = ""
    match = re.search(rf"Character\s+{agent_index}:\s*(.*?)(?=Character|\n\n|$)", current_description, re.DOTALL)
    if match:
        char_info = match.group(1).strip()
    else:
        char_info = "No specific character definition found for Character " + str(agent_index)

    # Try to find the character's policy function in the code
    policy_match = re.search(rf"function\s+(?:update|policy|behavior|move|control)Character{agent_index}\s*\(.*?\)\s*\{{.*?\}}", current_js, re.DOTALL | re.IGNORECASE)
    policy_code = ""
    if policy_match:
        policy_code = policy_match.group(0)
    else:
        # Try alternate naming patterns
        alt_policy_match = re.search(rf"function\s+(?:update|policy|behavior|move|control)[A-Za-z]*?{agent_index}\s*\(.*?\)\s*\{{.*?\}}", current_js, re.DOTALL | re.IGNORECASE)
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
        "3. Improve the decision-making logic\n"
        "Your proposal:"
    )
    print("Character Agent Policy Prompt: ", prompt)
    response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": prompt}]
    )
    resp_text = response.choices[0].message.content.strip()
    return resp_text, None


def apply_proposals(proposals, current_js):
    """
    Given a list of proposals (natural language suggestions) and the current JavaScript game code,
    queries the AI model to apply all these changes in one go.
    """
    proposals_text = "\n".join([f"{i+1}. {p}" for i, p in enumerate(proposals)])
    # The following instruction ensures that only the game dynamics module is updated, as per the initial prompt.
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
    response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": prompt}]
    )
    resp_text = response.choices[0].message.content
    code_match = re.search(r"```javascript\s*(.*?)```", resp_text, re.DOTALL)
    updated_code = code_match.group(1).strip() if code_match else current_js
    return updated_code


def create_game_folder():
    """
    Creates a new game folder under 'games/' with an 'intermediate' subfolder.
    Returns the path to the created game folder.
    """
    os.makedirs("games", exist_ok=True)
    game_folders = [d for d in os.listdir("games") if os.path.isdir(os.path.join("games", d)) and d.startswith("game_")]
    next_index = 1
    if game_folders:
        indices = []
        for folder in game_folders:
            try:
                idx = int(folder.split('_')[1])
                indices.append(idx)
            except Exception:
                continue
        if indices:
            next_index = max(indices) + 1
    game_folder = os.path.join("games", f"game_{next_index}")
    os.makedirs(game_folder, exist_ok=True)
    intermediate_folder = os.path.join(game_folder, "intermediate")
    os.makedirs(intermediate_folder, exist_ok=True)
    return game_folder


def save_final_files(game_folder, html_code, js_code):
    """
    Saves the final game files (index.html and game.js) in the given game folder.
    """
    new_js_filename = os.path.join(game_folder, "game.js")
    new_html_filename = os.path.join(game_folder, "index.html")
    with open(new_html_filename, "w", encoding="utf-8") as html_file:
        html_file.write(html_code)
    with open(new_js_filename, "w", encoding="utf-8") as js_file:
        js_file.write(js_code)
    print(f"Final game files saved in '{game_folder}': '{new_html_filename}' and '{new_js_filename}'.")
    update_games_index()


def simulate_debate(game_folder, html_code, js_code, initial_game_description, character_definitions, num_agents, rounds=3, allow_description_update=True, objectives=""):
    """
    Implements an iterative multi-agent debate.
    Uses game description and character definitions to guide agent policy improvements.
    Saves the intermediate game files for round 0 (initial version) and after each debate round.
    For each round, before saving the intermediate file, the function generates the updated combined code
    by adding rendering functionality on top of the current game dynamics code.
    Returns the final improved JavaScript game dynamics code (without rendering),
    which is later used to generate the final combined version.
    """
    current_js = js_code  # Pure dynamics code for debate
    # Combine game description with character definitions for a complete context
    current_description = initial_game_description + "\n\n" + character_definitions
    debate_log = ""

    # Save the initial game version as round 0.
    # For round 0, generate the combined code by adding rendering functionality.
    rendering_prompt_initial = generate_rendering_prompt(initial_game_description, character_definitions, current_js)
    rendering_response_initial = generate_rendering_code(rendering_prompt_initial)
    combined_js = parse_rendering_code(rendering_response_initial) if rendering_response_initial else current_js
    save_intermediate_files(game_folder, html_code, combined_js, 0)

    for r in range(1, rounds+1):
        print(f"--- Round {r} ---")
        proposals = []  # Collect controlled proposals from agents in natural language.

        # Environment Agent policy.
        # Extract objectives from character definitions if not provided separately
        if not objectives and "success_criteria" in character_definitions:
            current_objectives = character_definitions
        else:
            current_objectives = objectives
            
        env_proposal, updated_description = environment_agent_policy(current_js, current_description, current_objectives, r, allow_description_update)
        proposals.append(f"Environment Agent: {env_proposal}")
        if allow_description_update and updated_description is not None and updated_description != "":
            current_description = updated_description
            print(f"Updated game description: {updated_description}")

        # Character Agents policies.
        for i in range(1, num_agents):
            char_proposal, _ = character_agent_policy(i, current_js, current_description, current_objectives, r)
            proposals.append(f"Character Agent {i}: {char_proposal}")
            print(f"Character Agent {i}: {char_proposal}")

        round_log = f"Round {r} proposals:\n" + "\n".join(proposals) + "\n"
        debate_log += round_log
        print(f"--- End of Round {r} ---\n")

        # Aggregate all proposals and update the dynamics code.
        current_js = apply_proposals(proposals, current_js)

        # Before saving the intermediate file for this round,
        # generate the combined code by adding rendering functionality to the current dynamics code.
        # Use the updated description to ensure any new environment elements are properly rendered
        rendering_prompt_round = generate_rendering_prompt(initial_game_description, character_definitions, current_js)
        rendering_response_round = generate_rendering_code(rendering_prompt_round)
        combined_js_round = parse_rendering_code(rendering_response_round) if rendering_response_round else current_js

        # Save intermediate game version for this round (combined dynamics + rendering).
        save_intermediate_files(game_folder, html_code, combined_js_round, r)

    print("\n--- Complete Debate Log ---")
    print(debate_log)
    print("--- End of Debate Log ---\n")
    print("\n--- Final Updated Game Description ---")
    print(current_description)
    print("--- End of Final Updated Game Description ---\n")
    
    # Return both the improved JS code and the final description
    return current_js, current_description


def sample_character_info(initial_game_description, num_agents, actions):
    """
    Uses the o3-mini model to sample character definitions for the game if none are provided,
    given the initial game description and the number of characters. 
    The environment is treated as a container with independent components that act autonomously.
    Expected format:
    Environment: theme: ..., global_state: ..., components: [list of independent elements in the environment]
    Component [i]: name: ..., role: ..., state: ..., behavior: ..., appearance: ...
    Character [i]: name: ..., role: ..., state: ..., actions: ..., objectives: ..., success_criteria: ..., failure_criteria: ...
    etc.
    """
    sample_prompt = (
        f"Provide environment, environment components (upto 20), and character definitions for {num_agents} characters based on the following game description: \n{initial_game_description}\n"
        "Please provide a name, role, state representation with the relevant variables and their types/ranges, keys for the allowed actions, impact of each action on the state, and behaviors.\n"
        f"Follow the following format:\n\n"
        "Environment: theme: ..., global_state: ..., components: [list of independent elements in the environment]\n\n"
        "Component [i]: name: ..., role: ..., state: ..., behavior: ..., appearance: ...\n"
        "Character [i]: name: ..., role: ..., state: ..., actions: ..., objectives: ..., success_criteria: ..., failure_criteria: ...\n"
        "Relationships between characters: (character [i], character [j], relationship: ...)\n"
        "IMPORTANT: The Environment components should act completely independently of the characters' states. They should have their own behaviors, animations, and state changes that occur regardless of what the player or other characters are doing. "
        "These components create the living, dynamic world that the game takes place in. Put the response in between <character_definitions> and </character_definitions> tags.\n\n"
    )
    response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": sample_prompt}]
    )
    response_text = response.choices[0].message.content.strip()
    # Extract the response between <character_definitions> and </character_definitions> tags
    character_definitions_match = re.search(r"<character_definitions>(.*?)</character_definitions>", response_text, re.DOTALL)
    if character_definitions_match:
        return character_definitions_match.group(1).strip()
    else:
        return response_text

def generate_rendering_prompt(game_description, character_definitions, dynamics_js):
    """
    Constructs a prompt to update the given game dynamics code by adding rendering functionality.
    The prompt instructs the model to add a new rendering function, named renderGame, which takes the current game
    state as input and renders it to the canvas using p5.js. The original game dynamics code should remain unchanged,
    and the new rendering code should be appended to it.
    The overall game description (including character details) is provided as context.
    Please output your answer as a Markdown code block labeled with ```javascript.
    """
    template = (
        "Write the rendering code for a javascript game."
        "The game description is as follows:\n{game_description}\n\n"
        "The character definitions are as follows:\n{character_definitions}\n\n"
        "The game dynamics code is as follows:\n\n"
        "{dynamics_code}\n\n"
        "Update the code by adding separate rendering code that is responsible for rendering the game state."
        "This function should take the current game stat and actions of all characters as input."
        "Rendering should include game start, game end, and ongoing visual updates, while preserving the existing game dynamics logic.\n\n"
        "You may use any of these libraries: [p5.js, p5.play, matter.js] for your rendering implementation.\n\n"
        "Pay special attention to rendering the independent environmental components. These components should:\n"
        "1. Be rendered with their own animations and visual effects\n"
        "2. Have distinct visual styles that fit the overall theme of the game\n"
        "Output the complete, updated JavaScript code as a Markdown code block labeled with ```javascript."
    )
    return template.format(game_description=game_description, character_definitions=character_definitions, dynamics_code=dynamics_js)

def generate_rendering_code(rendering_prompt):
    """
    Calls the OpenAI API with the provided rendering prompt to update the game dynamics code by adding rendering functionality.
    This function returns the updated JavaScript code that includes the new rendering function.
    """
    try:
        response = client.chat.completions.create(
            model=selected_openai_model,
            messages=[{"role": "user", "content": rendering_prompt}]
        )
        rendering_code = response.choices[0].message.content.strip()
        return rendering_code
    except Exception as e:
        print(f"Error generating rendering code: {e}")
        return ""

def parse_rendering_code(response_text):
    """
    Extracts the JavaScript code block for the rendering engine from the API response text.
    It assumes that the response contains a Markdown code block labeled with "javascript".
    """
    js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)
    rendering_code = js_match.group(1).strip() if js_match else None
    return rendering_code

def main():
    print("Select an OpenAI model to use:")
    print("- 1: o3-mini")
    print("- 2: gpt-3.5-turbo")
    openai_model_choice = input("Enter your choice (1 or 2): ").strip()
    global selected_openai_model
    if openai_model_choice == "2":
        selected_openai_model = "gpt-3.5-turbo"
        print("Using GPT-3.5-turbo for API calls.")
    else:
        selected_openai_model = "o3-mini"
        print("Using o3-mini for API calls.")
    # List of valid genres
    valid_genres = [
        "Arcade",
        "Platformer",  
        "Puzzle",
        "Shooter",
        "Racing",
        "Strategy",
        "Adventure",
        "Action",
        "Fighting",
        "Sports",
        "Survival",
        "Tower Defense",
        "Turn-Based",
        "Card Game",
    ]
    print("Select a game genre from the following list:")
    for valid_genre in valid_genres:
        print(f"- {valid_genre}")
    genre = input("Enter game genre: ").strip()
    if genre == "":
        genre = random.choice(valid_genres)

    if genre not in valid_genres:
        print("Invalid genre selected.")
        return

    try:
        num_agents = int(input("Enter number of agents (1-5): ").strip())
        if num_agents < 1 or num_agents > 5:
            print("Number of agents must be between 1 and 5.")
            return
    except ValueError:
        print("Please enter a valid integer for number of agents.")
        return
    
    if genre[0].lower() in ['a', 'e', 'i', 'o', 'u']:
        genre_article = "an"
    else:
        genre_article = "a"
    num_controllable_agents = int(input("Enter number of controllable agents (1-5): ").strip())
    if num_controllable_agents < 1 or num_controllable_agents > 5:
        print("Number of controllable agents must be between 1 and 5.")
        return
    initial_game_description = input("Enter an initial game description for the game [Enter to use default]: ").strip()
    if initial_game_description == "":
        print("No initial game description provided. Using default game description.")
        initial_game_description = f"Generate {genre_article} {genre} game with {num_agents} characters. Human will control {num_controllable_agents} character."
        print("--------------------------------")
        print("Initial game description: \n", initial_game_description)
        print("--------------------------------")
    actions_input = input(f"Enter actions for each controllable agent or press Enter to use default '{DEFAULT_ACTIONS}':").strip()
    actions = actions_input if actions_input else DEFAULT_ACTIONS
    
    
    character_definitions = input(
        "Enter character definitions for each character in the following format (e.g.,\n"
        "Environment: theme: ..., global_state: ..., components: [list of independent elements in the environment]\n"
        "Component [i]: name: ..., role: ..., state: ..., behavior: ..., appearance: ...\n"
        "Character [i]: name: ..., role: ..., state: ..., actions: ..., objectives: ..., success_criteria: ..., failure_criteria: ...\n"
        "or press Enter to use AI sampled character definitions conditioned on the game description and allowed actions keys: \n"
    ).strip()
    
    if character_definitions == "":
        print("No character definitions provided. Sampling character information from AI using the game description as context...")
        character_definitions = sample_character_info(initial_game_description, num_agents, actions)
        print("--------------------------------")
        print("Character definitions: \n", character_definitions)
        print("--------------------------------")
    update_desc_input = input("Allow game description updates during debate? (yes/no): ").strip().lower()
    allow_description_update_flag = update_desc_input in ["yes", "y"]

    print("\n--- Generated Prompt ---")
    prompt = generate_prompt(initial_game_description, character_definitions)
    print(prompt)
    print("--- End of Prompt ---\n")   
    try:
        num_rounds = int(input("Enter number of debate rounds (default 3): ").strip())
    except ValueError:
        num_rounds = 3
    print("Generating game code from OpenAI API...")
    game_response = generate_game_code(prompt)
    print("Received response from API.")

    html_code, js_code = parse_code_blocks(game_response)
    if html_code and js_code:
        game_folder = create_game_folder()
        # Get objectives from character definitions if available
        objectives = ""
        if "success_criteria" in character_definitions:
            objectives = character_definitions
        
        improved_js_code, final_description = simulate_debate(
            game_folder, 
            html_code, 
            js_code, 
            initial_game_description, 
            character_definitions, 
            num_agents, 
            rounds=num_rounds, 
            allow_description_update=allow_description_update_flag,
            objectives=objectives
        )
    else:
        print("Failed to parse code blocks from the API response.")
        with open("full_game_output.txt", "w", encoding="utf-8") as f:
            f.write(game_response)
        print("Saved full API response to 'full_game_output.txt'.")
        return
    
    # New section: Generate and save rendering engine code, and update game.js with the combined code
    print("\nGenerating rendering engine code from OpenAI API...")
    rendering_prompt = generate_rendering_prompt(final_description, character_definitions, improved_js_code)
    rendering_response = generate_rendering_code(rendering_prompt)
    rendering_js = parse_rendering_code(rendering_response)
    if rendering_js:
        # Overwrite the final game.js file with the combined dynamics and rendering code.
        save_final_files(game_folder, html_code, rendering_js)
        print("Successfully generated and saved the final game with enhanced environment and animated background elements.")
    else:
        print("Failed to parse rendering code block from API response.")
        with open(os.path.join(game_folder, "full_rendering_output.txt"), "w", encoding="utf-8") as f:
            f.write(rendering_response)
        print("Saved full API rendering response to 'full_rendering_output.txt'.")

if __name__ == "__main__":
    main() 