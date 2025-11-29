import { gameState, GAME_PHASES } from './globals.js';

export function applyTestingControls(p) {
  if (gameState.controlMode === "HUMAN" || gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  if (!gameState.player) return;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic movement test
    if (p.frameCount % 120 < 60) {
      simulateKey(p, 39); // Right
    }
    if (p.frameCount % 180 === 0) {
      simulateKey(p, 32); // Jump
    }
    if (p.frameCount % 60 === 0) {
      gameState.player.shoot();
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win test - aggressive boss fight
    simulateKey(p, 39); // Always move right
    
    if (gameState.boss && !gameState.boss.defeated) {
      // Shoot constantly
      if (p.frameCount % 5 === 0) {
        gameState.player.shoot();
      }
      
      // Dodge patterns
      if (gameState.boss.attackTimer < 30 && gameState.boss.attackTimer > 0) {
        if (p.frameCount % 2 === 0) {
          simulateKey(p, 32); // Jump to dodge
        }
      }
      
      // Cycle weapons strategically
      if (p.frameCount % 180 === 0) {
        gameState.player.cycleWeapon();
      }
    }
    
    // Use booster when available
    if (gameState.player.hasBooster && gameState.player.boosterFuel > 50) {
      simulateKey(p, 38);
    }
  }
}

function simulateKey(p, keyCode) {
  // Simulate key press for testing
  p.keyIsDown = (function(original) {
    return function(code) {
      if (code === keyCode) return true;
      return original.call(this, code);
    };
  })(p.keyIsDown);
}

export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => button.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
}