// input.js - Input handling and control modes
import { gameState, logInput, logGameInfo } from './globals.js';
import { initializeEntities } from './entities.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const keys = {};

export function setupInput() {
  // Keydown handler
  document.addEventListener('keydown', (event) => {
    // Prevent default for game keys
    if ([13, 27, 32, 37, 38, 39, 40, 65, 68, 82, 83, 87, 16].includes(event.keyCode)) {
      event.preventDefault();
    }
    
    logInput('keydown', event.key, event.keyCode);
    keys[event.keyCode] = true;
    
    handlePhaseControls(event.keyCode);
  });
  
  // Keyup handler
  document.addEventListener('keyup', (event) => {
    logInput('keyup', event.key, event.keyCode);
    keys[event.keyCode] = false;
  });
}

function handlePhaseControls(keyCode) {
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === "START") {
    gameState.gamePhase = "PLAYING";
    logGameInfo("PLAYING");
  }
  
  // ESC - Pause/Resume
  if (keyCode === 27) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      logGameInfo("PAUSED");
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      logGameInfo("PLAYING");
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      resetGame();
    }
  }
}

export function handleInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  const player = gameState.player;
  
  // Use control mode
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(player);
  } else if (gameState.controlMode.startsWith("TEST_")) {
    handleTestInput(player);
  }
}

function handleHumanInput(player) {
  // Forward movement (W or Up Arrow)
  if (keys[87] || keys[38]) {
    player.accelerate();
  }
  
  // Backward movement (S or Down Arrow)
  if (keys[83] || keys[40]) {
    player.brake();
  }
  
  // Turn left (A or Left Arrow)
  if (keys[65] || keys[37]) {
    player.turnLeft();
  }
  
  // Turn right (D or Right Arrow)
  if (keys[68] || keys[39]) {
    player.turnRight();
  }
  
  // Handbrake (Space)
  if (keys[32]) {
    player.handbrake();
  } else {
    player.isDrifting = false;
  }
  
  // Boost (Shift)
  if (keys[16]) {
    player.activateBoost();
  }
}

