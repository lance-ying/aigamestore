// ai.js
import { gameState, CONTROL_MODES, POWER_UPS } from './globals.js';
import { Body } from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';

export function updateAI(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) return;
  if (gameState.ballInMotion) return;
  if (gameState.gamePhase !== "PLAYING") return;
  
  const currentTime = Date.now();
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      testBasicGameplay(p, currentTime);
      break;
    case CONTROL_MODES.TEST_2:
      testPowerUpsAndProgression(p, currentTime);
      break;
    case CONTROL_MODES.TEST_3:
      testObstacleInteractions(p, currentTime);
      break;
    case CONTROL_MODES.TEST_4:
      testEdgeCases(p, currentTime);
      break;
    case CONTROL_MODES.TEST_5:
      testStateTransitions(p, currentTime);
      break;
  }
}

function testBasicGameplay(p, currentTime) {
  if (currentTime - gameState.testState.lastShotTime < 2000) return;
  
  if (!gameState.ball || !gameState.holePosition) return;
  
  // Aim toward hole with slight randomness
  const dx = gameState.holePosition.x - gameState.ball.body.position.x;
  const dy = gameState.holePosition.y - gameState.ball.body.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  let targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  targetAngle += (p.random() - 0.5) * 10; // Add some variation
  
  let targetPower = Math.min(80, distance / 3);
  
  gameState.shotAngle = targetAngle;
  gameState.shotPower = targetPower;
  
  gameState.ball.shoot(targetAngle, targetPower);
  if (gameState.player) {
    gameState.player.startSwing();
  }
  
  gameState.testState.lastShotTime = currentTime;
  gameState.testState.shotCount++;
  
  if (gameState.testState.shotCount >= 10) {
    // Force win if taking too long
    Body.setPosition(gameState.ball.body, {
      x: gameState.holePosition.x,
      y: gameState.holePosition.y
    });
    Body.setVelocity(gameState.ball.body, { x: 0, y: 0 });
  }
}

function testPowerUpsAndProgression(p, currentTime) {
  if (currentTime - gameState.testState.lastShotTime < 1800) return;
  
  if (!gameState.ball || !gameState.holePosition) return;
  
  const dx = gameState.holePosition.x - gameState.ball.body.position.x;
  const dy = gameState.holePosition.y - gameState.ball.body.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  let targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  let targetPower = Math.min(85, distance / 2.5);
  
  // Use power-ups strategically
  if (gameState.testState.shotCount === 1 && gameState.powerUps.boost > 0) {
    gameState.activePowerUp = POWER_UPS.BOOST;
  } else if (gameState.testState.shotCount === 2 && gameState.powerUps.sticky > 0) {
    gameState.activePowerUp = POWER_UPS.STICKY;
  }
  
  gameState.shotAngle = targetAngle;
  gameState.shotPower = targetPower;
  
  gameState.ball.shoot(targetAngle, targetPower);
  if (gameState.player) {
    gameState.player.startSwing();
  }
  
  gameState.testState.lastShotTime = currentTime;
  gameState.testState.shotCount++;
  
  if (gameState.testState.shotCount >= 5) {
    // Force win to test progression
    Body.setPosition(gameState.ball.body, {
      x: gameState.holePosition.x,
      y: gameState.holePosition.y
    });
    Body.setVelocity(gameState.ball.body, { x: 0, y: 0 });
  }
}

function testObstacleInteractions(p, currentTime) {
  if (currentTime - gameState.testState.lastShotTime < 2500) return;
  
  if (!gameState.ball) return;
  
  // Test different obstacle interactions in sequence
  const testSequence = [
    { angle: -30, power: 60 },  // Hit platform
    { angle: -45, power: 70 },  // Bounce off wall
    { angle: 0, power: 50 }     // Trigger hazard
  ];
  
  const phase = gameState.testState.shotCount % testSequence.length;
  const shot = testSequence[phase];
  
  gameState.shotAngle = shot.angle;
  gameState.shotPower = shot.power;
  
  gameState.ball.shoot(shot.angle, shot.power);
  if (gameState.player) {
    gameState.player.startSwing();
  }
  
  gameState.testState.lastShotTime = currentTime;
  gameState.testState.shotCount++;
}

function testEdgeCases(p, currentTime) {
  if (currentTime - gameState.testState.lastShotTime < 1500) return;
  
  if (!gameState.ball) return;
  
  // Test extreme values
  const testSequence = [
    { angle: 0, power: 100 },      // Max power, 0 degrees
    { angle: 180, power: 100 },    // Max power, 180 degrees
    { angle: -90, power: 10 },     // Min power, straight up
    { angle: 90, power: 10 },      // Min power, straight down
    { angle: -45, power: 50 }      // Normal shot to finish
  ];
  
  const phase = gameState.testState.shotCount % testSequence.length;
  const shot = testSequence[phase];
  
  gameState.shotAngle = shot.angle;
  gameState.shotPower = shot.power;
  
  gameState.ball.shoot(shot.angle, shot.power);
  if (gameState.player) {
    gameState.player.startSwing();
  }
  
  gameState.testState.lastShotTime = currentTime;
  gameState.testState.shotCount++;
}

function testStateTransitions(p, currentTime) {
  // Test pausing and unpausing
  if (gameState.testState.testPhase === 0) {
    if (currentTime - gameState.testState.lastShotTime > 1000) {
      gameState.gamePhase = "PAUSED";
      gameState.testState.testPhase = 1;
      gameState.testState.lastShotTime = currentTime;
    }
  } else if (gameState.testState.testPhase === 1) {
    if (currentTime - gameState.testState.lastShotTime > 1000) {
      gameState.gamePhase = "PLAYING";
      gameState.testState.testPhase = 2;
      gameState.testState.lastShotTime = currentTime;
    }
  } else if (gameState.testState.testPhase === 2) {
    if (currentTime - gameState.testState.lastShotTime > 1000 && !gameState.ballInMotion) {
      // Take a shot then complete course
      if (!gameState.ball || !gameState.holePosition) return;
      
      const dx = gameState.holePosition.x - gameState.ball.body.position.x;
      const dy = gameState.holePosition.y - gameState.ball.body.position.y;
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const targetPower = Math.min(80, distance / 2.5);
      
      gameState.ball.shoot(targetAngle, targetPower);
      if (gameState.player) {
        gameState.player.startSwing();
      }
      
      gameState.testState.testPhase = 3;
      gameState.testState.lastShotTime = currentTime;
    }
  } else if (gameState.testState.testPhase === 3) {
    if (currentTime - gameState.testState.lastShotTime > 2000 && !gameState.ballInMotion) {
      // Force win to test game over state
      Body.setPosition(gameState.ball.body, {
        x: gameState.holePosition.x,
        y: gameState.holePosition.y
      });
      Body.setVelocity(gameState.ball.body, { x: 0, y: 0 });
      gameState.testState.testPhase = 4;
    }
  }
}