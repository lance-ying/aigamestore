import { gameState, SHOT_TYPES, LEVEL_CONFIG } from './globals.js';

export class InputHandler {
  constructor(p) {
    this.p = p;
    this.keys = {};
    this.chargeTime = 0;
    this.maxChargeTime = 60;
    this.chargeDirection = 0;
  }

  update() {
    if (gameState.gamePhase !== 'PLAYING' || !gameState.ballInPlay) return;

    const ball = gameState.ball;
    const player = gameState.player;

    // Check if player can hit ball
    if (player.canHitBall(ball) && ball.lastHitBy !== 'player') {
      // Charge shot when holding arrow key
      if (this.p.keyIsDown(37) || this.p.keyIsDown(39) || 
          this.p.keyIsDown(38) || this.p.keyIsDown(40)) {
        this.chargeTime = Math.min(this.chargeTime + 1, this.maxChargeTime);
        
        // Determine direction
        if (this.p.keyIsDown(37)) this.chargeDirection = -1;
        else if (this.p.keyIsDown(39)) this.chargeDirection = 1;
        else this.chargeDirection = 0;
      }
    }
  }

  handleKeyPressed(keyCode) {
    this.keys[keyCode] = true;

    if (gameState.gamePhase === 'PLAYING' && gameState.ballInPlay) {
      const ball = gameState.ball;
      const player = gameState.player;

      // Execute shot on space or arrow release
      if ((keyCode === 32 || keyCode === 37 || keyCode === 39 || 
           keyCode === 38 || keyCode === 40) && 
          player.canHitBall(ball) && ball.lastHitBy !== 'player') {
        this.executeShot();
      }
    }
  }

  handleKeyReleased(keyCode) {
    this.keys[keyCode] = false;

    // Also try to execute shot on key release
    if (gameState.gamePhase === 'PLAYING' && gameState.ballInPlay) {
      const ball = gameState.ball;
      const player = gameState.player;

      if ((keyCode === 37 || keyCode === 39 || keyCode === 38 || keyCode === 40) &&
          player.canHitBall(ball) && ball.lastHitBy !== 'player' && this.chargeTime > 0) {
        this.executeShot();
      }
    }
  }

  executeShot() {
    const ball = gameState.ball;
    const player = gameState.player;

    if (!player.canHitBall(ball) || ball.lastHitBy === 'player') return;

    // Determine shot type based on charge time
    let shotType = SHOT_TYPES.REGULAR;
    let speed = 8;

    if (this.chargeTime < 15) {
      shotType = SHOT_TYPES.DROP;
      speed = 5;
    } else if (this.chargeTime > 40) {
      shotType = SHOT_TYPES.POWER;
      speed = 12;
    }

    // Determine angle
    let baseAngle = 0;
    if (ball.x < player.x) {
      baseAngle = this.p.PI * 0.7; // Hit forward-left
    } else {
      baseAngle = this.p.PI * 0.3; // Hit forward-right
    }

    // Adjust based on direction input
    if (this.chargeDirection < 0) {
      baseAngle += this.p.PI * 0.1;
    } else if (this.chargeDirection > 0) {
      baseAngle -= this.p.PI * 0.1;
    }

    // Apply aim assist
    const config = LEVEL_CONFIG[gameState.level];
    if (config.aimAssistStrength > 0) {
      const idealAngle = this.p.PI / 2; // Straight forward
      const angleDiff = idealAngle - baseAngle;
      baseAngle += angleDiff * config.aimAssistStrength;
      gameState.aimAssistActive = angleDiff !== 0;
    }

    ball.hit(baseAngle, speed, shotType);
    ball.lastHitBy = 'player';
    gameState.lastShotType = shotType;

    // Reset charge
    this.chargeTime = 0;
    this.chargeDirection = 0;
  }
}