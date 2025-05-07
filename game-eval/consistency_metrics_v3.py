from collections import defaultdict
import json
from pathlib import Path
import shutil
from datasets import load_dataset
from huggingface_hub import hf_hub_download
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


games_version = "v7"

# run_name = "test"
# run_name = "test3"
run_name = "pilot1"

GAMES_DATASET = f"generative-games/gen-games-{games_version}"
RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"
STATIC_ANALYSIS_DATASET = f"generative-games/gen-games-{games_version}-static-analysis"


# save_dir = Path(__file__).parent / "results" / Path(__file__).stem / games_version
save_dir = Path(__file__).parent / "results" / Path(__file__).stem / (games_version + "_" + run_name)

def analyze_logs(logs, save_dir=None):
    movements_by_type = defaultdict(list)
    for event in logs["movements"]:
        movements_by_type[event["movement_type"]].append(event)

    interactions_by_type = defaultdict(list)
    for event in logs["interactions"]:
        interactions_by_type[event["interaction_type"]].append(event)

    inputs_by_type = defaultdict(list)
    for event in logs["inputs"]:
        inputs_by_type[event["input_type"]].append(event)

    if save_dir is not None:
        save_dir.mkdir(exist_ok=True, parents=True)

        plt.figure()
        for mvt_type, events in movements_by_type.items():
            print(mvt_type, len(events))
            plt.bar(mvt_type, len(events))
        plt.savefig(save_dir / "movements_counts.png")

        # bar plot of interaction type counts
        plt.figure()
        for interaction_type, events in interactions_by_type.items():
            print(interaction_type, len(events))
            plt.bar(interaction_type, len(events))
        plt.savefig(save_dir / "interactions_counts.png")


    results = {
        "interactions": interactions_by_type,
        "movements": movements_by_type,
        "interaction_counts": {k: len(v) for k, v in interactions_by_type.items() if len(v) > 0},
        "movement_counts": {k: len(v) for k, v in movements_by_type.items() if len(v) > 0},
        "interaction_types": [k for k, v in interactions_by_type.items() if len(v) > 0],
        "movement_types": [k for k, v in movements_by_type.items() if len(v) > 0]
    }
    return results


def analyze_consistency(gameplay_results, static_results, save_dir):
    save_dir.mkdir(exist_ok=True, parents=True)

    # compute scores by comparing static vs gameplay analysis
    interactions_by_type = defaultdict(list)
    for game_name, res in gameplay_results.items():
        for interaction_type in res["interaction_types"]:
            interactions_by_type[interaction_type].append(f"{game_name},")

    movements_by_type = defaultdict(list)
    for game_name, res in gameplay_results.items():
        for movement_type in res["movement_types"]:
            movements_by_type[movement_type].append(f"{game_name},")
    
    interaction_counts = {k: len(v) for k, v in interactions_by_type.items()}
    movement_counts = {k: len(v) for k, v in movements_by_type.items()}

    static_interaction_counts = static_results["interaction_type_counts"]
    static_movement_counts = static_results["movement_type_counts"]

    # TODO: HF dataset adds None to dicts (could just recompute the counts here instead of storing them in dataset)
    static_interaction_counts = {k: v for k, v in static_interaction_counts.items() if v is not None}
    static_movement_counts = {k: v for k, v in static_movement_counts.items() if v is not None}

    sorted_static_movement = sorted(static_movement_counts.items(), key=lambda x: x[1], reverse=True)
    sorted_static_interaction = sorted(static_interaction_counts.items(), key=lambda x: x[1], reverse=True)

    sorted_interaction = sorted(interaction_counts.items(), key=lambda x: static_interaction_counts[x[0]], reverse=True)
    sorted_movement = sorted(movement_counts.items(), key=lambda x: static_movement_counts[x[0]], reverse=True)

    # plot counts for movement types
    plt.figure(figsize=(8, 5))
    movement_data = pd.DataFrame({
        'type': [x[0] for x in sorted_static_movement] + [x[0] for x in sorted_movement],
        'count': [x[1] for x in sorted_static_movement] + [x[1] for x in sorted_movement],
        'source': ['static'] * len(sorted_static_movement) + ['gameplay'] * len(sorted_movement)
    })
    sns.barplot(data=movement_data, x='type', y='count', hue='source')
    plt.xticks(rotation=90)
    plt.xlabel('')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "movement_counts.png")

    # plot counts for interaction types
    plt.figure(figsize=(8, 5))
    interaction_data = pd.DataFrame({
        'type': [x[0] for x in sorted_static_interaction] + [x[0] for x in sorted_interaction],
        'count': [x[1] for x in sorted_static_interaction] + [x[1] for x in sorted_interaction],
        'source': ['static'] * len(sorted_static_interaction) + ['gameplay'] * len(sorted_interaction)
    })
    sns.barplot(data=interaction_data, x='type', y='count', hue='source')
    plt.xticks(rotation=90)
    plt.xlabel('')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "interaction_counts.png")

    num_interactions = sum([count for count in interaction_counts.values()])
    num_interactions_static = sum([count for count in static_interaction_counts.values()])
    interaction_score = num_interactions / num_interactions_static

    num_movements = sum([count for count in movement_counts.values()])
    num_movements_static = sum([count for count in static_movement_counts.values()])
    movement_score = num_movements / num_movements_static

    print(f"Interaction score: {interaction_score*100}%")
    print(f"Movement score: {movement_score*100}%")

    with open(save_dir / "scores.json", "w") as f:
        json.dump({
            "interaction_score": interaction_score*100,
            "movement_score": movement_score*100
        }, f, indent=4)

    # compute movement and interaction scores per game
    game_scores = {}
    for game_concept, game_res in gameplay_results.items():
        gameplay_interactions = game_res["interaction_types"]
        static_interactions = static_results["interaction_types"][game_concept]

        gameplay_movements = game_res["movement_types"]
        static_movements = static_results["movement_types"][game_concept]

        interaction_score = 0
        for interaction in static_interactions:
            if interaction in gameplay_interactions:
                interaction_score += 1
        interaction_avg_score = interaction_score / len(static_interactions)

        # compute movement score
        movement_score = 0
        for movement in static_movements:
            if movement in gameplay_movements:
                movement_score += 1
        movement_avg_score = movement_score / len(static_movements)

        # score when concatenate interaction and movement types
        joint_score = (interaction_score + movement_score) / (len(static_interactions) + len(static_movements))

        print(f"Game concept: {game_concept}")
        print(f"Interaction score: {interaction_avg_score*100}%")
        print(f"Movement score: {movement_avg_score*100}%")
        print(f"Joint score: {joint_score*100}%")
        print("Static interactions: ", static_interactions)
        print("Gameplay interactions: ", gameplay_interactions)
        print("Static movements: ", static_movements)
        print("Gameplay movements: ", gameplay_movements)
        print("-"*100)

        game_scores[game_concept] = {
            "interaction_score": interaction_avg_score*100,
            "movement_score": movement_avg_score*100,
            "joint_score": joint_score*100
        }


    with open(save_dir / "game_scores.json", "w") as f:
        json.dump(game_scores, f, indent=4)

    # plot score vs game
    interaction_scores = [v["interaction_score"] for v in game_scores.values()]
    movement_scores = [v["movement_score"] for v in game_scores.values()]
    game_concepts = list(game_scores.keys())
    plt.figure()
    plt.scatter(game_concepts, interaction_scores)
    plt.xlabel("Game concept")
    plt.ylabel("Interaction score")
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig(save_dir / "interaction_score_vs_game.png")

    plt.figure()
    plt.scatter(game_concepts, movement_scores)
    plt.xlabel("Game concept")
    plt.ylabel("Movement score")
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig(save_dir / "movement_score_vs_game.png")

    return game_scores


