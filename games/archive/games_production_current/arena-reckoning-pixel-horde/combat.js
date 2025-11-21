// combat.js - Combat system

import { Projectile } from './projectiles.js';
import { gameState, PLAYER_CONFIG, UPGRADE_POOL } from './globals.js';
import { createExplosion } from './particles.js';
import { ExpGem } from './expGem.js';

export function updatePlayerCombat(p, currentTime) {
  const player = gameState.player;
  const attackInterval = 1000 / player.attackSpeedMultiplier;
  
  if (currentTime - player.lastAttackTime > attackInterval) {
    firePlayerWeapons(p, player);
    player.lastAttackTime = currentTime;
  }
  
  // Health regeneration
  if (player.healthRegen > 0 && currentTime - player.lastHealthRegen > 1000) {
    player.health = Math.min(player.health + player.healthRegen, player.maxHealth);
    player.lastHealthRegen = currentTime;
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
      case "LIGHTNING_CHAIN":
        fireLightningChain(p, player);
        break;
      case "BOOMERANG":
        fireBoomerang(p, player);
        break;
      case "LASER_BEAM":
        fireLaserBeam(p, player);
        break;
      case "EXPLOSIVE_SHOT":
        fireExplosiveShot(p, player);
        break;
    }
  }
}

function fireBasicWeapon(p, player) {
  // Sword swing - just start the animation
  // Collision detection happens in player.update() during the swing
  player.startSwordSwing();
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
    
    const damage = calculateDamage(player, player.baseDamage * 2);
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      damage,
      "PLAYER"
    );
    projectile.radius = 5;
    projectile.piercing = player.piercing;
    
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
    
    const damage = calculateDamage(player, player.baseDamage * 0.8);
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      damage,
      "PLAYER"
    );
    projectile.piercing = player.piercing;
    
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
    
    const damage = calculateDamage(player, player.baseDamage * 0.6);
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      damage,
      "PLAYER"
    );
    projectile.piercing = player.piercing;
    
    gameState.projectiles.push(projectile);
  }
}

function fireLightningChain(p, player) {
  if (gameState.enemies.length === 0) return;
  
  // Find closest enemy
  let closest = null;
  let closestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = enemy;
    }
  }
  
  if (closest && closestDist < 200) {
    // Create lightning bolt visual from player to first target
    gameState.lightningBolts.push({
      x1: player.x,
      y1: player.y,
      x2: closest.x,
      y2: closest.y,
      lifetime: 10
    });
    
    const damage = calculateDamage(player, player.baseDamage * 1.5);
    const killed = closest.takeDamage(damage);
    
    if (killed) {
      handleEnemyDeath(p, closest, []);
    }
    
    // Chain to nearby enemies
    let chainCount = 3;
    let lastTarget = closest;
    
    for (let i = 0; i < chainCount; i++) {
      let nextTarget = null;
      let nextDist = Infinity;
      
      for (const enemy of gameState.enemies) {
        if (enemy === lastTarget || enemy.isDead) continue;
        const dx = enemy.x - lastTarget.x;
        const dy = enemy.y - lastTarget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist < nextDist) {
          nextDist = dist;
          nextTarget = enemy;
        }
      }
      
      if (nextTarget) {
        // Create lightning bolt visual between chained enemies
        gameState.lightningBolts.push({
          x1: lastTarget.x,
          y1: lastTarget.y,
          x2: nextTarget.x,
          y2: nextTarget.y,
          lifetime: 10
        });
        
        const chainKilled = nextTarget.takeDamage(damage * 0.7);
        if (chainKilled) {
          handleEnemyDeath(p, nextTarget, []);
        }
        lastTarget = nextTarget;
      } else {
        break;
      }
    }
  }
}

function fireBoomerang(p, player) {
  if (gameState.enemies.length === 0) return;
  
  const target = gameState.enemies[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const speed = 4 * player.projectileSpeedMultiplier;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    
    const damage = calculateDamage(player, player.baseDamage * 1.0);
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      damage,
      "PLAYER"
    );
    projectile.isBoomerang = true;
    projectile.maxDistance = 250;
    projectile.traveledDistance = 0;
    projectile.returning = false;
    projectile.piercing = 3;
    projectile.rotation = 0;
    
    gameState.projectiles.push(projectile);
  }
}

