#!/usr/bin/env python3
"""
This script generates a playable p5.js game embedded in a webpage.
It uses a structured prompt to generate two code blocks using either the OpenAI API (o3-mini) or a Hugging Face model (such as LLama, WizardLM, Mistral, etc.).
Before running, ensure that:
  - The environment variable OPENAI_API_KEY is set if using OpenAI.
  - Hugging Face transformers are installed if using a Hugging Face model.
  
The generated games (and all intermediate versions from debate rounds) are organized in the "games" folder,
with each game having its own folder.
"""

import os
import re
import glob
import random
import time
from openai import OpenAI
from langchain.prompts import PromptTemplate

# Global model selection variables
selected_model_type = None  # "openai" or "huggingface"
selected_model_name = None  # if using Hugging Face, the model identifier
hf_pipeline_instance = None

# Initialize OpenAI client if using OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# If using Hugging Face, we will import and initialize the pipeline later
try:
    from transformers import pipeline
except ImportError:
    pipeline = None

###############################
# Model-completion abstraction
###############################
def get_completion(prompt, messages=None):
    """
    Returns the generated completion text using the chosen model.
    For OpenAI, uses chat completions (o3-mini).
    For Hugging Face models, uses the text-generation pipeline.
    """
    global selected_model_type, hf_pipeline_instance
    if selected_model_type == "openai":
        response = client.chat.completions.create(
            model="o3-mini",
            messages=(messages if messages else [{"role": "user", "content": prompt}])
        )
        return response.choices[0].message.content.strip()
    else:
        # Using Hugging Face model. Assume hf_pipeline_instance has been initialized.
        # We use do_sample=True to allow some variability.
        output = hf_pipeline_instance(prompt, max_length=1024, do_sample=True)
        return output[0]['generated_text'].strip()

###############################
# Prompt and Code Generation
###############################
def generate_prompt(genre, num_agents, actions, objectives):
    """
    Constructs a structured prompt using LangChain's PromptTemplate.
    The prompt instructs the model to generate two code blocks:
      - HTML (index.html) with a p5.js CDN and a script tag referencing game.js.
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
        "    a) Dynamics Module: Define a game state that includes the state of each agent and the environment. "
        "Implement probabilistic policy functions for each non-human agent and the environment so that the behavior "
        "and game state change with every playthrough.\n"
        "    b) Rendering Module: Create a function that uses p5.js to render the current game state. This module "
        "should be easily enabled or disabled to allow iterative improvements to aesthetics independently.\n\n"
        "Please output your answer as two Markdown code blocks with language tags, exactly as follows:\n"
        "1. The first code block should be labeled with ```html and contain the full HTML code (index.html) that loads "
        "the p5.js library (e.g., from a CDN) and includes a <script> tag referencing 'game.js'.\n"
        "2. The second code block should be labeled with ```javascript and contain the complete JavaScript code (game.js) "
        "for the p5.js game, including both the decoupled dynamics and rendering modules.\n\n"
        "Ensure that when the HTML file is opened in a browser, the game runs correctly."
    )
    prompt_template = PromptTemplate(
        input_variables=["genre", "num_agents", "actions", "objectives"],
        template=template,
    )
    return prompt_template.format(
        genre=genre, num_agents=num_agents, actions=actions, objectives=objectives
    )


def generate_game_code(prompt):
    """
    Generates the game code by calling the chosen model with the given prompt.
    """
    return get_completion(prompt, messages=[{"role": "user", "content": prompt}])

    
def parse_code_blocks(response_text):
    """
    Extracts the HTML and JavaScript code blocks from the model's response text.
    Assumes the response contains Markdown code blocks labeled "html" and "javascript".
    """
    html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
    js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)
    html_code = html_match.group(1).strip() if html_match else None
    js_code = js_match.group(1).strip() if js_match else None
    return html_code, js_code

#########################################
# Saving and Organizing Generated Game Files
#########################################
def save_files(html_code, js_code):
    """
    Saves the HTML and JavaScript code blocks in a new game folder under "games".
    Also updates the central index.
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
    Updates (or creates) a central HTML index that lists all game HTML files,
    organized from the "games" folder.
    """
    os.makedirs("games", exist_ok=True)
    index_files = []
    # search in games/ for subfolders with index.html
    for root, dirs, files in os.walk("games"):
        for file in files:
            if file.startswith("index") and file.endswith(".html"):
                rel_path = os.path.join(root, file)
                index_files.append(rel_path)
    def get_index(fname):
        try:
            return int(os.path.basename(fname).split('_')[1].split('.')[0])
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
    index_path = os.path.join("games", "games_index.html")
    with open(index_path, "w", encoding="utf-8") as f:
         f.write(central_html)
    print(f"Central index '{index_path}' has been updated.")


def save_intermediate_files(game_folder, html_code, js_code, round_number):
    """
    Saves the intermediate game files for a given debate round inside the game folder.
    The JS file is saved as "game_intermediate_R{round_number}.js" and the corresponding HTML file
    as "index_intermediate_R{round_number}.html".
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


