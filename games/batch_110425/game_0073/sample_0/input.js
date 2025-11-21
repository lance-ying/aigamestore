// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function createInputHandler(p) {
  const inputs = {
    left: false,
    right: false,
    up: false,
    down: false,
    attack: false,
    interact: false,
    sprint: false
  };

  return {
    inputs,
    
    handleKeyPressed(keyCode, key) {
      // Log input
      p.logs.inputs.push({
        input_type: "keyPressed",
        data: { key, keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });

      // Phase transitions
      if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === PHASE_START) {
          gameState.gamePhase = PHASE_PLAYING;
          p.logs.game_info.push({
            data: { phase: PHASE_PLAYING },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (keyCode === 27) { // ESC
        if (gameState.gamePhase === PHASE_PLAYING) {
          gameState.gamePhase = PHASE_PAUSED;
          p.logs.game_info.push({
            data: { phase: PHASE_PAUSED },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else if (gameState.gamePhase === PHASE_PAUSED) {
          gameState.gamePhase = PHASE_PLAYING;
          p.logs.game_info.push({
            data: { phase: PHASE_PLAYING },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (keyCode === 82) { // R
        if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
          window.location.reload();
        }
      }

      // Gameplay inputs
      if (gameState.gamePhase !== PHASE_PLAYING) return;

      if (keyCode === 37) inputs.left = true;
      if (keyCode === 39) inputs.right = true;
      if (keyCode === 38) inputs.up = true;
      if (keyCode === 40) inputs.down = true;
      if (keyCode === 32) inputs.attack = true; // SPACE
      if (keyCode === 90) inputs.interact = true; // Z
      if (keyCode === 16) inputs.sprint = true; // SHIFT
    },

    handleKeyReleased(keyCode, key) {
      p.logs.inputs.push({
        input_type: "keyReleased",
        data: { key, keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });

      if (keyCode === 37) inputs.left = false;
      if (keyCode === 39) inputs.right = false;
      if (keyCode === 38) inputs.up = false;
      if (keyCode === 40) inputs.down = false;
      if (keyCode === 32) inputs.attack = false;
      if (keyCode === 90) inputs.interact = false;
      if (keyCode === 16) inputs.sprint = false;
    },

    processAutomatedInput(action) {
      // Reset all inputs
      inputs.left = false;
      inputs.right = false;
      inputs.up = false;
      inputs.down = false;
      inputs.attack = false;
      inputs.interact = false;
      inputs.sprint = false;

      if (!action) return;

      // Set inputs based on action
      if (action.includes("LEFT")) inputs.left = true;
      if (action.includes("RIGHT")) inputs.right = true;
      if (action.includes("UP")) inputs.up = true;
      if (action.includes("DOWN")) inputs.down = true;
      if (action.includes("ATTACK")) inputs.attack = true;
      if (action.includes("INTERACT")) inputs.interact = true;
      if (action.includes("SPRINT")) inputs.sprint = true;
    }
  };
}