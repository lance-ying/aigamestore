#!/usr/bin/env python3
"""
Code Verifier and Improver

This file implements an a game verifier and improver based on feedback it gets from the verifier.
It takes as input a path to a folder with game files and a mode as command line argument.
It has two modes: basic_test and vibe_coding
For each mode, it uses a specific verifier to get feedback and uses CodeFeedbackIterator to update the game code.
basic_test:
  - verifies the following using BasicTesting:
    - checks if the game loads
    - checks if the game starts on pressing ENTER
    - checks if random actions lead to changes in the game state
  - uses BasicTesting to get the results
  - if load_test['test_result'] is False, then the feedback is based on the aggregate_feedback['load_test']['error']
  - if interaction_test['test_result'] is False, then the feedback is based on the ['error'] and told that "the interaction test was not possible so it should check if the game starts when ENTER is pressed and pressing control keys leads to changes in the game state and update the rendering. Also, should check for syntax errors."
  - if overall_result is False, then the feedback is based on the aggregate_feedback['error'] and told that "the game is not playable so it should be fixed"
  - uses CodeFeedbackIterator to update the game code based on the feedback
  - It should not change any code that is not mentioned in the feedback and output the code with the same filenames in the following format without any additional text.
vibe_coding:
  - uses the vibe coding framework to update the game code
vlm_play:
  - uses the VLMPlayEvaluation class to evaluate games using recorded gameplay videos and structured feedback
vlm_play_guided:
  - uses the VLMPlayEvaluationGuided class for structured evaluation
vlm_play_unguided:
  - uses the VLMPlayEvaluationUnguided class for unstructured evaluation focused on making games more fun
"""

import json
import os
import sys
import argparse
import logging
from typing import Dict, Any

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import BaseTesting class
from game_generators.basic_testing import BasicTesting

# Import CodeFeedbackIterator
from game_generators.code_verifier_utils import generate_feedback_from_results
from game_generators.code_feedback_iterator import CodeFeedbackIterator
from vlm_play.vlm_play_test import VLMPlayEvaluation
from vlm_play.vlm_eval_guided import VLMPlayEvaluationGuided
from vlm_play.vlm_eval_unguided import VLMPlayEvaluationUnguided
from vlm_play.test_vlm_play import test_record_only
import asyncio

def run_verification(game_path: str, output_file: str = None) -> Dict[str, Any]:
    """
    Run the verification process on a game

    Args:
        game_path: Path to the game directory
        output_file: Optional path to save the results

    Returns:
        Results dictionary from verification
    """
    tester = BasicTesting()
    results, load_logs, interaction_logs = tester.verify_game(game_path, output_file)

    # Print results
    for key, value in results.items():
        if key != "feedback":  # Skip printing the detailed feedback
            print(f"{key}: {value}")

    # Check for runtime errors like "X is undefined" and display them prominently
    runtime_error_patterns = [
        "is not defined",
        "is undefined",
        "cannot read property",
        "cannot read properties of undefined",
        "ReferenceError",
        "TypeError",
        "SyntaxError",
        "URIError",
        "EvalError",
        "RangeError"
    ]

    # Check both load and interaction logs for runtime errors
    for logs_dict in [load_logs, interaction_logs]:
        if "error" in logs_dict:
            for error_msg in logs_dict["error"]:
                for pattern in runtime_error_patterns:
                    if pattern.lower() in str(error_msg).lower():
                        print("\n🚨 RUNTIME ERROR DETECTED:")
                        print(f"  {error_msg}")
                        print(
                            "This is likely the cause of the failure. Check variable names and initialization."
                        )
                        break

    # Aggregate and print feedback
    aggregated_feedback = tester.aggregate_feedback(results)
    tester.print_aggregated_feedback(aggregated_feedback)

    return results


