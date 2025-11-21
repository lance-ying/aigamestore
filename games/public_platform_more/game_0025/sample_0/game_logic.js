// game_logic.js - Core game logic functions

import {
  gameState,
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  MONSTER_TYPES,
  MONSTER_SLOTS,
  HERO_TYPES,
  UPGRADE_TYPES
} from './globals.js';
import { Monster, Hero } from './entities.js';

let p5Instance = null;

export function setP5Instance(p) {
  p5Instance = p;
}

export function startGame() {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.wave = 0;
  gameState.monsters = [];
  gameState.heroes = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.selectedMonsterIndex = -1;
  gameState.selectedSlotIndex = 0;
  gameState.soulShards = 0;
  gameState.totalShardsEarned = 0;
  gameState.heroSpawnTimer = 0;
  gameState.heroesSpawned = 0;
  gameState.waveComplete = false;
  gameState.showUpgradeScreen = false;
  gameState.availableMonsterTypes = [0]; // Start with Goblin
  gameState.modifiers = {
    damageMultiplier: 1.0,
    healthMultiplier: 1.0,
    skillCooldownMultiplier: 1.0,
    attackSpeedMultiplier: 1.0,
    rangeMultiplier: 1.0
  };
  
  startNextWave();
}

export function startNextWave() {
  gameState.wave++;
  gameState.heroSpawnTimer = 0;
  gameState.heroesSpawned = 0;
  gameState.waveComplete = false;
  gameState.showUpgradeScreen = false;
  gameState.heroSpawnInterval = Math.max(60, 180 - gameState.wave * 10);
  gameState.heroesPerWave = 5 + Math.floor(gameState.wave / 2);
  
  gameState.message = `Wave ${gameState.wave}`;
  gameState.messageTimer = 120;
  
  // Log wave start
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: "WAVE_START", wave: gameState.wave },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame() {
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
  
  // Update monsters
  for (const monster of gameState.monsters) {
    monster.update();
  }
  
  // Remove dead monsters
  const aliveMonsters = gameState.monsters.filter(m => m.isAlive());
  if (aliveMonsters.length < gameState.monsters.length) {
    // Log monster deaths
    if (p5Instance) {
      p5Instance.logs.game_info.push({
        data: { event: "MONSTER_DEFEATED", remaining: aliveMonsters.length },
        framecount: p5Instance.frameCount,
        timestamp: Date.now()
      });
    }
  }
  gameState.monsters = aliveMonsters;
  
  // Check if all monsters defeated
  if (gameState.monsters.length === 0 && gameState.wave > 0) {
    endGame(false);
    return;
  }
  
  // Update heroes
  for (const hero of gameState.heroes) {
    hero.update();
  }
  
  // Remove defeated heroes and check if they reached the left edge
  gameState.heroes = gameState.heroes.filter(h => {
    if (h.x < -30) {
      endGame(false);
      return false;
    }
    return !h.defeated;
  });
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < proj.speed) {
      // Hit target
      for (const hero of gameState.heroes) {
        if (!hero.defeated && 
            p5Instance.dist(hero.x, hero.y, proj.targetX, proj.targetY) < 30) {
          hero.health -= proj.damage;
          break;
        }
      }
      gameState.projectiles.splice(i, 1);
    } else {
      proj.x += (dx / dist) * proj.speed;
      proj.y += (dy / dist) * proj.speed;
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.2;
    particle.life--;
    
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Spawn heroes
  if (!gameState.waveComplete && gameState.heroesSpawned < gameState.heroesPerWave) {
    gameState.heroSpawnTimer++;
    if (gameState.heroSpawnTimer >= gameState.heroSpawnInterval) {
      spawnHero();
      gameState.heroSpawnTimer = 0;
      gameState.heroesSpawned++;
    }
  }
  
  // Check if wave complete
  if (gameState.heroesSpawned >= gameState.heroesPerWave && 
      gameState.heroes.length === 0 && 
      !gameState.waveComplete) {
    gameState.waveComplete = true;
    
    if (gameState.wave >= gameState.maxWaves) {
      endGame(true);
    } else {
      showUpgradeScreen();
    }
  }
}

export function spawnHero() {
  if (!p5Instance) return;
  
  const typeIndex = Math.floor(p5Instance.random() * HERO_TYPES.length);
  const hero = new Hero(HERO_TYPES[typeIndex], gameState.wave, p5Instance);
  gameState.heroes.push(hero);
}

