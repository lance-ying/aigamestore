#!/usr/bin/env python3
"""
Run all available metrics on a game implementation.
"""

import os
import sys
# Add parent directory to path to ensure imports work from both project root and metrics directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))  # Add current directory as well
import json
import argparse
import logging
import asyncio
from typing import Dict, Any, Optional

try:
    # Try relative imports (if running from project root)
    from metrics.core.ecs_analyzer import (
        analyze_ecs_structure,
        merge_static_runtime_results,
        test_game_playability,
        test_game_playability_async,
    )
    from metrics.core.browser import extract_runtime_ecs_data
    from metrics.checks.implementation import check_js_implementation
except ImportError:
    # Fall back to direct imports (if running from metrics directory)
    from core.ecs_analyzer import analyze_ecs_structure, merge_static_runtime_results, test_game_playability
    from core.browser import extract_runtime_ecs_data
    from checks.implementation import check_js_implementation

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


async def run_metrics_async(
    game_path: str, 
    output_dir: Optional[str] = None, 
    record_gameplay: bool = False,
    recording_duration: int = 30,
    test_playability: bool = False,
    playability_duration: int = 15
) -> Dict[str, Any]:
    """
    Run all available metrics on a game implementation (async version).
    
    Args:
        game_path: Path to the game implementation directory
        output_dir: Directory to store output files like visualizations
        record_gameplay: Whether to record gameplay with screenshots
        recording_duration: Duration in seconds to record gameplay
        test_playability: Whether to run the simple playability test
        playability_duration: Duration in seconds for playability interaction
        
    Returns:
        Dictionary with all metrics results
    """
    if not os.path.exists(game_path):
        return {"error": f"Game path does not exist: {game_path}"}
        
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        
    results = {
        "game_path": game_path,
        "implementation_check": {},
        "ecs_structure": {},
        "playability_test": {},
        "errors": []
    }
    
    try:
        # Run implementation check
        impl_result = check_js_implementation(game_path)
        results["implementation_check"] = impl_result
        print("Implementation check completed")
        print("--------------------------------")
        print("Test: ", impl_result[0])
        print("Details: \n", json.dumps(impl_result[1], indent=2))
        print("--------------------------------")

        # Run playability test if requested
        if test_playability:
            logging.info(f"Running simplified playability test with {playability_duration}s interaction time...")
            print("\n" + "-"*80)
            print("PLAYABILITY TEST INSTRUCTIONS:")
            print("1. The game will load in a headless browser")
            print("2. The script will first capture the initial ECS state")
            print(f"3. You will have {playability_duration} seconds to interact with the game")
            print("4. After the time expires, the script will capture the final state")
            print("5. The states will be compared to determine if the game is playable")
            print("-"*80 + "\n")

            # Run the playability test
            playability_result = await test_game_playability_async(game_path, playability_duration)
            results["playability_test"] = playability_result

            # Log the result
            if playability_result.get("playable", False):
                logging.info("Game appears to be playable - detected ECS state changes")
            else:
                logging.info(f"Game may not be playable: {playability_result.get('reason', 'No state changes detected')}")
            
            # If playability test was successful and we have state data, use it to boost our ECS structure info
            if playability_result.get("playable", False) and not record_gameplay:
                # Extract static analysis results
                _, static_results = analyze_ecs_structure(game_path)
                
                # Add entity and component data from playability test
                if "changes" in playability_result:
                    entities_data = {}
                    components_data = {}
                    
                    # Process entity changes
                    for entity_id in playability_result["changes"].get("changed_entities", {}):
                        entities_data[entity_id] = []
                        for comp_name in playability_result["changes"]["changed_entities"][entity_id].get("changed_components", {}):
                            entities_data[entity_id].append(comp_name)
                            if comp_name not in components_data:
                                components_data[comp_name] = []
                                
                    # Create a minimal ECS structure result
                    ecs_result = {
                        "components": components_data,
                        "entities": entities_data,
                        "systems": {},
                        "_meta": {
                            "analysis_modes": ["playability-test"],
                            "errors": []
                        }
                    }
                    
                    # Merge with static results
                    results["ecs_structure"] = merge_static_runtime_results(static_results, ecs_result)
                    logging.info(f"ECS structure enriched with playability test data")
                else:
                    # Fall back to static analysis only
                    results["ecs_structure"] = static_results
        else:
            # Run full ECS structure analysis (both static and runtime)
            try:
                ecs_result = analyze_ecs_structure(
                    game_path, 
                    output_dir=output_dir, 
                    record_gameplay=record_gameplay,
                    recording_duration=recording_duration
                )
                results["ecs_structure"] = ecs_result
                
                # Add screenshot info to the main results if available
                if "_meta" in ecs_result and "screenshots" in ecs_result["_meta"]:
                    results["screenshots"] = {
                        "count": ecs_result["_meta"]["screenshot_count"],
                        "interval": ecs_result["_meta"]["screenshot_interval"],
                        "paths": ecs_result["_meta"]["screenshots"]
                    }
                    logging.info(f"Captured {len(ecs_result['_meta']['screenshots'])} gameplay screenshots")
                
                # Add visualization path to results if generated
                if "visualization_path" in ecs_result:
                    results["visualization_path"] = ecs_result["visualization_path"]
            except TimeoutError as te:
                logging.warning(f"ECS analysis timed out: {te}. Falling back to static analysis only.")
                # Run just the static analysis as fallback
                _, static_results = analyze_ecs_structure(game_path)
                results["ecs_structure"] = static_results
                results["errors"].append(f"Runtime analysis timed out: {str(te)}")
            
        logging.info(f"ECS structure analysis completed with {len(results['ecs_structure'].get('components', {}))} components, {len(results['ecs_structure'].get('entities', {}))} entities")
        
        # TODO: Add more metrics as they become available
        
    except Exception as e:
        logging.error(f"Error running metrics: {e}", exc_info=True)
        results["errors"].append(f"Metrics Error: {str(e)}")
        
    return results


