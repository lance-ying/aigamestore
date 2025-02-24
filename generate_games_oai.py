#!/usr/bin/env python3
"""
This script generates a playable p5.js game embedded in a webpage. 
It uses LangChain to construct a structured prompt and the OpenAI API (o3-mini-high) 
to generate two code blocks:
    - index.html: HTML code that loads p5.js from a CDN and references game.js.
    - game.js: The p5.js game JavaScript code.

Before running, ensure that the environment variable OPENAI_API_KEY is set.
"""

import os
import re
from openai import OpenAI
import glob
import random
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
selected_openai_model = "o3-mini"  # Default OpenAI model
from langchain.prompts import PromptTemplate


def generate_prompt(genre, num_agents, actions, objectives):
    """
    Constructs a structured prompt using LangChain's PromptTemplate.
    The prompt instructs the model to generate two code blocks:
      - HTML (index.html) with p5.js CDN and a script tag referencing game.js.
      - JavaScript (game.js) with a playable p5.js game.
    """
    template = (
        "You are to generate a JavaScript game using p5.js. The game must be playable on a basic HTML webpage.\n"
        "Game details:\n"
        "- Genre: {genre}\n"
        "- Total number of agents: {num_agents}\n"
        "- Number of controllable agents: 1\n"
        "- Actions available for each controllable agent: {actions}\n"
        "- No audio should be used in the game.\n"
        "- Objectives (success and failure conditions): {objectives}\n"
        "- Allow the AI to automatically define the characters (names and roles) if not specified.\n"
        "- DECOUPLE GAME DYNAMICS AND RENDERING: The game should be separated into two modules:\n"
        "    a) Dynamics Module: Define a game state that includes the state of each agent and the environment. Implement probabilistic policy functions for each non-human agent and the environment so that the behavior and game state change with every playthrough.\n"
        "    b) Rendering Module: Create a function that uses p5.js to render the current game state. This module should be easily enabled or disabled to allow iterative improvements to aesthetics independently.\n\n"
        "Please output your answer as two Markdown code blocks with language tags, exactly as follows:\n"
        "1. The first code block should be labeled with ```html and contain the full HTML code (index.html) that loads the p5.js library (e.g., from a CDN) and includes a <script> tag referencing 'game.js'.\n"
        "2. The second code block should be labeled with ```javascript and contain the complete JavaScript code (game.js) for the p5.js game, including both the decoupled dynamics and rendering modules.\n\n"
        "Ensure that when the HTML file is opened in a browser, the game runs correctly."
    )
    prompt = PromptTemplate(
        input_variables=["genre", "num_agents", "actions", "objectives"],
        template=template,
    )
    return prompt.format(
        genre=genre, num_agents=num_agents, actions=actions, objectives=objectives
    )


def generate_game_code(prompt):
    """
    Calls the OpenAI API (using model "o3-mini") with the provided prompt
    to generate the game code.
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
    # Determine the next available game folder inside "games"
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
    # Create an intermediate folder inside the game folder.
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
    The JS file is saved as "game_intermediate_R{round_number}.js" and 
    the corresponding HTML file as "index_intermediate_R{round_number}.html".
    """
    # Save the intermediate files inside the "intermediate" subfolder of game_folder.
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


def sample_objectives(initial_game_description):
    """
    Uses the o3-mini model to sample game objectives if none are provided,
    using the provided initial game description as context.
    """
    sample_prompt = (
        f"Based on the following game description: {initial_game_description}\n"
        "Provide a set of criteria for success and failure conditions for a JavaScript game. "
        "They should be engaging, clear, and challenging."
    )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": sample_prompt}]
    )
    return response.choices[0].message.content.strip()


def sample_initial_game_description(genre, num_agents):
    """
    Uses the o3-mini model to sample an initial game description for the game if none is provided,
    conditioned on the game genre and the number of agents.
    """
    sample_prompt = (
        f"Provide a minimal initial game description for a {genre} JavaScript game with {num_agents} characters, where only one character will be controlled by a human player. "
        f"Define each of the {num_agents} characters along with their roles. The description can be short and direct; for example: "
        f"'Generate a {genre} game with {num_agents} characters. Only one player will be controlled by a human player. The characters are: [Character 1: ...; Character 2: ...; ...]'."
    )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": sample_prompt}]
    )
    return response.choices[0].message.content.strip()


