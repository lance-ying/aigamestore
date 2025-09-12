import anthropic
import os
import dotenv
import subprocess
import threading
import queue
import time

dotenv.load_dotenv()

API_KEY = os.getenv("ANTHROPIC_API_KEY")


class BashSession:
    """A persistent bash session for executing commands."""
    
    def __init__(self, cwd=None):
        self.cwd = cwd
        self.process = None
        self.restart()
    
    def restart(self):
        """Restart the bash session."""
        if self.process:
            self.process.terminate()
            self.process.wait()
        
        self.process = subprocess.Popen(
            ['/bin/bash'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=self.cwd
        )
    
    def execute(self, command: str, timeout: int = 30) -> str:
        """Execute a command and return the output."""
        try:
            # Add command to get exit code
            full_command = f"{command}\necho \"EXIT_CODE:$?\""
            
            self.process.stdin.write(full_command + '\n')
            self.process.stdin.flush()
            
            output_lines = []
            start_time = time.time()
            
            while True:
                if time.time() - start_time > timeout:
                    return f"Command timed out after {timeout} seconds"
                
                line = self.process.stdout.readline()
                if not line:
                    break
                
                line = line.rstrip('\n')
                if line.startswith("EXIT_CODE:"):
                    break
                
                output_lines.append(line)
            
            return '\n'.join(output_lines) if output_lines else ""
            
        except Exception as e:
            return f"Error executing command: {str(e)}"


class CodingAgent:
    """A minimal coding agent using Anthropic's text editor tool."""
    
    def __init__(self, model: str = "claude-sonnet-4-20250514", verbose: bool = False, enable_bash: bool = True, cwd: str = None):
        self.client = anthropic.Anthropic(api_key=API_KEY)
        self.model = model
        self.verbose = verbose
        self.enable_bash = enable_bash
        self.cwd = cwd or os.getcwd()
        self.conversation_history = []
        self.bash_session = BashSession(cwd=cwd) if enable_bash else None
        
        capabilities = "text editor capabilities"
        if enable_bash:
            capabilities += " and bash command execution"
        self.system_message = f"You are a coding assistant with {capabilities}. Current working directory: {self.cwd}"
        
    def _handle_view_command(self, path: str, view_range: list = None) -> str:
        """Handle view command to read file or directory contents."""
        try:
            # Resolve path relative to working directory
            full_path = os.path.join(self.cwd, path) if not os.path.isabs(path) else path
            
            if os.path.isdir(full_path):
                items = os.listdir(full_path)
                return f"Directory listing for {path}:\n" + "\n".join(items)
            
            elif os.path.isfile(full_path):
                with open(full_path, 'r') as f:
                    lines = f.readlines()
                
                if view_range:
                    start, end = view_range
                    if end == -1:
                        end = len(lines)
                    lines = lines[start-1:end]
                
                content = ""
                start_line = view_range[0] if view_range else 1
                for i, line in enumerate(lines, start=start_line):
                    content += f"{i}: {line}"
                return content
            else:
                return f"Error: Path '{path}' does not exist"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_str_replace_command(self, path: str, old_str: str, new_str: str) -> str:
        """Handle str_replace command to replace text in file."""
        try:
            # Resolve path relative to working directory
            full_path = os.path.join(self.cwd, path) if not os.path.isabs(path) else path
            
            with open(full_path, 'r') as f:
                content = f.read()
            
            match_count = content.count(old_str)
            if match_count == 0:
                return "Error: No match found"
            elif match_count > 1:
                return f"Error: Found {match_count} matches. Be more specific"
            
            new_content = content.replace(old_str, new_str)
            with open(full_path, 'w') as f:
                f.write(new_content)
            return "Successfully replaced text"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_create_command(self, path: str, file_text: str) -> str:
        """Handle create command to create new file."""
        try:
            # Resolve path relative to working directory
            full_path = os.path.join(self.cwd, path) if not os.path.isabs(path) else path
            
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(file_text)
            return f"Created {path}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_insert_command(self, path: str, insert_line: int, new_str: str) -> str:
        """Handle insert command to insert text at specific line."""
        try:
            # Resolve path relative to working directory
            full_path = os.path.join(self.cwd, path) if not os.path.isabs(path) else path
            
            with open(full_path, 'r') as f:
                lines = f.readlines()
            
            if insert_line == 0:
                lines.insert(0, new_str)
            else:
                lines.insert(insert_line, new_str)
            
            with open(full_path, 'w') as f:
                f.writelines(lines)
            return f"Inserted text at line {insert_line}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_editor_tool(self, tool_call) -> str:
        """Process text editor tool calls from Claude."""
        if 'command' not in tool_call.input:
            return "Error: Missing 'command' parameter"
        
        cmd = tool_call.input['command']
        
        if cmd == 'view':
            if 'path' not in tool_call.input:
                return "Error: Missing 'path' parameter for view command"
            return self._handle_view_command(
                tool_call.input['path'],
                tool_call.input.get('view_range')  # Optional parameter
            )
        elif cmd == 'str_replace':
            required = ['path', 'old_str']
            for param in required:
                if param not in tool_call.input:
                    return f"Error: Missing '{param}' parameter for str_replace command"
            return self._handle_str_replace_command(
                tool_call.input['path'],
                tool_call.input['old_str'],
                tool_call.input.get('new_str', '')
            )
        elif cmd == 'create':
            required = ['path', 'file_text']
            for param in required:
                if param not in tool_call.input:
                    return f"Error: Missing '{param}' parameter for create command"
            return self._handle_create_command(
                tool_call.input['path'],
                tool_call.input['file_text']
            )
        elif cmd == 'insert':
            required = ['path']
            for param in required:
                if param not in tool_call.input:
                    return f"Error: Missing '{param}' parameter for insert command"
            return self._handle_insert_command(
                tool_call.input['path'],
                tool_call.input['insert_line'],
                tool_call.input['new_str']
            )
        else:
            return f"Unknown command: {cmd}"
    
    def _handle_bash_tool(self, tool_call) -> str:
        """Process bash tool calls from Claude."""
        if not self.enable_bash:
            return "Error: Bash tool is disabled"
        
        if 'restart' in tool_call.input and tool_call.input['restart']:
            self.bash_session.restart()
            return "Bash session restarted"
        
        if 'command' not in tool_call.input:
            return "Error: Missing 'command' parameter for bash tool"
            
        command = tool_call.input['command']
        if not command:
            return "Error: Empty command provided"
        
        return self.bash_session.execute(command)
    
    def chat(self, message: str) -> str:
        """Send message to Claude and handle tool calls."""
        if self.verbose:
            print(f"\n👤 User: {message}")
        self.conversation_history.append({"role": "user", "content": message})
        
        while True:
            tools = [{
                "type": "text_editor_20250728",
                "name": "str_replace_based_edit_tool"
            }]
            
            if self.enable_bash:
                tools.append({
                    "type": "bash_20250124",
                    "name": "bash"
                })
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=10000,  # tool use message can miss parameters if max_tokens is too low
                system=self.system_message,
                tools=tools,
                messages=self.conversation_history
            )
            
            self.conversation_history.append({
                "role": "assistant",
                "content": response.content
            })
            
            assistant_text = ""
            tool_results = []
            
            for content in response.content:
                if self.verbose:
                    print(f"Content: {content}")

                if content.type == "text":
                    assistant_text += content.text
                    if self.verbose and content.text:
                        print(f"\n🤖 {content.text}")
                elif content.type == "tool_use":
                    if content.name == "str_replace_based_edit_tool":
                        if self.verbose:
                            cmd = content.input.get('command', 'UNKNOWN')
                            path = content.input.get('path', 'UNKNOWN')
                            print(f"\n📁 {cmd.upper()} {path}")
                            if cmd == 'str_replace' and 'old_str' in content.input and 'new_str' in content.input:
                                old = content.input['old_str'][:50]
                                new = content.input['new_str'][:50]
                                print(f"   Replace: '{old}...' → '{new}...'")
                            elif cmd == 'create' and 'file_text' in content.input:
                                lines = content.input['file_text'].count('\n') + 1
                                print(f"   Creating file with {lines} lines")
                        
                        result = self._handle_editor_tool(content)
                    
                    elif content.name == "bash":
                        if self.verbose:
                            if 'restart' in content.input and content.input['restart']:
                                print(f"\n💻 BASH RESTART")
                            elif 'command' in content.input:
                                print(f"\n💻 BASH {content.input['command']}")
                            else:
                                print(f"\n💻 BASH (no command)")
                        
                        result = self._handle_bash_tool(content)
                    
                    else:
                        result = f"Unknown tool: {content.name}"
                    
                    if self.verbose:
                        print(f"   ✓ {result[:100]}{'...' if len(result) > 100 else ''}")
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": content.id,
                        "content": result
                    })

            if tool_results:
                self.conversation_history.append({
                    "role": "user",
                    "content": tool_results
                })
                continue
            else:
                return assistant_text


if __name__ == "__main__":
    agent = CodingAgent(verbose=True)
    print("Type 'quit' to exit.")
    

    inp = """Implement a complete game based on the following prompt:
<prompt>
Genre: Pinball, Subgenre: Ramp Combo, Theme: Microbe Scale
</prompt>

Make sure the game is winnable in a few minutes.

Preferred framework for 2D games: p5.js
- Canvas size 600x400
- All UI elements drawn on the canvas, no elements outside the canvas (just white background)
- Clear instructions on how to play the game
- Clear win/lose condition and win/lose screens
- Score system
- Option to restart the game
- Set random seed for reproducibility

Game graphics:
- Polished graphics
- Use noStroke() before drawing text
- Don't draw elements randomly sampled a each frame (it creates flickering)
- No icons

Implement the game in a single index.html file.
"""
    print(f"\nAgent: {agent.chat(inp)}")
    # while True:
    #     user_input = input("\n> ")
    #     if user_input.lower() in ['quit', 'exit']:
    #         break
    #     print(f"\nAgent: {agent.chat(user_input)}")