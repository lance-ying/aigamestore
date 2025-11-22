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
  const adjustedFireRate = FIRE_RATE_DELAY * fireRateMultiplier;
  
  const now = Date.now();
  if (now - gameState.lastShotTime < adjustedFireRate) return;
  
  gameState.lastShotTime = now;
  gameState.cannon.recoiling = true;
  gameState.cannon.recoilStartTime = now;
  
  // Calculate projectile spawn position at cannon tip
  const radians = p.radians(gameState.cannon.angle);
  const tipX = CANNON_BASE_X + p.sin(radians) * CANNON_LENGTH;
  const tipY = CANNON_BASE_Y - p.cos(radians) * CANNON_LENGTH;
  
  const projectile = new Projectile(tipX, tipY, gameState.cannon.angle, p);
  gameState.projectiles.push(projectile);
  gameState.entities.push(projectile);
  
  // Log firing event
  p.logs.inputs.push({
    input_type: 'fire',
    data: { angle: gameState.cannon.angle },
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
  
  // Draw cannon barrel
  p.fill(60, 160, 60);
  p.stroke(30, 100, 30);
  p.strokeWeight(2);
  p.beginShape();
  p.vertex(-CANNON_WIDTH / 2, 0);
  p.vertex(-CANNON_WIDTH / 3, -CANNON_LENGTH);
  p.vertex(CANNON_WIDTH / 3, -CANNON_LENGTH);
  p.vertex(CANNON_WIDTH / 2, 0);
  p.endShape(p.CLOSE);
  
  // Draw cannon tip highlight
  p.noStroke();
  p.fill(100, 220, 100);
  p.circle(0, -CANNON_LENGTH + 5, 8);
  
  p.pop();
}