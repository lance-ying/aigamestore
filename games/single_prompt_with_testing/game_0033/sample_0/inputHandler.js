// inputHandler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export class InputHandler {
  constructor() {
    this.keys = {};
    this.lastInteractionFrame = 0;
    this.interactionCooldown = 15;
  }

  handleKeyPressed(key, keyCode, p) {
    this.keys[keyCode] = true;

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
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        this.restart(p);
      }
    }

    // Gameplay keys (only during PLAYING phase)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 90) { // Z - Toggle notebook
        gameState.notebookOpen = !gameState.notebookOpen;
      }

      if (keyCode === 32) { // SPACE - Interact
        if (p.frameCount - this.lastInteractionFrame > this.interactionCooldown) {
          this.handleInteraction(p);
          this.lastInteractionFrame = p.frameCount;
        }
      }
    }
  }

  handleKeyReleased(keyCode, p) {
    this.keys[keyCode] = false;

    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  handleInteraction(p) {
    if (!gameState.player) return;

    // Clear previous prompt
    gameState.interactionPrompt = null;

    // Check NPC interactions
    gameState.npcs.forEach(npc => {
      const dist = p.dist(npc.x, npc.y, gameState.player.x, gameState.player.y);
      if (dist < 40) {
        npc.interact(p);
      }
    });

    // Check glyph object interactions
    gameState.glyphObjects.forEach(obj => {
      const dist = p.dist(obj.x, obj.y, gameState.player.x, gameState.player.y);
      if (dist < 30) {
        obj.interact();
      }
    });
  }

  restart(p) {
    // Reset game state (preserve control mode)
    const currentMode = gameState.controlMode;
    
    gameState.player = null;
    gameState.entities = [];
    gameState.npcs = [];
    gameState.glyphObjects = [];
    gameState.collectedGlyphs = [];
    gameState.translatedGlyphs = [];
    gameState.score = 0;
    gameState.currentFloor = 0;
    gameState.gamePhase = GAME_PHASES.START;
    gameState.notebookOpen = false;
    gameState.selectedGlyph = null;
    gameState.selectedMeaning = null;
    gameState.floors = [];
    gameState.cameraOffsetY = 0;
    gameState.interactionPrompt = null;
    gameState.peopleUnited = 0;
    gameState.controlMode = currentMode;

    this.keys = {};
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  applyAutomatedAction(action) {
    // Clear all keys first
    Object.keys(this.keys).forEach(k => this.keys[k] = false);

    // Apply action keys
    if (action.left) this.keys[37] = true;
    if (action.right) this.keys[39] = true;
    if (action.up) this.keys[38] = true;
    if (action.down) this.keys[40] = true;
    if (action.space) this.keys[32] = true;
    if (action.z) this.keys[90] = true;
    if (action.shift) this.keys[16] = true;
  }
}