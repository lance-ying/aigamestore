import os
import time
import logging
import asyncio
import subprocess
import random
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image, ImageChops

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Try importing playwright for headless browser analysis
try:
    from playwright.async_api import async_playwright, Page, ConsoleMessage

    HEADLESS_BROWSER_ENABLED = True
except ImportError:
    logging.warning("Playwright not found. Headless browser analysis will be disabled.")
    HEADLESS_BROWSER_ENABLED = False


class GameBrowserController:
    """
    Class to manage headless browser interactions for game testing.
    """
    def __init__(self, game_path: str, port: int = 8000):
        self.game_path = game_path
        self.port = port
        self.server_process = None
        self.enabled = HEADLESS_BROWSER_ENABLED
        self.is_html_file = os.path.isfile(game_path) and game_path.lower().endswith('.html')
        self.frame_counter = 0  # Add frame counter for screenshots
        self.allowed_keys = {
            "Arrow": [37, 38, 39, 40],  # Left, Up, Right, Down
            "Space": [32],
            "Shift": [16],
            "KeyZ": [90],
            "Enter": [13],
            "KeyR": [82]
        }
        self.key_mapping = {
            "ArrowLeft": 37,
            "ArrowUp": 38,
            "ArrowRight": 39,
            "ArrowDown": 40,
            " ": 32,
            "Shift": 16,
            "z": 90,
            "Enter": 13,
            "r": 82
        }
        # List of gameplay keys (all allowed keys except 'r' and 'Enter')
        self.gameplay_keys = [
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            " ", "Shift", "z"
        ]
        
    async def __aenter__(self):
        if not self.enabled:
            logging.warning("Headless browser is not enabled. Install playwright with: "
                           "pip install playwright && python -m playwright install --with-deps chromium")
            return self
            
        try:
            # If it's a single HTML file, we don't need to start a server
            if self.is_html_file:
                logging.info(f"Game path is a single HTML file: {self.game_path}")
                return self
                
            # Start a simple HTTP server to serve the game files
            self.server_process = subprocess.Popen(
                ["python", "-m", "http.server", str(self.port)],
                cwd=self.game_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            logging.info(f"Started HTTP server on port {self.port}")
            
            # Allow server to start
            await asyncio.sleep(1)
            return self
        except Exception as e:
            logging.error(f"Error starting server: {e}")
            if self.server_process:
                self.server_process.terminate()
                self.server_process = None
            raise
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.server_process:
            self.server_process.terminate()
            logging.info("HTTP server terminated")
    
    async def check_game_loads(self) -> Dict[str, Any]:
        """
        Checks if the game loads correctly without errors.
        
        Returns:
            Dictionary with test results
        """
        if not self.enabled:
            return {
                "test_result": False,
                "error": "Headless browser not enabled. Install playwright."
            }
            
        if not self.is_html_file and not self.server_process:
            return {
                "test_result": False,
                "error": "Server not running. Use within 'async with' context."
            }
            
        # Determine the URL based on whether it's a file or served via HTTP
        if self.is_html_file:
            # Use file:// protocol for direct HTML files
            abs_path = os.path.abspath(self.game_path)
            url = f"file://{abs_path}"
            logging.info(f"Using direct file URL: {url}")
        else:
            # Use HTTP for served directories
            url = f"http://localhost:{self.port}"
            logging.info(f"Using HTTP server URL: {url}")
            
        load_results = await self._run_load_check(url)
        
        # Format the results to be more consistent with interaction test
        final_results = {
            "test_result": load_results["test_result"],
            "load_test": {
                "test_result": load_results["test_result"],
                "canvas_found": load_results["canvas_found"],
                "canvas_count": load_results.get("canvas_count", 0),
                "page_title": load_results.get("page_title", "")
            },
            "console_logs": load_results["console_logs"],
            "console_errors": load_results["console_errors"],  # For backwards compatibility
            "screenshots": load_results["screenshots"],
            "error": load_results.get("error", None)
        }
        
        # Add console error message if present
        if "console_error_message" in load_results:
            final_results["console_error_message"] = load_results["console_error_message"]
            
        return final_results
            
    async def _run_load_check(self, url: str) -> Dict[str, Any]:
        """
        Loads the game and checks for console errors.
        
        Args:
            url: URL to the game
            
        Returns:
            Dictionary with test results
        """
        result = {
            "test_result": False,
            "console_logs": {
                "error": [],
                "warning": [],
                "info": [],
                "log": [],
                "debug": [],
                "other": []
            },
            "console_errors": [],  # Keep for backwards compatibility
            "js_exceptions": [],   # For JS syntax errors and exceptions
            "network_errors": [],  # For tracking network request failures
            "resource_errors": [], # For tracking resource loading failures
            "parse_errors": [],    # For syntax/parse errors in scripts
            "canvas_found": False,
            "screenshots": []
        }
        
        # Prepare screenshots directory
        screenshots_dir = os.path.join(os.path.dirname(self.game_path), "game_check_results", "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            context = await browser.new_context()
            
            # Special script to detect syntax errors early
            detect_script = """
            // Log any existing errors
            window.onload = function() {
                if (window.syntaxErrors) {
                    console.error('Syntax errors detected:', window.syntaxErrors);
                }
            };
            
            // Track all script elements to check for syntax errors
            const originalCreateElement = document.createElement;
            document.createElement = function() {
                const element = originalCreateElement.apply(document, arguments);
                if (arguments[0].toLowerCase() === 'script') {
                    // Monitor script elements
                    element.addEventListener('error', function(e) {
                        console.error('Script error:', e);
                    });
                }
                return element;
            };
            
            // Global error handler for syntax errors
            window.syntaxErrors = [];
            window.addEventListener('error', function(event) {
                if (event.error instanceof SyntaxError) {
                    console.error('SyntaxError intercepted:', event.message);
                    window.syntaxErrors.push(event.message);
                }
            }, true);
            """
            
            # Add a special route to intercept HTML and inject early error detection
            async def intercept_html(route, request):
                response = await route.fetch()
                content_type = response.headers.get('content-type', '')
                
                if 'text/html' in content_type:
                    # Get original HTML content
                    html = await response.text()
                    
                    # Insert our script as early as possible to detect syntax errors
                    head_pos = html.find('<head>')
                    if head_pos >= 0:
                        html = html[:head_pos+6] + f'<script>{detect_script}</script>' + html[head_pos+6:]
                    else:
                        # If no head tag, try to insert at the start of body or html
                        body_pos = html.find('<body>')
                        if body_pos >= 0:
                            html = html[:body_pos+6] + f'<script>{detect_script}</script>' + html[body_pos+6:]
                        else:
                            html_pos = html.find('<html>')
                            if html_pos >= 0:
                                html = html[:html_pos+6] + f'<script>{detect_script}</script>' + html[html_pos+6:]
                    
                    await route.fulfill(
                        status=response.status,
                        headers={**response.headers, 'content-length': str(len(html))},
                        body=html
                    )
                else:
                    await route.continue_()
            
            # Apply the interception to all HTML pages
            await context.route('**/*.html', intercept_html)
            await context.route(url, intercept_html)
            
            # Capture console logs and errors
            page = await context.new_page()
            
            # Enable verbose logging for all browser operations
            page.on("console", lambda msg: logging.info(f"CONSOLE: {msg.type} - {msg.text}"))
            
            # Listen for console logs and errors
            async def handle_console(msg: ConsoleMessage):
                msg_type = msg.type.lower()
                msg_text = f"{msg.text}"
                
                # Extract error type and message in a cleaner format
                error_type = ""
                error_message = msg_text
                source_info = ""
                
                # Try to parse error type and message for error messages
                if msg_type == "error":
                    # Extract error type (like TypeError, SyntaxError, etc.)
                    import re
                    type_match = re.search(r'(Type|Syntax|Reference|Range|URI|Eval|Internal|Aggregate)?Error', msg_text)
                    if type_match:
                        error_type = type_match.group(0)
                        # Extract just the message part without the stack trace
                        if ": " in msg_text:
                            error_message = msg_text.split(": ", 1)[1].split("\n")[0].strip()
                    
                    # Try to extract the source information in different formats:
                    source_info = ""
                    
                    # 1. First, try to access the location object directly from the message
                    try:
                        location = msg.location
                        if location and hasattr(location, 'url') and hasattr(location, 'lineNumber'):
                            if location.url and location.lineNumber:
                                url_parts = location.url.split('/')
                                file_name = url_parts[-1].split('?')[0]  # Get filename without query params
                                source_info = f" [Source: {file_name}:{location.lineNumber}]"
                                logging.info(f"Extracted location from msg object: {file_name}:{location.lineNumber}")
                    except Exception as loc_err:
                        # Log but don't fail if location extraction fails
                        logging.debug(f"Could not extract location from console message: {loc_err}")
                    
                    # 2. Look for ES6 module format like "entities.js:82:29" at the top level
                    if not source_info:
                        module_match = re.search(r'([a-zA-Z0-9_\-./]+\.(js|html|mjs)):(\d+)(?::(\d+))?', msg_text)
                        if module_match:
                            file_name = module_match.group(1).split('/')[-1]  # Just the filename
                            line_num = module_match.group(3)
                            source_info = f" [Source: {file_name}:{line_num}]"
                            logging.info(f"Extracted location from ES6 module pattern: {file_name}:{line_num}")
                    
                    # 3. Special handling for stack trace with format "at ModuleName (entities.js:82)"
                    if not source_info and "at " in msg_text:
                        stack_match = re.search(r'at\s+[^(]*\(([^:]+):(\d+)[^)]*\)', msg_text)
                        if stack_match:
                            file_name = stack_match.group(1).split('/')[-1]  # Just the filename
                            line_num = stack_match.group(2)
                            source_info = f" [Source: {file_name}:{line_num}]"
                            logging.info(f"Extracted location from stack trace: {file_name}:{line_num}")
                    
                    # 4. Look for direct filename:line format anywhere in the message
                    if not source_info:
                        file_line_match = re.findall(r'([a-zA-Z0-9_\-./]+\.(js|html|mjs)):(\d+)', msg_text)
                        if file_line_match:
                            # Use the first match
                            file_path = file_line_match[0][0]
                            file_name = file_path.split('/')[-1]  # Get just the filename
                            line_num = file_line_match[0][2]
                            source_info = f" [Source: {file_name}:{line_num}]"
                            logging.info(f"Extracted location from general pattern: {file_name}:{line_num}")
                    
                    # 5. Look for "in" patterns like "in entities.js:82"
                    if not source_info and " in " in msg_text:
                        in_match = re.search(r'in\s+([a-zA-Z0-9_\-./]+\.(js|html|mjs)):(\d+)', msg_text)
                        if in_match:
                            file_name = in_match.group(1).split('/')[-1]
                            line_num = in_match.group(3)
                            source_info = f" [Source: {file_name}:{line_num}]"
                            logging.info(f"Extracted location from 'in' pattern: {file_name}:{line_num}")
                    
                    # Add Stack URL as a last resort - useful for ES modules
                    if not source_info and getattr(msg, "stack_url", None):
                        try:
                            url = msg.stack_url
                            if url and ".js:" in url:
                                url_parts = url.split('/')
                                last_part = url_parts[-1]
                                file_match = re.search(r'([^/]+\.js):(\d+)', last_part)
                                if file_match:
                                    file_name = file_match.group(1)
                                    line_num = file_match.group(2)
                                    source_info = f" [Source: {file_name}:{line_num}]"
                                    logging.info(f"Extracted location from stack URL: {file_name}:{line_num}")
                        except Exception as e:
                            logging.debug(f"Failed to extract location from stack_url: {e}")
                    
                    # If we still don't have source info, extract it from raw stack trace
                    if not source_info and hasattr(msg, "args") and len(msg.args) > 0:
                        try:
                            # Often the stack trace is in the first argument
                            stack = str(msg.args[0])
                            if ".js:" in stack:
                                # Find the first JS file reference
                                match = re.search(r'([a-zA-Z0-9_\-./]+\.js):(\d+)', stack)
                                if match:
                                    file_name = match.group(1).split('/')[-1]
                                    line_num = match.group(2)
                                    source_info = f" [Source: {file_name}:{line_num}]"
                                    logging.info(f"Extracted location from args stack: {file_name}:{line_num}")
                        except Exception as e:
                            logging.debug(f"Failed to extract location from args: {e}")
                    
                    # Create the formatted error message - Add "Uncaught" prefix for browser errors
                    if error_type:
                        formatted_error = f"Uncaught {error_type}: {error_message}{source_info}"
                    else:
                        formatted_error = f"Uncaught Error: {error_message}{source_info}"
                    
                    # Replace the original error text with our formatted version
                    error_message = formatted_error
                    msg_text = formatted_error
                    
                    # Extract full stack trace if available
                    stack_trace = ""
                    if "\n" in str(msg.text):
                        # Split by newline and skip the first line (which is the message)
                        stack_lines = str(msg.text).split("\n")[1:]
                        if stack_lines:
                            stack_trace = "\n".join(stack_lines)
                    
                    # Try to get stack trace from args if available
                    if not stack_trace and hasattr(msg, "args") and len(msg.args) > 0:
                        arg_text = str(msg.args[0])
                        if "\n" in arg_text:
                            stack_lines = arg_text.split("\n")[1:]  # Skip first line which is likely the message
                            if stack_lines:
                                stack_trace = "\n".join(stack_lines)
                    
                    # Log raw message and formatted result for debugging
                    logging.debug(f"Original console message: {msg.text}")
                    logging.debug(f"Formatted error message: {msg_text}")
                    if stack_trace:
                        logging.debug(f"Stack trace: {stack_trace}")
                
                # Store in the appropriate category
                if msg_type in result["console_logs"]:
                    result["console_logs"][msg_type].append(msg_text)
                else:
                    result["console_logs"]["other"].append(f"{msg_type}: {msg_text}")
                
                # Also store errors in the legacy field for backwards compatibility
                if msg_type == "error":
                    result["console_errors"].append(f"error: {msg_text}")
                    
                    # Store stack trace if available
                    if 'stack_traces' not in result:
                        result['stack_traces'] = []
                    
                    if stack_trace:
                        # Store the error message and stack trace together
                        full_error = {
                            'message': msg_text,
                            'stack': stack_trace,
                            'combined': f"{msg_text}\n{stack_trace}"
                        }
                        result['stack_traces'].append(full_error)
                
                # Check for specific error patterns
                lower_text = msg_text.lower()
                
                # Debug log for all error messages to ensure we're seeing them
                if msg_type == "error" or "error" in lower_text:
                    logging.error(f"RAW BROWSER ERROR: {msg_text}")
                
                # Check for network errors
                if "failed to load resource" in lower_text or "net::" in lower_text:
                    result["network_errors"].append(msg_text)
                    
                # Improved syntax error detection with more patterns
                syntax_error_patterns = [
                    "parseerror", 
                    "syntax error", 
                    "syntaxerror", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input", 
                    "missing )", 
                    "missing }", 
                    "missing ]"
                ]
                
                if any(pattern in lower_text for pattern in syntax_error_patterns):
                    result["parse_errors"].append(msg_text)
                    logging.error(f"Syntax error detected: {msg_text}")
                    
                # Explicit check for "false is an invalid identifier" error
                if "false is an invalid identifier" in msg_text:
                    error_msg = f"SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    result["js_exceptions"].append(error_msg)
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
                    logging.error(f"Special syntax error detected: {error_msg}")
                    
                # Source map errors
                if "source map" in lower_text and "error" in lower_text:
                    result["parse_errors"].append(msg_text)
                
                # Log to Python console for debugging
                log_level = logging.INFO if msg_type != "error" else logging.ERROR
                logging.log(log_level, f"Browser console {msg_type}: {msg_text}")
            
            # Listen for page errors (including syntax errors)
            async def handle_page_error(error):
                # Format: ERROR TYPE: message [Source: filename.js:line]
                error_text = str(error)
                
                # Extract error type
                import re
                error_type = "Error"  # Default if no specific type found
                type_match = re.search(r'(Type|Syntax|Reference|Range|URI|Eval|Internal|Aggregate)?Error', error_text)
                if type_match:
                    error_type = type_match.group(0)
                
                # Extract error message (first line, before stack trace)
                error_message = error_text.split("\n")[0].strip()
                if ": " in error_message:
                    error_message = error_message.split(": ", 1)[1].strip()
                
                # Extract source information - find the first JS file reference
                source_info = ""
                file_line_match = re.search(r'([a-zA-Z0-9_\-./]+\.(js|html|mjs))(?::(\d+))?', error_text)
                if file_line_match:
                    file_path = file_line_match.group(1)
                    # Get just the filename, not the full path
                    file_name = file_path.split('/')[-1]
                    line_num = file_line_match.group(3) if file_line_match.group(3) else ""
                    source_info = f" [Source: {file_name}:{line_num}]" if line_num else f" [Source: {file_name}]"
                
                # Create the clean error format - Add "Uncaught" prefix for browser errors
                formatted_error = f"Uncaught {error_type}: {error_message}{source_info}"
                
                # Extract stack trace
                stack_trace = ""
                if "\n" in error_text:
                    # Get all lines after the first one
                    stack_lines = error_text.split("\n")[1:]
                    if stack_lines:
                        stack_trace = "\n".join(stack_lines)
                
                # Add to the appropriate error categories
                result["js_exceptions"].append(formatted_error)
                logging.error(formatted_error)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(formatted_error)
                
                # Add to console_logs error category
                result["console_logs"]["error"].append(formatted_error)
                
                # Store stack trace if available
                if 'stack_traces' not in result:
                    result['stack_traces'] = []
                
                if stack_trace:
                    # Store the error message and stack trace together
                    full_error = {
                        'message': formatted_error,
                        'stack': stack_trace,
                        'combined': f"{formatted_error}\n{stack_trace}"
                    }
                    result['stack_traces'].append(full_error)
                
                # Check if it's a parse/syntax error
                lower_text = error_text.lower()
                syntax_error_patterns = [
                    "syntaxerror", 
                    "parseerror", 
                    "syntax error", 
                    "parse error", 
                    "unexpected token", 
                    "is an invalid identifier",
                    "invalid identifier", 
                    "unexpected identifier", 
                    "unexpected end of input"
                ]
                
                if any(pattern in lower_text for pattern in syntax_error_patterns):
                    result["parse_errors"].append(formatted_error)
                    logging.error(f"Syntax error detected in page: {formatted_error}")
                
                # Explicit check for "false is an invalid identifier" error
                if "false is an invalid identifier" in error_text:
                    error_msg = f"SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    logging.error(f"Special syntax error detected in page: {error_msg}")
            
            # Listen for uncaught exceptions
            async def handle_exception(exception):
                # Format: ERROR TYPE: message [Source: filename.js:line]
                exception_text = str(exception)
                
                # Extract error type
                import re
                error_type = "Error"  # Default if no specific type found
                type_match = re.search(r'(Type|Syntax|Reference|Range|URI|Eval|Internal|Aggregate)?Error', exception_text)
                if type_match:
                    error_type = type_match.group(0)
                
                # Extract error message (first line, before stack trace)
                error_message = exception_text.split("\n")[0].strip()
                if ": " in error_message:
                    error_message = error_message.split(": ", 1)[1].strip()
                
                # Extract source information - find the first JS file reference
                source_info = ""
                file_line_match = re.search(r'([a-zA-Z0-9_\-./]+\.(js|html|mjs))(?::(\d+))?', exception_text)
                if file_line_match:
                    file_path = file_line_match.group(1)
                    # Get just the filename, not the full path
                    file_name = file_path.split('/')[-1]
                    line_num = file_line_match.group(3) if file_line_match.group(3) else ""
                    source_info = f" [Source: {file_name}:{line_num}]" if line_num else f" [Source: {file_name}]"
                
                # Create the clean error format - Add "Uncaught" prefix for browser errors
                formatted_error = f"Uncaught {error_type}: {error_message}{source_info}"
                
                # Extract stack trace
                stack_trace = ""
                if "\n" in exception_text:
                    # Get all lines after the first one
                    stack_lines = exception_text.split("\n")[1:]
                    if stack_lines:
                        stack_trace = "\n".join(stack_lines)
                
                # Add to the appropriate error categories
                result["js_exceptions"].append(formatted_error)
                logging.error(formatted_error)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(formatted_error)
                
                # Add to console_logs error category
                result["console_logs"]["error"].append(formatted_error)
                
                # Store stack trace if available
                if 'stack_traces' not in result:
                    result['stack_traces'] = []
                
                if stack_trace:
                    # Store the error message and stack trace together
                    full_error = {
                        'message': formatted_error,
                        'stack': stack_trace,
                        'combined': f"{formatted_error}\n{stack_trace}"
                    }
                    result['stack_traces'].append(full_error)
                
                # Check if it's our target syntax error
                if "false is an invalid identifier" in exception_text:
                    error_msg = f"SyntaxError: false is an invalid identifier{source_info}"
                    result["parse_errors"].append(error_msg)
                    logging.error(f"Found syntax error in exception: {error_msg}")
            
            # Listen for failed network requests
            async def handle_request_failed(request):
                url = request.url
                # Extract file name from URL if possible
                file_name = url.split("/")[-1] if "/" in url else url
                
                # Check for module formats (like ES6 imports often have query parameters)
                if "?" in file_name:
                    file_name = file_name.split("?")[0]
                
                # Format: ERROR TYPE: message [Source: filename]
                error_msg = f"NetworkError: Failed to load resource [Source: {file_name}]"
                
                result["network_errors"].append(error_msg)
                logging.error(error_msg)
                
                # Add to console_errors for backwards compatibility
                result["console_errors"].append(error_msg)
                
                # Also add to console logs for consistency
                result["console_logs"]["error"].append(error_msg)
            
            # Listen for resource loading errors (CSS, images, etc.)
            async def handle_response(response):
                if response.status >= 400:  # HTTP error codes
                    url = response.url
                    status = response.status
                    
                    # Extract file name from URL if possible
                    file_name = url.split("/")[-1] if "/" in url else url
                    
                    # Check for module formats (like ES6 imports often have query parameters)
                    if "?" in file_name:
                        file_name = file_name.split("?")[0]
                    
                    # Format: ERROR TYPE: message [Source: filename]
                    error_msg = f"HTTPError: Resource loading error (Status: {status}) [Source: {file_name}]"
                    
                    result["resource_errors"].append(error_msg)
                    logging.error(error_msg)
                    
                    # Add to console errors
                    result["console_errors"].append(error_msg)
                    result["console_logs"]["error"].append(error_msg)
            
            # Set up all event listeners
            page.on("console", handle_console)
            page.on("pageerror", handle_page_error)
            page.on("crash", lambda: logging.error("Page crashed"))
            page.on("requestfailed", handle_request_failed)
            page.on("response", handle_response)
            
            # Add handler for uncaught exceptions via page.evaluate
            await page.evaluate("""() => {
                window.addEventListener('error', (event) => {
                    // Specifically handle syntax errors with more details
                    if (event.error instanceof SyntaxError) {
                        console.error('JS SyntaxError:', event.message, 'at', event.filename, 'line', event.lineno);
                    } else {
                        // General error handling
                        console.error('JS Error:', event.message, 'at', event.filename, 'line', event.lineno);
                    }
                });
                
                // Add handler for unhandled promise rejections
                window.addEventListener('unhandledrejection', (event) => {
                    console.error('Unhandled Promise Rejection:', event.reason);
                });
                
                // Track resource loading errors
                const originalCreateElement = document.createElement;
                document.createElement = function() {
                    const element = originalCreateElement.apply(document, arguments);
                    
                    if (arguments[0].toLowerCase() === 'script') {
                        element.addEventListener('error', (e) => {
                            console.error('Script load error:', e.target.src);
                        });
                    }
                    
                    if (arguments[0].toLowerCase() === 'link' && element.rel === 'stylesheet') {
                        element.addEventListener('error', (e) => {
                            console.error('Stylesheet load error:', e.target.href);
                        });
                    }
                    
                    if (arguments[0].toLowerCase() === 'img') {
                        element.addEventListener('error', (e) => {
                            console.error('Image load error:', e.target.src);
                        });
                    }
                    
                    return element;
                };
            }""")
            
            try:
                # Navigate to the page
                await page.goto(url, wait_until="networkidle", timeout=3000)
                logging.info(f"Page loaded: {url}")
                
                # Wait for the page to be fully loaded
                await page.wait_for_timeout(2000)
                
                # Take initial screenshot
                initial_filename = f"frame_{self.frame_counter:05d}_initial.png"
                initial_screenshot = await self._save_screenshot(page, screenshots_dir, initial_filename)
                if initial_screenshot:
                    result["screenshots"].append(initial_screenshot)
                
                # Store previous screenshot for diff computation
                prev_screenshot = initial_screenshot
                
                # Check for canvas
                canvas_count = await page.evaluate("document.querySelectorAll('canvas').length")
                if canvas_count == 0:
                    result["error"] = "No canvas element found"
                    result["test_result"] = False
                    return result
                
                # --- GAME START TEST ---
                logging.info("Running game start test (pressing Enter)")
                
                # Store logs count before Enter press to check for new ones
                errors_before_enter = len(result["console_logs"]["error"])
                exceptions_before_enter = len(result["js_exceptions"])
                network_errors_before = len(result["network_errors"])
                resource_errors_before = len(result["resource_errors"])
                parse_errors_before = len(result["parse_errors"])
                
                # Start game with ENTER key
                start_test = await self._test_key_press(page, "Enter", "start_game", screenshots_dir)
                result["key_tests"].append(start_test)
                
                # Capture new errors that occurred during Enter press
                enter_console_errors = result["console_logs"]["error"][errors_before_enter:]
                enter_js_exceptions = result["js_exceptions"][exceptions_before_enter:]
                enter_network_errors = result["network_errors"][network_errors_before:]
                enter_resource_errors = result["resource_errors"][resource_errors_before:]
                enter_parse_errors = result["parse_errors"][parse_errors_before:]
                
                # Log all console messages during game start
                logging.info("All console messages during game start (Enter press):")
                for msg_type, messages in result["console_logs"].items():
                    # Get only messages added after pressing Enter
                    new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
                    for msg in new_messages:
                        logging.info(f"  - [{msg_type}] {msg}")
                
                # Log all error types separately
                if enter_js_exceptions:
                    logging.error("JavaScript errors during game start (Enter press):")
                    for exception in enter_js_exceptions:
                        logging.error(f"  - {exception}")
                
                if enter_network_errors:
                    logging.error("Network errors during game start (Enter press):")
                    for error in enter_network_errors:
                        logging.error(f"  - {error}")
                        
                if enter_resource_errors:
                    logging.error("Resource errors during game start (Enter press):")
                    for error in enter_resource_errors:
                        logging.error(f"  - {error}")
                        
                if enter_parse_errors:
                    logging.error("Parse errors during game start (Enter press):")
                    for error in enter_parse_errors:
                        logging.error(f"  - {error}")
                
                # Check for error messages during game start
                enter_error_messages = []
                for msg in enter_console_errors:
                    if "error" in msg.lower():
                        enter_error_messages.append(msg)
                
                # Also add all specialized error types to error messages
                enter_error_messages.extend(enter_js_exceptions)
                enter_error_messages.extend(enter_network_errors)
                enter_error_messages.extend(enter_resource_errors)
                enter_error_messages.extend(enter_parse_errors)
                
                # Check for error messages in any console logs (not just error type)
                for msg_type, messages in result["console_logs"].items():
                    # Skip the error type as we already processed it above
                    if msg_type == "error":
                        continue
                    # Get only messages added after pressing Enter
                    new_messages = messages[errors_before_enter:] if len(messages) > errors_before_enter else []
                    for msg in new_messages:
                        if "error" in msg.lower():
                            enter_error_messages.append(msg)
                
                # If we found any errors during Enter press, fail the test immediately
                if enter_error_messages:
                    result["game_start_test"]["test_result"] = False
                    result["game_start_test"]["no_error_messages"] = False
                    result["error"] = f"Game start test failed: {len(enter_error_messages)} error messages detected in console after pressing ENTER."
                    result["console_error_message"] = "\n".join(enter_error_messages)
                    logging.error("Console errors during game start:")
                    for err in enter_error_messages:
                        logging.error(f"  - {err}")
                    result["test_result"] = False
                    return result
                
                game_phase_after_enter = None
                game_phase_check_passed = False
                
                # Calculate diff with previous screenshot
                if prev_screenshot and start_test.get("screenshot"):
                    diff_score = self._compare_screenshots(prev_screenshot, start_test.get("screenshot"))
                    start_test["diff_score"] = diff_score
                    
                    # Update game start test results
                    result["game_start_test"]["diff_score"] = diff_score
                    result["game_start_test"]["screenshot"] = start_test.get("screenshot")
                    
                    # Check gamePhase after pressing Enter
                    try:
                        # First check if getGameState function exists
                        has_game_state_function = await page.evaluate("""() => {
                            return typeof getGameState === 'function';
                        }""")
                        
                        if not has_game_state_function:
                            logging.error("getGameState function not found in the game")
                            game_phase_check_passed = True
                            game_phase_after_enter = "ERROR: getGameState function not found"
                        else:
                            game_state = await page.evaluate("getGameState()")
                            if game_state and isinstance(game_state, dict):
                                game_phase_after_enter = game_state.get("gamePhase")
                                if game_phase_after_enter == "PLAYING":
                                    game_phase_check_passed = True
                                else:
                                    logging.warning(f"Game phase after Enter is '{game_phase_after_enter}', expected 'PLAYING'")
                            else:
                                logging.warning(f"getGameState() did not return a valid dictionary. Returned: {game_state}")
                                game_phase_after_enter = f"ERROR: Invalid gameState: {game_state}"
                    except Exception as e:
                        logging.error(f"Error evaluating getGameState(): {e}")
                        game_phase_after_enter = f"ERROR: {str(e)}"

                    result["game_start_test"]["game_phase_after_enter"] = game_phase_after_enter
                    result["game_start_test"]["game_phase_check_passed"] = game_phase_check_passed
                    
                    # Game start test passes if:
                    # 1. Visual changes were detected (diff_score > 0.001)
                    # 2. Game phase is correct 
                    # 3. No error messages appeared (already checked above)
                    result["game_start_test"]["no_error_messages"] = True  # We already checked for errors earlier
                    result["game_start_test"]["test_result"] = (
                        (diff_score > 0.001) and 
                        game_phase_check_passed
                    )
                    
                    if diff_score > 0.001:
                        result["visual_changes"].append({
                            "key": "Enter",
                            "diff_score": diff_score
                        })
                    
                    # Update previous screenshot for next comparison
                    prev_screenshot = start_test.get("screenshot")
                
                # Update the conditional that checks if game started successfully
                if not result["game_start_test"]["test_result"]:
                    error_message = "Game did not start on pressing ENTER."
                    if not (diff_score > 0.001):
                        error_message += " No visual change detected after pressing ENTER."
                    if not game_phase_check_passed:
                        error_message += f" gamePhase was '{game_phase_after_enter}', expected 'PLAYING'."
                    result["error"] = error_message.strip()
                    
                    result["test_result"] = False
                    return result
                
                # --- GAMEPLAY TEST ---
                logging.info("Running gameplay test (random key presses)")
                
                # Now perform random actions for gameplay test
                logging.info("Starting random action sequence (16 actions)")
                random_action_results = []
                
                for i in range(16):
                    # Choose a random key from gameplay keys
                    random_key = random.choice(self.gameplay_keys)
                    logging.info(f"Random action {i+1}/16: Pressing key {random_key}")
                    
                    # Store previous errors count to check for new ones
                    errors_before = len(result["console_logs"]["error"])
                    exceptions_before = len(result["js_exceptions"])
                    network_errors_before = len(result["network_errors"])
                    resource_errors_before = len(result["resource_errors"])
                    parse_errors_before = len(result["parse_errors"])
                    
                    # Test key press
                    key_test = await self._test_key_press(page, random_key, f"random_{i}_{random_key}", screenshots_dir)
                    
                    # Calculate diff with previous screenshot
                    if prev_screenshot and key_test.get("screenshot"):
                        diff_score = self._compare_screenshots(prev_screenshot, key_test.get("screenshot"))
                        key_test["diff_score"] = diff_score
                        
                        # Add to gameplay test results
                        result["gameplay_test"]["diff_scores"].append(diff_score)
                        result["gameplay_test"]["screenshots"].append(key_test.get("screenshot"))
                        
                        if diff_score > 0.001:
                            result["visual_changes"].append({
                                "key": random_key,
                                "diff_score": diff_score
                            })
                        
                        # Update previous screenshot for next comparison
                        prev_screenshot = key_test.get("screenshot")
                    
                    # Check for new errors of all types
                    new_errors = result["console_logs"]["error"][errors_before:]
                    new_exceptions = result["js_exceptions"][exceptions_before:]
                    new_network_errors = result["network_errors"][network_errors_before:]
                    new_resource_errors = result["resource_errors"][resource_errors_before:]
                    new_parse_errors = result["parse_errors"][parse_errors_before:]
                    
                    has_new_errors = (
                        len(new_errors) > 0 or 
                        len(new_exceptions) > 0 or
                        len(new_network_errors) > 0 or
                        len(new_resource_errors) > 0 or
                        len(new_parse_errors) > 0
                    )
                    
                    # Log new errors for debugging
                    if has_new_errors:
                        logging.info(f"Console messages and errors during key press '{random_key}':")
                        for msg in new_errors:
                            logging.info(f"  - [error] {msg}")
                        for msg in new_exceptions:
                            logging.error(f"  - [exception] {msg}")
                        for msg in new_network_errors:
                            logging.error(f"  - [network] {msg}")
                        for msg in new_resource_errors:
                            logging.error(f"  - [resource] {msg}")
                        for msg in new_parse_errors:
                            logging.error(f"  - [parse] {msg}")
                    
                    # Combine all errors for this action
                    all_new_errors = (
                        new_errors + 
                        new_exceptions + 
                        new_network_errors + 
                        new_resource_errors + 
                        new_parse_errors
                    )
                    
                    # Add to action results
                    random_action_info = {
                        "action_index": i,
                        "key": random_key,
                        "screenshot": key_test.get("screenshot"),
                        "diff_score": key_test.get("diff_score", 0),
                        "new_errors": all_new_errors,
                        "has_errors": has_new_errors
                    }
                    
                    # If this key press generated errors, mark it as failed and log the errors
                    if has_new_errors:
                        error_messages = []
                        for msg in new_errors:
                            if "error" in msg.lower():
                                error_messages.append(msg)
                        # Add all specialized error types
                        error_messages.extend(new_exceptions)
                        error_messages.extend(new_network_errors)
                        error_messages.extend(new_resource_errors)
                        error_messages.extend(new_parse_errors)
                        
                        if error_messages:
                            random_action_info["test_result"] = False
                            random_action_info["console_error_message"] = "\n".join(error_messages)
                            logging.error(f"Errors detected during key press '{random_key}':")
                            for err in error_messages:
                                logging.error(f"  - {err}")
                    
                    random_action_results.append(random_action_info)
                    
                    # Wait between actions
                    await page.wait_for_timeout(50)
                
                # Add random action results to the overall results
                result["random_actions"] = random_action_results
                
                # Determine if gameplay test passed (any key press caused visual change)
                non_zero_diffs = [score for score in result["gameplay_test"]["diff_scores"] if score > 0.001]
                result["gameplay_test"]["test_result"] = len(non_zero_diffs) > 0
                
                if not result["gameplay_test"]["test_result"]:
                    result["error"] = "Gameplay test failed: No key presses produced visual changes during gameplay"
                    result["test_result"] = False
                    
                    # Include all error types if available
                    all_errors = (
                        result["console_logs"]["error"] + 
                        result["js_exceptions"] + 
                        result["network_errors"] + 
                        result["resource_errors"] + 
                        result["parse_errors"]
                    )
                    
                    if all_errors:
                        result["console_error_message"] = "\n".join(all_errors)
                
                # Check for errors in the entire test
                console_errors = []
                for msg_type, messages in result["console_logs"].items():
                    for msg in messages:
                        if "error" in msg.lower():
                            console_errors.append(msg)
                
                # Add all specialized error types
                console_errors.extend(result["js_exceptions"])
                console_errors.extend(result["network_errors"])
                console_errors.extend(result["resource_errors"])
                console_errors.extend(result["parse_errors"])
                
                no_console_errors = len(console_errors) == 0
                
                # Find key presses that generated errors
                key_presses_with_errors = [action for action in random_action_results if action.get("has_errors", False)]
                
                # If there were any errors during key presses, mark the test as failed
                if key_presses_with_errors:
                    result["error"] = f"Errors detected during {len(key_presses_with_errors)} key press(es)"
                    result["test_result"] = False
                    
                    # Include all error messages
                    if console_errors:
                        result["console_error_message"] = "\n".join(console_errors)
                    
                    # Add information about key presses that caused errors
                    result["key_presses_with_errors"] = [
                        {"key": action["key"], "index": action["action_index"]} 
                        for action in key_presses_with_errors
                    ]
                else:
                    # Overall test passes if both game start and gameplay tests pass and there are no errors
                    result["test_result"] = (
                        no_console_errors and 
                        result["game_start_test"]["test_result"] and 
                        result["gameplay_test"]["test_result"]
                    )
                
                    # If test failed due to errors, include them in dedicated field
                    if not result["test_result"] and not no_console_errors:
                        result["console_error_message"] = "\n".join(console_errors)
                
                # Add summary information
                result["summary"] = {
                    "game_start_test": result["game_start_test"]["test_result"],
                    "gameplay_test": result["gameplay_test"]["test_result"],
                    "no_console_errors": no_console_errors,
                    "overall_result": result["test_result"]
                }
                
                # Log summary of all error types
                if result["js_exceptions"]:
                    logging.error(f"Total JavaScript exceptions: {len(result['js_exceptions'])}")
                if result["network_errors"]:
                    logging.error(f"Total network errors: {len(result['network_errors'])}")
                if result["resource_errors"]:
                    logging.error(f"Total resource errors: {len(result['resource_errors'])}")
                if result["parse_errors"]:
                    logging.error(f"Total parse/syntax errors: {len(result['parse_errors'])}")
                
            except Exception as e:
                logging.error(f"Error in game interaction test: {e}")
                result["error"] = f"Game interaction test error: {e}"
            finally:
                await browser.close()
                
        return result
    
    async def _test_key_press(self, page: Page, key: str, test_name: str, screenshots_dir: str) -> Dict[str, Any]:
        """
        Test a single key press and capture the resulting state
        
        Args:
            page: Playwright page
            key: Key to press
            test_name: Name of the test
            screenshots_dir: Directory to save screenshots
            
        Returns:
            Dictionary with test results
        """
        result = {
            "key": key,
            "test_name": test_name,
            "diff_score": 0,
            "screenshot": "",
        }
        
        try:
            # Ensure the canvas is properly focused before sending key
            await page.evaluate("""() => {
                document.body.click();
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    if (!canvas.hasAttribute('tabindex')) {
                        canvas.setAttribute('tabindex', '1');
                    }
                    canvas.focus();
                    canvas.click();
                }
            }""")
            
            # Press the key using multiple methods for better reliability
            logging.info(f"Pressing key: {key}")
            
            # Method 1: Standard press
            await page.keyboard.press(key)
            
            # Method 2: Try with down and up events
            await page.keyboard.down(key)
            await page.wait_for_timeout(50)
            await page.keyboard.up(key)
            
            # Method 3: Try sending key via JavaScript for games that use custom event listeners
            key_code = self.key_mapping.get(key, 0)
            if key_code > 0:
                await page.evaluate(f"""() => {{
                    const canvas = document.querySelector('canvas');
                    if (canvas) {{
                        const events = ['keydown', 'keypress', 'keyup'];
                        events.forEach(eventType => {{
                            const event = new KeyboardEvent(eventType, {{
                                key: '{key}',
                                keyCode: {key_code},
                                code: '{key}',
                                which: {key_code},
                                bubbles: true,
                                cancelable: true
                            }});
                            canvas.dispatchEvent(event);
                        }});
                    }}
                }}""")
                        
            # Wait for visual changes
            await page.wait_for_timeout(50)
            
            # Take a single screenshot after the key press
            screenshot_filename = f"frame_{self.frame_counter:05d}_action_{key}.png"
            screenshot = await self._save_screenshot(page, screenshots_dir, screenshot_filename)
            result["screenshot"] = screenshot
            
        except Exception as e:
            logging.error(f"Error testing key {key}: {e}")
            result["error"] = str(e)
            
        return result
    
    def _compare_screenshots(self, before_path: str, after_path: str) -> float:
        """
        Compare two screenshots and calculate a difference score.
        
        Args:
            before_path: Path to before screenshot
            after_path: Path to after screenshot
            
        Returns:
            diff_score: float between 0 and 1, where 0 is no difference and 1 is completely different
        """
        try:
            # Open images
            before_img = Image.open(before_path)
            after_img = Image.open(after_path)
            
            # Ensure same size for comparison
            if before_img.size != after_img.size:
                # Resize the smaller image to match the larger one
                if before_img.size[0] * before_img.size[1] < after_img.size[0] * after_img.size[1]:
                    before_img = before_img.resize(after_img.size, Image.Resampling.LANCZOS)
                else:
                    after_img = after_img.resize(before_img.size, Image.Resampling.LANCZOS)
            
            # Calculate difference
            diff_img = ImageChops.difference(before_img, after_img)
            
            # Calculate difference score (0 to 1)
            diff_gray = diff_img.convert('L')  # Convert to grayscale
            total_pixels = diff_gray.size[0] * diff_gray.size[1]
            diff_pixels = sum(1 for pixel in diff_gray.getdata() if pixel > 0)
            diff_score = diff_pixels / total_pixels
            
            return diff_score
            
        except Exception as e:
            logging.error(f"Error comparing screenshots: {e}")
            return 0 