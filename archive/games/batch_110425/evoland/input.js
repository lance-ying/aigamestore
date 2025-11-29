// input.js - Input handling
import { gameState } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {};
  }
  
  handleKeyPressed(key, keyCode) {
    this.keys[keyCode] = true;
    
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        this.p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        this.p.noLoop();
        this.p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        this.p.loop();
        this.p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: this.p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        this.restart();
      }
    }
    
    // Gameplay inputs (only in PLAYING phase)
    if (gameState.gamePhase === "PLAYING") {
      if (keyCode === 32) { // SPACE
        if (gameState.player) {
          gameState.player.attack();
        }
      } else if (keyCode === 90) { // Z
        if (gameState.player) {
          gameState.player.dodge();
        }
      }
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
  
  restart() {
    // Reset to start screen
    gameState.gamePhase = "START";
    this.p.loop();
    
    this.p.logs.game_info.push({
      data: { gamePhase: "START", action: "restart" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }
  
  getPlayerInput() {
    if (gameState.controlMode !== "HUMAN") {
      return this.getAutomatedInput();
    }
    
    return {
      up: this.isKeyDown(38),
      down: this.isKeyDown(40),
      left: this.isKeyDown(37),
      right: this.isKeyDown(39),
      attack: this.isKeyDown(32),
      dodge: this.isKeyDown(90)
    };
  }
  
  getAutomatedInput() {
    try {
      const action = window.get_automated_testing_action(gameState);
      
      return {
        up: action.up || false,
        down: action.down || false,
        left: action.left || false,
        right: action.right || false,
        attack: action.attack || false,
        dodge: action.dodge || false
      };
    } catch (e) {
      console.error("Automated testing error:", e);
      return {
        up: false,
        down: false,
        left: false,
        right: false,
        attack: false,
        dodge: false
      };
    }
  }
}