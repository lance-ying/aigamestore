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
        "- Objectives (success and failure conditions): {objectives}\n\n"
        "Please output your answer as two Markdown code blocks with language tags, exactly as follows:\n"
        "1. The first code block should be labeled with ```html and contain the full HTML code (index.html) that loads the p5.js library (e.g., from a CDN) and includes a <script> tag referencing 'game.js'.\n"
        "2. The second code block should be labeled with ```javascript and contain the complete JavaScript code (game.js) for the p5.js game.\n\n"
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
        model="o3-mini",
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
    # Determine the next available game file index based on existing files.
    js_files = glob.glob("game_*.js")
    next_index = 1
    if js_files:
        indices = []
        for file in js_files:
            try:
                idx = int(file.split('_')[1].split('.')[0])
                indices.append(idx)
            except Exception:
                continue
        if indices:
            next_index = max(indices) + 1

    new_js_filename = f"game_{next_index}.js"
    new_html_filename = f"index_{next_index}.html"

    # Update the HTML code to reference the correct new JS file.
    new_html_code = html_code.replace("game.js", new_js_filename)

    with open(new_html_filename, "w", encoding="utf-8") as html_file:
        html_file.write(new_html_code)
    with open(new_js_filename, "w", encoding="utf-8") as js_file:
        js_file.write(js_code)
    print(f"Files '{new_html_filename}' and '{new_js_filename}' have been saved.")
    update_games_index()


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


def sample_objectives():
    """
    Uses the o3-mini model to sample game objectives if none are provided.
    """
    sample_prompt = (
        "Provide a set of criteria for success and failure conditions for a JavaScript game. "
        "They should be engaging, clear, and challenging."
    )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": sample_prompt}]
    )
    return response.choices[0].message.content.strip()


def sample_initial_story():
    """
    Uses the o3-mini model to sample an initial story for the game if none is provided.
    """
    sample_prompt = (
        "Provide an initial story for a JavaScript game. It should be epic, engaging, and set the stage for an adventure."
    )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": sample_prompt}]
    )
    return response.choices[0].message.content.strip()


def simulate_debate(js_code, initial_story, objectives, num_agents, rounds=2):
    """
    Simulates a multi-agent debate to improve the game JavaScript code.
    
    Participants:
      - Environment Agent: Responsible for overall task adjustments, environmental changes, and high-level story improvements.
      - Character Agents: For each non-controllable character (total of num_agents - 1), each agent is responsible for improving only the code that controls that specific character.

    For context, include the following:
      - Initial Story: The starting narrative of the game.
      - Objectives: The success and failure conditions.

    Each agent may only modify the parts of the code within their respective domain.
    Simulate a debate over at most `rounds` rounds.
    After the debate, output only the final improved game JavaScript code in a single Markdown code block labeled "```javascript".
    """
    # Implement iterative multi-agent debate.
    current_js = js_code
    current_story = initial_story
    debate_log = ""
    for r in range(1, rounds+1):
         print(f"--- Round {r} ---")
         # Environment Agent proposal.
         updated_js, agent_log, updated_story = get_agent_proposal("Environment Agent", current_js, current_story, objectives, r)
         current_js = updated_js
         if updated_story is not None and updated_story != "":
             current_story = updated_story
         round_log = f"Round {r} - Environment Agent:\n{agent_log}\n"
         debate_log += round_log

         # For each Character Agent, if any (num_agents - 1).
         for i in range(1, num_agents):
             agent_name = f"Character Agent {i}"
             updated_js, agent_log, _ = get_agent_proposal(agent_name, current_js, current_story, objectives, r)
             current_js = updated_js
             round_log = f"Round {r} - {agent_name}:\n{agent_log}\n"
             debate_log += round_log
         print(f"--- End of Round {r} ---\n")
    print("\n--- Complete Debate Log ---")
    print(debate_log)
    print("--- End of Debate Log ---\n")
    print("\n--- Final Updated Story ---")
    print(current_story)
    print("--- End of Final Updated Story ---\n")
    return current_js