export function showUpgradeScreen() {
  gameState.showUpgradeScreen = true;
  gameState.selectedUpgrade = 0;
  gameState.upgradeOptions = generateUpgradeOptions();
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: "UPGRADE_SCREEN", wave: gameState.wave },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function generateUpgradeOptions() {
  const options = [];
  
  // Always include at least one stat upgrade
  const statUpgrades = UPGRADE_TYPES.filter(u => u.type !== "new_monster");
  const selectedStats = [];
  
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(p5Instance.random() * statUpgrades.length);
    selectedStats.push({ ...statUpgrades[idx] });
  }
  
  options.push(...selectedStats);
  
  // Maybe add a new monster
  if (gameState.availableMonsterTypes.length < MONSTER_TYPES.length && 
      p5Instance.random() < 0.5) {
    const unavailableTypes = [];
    for (let i = 0; i < MONSTER_TYPES.length; i++) {
      if (!gameState.availableMonsterTypes.includes(i)) {
        unavailableTypes.push(i);
      }
    }
    if (unavailableTypes.length > 0) {
      const newType = unavailableTypes[Math.floor(p5Instance.random() * unavailableTypes.length)];
      options[2] = {
        type: "new_monster",
        name: `Unlock ${MONSTER_TYPES[newType].name}`,
        description: `Add ${MONSTER_TYPES[newType].name} to your roster`,
        monsterType: newType
      };
    }
  }
  
  // Fill remaining slots
  while (options.length < 3) {
    const idx = Math.floor(p5Instance.random() * statUpgrades.length);
    options.push({ ...statUpgrades[idx] });
  }
  
  return options;
}

export function selectUpgrade(index) {
  const upgrade = gameState.upgradeOptions[index];
  
  switch (upgrade.type) {
    case "new_monster":
      if (!gameState.availableMonsterTypes.includes(upgrade.monsterType)) {
        gameState.availableMonsterTypes.push(upgrade.monsterType);
      }
      break;
    case "damage":
      gameState.modifiers.damageMultiplier *= 1.2;
      // Update existing monsters
      for (const monster of gameState.monsters) {
        monster.damage *= 1.2;
      }
      break;
    case "health":
      gameState.modifiers.healthMultiplier *= 1.3;
      // Update existing monsters
      for (const monster of gameState.monsters) {
        const ratio = monster.health / monster.maxHealth;
        monster.maxHealth *= 1.3;
        monster.health = monster.maxHealth * ratio;
      }
      break;
    case "skill_cooldown":
      gameState.modifiers.skillCooldownMultiplier *= 0.8;
      break;
    case "attack_speed":
      gameState.modifiers.attackSpeedMultiplier *= 1.15;
      break;
    case "range":
      gameState.modifiers.rangeMultiplier *= 1.25;
      // Update existing monsters
      for (const monster of gameState.monsters) {
        monster.range *= 1.25;
      }
      break;
  }
  
  gameState.message = `${upgrade.name} Applied!`;
  gameState.messageTimer = 120;
  
  startNextWave();
}

export function deployMonster(slotIndex, typeIndex) {
  if (!p5Instance) return false;
  
  // Check if slot is occupied
  const occupied = gameState.monsters.some(m => m.slotIndex === slotIndex);
  if (occupied) return false;
  
  // Check if we have 5 monsters already
  if (gameState.monsters.length >= 5) return false;
  
  const monster = new Monster(slotIndex, typeIndex, p5Instance);
  gameState.monsters.push(monster);
  
  gameState.message = `${monster.name} Deployed!`;
  gameState.messageTimer = 60;
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { event: "MONSTER_DEPLOYED", name: monster.name, slot: slotIndex },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
  
  return true;
}

export function useSelectedMonsterSkill() {
  if (gameState.selectedMonsterIndex < 0 || 
      gameState.selectedMonsterIndex >= gameState.monsters.length) {
    return false;
  }
  
  const monster = gameState.monsters[gameState.selectedMonsterIndex];
  const success = monster.useSkill();
  
  if (success) {
    gameState.message = `${monster.name} used ${monster.skillName}!`;
    gameState.messageTimer = 60;
    
    if (p5Instance) {
      p5Instance.logs.game_info.push({
        data: { event: "SKILL_USED", monster: monster.name, skill: monster.skillName },
        framecount: p5Instance.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  return success;
}

export function endGame(won) {
  gameState.gamePhase = won ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        wave: gameState.wave,
        totalShards: gameState.totalShardsEarned
      },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}