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


def generate_prompt(genre, num_agents, actions):
    """
    Constructs a structured prompt using LangChain's PromptTemplate.
    The prompt instructs the model to generate two code blocks:
      - HTML (index.html) with p5.js CDN and a script tag referencing game.js.
      - JavaScript (game.js) with a playable p5.js game.
    """
    template = (
        "Generate a interesting engaging continual {genre} game with intelligent{num_agents} agents using p5.js. The game must be playable on a basic HTML webpage.\n"
        "Game details:\n"
        "- Genre: {genre}\n"
        "- Total number of agents: {num_agents}\n"
        "- Number of controllable agents: 1\n"
        "- Actions available for each controllable agent: {actions}\n"
        "- Decide the state of the game and the state of each agent with variables and their types ranges.\n"
        "- Decide the objectives for success and failure conditions and the rewards for each agent.\n"
        "- Decide the random initial conditions of the game and the initial state of each agent for each restart of the game.\n"
        "- On success or failure, the game should be over with a message to the human player in the game window.\n"
        "- The gameplay should be engaging and interesting and should look aesthetically pleasing.\n"
        "- Mention the name of the game and the actions in the html above the game canvas.\n"
        "- No audio should be used.\n"
        # "- Objectives (success and failure conditions): {objectives}\n\n"
        "Please output your answer as two Markdown code blocks with language tags, exactly as follows:\n"
        "1. The first code block should be labeled with ```html and contain the full HTML code (index.html) that loads the p5.js library (e.g., from a CDN) and includes a <script> tag referencing 'game.js'.\n"
        "2. The second code block should be labeled with ```javascript and contain the complete JavaScript code (game.js) for the p5.js game.\n\n"
        "Ensure that when the HTML file is opened in a browser, the {genre} game runs correctly."
    )
    prompt = PromptTemplate(
        input_variables=["genre", "num_agents", "actions"],
        template=template,
    )
    return prompt.format(
        genre=genre, num_agents=num_agents, actions=actions,  #objectives=objectives
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
    indices = set()
    for file in js_files:
        try:
            idx = int(file.split('_')[1].split('.')[0])
            indices.add(idx)
        except Exception:
            continue
            
    next_index = 1
    while next_index in indices:
        next_index += 1

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


def main():
    # List of valid genres
    valid_genres = [
        # "Arcade",
        "Action",
        "Platformer",
        "Puzzle",
        # "Shooter",
        "Racing",
        # "Strategy",
        # "Simulation",
        # "Adventure",
        "Maze",
        "Tower Defense",
        "Sports",
        # "Fighting",
        # "Space",
    ]
    print("Select a game genre from the following list:")
    for valid_genre in valid_genres:
        print(f"- {valid_genre}")
    genre = "" # input("Enter game genre: ").strip()
    if genre == "":
        print("No genre selected. Using default genre 'Arcade'.")
        genre = random.choice(valid_genres)
    if genre not in valid_genres:
        print("Invalid genre selected.")
        return

    try:
        num_agents = "" # input("Enter number of agents (1-5): ").strip()
        if num_agents == "":
            num_agents = random.randint(1, 6)
        else:
            num_agents = int(num_agents)
        if num_agents < 1 or num_agents > 6:
            print("Number of agents must be between 1 and 5.")
            return
    except ValueError:
        print("Please enter a valid integer for number of agents.")
        return

    # Fixed actions for each agent
    actions = "arrow keys, shift, space bar, w, a, s, d"
    # objectives = input(
    #     "Enter objectives for success and failure conditions: "
    # ).strip()

    # Generate the structured prompt using LangChain
    prompt = generate_prompt(genre, num_agents, actions)
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
        save_files(html_code, js_code)
    else:
        print("Failed to parse code blocks from the API response.")
        # As a fallback, save the full response to a text file
        with open("full_game_output.txt", "w", encoding="utf-8") as f:
            f.write(game_response)
        print("Saved full API response to 'full_game_output.txt'.")


if __name__ == "__main__":
    main() 