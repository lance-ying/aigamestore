# import json
# import os
# from pathlib import Path
# import re
# import shutil
# import anthropic
# from matplotlib import pyplot as plt
# from datasets import load_dataset


# games_version = "v5"
# run_name = "pilot1"
# GAMES_DATASET = f"generative-games/gen-games-{games_version}"
# RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"
# VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"


# model = "claude-3-7-sonnet-20250219"

# # thinking = True
# thinking = False

# run_name = "run3"


# save_dir = Path(__file__).parent / "results" / Path(__file__).stem
# save_dir = save_dir / run_name
# save_dir.mkdir(parents=True, exist_ok=True)


# anthropic_client = anthropic.Anthropic(
#     api_key=os.environ.get("ANTHROPIC_API_KEY"),
# )

# SYSTEM_PROMPT = "You are a professional game developper."

# # TODO: don't work with debug steps because take game from answer.txt?
# # TODO: behavior tree?
# # TODO: compare claude vs gemini

# # prompt_ai_policy = """Task: Implement an AI that can play and explore the game.

# # <instructions>
# # * first, modify the existing code to expose the game state via the p object.
# # * then, implement the ai player in a separate file
# #     * make sure to access the game state via the window.gameInstance object
# # * keep your implementation extremely minimal
# # </instructions>

# # Decide which files in <game_implementation> need to be updated. When updating a file, make sure to rewrite the entire code for that file.
# # Format your answer in the following format for the files that need to be updated:
# # <code filename="{{name}}.{{extension}}">
# # ...
# # </code> 

# # <game_implementation>
# # {game_implementation}
# # </game_implementation>
# # """


# prompt_ai_policy = """Task: Implement an AI that can play and explore the game.

# <instructions>
# * implement the ai player in a separate file
# * make sure to access the game state via the window.gameInstance object
# * use document.dispatchEvent to simulate actions
# * make sure the exploration policy is robust and doesn't get stuck in an infinite loop
# * keep your implementation extremely minimal
# * </instructions>

# Decide which files in <game_implementation> need to be updated. When updating a file, make sure to rewrite the entire code for that file.
# Format your answer in the following format for the files that need to be updated:
# <code filename="{{name}}.{{extension}}">
# ...
# </code> 

# <game_implementation>
# {game_implementation}
# </game_implementation>
# """


# def get_completion(model, prompt, thinking=False):
#     if "claude" in model:
#         if thinking:
#             thinking_content = ""
#             answer = ""
#             breakpoint()
#             with anthropic_client.messages.stream(
#                 model=model,
#                 max_tokens=40000,
#                 thinking={
#                     "type": "enabled",
#                     "budget_tokens": 10000
#                 },
#                 system=SYSTEM_PROMPT,
#                 messages=[{"role": "user", "content": prompt}]
#             ) as stream:
#                 for event in stream:
#                     if event.type == "content_block_start":
#                         print(f"\nStarting {event.content_block.type} block...")

#                     elif event.type == "content_block_delta":
#                         if event.delta.type == "thinking_delta":
#                             thinking_content += event.delta.thinking
#                             print(f"{event.delta.thinking}", end="", flush=True)

#                         elif event.delta.type == "text_delta":
#                             answer += event.delta.text
#                             print(f"{event.delta.text}", end="", flush=True)

#                     elif event.type == "content_block_stop":
#                         print("\nBlock complete.")

#             return thinking_content, answer

#         else:
#             answer = ""
#             with anthropic_client.messages.stream(
#                 max_tokens=40000,
#                 messages=[{"role": "user", "content": prompt}],
#                 model=model,
#                 system=SYSTEM_PROMPT,
#             ) as stream:
#                 for text in stream.text_stream:
#                     answer += text
#                     print(text, end="", flush=True)
#             return answer

#     else:
#         raise ValueError(f"Model {model} not supported")


