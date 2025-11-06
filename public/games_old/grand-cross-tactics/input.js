// input.js - Input handling
import { gameState, GAME_PHASES, TURN_PHASES } from './globals.js';
import { playCard, endPlayerTurn, advanceLevel, restartGame, initLevel } from './gameLogic.js';

export function handleKeyPressed(p) {
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // ENTER key (13) - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.currentLevel = 1;
      initLevel(p, 1);
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING, level: 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.currentTurnPhase === TURN_PHASES.LEVEL_CLEARED) {
      advanceLevel(p);
    }
  }

  // ESC key (27) - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // R key (82) - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.currentTurnPhase === TURN_PHASES.PLAYER) {
    // Arrow keys for card selection
    if (p.keyCode === 37) { // LEFT
      if (gameState.hand.length > 0) {
        gameState.selectedCardIndex = (gameState.selectedCardIndex - 1 + gameState.hand.length) % gameState.hand.length;
      }
    } else if (p.keyCode === 39) { // RIGHT
      if (gameState.hand.length > 0) {
        gameState.selectedCardIndex = (gameState.selectedCardIndex + 1) % gameState.hand.length;
      }
    }

    // SPACE (32) - Play card
    if (p.keyCode === 32) {
      playCard(p, gameState.selectedCardIndex);
    }

    // SHIFT (16) - End turn
    if (p.keyCode === 16) {
      endPlayerTurn(p);
    }
  }
}

export function setupControlMode() {
  window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    
    // Update button states
    const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.remove('active');
      }
    });
    
    const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  };
}

export function handleTestMode(p) {
  if (gameState.controlMode === 'HUMAN') return;

  // TEST_1: Basic testing - play random cards
  if (gameState.controlMode === 'TEST_1') {
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (p.frameCount % 60 === 0) {
        p.keyCode = 13;
        handleKeyPressed(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.currentTurnPhase === TURN_PHASES.PLAYER) {
        if (p.frameCount % 30 === 0 && gameState.hand.length > 0) {
          const canPlay = gameState.hand.some((card, i) => 
            card.cost <= gameState.player.currentAP && i === gameState.selectedCardIndex
          );
          
          if (canPlay) {
            playCard(p, gameState.selectedCardIndex);
          } else {
            endPlayerTurn(p);
          }
        }
      }
    } else if (gameState.currentTurnPhase === TURN_PHASES.LEVEL_CLEARED) {
      if (p.frameCount % 60 === 0) {
        advanceLevel(p);
      }
    }
  }

  // TEST_2: Win condition test - play optimally
  if (gameState.controlMode === 'TEST_2') {
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (p.frameCount % 60 === 0) {
        p.keyCode = 13;
        handleKeyPressed(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.currentTurnPhase === TURN_PHASES.PLAYER) {
        if (p.frameCount % 20 === 0) {
          // Find best card to play
          let bestCardIndex = -1;
          let bestPriority = -1;

          for (let i = 0; i < gameState.hand.length; i++) {
            const card = gameState.hand[i];
            if (card.cost <= gameState.player.currentAP) {
              let priority = 0;
              
              // Prioritize healing if low HP
              if (card.effect === 'HEAL' && gameState.player.currentHP < gameState.player.maxHP * 0.5) {
                priority = 100;
              }
              // Prioritize damage
              else if (card.effect === 'DAMAGE' || card.effect === 'AOE_DAMAGE') {
                priority = 50;
              }
              // Then buffs
              else if (card.effect === 'BUFF_DAMAGE') {
                priority = 30;
              }
              // Then guard
              else if (card.effect === 'BLOCK') {
                priority = 20;
              }

              if (priority > bestPriority) {
                bestPriority = priority;
                bestCardIndex = i;
              }
            }
          }

          if (bestCardIndex >= 0) {
            gameState.selectedCardIndex = bestCardIndex;
            playCard(p, bestCardIndex);
          } else {
            endPlayerTurn(p);
          }
        }
      }
    } else if (gameState.currentTurnPhase === TURN_PHASES.LEVEL_CLEARED) {
      if (p.frameCount % 60 === 0) {
        advanceLevel(p);
      }
    }
  }
}