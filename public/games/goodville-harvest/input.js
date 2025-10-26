import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';

export class InputManager {
  constructor(p) {
    this.p = p;
    this.keys = {};
  }

  handleKeyPressed(key, keyCode) {
    this.keys[keyCode] = true;
    
    gameState.entities.forEach(e => {
      if (e.player) {
        e.player.logs = this.p.logs;
      }
    });
    
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) return;
    
    if (keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        this.p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        this.p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        this.p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        this.resetGame();
      }
    } else if (keyCode === 90 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.showPopup = false;
      gameState.popupType = null;
      gameState.popupData = null;
    }
  }

  handleKeyReleased(key, keyCode) {
    this.keys[keyCode] = false;
    
    this.p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  isKeyDown(keyCode) {
    return this.keys[keyCode] || false;
  }

  resetGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.coins = 100;
    gameState.xp = 0;
    gameState.level = 1;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    gameState.farmPlots = [];
    gameState.animals = [];
    gameState.workshops = [];
    gameState.inventory = {};
    gameState.orders = [];
    gameState.currentQuest = null;
    gameState.questProgress = {};
    gameState.selectedPlot = null;
    gameState.selectedAnimal = null;
    gameState.selectedWorkshop = null;
    gameState.showPopup = false;
    gameState.popupType = null;
    gameState.popupData = null;
    gameState.gameTime = 0;
    gameState.consecutiveOrders = 0;
    gameState.failedOrders = 0;
    gameState.actionCount = 0;
    gameState.lastEarningAction = 0;
    gameState.harvestStreak = 0;
    gameState.streakStartTime = 0;
    gameState.entities = [];
    
    this.p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "reset" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
}