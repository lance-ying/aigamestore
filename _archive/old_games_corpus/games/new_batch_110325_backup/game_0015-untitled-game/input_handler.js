// input_handler.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {};
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
    
    // Game phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        this.startGame();
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        this.restartGame();
      }
      return;
    }
    
    // Store key state
    this.keys[keyCode] = true;
  }
  
  handleKeyReleased(keyCode, key) {
    const p = this.p;
    
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    this.keys[keyCode] = false;
  }
  
  isKeyPressed(keyCode) {
    return this.keys[keyCode] === true;
  }
  
  startGame() {
    const p = this.p;
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.storyProgress = 0;
    gameState.currentLocation = "headquarters";
    gameState.unlockedLocations = ["headquarters"];
    gameState.inventory = [];
    gameState.cluesCollected = [];
    gameState.solvedPuzzles = [];
    gameState.selectedHotspot = 0;
    gameState.inventoryOpen = false;
    gameState.selectedInventoryItem = null;
    gameState.currentDialogue = null;
    gameState.dialogueIndex = 0;
    gameState.npcStates = {};
    gameState.mysteryCluesFound = 0;
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", action: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  restartGame() {
    const p = this.p;
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { phase: "START", action: "game_restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}