from pathlib import Path
import os
import re
import time
import warnings

import openai
import anthropic
from google import genai



try:
    anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
except Exception as e:
    print(f"Error initializing Anthropic client: {e}")
    anthropic_client = None

try:
    gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
except Exception as e:
    print(f"Error initializing Gemini client: {e}")
    gemini_client = None

try:
    openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")


def create_batch_request(model, prompts, thinking=False):
    """Create a batch request for the Anthropic Message Batches API.
    
    Args:
        model: The model to use
        prompts: List of prompts to include in the batch
        
    Returns:
        Batch object created via Anthropic API
    """
    from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
    from anthropic.types.messages.batch_create_params import Request
    
    if not isinstance(prompts, list):
        raise ValueError("prompts must be a list for batch processing")
    
    requests = []
    breakpoint()
    for idx, prompt in enumerate(prompts):
        if thinking:
            requests.append(
                Request(
                    custom_id=f"request_{idx}",
                    params=MessageCreateParamsNonStreaming(
                        model=model,
                        max_tokens=64000,
                        messages=[{"role": "user", "content": prompt}],
                        thinking={
                            "type": "enabled",
                            "budget_tokens": 10000
                        },
                    )
                )
            )
        else:
            requests.append(
                Request(
                    custom_id=f"request_{idx}",
                    params=MessageCreateParamsNonStreaming(
                        model=model,
                        max_tokens=64000,
                        messages=[{"role": "user", "content": prompt}]
                    )
                )
            )
    
    batch = anthropic_client.messages.batches.create(requests=requests)
    return batch


def wait_for_batch_completion(batch_id, poll_interval=10):
    """Poll until a batch is complete.
    
    Args:
        batch_id: The ID of the batch to check
        poll_interval: How often to check batch status in seconds
        
    Returns:
        Completed batch object
    """
    import time
    
    while True:
        batch = anthropic_client.messages.batches.retrieve(batch_id)
        
        if batch.processing_status == "ended":
            return batch
        
        # Calculate total requests by summing all counts
        total_requests = (
            batch.request_counts.processing +
            batch.request_counts.succeeded +
            batch.request_counts.errored +
            batch.request_counts.canceled +
            batch.request_counts.expired
        )
        
        print(f"Batch {batch_id} status: {batch.processing_status}, " 
              f"Processed: {batch.request_counts.succeeded}/{total_requests}, "
              f"Processing: {batch.request_counts.processing}, "
              f"Errors: {batch.request_counts.errored}")
        
        time.sleep(poll_interval)


def get_batch_results(batch_id, thinking=False):
    """Retrieve and parse results from a completed batch.
    
    Args:
        batch_id: The ID of the completed batch
        
    Returns:
        Dictionary mapping custom_ids to completion results
    """
    results = {}
    
    for result in anthropic_client.messages.batches.results(batch_id):
        custom_id = result.custom_id
        
        if result.result.type == "succeeded":
            # Extract the message content
            message = result.result.message
            content = "".join([block.text for block in message.content if block.type == "text"])
            
            if thinking:
                thinking_content = "".join([block.thinking for block in message.content if block.type == "thinking"])
                results[custom_id] = (thinking_content, content)
            else:
                results[custom_id] = content

        else:
            # Handle error cases
            results[custom_id] = f"Error: {result.result.type}"
            if result.result.type == "errored" and hasattr(result.result, "error"):
                results[custom_id] += f" - {result.result.error.message}"
    
    return results


