import { COURT, LEVEL_CONFIG, gameState, SHOT_TYPES } from './globals.js';

export class AIController {
  constructor(opponent) {
    this.opponent = opponent;
    this.reactionDelay = 0;
    this.targetPredicted = false;
  }

  update(p, ball) {
    const config = LEVEL_CONFIG[gameState.level];
    
    // Predict ball landing position
    if (ball && !ball.isServing && ball.lastHitBy !== 'opponent') {
      if (!this.targetPredicted) {
        const landingX = this.predictLandingX(ball);
        this.opponent.setTarget(landingX);
        this.targetPredicted = true;
        
        // Apply reaction delay based on difficulty
        this.opponent.speed = config.opponentSpeed * p.random(0.8, 1.0);
      }
    } else {
      this.targetPredicted = false;
    }

    // Attempt to hit ball
    if (this.opponent.canHitBall(ball) && !ball.isServing && ball.lastHitBy !== 'opponent') {
      this.hitBall(p, ball, config);
    }
  }

  predictLandingX(ball) {
    // Simple prediction based on current velocity
    let futureX = ball.x;
    let futureVx = ball.vx;
    let futureVy = ball.vy;
    let futureY = ball.y;
    
    for (let i = 0; i < 100; i++) {
      futureVy += 0.3;
      futureX += futureVx;
      futureY += futureVy;
      
      if (futureY >= COURT.y + COURT.height - 4) {
        break;
      }
    }
    
    return p5.prototype.constrain(futureX, COURT.x + 20, COURT.x + COURT.width - 20);
  }

  hitBall(p, ball, config) {
    // Determine shot type
    let shotType = SHOT_TYPES.REGULAR;
    const powerRoll = p.random();
    
    if (powerRoll < config.opponentPowerChance) {
      shotType = SHOT_TYPES.POWER;
    }

    // Determine target area (aim for open court)
    const playerX = gameState.player.x;
    let targetX;
    
    if (playerX < COURT.x + COURT.width * 0.5) {
      targetX = COURT.x + COURT.width * 0.7 + p.random(-30, 30);
    } else {
      targetX = COURT.x + COURT.width * 0.3 + p.random(-30, 30);
    }

    // Add inaccuracy
    const accuracy = config.opponentAccuracy;
    targetX += p.random(-50 * (1 - accuracy), 50 * (1 - accuracy));
    targetX = p.constrain(targetX, COURT.x + 20, COURT.x + COURT.width - 20);

    // Calculate angle and speed
    const dx = targetX - ball.x;
    const dy = -100;
    const angle = Math.atan2(dy, dx);
    
    let speed = 8;
    if (shotType === SHOT_TYPES.POWER) {
      speed = 12;
    } else if (shotType === SHOT_TYPES.DROP) {
      speed = 5;
    }

    ball.hit(angle, speed, shotType);
    ball.lastHitBy = 'opponent';
  }
}