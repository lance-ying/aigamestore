// weapons.js - Weapon system
import { gameState, WEAPONS, CANVAS_HEIGHT } from './globals.js';
import { Projectile } from './projectile.js';
import { createImpactParticles } from './particle.js';

export function useWeapon(p, Matter, buddy, mouseX, mouseY) {
  const weapon = WEAPONS[gameState.selectedWeaponIndex];
  
  if (!weapon.unlocked && gameState.selectedWeaponIndex >= 2) {
    return;
  }
  
  const center = buddy.getCenter();
  
  switch (weapon.name) {
    case "Kick":
      performKick(p, Matter, buddy, mouseX, mouseY);
      break;
    case "Pistol":
      firePistol(p, Matter, center, mouseX, mouseY);
      break;
    case "Grenade":
      throwGrenade(p, Matter, center, mouseX, mouseY);
      break;
    case "Laser":
      fireLaser(p, Matter, buddy, mouseX, mouseY);
      break;
    case "Black Hole":
      useBlackHole(p, Matter, buddy, mouseX, mouseY);
      break;
  }
}

function performKick(p, Matter, buddy, mouseX, mouseY) {
  const Body = Matter.Body;
  const forceScale = gameState.isPrecisionMode ? 0.003 : 0.005;
  
  buddy.applyForce(mouseX, mouseY, 
    Math.cos(p.random(0, p.TWO_PI)) * forceScale,
    Math.cos(p.random(0, p.TWO_PI)) * forceScale
  );
  
  gameState.score += 10;
  
  const particles = createImpactParticles(p, mouseX, mouseY, [255, 255, 100], 12);
  gameState.particles.push(...particles);
  
  addCombo();
}

function firePistol(p, Matter, center, mouseX, mouseY) {
  const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
  const speed = gameState.isPrecisionMode ? 5 : 8;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  
  const projectile = new Projectile(p, Matter, center.x, center.y, vx, vy, 'pistol');
  gameState.projectiles.push(projectile);
}

function throwGrenade(p, Matter, center, mouseX, mouseY) {
  const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
  const speed = gameState.isPrecisionMode ? 4 : 6;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  
  const projectile = new Projectile(p, Matter, center.x, center.y, vx, vy, 'grenade');
  gameState.projectiles.push(projectile);
}

function fireLaser(p, Matter, buddy, mouseX, mouseY) {
  const Body = Matter.Body;
  const center = buddy.getCenter();
  
  // Raycast to find hit
  let hitPart = null;
  let minDist = Infinity;
  
  for (let part of buddy.parts) {
    const dx = part.position.x - center.x;
    const dy = part.position.y - center.y;
    const toMouseX = mouseX - center.x;
    const toMouseY = mouseY - center.y;
    
    // Simple raycast approximation
    const dotProduct = dx * toMouseX + dy * toMouseY;
    const lengthSq = toMouseX * toMouseX + toMouseY * toMouseY;
    
    if (dotProduct > 0 && dotProduct < lengthSq) {
      const dist = Math.abs(dx * toMouseY - dy * toMouseX) / Math.sqrt(lengthSq);
      if (dist < 20 && dotProduct / Math.sqrt(lengthSq) < minDist) {
        minDist = dotProduct / Math.sqrt(lengthSq);
        hitPart = part;
      }
    }
  }
  
  if (hitPart) {
    const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
    const force = gameState.isPrecisionMode ? 0.0005 : 0.001;
    
    Body.applyForce(hitPart, hitPart.position, {
      x: Math.cos(angle) * force,
      y: Math.sin(angle) * force
    });
    
    gameState.score += 5;
    
    if (p.frameCount % 5 === 0) {
      const particles = createImpactParticles(p, hitPart.position.x, hitPart.position.y, 
        [255, 50, 50], 3);
      gameState.particles.push(...particles);
    }
  }
}

