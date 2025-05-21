#!/usr/bin/env python
import argparse
import os
import time
import glob

def run_command(cmd):
    """Run a shell command using os.system"""
    print(f"Running: {cmd}")
    os.system(cmd)

def check_generation_complete(game_id):
    """Check if game generation is complete by verifying that all required folders and files exist"""
    base_paths = [
        f"games/claude-3.7-sonnet/Baseline/game_{game_id}/sample_0/",
        f"games/claude-3.7-sonnet/SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/",
        f"games/claude-3.7-sonnet/TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/"
    ]
    
    all_complete = True
    for path in base_paths:
        # Check if path exists
        if not os.path.exists(path):
            all_complete = False
            break
        
        # Check if HTML file exists
        html_files = glob.glob(os.path.join(path, "*.html"))
        if not html_files:
            all_complete = False
            break
            
        # Check if JS files exist
        js_files = glob.glob(os.path.join(path, "*.js"))
        if not js_files:
            all_complete = False
            break
    
    return all_complete

def check_vibe_coding_complete(game_id):
    """Check if vibe_coding is complete by verifying that output folders and files exist"""
    base_paths = [
        f"games/claude-3.7-sonnet/vibe_coding_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/",
        f"games/claude-3.7-sonnet/vibe_coding_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/"
    ]
    
    all_complete = True
    for path in base_paths:
        # Check if path exists
        if not os.path.exists(path):
            all_complete = False
            break
        
        # Check if HTML file exists
        html_files = glob.glob(os.path.join(path, "*.html"))
        if not html_files:
            all_complete = False
            break
            
        # Check if JS files exist
        js_files = glob.glob(os.path.join(path, "*.js"))
        if not js_files:
            all_complete = False
            break
    
    return all_complete

def check_vlm_play_complete(game_id):
    """Check if vlm_play is complete by verifying that output folders and files exist"""
    base_paths = [
        f"games/claude-3.7-sonnet/vlm_play_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/",
        f"games/claude-3.7-sonnet/vlm_play_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/"
    ]
    
    all_complete = True
    for path in base_paths:
        # Check if path exists
        if not os.path.exists(path):
            all_complete = False
            break
        
        # Check if HTML file exists
        html_files = glob.glob(os.path.join(path, "*.html"))
        if not html_files:
            all_complete = False
            break
            
        # Check if JS files exist
        js_files = glob.glob(os.path.join(path, "*.js"))
        if not js_files:
            all_complete = False
            break
    
    return all_complete