function fireLaserBeam(p, player) {
  if (gameState.enemies.length === 0) return;
  
  const target = gameState.enemies[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const speed = 8 * player.projectileSpeedMultiplier;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    
    const damage = calculateDamage(player, player.baseDamage * 0.4);
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      damage,
      "PLAYER"
    );
    projectile.isLaser = true;
    projectile.piercing = 999;
    projectile.radius = 2;
    
    gameState.projectiles.push(projectile);
  }
}

function fireExplosiveShot(p, player) {
  if (gameState.enemies.length === 0) return;
  
  const target = gameState.enemies[0];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    const speed = 4 * player.projectileSpeedMultiplier;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    
    const damage = calculateDamage(player, player.baseDamage * 1.5);
    const projectile = new Projectile(
      player.x,
      player.y,
      vx,
      vy,
      damage,
      "PLAYER"
    );
    projectile.isExplosive = true;
    projectile.explosionRadius = 40;
    projectile.radius = 4;
    
    gameState.projectiles.push(projectile);
  }
}

function calculateDamage(player, baseDamage) {
  let damage = baseDamage;
  
  // Critical hit chance
  if (player.critChance > 0 && Math.random() < player.critChance) {
    damage *= (2 + player.critDamage);
  }
  
  return damage;
}

export function updateEnemyShooting(p, currentTime) {
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    if (enemy.type !== "IMP" && enemy.type !== "BOSS" && enemy.type !== "NECROMANCER") continue;
    
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
    
    let hitCount = 0;
    const maxHits = projectile.piercing || 0;
    
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      if (hitCount >= maxHits && maxHits > 0) break;
      
      const enemyRadius = enemy.radius || enemy.size / 2;
      if (projectile.collidesWith(enemy.x, enemy.y, enemyRadius)) {
        if (!projectile.isBoomerang || !projectile.returning) {
          const killed = enemy.takeDamage(projectile.damage);
          
          // Lifesteal
          if (player.lifesteal > 0) {
            player.health = Math.min(player.health + projectile.damage * player.lifesteal, player.maxHealth);
          }
          
          // Impact particles
          particles.push(...createExplosion(p, projectile.x, projectile.y, [255, 255, 255], 4));
          
          if (killed) {
            handleEnemyDeath(p, enemy, particles);
          }
          
          // Explosive projectile
          if (projectile.isExplosive) {
            explodeProjectile(p, projectile, particles);
          }
          
          hitCount++;
          if (maxHits === 0 || hitCount >= maxHits) {
            projectile.isDead = true;
            break;
          }
        }
      }
    }
  }
  
  // Boomerang return to player
  for (const projectile of gameState.projectiles) {
    if (projectile.isDead || !projectile.isBoomerang || !projectile.returning) continue;
    
    if (projectile.collidesWith(player.x, player.y, player.radius)) {
      projectile.isDead = true;
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
      let damage = enemy.damage;
      const died = player.takeDamage(damage);
      
      // Thorns damage
      if (player.thorns > 0) {
        const thornsDamage = damage * player.thorns;
        const killed = enemy.takeDamage(thornsDamage);
        if (killed) {
          handleEnemyDeath(p, enemy, particles);
        }
      }
      
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
      const expAmount = gem.expValue * (1 + player.expMultiplier);
      const leveledUp = player.addExp(expAmount);
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

function explodeProjectile(p, projectile, particles) {
  particles.push(...createExplosion(p, projectile.x, projectile.y, [255, 200, 50], 12));
  
  // Deal damage to nearby enemies
  for (const enemy of gameState.enemies) {
    if (enemy.isDead) continue;
    
    const dx = enemy.x - projectile.x;
    const dy = enemy.y - projectile.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < projectile.explosionRadius) {
      const killed = enemy.takeDamage(projectile.damage * 0.5);
      if (killed) {
        handleEnemyDeath(p, enemy, particles);
      }
    }
  }
}

export function handleEnemyDeath(p, enemy, particles) {
  gameState.score += enemy.pointsValue;
  
  // Drop exp gem
  const gem = new ExpGem(enemy.x, enemy.y, enemy.expValue);
  gameState.expGems.push(gem);
  
  // Death particles
  if (p) {
    particles.push(...createExplosion(p, enemy.x, enemy.y, enemy.color, 8));
  }
  
  // Check for boss death
  if (enemy.type === "BOSS") {
    gameState.bossDefeated = true;
  }
}

function generateUpgradeChoices(p) {
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