def get_agent_proposal(agent_name, current_js, current_story, objectives, round_number):
    """
    Queries a single agent for its proposal. Depending on the agent type, the prompt is customized.
    Returns a tuple: (updated_js, log_entry, updated_story) – updated_story is only provided by the Environment Agent.
    """
    if agent_name == "Environment Agent":
         prompt = (
             f"Round {round_number}, you are {agent_name}.\n"
             "Your task is to propose improvements to the overall game environment and narrative.\n"
             "The current game JavaScript code is as follows:\n"
             "---------------------------\n"
             f"{current_js}\n"
             "---------------------------\n"
             "The current narrative is as follows:\n"
             f"{current_story}\n"
             "The game objectives are:\n"
             f"{objectives}\n"
             "Please propose your improvements. Provide your answer in the following format:\n"
             "Changed Code: <summary of changes>\n"
             "Explanation: <explanation for the changes>\n"
             "Updated Story: <if you update the narrative, provide the new story, otherwise leave blank>\n"
             "Final Code: Output the complete updated game JavaScript code in a markdown code block using the language tag \"```javascript\".\n"
             "Do not include any additional commentary."
         )
    else:
         prompt = (
             f"Round {round_number}, you are {agent_name}.\n"
             "Your task is to propose improvements for the part of the game code controlling your character.\n"
             "The current game JavaScript code is as follows:\n"
             "---------------------------\n"
             f"{current_js}\n"
             "---------------------------\n"
             "The current narrative is as follows:\n"
             f"{current_story}\n"
             "The game objectives are:\n"
             f"{objectives}\n"
             "Please propose your improvements. Provide your answer in the following format:\n"
             "Changed Code: <summary of changes>\n"
             "Explanation: <explanation for the changes>\n"
             "Final Code: Output the complete updated game JavaScript code in a markdown code block using the language tag \"```javascript\".\n"
             "Do not include any additional commentary."
         )
    response = client.chat.completions.create(
         model="o3-mini",
         messages=[{"role": "user", "content": prompt}]
    )
    resp_text = response.choices[0].message.content
    # Extract the final updated code block from the response.
    code_match = re.search(r"Final Code:\s*```javascript\s*(.*?)```", resp_text, re.DOTALL)
    updated_code = code_match.group(1).strip() if code_match else current_js
    # Extract the log entry details.
    log_match = re.search(r"Changed Code:\s*(.*?)Explanation:", resp_text, re.DOTALL)
    changed_summary = log_match.group(1).strip() if log_match else "No summary provided."
    explanation_match = re.search(r"Explanation:\s*(.*?)((Updated Story:)|(Final Code:))", resp_text, re.DOTALL)
    explanation = explanation_match.group(1).strip() if explanation_match else "No explanation provided."
    log_entry = f"Changed Code: {changed_summary}\nExplanation: {explanation}"
    # For Environment Agent, try to extract the updated story.
    updated_story = None
    if agent_name == "Environment Agent":
         story_match = re.search(r"Updated Story:\s*(.*?)Final Code:", resp_text, re.DOTALL)
         if story_match:
             candidate = story_match.group(1).strip()
             if candidate:
                 updated_story = candidate
    return (updated_code, log_entry, updated_story)


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

    # Fixed actions for each agent
    actions = "arrow keys, space bar, w, a, s, d"
    objectives = input("Enter objectives for success and failure conditions: ").strip()
    if objectives == "":
         print("No objectives provided. Sampling objectives from AI...")
         objectives = sample_objectives()
    initial_story = input("Enter an initial story for the game: ").strip()
    if initial_story == "":
         print("No initial story provided. Sampling initial story from AI...")
         initial_story = sample_initial_story()

    # Generate the structured prompt using LangChain
    prompt = generate_prompt(genre, num_agents, actions, objectives)
    print("\n--- Generated Prompt ---")
    print(prompt)
    print("--- End of Prompt ---\n")

    # Ensure the API key is set. The client object was initialized with the OPENAI_API_KEY.
    if not client.api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.")
        return

    print("Generating game code from OpenAI API...")
    game_response = generate_game_code(prompt)
    print("Received response from API.")

    # Attempt to parse the HTML and JavaScript code blocks
    html_code, js_code = parse_code_blocks(game_response)
    if html_code and js_code:
        # Simulate a multi-agent debate for at most 5 rounds to improve the game code.
        improved_js_code = simulate_debate(js_code, initial_story, objectives, num_agents, rounds=5)
        save_files(html_code, improved_js_code)
    else:
        print("Failed to parse code blocks from the API response.")
        # As a fallback, save the full response to a text file
        with open("full_game_output.txt", "w", encoding="utf-8") as f:
            f.write(game_response)
        print("Saved full API response to 'full_game_output.txt'.")


if __name__ == "__main__":
    main() 