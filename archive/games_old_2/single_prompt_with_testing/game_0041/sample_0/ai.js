// ai.js - Automated testing AI controllers
import { gameState, CONFIG, CONTROL_MODES } from './globals.js';
import { Body } from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';

export function updateAI(p) {
  if (!gameState.player || gameState.gamePhase !== "PLAYING") return;

  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      testBasicMechanics(p);
      break;
    case CONTROL_MODES.TEST_2:
      testWinCondition(p);
      break;
    case CONTROL_MODES.TEST_3:
      testLoseCondition(p);
      break;
    case CONTROL_MODES.TEST_4:
      testPowerUps(p);
      break;
    case CONTROL_MODES.TEST_5:
      testForcePod(p);
      break;
    case CONTROL_MODES.TEST_6:
      testBoss(p);
      break;
    case CONTROL_MODES.TEST_7:
      testDifficultyProgression(p);
      break;
  }
}

function testBasicMechanics(p) {
  const player = gameState.player;
  const time = p.frameCount;

  // Move in a pattern
  if (time % 120 < 30) {
    Body.setVelocity(player.body, { x: 0, y: -CONFIG.PLAYER_SPEED });
  } else if (time % 120 < 60) {
    Body.setVelocity(player.body, { x: 0, y: CONFIG.PLAYER_SPEED });
  } else if (time % 120 < 90) {
    Body.setVelocity(player.body, { x: CONFIG.PLAYER_SPEED, y: 0 });
  } else {
    Body.setVelocity(player.body, { x: -CONFIG.PLAYER_SPEED, y: 0 });
  }

  // Shoot continuously
  player.shoot();

  // Test force pod
  if (time % 180 === 0) {
    if (gameState.forcePod.attached) {
      gameState.forcePod.detach();
    } else {
      gameState.forcePod.attach('front');
    }
  }

  if (time % 200 === 100 && !gameState.forcePod.attached) {
    gameState.forcePod.launch();
  }

  // Test charged shot
  if (time % 150 === 0) {
    gameState.chargeTime = CONFIG.CHARGE_TIME;
    player.shootChargedBeam();
  }
}

function testWinCondition(p) {
  const player = gameState.player;
  
  // Aggressive dodging and shooting
  if (gameState.enemies.length > 0) {
    const closestEnemy = gameState.enemies[0];
    const dy = closestEnemy.body.position.y - player.body.position.y;
    
    // Dodge vertically
    if (Math.abs(dy) > 50) {
      const targetY = closestEnemy.body.position.y > CANVAS_HEIGHT / 2 ? 100 : CANVAS_HEIGHT - 100;
      const moveY = targetY - player.body.position.y;
      Body.setVelocity(player.body, { x: 0, y: moveY * 0.1 });
    } else {
      Body.setVelocity(player.body, { x: 0, y: dy > 0 ? CONFIG.PLAYER_SPEED : -CONFIG.PLAYER_SPEED });
    }
  } else {
    // Center position
    const dy = (CANVAS_HEIGHT / 2) - player.body.position.y;
    Body.setVelocity(player.body, { x: 0, y: dy * 0.1 });
  }

  // Constant shooting
  player.shoot();

  // Use charged beam frequently
  if (p.frameCount % 80 === 0) {
    player.shootChargedBeam();
  }

  // Keep force pod attached for defense
  if (!gameState.forcePod.attached) {
    gameState.forcePod.attach('front');
  }
}

function testLoseCondition(p) {
  // Don't move, don't dodge - intentionally take damage
  Body.setVelocity(gameState.player.body, { x: 0, y: 0 });
  
  // Move slowly towards enemies
  if (gameState.enemies.length > 0) {
    const enemy = gameState.enemies[0];
    const dx = enemy.body.position.x - gameState.player.body.position.x;
    const dy = enemy.body.position.y - gameState.player.body.position.y;
    Body.setVelocity(gameState.player.body, { x: dx * 0.02, y: dy * 0.02 });
  }
}

function testPowerUps(p) {
  const player = gameState.player;
  
  // Move towards power-ups
  if (gameState.powerups.length > 0) {
    const powerup = gameState.powerups[0];
    const dx = powerup.x - player.body.position.x;
    const dy = powerup.y - player.body.position.y;
    Body.setVelocity(player.body, { 
      x: dx * 0.1, 
      y: dy * 0.1 
    });
  } else {
    // Shoot to create power-ups
    player.shoot();
    
    // Move in pattern to collect drops
    const time = p.frameCount;
    if (time % 100 < 50) {
      Body.setVelocity(player.body, { x: 0, y: -CONFIG.PLAYER_SPEED * 0.5 });
    } else {
      Body.setVelocity(player.body, { x: 0, y: CONFIG.PLAYER_SPEED * 0.5 });
    }
  }

  // Test different weapon levels
  if (p.frameCount % 20 === 0) {
    player.shoot();
  }
}

function testForcePod(p) {
  const player = gameState.player;
  const time = p.frameCount;

  // Center position
  const dy = (CANVAS_HEIGHT / 2) - player.body.position.y;
  Body.setVelocity(player.body, { x: 0, y: dy * 0.1 });

  // Cycle through force pod states
  if (time % 150 === 0) {
    gameState.forcePod.attach('front');
  } else if (time % 150 === 50) {
    gameState.forcePod.detach();
  } else if (time % 150 === 100) {
    gameState.forcePod.launch();
  }

  player.shoot();
}

function testBoss(p) {
  const player = gameState.player;

  // Focus on boss if present
  if (gameState.boss && !gameState.boss.dead) {
    const boss = gameState.boss;
    
    // Dodge boss bullets
    const closestBullet = gameState.enemyBullets.reduce((closest, bullet) => {
      if (!closest) return bullet;
      const distCurrent = Math.abs(bullet.x - player.body.position.x);
      const distClosest = Math.abs(closest.x - player.body.position.x);
      return distCurrent < distClosest ? bullet : closest;
    }, null);

    if (closestBullet && closestBullet.x < player.body.position.x + 100) {
      // Dodge
      const dy = closestBullet.y - player.body.position.y;
      Body.setVelocity(player.body, { 
        x: -CONFIG.PLAYER_SPEED * 0.5, 
        y: dy > 0 ? -CONFIG.PLAYER_SPEED : CONFIG.PLAYER_SPEED 
      });
    } else {
      // Aim at boss
      const dy = boss.body.position.y - player.body.position.y;
      Body.setVelocity(player.body, { x: 0, y: dy * 0.05 });
    }

    // Aggressive shooting
    player.shoot();
    
    if (p.frameCount % 60 === 0) {
      player.shootChargedBeam();
    }
  } else {
    testWinCondition(p); // Progress through levels
  }
}

function testDifficultyProgression(p) {
  // Similar to win condition but observe difficulty
  testWinCondition(p);
}