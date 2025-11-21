// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { handleCardBattleInput } from './card_battle.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    // ENTER - Start game
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === 27) {
    // ESC - Pause/Unpause
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) {
    // R - Restart
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.cardBattleActive) {
      handleCardBattleInput(p, keyCode);
    } else {
      if (keyCode === 32) {
        // SPACE - context action
        gameState.player.shoot(p);
        checkInteractions(p);
      } else if (keyCode === 90) {
        // Z - dash
        gameState.player.dash(p);
      }
    }
  }
}

function checkInteractions(p) {
  const player = gameState.player;
  if (!player) return;
  
  for (let npc of gameState.npcs) {
    if (p.dist(player.x, player.y, npc.x, npc.y) < 40) {
      npc.interact(p);
    }
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  try {
    const action = window.get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      handleKeyPressed(p, action.keyCode);
    }
  } catch (error) {
    console.error("Error in automated testing:", error);
  }
}