// game_logic.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, 
         ENEMY_SPAWN_INTERVAL, ENEMY_MAX_COUNT, BOSS_SPAWN_INTERVAL,
         XP_TO_LEVEL, GOLD_DROP_CHANCE, ITEM_DROP_CHANCE, WIN_TIME,
         XP_ORB_VALUE } from './globals.js';
import { Player, Enemy, Projectile, XPOrb, Item, Particle } from './entities.js';
import { getRandomAbilities, getRandomItem, applyAbility, applyItem } from './abilities.js';

let spawnTimer = 0;

export function initGame(p) {
  // Reset game state
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  gameState.entities = [gameState.player];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.items = [];
  gameState.particles = [];
  gameState.xpOrbs = [];
  gameState.score = 0;
  gameState.gold = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.playTime = 0;
  gameState.lastBossSpawn = 0;
  gameState.bossesDefeated = 0;
  gameState.enemiesKilled = 0;
  gameState.levelUpPending = false;
  gameState.abilityChoices = [];
  gameState.selectedAbilities = [];
  gameState.inventory = [];
  gameState.waveNumber = 1;
  
  spawnTimer = 0;
}

export function updateGame(p, inputs) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  gameState.playTime += 1 / 60;

  // Check win condition
  if (gameState.playTime >= WIN_TIME) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_WIN, reason: 'survival_complete' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Update player
  if (gameState.player && !gameState.levelUpPending) {
    gameState.player.update(inputs);
    
    // Log player info
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }

    // Auto-attack nearest enemy
    if (gameState.player.canAttack() && gameState.enemies.length > 0) {
      const nearest = findNearestEnemy(gameState.player.x, gameState.player.y);
      if (nearest) {
        const dist = Math.sqrt(
          Math.pow(nearest.x - gameState.player.x, 2) + 
          Math.pow(nearest.y - gameState.player.y, 2)
        );
        if (dist < gameState.player.attackRange) {
          attackEnemy(p, gameState.player, nearest);
        }
      }
    }

    // Special ability
    if (inputs.special && gameState.player.canUseSpecial()) {
      useSpecialAbility(p);
    }

    // Check player death
    if (gameState.player.health <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.GAME_OVER_LOSE, reason: 'player_death' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Spawn enemies
  if (!gameState.levelUpPending) {
    spawnTimer++;
    if (spawnTimer >= ENEMY_SPAWN_INTERVAL && gameState.enemies.length < ENEMY_MAX_COUNT) {
      spawnEnemy(p);
      spawnTimer = 0;
    }

    // Spawn boss
    if (p.frameCount - gameState.lastBossSpawn >= BOSS_SPAWN_INTERVAL) {
      spawnBoss(p);
      gameState.lastBossSpawn = p.frameCount;
      gameState.waveNumber++;
    }
  }

  // Update enemies
  for (let enemy of gameState.enemies) {
    enemy.update(gameState.player.x, gameState.player.y);
    
    // Check collision with player
    const dist = Math.sqrt(
      Math.pow(enemy.x - gameState.player.x, 2) + 
      Math.pow(enemy.y - gameState.player.y, 2)
    );
    if (dist < enemy.radius + gameState.player.radius && enemy.canAttack()) {
      const damage = Math.max(1, enemy.damage - (gameState.player.armor || 0));
      if (gameState.player.takeDamage(damage)) {
        enemy.attack();
        createParticles(p, gameState.player.x, gameState.player.y, [255, 100, 100], 5);
      }
    }
  }

  // Update projectiles
  for (let proj of gameState.projectiles) {
    proj.update();
  }

  // Check projectile-enemy collisions
  for (let proj of gameState.projectiles) {
    if (proj.isDead) continue;
    for (let enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.sqrt(
        Math.pow(proj.x - enemy.x, 2) + 
        Math.pow(proj.y - enemy.y, 2)
      );
      if (dist < proj.radius + enemy.radius) {
        const isCrit = Math.random() < (gameState.player.critChance || 0);
        const damage = isCrit ? proj.damage * 2 : proj.damage;
        if (enemy.takeDamage(damage)) {
          onEnemyKilled(p, enemy);
        }
        proj.isDead = true;
        createParticles(p, proj.x, proj.y, isCrit ? [255, 215, 0] : [255, 150, 50], 3);
        break;
      }
    }
  }

  // Update XP orbs
  for (let orb of gameState.xpOrbs) {
    orb.update(gameState.player.x, gameState.player.y);
    
    const dist = Math.sqrt(
      Math.pow(orb.x - gameState.player.x, 2) + 
      Math.pow(orb.y - gameState.player.y, 2)
    );
    if (dist < orb.radius + gameState.player.radius) {
      gainXP(p, orb.value);
      orb.collected = true;
    }
  }

  // Update items
  for (let item of gameState.items) {
    item.update(p.frameCount);
    
    const dist = Math.sqrt(
      Math.pow(item.x - gameState.player.x, 2) + 
      Math.pow(item.y - gameState.player.y, 2)
    );
    if (dist < item.radius + gameState.player.radius) {
      collectItem(p, item);
      item.collected = true;
    }
  }

  // Update particles
  for (let particle of gameState.particles) {
    particle.update();
  }

  // Clean up dead entities
  gameState.enemies = gameState.enemies.filter(e => !e.isDead);
  gameState.projectiles = gameState.projectiles.filter(p => !p.isDead);
  gameState.xpOrbs = gameState.xpOrbs.filter(o => !o.collected);
  gameState.items = gameState.items.filter(i => !i.collected);
  gameState.particles = gameState.particles.filter(p => !p.isDead);
}

