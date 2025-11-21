// heroAbilities.js - Hero ability system

import { gameState, HERO_ABILITY_COST, HERO_ABILITY_COOLDOWN } from './globals.js';
import { Particle } from './entities.js';

export function activateHeroAbility(p) {
  if (gameState.heroAbilityCooldown > 0) return false;
  if (gameState.energy < HERO_ABILITY_COST) return false;
  
  gameState.energy -= HERO_ABILITY_COST;
  gameState.heroAbilityCooldown = HERO_ABILITY_COOLDOWN;
  
  // Orbital strike - damage all enemies in area
  const strikeX = gameState.cameraX + gameState.cursorX;
  const strikeY = gameState.cameraY + gameState.cursorY;
  const strikeRadius = 150;
  
  let enemiesHit = 0;
  for (const enemy of gameState.enemies) {
    const dist = Math.hypot(enemy.x - strikeX, enemy.y - strikeY);
    if (dist < strikeRadius) {
      const destroyed = enemy.takeDamage(80);
      if (destroyed) {
        gameState.score += enemy.reward;
        gameState.energy = Math.min(gameState.energy + enemy.reward, 300);
        gameState.enemiesKilled++;
        createAbilityParticles(enemy.x, enemy.y, [255, 200, 50]);
      }
      enemiesHit++;
    }
  }
  
  // Visual effect
  createAbilityParticles(strikeX, strikeY, [255, 255, 100], 20);
  
  p.logs.game_info.push({
    data: { action: "HERO_ABILITY", enemiesHit },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

export function updateHeroAbility() {
  if (gameState.heroAbilityCooldown > 0) {
    gameState.heroAbilityCooldown--;
  }
}

export function drawHeroAbilityIndicator(p) {
  if (gameState.heroAbilityCooldown === 0 && gameState.energy >= HERO_ABILITY_COST) {
    const strikeX = gameState.cursorX;
    const strikeY = gameState.cursorY;
    
    p.push();
    p.noFill();
    p.stroke(255, 200, 50, 150);
    p.strokeWeight(2);
    p.circle(strikeX, strikeY, 300);
    p.pop();
  }
}

function createAbilityParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const particle = new Particle(x, y, color);
    particle.vx = (Math.random() - 0.5) * 8;
    particle.vy = (Math.random() - 0.5) * 8;
    particle.lifetime = 60;
    particle.maxLifetime = 60;
    gameState.particles.push(particle);
  }
}