def get_completion(model, prompt, thinking=False):
    """Get completion from the model.
    
    Args:
        model: The model to use
        prompt: Either a single prompt (str) or a list of prompts for batch processing
        thinking: Whether to use thinking mode
        
    Returns:
        Either a string with the completion or a dict of completions for batch mode
    """
    if "claude" in model and isinstance(prompt, list):
        # Use batch API for multiple prompts
        batch = create_batch_request(model, prompt, thinking=thinking)
        start_time = time.time()
        print(f"Created batch {batch.id}, waiting for completion...")
        
        completed_batch = wait_for_batch_completion(batch.id)
        results = get_batch_results(completed_batch.id, thinking=thinking)
        end_time = time.time()
        print(f"Batch {batch.id} completed in {(end_time - start_time) / 60} minutes")
        
        # Return all results
        return results
    
    # Single prompt processing below
    if "claude" in model:
        if thinking:
            thinking_content = ""
            answer = ""

            with anthropic_client.messages.stream(
                model=model,
                max_tokens=40000,
                thinking={
                    "type": "enabled",
                    "budget_tokens": 10000
                },
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for event in stream:
                    if event.type == "content_block_start":
                        print(f"\nStarting {event.content_block.type} block...")

                    elif event.type == "content_block_delta":
                        if event.delta.type == "thinking_delta":
                            thinking_content += event.delta.thinking
                            print(f"{event.delta.thinking}", end="", flush=True)

                        elif event.delta.type == "text_delta":
                            answer += event.delta.text
                            print(f"{event.delta.text}", end="", flush=True)

                    elif event.type == "content_block_stop":
                        print("\nBlock complete.")

            return thinking_content, answer

        else:
            answer = ""
            with anthropic_client.messages.stream(
                max_tokens=40000,
                messages=[{"role": "user", "content": prompt}],
                model=model,
            ) as stream:
                for text in stream.text_stream:
                    answer += text
                    print(text, end="", flush=True)
            return answer
    
    elif "gemini" in model:
        # Handle batch mode for Gemini by processing each prompt individually
        if isinstance(prompt, list):
            results = {}
            for i, p in enumerate(prompt):
                response = gemini_client.models.generate_content(
                    model=model,
                    contents=p,
                )
                results[f"request_{i}"] = response.text
            return results
        
        # Single prompt for Gemini
        response = gemini_client.models.generate_content(
            model=model,
            contents=prompt,
        )

        answer = response.text
        if thinking:
            return "", answer
        return answer

    elif "gpt" in model:
        # Handle batch mode for GPT by processing each prompt individually
        if isinstance(prompt, list):
            results = {}
            for i, p in enumerate(prompt):
                response = openai_client.responses.create(
                    model=model,
                    input=p
                )
                results[f"request_{i}"] = response.output_text
            return results
            
        # Single prompt for GPT
        response = openai_client.responses.create(
            model=model,
            input=prompt
        )

        answer = response.output_text
        if thinking:
            return "", answer
        return answer

    else:
        raise ValueError(f"Model {model} not supported")


def generate(model, prompt, save_dir, code_dir=None, thinking=False, max_tries=3):
    """
    Generate code for a given prompt or batch of prompts.

    Args:
        model: The model to use for generation
        prompt: The prompt or list of prompts to generate code for
        save_dir: Directory or list of directories to save results
        code_dir: Directory or list of directories to save extracted code
        thinking: Whether to use thinking mode (for models that support it)
        max_tries: The maximum number of tries to generate the code
    
    Returns:
        Either a single answer string or a dictionary of answers if prompt is a list
    """
    # Determine if we're in batch mode
    batch_mode = isinstance(prompt, list)
    
    if batch_mode:
        if not isinstance(save_dir, list) or len(prompt) != len(save_dir):
            raise ValueError("When prompt is a list, save_dir must be a matching list of directories")
            
        # Set up code_dir as a list if not provided
        if code_dir is None:
            code_dir = save_dir
        elif not isinstance(code_dir, list) or len(prompt) != len(code_dir):
            raise ValueError("When prompt is a list, code_dir must be None or a matching list of directories")
        
        # Create all necessary directories
        for dir_path in save_dir:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Save all prompts first
        for p, sd in zip(prompt, save_dir):
            # Save prompt
            with open(sd / "prompt.txt", "w") as f:
                f.write(p)
            
            # Save model info
            with open(sd / "model.txt", "w") as f:
                f.write(model)
        
        # Check if all results already exist
        all_exist = True
        for sd in save_dir:
            if not (sd / "answer.txt").exists():
                all_exist = False
                break
                
        if all_exist:
            print(f"All batch results already exist, loading from files")
            batch_results = {}
            for i, sd in enumerate(save_dir):
                with open(sd / "answer.txt", "r") as f:
                    batch_results[f"request_{i}"] = f.read()
            
            # Extract code blocks for each result
            for i, (result, cd) in enumerate(zip(batch_results.values(), code_dir)):
                extract_code_blocks(model, result, cd)
                
            return batch_results
        
        # If not all results exist, generate them using the API
        try_idx = 0
        batch_results = None
        
        while try_idx < max_tries:
            try:
                batch_results = get_completion(model, prompt, thinking=thinking)
                if thinking and not isinstance(batch_results, dict):
                    # If thinking is enabled but result is not a dict, we got a (thinking, answer) tuple
                    # Convert to a dict with a single entry
                    _, actual_answer = batch_results
                    batch_results = {"request_0": actual_answer}
                break
            except Exception as e:
                print(f"Batch processing error: {e}")
                try_idx += 1
                continue
        
        if try_idx == max_tries:
            raise ValueError(f"Failed to generate code after {max_tries} tries")
        
        # Save each result
        for i, (sd, cd) in enumerate(zip(save_dir, code_dir)):
            result_key = f"request_{i}"
            if result_key in batch_results:
                if not thinking:
                    answer = batch_results[result_key]
                else:
                    thinking_content, answer = batch_results[result_key]

                    # Save thinking
                    with open(sd / "thinking.txt", "w") as f:
                        f.write(thinking_content)
                
                # Save answer
                with open(sd / "answer.txt", "w") as f:
                    f.write(answer)
                
                # Extract code blocks
                extract_code_blocks(model, answer, cd)
            else:
                print(f"Warning: No result found for request_{i}")
        
        return batch_results
    
    # Original single prompt functionality below
    save_dir.mkdir(parents=True, exist_ok=True)

    if not (save_dir / "answer.txt").exists():
        # Save prompt
        with open(save_dir / "prompt.txt", "w") as f:
            f.write(prompt)

        # save model
        with open(save_dir / "model.txt", "w") as f:
            f.write(model)

        try_idx = 0
        while try_idx < max_tries:
            try:
                if thinking:
                    thinking_content, answer = get_completion(model, prompt, thinking=thinking)

                    with open(save_dir / "thinking.txt", "w") as f:
                        f.write(thinking_content)
                else:
                    answer = get_completion(model, prompt, thinking=False)

            except Exception as e:
                print(f"Error: {e}")
                try_idx += 1
                continue
            break

        if try_idx == max_tries:
            raise ValueError(f"Failed to generate code after {max_tries} tries")

        # Save answer
        with open(save_dir / "answer.txt", "w") as f:
            f.write(answer)
    else:
        print(f"Loading answer from {save_dir / 'answer.txt'}")
        with open(save_dir / "answer.txt", "r") as f:
            answer = f.read()

    if code_dir is None:
        code_dir = save_dir

    extract_code_blocks(model, answer, code_dir)
    return answer


def extract_code_blocks(model, answer: str, code_dir: Path):
    if "gemini" in model:
        # Gemini format: ```<block_type> filename="..."
        # ...
        # ```
        code_blocks = []
        # Regex to match: ```blocktype filename="..."
        # ...
        # ```
        pattern = r'```([a-zA-Z0-9_+-]+) filename="([^"]+)"\n(.*?)```'
        matches = re.findall(pattern, answer, re.DOTALL)
        for block_type, filename, code in matches:
            code_blocks.append((filename, code))
    else:
        code_blocks = re.findall(r"<code filename=\"(.*?)\">(.*?)</code>", answer, re.DOTALL)
    
    for filename, code in code_blocks:
        file_path = code_dir / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # remove any ```python or ``` tags
        code = re.sub("```python", "", code)
        code = re.sub("```javascript", "", code)
        code = re.sub("```html", "", code)
        code = re.sub("```xml", "", code)
        code = re.sub("```", "", code)

        with open(file_path, "w") as f:
            f.write(code)
    
    return code_blocks


def run_game(game_code: dict[str, str], headless: bool = True, 
             initial_wait: int = 500,
             sticky_prob: float = 0.7,
             action_duration: int = 150,
             total_test_time: int = 10000,
             viewport_width: int = 600,
             viewport_height: int = 400,
             sticky_actions: tuple[str, ...] | None = None,
             max_execution_time: int = 60000) -> list:
    """Test if a p5.js game can run without errors using Playwright.

    Args:
        game_code: Dictionary mapping file paths (relative to game root) to their content.
                   Must contain at least "index.html".
        headless: Whether to run the browser in headless mode (default: True)
        initial_wait: Initial wait time in ms before starting interactions (default: 2000)
        sticky_prob: Probability an action will continue on next frame (default: 0.7)
        action_duration: How long to wait between action decisions in ms (default: 150)
        total_test_time: Total time to test inputs in ms (default: 10000)
        viewport_width: Browser viewport width (default: 600)
        viewport_height: Browser viewport height (default: 400)
        sticky_actions: Tuple of keys to use for sticky actions. If None, uses default set of keys.
        max_execution_time: Maximum execution time in ms (default: 60000)

    Returns:
        list: A list of error messages. Empty if no errors.
    """
    import tempfile
    import time
    import signal
    import multiprocessing
    from multiprocessing import Queue
    from playwright.sync_api import sync_playwright

    assert isinstance(game_code, dict), "game_code must be a dictionary"

    # Define default sticky actions if none provided
    if sticky_actions is None:
        sticky_actions = ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Space", "Enter", "r")

    # Function to run in a separate process
    def run_test(game_code_copy, result_queue, headless, initial_wait, sticky_prob, 
                 action_duration, total_test_time, viewport_width, viewport_height, 
                 sticky_actions_copy):
        errors = []
        
        if "index.html" not in game_code_copy:
            errors.append("Critical Error: index.html not found in game_code dictionary.")
            result_queue.put(errors)
            return

        # Use TemporaryDirectory for automatic cleanup of game files
        with tempfile.TemporaryDirectory() as temp_dir_str:
            temp_dir_path = Path(temp_dir_str)
            
            # Write game files to the temporary directory
            for file_path_str, file_content in game_code_copy.items():
                full_path = temp_dir_path / file_path_str
                full_path.parent.mkdir(parents=True, exist_ok=True)
                full_path.write_text(str(file_content), encoding='utf-8')
            
            playwright_instance = None
            browser = None
            context = None
            try:
                playwright_instance = sync_playwright().start()
                browser = playwright_instance.firefox.launch(headless=headless)
                context = browser.new_context(
                    viewport={'width': viewport_width, 'height': viewport_height}
                )
                page = context.new_page()

                # JavaScript to capture errors and unhandled rejections in the page context
                error_collector_js = """
                window.jsErrors = [];
                window.onerror = function(message, source, lineno, colno, error) {
                    console.error('Caught error:', message, source, lineno);
                    window.jsErrors.push({
                        message: message,
                        source: source,
                        lineno: lineno,
                        colno: colno,
                        stack: error ? error.stack : null
                    });
                    return true;
                };

                window.addEventListener('unhandledrejection', function(event) {
                    console.error('Unhandled rejection:', event.reason);
                    window.jsErrors.push({
                        message: 'Unhandled Promise Rejection: ' + event.reason,
                        source: 'promise',
                        lineno: 0,
                        colno: 0,
                        stack: event.reason && event.reason.stack ? event.reason.stack : null
                    });
                });
                """
                page.add_init_script(error_collector_js)

                index_html_path = temp_dir_path / "index.html"
                page.goto(f"file://{index_html_path.resolve()}")

                # Wait for canvas to appear
                try:
                    page.wait_for_selector("canvas", timeout=10000)
                except Exception as e:
                    errors.append(f"Canvas not found within timeout: {str(e)}")
                    # Depending on strictness, one might choose to return early here

                # Prevent default scrolling behavior for arrow keys and spacebar
                prevent_scroll_js = """
                document.addEventListener('keydown', (e) => {
                    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                        e.preventDefault();
                    }
                }, false);
                
                // Also disable scrolling on the body
                document.body.style.overflow = 'hidden';
                """
                page.evaluate(prevent_scroll_js)
                
                # Perform some basic interactions
                page.wait_for_timeout(initial_wait)  # Initial wait for game to settle
        
                # it seems that sometimes press doesn't start the game (might be because key is not down for long enough)
                page.keyboard.down("Enter")
                page.wait_for_timeout(100)
                page.keyboard.up("Enter")

                import random
                
                # Perform random actions with stickiness
                current_time = 0
                current_action = None
                
                while current_time < total_test_time:
                    print("Time left:", total_test_time - current_time)
                    # Decide whether to keep current action or choose a new one
                    if current_action is None or random.random() > sticky_prob:
                        # Release previous key if one is pressed
                        if current_action:
                            print("Releasing key:", current_action)
                            page.keyboard.up(current_action)
                        
                        # Choose a new random action
                        current_action = random.choice(sticky_actions_copy)
                        print("Pressing key:", current_action)
                        page.keyboard.down(current_action)
                    
                    # Wait for a frame
                    page.wait_for_timeout(action_duration)
                    current_time += action_duration
                
                # Release any key that might still be pressed
                if current_action:
                    page.keyboard.up(current_action)
                
                # Wait for game to process final inputs
                page.wait_for_timeout(100)

                # Retrieve any JavaScript errors collected by the injected script
                js_errors = page.evaluate("window.jsErrors")
                if js_errors:
                    for error in js_errors:
                        errors.append(f"{error.get('message')} at {error.get('source')}:{error.get('lineno')}")

            except Exception as e:
                errors.append(f"Playwright execution error: {str(e)}")
            
            finally:
                if context:
                    try:
                        context.close()
                    except Exception as e:
                        errors.append(f"Error closing Playwright context: {str(e)}")
                if browser:
                    try:
                        browser.close()
                    except Exception as e:
                        errors.append(f"Error closing Playwright browser: {str(e)}")
                if playwright_instance:
                    try:
                        playwright_instance.stop()
                    except Exception as e:
                        errors.append(f"Error stopping Playwright: {str(e)}")
                
                # TemporaryDirectory is cleaned up automatically upon exiting the 'with' block

        # Send back results
        result_queue.put(errors)

    # Run test in a separate process because it's rare but some games can completely freeze the browser

    # Raise warning if total_test_time is greater than max_execution_time
    if total_test_time > max_execution_time:
        warnings.warn(f"Total test time ({total_test_time/1000} s) is greater than max execution time ({max_execution_time/1000} s).")

    # Create a queue for results
    result_queue = Queue()
    
    # Start the test process
    test_process = multiprocessing.Process(
        target=run_test, 
        args=(game_code, result_queue, headless, initial_wait, sticky_prob, 
              action_duration, total_test_time, viewport_width, viewport_height, 
              sticky_actions)
    )
    test_process.start()
    
    # Wait for process to complete with timeout
    start_time = time.time()
    while test_process.is_alive():
        if time.time() - start_time > max_execution_time / 1000:
            print(f"Execution exceeded maximum time limit of {max_execution_time/1000} s.")
            # Force terminate the process
            test_process.terminate()
            # Give it a moment to terminate
            time.sleep(1)
            # If it's still alive, kill it more forcefully
            if test_process.is_alive():
                print("Process did not terminate gracefully, killing it.")
                try:
                    test_process.kill()
                except:
                    pass
            test_process.join(2)  # Wait up to 2 seconds for it to finish
            return ["Browser execution timed out after " + str(max_execution_time/1000) + " s"]
        time.sleep(0.5)  # Check every half second
    
    # Process finished - get results if available
    if not result_queue.empty():
        errors = result_queue.get()
    else:
        errors = ["Test completed but no results were returned"]
    
    if errors:
        print("Errors detected during run_game:")
        for error in errors:
            print(f"- {error}")
            
    return errors


def code_from_dir(code_dir: Path, return_str: bool = False) -> dict:
    code_dict = {}
    for file_path in code_dir.rglob("*.html"):
        with open(file_path, "r", encoding="utf-8") as f:
            code_dict[str(file_path.relative_to(code_dir))] = f.read()
    for file_path in code_dir.rglob("*.js"):
        with open(file_path, "r", encoding="utf-8") as f:
            code_dict[str(file_path.relative_to(code_dir))] = f.read()

    if return_str:
        code_str = ""
        for relative_path, code in code_dict.items():
            code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"
        return code_dict, code_str
    else:
        return code_dict