function findNearestEnemy(x, y) {
  let nearest = null;
  let minDist = Infinity;
  
  for (let enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    const dist = Math.sqrt(Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2));
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function attackEnemy(p, player, enemy) {
  player.attack();
  
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = 8;
  
  const proj = new Projectile(
    player.x,
    player.y,
    (dx / dist) * speed,
    (dy / dist) * speed,
    player.damage
  );
  
  gameState.projectiles.push(proj);
}

function useSpecialAbility(p) {
  gameState.player.useSpecial();
  
  // Area damage to all enemies
  for (let enemy of gameState.enemies) {
    const dist = Math.sqrt(
      Math.pow(enemy.x - gameState.player.x, 2) + 
      Math.pow(enemy.y - gameState.player.y, 2)
    );
    if (dist < 150) {
      if (enemy.takeDamage(gameState.player.damage * 0.5)) {
        onEnemyKilled(p, enemy);
      }
    }
  }
  
  createParticles(p, gameState.player.x, gameState.player.y, [100, 200, 255], 20);
}

function spawnEnemy(p) {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  
  switch (side) {
    case 0: // top
      x = Math.random() * CANVAS_WIDTH;
      y = -20;
      break;
    case 1: // right
      x = CANVAS_WIDTH + 20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
    case 2: // bottom
      x = Math.random() * CANVAS_WIDTH;
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // left
      x = -20;
      y = Math.random() * CANVAS_HEIGHT;
      break;
  }
  
  const enemy = new Enemy(x, y, 'normal');
  gameState.enemies.push(enemy);
}

function spawnBoss(p) {
  const x = CANVAS_WIDTH / 2;
  const y = -50;
  
  const boss = new Enemy(x, y, 'boss');
  gameState.enemies.push(boss);
  
  p.logs.game_info.push({
    data: { event: 'boss_spawned', wave: gameState.waveNumber },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function onEnemyKilled(p, enemy) {
  gameState.enemiesKilled++;
  gameState.score += enemy.isBoss ? 100 : 10;
  
  if (enemy.isBoss) {
    gameState.bossesDefeated++;
  }
  
  // Drop XP
  const xpOrb = new XPOrb(enemy.x, enemy.y, enemy.xpValue);
  gameState.xpOrbs.push(xpOrb);
  
  // Drop gold
  if (Math.random() < GOLD_DROP_CHANCE) {
    gameState.gold += enemy.goldValue;
  }
  
  // Drop item
  if (Math.random() < ITEM_DROP_CHANCE || enemy.isBoss) {
    const itemData = getRandomItem();
    const item = new Item(enemy.x, enemy.y, itemData);
    gameState.items.push(item);
  }
  
  // Vampirism
  if (gameState.player.vampirism) {
    gameState.player.heal(gameState.player.vampirism);
  }
  
  createParticles(p, enemy.x, enemy.y, enemy.isBoss ? [255, 0, 255] : [255, 50, 50], enemy.isBoss ? 15 : 8);
}

function gainXP(p, amount) {
  gameState.xp += amount;
  
  if (gameState.xp >= XP_TO_LEVEL * gameState.level) {
    gameState.xp -= XP_TO_LEVEL * gameState.level;
    gameState.level++;
    triggerLevelUp(p);
  }
}

function triggerLevelUp(p) {
  gameState.levelUpPending = true;
  gameState.abilityChoices = getRandomAbilities(3);
  
  p.logs.game_info.push({
    data: { event: 'level_up', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function selectAbility(p, index) {
  if (!gameState.levelUpPending || index >= gameState.abilityChoices.length) return;
  
  const ability = gameState.abilityChoices[index];
  applyAbility(gameState.player, ability);
  gameState.selectedAbilities.push(ability.id);
  
  gameState.levelUpPending = false;
  gameState.abilityChoices = [];
}

function collectItem(p, item) {
  applyItem(gameState.player, item.itemData);
  gameState.inventory.push(item.itemData.id);
  
  createParticles(p, item.x, item.y, item.itemData.color, 8);
}

function createParticles(p, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 2;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      20 + Math.floor(Math.random() * 20)
    );
    gameState.particles.push(particle);
  }
}