def format_vlm_feedback(aggregated_feedback: Dict[str, Any]) -> str:
    """
    Format the aggregated feedback from VLM Play into a structured format for the code improver.
    
    Args:
        aggregated_feedback: Dictionary containing the aggregated feedback sections
        
    Returns:
        Formatted feedback string for the code improver
    """
    feedback = """<context>
We conducted a comprehensive evaluation of your game using VLM Play, which records gameplay videos and analyzes them for issues and improvement opportunities.
</context>

<feedback>
"""
    sections = [
        "critical_issues", 
        "playability_feedback",
        "game_progression_feedback", 
        "game_mechanics_feedback", 
        "graphics_and_animation_feedback", 
        "console_errors_feedback",
        "other_feedback",
        "proposed_enhancements"
    ]
    for section in sections:
        if section in aggregated_feedback and aggregated_feedback[section]:
            feedback += f"## {section.replace('_', ' ').title()}\n\n{aggregated_feedback[section]}\n\n"
    
    feedback += "</feedback>\n\n<important>\nPlease address the issues identified in the feedback, focusing on critical issues first. Update the automated testing code. Ensure the game loads, start on pressing ENTER, key inputs work, and the game is still playable.\n</important>"
    
    return feedback


def format_unstructured_feedback(aggregated_feedback: Dict[str, Any]) -> str:
    """
    Format the unstructured aggregated feedback from VLM Play Unguided into a format for the code improver.
    
    Args:
        aggregated_feedback: Dictionary containing the unstructured aggregated feedback
        
    Returns:
        Formatted feedback string for the code improver
    """
    if "unstructured_aggregated_feedback" not in aggregated_feedback:
        return """<context>
Unable to retrieve unstructured feedback from the evaluation.
</context>

<feedback>
Please ensure the game loads properly, starts when ENTER is pressed, and responds to key inputs.
</feedback>
"""
    
    feedback = """
<feedback>
"""
    feedback += aggregated_feedback["unstructured_aggregated_feedback"]
    feedback += """
</feedback>

<important>
Please address the issues identified in the feedback to make the game more fun and engaging. Ensure the game loads properly, starts when ENTER is pressed, key inputs work, and the game is playable.
</important>
"""
    return feedback


