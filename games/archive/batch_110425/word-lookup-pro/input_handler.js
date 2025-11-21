// input_handler.js - Input handling
import { gameState, GAME_PHASES, MODES } from './globals.js';
import { Dictionary } from './dictionary.js';

export class InputHandler {
  constructor(p, dictionary) {
    this.p = p;
    this.dictionary = dictionary;
    this.lastProcessedKey = null;
  }
  
  handleKeyPressed(keyCode, key) {
    const p = this.p;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (keyCode === 13) { // ENTER
        this.startGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      this.handlePlayingInput(keyCode, key);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (keyCode === 27) { // ESC
        this.unpauseGame();
      }
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      if (keyCode === 82) { // R
        this.restartGame();
      }
    }
    
    // Global controls
    if (keyCode === 27 && gameState.gamePhase === GAME_PHASES.PLAYING) { // ESC
      this.pauseGame();
    } else if (keyCode === 82 && gameState.gamePhase !== GAME_PHASES.START) { // R
      this.restartGame();
    }
  }
  
  handlePlayingInput(keyCode, key) {
    // Space - toggle mode
    if (keyCode === 32) {
      gameState.currentMode = gameState.currentMode === MODES.SEARCH ? MODES.ANAGRAM : MODES.SEARCH;
      gameState.inputText = "";
      gameState.searchResults = [];
      gameState.selectedResultIndex = 0;
      return;
    }
    
    // Z - backspace
    if (keyCode === 90) {
      if (gameState.inputText.length > 0) {
        gameState.inputText = gameState.inputText.slice(0, -1);
        this.updateResults();
      }
      return;
    }
    
    // Arrow keys - navigate results
    if (keyCode === 38) { // UP
      if (gameState.searchResults.length > 0) {
        gameState.selectedResultIndex = Math.max(0, gameState.selectedResultIndex - 4);
      }
      return;
    }
    if (keyCode === 40) { // DOWN
      if (gameState.searchResults.length > 0) {
        gameState.selectedResultIndex = Math.min(
          gameState.searchResults.length - 1,
          gameState.selectedResultIndex + 4
        );
      }
      return;
    }
    if (keyCode === 37) { // LEFT
      if (gameState.searchResults.length > 0) {
        gameState.selectedResultIndex = Math.max(0, gameState.selectedResultIndex - 1);
      }
      return;
    }
    if (keyCode === 39) { // RIGHT
      if (gameState.searchResults.length > 0) {
        gameState.selectedResultIndex = Math.min(
          gameState.searchResults.length - 1,
          gameState.selectedResultIndex + 1
        );
      }
      return;
    }
    
    // Letter input (A-Z)
    if (keyCode >= 65 && keyCode <= 90) {
      const maxLength = gameState.currentMode === MODES.SEARCH ? 15 : 11;
      if (gameState.inputText.length < maxLength) {
        gameState.inputText += key.toUpperCase();
        this.updateResults();
      }
      return;
    }
    
    // Wildcard input
    if (key === '?' || key === '*') {
      const maxLength = gameState.currentMode === MODES.SEARCH ? 15 : 11;
      if (gameState.inputText.length < maxLength) {
        const wildcardCount = (gameState.inputText.match(/[?*]/g) || []).length;
        if (gameState.currentMode === MODES.ANAGRAM && wildcardCount >= 2) {
          return; // Max 2 wildcards in anagram mode
        }
        gameState.inputText += key;
        this.updateResults();
      }
    }
  }
  
  updateResults() {
    if (!gameState.inputText) {
      gameState.searchResults = [];
      gameState.selectedResultIndex = 0;
      return;
    }
    
    if (gameState.currentMode === MODES.SEARCH) {
      gameState.searchResults = this.dictionary.searchWords(gameState.inputText);
    } else {
      gameState.searchResults = this.dictionary.findAnagrams(gameState.inputText);
    }
    
    gameState.selectedResultIndex = 0;
    
    // Add score if we found new words
    if (gameState.searchResults.length > 0) {
      const selectedWord = gameState.searchResults[gameState.selectedResultIndex];
      if (selectedWord && !gameState.inputHistory.includes(selectedWord)) {
        const wordScore = this.dictionary.calculateScore(selectedWord);
        gameState.score += wordScore;
        gameState.totalWordsFound++;
        gameState.inputHistory.push(selectedWord);
        
        // Check win condition
        if (gameState.score >= gameState.targetScore) {
          this.winGame();
        }
      }
    }
  }
  
  startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.totalWordsFound = 0;
    gameState.inputText = "";
    gameState.searchResults = [];
    gameState.selectedResultIndex = 0;
    gameState.currentMode = MODES.SEARCH;
    gameState.inputHistory = [];
    
    this.p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  pauseGame() {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    this.p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  unpauseGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    this.p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  restartGame() {
    gameState.gamePhase = GAME_PHASES.START;
    this.p.logs.game_info.push({
      data: { phase: "START" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  winGame() {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    this.p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}