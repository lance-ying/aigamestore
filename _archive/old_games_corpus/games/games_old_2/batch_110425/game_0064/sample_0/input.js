// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_UPGRADE_SCREEN, CONTROL_HUMAN } from './globals.js';
import { startMission, handleUpgradeSelection, proceedToNextMission } from './mission.js';

let upgradeSelectionIndex = 0;

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // Phase transition keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startMission(0);
      logGameInfo(p, "Game started");
    } else if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
      proceedToNextMission();
      logGameInfo(p, "Proceeding to next mission");
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      logGameInfo(p, "Game paused");
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      logGameInfo(p, "Game resumed");
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame();
      logGameInfo(p, "Game reset");
    }
    return;
  }

  // Gameplay keys (only in PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.player) {
    handleGameplayInput(p, keyCode);
  }

  // Upgrade screen keys
  if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
    handleUpgradeInput(keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const player = gameState.player;

  if (keyCode === 38) { // UP
    player.jump();
  } else if (keyCode === 32) { // SPACE
    if (player.attack()) {
      checkPlayerAttack(p);
    }
  } else if (keyCode === 90) { // Z
    if (player.shadowStrike()) {
      // Dash attack
      setTimeout(() => {
        checkPlayerAttack(p, true);
      }, 100);
    }
  } else if (keyCode === 16) { // SHIFT
    if (player.ninjaFury()) {
      executeNinjaFury(p);
    }
  }
}

function handleUpgradeInput(keyCode) {
  if (keyCode === 37) { // LEFT
    upgradeSelectionIndex = 0;
  } else if (keyCode === 39) { // RIGHT
    upgradeSelectionIndex = 1;
  } else if (keyCode === 32) { // SPACE
    if (upgradeSelectionIndex === 0) {
      handleUpgradeSelection('upgrade_attack');
    } else {
      handleUpgradeSelection('upgrade_health');
    }
  }
}

function checkPlayerAttack(p, isDash = false) {
  if (!gameState.player) return;

  const attackBox = gameState.player.getAttackBox();
  const damage = isDash ? gameState.playerStats.attackDamage * 1.5 : gameState.playerStats.attackDamage;

  for (const enemy of gameState.enemies) {
    if (enemy.dead) continue;

    const enemyBox = enemy.getCollisionBox();
    
    if (checkBoxCollision(attackBox, enemyBox)) {
      enemy.takeDamage(damage);
      
      // Create hit effect
      const hitX = enemy.x + enemy.width / 2;
      const hitY = enemy.y + enemy.height / 2;
      
      for (let i = 0; i < 5; i++) {
        gameState.particles.push({
          x: hitX,
          y: hitY,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * -4 - 2,
          size: Math.random() * 6 + 3,
          life: 30,
          color: [255, 200, 100]
        });
      }
    }
  }
}

function executeNinjaFury(p) {
  if (!gameState.player) return;

  const player = gameState.player;
  const furyRadius = 120;
  const damage = gameState.playerStats.attackDamage * 2;

  // Create skill effect
  for (let i = 0; i < 20; i++) {
    gameState.particles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10,
      size: Math.random() * 12 + 6,
      life: 50,
      color: [255, 100, 200]
    });
  }

  // Damage all enemies in range
  for (const enemy of gameState.enemies) {
    if (enemy.dead) continue;

    const dx = enemy.x + enemy.width / 2 - (player.x + player.width / 2);
    const dy = enemy.y + enemy.height / 2 - (player.y + player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < furyRadius) {
      enemy.takeDamage(damage);
    }
  }
}

function checkBoxCollision(box1, box2) {
  return box1.x < box2.x + box2.width &&
         box1.x + box1.width > box2.x &&
         box1.y < box2.y + box2.height &&
         box1.y + box1.height > box2.y;
}

function logGameInfo(p, data) {
  if (p.logs) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame() {
  gameState.gamePhase = PHASE_START;
  gameState.currentMission = 0;
  gameState.goldCollected = 0;
  gameState.score = 0;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.goldDrops = [];
  gameState.particles = [];
  gameState.playerStats = {
    maxHealth: 100,
    health: 100,
    attackDamage: 20,
    attackLevel: 0,
    healthLevel: 0
  };
  gameState.skills.shadowStrike.cooldown = 0;
  gameState.skills.ninjaFury.cooldown = 0;
  
  if (gameState.player) {
    gameState.player.x = 100;
    gameState.player.y = 200;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === CONTROL_HUMAN) return;

  if (typeof window.get_automated_testing_action !== 'function') return;

  const action = window.get_automated_testing_action(gameState);
  
  if (!action) return;

  // Simulate key presses based on action
  if (action.left) {
    if (gameState.player) gameState.player.moveLeft();
  }
  if (action.right) {
    if (gameState.player) gameState.player.moveRight();
  }
  if (action.jump) {
    if (gameState.player) gameState.player.jump();
  }
  if (action.attack) {
    if (gameState.player && gameState.player.attack()) {
      checkPlayerAttack(p);
    }
  }
  if (action.shadowStrike) {
    if (gameState.player && gameState.player.shadowStrike()) {
      setTimeout(() => {
        checkPlayerAttack(p, true);
      }, 100);
    }
  }
  if (action.ninjaFury) {
    if (gameState.player && gameState.player.ninjaFury()) {
      executeNinjaFury(p);
    }
  }
  if (action.upgrade_attack) {
    handleUpgradeSelection('upgrade_attack');
  }
  if (action.upgrade_health) {
    handleUpgradeSelection('upgrade_health');
  }
  if (action.continue) {
    if (gameState.gamePhase === PHASE_UPGRADE_SCREEN) {
      proceedToNextMission();
    }
  }
}