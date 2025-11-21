// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor(p, sceneManager, puzzleManager, dialogueManager) {
    this.p = p;
    this.sceneManager = sceneManager;
    this.puzzleManager = puzzleManager;
    this.dialogueManager = dialogueManager;
  }
  
  handleKeyPressed(key, keyCode) {
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transitions (always handled)
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        this.startGame();
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        this.restartGame();
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        this.p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        this.p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay inputs
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      this.handleGameplayInput(key, keyCode);
    }
  }
  
  handleGameplayInput(key, keyCode) {
    // Puzzle mode
    if (gameState.inPuzzle) {
      if (keyCode === 32) { // SPACE - submit answer
        const correct = this.puzzleManager.submitAnswer();
        if (correct) {
          gameState.score += 100;
        }
      } else if (keyCode === 90) { // Z - use hint
        this.puzzleManager.useHint();
      } else if (keyCode === 8) { // Backspace
        this.puzzleManager.handleTyping("Backspace");
      } else if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
        this.puzzleManager.handleTyping(key);
      }
      return;
    }
    
    // Dialogue mode
    if (gameState.inDialogue) {
      if (keyCode === 32) { // SPACE
        this.dialogueManager.nextDialogue();
      }
      return;
    }
    
    // Normal exploration mode
    if (keyCode === 32) { // SPACE - interact
      const hotspot = this.sceneManager.getHoveredHotspot();
      if (hotspot) {
        this.interact(hotspot);
      }
    }
  }
  
  interact(hotspot) {
    switch(hotspot.type) {
      case "puzzle":
        if (!gameState.solvedPuzzles.has(hotspot.id)) {
          this.puzzleManager.startPuzzle(hotspot.id);
        }
        break;
        
      case "npc":
        this.dialogueManager.startDialogue(hotspot.id);
        break;
        
      case "hint_coin":
        if (!hotspot.collected) {
          hotspot.collected = true;
          gameState.hintCoins++;
          gameState.collectedItems.push(hotspot.id);
          gameState.score += 10;
        }
        break;
    }
  }
  
  updateCursorMovement() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    if (gameState.inPuzzle || gameState.inDialogue) return;
    
    const speed = 5;
    
    if (this.p.keyIsDown(37)) { // LEFT
      gameState.cursorX -= speed;
    }
    if (this.p.keyIsDown(39)) { // RIGHT
      gameState.cursorX += speed;
    }
    if (this.p.keyIsDown(38)) { // UP
      gameState.cursorY -= speed;
    }
    if (this.p.keyIsDown(40)) { // DOWN
      gameState.cursorY += speed;
    }
    
    // Clamp
    gameState.cursorX = this.p.constrain(gameState.cursorX, 20, 580);
    gameState.cursorY = this.p.constrain(gameState.cursorY, 20, 380);
  }
  
  checkNavigation() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    if (gameState.inPuzzle || gameState.inDialogue) return;
    
    // Check if cursor is near edges for navigation
    const edgeThreshold = 40;
    
    if (gameState.cursorY < edgeThreshold && this.p.keyIsDown(38)) {
      this.sceneManager.navigate("up");
    } else if (gameState.cursorY > 400 - edgeThreshold && this.p.keyIsDown(40)) {
      this.sceneManager.navigate("down");
    } else if (gameState.cursorX < edgeThreshold && this.p.keyIsDown(37)) {
      this.sceneManager.navigate("left");
    } else if (gameState.cursorX > 600 - edgeThreshold && this.p.keyIsDown(39)) {
      this.sceneManager.navigate("right");
    }
  }
  
  startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.hintCoins = 0;
    gameState.solvedPuzzles = new Set();
    gameState.collectedItems = [];
    gameState.storyFlags = new Set();
    gameState.trinkets = [];
    gameState.furniture = [];
    gameState.currentLocation = "village_square";
    gameState.unlockedLocations = new Set(["village_square"]);
    gameState.cursorX = 300;
    gameState.cursorY = 200;
    
    this.sceneManager.loadLocation("village_square");
    
    this.p.logs.game_info.push({
      data: { phase: "PLAYING", action: "game_started" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  restartGame() {
    gameState.gamePhase = GAME_PHASES.START;
    
    this.p.logs.game_info.push({
      data: { phase: "START", action: "game_restarted" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}