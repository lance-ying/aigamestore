// combat.js
import { gameState } from './globals.js';
import { Loot } from './loot.js';
import { Projectile } from './projectile.js';
import { createHitParticles, createDeathParticles } from './particle.js';

export function handleCombat(p, player, enemies, projectiles, particles) {
  // Player attacks enemies
  if (player.attackHitbox) {
    for (let enemy of enemies) {
      if (enemy.dead) continue;
      
      if (checkCollision(player.attackHitbox, enemy)) {
        const damage = enemy.takeDamage(player.attackHitbox.damage);
        updateCombo(p);
        
        // Create MORE hit particles for better feedback
        particles.push(...createHitParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 12));
        
        // Add bright flash particles at hit point
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 2;
          const hitParticle = {
            x: enemy.x + enemy.width/2,
            y: enemy.y + enemy.height/2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            color: [255, 220, 100],
            size: Math.random() * 4 + 3,
            life: 20,
            maxLife: 20,
            dead: false,
            update: function() {
              this.x += this.vx;
              this.y += this.vy;
              this.vy += 0.2;
              this.life--;
              if (this.life <= 0) this.dead = true;
            },
            draw: function(p, cameraX) {
              p.push();
              const alpha = 255 * (this.life / this.maxLife);
              p.fill(this.color[0], this.color[1], this.color[2], alpha);
              p.noStroke();
              p.ellipse(this.x - cameraX, this.y, this.size, this.size);
              p.pop();
            }
          };
          particles.push(hitParticle);
        }
        
        // Show damage number
        createDamageNumber(p, enemy.x + enemy.width/2, enemy.y, damage, false);
        
        if (enemy.dead) {
          handleEnemyDeath(p, enemy);
        }
      }
    }
  }
  
  // Enemies attack player
  for (let enemy of enemies) {
    if (enemy.dead) continue;
    
    const distToPlayer = Math.abs(player.x - enemy.x);
    
    // Melee attacks
    if (distToPlayer < 60 && enemy.canAttack() && enemy.type !== 'archer') {
      const hitbox = enemy.performAttack();
      if (checkCollision(hitbox, player)) {
        const damage = player.takeDamage(hitbox.damage);
        if (damage > 0) {
          particles.push(...createHitParticles(player.x + player.width/2, player.y + player.height/2, 5));
          createDamageNumber(p, player.x + player.width/2, player.y, damage, true);
        }
      }
    }
    
    // Archer shoots
    if (enemy.type === 'archer' && distToPlayer < 400 && distToPlayer > 100 && enemy.canShoot()) {
      const proj = enemy.shoot();
      projectiles.push(new Projectile(proj));
    }
    
    // Boss special attacks
    if (enemy.type === 'boss' && enemy.specialAttackTimer === 0) {
      enemy.specialAttackTimer = enemy.phase === 1 ? 150 : 100;
      
      // Create multiple projectiles or AoE
      if (Math.random() > 0.5) {
        // Projectile volley
        for (let i = -1; i <= 1; i++) {
          projectiles.push(new Projectile({
            x: enemy.x + enemy.width/2,
            y: enemy.y + enemy.height/2,
            vx: (enemy.facingRight ? 7 : -7) + i * 2,
            vy: i * 2,
            width: 15,
            height: 15,
            damage: enemy.attackPower * 1.5,
            owner: 'enemy',
            type: 'projectile'
          }));
        }
      } else {
        // AoE slam
        projectiles.push(new Projectile({
          x: enemy.x - 100,
          y: enemy.y + enemy.height - 20,
          vx: 0,
          vy: 0,
          width: enemy.width + 200,
          height: 40,
          damage: enemy.attackPower * 2,
          duration: 20,
          owner: 'enemy',
          type: 'aoe'
        }));
      }
    }
  }
  
  // Projectile collisions
  for (let proj of projectiles) {
    if (proj.dead) continue;
    
    if (proj.owner === 'player') {
      // Hit enemies
      for (let enemy of enemies) {
        if (enemy.dead) continue;
        if (checkCollision(proj, enemy)) {
          const damage = enemy.takeDamage(proj.damage);
          updateCombo(p);
          particles.push(...createHitParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 10));
          createDamageNumber(p, enemy.x + enemy.width/2, enemy.y, damage, false);
          
          if (proj.type === 'projectile') {
            proj.dead = true;
          }
          
          if (enemy.dead) {
            handleEnemyDeath(p, enemy);
          }
        }
      }
    } else {
      // Hit player
      if (checkCollision(proj, player)) {
        const damage = player.takeDamage(proj.damage);
        if (damage > 0) {
          particles.push(...createHitParticles(player.x + player.width/2, player.y + player.height/2, 5));
          createDamageNumber(p, player.x + player.width/2, player.y, damage, true);
        }
        if (proj.type === 'projectile') {
          proj.dead = true;
        }
      }
    }
  }
}

function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function handleEnemyDeath(p, enemy) {
  // Award XP and score
  gameState.player.gainXP(enemy.xpValue);
  gameState.score += enemy.scoreValue;
  
  // Create death particles
  gameState.particles.push(...createDeathParticles(enemy.x, enemy.y, enemy.width, enemy.height));
  
  // Drop loot
  const goldChance = 0.8;
  const potionChance = 0.3;
  
  if (Math.random() < goldChance) {
    for (let i = 0; i < (enemy.isBoss ? 10 : 3); i++) {
      gameState.loot.push(new Loot(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'gold'));
    }
  }
  
  if (Math.random() < potionChance) {
    const potionType = Math.random() > 0.5 ? 'health' : 'mana';
    gameState.loot.push(new Loot(enemy.x + enemy.width/2, enemy.y + enemy.height/2, potionType));
  }
  
  // Boss death - level complete
  if (enemy.isBoss) {
    gameState.score += 1000; // Level completion bonus
  }
}

function updateCombo(p) {
  gameState.comboCount++;
  gameState.comboTimer = 45; // 0.75 seconds at 60fps
  
  // Award combo bonuses
  if (gameState.comboCount === 3 && gameState.lastComboBonus < 3) {
    gameState.score += 10;
    gameState.lastComboBonus = 3;
  } else if (gameState.comboCount === 5 && gameState.lastComboBonus < 5) {
    gameState.score += 25;
    gameState.lastComboBonus = 5;
  } else if (gameState.comboCount === 10 && gameState.lastComboBonus < 10) {
    gameState.score += 75;
    gameState.lastComboBonus = 10;
  } else if (gameState.comboCount >= 20 && gameState.comboCount % 10 === 0) {
    gameState.score += 75;
  }
}

export function updateComboTimer() {
  if (gameState.comboTimer > 0) {
    gameState.comboTimer--;
    if (gameState.comboTimer === 0) {
      gameState.comboCount = 0;
      gameState.lastComboBonus = 0;
    }
  }
}

function createDamageNumber(p, x, y, damage, isPlayer) {
  // This would create floating damage text, simplified here
  // Could be added to particles system for animation
}