function handleTestInput(player) {
  const testMode = gameState.controlMode;
  
  if (testMode === "TEST_1") {
    // Test basic movement - figure 8 pattern
    const time = (Date.now() - gameState.testStartTime) / 1000;
    
    if (time < 15) {
      player.accelerate();
      
      // Alternate turning every 3 seconds
      const phase = Math.floor(time / 3) % 4;
      if (phase === 0 || phase === 2) {
        player.turnLeft();
      } else {
        player.turnRight();
      }
      
      // Test handbrake in turns
      if (time % 3 > 2) {
        player.handbrake();
      } else {
        player.isDrifting = false;
      }
    }
  } else if (testMode === "TEST_2") {
    // Test collection - drive toward nearest token
    player.accelerate();
    
    if (gameState.tokens.length > 0) {
      const nearestToken = gameState.tokens[0];
      const dx = nearestToken.mesh.position.x - player.mesh.position.x;
      const dz = nearestToken.mesh.position.z - player.mesh.position.z;
      const targetAngle = Math.atan2(dx, -dz);
      
      // Get current angle
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(player.mesh.quaternion);
      const currentAngle = Math.atan2(forward.x, forward.z);
      
      // Turn toward target
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (angleDiff > 0.1) {
        player.turnLeft();
      } else if (angleDiff < -0.1) {
        player.turnRight();
      }
    }
    
    // Activate boost if available
    if (gameState.boostsAvailable > 0 && !player.isBoosting) {
      player.activateBoost();
    }
  } else if (testMode === "TEST_3") {
    // Test checkpoint navigation
    player.accelerate();
    
    if (gameState.activeCheckpoint) {
      const checkpoint = gameState.activeCheckpoint;
      const dx = checkpoint.mesh.position.x - player.mesh.position.x;
      const dz = checkpoint.mesh.position.z - player.mesh.position.z;
      const targetAngle = Math.atan2(dx, -dz);
      
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(player.mesh.quaternion);
      const currentAngle = Math.atan2(forward.x, forward.z);
      
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (angleDiff > 0.1) {
        player.turnLeft();
      } else if (angleDiff < -0.1) {
        player.turnRight();
      }
    }
  } else if (testMode === "TEST_4") {
    // Test collision - drive into obstacles
    const time = (Date.now() - gameState.testStartTime) / 1000;
    
    if (time < 15) {
      player.accelerate();
      
      // Turn toward nearest obstacle
      if (gameState.obstacles.length > 0) {
        const nearestObstacle = gameState.obstacles[0];
        const obstaclePos = nearestObstacle.position || nearestObstacle.mesh.position;
        const dx = obstaclePos.x - player.mesh.position.x;
        const dz = obstaclePos.z - player.mesh.position.z;
        const targetAngle = Math.atan2(dx, -dz);
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(player.mesh.quaternion);
        const currentAngle = Math.atan2(forward.x, forward.z);
        
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (angleDiff > 0.1) {
          player.turnLeft();
        } else if (angleDiff < -0.1) {
          player.turnRight();
        }
      }
    }
  } else if (testMode === "TEST_5") {
    // Test camera - various maneuvers
    const time = (Date.now() - gameState.testStartTime) / 1000;
    
    player.accelerate();
    
    // Perform different maneuvers
    const phase = Math.floor(time / 5) % 4;
    if (phase === 0) {
      // Sharp left turn
      player.turnLeft();
    } else if (phase === 1) {
      // Sharp right turn
      player.turnRight();
    } else if (phase === 2) {
      // Drift
      player.handbrake();
      player.turnLeft();
    } else {
      // Straight with speed changes
      if (time % 2 < 1) {
        player.accelerate();
      } else {
        player.brake();
      }
    }
  } else if (testMode === "TEST_6") {
    // Test biome diversity - circular pattern
    player.accelerate();
    
    const time = (Date.now() - gameState.testStartTime) / 1000;
    const turnRate = 0.02;
    player.angularVelocity = turnRate;
  } else if (testMode === "TEST_7") {
    // Test win condition - optimal play
    player.accelerate();
    
    // Prioritize checkpoints, then tokens
    let target = null;
    
    if (gameState.activeCheckpoint) {
      target = gameState.activeCheckpoint.mesh.position;
    } else if (gameState.tokens.length > 0) {
      target = gameState.tokens[0].mesh.position;
    }
    
    if (target) {
      const dx = target.x - player.mesh.position.x;
      const dz = target.z - player.mesh.position.z;
      const targetAngle = Math.atan2(dx, -dz);
      
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(player.mesh.quaternion);
      const currentAngle = Math.atan2(forward.x, forward.z);
      
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (angleDiff > 0.1) {
        player.turnLeft();
      } else if (angleDiff < -0.1) {
        player.turnRight();
      }
    }
    
    // Use boost strategically
    if (gameState.boostsAvailable > 0 && !player.isBoosting) {
      player.activateBoost();
    }
  }
}

function resetGame() {
  // Clear entities
  gameState.tokens.forEach(token => {
    gameState.scene.remove(token.mesh);
    gameState.scene.remove(token.glow);
  });
  gameState.tokens = [];
  
  gameState.checkpoints.forEach(checkpoint => {
    gameState.scene.remove(checkpoint.mesh);
  });
  gameState.checkpoints = [];
  gameState.activeCheckpoint = null;
  gameState.checkpointIndex = 0;
  
  // Reset player
  if (gameState.player) {
    gameState.player.mesh.position.set(0, 0.2, 0);
    gameState.player.mesh.rotation.set(0, 0, 0);
    gameState.player.velocity.set(0, 0, 0);
    gameState.player.angularVelocity = 0;
    gameState.player.currentSpeed = 0;
    gameState.player.isBoosting = false;
    gameState.player.boostTimer = 0;
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.tokensCollected = 0;
  gameState.checkpointsCompleted = 0;
  gameState.boostsAvailable = 0;
  gameState.gamePhase = "START";
  
  // Reinitialize entities
  initializeEntities();
  
  logGameInfo("START", { reset: true });
}

// Expose control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testStartTime = Date.now();
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  logGameInfo("CONTROL_MODE_CHANGE", { mode });
};