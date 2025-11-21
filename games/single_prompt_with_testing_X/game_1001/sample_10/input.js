import { gameState, GAME_PHASES, ITEMS } from './globals.js';
import { Projectile } from './entities.js';
import { switchRealm } from './world.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player && gameState.player.active) {
    if (keyCode === 90) { // Z - sword
      gameState.player.startCharge();
    } else if (keyCode === 32) { // SPACE - use item
      useEquippedItem(p);
    } else if (keyCode === 16) { // SHIFT - dash
      gameState.player.dash();
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player && gameState.player.active) {
    if (keyCode === 90) { // Z
      gameState.player.releaseAttack();
    }
  }
}

export function handleMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player || !gameState.player.active) return;

  let dx = 0;
  let dy = 0;

  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(37)) dx -= 1; // LEFT
    if (p.keyIsDown(39)) dx += 1; // RIGHT
    if (p.keyIsDown(38)) dy -= 1; // UP
    if (p.keyIsDown(40)) dy += 1; // DOWN
    
    if (dx !== 0 || dy !== 0) {
      gameState.player.move(dx, dy);
    }

    // Update charge while Z is held
    if (p.keyIsDown(90)) {
      gameState.player.updateCharge();
    }
  } else {
    // Automated testing movement would go here
    // For now, simple AI that moves toward nearest enemy
    const enemies = gameState.entities.filter(e => 
      (e.constructor.name === 'Enemy' || e.constructor.name === 'Boss') && e.active
    );
    
    if (enemies.length > 0) {
      const target = enemies[0];
      const dx = target.x - gameState.player.x;
      const dy = target.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        gameState.player.move(dx / dist, dy / dist);
      } else {
        // Attack
        if (gameState.player.attackCooldown <= 0) {
          gameState.player.startCharge();
          setTimeout(() => gameState.player.releaseAttack(), 100);
        }
      }
    }
  }
}

function useEquippedItem(p) {
  if (!gameState.equippedItem) return;

  const player = gameState.player;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const [dx, dy] = dirs[player.direction];

  switch(gameState.equippedItem) {
    case ITEMS.BOW:
      const arrow = new Projectile(p, player.x + player.w / 2, player.y + player.h / 2, dx, dy, true);
      gameState.projectiles.push(arrow);
      break;
    case ITEMS.HOOKSHOT:
      // Simple hookshot implementation
      const hook = new Projectile(p, player.x + player.w / 2, player.y + player.h / 2, dx, dy, true);
      hook.w = 8;
      hook.h = 8;
      gameState.projectiles.push(hook);
      break;
    case ITEMS.BOOMERANG:
      const boomerang = new Projectile(p, player.x + player.w / 2, player.y + player.h / 2, dx, dy, true);
      boomerang.lifetime = 40;
      gameState.projectiles.push(boomerang);
      break;
    case ITEMS.REALM_MIRROR:
      switchRealm(p);
      break;
  }
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.dungeonTreasures = 0;
  gameState.smallKeys = 0;
  gameState.hasBigKey = false;
  gameState.inventory = [];
  gameState.equippedItem = null;
  gameState.currentRoom = { x: 0, y: 0 };
  gameState.roomData = {};
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.bossesDefeated = 0;
  gameState.currentRealm = 'LIGHT';
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, event: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}