def run_metrics(
    game_path: str, 
    output_dir: Optional[str] = None,
    record_gameplay: bool = False,
    recording_duration: int = 30,
    test_playability: bool = False,
    playability_duration: int = 15
) -> Dict[str, Any]:
    """
    Run all available metrics on a game implementation (synchronous wrapper).
    
    Args:
        game_path: Path to the game implementation directory
        output_dir: Directory to store output files like visualizations
        record_gameplay: Whether to record gameplay with screenshots
        recording_duration: Duration in seconds to record gameplay
        test_playability: Whether to run the simple playability test
        playability_duration: Duration in seconds for playability interaction
        
    Returns:
        Dictionary with all metrics results
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(
        run_metrics_async(
            game_path, 
            output_dir, 
            record_gameplay, 
            recording_duration,
            test_playability,
            playability_duration
        )
    )


def main():
    parser = argparse.ArgumentParser(description="Run metrics on a game implementation")
    parser.add_argument("game_path", help="Path to the game implementation directory")
    parser.add_argument("--output", "-o", help="Output file path for metrics results (JSON)")
    parser.add_argument("--output-dir", "-d", help="Directory to store output files like visualizations")
    parser.add_argument("--record", "-r", action="store_true", help="Record gameplay with screenshots every 5 seconds")
    parser.add_argument("--duration", "-t", type=int, default=30, help="Duration in seconds to record gameplay (default: 30)")
    parser.add_argument("--playability", "-p", action="store_true", default=True, help="Run simplified playability test (default: enabled)")
    parser.add_argument("--play-duration", type=int, default=15, help="Duration in seconds for playability test interaction (default: 15)")
    parser.add_argument("--no-playability", action="store_true", help="Disable the playability test")
    
    args = parser.parse_args()
    
    # Normalize the game path
    game_path = args.game_path
    # If the path is relative and we're running from the metrics directory
    # and the path doesn't exist as-is, try to resolve it from parent directory
    if not os.path.isabs(game_path) and not os.path.exists(game_path):
        # Check if we're being run from the metrics directory
        if os.path.basename(os.getcwd()) == "metrics":
            # Try to resolve from parent directory
            parent_dir_path = os.path.join("..", game_path)
            if os.path.exists(parent_dir_path):
                game_path = os.path.abspath(parent_dir_path)
                logging.info(f"Resolved game path to: {game_path}")
    
    # If --no-playability is specified, disable playability testing
    if args.no_playability:
        args.playability = False
    
    # Run the metrics
    results = run_metrics(
        game_path, 
        args.output_dir,
        record_gameplay=args.record,
        recording_duration=args.duration,
        test_playability=args.playability,
        playability_duration=args.play_duration
    )
    
    # Print summary
    print("\n--- Metrics Results Summary ---")
    print(f"ECS Structure: {len(results.get('ecs_structure', {}).get('components', {}))} components, {len(results.get('ecs_structure', {}).get('entities', {}))} entities")
    
    if "playability_test" in results and results["playability_test"]:
        print(f"Playability Test: Game appears to be playable: {results['playability_test'].get('playable', False)}")
        if results['playability_test'].get('playable', False):
            changes = results['playability_test'].get('changes', {})
            if changes.get('new_entities'):
                print(f"  - {len(changes['new_entities'])} new entities appeared")
            if changes.get('removed_entities'):
                print(f"  - {len(changes['removed_entities'])} entities were removed")
            if changes.get('changed_entities'):
                print(f"  - {len(changes['changed_entities'])} entities changed state")
        else:
            print(f"  - Reason: {results['playability_test'].get('reason', 'No state changes detected')}")
    
    if "screenshots" in results:
        print(f"Gameplay Screenshots: {results['screenshots']['count']} images captured (every {results['screenshots']['interval']}s)")
    
    if "errors" in results and results["errors"]:
        print(f"Errors: {len(results['errors'])}")
        for error in results["errors"]:
            print(f"  - {error}")
    
    # Save to file if output path specified
    if args.output:
        try:
            with open(args.output, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\nResults saved to: {args.output}")
        except Exception as e:
            print(f"Error saving results: {e}")
    
    
if __name__ == "__main__":
    main()
