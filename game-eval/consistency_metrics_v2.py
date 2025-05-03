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


games_version = "v6"

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
    static_analysis_dataset = load_dataset(STATIC_ANALYSIS_DATASET, split="train")

    # TODO: remove users with less than 10 ratings (didn't complete the study)

    # if "judge" not in rating_dataset:
    #     rating_dataset = rating_dataset.rename_column("judge", "user_id")

    # torchvision error
    # video_dataset = load_dataset(VIDEO_DATASET, split="train")
    print(rating_dataset)
    print(static_analysis_dataset)

    # number of entries in rating dataset for each user
    print("Number of entries in rating dataset for each user:")
    for user_id in np.unique(rating_dataset["user_id"]):
        print(f"{user_id}: {len(rating_dataset.filter(lambda x: x['user_id'] == user_id))}")

    # remove test users (any user with "test" in their id)
    # rating_dataset = rating_dataset.filter(lambda x: "test" not in x["user_id"])
    print(f"After removing test users: {rating_dataset}")

    results = defaultdict(list)
    # gameplay_results = defaultdict(lambda: defaultdict(dict))

    for entry in rating_dataset:
        rating_id = entry["id"]
        game_id = entry["game_id"]

        _res_dir = save_dir / "results_by_user" / f"user_{entry['user_id']}" / f"game_{game_id}"
        _res_dir.mkdir(exist_ok=True, parents=True)

        # find matching game 
        game = game_dataset.filter(lambda x: x["id"] == game_id)
        assert len(game) == 1
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
            else:
                results["time_spent"].append(0)
            print(f"Number of key inputs: {len(key_inputs)}, time spent: {time_spent}")
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
        results["game_concept"].append(game["game_concept"])
        results["user_id"].append(entry["user_id"])
        results["video_path"].append(video_path)
        results["events"].append(entry["events"])
        results["log_analysis"].append(json.dumps(res, indent=4))

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

        # gameplay_results[model][method].update(
        #     {
        #         game["game_concept"]: res
        #     }
        # )


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
                "game_concept": game["game_concept"],
                "game_id": game_id,
                "rating_id": rating_id,
                "user_id": entry["user_id"]
            }, f, indent=4)

        # save events
        with open(_res_dir / "events.json", "w") as f:
            events = json.loads(entry["events"])
            json.dump(events, f, indent=4)

    results = pd.DataFrame(results)

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
    plt.savefig(save_dir / "ratings_per_user.png")

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
    plt.savefig(save_dir / "videos_per_user.png")

    # number of ratings with logs for each user
    print("Number of ratings with logs for each user:")
    print(results[results["log_analysis"].notna()]["user_id"].value_counts())
    plt.figure()
    sns.barplot(y=results[results["log_analysis"].notna()]["user_id"].value_counts().index, x=results[results["log_analysis"].notna()]["user_id"].value_counts().values, orient="h")
    plt.ylabel("User ID")
    plt.xlabel("Number of ratings with logs")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(save_dir / "ratings_with_logs_per_user.png")

    # plot average number of key presses per user
    plt.figure()
    sns.barplot(y=results["user_id"], x=results["num_key_presses"])
    plt.ylabel("User ID")
    plt.xlabel("Number of key presses")
    plt.tight_layout()
    plt.savefig(save_dir / "key_presses_per_user_avg.png")

    # plot average time spent per user
    plt.figure()
    sns.barplot(y=results["user_id"], x=results["time_spent"])
    plt.ylabel("User ID")
    plt.xlabel("Time spent (seconds)")
    plt.tight_layout()
    plt.savefig(save_dir / "time_spent_per_user_avg.png")

    plt.figure()
    sns.stripplot(y="user_id", x="num_key_presses", data=results, jitter=True, alpha=0.7)
    plt.ylabel("User ID")
    plt.xlabel("Number of key presses")
    plt.tight_layout()
    plt.savefig(save_dir / "key_presses_per_user.png")

    # plot time spent per user (showing individual points)
    plt.figure()
    sns.stripplot(y="user_id", x="time_spent", data=results, jitter=True, alpha=0.7)
    plt.ylabel("User ID")
    plt.xlabel("Time spent (seconds)")
    plt.tight_layout()
    plt.savefig(save_dir / "time_spent_per_user.png")

    # plot rating vs time spent with fixed color mapping
    plt.figure()
    sns.scatterplot(data=results, y="rating", x="time_spent", hue="user_id", palette=user_color_mapping)
    plt.ylabel("Rating")
    plt.xlabel("Time spent (seconds)")
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(save_dir / "rating_vs_time_spent.png")
    
    # Use lmplot to create regression lines for each user for rating vs time spent
    g = sns.lmplot(
        data=results,
        x="time_spent", 
        y="rating", 
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
    plt.savefig(save_dir / "rating_vs_time_spent_with_regression.png")

    # TODO: aggregate ratings across games
    # results["fun_rating"] = results["rating"].apply(lambda x: x["fun"]).astype(int)

    plt.figure()
    sns.scatterplot(data=results, y="rating", x="game_concept", hue="model")
    plt.xticks(rotation=90)
    plt.xlabel('')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_game.png")

    plt.figure()
    sns.scatterplot(data=results, y="rating", x="game_id", hue="user_id", palette=user_color_mapping)
    plt.xticks(list(range(len(results["game_id"].unique()))), list(range(len(results["game_id"].unique()))))
    # # remove tick labels (but keep tick marks)
    # ax = plt.gca()
    # ax.set_xticklabels([])
    plt.xlabel('Game')
    plt.ylabel('Human rating')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(save_dir / "rating_vs_game_by_user.png")
    plt.close('all')

    # plot rating vs ["hasn't won", "has won", "has won and failed"]
    plt.figure()
    # Create a new column for win/fail status
    def win_fail_status(row):
        if row["num_game_win"] > 0 and row["num_game_fail"] > 0:
            return "Has won and failed"
        elif row["num_game_win"] > 0:
            return "Has won"
        else:
            return "Hasn't won"

    results["win_fail_status"] = results.apply(win_fail_status, axis=1)

    # Create categorical type with proper ordering
    cat_type = pd.CategoricalDtype(
        categories=["Hasn't won", "Has won", "Has won and failed"],
        ordered=True
    )
    results["win_fail_status"] = results["win_fail_status"].astype(cat_type)
    
    # Use stripplot instead of scatterplot for categorical x-axis with jitter
    sns.stripplot(x="win_fail_status", y="rating", data=results, 
                 alpha=0.7, jitter=True)
    plt.xlabel("Win/Fail Status")
    plt.ylabel("Rating")
    plt.tight_layout()
    plt.savefig(save_dir / "rating_vs_win_fail_status.png")

 

    # for each game, plot the number of interactions triggered by each user (to assess variability in gameplay across users)
    interaction_types_by_user_by_game = defaultdict(dict)
    for game_id in results["game_id"].unique():
        _save_dir = save_dir / "results_by_game" / f"game_{game_id}"
        _save_dir.mkdir(exist_ok=True, parents=True)

        print("Game:", game_id)
        # number of users who played this game
        num_users = results["user_id"][results["game_id"] == game_id].nunique()
        print("Number of users who played this game:", num_users)

        # retrieve game static analysis
        game_concept = results["game_concept"][results["game_id"] == game_id].unique()
        assert len(game_concept) == 1, f"Found {len(game_concept)} game concepts for game {game_id}"
        game_concept = game_concept[0]

        # get static results for model and method corresponding to game_id
        game = game_dataset.filter(lambda x: x["id"] == game_id)[0]
        static_res = static_analysis_dataset.filter(lambda x: x["model"] == game["model"] and x["method"] == game["method"])
        assert len(static_res) == 1, f"Found {len(static_res)} static analysis results for game {game_id}"
        static_res = static_res[0]

        game_mvt_types = static_res["interaction_types"][game_concept]
        game_int_types = static_res["movement_types"][game_concept]
        game_mechanics = game_mvt_types + game_int_types

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


    # game_scores = defaultdict(list)
    # for model in results["model"].unique():
    #     for method in results["method"].unique():
    #         _save_dir = save_dir / f"{model}_{method}"

    #         # res = results[results["model"] == model][results["method"] == method]
    #         gameplay_res = gameplay_results[model][method]

    #         static_analysis_res = static_analysis_dataset.filter(lambda x: x["model"] == model and x["method"] == method)
    #         assert len(static_analysis_res) == 1, f"Found {len(static_analysis_res)} static analysis results for {model} {method}"
    #         static_analysis_res = static_analysis_res[0]

    #         missing_logs = False
    #         for game_concept in gameplay_res.keys():
    #             if gameplay_res[game_concept] is None:
    #                 missing_logs = True
    #                 break

    #         if missing_logs:
    #             print(f"Missing logs for {model} {method}")
    #             continue

    #         _game_scores = analyze_consistency(gameplay_res, static_analysis_res, _save_dir)
    #         # for game_concept, scores in _game_scores.items():
    #         #     game_scores["model"].append(model)
    #         #     game_scores["method"].append(method)
    #         #     game_scores["game_concept"].append(game_concept)
    #         #     game_scores["interaction_score"].append(scores["interaction_score"])
    #         #     game_scores["movement_score"].append(scores["movement_score"])
    #         #     game_scores["joint_score"].append(scores["joint_score"])


    #         #     mask = (
    #         #         (results["model"] == model) &
    #         #         (results["method"] == method) &
    #         #         (results["game_concept"] == game_concept)
    #         #     )
    #         #     fun_rating = results[mask]["fun_rating"].values
    #         #     # TODO: handle multiple ratings for same model, method, game_concept
    #         #     # assert len(fun_rating) == 1, f"Found {len(fun_rating)} fun ratings for {model} {method} {game_concept}"
    #         #     # fun_rating = fun_rating[0]
    #         #     fun_rating = np.mean(fun_rating)
    #         #     game_scores["fun_rating"].append(fun_rating)

    #         for game_concept, scores in _game_scores.items():
    #             for user_id in results["user_id"].unique():
    #                 game_scores["model"].append(model)
    #                 game_scores["method"].append(method)
    #                 game_scores["game_concept"].append(game_concept)
    #                 game_scores["interaction_score"].append(scores["interaction_score"])
    #                 game_scores["movement_score"].append(scores["movement_score"])
    #                 game_scores["joint_score"].append(scores["joint_score"])
    #                 game_scores["user_id"].append(user_id)


    #                 mask = (
    #                     (results["model"] == model) &
    #                     (results["method"] == method) &
    #                     (results["game_concept"] == game_concept) &
    #                     (results["user_id"] == user_id)
    #                 )
    #                 fun_rating = results[mask]["fun_rating"].values
    #                 # TODO: handle multiple ratings for same model, method, game_concept
    #                 # assert len(fun_rating) == 1, f"Found {len(fun_rating)} fun ratings for {model} {method} {game_concept}"
    #                 # fun_rating = fun_rating[0]
    #                 fun_rating = np.mean(fun_rating)
    #                 game_scores["fun_rating"].append(fun_rating)

    # game_scores = pd.DataFrame(game_scores)

    # # average score
    # game_scores["average_score"] = (game_scores["interaction_score"] + game_scores["movement_score"]) / 2

    # game_scores.to_csv(save_dir / "game_scores.csv", index=False)

    # # plot average score vs fun rating
    # # plt.figure()
    # # sns.scatterplot(data=game_scores, y="fun_rating", x="average_score")
    # # plt.savefig(save_dir / "fun_rating_vs_average_score.png")

    # # # plot interaction score vs fun rating
    # # plt.figure()
    # # sns.scatterplot(data=game_scores, y="fun_rating", x="interaction_score")
    # # plt.savefig(save_dir / "fun_rating_vs_interaction_score.png")

    # # # plot movement score vs fun rating
    # # plt.figure()
    # # sns.scatterplot(data=game_scores, y="fun_rating", x="movement_score")
    # # plt.savefig(save_dir / "fun_rating_vs_movement_score.png")

    # # plot joint score vs fun rating
    # plt.figure(figsize=(5, 4), dpi=150)
    # sns.scatterplot(data=game_scores, y="fun_rating", x="joint_score", hue="model")
    # # add regression line and compute p-value
    # import scipy.stats as stats

    # # Fit linear regression
    # # x = game_scores["joint_score"]
    # # y = game_scores["fun_rating"]
    # # slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

    # # Plot regression line
    # # x_vals = np.linspace(x.min(), x.max(), 100)
    # # y_vals = slope * x_vals + intercept
    # # plt.plot(x_vals, y_vals, color="black", linestyle="--", label=f"Regression line (p={p_value:.3g})")


    # # # Annotate p-value on the plot
    # # plt.text(
    # #     0.05, 0.95,
    # #     f"p-value: {p_value:.3g}",
    # #     transform=plt.gca().transAxes,
    # #     verticalalignment="top",
    # #     fontsize=10,
    # #     bbox=dict(facecolor='white', alpha=0.7, edgecolor='none')
    # # )
    # # print(f"p-value: {p_value:.3g}, r-value: {r_value:.3g}")

    # plt.xlabel("Consistency score")
    # plt.ylabel("Human rating")
    # plt.legend(title='')
    # ax = plt.gca()
    # ax.spines['top'].set_visible(False)
    # ax.spines['right'].set_visible(False)
    # plt.tight_layout()
    # plt.savefig(save_dir / "fun_rating_vs_joint_score.png")

    # plt.figure()
    # sns.scatterplot(data=game_scores, y="fun_rating", x="joint_score", hue="user_id")
    # plt.xlabel("Consistency score")
    # plt.ylabel("Human rating")
    # plt.legend(title='')
    # ax = plt.gca()
    # ax.spines['top'].set_visible(False)
    # ax.spines['right'].set_visible(False)
    # plt.tight_layout()
    # plt.savefig(save_dir / "fun_rating_vs_joint_score_by_user.png")


    # compare ratings with consistency scores
    for game_id in results["game_id"].unique():
        game = game_dataset.filter(lambda x: x["id"] == game_id)[0]
        model = game["model"]
        method = game["method"]
        game_concept = game["game_concept"]

        # get static results for model and method corresponding to game_id
        static_res = static_analysis_dataset.filter(lambda x: x["model"] == game["model"] and x["method"] == game["method"])[0]

        game_mvt_types = static_res["interaction_types"][game_concept]
        game_int_types = static_res["movement_types"][game_concept]
        game_mechanics = game_mvt_types + game_int_types

        for i, res in results[results["game_id"] == game_id].iterrows():
            user_id = res["user_id"]
            rating = res["rating"]
            assert res["model"] == model
            assert res["method"] == method
            assert res["game_concept"] == game_concept

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

            score = len(triggered_mechanics) / len(game_mechanics)
            results.at[i, "code_gameplay_consistency"] = score * 100

    # plot rating vs code_gameplay_mechanics_consistency with fixed color mapping
    plt.figure()
    sns.scatterplot(data=results, y="rating", x="code_gameplay_consistency", hue="user_id", palette=user_color_mapping)
    plt.ylabel("Rating")
    plt.xlabel("Code-gameplay consistency")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.legend([],[], frameon=False)  # Hide the legend since we have a separate figure
    plt.tight_layout()
    plt.savefig(save_dir / "rating_vs_code_gameplay_consistency.png")
    
    # Use lmplot to create regression lines for each user
    g = sns.lmplot(
        data=results,
        x="code_gameplay_consistency", 
        y="rating", 
        hue="user_id",
        palette=user_color_mapping,
        height=6,
        aspect=1.5,
        scatter_kws={"alpha": 0.7},
        legend=False,
        ci=None  # Remove confidence interval bands
    )
    g.set_axis_labels("Code-gameplay consistency", "Rating")
    # Remove top and right spines
    for ax in g.axes.flat:
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
    plt.savefig(save_dir / "rating_vs_code_gameplay_consistency_with_regression.png")

    # same plot by model
    plt.figure()
    sns.scatterplot(data=results, y="rating", x="code_gameplay_consistency", hue="model")
    plt.ylabel("Rating")
    plt.xlabel("Code-gameplay consistency")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "rating_vs_code_gameplay_consistency_by_model.png")
