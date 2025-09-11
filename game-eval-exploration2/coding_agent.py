import anthropic
import os
import dotenv

dotenv.load_dotenv()

API_KEY = os.getenv("ANTHROPIC_API_KEY")


class CodingAgent:
    """A minimal coding agent using Anthropic's text editor tool."""
    
    def __init__(self, model: str = "claude-sonnet-4-20250514", verbose: bool = False):
        self.client = anthropic.Anthropic(api_key=API_KEY)
        self.model = model
        self.verbose = verbose
        self.conversation_history = []
        self.system_message = f"You are a coding assistant with text editor capabilities. Current working directory: {os.getcwd()}"
        
    def _handle_view_command(self, path: str, view_range: list = None) -> str:
        """Handle view command to read file or directory contents."""
        try:
            if os.path.isdir(path):
                items = os.listdir(path)
                return f"Directory listing for {path}:\n" + "\n".join(items)
            
            elif os.path.isfile(path):
                with open(path, 'r') as f:
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
            with open(path, 'r') as f:
                content = f.read()
            
            match_count = content.count(old_str)
            if match_count == 0:
                return "Error: No match found"
            elif match_count > 1:
                return f"Error: Found {match_count} matches. Be more specific"
            
            new_content = content.replace(old_str, new_str)
            with open(path, 'w') as f:
                f.write(new_content)
            return "Successfully replaced text"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_create_command(self, path: str, file_text: str) -> str:
        """Handle create command to create new file."""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w') as f:
                f.write(file_text)
            return f"Created {path}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_insert_command(self, path: str, insert_line: int, new_str: str) -> str:
        """Handle insert command to insert text at specific line."""
        try:
            with open(path, 'r') as f:
                lines = f.readlines()
            
            if insert_line == 0:
                lines.insert(0, new_str)
            else:
                lines.insert(insert_line, new_str)
            
            with open(path, 'w') as f:
                f.writelines(lines)
            return f"Inserted text at line {insert_line}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _handle_editor_tool(self, tool_call) -> str:
        """Process text editor tool calls from Claude."""
        cmd = tool_call.input.get('command', '')
        
        if cmd == 'view':
            return self._handle_view_command(
                tool_call.input.get('path', ''),
                tool_call.input.get('view_range')
            )
        elif cmd == 'str_replace':
            return self._handle_str_replace_command(
                tool_call.input.get('path', ''),
                tool_call.input.get('old_str', ''),
                tool_call.input.get('new_str', '')
            )
        elif cmd == 'create':
            return self._handle_create_command(
                tool_call.input.get('path', ''),
                tool_call.input.get('file_text', '')
            )
        elif cmd == 'insert':
            return self._handle_insert_command(
                tool_call.input.get('path', ''),
                tool_call.input.get('insert_line', 0),
                tool_call.input.get('new_str', '')
            )
        else:
            return f"Unknown command: {cmd}"
    
    def chat(self, message: str) -> str:
        """Send message to Claude and handle tool calls."""
        self.conversation_history.append({"role": "user", "content": message})
        
        while True:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=self.system_message,
                tools=[{
                    "type": "text_editor_20250728",
                    "name": "str_replace_based_edit_tool"
                }],
                messages=self.conversation_history
            )
            
            self.conversation_history.append({
                "role": "assistant",
                "content": response.content
            })
            
            tool_results = []
            assistant_text = ""
            
            for content in response.content:
                if content.type == "text":
                    assistant_text += content.text
                elif content.type == "tool_use":
                    cmd = content.input.get('command')
                    path = content.input.get('path', '')
                    
                    if self.verbose:
                        print(f"\n📁 {cmd.upper()} {path}")
                        if cmd == 'str_replace':
                            old = content.input.get('old_str', '')[:50]
                            new = content.input.get('new_str', '')[:50]
                            print(f"   Replace: '{old}...' → '{new}...'")
                        elif cmd == 'create':
                            lines = content.input.get('file_text', '').count('\n') + 1
                            print(f"   Creating file with {lines} lines")
                    
                    result = self._handle_editor_tool(content)
                    
                    if self.verbose:
                        print(f"   ✓ {result}")
                    
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
    
    while True:
        user_input = input("\n> ")
        if user_input.lower() in ['quit', 'exit']:
            break
        print(f"\nAgent: {agent.chat(user_input)}")