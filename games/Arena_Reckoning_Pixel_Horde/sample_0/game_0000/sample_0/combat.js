// combat.js - Combat system

import { Projectile } from './projectiles.js';
import { gameState, PLAYER_CONFIG } from './globals.js';
import { createExplosion } from './particles.js';

export function updatePlayerCombat(p, currentTime) {
  const player = gameState.player;
  const attackInterval = 1000 / player.attackSpeedMultiplier;
  
  if (currentTime - player.lastAttackTime > attackInterval) {
    firePlayerWeapons(p, player);
    player.lastAttackTime = currentTime;
  }
  
  // Aura damage
  if (player.hasAura && currentTime - player.lastAuraDamage > player.auraInterval) {
    damageEnemiesInAura(player);
    player.lastAuraDamage = currentTime;
  }
}

function firePlayerWeapons(p, player) {
  for (const weapon of player.weapons) {
    switch (weapon) {
      case "BASIC":
        fireBasicWeapon(p, player);
        break;
      case "ARCANE_ORB":
        fireArcaneOrb(p, player);
        break;
      case "TRIPLE_SHOT":
        fireTripleShot(p, player);
        break;
      case "RAPID_FIRE":
        fireRapidFire(p, player);
        break;
    }
  }
}

function fireBasicWeapon(p, player) {
  const baseSpeed = PLAYER_CONFIG.projectileSpeed * player.projectileSpeedMultiplier;
  
  for (let i = 0; i < player.projectileCount; i++) {
    const angle = (Math.PI * 2 / player.projectileCount) * i;
    const vx = Math.cos(angle) * baseSpeed;
    const vy = Math.sin(angle) * baseSpeed;
    
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      player.baseDamage,
      "PLAYER"
    );
    
    gameState.projectiles.push(projectile);
  }
}

function fireArcaneOrb(p, player) {
  if (gameState.enemies.length === 0) return;
  
  const target = gameState.enemies[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const speed = 3 * player.projectileSpeedMultiplier;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      player.baseDamage * 2,
      "PLAYER"
    );
    projectile.radius = 5;
    
    gameState.projectiles.push(projectile);
  }
}

function fireTripleShot(p, player) {
  if (gameState.enemies.length === 0) return;
  
  const target = gameState.enemies[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const baseAngle = Math.atan2(dy, dx);
  
  const speed = PLAYER_CONFIG.projectileSpeed * player.projectileSpeedMultiplier;
  const spreadAngles = [-0.3, 0, 0.3];
  
  for (const angleOffset of spreadAngles) {
    const angle = baseAngle + angleOffset;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      player.baseDamage * 0.8,
      "PLAYER"
    );
    
    gameState.projectiles.push(projectile);
  }
}

function fireRapidFire(p, player) {
  if (gameState.enemies.length === 0) return;
  
  const target = gameState.enemies[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const speed = PLAYER_CONFIG.projectileSpeed * player.projectileSpeedMultiplier * 1.5;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      player.baseDamage * 0.6,
      "PLAYER"
    );
    
    gameState.projectiles.push(projectile);
  }
}

function damageEnemiesInAura(player) {
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < player.auraRadius) {
      enemy.takeDamage(player.auraDamage);
    }
  }
}

export function updateEnemyShooting(p, currentTime) {
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    if (enemy.type !== "IMP" && enemy.type !== "BOSS") continue;
    
    if (currentTime - enemy.lastShot > enemy.shootInterval) {
      fireEnemyProjectile(p, enemy);
      enemy.lastShot = currentTime;
    }
  }
}

function fireEnemyProjectile(p, enemy) {
  const player = gameState.player;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const speed = 3;
    
    if (enemy.type === "BOSS") {
      // Spread shot
      const baseAngle = Math.atan2(dy, dx);
      const spreadAngles = [-0.4, -0.2, 0, 0.2, 0.4];
      
      for (const angleOffset of spreadAngles) {
        const angle = baseAngle + angleOffset;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        const projectile = new Projectile(
          enemy.x,
          enemy.y,
          vx,
          vy,
          enemy.damage,
          "ENEMY"
        );
        
        gameState.projectiles.push(projectile);
      }
    } else {
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      
      const projectile = new Projectile(
        enemy.x,
        enemy.y,
        vx,
        vy,
        enemy.damage,
        "ENEMY"
      );
      
      gameState.projectiles.push(projectile);
    }
  }
}

export function checkCollisions(p) {
  const player = gameState.player;
  const particles = [];
  
  // Projectile-enemy collisions
  for (const projectile of gameState.projectiles) {
    if (projectile.isDead || projectile.owner !== "PLAYER") continue;
    
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      
      const enemyRadius = enemy.radius || enemy.size / 2;
      if (projectile.collidesWith(enemy.x, enemy.y, enemyRadius)) {
        projectile.isDead = true;
        
        const killed = enemy.takeDamage(projectile.damage);
        
        // Impact particles
        particles.push(...createExplosion(p, projectile.x, projectile.y, [255, 255, 255], 4));
        
        if (killed) {
          handleEnemyDeath(p, enemy, particles);
        }
        
        break;
      }
    }
  }
  
  // Enemy projectile-player collisions
  for (const projectile of gameState.projectiles) {
    if (projectile.isDead || projectile.owner !== "ENEMY") continue;
    
    if (projectile.collidesWith(player.x, player.y, player.radius)) {
      projectile.isDead = true;
      const died = player.takeDamage(projectile.damage);
      
      if (died) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_LOSE" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Player-enemy collisions
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const enemyRadius = enemy.radius || enemy.size / 2;
    if (enemy.collidesWith(player.x, player.y, player.radius)) {
      const died = player.takeDamage(enemy.damage);
      
      // Push enemy back
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        enemy.x += (dx / dist) * 20;
        enemy.y += (dy / dist) * 20;
      }
      
      if (died) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_LOSE" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Player-expGem collisions
  for (const gem of gameState.expGems) {
    if (gem.isDead) continue;
    
    if (gem.collidesWith(player.x, player.y, player.radius)) {
      gem.isDead = true;
      const leveledUp = player.addExp(gem.expValue);
      gameState.score += 2;
      
      particles.push(...createExplosion(p, gem.x, gem.y, [255, 220, 100], 6));
      
      if (leveledUp) {
        gameState.gamePhase = "UPGRADE_SELECTION";
        generateUpgradeChoices(p);
        p.logs.game_info.push({
          data: { phase: "UPGRADE_SELECTION", level: player.level },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  return particles;
}

function handleEnemyDeath(p, enemy, particles) {
  gameState.score += enemy.pointsValue;
  
  // Drop exp gem
  const { ExpGem } = require('./expGem.js');
  const gem = new ExpGem(enemy.x, enemy.y, enemy.expValue);
  gameState.expGems.push(gem);
  
  // Death particles
  particles.push(...createExplosion(p, enemy.x, enemy.y, enemy.color, 8));
  
  // Check for boss death
  if (enemy.type === "BOSS") {
    gameState.bossDefeated = true;
  }
}

function generateUpgradeChoices(p) {
  const { UPGRADE_POOL } = require('./globals.js');
  const choices = [];
  const availableUpgrades = [...UPGRADE_POOL];
  
  for (let i = 0; i < 3; i++) {
    if (availableUpgrades.length === 0) break;
    const index = Math.floor(p.random(availableUpgrades.length));
    choices.push(availableUpgrades[index]);
    availableUpgrades.splice(index, 1);
  }
  
  gameState.availableUpgrades = choices;
  gameState.selectedUpgradeIndex = 0;
}