def simulate_debate(game_folder, html_code, js_code, initial_game_description, objectives, num_agents, rounds=3, allow_description_update=True):
    """
    Implements an iterative multi-agent debate.
    Saves the intermediate game files for round 0 (initial version) and after each debate round.
    Returns the final improved JavaScript game code.
    """
    current_js = js_code
    current_description = initial_game_description
    debate_log = ""

    # Save the initial game version as round 0.
    save_intermediate_files(game_folder, html_code, current_js, 0)

    for r in range(1, rounds+1):
         print(f"--- Round {r} ---")
         proposals = []  # Collect controlled proposals from agents in natural language.

         # Environment Agent policy.
         env_proposal, updated_description = environment_agent_policy(current_js, current_description, objectives, r, allow_description_update)
         proposals.append(f"Environment Agent: {env_proposal}")
         if allow_description_update and updated_description is not None and updated_description != "":
              current_description = updated_description

         # Character Agents policies.
         for i in range(1, num_agents):
              char_proposal, _ = character_agent_policy(i, current_js, current_description, objectives, r)
              proposals.append(f"Character Agent {i}: {char_proposal}")

         round_log = f"Round {r} proposals:\n" + "\n".join(proposals) + "\n"
         debate_log += round_log
         print(f"--- End of Round {r} ---\n")

         # Aggregate all proposals and update the game code in one go.
         current_js = apply_proposals(proposals, current_js)

         # Save intermediate game version for this round.
         save_intermediate_files(game_folder, html_code, current_js, r)

    print("\n--- Complete Debate Log ---")
    print(debate_log)
    print("--- End of Debate Log ---\n")
    print("\n--- Final Updated Game Description ---")
    print(current_description)
    print("--- End of Final Updated Game Description ---\n")
    return current_js


def environment_agent_policy(current_js, current_description, objectives, round_number, allow_description_update=True):
    """
    Queries the Environment Agent's policy.
    Focus on controlled proposals to improve gameplay mechanics, user engagement, and overall experience.
    If improvements to the game description are suggested (and allowed), include an 'Updated Game Description:' section.
    Returns a tuple: (proposal, updated_game_description)
    """
    if allow_description_update:
         desc_instruction = "If you want to update the game description, include an 'Updated Game Description:' section with your proposed new game description; otherwise, leave it blank. No Sounds."
    else:
         desc_instruction = "Do NOT update the game description; only propose improvements to gameplay mechanics and user engagement."

    prompt = (
         f"Round {round_number}, as the Environment Agent, review the current game state and game description below.\n"
         "Your task is to propose controlled improvements to enhance game mechanics and user engagement. "
         "Do not output code; provide only natural language proposals. "
         f"{desc_instruction}\n"
         "Game Code:\n---------------------------\n"
         f"{current_js}\n---------------------------\n"
         "Game Description:\n"
         f"{current_description}\n"
         "Objectives:\n"
         f"{objectives}\n"
         "Your proposal:"
    )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": prompt}]
    )
    resp_text = response.choices[0].message.content.strip()
    updated_description = None
    match = re.search(r"Updated Game Description:\s*(.*)", resp_text, re.IGNORECASE)
    if allow_description_update and match:
         candidate = match.group(1).strip()
         if candidate:
              updated_description = candidate
    return resp_text, updated_description


def character_agent_policy(agent_index, current_js, current_description, objectives, round_number):
    """
    Queries the policy for a specific Character Agent.
    Focus on suggestions to improve the part of the game code controlling the agent.
    Returns a proposal in natural language.
    """
    prompt = (
         f"Round {round_number}, as Character Agent {agent_index}, review the current game state and game description below.\n"
         "Your task is to propose controlled improvements for the section of the game code managing your character. "
         "Provide only natural language suggestions; do not output any code.\n"
         "Game Code:\n---------------------------\n"
         f"{current_js}\n---------------------------\n"
         "Game Description:\n"
         f"{current_description}\n"
         "Objectives:\n"
         f"{objectives}\n"
         "Your proposal:"
    )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": prompt}]
    )
    resp_text = response.choices[0].message.content.strip()
    return resp_text, None