def get_generation_commands(game_indices, phase, print_mode=False):
    """Generate commands for the specified game indices and phase"""
    commands = []
    verification_commands = []
    command_count = 0  # Counter to track every 4th command
    
    for game_index in game_indices:
        game_id = f"{game_index:04d}"
        
        if phase == "gen_models" or phase == "baseline":
            command_count += 1
            # Every 4th command doesn't get a background & sign
            bg = "" if command_count % 4 == 0 else " &"
            cmd = f"python game_generators/generate_game_main.py --concept_path ./game_prompts/generative_games/final_concepts/game_{game_id}.json --method baseline --no_ecs --verbose {bg}"
            commands.append(cmd)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            verification_cmd = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/Baseline/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1 {bg}"
            verification_commands.append(verification_cmd)
            
        if phase == "gen_models" or phase == "sp":
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            cmd = f"python game_generators/generate_game_main.py --concept_path ./game_prompts/generative_games/final_concepts/game_{game_id}.json --method simple_prompt_xml --verbose --generate_with_ai --no_ecs {bg}"
            commands.append(cmd)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            verification_cmd = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1 {bg}"
            verification_commands.append(verification_cmd)
            
        if phase == "gen_models" or phase == "two_step":
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            cmd = f"python game_generators/generate_game_main.py --concept_path ./game_prompts/generative_games/final_concepts/game_{game_id}.json --method two_step_xml --verbose --generate_with_ai --no_ecs {bg}"
            commands.append(cmd)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            verification_cmd = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1 {bg}"
            verification_commands.append(verification_cmd)
            
        if phase == "vibe_coding":
            # Ensure output directories exist
            os.makedirs(f"games/claude-3.7-sonnet/vibe_coding_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/", exist_ok=True)
            os.makedirs(f"games/claude-3.7-sonnet/vibe_coding_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/", exist_ok=True)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            cmd1 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode vibe_coding --output_dir games/claude-3.7-sonnet/vibe_coding_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/ {bg}"
            commands.append(cmd1)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            cmd2 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode vibe_coding --output_dir games/claude-3.7-sonnet/vibe_coding_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/ {bg}"
            commands.append(cmd2)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            vibe_verification_cmd1 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/vibe_coding_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1 {bg}"
            verification_commands.append(vibe_verification_cmd1)
            
            command_count += 1
            bg = "" if command_count % 4 == 0 else " &"
            vibe_verification_cmd2 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/vibe_coding_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1 {bg}"
            verification_commands.append(vibe_verification_cmd2)
            
        if phase == "vlm_play":
            # Ensure output directories exist
            os.makedirs(f"games/claude-3.7-sonnet/vlm_play_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/", exist_ok=True)
            os.makedirs(f"games/claude-3.7-sonnet/vlm_play_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/", exist_ok=True)
            
            # No background & for vlm_play commands
            cmd1 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode vlm_play --output_dir games/claude-3.7-sonnet/vlm_play_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/"
            commands.append(cmd1)
            
            cmd2 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode vlm_play --output_dir games/claude-3.7-sonnet/vlm_play_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/"
            commands.append(cmd2)
            
            # No background & for verification commands either
            vlm_verification_cmd1 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/vlm_play_SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1"
            verification_commands.append(vlm_verification_cmd1)
            
            vlm_verification_cmd2 = f"python game_generators/code_verifier_improver.py --game_path games/claude-3.7-sonnet/vlm_play_TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/ --mode basic_test --temperature 0.1"
            verification_commands.append(vlm_verification_cmd2)
    
    return commands, verification_commands