def main():
    """Main function to parse arguments and run the verification and improvement process."""
    parser = argparse.ArgumentParser(
        description="Verify games by checking if they load, start, and respond to actions, then improve based on feedback"
    )
    parser.add_argument(
        "--game_path",
        required=True,
        help="Path to the folder containing the index.html and js files for the game",
    )
    parser.add_argument(
        "--mode",
        choices=["basic_test", "vibe_coding", "vlm_play", "vlm_play_guided", "vlm_play_unguided"],
        default="basic_test",
        help="Mode to run the verifier and improver in (default: basic_test)",
    )
    parser.add_argument("--output", "-o", help="Path to save combined results (JSON)")
    parser.add_argument(
        "--output_dir",
        help="Directory to save the output files after iteration (for vibe_coding and vlm_play modes)",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Temperature for LLM generation",
    )
    parser.add_argument(
        "--show_stack_traces",
        action="store_true",
        default=True,
        help="Show stack traces in the output (default: True)",
    )

    # Add VLM-specific arguments
    parser.add_argument(
        "--api-key",
        help="Google API key for Gemini access (will use GOOGLE_API_KEY env var if not provided)",
    )
    parser.add_argument(
        "--skip-eval",
        action="store_true",
        help="Skip Gemini evaluation in vlm_play mode (record only)",
    )
    parser.add_argument(
        "--only-button",
        help="Test only a specific button ID in vlm_play mode (e.g., 'test_1_ModeBtn')",
    )

    args = parser.parse_args()

    if args.mode == "basic_test":
        # For basic_test mode: first verify, then improve if tests fail
        logging.info("Running verification in basic_test mode...")
        results = run_verification(args.game_path, args.output)
        # Print stack traces if available and requested
        if args.show_stack_traces and "feedback" in results:
            for test_type in ["load_test", "interaction_test"]:
                if (
                    test_type in results["feedback"]
                    and "stack_traces" in results["feedback"][test_type]
                    and results["feedback"][test_type]["stack_traces"]
                ):
                    print(f"\n--- Stack traces from {test_type} ---")
                    for trace in results["feedback"][test_type]["stack_traces"]:
                        print(f"{trace}\n")

        if not results["overall_result"]:
            # Generate feedback based on the verification results
            feedback = generate_feedback_from_results(results, args.mode)
            logging.info("Game verification failed. Improving game code...")
            print(feedback)
            exit()
            # Initialize the code improver

            improver = CodeFeedbackIterator(
                verbose=args.verbose, mode="basic_test_fix", temperature=args.temperature if args.temperature < 0.3 else 0.1
            )

            # Improve the code based on the feedback
            try:
                improvement_results = improver.iterate_code(args.game_path, feedback)
                logging.info("Code improvement completed successfully")
                logging.info(
                    f"Updated files: {', '.join(improvement_results['updated_files'])}"
                )
                if args.mode != "basic_test_fix":
                    logging.info(
                        f"Iteration saved to: {improvement_results['iteration_dir']}"
                    )

                # Exit with failure status since original verification failed
                sys.exit(1)
            except Exception as e:
                logging.error(f"Error improving code: {str(e)}")
                import traceback

                traceback.print_exc()
                sys.exit(1)
        else:
            logging.info("Game verification passed. No code improvement needed.")
            sys.exit(0)

    elif args.mode == "vibe_coding":
        # For vibe_coding mode: assume code passes basic tests, so improve first, then verify
        logging.info("Running in vibe_coding mode...")

        # Initialize the code improver
        improver = CodeFeedbackIterator(
            verbose=args.verbose, mode="vibe_coding", temperature=args.temperature
        )

        # Improve the code using vibe coding framework
        try:
            logging.info("Improving game code using vibe coding framework...")
            improvement_results = improver.iterate_code(args.game_path, None, output_dir=args.output_dir)
            logging.info("Code improvement completed successfully")
            logging.info(
                f"Updated files: {', '.join(improvement_results['updated_files'])}"
            )
            
            # Use the specified output_dir or the default iteration directory
            iteration_dir = args.output_dir if args.output_dir else improvement_results["iteration_dir"]
            logging.info(f"Iteration saved to: {iteration_dir}")

            # After improving, run verification just to check results (not for further improvement)
            logging.info("Running verification to check improved code...")
            results = run_verification(
                iteration_dir, args.output
            )

            # Print stack traces if available and requested
            if args.show_stack_traces and "feedback" in results:
                for test_type in ["load_test", "interaction_test"]:
                    if (
                        test_type in results["feedback"]
                        and "stack_traces" in results["feedback"][test_type]
                        and results["feedback"][test_type]["stack_traces"]
                    ):
                        print(f"\n--- Stack traces from {test_type} ---")
                        for trace in results["feedback"][test_type]["stack_traces"]:
                            print(f"{trace}\n")

            # Report verification results but don't modify code further
            if results["overall_result"]:
                logging.info("Verification passed for improved code.")
                sys.exit(0)
            else:
                logging.warning(
                    "Verification failed for improved code. No further improvements will be made."
                )
                sys.exit(1)

        except Exception as e:
            logging.error(f"Error in vibe coding: {str(e)}")
            import traceback

            traceback.print_exc()
            sys.exit(1)

    elif args.mode in ["vlm_play", "vlm_play_guided", "vlm_play_unguided"]:
        logging.info(f"Running in {args.mode} mode...")

        async def run_vlm_play():
            try:
                # Initialize the appropriate evaluator based on the mode
                output_dir = args.output_dir if args.output_dir else args.output
                
                if args.mode == "vlm_play":
                    evaluator_class = VLMPlayEvaluation
                elif args.mode == "vlm_play_guided":
                    evaluator_class = VLMPlayEvaluationGuided
                elif args.mode == "vlm_play_unguided":
                    evaluator_class = VLMPlayEvaluationUnguided
                
                evaluator = evaluator_class(
                    args.game_path, output_dir=output_dir, api_key=args.api_key
                )

                if args.skip_eval:
                    # Run record-only mode
                    logging.info("Running in record-only mode...")
                    results = await test_record_only(
                        args.game_path, output_dir, args.only_button
                    )

                    if results["success"]:
                        logging.info(
                            f"Successfully recorded {len(results['video_paths'])} videos"
                        )
                        sys.exit(0)
                    else:
                        logging.error(f"Recording failed: {results['errors']}")
                        sys.exit(1)
                else:
                    # Run full evaluation
                    logging.info(f"Starting full {args.mode} evaluation...")
                    results = await evaluator.evaluate_game()
                    # save the results to a file 
                    with open(os.path.join(output_dir, f"{args.mode}_results.json"), "w") as f:
                        json.dump(results, f)

                    if results["success"]:
                        logging.info(
                            f"Successfully evaluated {len(results['evaluations'])} tests"
                        )

                        # Display aggregated feedback if available
                        if results.get("aggregated_feedback"):
                            print(f"\n{args.mode.replace('_', ' ').title()} Feedback Summary:")
                            print("=" * 80)
                            
                            # Handle different feedback formats based on mode
                            if args.mode == "vlm_play_unguided" and "unstructured_aggregated_feedback" in results["aggregated_feedback"]:
                                # For unguided mode, just print the unstructured feedback
                                print(results["aggregated_feedback"]["unstructured_aggregated_feedback"])
                            else:
                                # For structured feedback (vlm_play and vlm_play_guided)
                                agg = results["aggregated_feedback"]
                                sections = [
                                    "critical_issues", 
                                    "playability_feedback",
                                    "game_progression_feedback", 
                                    "game_mechanics_feedback", 
                                    "graphics_and_animation_feedback", 
                                    "console_errors_feedback",
                                    "automated_testing_feedback",
                                    "other_feedback",
                                    "proposed_enhancements"
                                ]
                                # Display each section from the aggregated feedback
                                for section in sections:
                                    if section in agg and agg[section]:
                                        print(f"\n{section.replace('_', ' ').title()}:")
                                        # Handle multi-line feedback by splitting and formatting
                                        for line in agg[section].split("\n"):
                                            if line.strip():
                                                print(f"  - {line.strip()}")

                        # Save the aggregated feedback to a file 
                        # Show output location
                        print(f"\nResults saved to: {output_dir}")
                        # Save the aggregated feedback to a file 
                        with open(os.path.join(output_dir, "aggregated_feedback.txt"), "w") as f:
                            f.write(str(results["aggregated_feedback"]))
                        
                        # Generate the HTML report if it wasn't already created
                        if not os.path.exists(os.path.join(output_dir, "evaluation_report.html")):
                            evaluator._generate_combined_report(results)
                            logging.info(f"HTML report generated at: {os.path.join(output_dir, 'evaluation_report.html')}")

                        print(
                            f"HTML report: {os.path.join(output_dir, 'evaluation_report.html')}"
                        )
                        
                        # Initialize the code improver with appropriate settings
                        improver = CodeFeedbackIterator(
                            verbose=args.verbose, mode="guided_feedback", temperature=args.temperature
                        )
                        
                        # Format the aggregated feedback for the code improver
                        if args.mode == "vlm_play_unguided":
                            # For unstructured feedback
                            formatted_feedback = format_unstructured_feedback(results["aggregated_feedback"])
                        else:
                            # For structured feedback (both vlm_play and vlm_play_guided)
                            formatted_feedback = format_vlm_feedback(results["aggregated_feedback"])
                        
                        # Improve the code based on the feedback and save to output_dir
                        try:
                            logging.info(f"Improving game code based on {args.mode} feedback...")
                            improvement_results = improver.iterate_code(
                                args.game_path, 
                                formatted_feedback, 
                                output_dir=output_dir
                            )
                            logging.info("Code improvement completed successfully")
                            logging.info(
                                f"Updated files: {', '.join(improvement_results['updated_files'])}"
                            )
                            
                            # Show the output directory where updated code is saved
                            if improvement_results.get("iteration_dir"):
                                print(f"\nImproved code saved to: {improvement_results['iteration_dir']}")
                            
                        except Exception as e:
                            logging.error(f"Error improving code: {str(e)}")
                            import traceback
                            traceback.print_exc()
                        
                        sys.exit(0)
                    else:
                        logging.error(f"{args.mode} evaluation failed")
                        for error in results.get("errors", ["Unknown error"]):
                            logging.error(f"Error: {error}")
                        sys.exit(1)

            except Exception as e:
                logging.error(f"Error in {args.mode} mode: {str(e)}")
                import traceback
                traceback.print_exc()
                sys.exit(1)

        # Run the async function
        asyncio.run(run_vlm_play())


if __name__ == "__main__":
    main()
