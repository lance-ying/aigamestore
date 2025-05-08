from collections import defaultdict
from pathlib import Path
import json
import numpy as np
import matplotlib.pyplot as plt

data_dir = Path(__file__).parent / "data"

# list of info for each game
game_info = json.load(open(data_dir / "game_info.json"))

# user x game matrix of playability ratings
playability_ratings = np.load(data_dir / "playability_ratings.npy")

# user x game matrix of fun ratings
fun_ratings = np.load(data_dir / "fun_ratings.npy")

# list of consistency scores (LLM policy) for each game
consistency_scores_policy = np.load(data_dir / "consistency_scores_policy.npy")

num_prompts = len(set([info['prompt'] for info in game_info]))
num_users = playability_ratings.shape[0]
# list the samples generated for each game prompt (variable number of samples per prompt)
prompt_samples = [[] for _ in range(num_prompts)]
sample_scores = [[] for _ in range(num_prompts)]
sample_game_idx = [[] for _ in range(num_prompts)]  # keep track of game idx to get ratings later

for i, info in enumerate(game_info):
    prompt_samples[info['prompt']].append(info['sample'])
    sample_scores[info['prompt']].append(float(consistency_scores_policy[i]))
    sample_game_idx[info['prompt']].append(i)

# collect all the user ratings for first and best samples for each game prompt
first_fun_ratings = np.full((num_prompts, num_users), np.nan)
first_playability_ratings = np.full((num_prompts, num_users), np.nan)
best_fun_ratings = np.full((num_prompts, num_users), np.nan)
best_playability_ratings = np.full((num_prompts, num_users), np.nan)

for i in range(num_prompts):
    # for each game prompt, get the first sample (lowest index) and the best sample (highest consistency score)
    samples = prompt_samples[i]
    first_idx = np.argmin(samples)
    best_idx = np.argmax(sample_scores[i])
    first_game_idx = sample_game_idx[i][first_idx]
    best_game_idx = sample_game_idx[i][best_idx]

    first_fun_ratings[i, :] = fun_ratings[:, first_game_idx]
    first_playability_ratings[i, :] = playability_ratings[:, first_game_idx]
    best_fun_ratings[i, :] = fun_ratings[:, best_game_idx]
    best_playability_ratings[i, :] = playability_ratings[:, best_game_idx]


plt.figure()
plt.scatter(playability_ratings.reshape(-1), fun_ratings.reshape(-1), alpha=0.1)
plt.xlabel("Playability rating")
plt.ylabel("Fun rating")


plt.figure()
plt.bar(0, np.nanmean(first_fun_ratings), yerr=np.nanstd(first_fun_ratings), label='First sample')
plt.bar(1, np.nanmean(best_fun_ratings), yerr=np.nanstd(best_fun_ratings), label='Best sample')
plt.xlabel('Sampling method')
plt.ylabel('Fun rating')
plt.legend()
plt.tight_layout()

plt.figure()
plt.bar(0, np.nanmean(first_playability_ratings), yerr=np.nanstd(first_playability_ratings), label='First sample')
plt.bar(1, np.nanmean(best_playability_ratings), yerr=np.nanstd(best_playability_ratings), label='Best sample')
plt.xlabel('Sampling method')
plt.ylabel('Playability rating')
plt.legend()
plt.tight_layout()


# for i in range(num_prompts):
#     plt.figure()
#     plt.bar(0, np.nanmean(first_fun_ratings[i, :]), yerr=np.nanstd(first_fun_ratings[i, :]), label='First sample')
#     plt.bar(1, np.nanmean(best_fun_ratings[i, :]), yerr=np.nanstd(best_fun_ratings[i, :]), label='Best sample')
#     plt.xlabel('Sampling method')
#     plt.ylabel('Fun rating')
#     plt.legend()
#     plt.tight_layout()

#     plt.figure()
#     plt.bar(0, np.nanmean(first_playability_ratings[i, :]), yerr=np.nanstd(first_playability_ratings[i, :]), label='First sample')
#     plt.bar(1, np.nanmean(best_playability_ratings[i, :]), yerr=np.nanstd(best_playability_ratings[i, :]), label='Best sample')
#     plt.xlabel('Sampling method')
#     plt.ylabel('Playability rating')
#     plt.legend()
#     plt.tight_layout()

#     plt.show()


plt.show()