def generate_game(game_index, phase, max_wait_time=600, check_interval=30, print_mode=False):
    """Generate game for a specific index and phase"""
    game_id = f"{game_index:04d}"
    
    # Get commands for this game
    commands, verification_commands = get_generation_commands([game_index], phase, print_mode)
    
    if print_mode:
        print(f"\n# Generation commands for game_{game_id} ({phase}):")
        for cmd in commands:
            print(cmd)
        
        print(f"\n# Verification commands for game_{game_id} ({phase}):")
        for cmd in verification_commands:
            print(cmd)
        return
    
    # Execute generation commands
    for cmd in commands:
        run_command(cmd)
    
    # Wait for appropriate resources to be generated based on phase
    if phase == "gen_models" or phase in ["baseline", "sp", "two_step"]:
        print(f"Waiting for game_{game_id} generation to complete...")
        wait_start_time = time.time()
        generation_complete = False
        
        while time.time() - wait_start_time < max_wait_time:
            paths_to_check = []
            if phase == "baseline":
                paths_to_check = [f"games/claude-3.7-sonnet/Baseline/game_{game_id}/sample_0/"]
            elif phase == "sp":
                paths_to_check = [f"games/claude-3.7-sonnet/SimplePromptXMLGenerator_NOECS/game_{game_id}/sample_0/"]
            elif phase == "two_step":
                paths_to_check = [f"games/claude-3.7-sonnet/TwoStepXMLGenerator_NOECS/game_{game_id}/sample_0/"]
            else:  # gen_models
                if check_generation_complete(game_id):
                    generation_complete = True
                    break
            
            # For individual methods, check only their specific paths
            if phase != "gen_models":
                all_exist = True
                for path in paths_to_check:
                    if not os.path.exists(path):
                        all_exist = False
                        break
                    
                    html_files = glob.glob(os.path.join(path, "*.html"))
                    if not html_files:
                        all_exist = False
                        break
                    
                    js_files = glob.glob(os.path.join(path, "*.js"))
                    if not js_files:
                        all_exist = False
                        break
                
                if all_exist:
                    generation_complete = True
                    break
            
            print(f"Game_{game_id} generation not complete yet, checking again in {check_interval} seconds...")
            time.sleep(check_interval)
    
    elif phase == "vibe_coding":
        print(f"Waiting for game_{game_id} vibe_coding to complete...")
        wait_start_time = time.time()
        vibe_coding_complete = False
        
        while time.time() - wait_start_time < max_wait_time:
            if check_vibe_coding_complete(game_id):
                vibe_coding_complete = True
                break
            print(f"Game_{game_id} vibe_coding not complete yet, checking again in {check_interval} seconds...")
            time.sleep(check_interval)
        
        if not vibe_coding_complete:
            print(f"WARNING: Timed out waiting for game_{game_id} vibe_coding to complete")
            return
            
    elif phase == "vlm_play":
        print(f"Waiting for game_{game_id} vlm_play to complete...")
        wait_start_time = time.time()
        vlm_play_complete = False
        
        while time.time() - wait_start_time < max_wait_time:
            if check_vlm_play_complete(game_id):
                vlm_play_complete = True
                break
            print(f"Game_{game_id} vlm_play not complete yet, checking again in {check_interval} seconds...")
            time.sleep(check_interval)
        
        if not vlm_play_complete:
            print(f"WARNING: Timed out waiting for game_{game_id} vlm_play to complete")
            return
    
    # For gen_models phases, check if files were generated
    if phase not in ["vibe_coding", "vlm_play"] and not generation_complete:
        print(f"WARNING: Timed out waiting for game_{game_id} generation to complete")
        return
        
    print(f"{phase} complete for game_{game_id}, waiting 30 seconds before verification...")
    time.sleep(30)  # Wait 30 seconds after detection before verification
    
    print(f"Starting verification for game_{game_id}...")
    
    # Execute verification commands
    for cmd in verification_commands:
        run_command(cmd)
    
    print(f"Verification completed for game_{game_id}")

def main():
    parser = argparse.ArgumentParser(description='Generate games for game concepts')
    parser.add_argument('--start_index', type=int, default=0, help='Starting index of game concepts (inclusive)')
    parser.add_argument('--end_index', type=int, default=1, help='Ending index of game concepts (exclusive)')
    parser.add_argument('--phase', type=str, default='gen_models', 
                      choices=['gen_models', 'baseline', 'sp', 'two_step', 'vibe_coding', 'vlm_play'], 
                      help='Phase of generation to run')
    parser.add_argument('--max_wait_time', type=int, default=12000,
                      help='Maximum time in seconds to wait for generation to complete')
    parser.add_argument('--check_interval', type=int, default=30,
                      help='Time interval in seconds between checks for generation completion')
    parser.add_argument('--print_commands', action='store_true',
                      help='Only print commands instead of executing them')
    
    args = parser.parse_args()
    
    if args.print_commands:
        game_indices = list(range(args.start_index, args.end_index))
        commands, verification_commands = get_generation_commands(game_indices, args.phase, True)
        
        print(f"\n# Generation commands for {args.phase} (games {args.start_index}-{args.end_index-1}):")
        for cmd in commands:
            print(cmd)
        
        print(f"\n# Verification commands for {args.phase} (games {args.start_index}-{args.end_index-1}):")
        for cmd in verification_commands:
            print(cmd)
    else:
        print(f"Starting {args.phase} for game indices {args.start_index} to {args.end_index-1}")
        
        # Process games sequentially
        for i in range(args.start_index, args.end_index):
            generate_game(i, args.phase, args.max_wait_time, args.check_interval, False)
        
        print(f"All {args.phase} tasks completed")

if __name__ == "__main__":
    main()
