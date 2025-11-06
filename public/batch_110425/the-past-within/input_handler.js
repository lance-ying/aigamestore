// input_handler.js
import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  KEY_ENTER,
  KEY_ESC,
  KEY_SPACE,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_SHIFT,
  KEY_Z,
  KEY_R,
  TIMELINE_PAST,
  TIMELINE_FUTURE,
  MODE_HUMAN
} from './globals.js';

export class InputHandler {
  constructor(p, puzzleManager) {
    this.p = p;
    this.puzzleManager = puzzleManager;
    this.messageQueue = [];
    this.messageTimer = 0;
  }

  handleKeyPressed(keyCode, key) {
    const p = this.p;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transitions
    if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      this.startGame();
      return;
    }
    
    if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
      this.pauseGame();
      return;
    }
    
    if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
      this.unpauseGame();
      return;
    }
    
    if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_PAUSED)) {
      this.restartGame();
      return;
    }
    
    // Gameplay inputs
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === MODE_HUMAN) {
      this.handleGameplayInput(keyCode);
    }
  }

  handleGameplayInput(keyCode) {
    const objects = this.puzzleManager.getCurrentObjects(gameState.currentTimeline);
    
    if (keyCode === KEY_LEFT) {
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex - 1 + objects.length) % objects.length;
      gameState.framesSinceLastAction = 0;
    } else if (keyCode === KEY_RIGHT) {
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex + 1) % objects.length;
      gameState.framesSinceLastAction = 0;
    } else if (keyCode === KEY_SPACE) {
      this.interactWithSelectedObject();
    } else if (keyCode === KEY_Z) {
      this.useItemOnSelectedObject();
    } else if (keyCode === KEY_SHIFT) {
      this.switchTimeline();
    }
  }

  interactWithSelectedObject() {
    const objects = this.puzzleManager.getCurrentObjects(gameState.currentTimeline);
    const obj = objects[gameState.selectedObjectIndex];
    
    if (!obj) return;
    
    gameState.framesSinceLastAction = 0;
    
    // First examine if not examined
    if (!obj.examined) {
      const clue = this.puzzleManager.examineObject(obj, gameState.currentTimeline);
      if (clue) {
        this.showMessage(clue);
      }
      return;
    }
    
    // Try to collect
    if (this.puzzleManager.canCollect(obj) && !obj.collected) {
      const success = this.puzzleManager.collectItem(obj, gameState.currentTimeline);
      if (success) {
        this.showMessage(`Collected ${obj.name}`);
      }
      return;
    }
    
    // Try to interact
    const result = this.puzzleManager.interactWithObject(obj, gameState.currentTimeline);
    if (result.success) {
      this.showMessage(result.message);
      this.checkProgress();
    } else if (result.message !== "Nothing to interact with") {
      this.showMessage(result.message);
    }
  }

  useItemOnSelectedObject() {
    if (gameState.inventory.length === 0) {
      this.showMessage("No items to use");
      return;
    }
    
    const objects = this.puzzleManager.getCurrentObjects(gameState.currentTimeline);
    const targetObj = objects[gameState.selectedObjectIndex];
    const item = gameState.inventory[0]; // Use first item
    
    const result = this.puzzleManager.useItem(item.id, targetObj, gameState.currentTimeline);
    if (result.success) {
      this.showMessage(result.message);
      // Remove used item if it's a key
      if (item.id === "key") {
        gameState.inventory.shift();
      }
      this.checkProgress();
    } else {
      this.showMessage(result.message);
    }
    
    gameState.framesSinceLastAction = 0;
  }

  switchTimeline() {
    gameState.currentTimeline = gameState.currentTimeline === TIMELINE_PAST ? TIMELINE_FUTURE : TIMELINE_PAST;
    gameState.selectedObjectIndex = 0;
    gameState.framesSinceLastAction = 0;
    this.showMessage(`Switched to ${gameState.currentTimeline}`);
  }

  checkProgress() {
    if (this.puzzleManager.checkChapterComplete()) {
      const gameComplete = this.puzzleManager.advanceChapter();
      
      if (gameComplete) {
        this.winGame();
      } else {
        this.showMessage(`Chapter ${gameState.currentChapter - 1} Complete! Starting Chapter ${gameState.currentChapter}`);
        gameState.score += 100;
      }
    }
  }

  startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    this.p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    this.p.loop();
  }

  pauseGame() {
    gameState.gamePhase = PHASE_PAUSED;
    this.p.logs.game_info.push({
      data: { gamePhase: PHASE_PAUSED },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  unpauseGame() {
    gameState.gamePhase = PHASE_PLAYING;
    this.p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  restartGame() {
    // Reset game state
    gameState.gamePhase = PHASE_START;
    gameState.currentTimeline = TIMELINE_PAST;
    gameState.currentChapter = 1;
    gameState.selectedObjectIndex = 0;
    gameState.inventory = [];
    gameState.chaptersCompleted = 0;
    gameState.score = 0;
    gameState.framesSinceLastAction = 0;
    
    // Reinitialize puzzles
    this.puzzleManager.initializeChapter(1);
    
    this.p.logs.game_info.push({
      data: { gamePhase: PHASE_START },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  winGame() {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.score += 200;
    this.p.logs.game_info.push({
      data: { gamePhase: PHASE_GAME_OVER_WIN, score: gameState.score },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  showMessage(msg) {
    this.messageQueue.push(msg);
    this.messageTimer = 120; // Show for 2 seconds
  }

  update() {
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer === 0 && this.messageQueue.length > 0) {
        this.messageQueue.shift();
        if (this.messageQueue.length > 0) {
          this.messageTimer = 120;
        }
      }
    }
  }

  renderMessages() {
    if (this.messageQueue.length > 0 && this.messageTimer > 0) {
      const p = this.p;
      const msg = this.messageQueue[0];
      
      p.push();
      p.fill(0, 0, 0, 180);
      p.rect(50, 80, 500, 40, 10);
      
      p.fill(255, 255, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(msg, 300, 100);
      p.pop();
    }
  }
}