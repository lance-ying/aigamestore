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
        "\nPlease output your answer as two Markdown code blocks with language tags, exactly as follows:\n"
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


def character_agent_policy(agent_index, current_js, current_description, objectives, round_number):
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
        "Focus specifically on checking if your character's actions and policy code is working as intended. "
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
    
    # Create a subfolder for test results for each round
    test_rounds_folder = os.path.join(game_folder, "test_rounds")
    os.makedirs(test_rounds_folder, exist_ok=True)
    
    # Test the initial game version (round 0)
    print("\n--- Testing Initial Game Version (Round 0) ---")
    round_folder = os.path.join(test_rounds_folder, "round_0")
    os.makedirs(round_folder, exist_ok=True)
    
    # Copy the HTML and JS to the round folder for testing
    round_html_path = os.path.join(round_folder, "index.html")
    round_js_path = os.path.join(round_folder, "game.js")
    with open(round_html_path, "w", encoding="utf-8") as f:
        f.write(html_code)
    with open(round_js_path, "w", encoding="utf-8") as f:
        f.write(combined_js)
    
    # Run test play debugging on the initial version
    print("Running automated test play debugging on initial game version...")
    round_test_desc = f"{initial_game_description}\n\n(Round 0 - Initial Version)"
    debugged_js = test_play_debug(
        round_folder,
        html_code,
        combined_js,
        round_test_desc,
        character_definitions
    )
    
    # Save both original and debugged versions
    save_intermediate_files(game_folder, html_code, combined_js, 0)
    
    # Save debugged version with a different name
    debugged_js_path = os.path.join(game_folder, "intermediate", f"game_intermediate_R0_debugged.js")
    debugged_html_path = os.path.join(game_folder, "intermediate", f"index_intermediate_R0_debugged.html")
    debugged_html = html_code.replace("game.js", f"game_intermediate_R0_debugged.js")
    with open(debugged_js_path, "w", encoding="utf-8") as f:
        f.write(debugged_js)
    with open(debugged_html_path, "w", encoding="utf-8") as f:
        f.write(debugged_html)
    
    # Create a summary file for all rounds of testing
    rounds_summary_path = os.path.join(game_folder, "test_rounds_summary.md")
    with open(rounds_summary_path, "w", encoding="utf-8") as f:
        f.write("# Game Testing Rounds Summary\n\n")
        f.write("## Round 0 (Initial Version)\n\n")
        f.write(f"- [Play Original Version](intermediate/index_intermediate_R0.html)\n")
        f.write(f"- [Play Debugged Version](intermediate/index_intermediate_R0_debugged.html)\n")
        f.write(f"- [View Test Report](test_rounds/round_0/test_play_report.html)\n\n")

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
        rendering_prompt_round = generate_rendering_prompt(current_description, character_definitions, current_js)
        rendering_response_round = generate_rendering_code(rendering_prompt_round)
        combined_js_round = parse_rendering_code(rendering_response_round) if rendering_response_round else current_js

        # Test the round's game version
        print(f"\n--- Testing Round {r} Game Version ---")
        round_folder = os.path.join(test_rounds_folder, f"round_{r}")
        os.makedirs(round_folder, exist_ok=True)
        
        # Copy the HTML and JS to the round folder for testing
        round_html_path = os.path.join(round_folder, "index.html")
        round_js_path = os.path.join(round_folder, "game.js")
        with open(round_html_path, "w", encoding="utf-8") as f:
            f.write(html_code)
        with open(round_js_path, "w", encoding="utf-8") as f:
            f.write(combined_js_round)
        
        # Run test play debugging on this round's version
        print(f"Running automated test play debugging on round {r} game version...")
        round_test_desc = f"{current_description}\n\n(Round {r})"
        debugged_js = test_play_debug(
            round_folder,
            html_code,
            combined_js_round,
            round_test_desc,
            character_definitions
        )
        
        # Save both original and debugged versions
        save_intermediate_files(game_folder, html_code, combined_js_round, r)
        
        # Save debugged version with a different name
        debugged_js_path = os.path.join(game_folder, "intermediate", f"game_intermediate_R{r}_debugged.js")
        debugged_html_path = os.path.join(game_folder, "intermediate", f"index_intermediate_R{r}_debugged.html")
        debugged_html = html_code.replace("game.js", f"game_intermediate_R{r}_debugged.js")
        with open(debugged_js_path, "w", encoding="utf-8") as f:
            f.write(debugged_js)
        with open(debugged_html_path, "w", encoding="utf-8") as f:
            f.write(debugged_html)
        
        # Use the debugged JS for the next round
        current_js = debugged_js.split("// Rendering code starts here")[0].strip() if "// Rendering code starts here" in debugged_js else debugged_js
        
        # Update the summary file
        with open(rounds_summary_path, "a", encoding="utf-8") as f:
            f.write(f"## Round {r}\n\n")
            f.write(f"- [Play Original Version](intermediate/index_intermediate_R{r}.html)\n")
            f.write(f"- [Play Debugged Version](intermediate/index_intermediate_R{r}_debugged.html)\n")
            f.write(f"- [View Test Report](test_rounds/round_{r}/test_play_report.html)\n\n")

    print("\n--- Complete Debate Log ---")
    print(debate_log)
    print("--- End of Debate Log ---\n")
    print("\n--- Final Updated Game Description ---")
    print(current_description)
    print("--- End of Final Updated Game Description ---\n")
    
    # Create an index HTML file for browsing all rounds
    rounds_index_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Game Development Rounds</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
                max-width: 1000px;
                margin: 0 auto;
            }}
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            .rounds-container {{
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-top: 20px;
            }}
            .round-card {{
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                width: calc(50% - 20px);
                box-sizing: border-box;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .button {{
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 4px;
                margin-right: 10px;
                margin-bottom: 10px;
            }}
            .button:hover {{
                background-color: #45a049;
            }}
            @media (max-width: 768px) {{
                .round-card {{
                    width: 100%;
                }}
            }}
        </style>
    </head>
    <body>
        <h1>Game Development Rounds</h1>
        <p>This page shows all rounds of development for the game, including the original and debugged versions for each round.</p>
        
        <h2>Final Game</h2>
        <p>
            <a href="../index.html" class="button">Play Final Game</a>
            <a href="../test_play_report.html" class="button">View Final Test Report</a>
        </p>
        
        <h2>Development Rounds</h2>
        <div class="rounds-container">
            <div class="round-card">
                <h3>Initial Version (Round 0)</h3>
                <p>
                    <a href="../intermediate/index_intermediate_R0.html" class="button">Play Original</a>
                    <a href="../intermediate/index_intermediate_R0_debugged.html" class="button">Play Debugged</a>
                    <a href="round_0/test_play_report.html" class="button">View Test Report</a>
                </p>
            </div>
    """
    
    # Add each round to the index
    for r in range(1, rounds+1):
        rounds_index_html += f"""
            <div class="round-card">
                <h3>Round {r}</h3>
                <p>
                    <a href="../intermediate/index_intermediate_R{r}.html" class="button">Play Original</a>
                    <a href="../intermediate/index_intermediate_R{r}_debugged.html" class="button">Play Debugged</a>
                    <a href="round_{r}/test_play_report.html" class="button">View Test Report</a>
                </p>
            </div>
        """
    
    # Close the HTML
    rounds_index_html += """
        </div>
    </body>
    </html>
    """
    
    # Save the rounds index
    rounds_index_path = os.path.join(test_rounds_folder, "index.html")
    with open(rounds_index_path, "w", encoding="utf-8") as f:
        f.write(rounds_index_html)
    
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

def generate_html_test_report(game_folder, original_js, fixed_js, analysis, mechanics, simulation_results, fix_results, verification_results, report_results):
    """
    Generates an HTML report that visually displays the test play results.
    
    The report includes:
    - Executive summary
    - Code comparison between original and fixed versions
    - Detailed analysis of issues and fixes
    - Interactive elements to view different sections
    
    Args:
        game_folder: Path to the game folder
        original_js: Original JavaScript code
        fixed_js: Fixed JavaScript code
        analysis: Analysis of the game code
        mechanics: Identified game mechanics
        simulation_results: Results of gameplay simulation
        fix_results: Description of fixes applied
        verification_results: Results of fix verification
        report_results: Final test play report
        
    Returns:
        Path to the generated HTML report
    """
    # Create a simple HTML template for the report
    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Game Test Play Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
            }
            h1, h2, h3 {
                color: #2c3e50;
            }
            .container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .section {
                background-color: #f9f9f9;
                border-radius: 5px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .code-container {
                display: flex;
                gap: 20px;
                overflow-x: auto;
            }
            .code-box {
                flex: 1;
                background-color: #f5f5f5;
                border-radius: 5px;
                padding: 15px;
                overflow: auto;
                max-height: 500px;
            }
            pre {
                margin: 0;
                white-space: pre-wrap;
                font-family: 'Courier New', Courier, monospace;
            }
            .tab-container {
                display: flex;
                border-bottom: 1px solid #ddd;
                margin-bottom: 15px;
            }
            .tab {
                padding: 10px 20px;
                cursor: pointer;
                background-color: #f1f1f1;
                border: 1px solid #ddd;
                border-bottom: none;
                border-radius: 5px 5px 0 0;
                margin-right: 5px;
            }
            .tab.active {
                background-color: #fff;
                border-bottom: 1px solid #fff;
                margin-bottom: -1px;
            }
            .tab-content {
                display: none;
                padding: 15px;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 5px 5px;
            }
            .tab-content.active {
                display: block;
            }
            .highlight {
                background-color: #ffff99;
            }
            .button {
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 5px;
            }
            .button:hover {
                background-color: #45a049;
            }
            .summary-box {
                background-color: #e8f4f8;
                border-left: 5px solid #4CAF50;
                padding: 15px;
                margin-bottom: 20px;
            }
            .issue-box {
                background-color: #fff3f3;
                border-left: 5px solid #f44336;
                padding: 15px;
                margin-bottom: 10px;
            }
            .fix-box {
                background-color: #f0f8e6;
                border-left: 5px solid #8bc34a;
                padding: 15px;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <h1>Game Test Play Report</h1>
        
        <div class="container">
            <div class="section">
                <h2>Executive Summary</h2>
                <div class="summary-box">
                    <p>This report presents the results of automated test play debugging for the JavaScript game. The testing process involved analyzing the game code, simulating gameplay, identifying issues, implementing fixes, and verifying the fixes.</p>
                </div>
                
                <div class="tab-container">
                    <div class="tab active" onclick="openTab(event, 'summary-tab')">Summary</div>
                    <div class="tab" onclick="openTab(event, 'full-report-tab')">Full Report</div>
                </div>
                
                <div id="summary-tab" class="tab-content active">
                    <h3>Key Findings</h3>
                    <div id="summary-content">
                        <!-- Summary content will be inserted here -->
                    </div>
                </div>
                
                <div id="full-report-tab" class="tab-content">
                    <h3>Complete Test Play Report</h3>
                    <div id="report-content">
                        <!-- Report content will be inserted here -->
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Code Comparison</h2>
                <p>Compare the original game code with the fixed version:</p>
                <div class="code-container">
                    <div class="code-box">
                        <h3>Original Code</h3>
                        <pre id="original-code"><!-- Original code will be inserted here --></pre>
                    </div>
                    <div class="code-box">
                        <h3>Fixed Code</h3>
                        <pre id="fixed-code"><!-- Fixed code will be inserted here --></pre>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Detailed Analysis</h2>
                
                <div class="tab-container">
                    <div class="tab active" onclick="openTab(event, 'analysis-tab')">Code Analysis</div>
                    <div class="tab" onclick="openTab(event, 'mechanics-tab')">Game Mechanics</div>
                    <div class="tab" onclick="openTab(event, 'simulation-tab')">Gameplay Simulation</div>
                    <div class="tab" onclick="openTab(event, 'fixes-tab')">Applied Fixes</div>
                    <div class="tab" onclick="openTab(event, 'verification-tab')">Verification</div>
                </div>
                
                <div id="analysis-tab" class="tab-content active">
                    <h3>Code Analysis</h3>
                    <div id="analysis-content">
                        <!-- Analysis content will be inserted here -->
                    </div>
                </div>
                
                <div id="mechanics-tab" class="tab-content">
                    <h3>Game Mechanics</h3>
                    <div id="mechanics-content">
                        <!-- Mechanics content will be inserted here -->
                    </div>
                </div>
                
                <div id="simulation-tab" class="tab-content">
                    <h3>Gameplay Simulation</h3>
                    <div id="simulation-content">
                        <!-- Simulation content will be inserted here -->
                    </div>
                </div>
                
                <div id="fixes-tab" class="tab-content">
                    <h3>Applied Fixes</h3>
                    <div id="fixes-content">
                        <!-- Fixes content will be inserted here -->
                    </div>
                </div>
                
                <div id="verification-tab" class="tab-content">
                    <h3>Verification</h3>
                    <div id="verification-content">
                        <!-- Verification content will be inserted here -->
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Play the Game</h2>
                <p>You can play both the original and fixed versions of the game to compare the differences:</p>
                <a href="../index.html" class="button" target="_blank">Play Fixed Game</a>
                <a href="intermediate/index_intermediate_R0.html" class="button" target="_blank">Play Original Game</a>
            </div>
        </div>
        
        <script>
            // Function to open tabs
            function openTab(evt, tabName) {
                var i, tabcontent, tablinks;
                tabcontent = document.getElementsByClassName("tab-content");
                for (i = 0; i < tabcontent.length; i++) {
                    tabcontent[i].className = tabcontent[i].className.replace(" active", "");
                }
                tablinks = document.getElementsByClassName("tab");
                for (i = 0; i < tablinks.length; i++) {
                    tablinks[i].className = tablinks[i].className.replace(" active", "");
                }
                document.getElementById(tabName).className += " active";
                evt.currentTarget.className += " active";
            }
            
            // Function to escape HTML
            function escapeHtml(unsafe) {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
            
            // Function to convert markdown to HTML
            function markdownToHtml(markdown) {
                // This is a simple conversion - for a real implementation, use a proper markdown library
                return markdown
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/\n/g, '<br>');
            }
            
            // Populate the content
            document.getElementById('original-code').textContent = `ORIGINAL_CODE_PLACEHOLDER`;
            document.getElementById('fixed-code').textContent = `FIXED_CODE_PLACEHOLDER`;
            document.getElementById('summary-content').innerHTML = markdownToHtml(`SUMMARY_PLACEHOLDER`);
            document.getElementById('report-content').innerHTML = markdownToHtml(`REPORT_PLACEHOLDER`);
            document.getElementById('analysis-content').innerHTML = markdownToHtml(`ANALYSIS_PLACEHOLDER`);
            document.getElementById('mechanics-content').innerHTML = markdownToHtml(`MECHANICS_PLACEHOLDER`);
            document.getElementById('simulation-content').innerHTML = markdownToHtml(`SIMULATION_PLACEHOLDER`);
            document.getElementById('fixes-content').innerHTML = markdownToHtml(`FIXES_PLACEHOLDER`);
            document.getElementById('verification-content').innerHTML = markdownToHtml(`VERIFICATION_PLACEHOLDER`);
        </script>
    </body>
    </html>
    """
    
    # Extract a summary from the report
    summary_match = re.search(r"Executive Summary:?\s*(.*?)(?=\n\n|\n#|\n##|$)", report_results, re.DOTALL | re.IGNORECASE)
    summary = summary_match.group(1).strip() if summary_match else "No summary available."
    
    # Replace placeholders with actual content
    html_content = html_template.replace('ORIGINAL_CODE_PLACEHOLDER', original_js)
    html_content = html_content.replace('FIXED_CODE_PLACEHOLDER', fixed_js)
    html_content = html_content.replace('SUMMARY_PLACEHOLDER', summary)
    html_content = html_content.replace('REPORT_PLACEHOLDER', report_results)
    html_content = html_content.replace('ANALYSIS_PLACEHOLDER', analysis)
    html_content = html_content.replace('MECHANICS_PLACEHOLDER', mechanics)
    html_content = html_content.replace('SIMULATION_PLACEHOLDER', simulation_results)
    html_content = html_content.replace('FIXES_PLACEHOLDER', fix_results)
    html_content = html_content.replace('VERIFICATION_PLACEHOLDER', verification_results)
    
    # Save the HTML report
    report_path = os.path.join(game_folder, "test_play_report.html")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"HTML test play report saved to '{report_path}'")
    return report_path

def create_debug_version(game_folder, html_code, js_code, mechanics):
    """
    Creates a playable debug version of the game with visual indicators for AI agent actions.
    
    This version includes:
    - Visual overlays showing AI agent decision-making
    - Debug controls to step through gameplay
    - Visual indicators for collision detection and physics
    - State visualization for game objects
    
    Args:
        game_folder: Path to the game folder
        html_code: HTML code of the game
        js_code: JavaScript code of the game
        mechanics: Identified game mechanics
        
    Returns:
        Tuple of (debug_html_path, debug_js_path)
    """
    print("\n--- Creating Debug Version of the Game ---")
    
    # Create debug folder
    debug_folder = os.path.join(game_folder, "debug")
    os.makedirs(debug_folder, exist_ok=True)
    
    # Generate debug overlay code
    debug_overlay_prompt = (
        "You are an expert game developer. Create a debug overlay system for a JavaScript game "
        "that visualizes AI agent actions, collision detection, and game state. The overlay should:\n\n"
        "1. Display a visual indicator when the AI agent makes decisions\n"
        "2. Show collision boundaries for game objects\n"
        "3. Display the current state of game objects\n"
        "4. Include controls to pause, step through, and slow down gameplay\n"
        "5. Log game events to a console within the game\n\n"
        "The game mechanics to visualize are:\n"
        f"{mechanics}\n\n"
        "Original JavaScript Code:\n"
        f"{js_code}\n\n"
        "Create a modified version of the JavaScript code that includes the debug overlay system. "
        "The debug overlay should be toggled with the 'D' key and should not interfere with normal gameplay when disabled.\n\n"
        "Output the complete JavaScript code with debug overlay as a Markdown code block labeled with ```javascript."
    )
    
    print("Generating debug overlay code...")
    debug_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": debug_overlay_prompt}]
    )
    debug_js_code_response = debug_response.choices[0].message.content.strip()
    
    # Extract the debug JavaScript code
    js_match = re.search(r"```javascript\s*(.*?)```", debug_js_code_response, re.DOTALL)
    debug_js_code = js_match.group(1).strip() if js_match else js_code
    
    # Generate AI agent visualization code
    ai_visualization_prompt = (
        "You are an expert game developer. Create code to visualize AI agent actions in a JavaScript game. "
        "The visualization should:\n\n"
        "1. Show the AI agent's decision-making process with visual indicators\n"
        "2. Display the AI agent's current state and goals\n"
        "3. Highlight the path or trajectory the AI agent is following\n"
        "4. Show interaction points between the AI agent and other game elements\n\n"
        "The game mechanics to visualize are:\n"
        f"{mechanics}\n\n"
        "Debug JavaScript Code:\n"
        f"{debug_js_code}\n\n"
        "Enhance the debug JavaScript code to include AI agent visualization. "
        "The visualization should be part of the debug overlay system and toggled with the same controls.\n\n"
        "Output the complete enhanced JavaScript code as a Markdown code block labeled with ```javascript."
    )
    
    print("Generating AI agent visualization code...")
    ai_vis_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": ai_visualization_prompt}]
    )
    ai_vis_js_code_response = ai_vis_response.choices[0].message.content.strip()
    
    # Extract the AI visualization JavaScript code
    js_match = re.search(r"```javascript\s*(.*?)```", ai_vis_js_code_response, re.DOTALL)
    ai_vis_js_code = js_match.group(1).strip() if js_match else debug_js_code
    
    # Create debug HTML with additional UI elements
    debug_html_prompt = (
        "You are an expert game developer. Create an enhanced HTML file for a JavaScript game "
        "that includes debug UI elements. The HTML should:\n\n"
        "1. Include the original game canvas\n"
        "2. Add a debug panel with controls (pause, step, speed slider)\n"
        "3. Add a log console to display game events\n"
        "4. Add state displays for game objects\n"
        "5. Include buttons to trigger specific game events for testing\n\n"
        "Original HTML Code:\n"
        f"{html_code}\n\n"
        "Create an enhanced version of the HTML that includes these debug UI elements. "
        "The debug UI should be collapsible to allow normal gameplay.\n\n"
        "Output the complete HTML code as a Markdown code block labeled with ```html."
    )
    
    print("Generating debug HTML code...")
    debug_html_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": debug_html_prompt}]
    )
    debug_html_code_response = debug_html_response.choices[0].message.content.strip()
    
    # Extract the debug HTML code
    html_match = re.search(r"```html\s*(.*?)```", debug_html_code_response, re.DOTALL)
    debug_html_code = html_match.group(1).strip() if html_match else html_code
    
    # Update the script reference in the HTML to point to the debug JS file
    debug_html_code = debug_html_code.replace('game.js', 'game_debug.js')
    
    # Save the debug files
    debug_js_path = os.path.join(debug_folder, "game_debug.js")
    debug_html_path = os.path.join(debug_folder, "index.html")
    
    with open(debug_js_path, "w", encoding="utf-8") as f:
        f.write(ai_vis_js_code)
    
    with open(debug_html_path, "w", encoding="utf-8") as f:
        f.write(debug_html_code)
    
    # Create a README file with instructions
    readme_content = """
    # Debug Version of the Game

    This folder contains a debug version of the game with additional tools to visualize and test gameplay.

    ## Features

    - Debug overlay (toggle with 'D' key)
    - Visual indicators for AI agent actions
    - Collision boundary visualization
    - Game state display
    - Controls to pause, step through, and slow down gameplay
    - Event logging console

    ## How to Use

    1. Open `index.html` in a web browser
    2. Use the debug panel to control gameplay
    3. Toggle the debug overlay with the 'D' key
    4. View AI agent decision-making with visual indicators
    5. Use the event log to track game events
    """
    
    readme_path = os.path.join(debug_folder, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    print(f"Debug version of the game saved to '{debug_folder}'")
    print(f"- Debug JavaScript: '{debug_js_path}'")
    print(f"- Debug HTML: '{debug_html_path}'")
    print(f"- README: '{readme_path}'")
    
    return debug_html_path, debug_js_path

def test_play_debug(game_folder, html_code, js_code, game_description, character_definitions):
    """
    Simulates gameplay to identify and fix issues in the game code.
    
    This function creates an AI agent that:
    1. Analyzes the game code to understand the gameplay mechanics
    2. Simulates playing the game to identify potential issues
    3. Proposes and implements fixes for any identified issues
    
    Args:
        game_folder: Path to the game folder
        html_code: HTML code of the game
        js_code: JavaScript code of the game
        game_description: Description of the game
        character_definitions: Definitions of characters in the game
        
    Returns:
        Fixed JavaScript code
    """
    print("\n--- Starting Automated Test Play Debugging ---")
    
    # Step 1: Analyze the game code to understand mechanics
    analysis_prompt = (
        "You are an expert game tester and debugger. Analyze the following JavaScript game code and identify potential issues "
        "with gameplay mechanics, physics, or interactions. Focus on issues that would prevent the game from functioning properly.\n\n"
        "Game Description:\n"
        f"{game_description}\n\n"
        "Character Definitions:\n"
        f"{character_definitions}\n\n"
        "JavaScript Code:\n"
        f"{js_code}\n\n"
        "Provide a detailed analysis of the game mechanics and identify any potential issues with:\n"
        "1. Player controls and movement\n"
        "2. Collision detection and physics\n"
        "3. Game state management\n"
        "4. Character behaviors and AI\n"
        "5. Win/loss conditions\n"
        "6. Any logical errors or bugs in the code\n\n"
        "Format your response as a structured analysis with clear sections for each category of potential issues."
    )
    
    print("Analyzing game code for potential issues...")
    analysis_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": analysis_prompt}]
    )
    analysis = analysis_response.choices[0].message.content.strip()
    
    # Save the analysis to a file
    analysis_file = os.path.join(game_folder, "test_play_analysis.txt")
    with open(analysis_file, "w", encoding="utf-8") as f:
        f.write(analysis)
    print(f"Game analysis saved to '{analysis_file}'")
    
    # Step 2: Extract key game mechanics and controls for testing
    mechanics_prompt = (
        "Based on the game code and your analysis, identify the key game mechanics and controls that need to be tested. "
        "For each mechanic or control, provide:\n"
        "1. The specific player action or input (e.g., pressing the up arrow key)\n"
        "2. The expected game response (e.g., player character jumps)\n"
        "3. The relevant code section that handles this mechanic\n\n"
        "Game Description:\n"
        f"{game_description}\n\n"
        "JavaScript Code:\n"
        f"{js_code}\n\n"
        "Your Analysis:\n"
        f"{analysis}\n\n"
        "Format your response as a structured list of test cases, each with action, expected response, and code reference."
    )
    
    print("Extracting key game mechanics for testing...")
    mechanics_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": mechanics_prompt}]
    )
    mechanics = mechanics_response.choices[0].message.content.strip()
    
    # Save the mechanics to a file
    mechanics_file = os.path.join(game_folder, "test_play_mechanics.txt")
    with open(mechanics_file, "w", encoding="utf-8") as f:
        f.write(mechanics)
    print(f"Game mechanics saved to '{mechanics_file}'")
    
    # Create debug version of the game
    debug_html_path, debug_js_path = create_debug_version(game_folder, html_code, js_code, mechanics)
    
    # Step 3: Simulate gameplay to identify issues
    simulation_prompt = (
        "You are an AI agent that can play and test JavaScript games. Based on the game code, your analysis, and the identified mechanics, "
        "simulate playing the game and identify specific issues that would occur during gameplay.\n\n"
        "Game Description:\n"
        f"{game_description}\n\n"
        "Character Definitions:\n"
        f"{character_definitions}\n\n"
        "JavaScript Code:\n"
        f"{js_code}\n\n"
        "Your Analysis:\n"
        f"{analysis}\n\n"
        "Key Game Mechanics to Test:\n"
        f"{mechanics}\n\n"
        "Now, simulate a complete gameplay session by testing each of the identified mechanics. For each test case:\n"
        "1. Describe the specific player action you're testing\n"
        "2. Explain what should happen according to the game design\n"
        "3. Explain what actually happens when executing the code\n"
        "4. Identify any issues, bugs, or unexpected behaviors\n"
        "5. Provide the specific line numbers or code sections causing the issue\n\n"
        "After testing individual mechanics, also test complete gameplay scenarios such as:\n"
        "- Starting a new game\n"
        "- Completing a level or objective\n"
        "- Losing the game\n"
        "- Interactions between multiple game elements\n\n"
        "Format your response as a detailed test report with clear sections for each test case and scenario."
    )
    
    print("Simulating detailed gameplay to identify specific issues...")
    simulation_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": simulation_prompt}]
    )
    simulation_results = simulation_response.choices[0].message.content.strip()
    
    # Save the simulation results to a file
    simulation_file = os.path.join(game_folder, "test_play_simulation.txt")
    with open(simulation_file, "w", encoding="utf-8") as f:
        f.write(simulation_results)
    print(f"Detailed gameplay simulation results saved to '{simulation_file}'")
    
    # Step 4: Generate fixes for identified issues
    fix_prompt = (
        "You are an expert game developer tasked with fixing issues in a JavaScript game. "
        "Based on the identified issues from gameplay simulation, propose and implement fixes to the game code.\n\n"
        "Game Description:\n"
        f"{game_description}\n\n"
        "Character Definitions:\n"
        f"{character_definitions}\n\n"
        "Original JavaScript Code:\n"
        f"{js_code}\n\n"
        "Identified Issues from Gameplay Testing:\n"
        f"{simulation_results}\n\n"
        "For each issue, provide:\n"
        "1. A clear explanation of the fix\n"
        "2. The specific code changes needed (with before and after code snippets)\n"
        "3. How the fix addresses the issue\n\n"
        "Then, provide the complete fixed JavaScript code that addresses all identified issues. "
        "Make sure your fixes maintain the game's intended functionality while resolving the issues.\n\n"
        "Output the complete fixed JavaScript code as a Markdown code block labeled with ```javascript."
    )
    
    print("Generating fixes for identified issues...")
    fix_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": fix_prompt}]
    )
    fix_results = fix_response.choices[0].message.content.strip()
    
    # Extract the fixed JavaScript code
    js_match = re.search(r"```javascript\s*(.*?)```", fix_results, re.DOTALL)
    fixed_js_code = js_match.group(1).strip() if js_match else js_code
    
    # Save the fix explanation and fixed code to files
    fix_explanation_file = os.path.join(game_folder, "test_play_fixes.txt")
    with open(fix_explanation_file, "w", encoding="utf-8") as f:
        f.write(fix_results)
    print(f"Fix explanations saved to '{fix_explanation_file}'")
    
    # Save the fixed code as a separate file for comparison
    fixed_js_file = os.path.join(game_folder, "game_fixed.js")
    with open(fixed_js_file, "w", encoding="utf-8") as f:
        f.write(fixed_js_code)
    print(f"Fixed JavaScript code saved to '{fixed_js_file}'")
    
    # Create debug version of the fixed game
    fixed_debug_folder = os.path.join(game_folder, "debug_fixed")
    os.makedirs(fixed_debug_folder, exist_ok=True)
    
    # Copy the debug HTML and update it to point to the fixed debug JS
    with open(debug_html_path, "r", encoding="utf-8") as f:
        fixed_debug_html = f.read()
    
    fixed_debug_html = fixed_debug_html.replace('game_debug.js', 'game_debug_fixed.js')
    fixed_debug_html_path = os.path.join(fixed_debug_folder, "index.html")
    
    with open(fixed_debug_html_path, "w", encoding="utf-8") as f:
        f.write(fixed_debug_html)
    
    # Create debug version of the fixed game
    fixed_debug_js_path = os.path.join(fixed_debug_folder, "game_debug_fixed.js")
    _, _ = create_debug_version(fixed_debug_folder, html_code, fixed_js_code, mechanics)
    
    # Step 5: Verify the fixes with another round of gameplay simulation
    verification_prompt = (
        "You are an expert game tester. Verify that the fixes applied to the JavaScript game code properly address "
        "the identified issues without introducing new problems.\n\n"
        "Original Issues:\n"
        f"{simulation_results}\n\n"
        "Fixed JavaScript Code:\n"
        f"{fixed_js_code}\n\n"
        "For each original issue, simulate gameplay again and verify:\n"
        "1. Whether the issue has been properly fixed\n"
        "2. Whether the fix maintains the game's intended functionality\n"
        "3. Whether the fix introduces any new issues\n\n"
        "Provide a detailed verification report that includes:\n"
        "1. A summary of each original issue\n"
        "2. The specific fix applied\n"
        "3. The results of testing the fix\n"
        "4. An overall assessment of the game's playability after fixes\n\n"
        "Format your response as a structured verification report with clear sections for each issue."
    )
    
    print("Verifying fixes through gameplay simulation...")
    verification_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": verification_prompt}]
    )
    verification_results = verification_response.choices[0].message.content.strip()
    
    # Save the verification results to a file
    verification_file = os.path.join(game_folder, "test_play_verification.txt")
    with open(verification_file, "w", encoding="utf-8") as f:
        f.write(verification_results)
    print(f"Fix verification results saved to '{verification_file}'")
    
    # Step 6: Generate a final test play report
    report_prompt = (
        "Generate a comprehensive test play report for the JavaScript game. The report should include:\n\n"
        "1. Executive Summary: A brief overview of the testing process and key findings\n"
        "2. Game Overview: A description of the game and its key mechanics\n"
        "3. Testing Methodology: How the game was tested\n"
        "4. Issues Identified: A summary of all issues found during testing\n"
        "5. Fixes Implemented: A summary of all fixes applied\n"
        "6. Verification Results: Results of testing the fixed code\n"
        "7. Recommendations: Any additional recommendations for improving the game\n\n"
        "Game Description:\n"
        f"{game_description}\n\n"
        "Analysis Results:\n"
        f"{analysis}\n\n"
        "Simulation Results:\n"
        f"{simulation_results}\n\n"
        "Fix Results:\n"
        f"{fix_results}\n\n"
        "Verification Results:\n"
        f"{verification_results}\n\n"
        "Format your response as a professional test report with clear sections and headings."
    )
    
    print("Generating final test play report...")
    report_response = client.chat.completions.create(
        model=selected_openai_model,
        messages=[{"role": "user", "content": report_prompt}]
    )
    report_results = report_response.choices[0].message.content.strip()
    
    # Save the report to a file
    report_file = os.path.join(game_folder, "test_play_report.txt")
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report_results)
    print(f"Final test play report saved to '{report_file}'")
    
    # Generate HTML report
    html_report_path = generate_html_test_report(
        game_folder,
        js_code,
        fixed_js_code,
        analysis,
        mechanics,
        simulation_results,
        fix_results,
        verification_results,
        report_results
    )
    
    # Create an index.html file in the game folder that links to all versions
    index_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Game Test Play Results</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
            }}
            h1, h2 {{
                color: #2c3e50;
            }}
            .container {{
                display: flex;
                flex-direction: column;
                gap: 20px;
            }}
            .section {{
                background-color: #f9f9f9;
                border-radius: 5px;
                padding: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .button {{
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 5px;
            }}
            .button:hover {{
                background-color: #45a049;
            }}
        </style>
    </head>
    <body>
        <h1>Game Test Play Results</h1>
        
        <div class="container">
            <div class="section">
                <h2>Game Versions</h2>
                <p>Play different versions of the game:</p>
                <a href="index.html" class="button">Play Final Game</a>
                <a href="intermediate/index_intermediate_R0.html" class="button">Play Original Game</a>
                <a href="debug/index.html" class="button">Play Debug Version (Original)</a>
                <a href="debug_fixed/index.html" class="button">Play Debug Version (Fixed)</a>
            </div>
            
            <div class="section">
                <h2>Test Play Reports</h2>
                <p>View the test play reports:</p>
                <a href="test_play_report.html" class="button">Interactive Test Report</a>
                <a href="test_play_report.txt" class="button">Text Test Report</a>
            </div>
            
            <div class="section">
                <h2>Game Files</h2>
                <p>View the game files:</p>
                <a href="game.js" class="button">Final Game Code</a>
                <a href="game_fixed.js" class="button">Fixed Game Code</a>
                <a href="intermediate/game_intermediate_R0.js" class="button">Original Game Code</a>
            </div>
        </div>
    </body>
    </html>
    """
    
    index_path = os.path.join(game_folder, "test_results.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"Test results index saved to '{index_path}'")
    
    print("--- Automated Test Play Debugging Completed ---\n")
    
    return fixed_js_code

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
        
    # Ask about test play debugging upfront
    enable_test_play_input = input("Enable automated test play debugging after each round? (yes/no): ").strip().lower()
    enable_test_play = enable_test_play_input in ["yes", "y"]
    
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
        
        if enable_test_play:
            print("\n=== Automated Test Play Debugging Will Be Run After Each Round ===")
            print("This process will analyze the game code, simulate gameplay, identify issues, and implement fixes")
            print("after each round of the debate. The results will be saved in the game folder.")
            print("The debugged version from each round will be used as the starting point for the next round.")
            print("This ensures that the game is continuously tested and improved throughout development.")
        
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
        
        # If automated testing wasn't enabled during debate, offer to run it on the final version
        if not enable_test_play:
            final_test_input = input("Run automated test play debugging on the final game version? (yes/no): ").strip().lower()
            if final_test_input in ["yes", "y"]:
                print("\n=== Starting Automated Test Play Debugging on Final Version ===")
                print("This process will analyze the game code, simulate gameplay, identify issues, and implement fixes.")
                print("The results will be saved in the game folder along with debug versions of the game.")
                
                debugged_js_code = test_play_debug(
                    game_folder,
                    html_code,
                    improved_js_code,
                    final_description,
                    character_definitions
                )
                
                # Ask if the user wants to use the debugged code for the final rendering
                use_debugged_code_input = input("Use the debugged code for the final game? (yes/no): ").strip().lower()
                if use_debugged_code_input in ["yes", "y"]:
                    print("Using debugged code for final rendering...")
                    improved_js_code = debugged_js_code
                else:
                    print("Using original improved code for final rendering...")
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
        
        # If test play debugging was enabled, provide links to all the test results
        if enable_test_play:
            test_rounds_path = os.path.join(game_folder, "test_rounds", "index.html")
            summary_path = os.path.join(game_folder, "test_rounds_summary.md")
            
            print("\n=== Game Development Process Summary ===")
            print(f"A complete record of the game development process is available at:")
            print(f"- Interactive view of all rounds: {test_rounds_path}")
            print(f"- Text summary: {summary_path}")
            print("\nEach round includes:")
            print("- Original and debugged versions of the game")
            print("- Detailed test reports with issues found and fixes applied")
            print("- Visual debug tools for analyzing gameplay")
            
            # Create an overall summary file for the project
            project_summary = f"""
            # {genre} Game Development Project
            
            ## Overview
            
            - Genre: {genre}
            - Number of Agents: {num_agents}
            - Controllable Agents: {num_controllable_agents}
            - Development Rounds: {num_rounds}
            
            ## Game Description
            
            {final_description}
            
            ## Development Process
            
            This game was developed through an iterative process of:
            
            1. Initial game generation
            2. Multi-agent debate to improve the game
            3. Automated testing after each round
            4. Bug fixing and gameplay improvements
            
            ## Results
            
            - [Play the Final Game](index.html)
            - [View All Development Rounds](test_rounds/index.html)
            - [View Development Summary](test_rounds_summary.md)
            
            ## Testing
            
            Each version of the game underwent automated testing to identify and fix issues with:
            
            - Player controls and movement
            - Collision detection and physics
            - Game state management
            - Character behaviors and AI
            - Win/loss conditions
            
            ## Final Notes
            
            The final game incorporates all improvements and fixes from the development process.
            """
            
            project_summary_path = os.path.join(game_folder, "README.md")
            with open(project_summary_path, "w", encoding="utf-8") as f:
                f.write(project_summary)
                
            print(f"\nA project README has been created at: {project_summary_path}")
    else:
        print("Failed to parse rendering code block from API response.")
        with open(os.path.join(game_folder, "full_rendering_output.txt"), "w", encoding="utf-8") as f:
            f.write(rendering_response)
        print("Saved full API rendering response to 'full_rendering_output.txt'.")

if __name__ == "__main__":
    main() 