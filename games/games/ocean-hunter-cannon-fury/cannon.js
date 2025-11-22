import { 
  gameState, 
  CANNON_BASE_X, 
  CANNON_BASE_Y, 
  CANNON_LENGTH, 
  CANNON_WIDTH,
  CANNON_ROTATION_STEP,
  MIN_CANNON_ANGLE,
  MAX_CANNON_ANGLE,
  FIRE_RATE_DELAY,
  CANNON_RECOIL_DISTANCE,
  CANNON_RECOIL_DURATION,
  UPGRADES
} from './globals.js';
import { Projectile } from './entities.js';

export function rotateCannon(direction, p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  const rotationSpeed = UPGRADES.ROTATION_SPEED.levels[gameState.upgrades.rotationSpeed];
  gameState.cannon.angle += direction * CANNON_ROTATION_STEP * rotationSpeed;
  gameState.cannon.angle = p.constrain(
    gameState.cannon.angle,
    MIN_CANNON_ANGLE,
    MAX_CANNON_ANGLE
  );
}

export function fireCannon(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  const fireRateMultiplier = UPGRADES.FIRE_RATE.levels[gameState.upgrades.fireRate];
  let adjustedFireRate = FIRE_RATE_DELAY * fireRateMultiplier;
  
  // Rapid fire weapon shoots faster
  const weaponType = UPGRADES.WEAPON_TYPE.levels[gameState.upgrades.weaponType];
  if (weaponType === 'Rapid') {
    adjustedFireRate *= 0.5;
  }
  
  const now = Date.now();
  if (now - gameState.lastShotTime < adjustedFireRate) return;
  
  gameState.lastShotTime = now;
  gameState.cannon.recoiling = true;
  gameState.cannon.recoilStartTime = now;
  
  // Calculate projectile spawn position at cannon tip
  const radians = p.radians(gameState.cannon.angle);
  const tipX = CANNON_BASE_X + p.sin(radians) * CANNON_LENGTH;
  const tipY = CANNON_BASE_Y - p.cos(radians) * CANNON_LENGTH;
  
  // Fire based on weapon type
  if (weaponType === 'Spread') {
    // Fire 3 projectiles in a spread pattern
    const spreadAngles = [-15, 0, 15];
    for (const angleOffset of spreadAngles) {
      const projectile = new Projectile(tipX, tipY, gameState.cannon.angle + angleOffset, p, weaponType);
      gameState.projectiles.push(projectile);
      gameState.entities.push(projectile);
    }
  } else {
    // Fire single projectile
    const projectile = new Projectile(tipX, tipY, gameState.cannon.angle, p, weaponType);
    gameState.projectiles.push(projectile);
    gameState.entities.push(projectile);
  }
  
  // Log firing event
  p.logs.inputs.push({
    input_type: 'fire',
    data: { angle: gameState.cannon.angle, weaponType: weaponType },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateCannon() {
  if (gameState.cannon.recoiling) {
    const elapsed = Date.now() - gameState.cannon.recoilStartTime;
    if (elapsed >= CANNON_RECOIL_DURATION) {
      gameState.cannon.recoiling = false;
    }
  }
}

export function drawCannon(p) {
  p.push();
  
  const recoilOffset = gameState.cannon.recoiling ? CANNON_RECOIL_DISTANCE : 0;
  
  p.translate(CANNON_BASE_X, CANNON_BASE_Y + recoilOffset);
  p.rotate(p.radians(gameState.cannon.angle));
  
  // Draw cannon base
  p.fill(40, 100, 40);
  p.stroke(20, 60, 20);
  p.strokeWeight(2);
  p.rect(-CANNON_WIDTH / 2, 0, CANNON_WIDTH, 15);
  
  // Draw cannon barrel with weapon type coloring
  const weaponType = UPGRADES.WEAPON_TYPE.levels[gameState.upgrades.weaponType];
  let barrelColor = [60, 160, 60];
  if (weaponType === 'Spread') {
    barrelColor = [200, 160, 60];
  } else if (weaponType === 'Piercing') {
    barrelColor = [60, 180, 220];
  } else if (weaponType === 'Rapid') {
    barrelColor = [220, 100, 100];
  }
  
  p.fill(...barrelColor);
  p.stroke(barrelColor[0] * 0.6, barrelColor[1] * 0.6, barrelColor[2] * 0.6);
  p.strokeWeight(2);
  p.beginShape();
  p.vertex(-CANNON_WIDTH / 2, 0);
  p.vertex(-CANNON_WIDTH / 3, -CANNON_LENGTH);
  p.vertex(CANNON_WIDTH / 3, -CANNON_LENGTH);
  p.vertex(CANNON_WIDTH / 2, 0);
  p.endShape(p.CLOSE);
  
  // Draw cannon tip highlight
  p.noStroke();
  p.fill(barrelColor[0] + 40, barrelColor[1] + 60, barrelColor[2] + 40);
  p.circle(0, -CANNON_LENGTH + 5, 8);
  
  p.pop();
}