# def generate(model, prompt, save_dir, code_dir=None, thinking=False):
#     """
#     Generate code for a given prompt.

#     Args:
#         model: The model to use for generation
#         prompt: The prompt to generate code for
#         save_dir: The directory to save the generated code
#         code_dir: The directory to save the generated code, if None, the code will be saved in the save_dir
#     """
#     save_dir.mkdir(parents=True, exist_ok=True)
    
#     if not (save_dir / "answer.txt").exists():
#         # Save prompt
#         with open(save_dir / "prompt.txt", "w") as f:
#             f.write(prompt)

#         # save model
#         with open(save_dir / "model.txt", "w") as f:
#             f.write(model)

#         if thinking:
#             thinking_content, answer = get_completion(model, prompt, thinking=thinking)

#             with open(save_dir / "thinking.txt", "w") as f:
#                 f.write(thinking_content)
#         else:
#             # breakpoint()
#             answer = get_completion(model, prompt, thinking=False)

#         # Save answer
#         with open(save_dir / "answer.txt", "w") as f:
#             f.write(answer)
#     else:
#         print(f"Loading answer from {save_dir / 'answer.txt'}")
#         with open(save_dir / "answer.txt", "r") as f:
#             answer = f.read()

#     if code_dir is None:
#         code_dir = save_dir

#     extract_code_blocks(answer, code_dir)
#     return answer


# def extract_code_blocks(answer: str, code_dir: Path):
#     # Extract code blocks and save in respective files
#     code_blocks = re.findall(r"<code id=\"(.*?)\">(.*?)</code>", answer, re.DOTALL)
#     # or filename="..."
#     if not code_blocks:
#         code_blocks = re.findall(r"<code filename=\"(.*?)\">(.*?)</code>", answer, re.DOTALL)

#     # if len(code_blocks) == 0:
#     #     print(f"No code blocks found")
#     #     breakpoint()

#     for filename, code in code_blocks:
#         file_path = code_dir / filename
#         file_path.parent.mkdir(parents=True, exist_ok=True)

#         # remove any ```python or ``` tags
#         code = re.sub("```python", "", code)
#         code = re.sub("```javascript", "", code)
#         code = re.sub("```html", "", code)
#         code = re.sub("```xml", "", code)
#         code = re.sub("```", "", code)

#         with open(file_path, "w") as f:
#             f.write(code)
    
#     return code_blocks





# if __name__ == "__main__":
#     game_dataset = load_dataset(GAMES_DATASET, split="train")
#     game_id = game_dataset[2]["id"]
#     game_data = game_dataset.filter(lambda x: x["id"] == game_id)
#     game_data = game_data[0]

#     save_dir = save_dir / (f"game_{game_id}")
#     save_dir.mkdir(parents=True, exist_ok=True)

#     # Create game code dictionary
#     game_code = {
#         path: content 
#         for path, content in zip(game_data["game_file_paths"], game_data["game_file_contents"])
#     }


#     if (save_dir / "game_code").exists():
#         # load game code in overwrite game_code
#         game_code = {}
#         for path in (save_dir / "game_code").iterdir():
#             with open(path, "r") as f:
#                 breakpoint()
#                 relative_path = path.relative_to(save_dir / "game_code")
#                 game_code[relative_path] = f.read()
#     breakpoint()

#     # copy code in save_dir
#     for path, content in game_code.items():
#         (save_dir / path).parent.mkdir(parents=True, exist_ok=True)
#         with open(save_dir / path, "w") as f:
#             f.write(content)

#     # format with <code filename="...">...</code> tags
#     game_code_str = ""
#     for relative_path, code in game_code.items():
#         game_code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"

#     with open(save_dir / "game_code.txt", "w") as f:
#         f.write(game_code_str)


#     prompt = prompt_ai_policy.format(
#         game_implementation=game_code_str,
#     )
#     generate(model, prompt, save_dir, thinking=thinking)

