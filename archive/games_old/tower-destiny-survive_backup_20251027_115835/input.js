// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { initializeLevel } from './levels.js';
import { Bullet } from './entities.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
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
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      resetGame(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 32) { // SPACE
      fireWeapons(p);
    } else if (keyCode === 81) { // Q - face left
      gameState.facingRight = false;
    } else if (keyCode === 69) { // E - face right
      gameState.facingRight = true;
    }
  }
  
  // Level complete controls
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    // Number keys for upgrades
    if (keyCode >= 49 && keyCode <= 53) { // 1-5
      const upgradeIndex = keyCode - 49;
      performUpgrade(p, upgradeIndex);
    } else if (keyCode === 13) { // ENTER to continue
      gameState.currentLevel++;
      initializeLevel(gameState.currentLevel);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.score = 0;
  gameState.blocksCollected = 10; // Start with some blocks
  gameState.currentLevel = 1;
  gameState.towerHealth = gameState.towerMaxHealth;
  gameState.energy = gameState.maxEnergy;
  gameState.comboCount = 0;
  gameState.comboTimer = 0;
  gameState.comboMultiplier = 1;
  gameState.facingRight = true;
  
  if (gameState.player) {
    gameState.player.health = gameState.towerMaxHealth;
  }
  
  initializeLevel(1);
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.blocksCollected = 0;
  gameState.currentLevel = 1;
  gameState.towerMaxHealth = 100;
  gameState.towerHealth = 100;
  gameState.energy = 100;
  gameState.maxEnergy = 100;
  gameState.activeWeaponSlots = 1;
  gameState.comboCount = 0;
  gameState.comboTimer = 0;
  gameState.comboMultiplier = 1;
  gameState.facingRight = true;
  gameState.powerupEffects = {
    damageBoost: 0,
    damageBoostTimer: 0
  };
  
  // Reset weapons
  gameState.weapons = [
    {
      type: "cannon",
      damage: 20,
      fireRate: 30,
      lastFired: 0,
      unlocked: true
    },
    {
      type: "machinegun",
      damage: 10,
      fireRate: 10,
      lastFired: 0,
      unlocked: false
    }
  ];
  
  if (gameState.player) {
    gameState.player.health = gameState.towerMaxHealth;
  }
  
  gameState.zombies = [];
  gameState.bullets = [];
  gameState.blocks = [];
  gameState.particles = [];
  gameState.powerups = [];
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updatePlayerMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return;
  }
  
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
      gameState.towerX -= gameState.towerSpeed;
    }
    if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
      gameState.towerX += gameState.towerSpeed;
    }
  }
  
  // Constrain tower position
  const halfWidth = gameState.player.width / 2;
  gameState.towerX = Math.max(halfWidth, Math.min(600 - halfWidth, gameState.towerX));
  gameState.player.x = gameState.towerX;
}

function fireWeapons(p) {
  // Check energy
  if (gameState.energy < gameState.shotEnergyCost) {
    return; // Not enough energy
  }
  
  let fired = false;
  const direction = gameState.facingRight ? 1 : -1;
  
  for (let i = 0; i < gameState.activeWeaponSlots; i++) {
    const weapon = gameState.weapons[i];
    if (weapon && weapon.unlocked) {
      if (p.frameCount - weapon.lastFired >= weapon.fireRate) {
        const offsetX = gameState.activeWeaponSlots === 1 ? 0 : (i === 0 ? -15 : 15);
        const bullet = new Bullet(
          gameState.player.x + offsetX,
          gameState.player.y - gameState.player.height - 10,
          weapon.damage,
          weapon.type,
          direction
        );
        gameState.bullets.push(bullet);
        weapon.lastFired = p.frameCount;
        fired = true;
      }
    }
  }
  
  // Consume energy if any weapon fired
  if (fired) {
    gameState.energy -= gameState.shotEnergyCost;
  }
}

function performUpgrade(p, upgradeIndex) {
  const upgrades = getAvailableUpgrades();
  if (upgradeIndex >= upgrades.length) return;
  
  const upgrade = upgrades[upgradeIndex];
  if (gameState.blocksCollected >= upgrade.cost) {
    gameState.blocksCollected -= upgrade.cost;
    
    switch (upgrade.id) {
      case "health":
        gameState.towerMaxHealth += 50;
        gameState.towerHealth += 50;
        if (gameState.player) {
          gameState.player.health = gameState.towerHealth;
        }
        gameState.upgradeCosts.health += 5;
        break;
      case "weaponDamage":
        gameState.weapons.forEach(w => {
          if (w.unlocked) w.damage += 10;
        });
        gameState.upgradeCosts.weaponDamage += 10;
        break;
      case "weaponFireRate":
        gameState.weapons.forEach(w => {
          if (w.unlocked) w.fireRate = Math.max(5, w.fireRate - 3);
        });
        gameState.upgradeCosts.weaponFireRate += 10;
        break;
      case "secondSlot":
        gameState.activeWeaponSlots = 2;
        break;
      case "unlockMachinegun":
        gameState.weapons[1].unlocked = true;
        break;
    }
  }
}

function getAvailableUpgrades() {
  const upgrades = [
    { id: "health", name: "Upgrade Health (+50 HP)", cost: gameState.upgradeCosts.health },
    { id: "weaponDamage", name: "Upgrade Weapon Damage (+10)", cost: gameState.upgradeCosts.weaponDamage },
    { id: "weaponFireRate", name: "Upgrade Fire Rate", cost: gameState.upgradeCosts.weaponFireRate }
  ];
  
  if (gameState.activeWeaponSlots === 1) {
    upgrades.push({ id: "secondSlot", name: "Unlock 2nd Weapon Slot", cost: gameState.upgradeCosts.secondSlot });
  }
  
  if (!gameState.weapons[1].unlocked) {
    upgrades.push({ id: "unlockMachinegun", name: "Unlock Machine Gun", cost: gameState.upgradeCosts.unlockMachinegun });
  }
  
  return upgrades;
}