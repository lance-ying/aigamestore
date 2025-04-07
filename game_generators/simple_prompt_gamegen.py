import os
import re
import random
from typing import Tuple, List, Optional, Dict, Any, Literal
from openai import OpenAI
from langchain.prompts import PromptTemplate

from game_generators.base_game_generator import BaseGameGenerator

# Import additional clients based on model type
try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from google import genai
except ImportError:
    genai = None

class SimplePromptGen(BaseGameGenerator):
    """
    Simple game generator that uses a single-shot prompt to generate games
    based on the approach in generate_game_singleshot.py
    """
    
    def __init__(self, config_path: str = "config/gamegen/base_prompt.yaml", 
                 model_name: str = "openai:o3-mini"):
        """
        Initialize the simple prompt generator
        
        Args:
            config_path: Path to the configuration YAML file
            model_name: Name of the AI model to use with provider prefix
                        Format: "provider:model" (e.g., "openai:o3-mini", "claude:claude-3-haiku", "gemini:gemini-1.5-flash")
        """
        super().__init__(config_path)
        # Parse model provider and name
        self.model_provider, self.model = self._parse_model_name(model_name)
        # Initialize appropriate client based on model provider
        self.client = self._initialize_client()
        
    def _parse_model_name(self, model_name: str) -> Tuple[str, str]:
        """
        Parse the model name string to extract provider and model name
        
        Args:
            model_name: String in format "provider:model"
            
        Returns:
            Tuple of (provider, model)
        """
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            return provider.lower(), model
        else:
            # Default to OpenAI if no provider specified
            return "openai", model_name
    
    def _initialize_client(self):
        """
        Initialize the appropriate client based on the model provider
        
        Returns:
            Initialized client for the selected model provider
        """
        if self.model_provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        elif self.model_provider == "claude":
            if anthropic is None:
                raise ImportError("The 'anthropic' package is required to use Claude models. Install it with 'pip install anthropic'.")
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        elif self.model_provider == "gemini":
            if genai is None:
                raise ImportError("The 'google-generativeai' package is required to use Gemini models. Install it with 'pip install google-generativeai'.")
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            return genai
        
        else:
            raise ValueError(f"Unsupported model provider: {self.model_provider}. Supported providers are 'openai', 'claude', and 'gemini'.")
        
    def generate_prompt(self, genre: str, num_players: int) -> str:
        """
        Generate the game creation prompt using LangChain's PromptTemplate
        
        Args:
            genre: Game genre
            num_players: Number of players/agents
            
        Returns:
            str: Generated prompt
        """
        # Fixed actions for each agent, matching the original implementation
        actions = "arrow keys, shift, space bar, w, a, s, d"
        
        template = (
            "Generate a interesting engaging continual {genre} game with intelligent{num_agents} agents using p5.js. The game must be playable on a basic HTML webpage.\n"
            "Game details:\n"
            "- Genre: {genre}\n"
            "- Total number of agents: {num_agents}\n"
            "- Number of controllable agents: 1\n"
            "- Actions available for each controllable agent: {actions}\n"
            "- Decide the state of the game and the state of each agent with variables and their types ranges.\n"
            "- Decide the objectives for success and failure conditions and the rewards for each agent.\n"
            "- Decide the random initial conditions of the game and the initial state of each agent for each restart of the game.\n"
            "- On success or failure, the game should be over with a message to the human player in the game window.\n"
            "- The gameplay should be engaging and interesting and should look aesthetically pleasing.\n"
            "- Mention the name of the game and the actions in the html above the game canvas.\n"
            "- No audio should be used.\n"
            "Please output your answer as two Markdown code blocks with language tags, exactly as follows:\n"
            "1. The first code block should be labeled with ```html and contain the full HTML code (index.html) that loads the p5.js library (e.g., from a CDN) and includes a <script> tag referencing 'game.js'.\n"
            "2. The second code block should be labeled with ```javascript and contain the complete JavaScript code (game.js) for the p5.js game.\n\n"
            "Ensure that when the HTML file is opened in a browser, the {genre} game runs correctly."
        )
        
        prompt_template = PromptTemplate(
            input_variables=["genre", "num_agents", "actions"],
            template=template,
        )
        
        return prompt_template.format(
            genre=genre, num_agents=num_players, actions=actions
        )
    
    def generate_instructions(self) -> str:
        """
        Generate instructions based on configuration requirements
        
        Returns:
            str: Instructions string
        """
        requirements = self.config.get("requirements", {})
        allowed_libraries = requirements.get("allowed_libraries", {"p5.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"})
        
        instructions = "Your generated game should follow these requirements:\n"
        
        if allowed_libraries:
            instructions += "- You can use these libraries:\n"
            for lib, url in allowed_libraries.items():
                instructions += f"  * {lib}: {url}\n"
        
        if not requirements.get("audio", False):
            instructions += "- Do not use audio in the game\n"
            
        if requirements.get("start_end_screen", True):
            instructions += "- Include a start screen and a game over screen\n"
            
        return instructions

    def generate_game(self, genre: str, num_players: int) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate game code using the selected AI model
        
        Args:
            genre: Game genre
            num_players: Number of players/agents
            
        Returns:
            Tuple of (html_code, js_files, game_title, description, full_response)
            where js_files is a list of tuples (filename, content)
        """
        # Validate genre
        if genre not in self.valid_genres:
            genre = random.choice(self.valid_genres)
            
        # Generate prompt
        prompt = self.generate_prompt(genre, num_players)
        
        # Call appropriate API based on model provider
        full_response = self._call_model_api(prompt)
        
        # Parse HTML and JavaScript from the response
        html_code, js_code = self._parse_html_js_blocks(full_response)
        
        # Create js_files list format expected by BaseGameGenerator
        js_files = [("game.js", js_code)] if js_code else []
        
        # Extract game title and create a description
        game_title = self._extract_game_title(full_response)
        description = f"A {genre} game with {num_players} agents"
        
        return html_code, js_files, game_title, description, full_response
    
    def _call_model_api(self, prompt: str) -> str:
        """
        Call the appropriate model API based on the provider
        
        Args:
            prompt: The prompt to send to the model
            
        Returns:
            str: The model's response text
        """
        if self.model_provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        
        elif self.model_provider == "claude":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        
        elif self.model_provider == "gemini":
            model = self.client.GenerativeModel(model_name=self.model)
            response = model.generate_content(prompt)
            return response.text
        
        else:
            raise ValueError(f"Unsupported model provider: {self.model_provider}")
    
    def _parse_html_js_blocks(self, response_text: str) -> Tuple[str, str]:
        """
        Extract HTML and JavaScript code blocks from the response
        
        Args:
            response_text: Full response text from the model
            
        Returns:
            Tuple of (html_code, js_code)
        """
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)
        
        html_code = html_match.group(1).strip() if html_match else ""
        js_code = js_match.group(1).strip() if js_match else ""
        
        return html_code, js_code
