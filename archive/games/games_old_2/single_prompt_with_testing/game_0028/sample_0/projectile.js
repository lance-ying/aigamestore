// projectile.js - Projectile and pickup systems

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function updateProjectiles(p) {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.age++;
    
    // Remove if out of bounds or expired
    if (
      proj.x < -10 || proj.x > CANVAS_WIDTH + 10 ||
      proj.y < -10 || proj.y > CANVAS_HEIGHT + 10 ||
      proj.age > proj.lifespan
    ) {
      gameState.projectiles.splice(i, 1);
      continue;
    }
    
    // Check collision with enemies
    let hitEnemy = false;
    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j];
      const dist = Math.sqrt(
        (proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2
      );
      
      if (dist < proj.radius + enemy.radius) {
        // Damage enemy
        const defeated = enemy.takeDamage(proj.damage);
        gameState.totalDamageDealt += proj.damage;
        
        if (defeated) {
          // Remove enemy
          gameState.enemies.splice(j, 1);
          gameState.entities.splice(gameState.entities.indexOf(enemy), 1);
          gameState.enemiesDefeated++;
          gameState.score += enemy.expValue;
          
          // Drop experience pickup
          createPickup(enemy.x, enemy.y, "exp", enemy.expValue);
        }
        
        hitEnemy = true;
        break;
      }
    }
    
    if (hitEnemy) {
      gameState.projectiles.splice(i, 1);
    }
  }
}

export function renderProjectiles(p) {
  p.push();
  p.fill(255, 255, 100);
  p.noStroke();
  
  for (const proj of gameState.projectiles) {
    p.circle(proj.x, proj.y, proj.radius * 2);
    
    // Trail effect
    p.fill(255, 255, 100, 100);
    p.circle(proj.x - proj.vx * 0.5, proj.y - proj.vy * 0.5, proj.radius);
  }
  
  p.pop();
}

export function createPickup(x, y, type, value) {
  const pickup = {
    x,
    y,
    type,
    value,
    radius: type === "exp" ? 6 : 8,
    age: 0,
    maxAge: 600, // 10 seconds
    collected: false
  };
  
  gameState.pickups.push(pickup);
}

export function updatePickups(p) {
  if (!gameState.player) return;
  
  for (let i = gameState.pickups.length - 1; i >= 0; i--) {
    const pickup = gameState.pickups[i];
    pickup.age++;
    
    // Remove expired pickups
    if (pickup.age > pickup.maxAge) {
      gameState.pickups.splice(i, 1);
      continue;
    }
    
    // Check collection
    const dist = Math.sqrt(
      (pickup.x - gameState.player.x) ** 2 +
      (pickup.y - gameState.player.y) ** 2
    );
    
    if (dist < pickup.radius + gameState.player.radius + 10) {
      if (pickup.type === "exp") {
        gameState.player.addExperience(pickup.value);
      }
      gameState.pickups.splice(i, 1);
    }
  }
}

export function renderPickups(p) {
  p.push();
  
  for (const pickup of gameState.pickups) {
    const pulse = p.sin(pickup.age * 0.15) * 0.2 + 1;
    const renderRadius = pickup.radius * pulse;
    
    if (pickup.type === "exp") {
      p.fill(100, 200, 255);
      p.stroke(50, 150, 255);
    } else {
      p.fill(255, 215, 0);
      p.stroke(200, 165, 0);
    }
    
    p.strokeWeight(2);
    
    // Star shape for pickups
    p.push();
    p.translate(pickup.x, pickup.y);
    p.rotate(pickup.age * 0.05);
    
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? renderRadius : renderRadius * 0.5;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
  
  p.pop();
}