function useBlackHole(p, Matter, buddy, mouseX, mouseY) {
  const Body = Matter.Body;
  const pullRadius = gameState.isPrecisionMode ? 100 : 150;
  
  for (let part of buddy.parts) {
    const dx = mouseX - part.position.x;
    const dy = mouseY - part.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < pullRadius) {
      const force = 0.002 * (1 - dist / pullRadius);
      const angle = Math.atan2(dy, dx);
      
      Body.applyForce(part, part.position, {
        x: Math.cos(angle) * force,
        y: Math.sin(angle) * force
      });
    }
  }
  
  gameState.score += 75;
  addCombo();
  
  // Visual effect
  for (let i = 0; i < 20; i++) {
    const angle = p.random(0, p.TWO_PI);
    const dist = p.random(20, pullRadius);
    const x = mouseX + Math.cos(angle) * dist;
    const y = mouseY + Math.sin(angle) * dist;
    const vx = -Math.cos(angle) * 3;
    const vy = -Math.sin(angle) * 3;
    
    const particles = createImpactParticles(p, x, y, [100, 50, 200], 1);
    gameState.particles.push(...particles);
  }
}

function addCombo() {
  const currentTime = Date.now();
  if (currentTime - gameState.lastHitTime < 1000) {
    gameState.comboCount++;
    if (gameState.comboCount >= 3) {
      const comboBonus = gameState.comboCount === 3 ? 50 :
                        gameState.comboCount === 4 ? 100 : 150;
      gameState.score += comboBonus;
    }
  } else {
    gameState.comboCount = 1;
  }
  gameState.lastHitTime = currentTime;
  gameState.comboTimer = 60;
}

export function drawWeaponUI(p) {
  p.push();
  
  const startX = 20;
  const startY = CANVAS_HEIGHT - 50;
  const buttonW = 60;
  const buttonH = 40;
  const spacing = 10;
  
  for (let i = 0; i < WEAPONS.length; i++) {
    const weapon = WEAPONS[i];
    const x = startX + i * (buttonW + spacing);
    
    const isSelected = i === gameState.selectedWeaponIndex;
    const isUnlocked = weapon.unlocked || i < 2;
    
    // Button background
    if (isSelected) {
      p.fill(100, 150, 255);
    } else if (isUnlocked) {
      p.fill(80, 80, 100);
    } else {
      p.fill(50, 50, 50);
    }
    
    p.stroke(isSelected ? 255 : 100);
    p.strokeWeight(2);
    p.rect(x, startY, buttonW, buttonH, 5);
    
    // Weapon icon/text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    
    const shortName = weapon.name === "Black Hole" ? "BH" : 
                     weapon.name.substring(0, 4);
    p.text(shortName, x + buttonW / 2, startY + buttonH / 2);
    
    if (!isUnlocked) {
      p.fill(255, 200, 0);
      p.textSize(8);
      p.text(`${weapon.cost}c`, x + buttonW / 2, startY + buttonH + 10);
    }
  }
  
  p.pop();
}

export function drawLaser(p, centerX, centerY, mouseX, mouseY) {
  p.push();
  p.stroke(255, 50, 50, 200);
  p.strokeWeight(3);
  p.line(centerX, centerY, mouseX, mouseY);
  
  p.stroke(255, 200, 200, 150);
  p.strokeWeight(1);
  p.line(centerX, centerY, mouseX, mouseY);
  p.pop();
}

export function drawBlackHole(p, mouseX, mouseY) {
  p.push();
  
  const radius = 30 + Math.sin(p.frameCount * 0.1) * 5;
  
  // Outer ring
  p.noFill();
  p.stroke(100, 50, 200, 150);
  p.strokeWeight(3);
  p.circle(mouseX, mouseY, radius * 2);
  
  // Inner circle
  p.fill(20, 10, 40);
  p.noStroke();
  p.circle(mouseX, mouseY, radius);
  
  // Spiral effect
  for (let i = 0; i < 5; i++) {
    const angle = p.frameCount * 0.05 + i * p.TWO_PI / 5;
    const r = radius * 0.7;
    const x = mouseX + Math.cos(angle) * r;
    const y = mouseY + Math.sin(angle) * r;
    p.fill(150, 100, 255, 100);
    p.circle(x, y, 5);
  }
  
  p.pop();
}