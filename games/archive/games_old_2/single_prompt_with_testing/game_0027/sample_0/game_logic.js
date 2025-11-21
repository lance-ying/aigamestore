// game_logic.js - Core game logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING, PHASE_GAME_OVER_WIN, 
         PHASE_GAME_OVER_LOSE, GAME_DURATION, BULLET_SPEED, ENEMY_SPAWN_INTERVAL,
         XP_GEM_VALUE, XP_GEM_ATTRACT_RANGE, XP_GEM_SPEED, XP_SCALING } from './globals.js';
import { Player, Bullet, Enemy, XPGem } from './entities.js';
import { createUpgradePool, getRandomUpgrades } from './upgrades.js';

let upgradePool = [];

export function initGame(p) {
  const player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  gameState.player = player;
  gameState.entities = [player];
  upgradePool = createUpgradePool();
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.showUpgradeScreen) return;
  
  // Update game time
  gameState.gameTime += 1 / 60;
  
  // Check win condition
  if (gameState.gameTime >= GAME_DURATION) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, time: gameState.gameTime },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
    
    // Auto-fire at nearest enemy
    if (gameState.player.canShoot() && gameState.enemies.length > 0) {
      const nearest = findNearestEnemy(gameState.player.x, gameState.player.y);
      if (nearest) {
        fireAtTarget(p, gameState.player, nearest.x, nearest.y);
        gameState.player.shoot(nearest.x, nearest.y);
      }
    }
  }
  
  // Update bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    bullet.update();
    
    if (!bullet.active) {
      gameState.bullets.splice(i, 1);
      continue;
    }
    
    // Check collision with enemies
    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j];
      if (checkCircleCollision(bullet.x, bullet.y, bullet.size, 
                               enemy.x, enemy.y, enemy.size)) {
        const died = enemy.takeDamage(bullet.damage);
        bullet.active = false;
        
        if (died) {
          gameState.enemiesKilled++;
          gameState.score += 10;
          spawnXPGem(p, enemy.x, enemy.y);
          gameState.enemies.splice(j, 1);
        }
        break;
      }
    }
  }
  
  // Update enemies
  gameState.spawnTimer++;
  if (gameState.spawnTimer >= ENEMY_SPAWN_INTERVAL) {
    spawnEnemy(p);
    gameState.spawnTimer = 0;
  }
  
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update(gameState.player.x, gameState.player.y);
    
    // Check collision with player
    if (gameState.player && checkCircleCollision(
      enemy.x, enemy.y, enemy.size,
      gameState.player.x, gameState.player.y, gameState.player.size
    )) {
      const damaged = gameState.player.takeDamage(enemy.damage);
      if (damaged && gameState.player.health <= 0) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_LOSE },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Update XP gems
  for (let i = gameState.xpGems.length - 1; i >= 0; i--) {
    const gem = gameState.xpGems[i];
    gem.update(gameState.player.x, gameState.player.y, XP_GEM_ATTRACT_RANGE, XP_GEM_SPEED);
    
    // Check collection
    if (checkCircleCollision(gem.x, gem.y, gem.size,
                            gameState.player.x, gameState.player.y, gameState.player.size * 2)) {
      gameState.xp += gem.value;
      gameState.xpGems.splice(i, 1);
      
      // Check level up
      if (gameState.xp >= gameState.xpToNextLevel) {
        levelUp(p);
      }
    }
  }
  
  // Log player position periodically
  if (p.frameCount % 30 === 0 && gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function findNearestEnemy(x, y) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function fireAtTarget(p, player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist === 0) return;
  
  const dirX = dx / dist;
  const dirY = dy / dist;
  
  const totalDamage = player.damage + player.bonusDamage;
  
  if (player.projectileCount === 1) {
    const bullet = new Bullet(
      player.x, player.y,
      dirX * BULLET_SPEED, dirY * BULLET_SPEED,
      totalDamage
    );
    gameState.bullets.push(bullet);
  } else {
    // Multi-shot
    const spreadAngle = player.projectileSpread;
    const baseAngle = Math.atan2(dirY, dirX);
    
    for (let i = 0; i < player.projectileCount; i++) {
      const offset = (i - (player.projectileCount - 1) / 2) * spreadAngle;
      const angle = baseAngle + offset;
      const vx = Math.cos(angle) * BULLET_SPEED;
      const vy = Math.sin(angle) * BULLET_SPEED;
      
      const bullet = new Bullet(player.x, player.y, vx, vy, totalDamage);
      gameState.bullets.push(bullet);
    }
  }
}

function spawnEnemy(p) {
  // Spawn from edges
  const side = Math.floor(p.random(4));
  let x, y;
  
  switch(side) {
    case 0: // top
      x = p.random(CANVAS_WIDTH);
      y = -20;
      break;
    case 1: // right
      x = CANVAS_WIDTH + 20;
      y = p.random(CANVAS_HEIGHT);
      break;
    case 2: // bottom
      x = p.random(CANVAS_WIDTH);
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // left
      x = -20;
      y = p.random(CANVAS_HEIGHT);
      break;
  }
  
  // Difficulty scaling
  let type = 'basic';
  const rand = p.random();
  const timeFactor = gameState.gameTime / GAME_DURATION;
  
  if (timeFactor > 0.3 && rand < 0.2) {
    type = 'fast';
  } else if (timeFactor > 0.5 && rand < 0.15) {
    type = 'tank';
  }
  
  const enemy = new Enemy(x, y, type);
  
  // Scale stats with time
  enemy.speed *= (1 + timeFactor * 0.5);
  enemy.health *= (1 + timeFactor * 0.8);
  enemy.maxHealth = enemy.health;
  
  gameState.enemies.push(enemy);
}

function spawnXPGem(p, x, y) {
  const offsetX = p.random(-10, 10);
  const offsetY = p.random(-10, 10);
  const gem = new XPGem(x + offsetX, y + offsetY, XP_GEM_VALUE);
  gameState.xpGems.push(gem);
}

function levelUp(p) {
  gameState.level++;
  gameState.xp = 0;
  gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * XP_SCALING);
  
  // Show upgrade screen
  gameState.showUpgradeScreen = true;
  gameState.availableUpgrades = getRandomUpgrades(upgradePool, 3, p);
  
  p.logs.game_info.push({
    data: { event: 'level_up', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function selectUpgrade(index) {
  if (index >= 0 && index < gameState.availableUpgrades.length) {
    const upgrade = gameState.availableUpgrades[index];
    upgrade.apply(gameState.player);
    gameState.upgrades.push(upgrade.name);
    gameState.showUpgradeScreen = false;
    gameState.availableUpgrades = [];
  }
}

function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < (r1 + r2);
}