######################################
# Agent Policy Functions for Debate
######################################
def environment_agent_policy(current_js, current_description, objectives, round_number, allow_description_update=True):
    """
    Queries the Environment Agent's policy.
    Focus on controlled proposals to improve gameplay mechanics and user engagement.
    If allowed and suggested, include an 'Updated Game Description:' section.
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
    resp_text = get_completion(prompt, messages=[{"role": "user", "content": prompt}])
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
    resp_text = get_completion(prompt, messages=[{"role": "user", "content": prompt}])
    return resp_text, None


def apply_proposals(proposals, current_js):
    """
    Given a list of natural language proposals and the current JavaScript code,
    queries the model to apply all these changes in one go.
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
    resp_text = get_completion(prompt, messages=[{"role": "user", "content": prompt}])
    code_match = re.search(r"```javascript\s*(.*?)```", resp_text, re.DOTALL)
    updated_code = code_match.group(1).strip() if code_match else current_js
    return updated_code


def sample_objectives(initial_game_description):
    """
    Uses the model to sample game objectives if none are provided,
    using the provided initial game description as context.
    """
    sample_prompt = (
        f"Based on the following game description: {initial_game_description}\n"
        "Provide a set of criteria for success and failure conditions for a JavaScript game. "
        "They should be engaging, clear, and challenging."
    )
    return get_completion(sample_prompt, messages=[{"role": "user", "content": sample_prompt}])
    

def sample_initial_game_description(genre, num_agents):
    """
    Uses the model to sample an initial game description for the game if none is provided,
    conditioned on the game genre and the number of agents.
    """
    sample_prompt = (
        f"Provide a minimal initial game description for a {genre} JavaScript game with {num_agents} characters, where only one character will be controlled by a human player. "
        f"Define each of the {num_agents} characters along with their roles. The description can be short and direct; for example: "
        f"'Generate a {genre} game with {num_agents} characters. Only one player will be controlled by a human player. The characters are: [Character 1: ...; Character 2: ...; ...]'."
    )
    return get_completion(sample_prompt, messages=[{"role": "user", "content": sample_prompt}])
    

##########################################
# Debate Simulation: Iterative Multi-Agent Debate
##########################################
def simulate_debate(html_code, js_code, initial_game_description, objectives, num_agents, rounds=3, allow_description_update=True):
    """
    Implements an iterative multi-agent debate.
    Saves the intermediate game files for round 0 (initial version) and after each debate round.
    Returns the final improved JavaScript game code.
    """
    current_js = js_code
    current_description = initial_game_description
    debate_log = ""

    # Create a directory for this game
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

    # Save the initial game version as round 0.
    save_intermediate_files(game_folder, html_code, current_js, 0)

    for r in range(1, rounds+1):
         print(f"--- Round {r} ---")
         proposals = []  # Collect proposals from agents as natural language.

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

         # Aggregate proposals and update the code.
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

##########################################
# Main Function
##########################################
def main():
    # Model selection:
    print("Select a model for code generation:")
    print("- 1: OpenAI (o3-mini)")
    print("- 2: Hugging Face (e.g., LLama, WizardLM, Mistral, etc.)")
    model_choice = input("Enter your choice (1 or 2): ").strip()
    global selected_model_type, selected_model_name, hf_pipeline_instance
    
    if model_choice == "1":
         selected_model_type = "openai"
         print("Using OpenAI model (o3-mini).")
    elif model_choice == "2":
         selected_model_type = "huggingface"
         # List some options for Hugging Face models
         hf_options = [
             "Llama-2-7b-chat", "WizardLM-7B", "mistral-7B", "Llama-2-13b-chat"
         ]
         print("Select a Hugging Face model from the following options:")
         for idx, opt in enumerate(hf_options, 1):
             print(f"- {idx}: {opt}")
         try:
             hf_choice = int(input("Enter your choice (number): ").strip())
             selected_model_name = hf_options[hf_choice - 1]
         except Exception:
             print("Invalid selection. Defaulting to Llama-2-7b-chat.")
             selected_model_name = "Llama-2-7b-chat"
         if pipeline is None:
             print("Error: transformers library is not installed.")
             return
         print(f"Using Hugging Face model: {selected_model_name}")
         hf_pipeline_instance = pipeline("text-generation", model=selected_model_name)
    else:
         print("Invalid choice. Exiting.")
         return

    # List of valid genres
    valid_genres = [
        "Arcade", "Platformer", "Puzzle", "Shooter", "Racing",
        "Strategy", "Simulation", "Adventure", "Action", "Fighting",
        "Sports", "Survival", "Stealth", "RTS", "Tower Defense",
        "Turn-Based", "Card Game",
    ]
    print("\nSelect a game genre from the following list:")
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

    # Ensure API key is set if using OpenAI
    if selected_model_type == "openai" and not client.api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.")
        return

    print("Generating game code from the selected model...")
    game_response = generate_game_code(prompt)
    print("Received response from model.")

    # Parse HTML and JavaScript code from the response
    html_code, js_code = parse_code_blocks(game_response)
    if html_code and js_code:
         # Simulate a multi-agent debate for 3 rounds to improve the game code.
         improved_js_code = simulate_debate(html_code, js_code, initial_game_description, objectives, num_agents, rounds=3, allow_description_update=allow_description_update_flag)
         game_folder = save_files(html_code, improved_js_code)
    else:
         print("Failed to parse code blocks from the model response.")
         with open("full_game_output.txt", "w", encoding="utf-8") as f:
             f.write(game_response)
         print("Saved full model response to 'full_game_output.txt'.")

if __name__ == "__main__":
    main() 