if __name__ == "__main__":
    save_dir.mkdir(exist_ok=True, parents=True)

    game_dataset = load_dataset(GAMES_DATASET, split="train")
    rating_dataset = load_dataset(RATING_DATASET, split="train")
    # static_analysis_dataset = load_dataset(STATIC_ANALYSIS_DATASET, split="train")

    # TODO: remove users with less than 10 ratings (didn't complete the study)

    # if "judge" not in rating_dataset:
    #     rating_dataset = rating_dataset.rename_column("judge", "user_id")

    # torchvision error
    # video_dataset = load_dataset(VIDEO_DATASET, split="train")
    print(rating_dataset)
    # print(static_analysis_dataset)

    # number of entries in rating dataset for each user
    print("Number of entries in rating dataset for each user:")
    for user_id in np.unique(rating_dataset["user_id"]):
        print(f"{user_id}: {len(rating_dataset.filter(lambda x: x['user_id'] == user_id))}")

    # remove test users (any user with "test" in their id)
    rating_dataset = rating_dataset.filter(lambda x: "test" not in x["user_id"])
    print(f"After removing test users: {rating_dataset}")

    if not (save_dir / "results.csv").exists():
        results = defaultdict(list)
        # gameplay_results = defaultdict(lambda: defaultdict(dict))

        for entry in rating_dataset:
            rating_id = entry["id"]
            game_id = entry["game_id"]

            _res_dir = save_dir / "results_by_user" / f"user_{entry['user_id']}" / f"game_{game_id}"
            _res_dir.mkdir(exist_ok=True, parents=True)

            # find matching game 
            game = game_dataset.filter(lambda x: x["id"] == game_id)
            assert len(game) == 1, f"Found {len(game)} games with id {game_id}"
            game = game[0]

            model = game["model"]
            method = game["method"]

            # retrieve corresponding video
            key = f"rating_{rating_id}_game_{game_id}"
            video_filename = f"{key}.mp4"

            try:
                video_path = hf_hub_download(
                    repo_id=VIDEO_DATASET,
                    filename=video_filename,
                    repo_type="dataset",
                )
                if not (_res_dir / "video.mp4").exists():
                    shutil.copy(video_path, _res_dir / "video.mp4")

                # new_filename = f"rating_{entry['ratings']['fun']}_game_{game_id}.mp4"
                # new_video_path = save_dir / "video" / f"user_{entry['user_id']}" / new_filename
                # new_video_path.parent.mkdir(exist_ok=True, parents=True)
                # shutil.copy(video_path, new_video_path)
            except Exception as e:
                print(f"Error downloading video {video_filename}: {e}")
                # continue
                video_path = None
            
            # TODO: save logs in HF dataset as string?
            logs = json.loads(entry["logs"])
            # TODO
            if len(logs) == 0:
                print(f"No logs for user {entry['user_id']} and game {game_id}")
                res = None
            else:
                res = analyze_logs(logs)

            # TODO: count the number of key input events
            if len(logs) > 0:
                key_inputs = []
                for event in logs["inputs"]:
                    if event["input_type"] == "keyPressed":
                        key_inputs.append(event)
                results["num_key_presses"].append(len(key_inputs))

                # estimate time spent as time between first and last key press
                if len(key_inputs) > 0:
                    time_spent = key_inputs[-1]["timestamp"] - key_inputs[0]["timestamp"]
                    # convert to seconds
                    time_spent = time_spent / 1000
                    results["time_spent"].append(time_spent)
                    print(f"Number of key inputs: {len(key_inputs)}, time spent: {time_spent}")
                else:
                    results["time_spent"].append(0)
            else:
                results["num_key_presses"].append(np.nan)
                results["time_spent"].append(np.nan)

            results["model"].append(model)
            results["method"].append(method)
            # results["gameplay_analysis"].append(res)
            results["rating_fun"].append(int(entry["ratings"]["fun"]))
            results["rating_playability"].append(int(entry["ratings"]["playability"]))

            results["game_id"].append(game_id)
            results["rating_id"].append(rating_id)
            results["game_concept_id"].append(game["game_concept_id"])
            results["game_genre"].append(game["game_genre"])
            results["game_sample_id"].append(game["game_sample_id"])
            results["user_id"].append(entry["user_id"])
            results["video_path"].append(video_path)
            results["events"].append(entry["events"])
            results["log_analysis"].append(json.dumps(res, indent=4))

            results["consistency_score_llm_policy"].append(game["consistency_score_llm_policy"])


            mechanics_implemented = game["mechanics_implemented"]
            if res is not None:
                # list of mechanics triggered by the user
                triggered_mechanics = res["interaction_types"] + res["movement_types"]
                score = 0
                for mechanic in mechanics_implemented:
                    if mechanic in triggered_mechanics:
                        score += 1
                score = score / len(mechanics_implemented)
                score = score * 100
                results["code_gameplay_consistency"].append(score)
            else:
                results["code_gameplay_consistency"].append(np.nan)


            # check if pressed enter
            events_list = json.loads(entry["events"])
            pressed_enter = False
            for event in events_list:
                if event["type"] == "keydown" and event["key"] == "Enter":
                    pressed_enter = True
                    break
            results["pressed_enter"].append(pressed_enter)

            # game state statistics (start, fail, reset, win)
            if len(logs) > 0:
                num_game_win = 0
                num_game_fail = 0
                num_game_reset = 0
                num_game_start = 0
                for game_state in logs["game_states"]:
                    if game_state["game_state"] == "win":

                        num_game_win += 1
                    elif game_state["game_state"] == "fail":
                        num_game_fail += 1
                    elif game_state["game_state"] == "reset":
                        num_game_reset += 1
                    elif game_state["game_state"] == "start":
                        num_game_start += 1
                # TODO: seem to sometimes log game state many times
                results["num_game_win"].append(num_game_win)
                results["num_game_fail"].append(num_game_fail)
                results["num_game_reset"].append(num_game_reset)
                results["num_game_start"].append(num_game_start)
            else:
                results["num_game_win"].append(np.nan)
                results["num_game_fail"].append(np.nan)
                results["num_game_reset"].append(np.nan)
                results["num_game_start"].append(np.nan)

            # save results
            with open(_res_dir / "logs.json", "w") as f:
                json.dump(logs, f, indent=4)
            
            # save ratings
            with open(_res_dir / "ratings.json", "w") as f:
                json.dump(entry["ratings"], f, indent=4)

            # save metadata
            with open(_res_dir / "metadata.json", "w") as f:
                json.dump({
                    "model": model,
                    "method": method,
                    "game_concept_id": game["game_concept_id"],
                    "game_sample_id": game["game_sample_id"],
                    "game_id": game_id,
                    "rating_id": rating_id,
                    "user_id": entry["user_id"]
                }, f, indent=4)

            # save events
            with open(_res_dir / "events.json", "w") as f:
                events = json.loads(entry["events"])
                json.dump(events, f, indent=4)

        results = pd.DataFrame(results)

        results.to_csv(save_dir / "results.csv", index=False)
    else:
        results = pd.read_csv(save_dir / "results.csv")


    # Create a fixed color mapping for users
    unique_users = results["user_id"].unique()
    color_palette = sns.color_palette("muted", len(unique_users))
    user_color_mapping = dict(zip(unique_users, color_palette))
    
    # Save a separate figure with the color mapping legend
    plt.figure(figsize=(12, 3))
    handles = [plt.Rectangle((0,0), 1, 1, color=user_color_mapping[user]) for user in unique_users]
    plt.legend(handles, unique_users, loc='center', ncol=min(3, len(unique_users)))
    plt.axis('off')
    plt.tight_layout()
    plt.savefig(save_dir / "user_color_mapping.png")
    plt.close()

    _save_dir = save_dir / "sanity_checks"
    _save_dir.mkdir(exist_ok=True, parents=True)

    # count the number of ratings for each user
    print("Number of ratings per user:")
    print(results["user_id"].value_counts())
    # bar plot showing number of ratings per user (user ids on y-axis)
    plt.figure()
    sns.barplot(y=results["user_id"].value_counts().index, x=results["user_id"].value_counts().values, orient="h")
    plt.ylabel("User ID")
    plt.xlabel("Number of ratings")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(_save_dir / "ratings_per_user.png")

    # count the number of videos for each user (video_path is not None)
    print("Number of videos per user:")
    print(results[results["video_path"].notna()]["user_id"].value_counts())
    # bar plot showing number of videos per user (user ids on y-axis)
    plt.figure()
    video_counts = results[results["video_path"].notna()]["user_id"].value_counts()
    sns.barplot(y=video_counts.index, x=video_counts.values, orient="h")
    plt.ylabel("User ID")
    plt.xlabel("Number of videos")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(_save_dir / "videos_per_user.png")

    # number of ratings with logs for each user
    print("Number of ratings with logs for each user:")
    print(results[results["log_analysis"].notna()]["user_id"].value_counts())
    plt.figure()
    sns.barplot(y=results[results["log_analysis"].notna()]["user_id"].value_counts().index, x=results[results["log_analysis"].notna()]["user_id"].value_counts().values, orient="h")
    plt.ylabel("User ID")
    plt.xlabel("Number of ratings with logs")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(_save_dir / "ratings_with_logs_per_user.png")

    # plot average number of key presses per user
    plt.figure()
    sns.barplot(y=results["user_id"], x=results["num_key_presses"])
    plt.ylabel("User ID")
    plt.xlabel("Number of key presses")
    plt.tight_layout()
    plt.savefig(_save_dir / "key_presses_per_user_avg.png")

    # plot average time spent per user
    plt.figure()
    sns.barplot(y=results["user_id"], x=results["time_spent"])
    plt.ylabel("User ID")
    plt.xlabel("Time spent (seconds)")
    plt.tight_layout()
    plt.savefig(_save_dir / "time_spent_per_user_avg.png")

    plt.figure()
    sns.stripplot(y="user_id", x="num_key_presses", data=results, jitter=True, alpha=0.7)
    plt.ylabel("User ID")
    plt.xlabel("Number of key presses")
    plt.tight_layout()
    plt.savefig(_save_dir / "key_presses_per_user.png")

    # plot time spent per user (showing individual points)
    plt.figure()
    sns.stripplot(y="user_id", x="time_spent", data=results, jitter=True, alpha=0.7)
    plt.ylabel("User ID")
    plt.xlabel("Time spent (seconds)")
    plt.tight_layout()
    plt.savefig(_save_dir / "time_spent_per_user.png")

    # plot rating vs time spent with fixed color mapping
    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="time_spent", hue="user_id", palette=user_color_mapping)
    plt.ylabel("Rating")
    plt.xlabel("Time spent (seconds)")
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(_save_dir / "rating_fun_vs_time_spent.png")
    
    plt.figure()
    sns.scatterplot(data=results, y="rating_playability", x="time_spent", hue="user_id", palette=user_color_mapping)
    plt.ylabel("Rating")
    plt.xlabel("Time spent (seconds)")
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(_save_dir / "rating_playability_vs_time_spent.png")

    # Use lmplot to create regression lines for each user for rating vs time spent
    g = sns.lmplot(
        data=results,
        x="time_spent", 
        y="rating_fun", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("Time spent (seconds)", "Rating")
    # Remove top and right spines
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(_save_dir / "rating_fun_vs_time_spent_with_regression.png")

    g = sns.lmplot(
        data=results,
        x="time_spent", 
        y="rating_playability", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("Time spent (seconds)", "Rating")
    # Remove top and right spines
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(_save_dir / "rating_playability_vs_time_spent_with_regression.png")



    # # TODO: many of the users have at least one game where they never pressed enter
    # # list the users that never pressed enter in at least one game based on "events"
    # users_one_game_never_pressed_enter = []
    # for user in results["user_id"].unique():
    #     user_all_events = results[results["user_id"] == user]["events"]

    #     # check if there is one game where the user never pressed enter
    #     one_game_never_pressed_enter = False
    #     for game_events in user_all_events:
    #         user_pressed_enter = False
    #         event_list = json.loads(game_events)
    #         for e in event_list:
    #             if e["type"] == "keydown" and e["key"] == "Enter":
    #                 user_pressed_enter = True
    #                 break
    #         if not user_pressed_enter:
    #             print(f"User {user} never pressed enter in game {game_events}")
    #             one_game_never_pressed_enter = True
    #             break
    #     if one_game_never_pressed_enter:
    #         users_one_game_never_pressed_enter.append(user)
    # print(f"Number of users that never pressed enter in at least one game: {len(users_one_game_never_pressed_enter)}")
    # print(users_one_game_never_pressed_enter)

    # # Remove users with low average number of key presses
    # keypress_threshold = 30

    # # Compute average number of key presses per user
    # avg_keypresses_per_user = results.groupby("user_id")["num_key_presses"].mean()

    # print(avg_keypresses_per_user)

    # # Identify users to keep (those with average keypresses >= threshold)
    # users_to_keep = avg_keypresses_per_user[avg_keypresses_per_user >= keypress_threshold].index

    # # Filter results to only include these users
    # results = results[results["user_id"].isin(users_to_keep)].copy()
    # # Print the users removed due to low average key presses
    # users_removed = avg_keypresses_per_user[avg_keypresses_per_user < keypress_threshold].index
    # if len(users_removed) > 0:
    #     print("Users removed due to low average key presses per game (< {}):".format(keypress_threshold))
    #     for user in users_removed:
    #         print(f"  {user}", avg_keypresses_per_user[user])
    # else:
    #     print("No users removed due to low average key presses per game.")

    # print number of users that never pressed enter
    print("Number of users that never pressed enter:")
    print(len(results[results["pressed_enter"] == False]))
    for _, entry in results[results["pressed_enter"] == False].iterrows():
        print(entry["user_id"])
        print(entry["game_id"])
        print('-'*100)

    print("Before removing users that never pressed enter:")
    print(len(results[results["num_key_presses"] < 5]))
    results = results[results["pressed_enter"]]
    # # remove all rating entries where the user didn't press enter or pressed less than 10 keys
    print("After removing users that never pressed enter:")
    print(len(results[results["num_key_presses"] < 5]))
    # results = results[results["num_key_presses"] >= 10]
    # results = results[results["pressed_enter"]]
    # breakpoint()
    results = results[results["num_key_presses"] >= 5]




    # Calculate rating variances for each game
    fun_variances = results.groupby('game_id')['rating_fun'].var().reset_index()
    fun_variances = fun_variances.sort_values('rating_fun', ascending=False)
    playability_variances = results.groupby('game_id')['rating_playability'].var().reset_index()
    playability_variances = playability_variances.sort_values('rating_playability', ascending=False)
    
    # Order of games by descending fun rating variance
    fun_order = fun_variances['game_id'].tolist()
    # Order of games by descending playability rating variance
    playability_order = playability_variances['game_id'].tolist()
    
    # Create a mapping for plotting
    fun_game_order = {game: i for i, game in enumerate(fun_order)}
    playability_game_order = {game: i for i, game in enumerate(playability_order)}
    
    # Add order columns to results dataframe
    results['fun_game_order'] = results['game_id'].map(fun_game_order)
    results['playability_game_order'] = results['game_id'].map(playability_game_order)

    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="fun_game_order", hue="model")
    plt.xticks(range(len(fun_order)), range(len(fun_order)), rotation=90)
    plt.xlabel('Game (ordered by descending rating variance)')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_game_id.png")

    plt.figure()
    sns.scatterplot(data=results, y="rating_playability", x="playability_game_order", hue="model")
    plt.xticks(range(len(playability_order)), range(len(playability_order)), rotation=90)
    plt.xlabel('Game (ordered by descending rating variance)')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "playability_rating_vs_game_id.png")

    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="fun_game_order", hue="user_id", palette=user_color_mapping)
    plt.xticks(range(len(fun_order)), range(len(fun_order)))
    plt.xlabel('Game (ordered by descending rating variance)')
    plt.ylabel('Human rating')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_game_by_user.png")
    plt.close('all')

    plt.figure()
    sns.scatterplot(data=results, y="rating_playability", x="playability_game_order", hue="user_id", palette=user_color_mapping)
    plt.xticks(range(len(playability_order)), range(len(playability_order)))
    plt.xlabel('Game (ordered by descending rating variance)')
    plt.ylabel('Human rating')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(save_dir / "playability_rating_vs_game_by_user.png")
    plt.close('all')


    # theme_8, sample_0: llm policy got stuck

    # average ratings across participants for each game sample
    avg_results = defaultdict(list)
    for game_genre in results["game_genre"].unique():
        for game_concept_id in results["game_concept_id"].unique():
            res = results[(results["game_genre"] == game_genre) & (results["game_concept_id"] == game_concept_id)]
            # print number of samples for this game concept id
            print(f"Number of samples for genre {game_genre} and concept {game_concept_id}: {len(res['game_sample_id'].unique())}")
            for sample_id in res["game_sample_id"].unique():
                # ratings for this game sample
                game_ratings = res[res["game_sample_id"] == sample_id]  # rating for each user rating this game sample
                # TODO: can have a high variance across users (some users giving 0 and others giving 10)
                print(f"Number of ratings for genre {game_genre} and concept {game_concept_id} and sample {sample_id}: {len(game_ratings)}")
                # assert game ids are all the same
                assert len(game_ratings["game_id"].unique()) == 1
                game_id = game_ratings["game_id"].unique()[0]
                avg_fun_rating = game_ratings["rating_fun"].mean()
                avg_playability_rating = game_ratings["rating_playability"].mean()
                consistency_score_llm_policy = game_ratings["consistency_score_llm_policy"].mean()
                avg_consistency_score = game_ratings["code_gameplay_consistency"].mean()

                print("Fun ratings:", game_ratings["rating_fun"].to_list())
                print("Playability ratings:", game_ratings["rating_playability"].to_list())
                print("Consistency scores (LLM policy):", game_ratings["consistency_score_llm_policy"].to_list())
                print("Consistency scores (human gameplay):", game_ratings["code_gameplay_consistency"].to_list())
                print("Average fun rating:", avg_fun_rating)
                print("Average playability rating:", avg_playability_rating)
                print("Consistency score (LLM policy):", consistency_score_llm_policy)

                # if consistency_score_llm_policy < 30:
                #     breakpoint()

                sample_number = int(sample_id.split("_")[-1])

                avg_results["game_genre"].append(game_genre)
                avg_results["game_concept_id"].append(game_concept_id)
                avg_results["game_sample_id"].append(sample_id)
                avg_results["game_sample_number"].append(sample_number)
                avg_results["game_id"].append(game_id)
                avg_results["avg_fun_rating"].append(avg_fun_rating)
                avg_results["avg_playability_rating"].append(avg_playability_rating)
                avg_results["consistency_score_llm_policy"].append(consistency_score_llm_policy)
                avg_results["avg_consistency_score"].append(avg_consistency_score)

                # add std
                avg_results["std_fun_rating"].append(game_ratings["rating_fun"].std())
                avg_results["std_playability_rating"].append(game_ratings["rating_playability"].std())
                avg_results["std_avg_consistency_score"].append(game_ratings["code_gameplay_consistency"].std())

    avg_results = pd.DataFrame(avg_results)

    # bar plot of avg rating for each game (with std) ordered by avg rating
    plt.figure(figsize=(6, 4))
    # Sort by average fun rating in descending order
    sorted_indices = avg_results["avg_fun_rating"].argsort()[::-1]  # descending order
    sorted_game_ids = avg_results["game_id"].iloc[sorted_indices]
    sorted_fun_ratings = avg_results["avg_fun_rating"].iloc[sorted_indices]
    sorted_fun_std = avg_results["std_fun_rating"].iloc[sorted_indices]
    
    plt.bar(range(len(sorted_game_ids)), sorted_fun_ratings, yerr=sorted_fun_std, alpha=0.7, color='mediumseagreen')
    plt.xlabel("Game")
    plt.ylabel("Average fun rating")
    plt.xticks(range(len(sorted_game_ids)), [""] * len(sorted_game_ids))
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "avg_fun_rating_vs_game.png")
    plt.close()

    # bar plot of avg playability rating for each game (with std) ordered by avg playability rating
    plt.figure(figsize=(6, 4))
    # Sort by average playability rating in descending order
    sorted_indices = avg_results["avg_playability_rating"].argsort()[::-1]  # descending order
    sorted_game_ids = avg_results["game_id"].iloc[sorted_indices]
    sorted_playability_ratings = avg_results["avg_playability_rating"].iloc[sorted_indices]
    sorted_playability_std = avg_results["std_playability_rating"].iloc[sorted_indices]
    
    plt.bar(range(len(sorted_game_ids)), sorted_playability_ratings, yerr=sorted_playability_std, alpha=0.7, color='mediumpurple')
    plt.xlabel("Game")
    plt.ylabel("Average playability rating")
    plt.xticks(range(len(sorted_game_ids)), [""] * len(sorted_game_ids))
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "avg_playability_rating_vs_game.png")
    plt.close()

    # Plot avg fun rating vs consistency score llm policy
    plt.figure(figsize=(6, 4))
    plt.scatter(avg_results["consistency_score_llm_policy"], avg_results["avg_fun_rating"], alpha=0.2)
    plt.xlabel("Consistency score (LLM policy)")
    plt.ylabel("Average fun rating")
    plt.tight_layout()
    plt.savefig(save_dir / "avg_fun_rating_vs_consistency_score_llm.png")
    plt.close()

    # Plot avg playability rating vs consistency score llm policy
    plt.figure(figsize=(6, 4))
    plt.scatter(avg_results["consistency_score_llm_policy"], avg_results["avg_playability_rating"], alpha=0.2, color='orange')
    plt.xlabel("Consistency score (LLM policy)")
    plt.ylabel("Average playability rating")
    plt.tight_layout()
    plt.savefig(save_dir / "avg_playability_rating_vs_consistency_score_llm.png")
    plt.close()


    # Plot avg fun rating vs consistency score llm policy
    plt.figure(figsize=(6, 4))
    plt.scatter(avg_results["avg_consistency_score"], avg_results["avg_fun_rating"], alpha=0.2)
    plt.xlabel("Consistency score (human gameplay)")
    plt.ylabel("Average fun rating")
    plt.tight_layout()
    plt.savefig(save_dir / "avg_fun_rating_vs_consistency_score_human.png")
    plt.close()

    # Plot avg playability rating vs consistency score llm policy
    plt.figure(figsize=(6, 4))
    plt.scatter(avg_results["avg_consistency_score"], avg_results["avg_playability_rating"], alpha=0.2, color='orange')
    plt.xlabel("Consistency score (human gameplay)")
    plt.ylabel("Average playability rating")
    plt.tight_layout()
    plt.savefig(save_dir / "avg_playability_rating_vs_consistency_score_human.png")
    plt.close()


    # print the number of samples for each game concept id and genre
    print(f"Number of samples for each game concept id and genre: {avg_results.groupby(['game_concept_id', 'game_genre'])['game_sample_id'].count()}")

    # A. select first sample for each game concept id and genre
    # For each (game_concept_id, game_genre), select the row with the minimum game_sample_number
    first_samples = avg_results.loc[avg_results.groupby(['game_concept_id', 'game_genre'])['game_sample_number'].idxmin()]
    print("First sample for each game concept id and genre:")
    print(first_samples)

    # B. select sample with highest consistency score for each game concept id and genre
    # For each (game_concept_id, game_genre), select the row with the maximum consistency_score_llm_policy
    best_samples = avg_results.loc[avg_results.groupby(['game_concept_id', 'game_genre'])['consistency_score_llm_policy'].idxmax()]
    print("Sample with highest consistency score for each game concept id and genre:")
    print(best_samples)

    # C. select sample with highest consistency score (human gameplay) for each game concept id and genre
    # For each (game_concept_id, game_genre), select the row with the maximum avg_consistency_score
    best_human_samples = avg_results.loc[avg_results.groupby(['game_concept_id', 'game_genre'])['avg_consistency_score'].idxmax()]
    print("Sample with highest consistency score (human gameplay) for each game concept id and genre:")
    print(best_human_samples)

    # TODO: can also compare with the other samples (not just the first and best)


    plt.figure(figsize=(6, 4))
    plt.subplot(1, 2, 1)
    for game_concept_id in avg_results["game_concept_id"].unique():
        for game_genre in avg_results["game_genre"].unique():
            _first_sample = first_samples[(first_samples["game_concept_id"] == game_concept_id) & (first_samples["game_genre"] == game_genre)]
            _best_sample = best_samples[(best_samples["game_concept_id"] == game_concept_id) & (best_samples["game_genre"] == game_genre)]
            plt.plot([0, 1], [_first_sample["avg_fun_rating"], _best_sample["avg_fun_rating"]], 'o-', color='mediumseagreen', alpha=0.7, markersize=5)
    plt.ylabel('Human fun rating')
    plt.xticks([0, 1], ['First sample', 'Best consistency sample'])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.subplot(1, 2, 2)
    for game_concept_id in avg_results["game_concept_id"].unique():
        for game_genre in avg_results["game_genre"].unique():
            _first_sample = first_samples[(first_samples["game_concept_id"] == game_concept_id) & (first_samples["game_genre"] == game_genre)]
            _best_sample = best_samples[(best_samples["game_concept_id"] == game_concept_id) & (best_samples["game_genre"] == game_genre)]
            plt.plot([0, 1], [_first_sample["avg_playability_rating"], _best_sample["avg_playability_rating"]], 'o-', color='mediumpurple', alpha=0.7, markersize=5)
    plt.ylabel('Human playability rating')
    plt.xticks([0, 1], ['First sample', 'Best consistency sample'])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "first_vs_best_samples_ratings_plot.png")
    plt.close()



    plt.figure(figsize=(6, 4))
    plt.subplot(1, 2, 1)
    for game_concept_id in avg_results["game_concept_id"].unique():
        for game_genre in avg_results["game_genre"].unique():
            _first_sample = first_samples[(first_samples["game_concept_id"] == game_concept_id) & (first_samples["game_genre"] == game_genre)]
            _best_sample = best_samples[(best_samples["game_concept_id"] == game_concept_id) & (best_samples["game_genre"] == game_genre)]
            plt.plot([0, 1], [_first_sample["consistency_score_llm_policy"], _best_sample["consistency_score_llm_policy"]], 'o-', color='cornflowerblue', alpha=0.7, markersize=5)
    plt.ylabel('Consistency score (LLM policy)')
    plt.xticks([0, 1], ['First sample', 'Best consistency sample'])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.subplot(1, 2, 2)
    for game_concept_id in avg_results["game_concept_id"].unique():
        for game_genre in avg_results["game_genre"].unique():
            _first_sample = first_samples[(first_samples["game_concept_id"] == game_concept_id) & (first_samples["game_genre"] == game_genre)]
            _best_sample = best_samples[(best_samples["game_concept_id"] == game_concept_id) & (best_samples["game_genre"] == game_genre)]
            plt.plot([0, 1], [_first_sample["avg_consistency_score"], _best_sample["avg_consistency_score"]], 'o-', color='coral', alpha=0.7, markersize=5)
    plt.ylabel('Consistency score (human gameplay)')
    plt.xticks([0, 1], ['First sample', 'Best consistency sample'])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "first_vs_best_samples_consistency_score_plot.png")
    plt.close()





    # Create a DataFrame for plotting
    comparison_df = pd.DataFrame({
        'First Sample - Fun': first_samples["avg_fun_rating"],
        'Best Sample - Fun': best_samples["avg_fun_rating"],
        'First Sample - Playability': first_samples["avg_playability_rating"],
        'Best Sample - Playability': best_samples["avg_playability_rating"],
        'Best Sample - Fun (human gameplay)': best_human_samples["avg_fun_rating"],
        'Best Sample - Playability (human gameplay)': best_human_samples["avg_playability_rating"]
    })
    
    # Calculate means and standard errors
    means = comparison_df.mean()
    std_errors = comparison_df.std() / np.sqrt(len(comparison_df))
    
    bar_width = 0.35
    r1 = np.arange(2)
    r2 = [x + bar_width for x in r1]
    
    plt.bar(r1, [means['First Sample - Fun'], means['First Sample - Playability']], 
            width=bar_width, label='First sample', color='skyblue',
            yerr=[std_errors['First Sample - Fun'], std_errors['First Sample - Playability']], capsize=5)
    
    plt.bar(r2, [means['Best Sample - Fun'], means['Best Sample - Playability']], 
            width=bar_width, label='Best consistency sample', color='lightcoral',
            yerr=[std_errors['Best Sample - Fun'], std_errors['Best Sample - Playability']], capsize=5)
    
    plt.xlabel('Rating criteria')
    plt.ylabel('Average human rating')
    plt.xticks([r + bar_width/2 for r in r1], ['Fun', 'Playability'])
    plt.legend()
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "first_vs_best_samples_ratings.png")
    plt.close()


    bar_width = 0.25
    r1 = np.arange(2)
    r2 = [x + bar_width for x in r1]
    r3 = [x + bar_width for x in r2]

    plt.figure(figsize=(6, 4))
    plt.bar(r1, [means['First Sample - Fun'], means['First Sample - Playability']], 
            width=bar_width, label='First sample', color='skyblue',
            yerr=[std_errors['First Sample - Fun'], std_errors['First Sample - Playability']], capsize=5)
    plt.bar(r2, [means['Best Sample - Fun'], means['Best Sample - Playability']], 
            width=bar_width, label='Best consistency sample', color='lightcoral',
            yerr=[std_errors['Best Sample - Fun'], std_errors['Best Sample - Playability']], capsize=5)
    plt.bar(r3, [means['Best Sample - Fun (human gameplay)'], means['Best Sample - Playability (human gameplay)']],
            width=bar_width, label='Best sample (human gameplay)', color='mediumseagreen',
            yerr=[std_errors['Best Sample - Fun (human gameplay)'], std_errors['Best Sample - Playability (human gameplay)']], capsize=5)

    plt.xlabel('Rating criteria')
    plt.ylabel('Average human rating')
    plt.xticks([r + bar_width for r in r1], ['Fun', 'Playability'])
    plt.legend()
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "first_vs_best_samples_ratings_all.png")
    plt.close()


    # TODO: doesn't take genre into account
    # # Compare ratings without/with consistency resampling
    # # Extract the numeric part from sample_id strings
    # results['sample_number'] = results['game_sample_id'].apply(lambda x: int(str(x).replace('sample_', '')))

    # # Count the number of samples for each game concept ID (including duplicates)
    # sample_counts = results.groupby(['game_concept_id', 'game_genre'])['game_sample_id'].count()
    # print("Number of samples for each game concept ID (including duplicates):")
    # for (concept_id, genre), count in sample_counts.items():
    #     print(f"Game concept ID: {concept_id}, Genre: {genre}, Number of samples: {count}")

    # # Print min sample number for each game concept ID
    # min_samples = results.groupby('game_concept_id')['sample_number'].min()
    # print("Minimum sample number for each game concept ID:")
    # for concept_id, min_num in min_samples.items():
    #     print(f"Game concept ID: {concept_id}, Min sample number: {min_num}")

    # # Keep only rows with minimum sample number for each game concept ID
    # filtered_results = results[results.groupby('game_concept_id')['sample_number'].transform('min') == results['sample_number']]

    # # Remove the helper column
    # filtered_results = filtered_results.drop('sample_number', axis=1)

    # # First, find the sample with the highest consistency_score_llm_policy for each concept ID
    # print("\nSample with highest consistency_score_llm_policy for each game concept ID:")
    # best_samples = results.groupby('game_concept_id')['consistency_score_llm_policy'].idxmax()
    
    # # Create a filtered dataframe with only the best samples
    # filtered_best_results = results.loc[best_samples]
    
    # # Print information about the selected samples
    # for _, row in filtered_results.iterrows():
    #     print(f"Game concept ID: {row['game_concept_id']}, Best sample ID: {row['game_sample_id']}, Score: {row['consistency_score_llm_policy']}")
    
    # # compute average rating for each 
    # print(f"Original results: {len(results)} rows")
    # print(f"Filtered results: {len(filtered_results)} rows")
    # print(f"Filtered results (best consistency): {len(filtered_results)} rows")

    # fun_ratings_first_sample = []
    # fun_ratings_best_sample = []
    # playability_ratings_first_sample = []
    # playability_ratings_best_sample = []
    # for game_concept_id in results["game_concept_id"].unique():
    #     ratings_first_sample = filtered_results[filtered_results["game_concept_id"] == game_concept_id]
    #     ratings_best_sample = filtered_best_results[filtered_best_results["game_concept_id"] == game_concept_id]

    #     avg_fun_rating_first_sample = ratings_first_sample["rating_fun"].mean()
    #     avg_fun_rating_best_sample = ratings_best_sample["rating_fun"].mean()
    #     avg_playability_rating_first_sample = ratings_first_sample["rating_playability"].mean()
    #     avg_playability_rating_best_sample = ratings_best_sample["rating_playability"].mean()

    #     first_sample_id = ratings_first_sample["game_sample_id"].iloc[0] if not ratings_first_sample.empty else None
    #     best_sample_id = ratings_best_sample["game_sample_id"].iloc[0] if not ratings_best_sample.empty else None
    #     print(f"Game concept ID: {game_concept_id}")
    #     print(f"First sample ID: {first_sample_id}")
    #     print(f"Best sample ID: {best_sample_id}")
    #     print(f"Average fun rating (first sample): {avg_fun_rating_first_sample}")
    #     print(f"Average fun rating (best sample): {avg_fun_rating_best_sample}")
    #     print(f"Average playability rating (first sample): {avg_playability_rating_first_sample}")
    #     print(f"Average playability rating (best sample): {avg_playability_rating_best_sample}")

    #     fun_ratings_first_sample.append(avg_fun_rating_first_sample)
    #     fun_ratings_best_sample.append(avg_fun_rating_best_sample)
    #     playability_ratings_first_sample.append(avg_playability_rating_first_sample)
    #     playability_ratings_best_sample.append(avg_playability_rating_best_sample)
    # breakpoint()
    # # bar plot (average of the ratings across concept ids with std)
    # plt.figure(figsize=(6, 4), dpi=300)
    
    # # Create a DataFrame for plotting
    # comparison_df = pd.DataFrame({
    #     'First Sample - Fun': fun_ratings_first_sample,
    #     'Best Sample - Fun': fun_ratings_best_sample,
    #     'First Sample - Playability': playability_ratings_first_sample,
    #     'Best Sample - Playability': playability_ratings_best_sample
    # })
    
    # # Calculate means and standard errors
    # means = comparison_df.mean()
    # std_errors = comparison_df.std() / np.sqrt(len(comparison_df))
    
    # bar_width = 0.35
    # r1 = np.arange(2)
    # r2 = [x + bar_width for x in r1]
    
    # plt.bar(r1, [means['First Sample - Fun'], means['First Sample - Playability']], 
    #         width=bar_width, label='First sample', color='skyblue',
    #         yerr=[std_errors['First Sample - Fun'], std_errors['First Sample - Playability']], capsize=5)
    
    # plt.bar(r2, [means['Best Sample - Fun'], means['Best Sample - Playability']], 
    #         width=bar_width, label='Best consistency sample', color='lightcoral',
    #         yerr=[std_errors['Best Sample - Fun'], std_errors['Best Sample - Playability']], capsize=5)
    
    # plt.xlabel('Rating criteria')
    # plt.ylabel('Average human rating')
    # plt.xticks([r + bar_width/2 for r in r1], ['Fun', 'Playability'])
    # plt.legend()
    # ax = plt.gca()
    # ax.spines['top'].set_visible(False)
    # ax.spines['right'].set_visible(False)
    # plt.tight_layout()
    # plt.savefig(save_dir / "first_vs_best_samples_ratings.png")


    # # Create a minimal figure with individual points and connecting lines
    # plt.figure(figsize=(6, 4))
    # for i in range(len(fun_ratings_first_sample)):
    #     plt.plot([0, 1], [fun_ratings_first_sample[i], fun_ratings_best_sample[i]], 
    #              'o-', color='skyblue', alpha=0.7, markersize=8)
    # for i in range(len(playability_ratings_first_sample)):
    #     plt.plot([2, 3], [playability_ratings_first_sample[i], playability_ratings_best_sample[i]], 
    #              'o-', color='lightcoral', alpha=0.7, markersize=8)
    # plt.ylabel('Human rating')
    # plt.xticks([0.5, 2.5], ['Fun', 'Playability'])
    # plt.xlabel('Rating criteria')
    # plt.legend()
    # ax = plt.gca()
    # ax.spines['top'].set_visible(False)
    # ax.spines['right'].set_visible(False)
    # plt.tight_layout()
    # plt.savefig(save_dir / "first_vs_best_samples_individual_points.png")



    # # plot rating vs ["hasn't won", "has won", "has won and failed"]
    # plt.figure()
    # # Create a new column for win/fail status
    # def win_fail_status(row):
    #     if row["num_game_win"] > 0 and row["num_game_fail"] > 0:
    #         return "Has won and failed"
    #     elif row["num_game_win"] > 0:
    #         return "Has won"
    #     else:
    #         return "Hasn't won"

    # results["win_fail_status"] = results.apply(win_fail_status, axis=1)

    # # Create categorical type with proper ordering
    # cat_type = pd.CategoricalDtype(
    #     categories=["Hasn't won", "Has won", "Has won and failed"],
    #     ordered=True
    # )
    # results["win_fail_status"] = results["win_fail_status"].astype(cat_type)
    
    # # Use stripplot instead of scatterplot for categorical x-axis with jitter
    # sns.stripplot(x="win_fail_status", y="rating", data=results, 
    #              alpha=0.7, jitter=True)
    # plt.xlabel("Win/Fail Status")
    # plt.ylabel("Rating")
    # plt.tight_layout()
    # plt.savefig(save_dir / "rating_vs_win_fail_status.png")


    # for each game, plot the number of interactions triggered by each user (to assess variability in gameplay across users)
    interaction_types_by_user_by_game = defaultdict(dict)
    for game_id in results["game_id"].unique():
        _save_dir = save_dir / "results_by_game" / f"game_{game_id}"
        _save_dir.mkdir(exist_ok=True, parents=True)

        print("Game:", game_id)
        # number of users who played this game
        num_users = results[results["game_id"] == game_id]["user_id"].nunique()
        print("Number of users who played this game:", num_users)

        # get static results for model and method corresponding to game_id
        game = game_dataset.filter(lambda x: x["id"] == game_id)[0]

        game_mechanics = game["mechanics_implemented"]

        gameplay_mechanics_counts = defaultdict(dict)
        for i, res in results[results["game_id"] == game_id].iterrows():
            user_id = res["user_id"]
            gameplay_mechanics_counts[user_id] = {k: 0 for k in game_mechanics}

            log_analysis = json.loads(res["log_analysis"])

            if log_analysis is None:
                print(f"No log analysis for user {user_id} and game {game_id}")
                continue

            for int_type, int_count in log_analysis["interaction_counts"].items():
                gameplay_mechanics_counts[user_id][int_type] += int_count
            for mvt_type, mvt_count in log_analysis["movement_counts"].items():
                gameplay_mechanics_counts[user_id][mvt_type] += mvt_count

            print(res["user_id"])
            print("Interaction counts:", log_analysis["interaction_counts"])
            print("Movement counts:", log_analysis["movement_counts"])
            print("-"*100)

        plt.figure()
        for user_id, counts in gameplay_mechanics_counts.items():
            plt.plot(counts.keys(), counts.values(), label=user_id, marker=".", color=user_color_mapping[user_id])
        plt.xlabel("Mechanic")
        plt.ylabel("Count")
        plt.xticks(rotation=90)
        ax = plt.gca()
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
        plt.tight_layout()
        plt.savefig(_save_dir / "mechanics_counts.png")
        plt.close('all')

        # same but divide by the max count across users for each mechanic
        plt.figure()
        # Get max count for each mechanic across all users
        max_counts = {}
        for mechanic in game_mechanics:
            max_counts[mechanic] = max([counts.get(mechanic, 0) for counts in gameplay_mechanics_counts.values()])
        
        # Plot normalized counts
        for user_id, counts in gameplay_mechanics_counts.items():
            # Normalize by dividing each count by the max count for that mechanic
            normalized_counts = {mechanic: (counts.get(mechanic, 0) / max_counts[mechanic] if max_counts[mechanic] > 0 else 0) 
                                for mechanic in game_mechanics}
            plt.plot(normalized_counts.keys(), normalized_counts.values(), label=user_id, marker=".", color=user_color_mapping[user_id])
        
        plt.xlabel("Mechanic")
        plt.ylabel("Normalized Count")
        plt.xticks(rotation=90)
        ax = plt.gca()
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
        plt.tight_layout()
        plt.savefig(_save_dir / "mechanics_counts_normalized.png")
        plt.close('all')


    _save_dir = save_dir / "consistency_analysis"
    _save_dir.mkdir(exist_ok=True, parents=True)

    # compare ratings with consistency scores
    for game_id in results["game_id"].unique():
        game = game_dataset.filter(lambda x: x["id"] == game_id)[0]
        model = game["model"]
        method = game["method"]

        game_mechanics = game["mechanics_implemented"]

        consistency_score_llm_policy = game["consistency_score_llm_policy"]

        for i, res in results[results["game_id"] == game_id].iterrows():
            user_id = res["user_id"]
            assert res["model"] == model
            assert res["method"] == method

            log_analysis = json.loads(res["log_analysis"])
            if log_analysis is None:
                print(f"Missing logs for {model} {method}")
                continue

            # list of mechanics triggered by the user
            triggered_mechanics = log_analysis["interaction_types"] + log_analysis["movement_types"]
            for mechanic in triggered_mechanics:
                if mechanic not in game_mechanics:
                    breakpoint()
                assert mechanic in game_mechanics, f"Mechanic {mechanic} not in game mechanics"
            # score = len(triggered_mechanics) / len(game_mechanics)

            score = 0
            for mechanic in game_mechanics:
                if mechanic in triggered_mechanics:
                    score += 1
            score = score / len(game_mechanics)

            assert np.allclose(results.at[i, "code_gameplay_consistency"], score * 100), f"{results.at[i, 'code_gameplay_consistency']} != {score * 100}"
            # results.at[i, "code_gameplay_consistency"] = score * 100
            results.at[i, "consistency_score_llm_policy"] = consistency_score_llm_policy

    # plot rating vs code_gameplay_mechanics_consistency with fixed color mapping
    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="code_gameplay_consistency", hue="user_id", palette=user_color_mapping)
    plt.ylabel("Fun rating")
    plt.xlabel("Code-gameplay consistency")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(_save_dir / "fun_rating_vs_code_gameplay_consistency.png")

    plt.figure()
    sns.scatterplot(data=results, y="rating_playability", x="code_gameplay_consistency", hue="user_id", palette=user_color_mapping)
    plt.ylabel("Playability rating")
    plt.xlabel("Code-gameplay consistency")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(_save_dir / "playability_rating_vs_code_gameplay_consistency.png")


    # Use lmplot to create regression lines for each user
    g = sns.lmplot(
        data=results,
        x="code_gameplay_consistency", 
        y="rating_fun", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("Code-gameplay consistency", "Fun rating")
    # Remove top and right spines
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(_save_dir / "fun_rating_vs_code_gameplay_consistency_with_regression.png")

    # Use lmplot to create regression lines for each user
    g = sns.lmplot(
        data=results,
        x="code_gameplay_consistency", 
        y="rating_playability", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("Code-gameplay consistency", "Playability rating")
    # Remove top and right spines
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(_save_dir / "playability_rating_vs_code_gameplay_consistency_with_regression.png")



    # same plots as above but with consistency_score_llm_policy

    # Regression plot: rating_fun vs consistency_score_llm_policy by user
    g = sns.lmplot(
        data=results,
        x="consistency_score_llm_policy", 
        y="rating_fun", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("LLM Policy Consistency Score", "Fun rating")
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(_save_dir / "fun_rating_vs_consistency_score_llm_policy_with_regression.png")

    # Regression plot: rating_playability vs consistency_score_llm_policy by user
    g = sns.lmplot(
        data=results,
        x="consistency_score_llm_policy", 
        y="rating_playability", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("LLM Policy Consistency Score", "Playability rating")
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(_save_dir / "playability_rating_vs_consistency_score_llm_policy_with_regression.png")


    # plot human gameplay consistency vs consistency_score_llm_policy
    plt.figure()
    sns.scatterplot(data=results, y="code_gameplay_consistency", x="consistency_score_llm_policy", hue="user_id", palette=user_color_mapping)
    # Add y=x identity line for reference
    ax = plt.gca()
    min_val = min(results["code_gameplay_consistency"].min(), results["consistency_score_llm_policy"].min())
    max_val = max(results["code_gameplay_consistency"].max(), results["consistency_score_llm_policy"].max())
    ax.plot([min_val, max_val], [min_val, max_val], 'k--', lw=1, label='Identity')

    plt.ylabel("Code-gameplay consistency")
    plt.xlabel("LLM Policy Consistency Score")
    plt.savefig(_save_dir / "code_gameplay_consistency_vs_consistency_score_llm_policy.png")



    # plot rating vs code_gameplay_mechanics_consistency with fixed color mapping
    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="code_gameplay_consistency", alpha=0.7, color="tab:blue")
    plt.ylabel("Fun rating")
    plt.xlabel("Consistency score (human gameplay)")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(_save_dir / "consistency_score_human_vs_fun_rating.png")

    plt.figure()
    sns.scatterplot(data=results, y="rating_playability", x="code_gameplay_consistency", alpha=0.7, color="tab:blue")
    plt.ylabel("Playability rating")
    plt.xlabel("Consistency score (human gameplay)")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(_save_dir / "consistency_score_human_vs_playability_rating.png")


    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="consistency_score_llm_policy", alpha=0.7, color="tab:orange")
    plt.ylabel("Fun rating")
    plt.xlabel("Consistency score (LLM policy)")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(_save_dir / "consistency_score_llm_policy_vs_fun_rating.png")

    plt.figure()
    sns.scatterplot(data=results, y="rating_playability", x="consistency_score_llm_policy", alpha=0.7, color="tab:orange")
    plt.ylabel("Playability rating")
    plt.xlabel("Consistency score (LLM policy)")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(_save_dir / "consistency_score_llm_policy_vs_playability_rating.png")
