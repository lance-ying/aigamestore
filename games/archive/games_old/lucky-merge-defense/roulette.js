// roulette.js - Roulette wheel system
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Unit } from './units.js';

const ROULETTE_REWARDS = [
  { type: 'currency', amount: 20, color: [100, 255, 100], label: '+20$' },
  { type: 'currency', amount: 30, color: [100, 255, 100], label: '+30$' },
  { type: 'unit', unitType: 'Cannon', color: [255, 200, 100], label: 'Cannon' },
  { type: 'buff', buffType: 'attack', color: [255, 100, 255], label: '+ATK' },
  { type: 'currency', amount: 10, color: [100, 255, 100], label: '+10$' },
  { type: 'currency', amount: 50, color: [100, 255, 100], label: '+50$' }
];

export function spinRoulette(p) {
  if (gameState.rouletteActive) return;
  
  const config = gameState.levelConfigs[gameState.level - 1];
  if (gameState.currency < config.rouletteCost) return;
  
  gameState.currency -= config.rouletteCost;
  gameState.rouletteActive = true;
  gameState.rouletteSpeed = 0.5;
  gameState.rouletteAngle = 0;
  
  // Pick a reward
  const targetIndex = Math.floor(p.random(ROULETTE_REWARDS.length));
  const targetAngle = (targetIndex / ROULETTE_REWARDS.length) * p.TWO_PI;
  const extraSpins = 3 * p.TWO_PI;
  
  // Calculate total rotation needed
  const totalRotation = extraSpins + targetAngle;
  gameState.rouletteTargetAngle = totalRotation;
  gameState.rouletteReward = ROULETTE_REWARDS[targetIndex];
}

export function updateRoulette(p) {
  if (!gameState.rouletteActive) return;
  
  gameState.rouletteAngle += gameState.rouletteSpeed;
  gameState.rouletteSpeed *= 0.98;
  
  if (gameState.rouletteSpeed < 0.01) {
    gameState.rouletteActive = false;
    applyRouletteReward(gameState.rouletteReward, p);
  }
}

function applyRouletteReward(reward, p) {
  if (reward.type === 'currency') {
    gameState.currency += reward.amount;
  } else if (reward.type === 'unit') {
    // Add temporary powerful unit
    const emptySpots = [];
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 10; gx++) {
        if (!gameState.grid[gy][gx]) {
          emptySpots.push({ gx, gy });
        }
      }
    }
    
    if (emptySpots.length > 0) {
      const spot = p.random(emptySpots);
      const tempUnit = new Unit(reward.unitType, 'Epic', spot.gx, spot.gy, p);
      tempUnit.isTemporary = true;
      tempUnit.lifetimeTimer = 1800; // 30 seconds at 60 FPS
      gameState.units.push(tempUnit);
      gameState.grid[spot.gy][spot.gx] = tempUnit;
    }
  } else if (reward.type === 'buff') {
    gameState.globalAttackBuff = 1.2;
    gameState.buffTimer = 900; // 15 seconds
  }
}

export function drawRoulette(p) {
  if (!gameState.rouletteActive && gameState.gamePhase !== 'PLAYING') return;
  
  const centerX = CANVAS_WIDTH - 80;
  const centerY = CANVAS_HEIGHT - 80;
  const radius = 40;
  
  p.push();
  
  // Draw wheel
  const segmentAngle = p.TWO_PI / ROULETTE_REWARDS.length;
  
  for (let i = 0; i < ROULETTE_REWARDS.length; i++) {
    const startAngle = i * segmentAngle - gameState.rouletteAngle;
    const endAngle = (i + 1) * segmentAngle - gameState.rouletteAngle;
    
    p.fill(...ROULETTE_REWARDS[i].color);
    p.stroke(0);
    p.strokeWeight(2);
    p.arc(centerX, centerY, radius * 2, radius * 2, startAngle, endAngle, p.PIE);
  }
  
  // Draw pointer
  p.fill(255, 0, 0);
  p.noStroke();
  p.triangle(centerX, centerY - radius - 10, centerX - 5, centerY - radius, centerX + 5, centerY - radius);
  
  // Center circle
  p.fill(50);
  p.stroke(255);
  p.strokeWeight(2);
  p.circle(centerX, centerY, 15);
  
  // Label
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text('SPIN', centerX, centerY + radius + 15);
  
  const config = gameState.levelConfigs[gameState.level - 1];
  p.text(`Z: $${config.rouletteCost}`, centerX, centerY + radius + 28);
  
  p.pop();
}