def apply_proposals(proposals, current_js):
    """
    Given a list of proposals (natural language suggestions) and the current JavaScript code,
    queries the AI model to apply all these changes in one go.
    """
    proposals_text = "\n".join([f"{i+1}. {p}" for i, p in enumerate(proposals)])
    prompt = (
         "Below is the current JavaScript game code and a list of proposals from various agents on how to improve it:\n\n"
         "Current Code:\n"
         "---------------------------\n"
         f"{current_js}\n"
         "---------------------------\n\n"
         "Proposals:\n"
         f"{proposals_text}\n\n"
         "Please apply all these proposals to the code and produce the updated JavaScript game code in a markdown code block using the language tag \"```javascript\". "
         "Only output the updated code in that code block, without any additional commentary."
    )
    response = client.chat.completions.create(
         model="o3-mini",
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
    # Create the intermediate subfolder.
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


def main():
    # List of valid genres
    valid_genres = [
        "Arcade",
        "Platformer",
        "Puzzle",
        "Shooter",
        "Racing",
        "Strategy",
        "Simulation",
        "Adventure",
        "Action",
        "Fighting",
        "Sports",
        "Survival",
        "Stealth",
        "RTS",
        "Tower Defense",
        "Turn-Based",
        "Card Game",
    ]
    print("Select a game genre from the following list:")
    for valid_genre in valid_genres:
        print(f"- {valid_genre}")
    genre = input("Enter game genre: ").strip()
    if genre == "":
        # Choose a random genre from the list.
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

    # Prompt the user for actions for each controllable agent.
    actions_input = input("Enter actions for each controllable agent (or press Enter to use default 'arrow keys, space bar, w, a, s, d'): ").strip()
    actions = actions_input if actions_input else "arrow keys, space bar, w, a, s, d"
    initial_game_description = input("Enter an initial game description for the game: ").strip()
    if initial_game_description == "":
         print("No initial game description provided. Using default game description.")
         initial_game_description = f"Generate a {genre} game with {num_agents} characters. Only one player will be controlled by a human player. The characters are: [Character 1: ...; Character 2: ...; ...]."
    objectives = input("Enter objectives for success and failure conditions: ").strip()
    if objectives == "":
         print("No objectives provided. Sampling objectives from AI using the game description as context...")
         objectives = sample_objectives(initial_game_description)

    update_desc_input = input("Allow game description updates during debate? (yes/no): ").strip().lower()
    allow_description_update_flag = update_desc_input in ["yes", "y"]

    # Generate the structured prompt using LangChain
    prompt = generate_prompt(genre, num_agents, actions, objectives)
    print("\n--- Generated Prompt ---")
    print(prompt)
    print("--- End of Prompt ---\n")

    # Ensure the API key is set.
    if not client.api_key:
         print("Error: OPENAI_API_KEY environment variable is not set.")
         return

    # Select the OpenAI model to use.
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

    print("Generating game code from OpenAI API...")
    game_response = generate_game_code(prompt)
    print("Received response from API.")
    num_rounds = int(input("Enter number of debate rounds (default 3): ").strip())
    # Attempt to parse the HTML and JavaScript code blocks
    html_code, js_code = parse_code_blocks(game_response)
    if html_code and js_code:
         # Create a new game folder.
         game_folder = create_game_folder()
         # Simulate a multi-agent debate for 3 rounds to improve the game code.
         improved_js_code = simulate_debate(game_folder, 
                                            html_code, 
                                            js_code, 
                                            initial_game_description, 
                                            objectives, 
                                            num_agents, 
                                            rounds=num_rounds, 
                                            allow_description_update=allow_description_update_flag)
         # Save final game files in the existing game folder.
         save_final_files(game_folder, html_code, improved_js_code)
    else:
         print("Failed to parse code blocks from the API response.")
         with open("full_game_output.txt", "w", encoding="utf-8") as f:
              f.write(game_response)
         print("Saved full API response to 'full_game_output.txt'.")


if __name__ == "__main__":
    main()