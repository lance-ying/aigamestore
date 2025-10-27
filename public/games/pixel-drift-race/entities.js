// entities.js - Game entity classes

import { 
  PLAYER_CAR_WIDTH, PLAYER_CAR_HEIGHT, PLAYER_START_Y,
  BASELINE_SPEED, MAX_SPEED, SPEED_BOOST, ACCELERATION, DECELERATION, 
  CONTINUOUS_DECELERATION, LANE_CHANGE_SPEED,
  MAX_HEALTH, DRIFT_SPEED_THRESHOLD, DRIFT_DURATION_FOR_BONUS,
  DRIFT_POINTS, DRIFT_BOOST_MULTIPLIER, NUM_LANES, LANE_WIDTH,
  TRACK_X_OFFSET, RIVAL_CAR_WIDTH, RIVAL_CAR_HEIGHT,
  OBSTACLE_DAMAGE, RIVAL_DAMAGE, BOSS_DAMAGE, BOSS_WIDTH,
  BOSS_HEIGHT, BOSS_MAX_HEALTH, CANVAS_WIDTH, CANVAS_HEIGHT,
  POINTS_OVERTAKE, gameState, UPGRADE_EFFECTS
} from './globals.js';

export class PlayerCar {
  constructor(p, lane) {
    this.p = p;
    this.lane = lane;
    this.x = TRACK_X_OFFSET + lane * LANE_WIDTH + LANE_WIDTH / 2;
    this.y = PLAYER_START_Y;
    this.targetX = this.x;
    this.speed = 0; // Start at zero speed
    this.maxSpeed = MAX_SPEED;
    this.health = MAX_HEALTH;
    this.width = PLAYER_CAR_WIDTH;
    this.height = PLAYER_CAR_HEIGHT;
    this.isDrifting = false;
    this.driftFrames = 0;
    this.driftBonus = false;
    this.tiltAngle = 0;
    this.invulnerableFrames = 0;
    this.flashTimer = 0;
    this.exhaustParticles = [];
    this.driftTrails = [];
    this.color = [100, 220, 100];
    this.prevUpPressed = false; // Track previous Up key state for press detection
  }

  update() {
    // Apply upgrades
    const engineBoost = gameState.upgrades.engine > 0 ? UPGRADE_EFFECTS.engine[gameState.upgrades.engine - 1] : 1;
    const accelBoost = gameState.upgrades.acceleration > 0 ? UPGRADE_EFFECTS.acceleration[gameState.upgrades.acceleration - 1] : 1;
    const handlingBoost = gameState.upgrades.handling > 0 ? UPGRADE_EFFECTS.handling[gameState.upgrades.handling - 1] : 1;

    this.maxSpeed = MAX_SPEED * engineBoost;
    
    // Detect Up key press (transition from not pressed to pressed)
    const upJustPressed = gameState.inputState.up && !this.prevUpPressed;
    if (upJustPressed) {
      // Add speed boost on tap
      const boost = SPEED_BOOST * accelBoost;
      this.speed = this.p.min(this.speed + boost, this.maxSpeed);
      
      // Add exhaust particles
      for (let i = 0; i < 5; i++) {
        this.exhaustParticles.push({
          x: this.x,
          y: this.y + this.height / 2,
          life: 20,
          alpha: 150
        });
      }
    }
    this.prevUpPressed = gameState.inputState.up;

    // Always decelerate gradually
    this.speed = this.p.max(0, this.speed - CONTINUOUS_DECELERATION);

    // Handle steering with neutralization when opposite direction is pressed
    const laneChangeSpeed = LANE_CHANGE_SPEED * handlingBoost;
    const movingLeft = this.targetX < this.x;
    const movingRight = this.targetX > this.x;
    
    // If moving in one direction and opposite key is pressed, neutralize to straight
    if (movingLeft && gameState.inputState.right && !gameState.inputState.left) {
      // Moving left but right is pressed - stop and go straight
      this.targetX = this.x;
    } else if (movingRight && gameState.inputState.left && !gameState.inputState.right) {
      // Moving right but left is pressed - stop and go straight
      this.targetX = this.x;
    } else if (gameState.inputState.left && !gameState.inputState.right) {
      // Only left pressed - move left
      const minX = TRACK_X_OFFSET + LANE_WIDTH / 2;
      if (this.x > minX) {
        this.targetX = this.p.max(minX, this.x - laneChangeSpeed);
      }
    } else if (gameState.inputState.right && !gameState.inputState.left) {
      // Only right pressed - move right
      const maxX = TRACK_X_OFFSET + (NUM_LANES - 1) * LANE_WIDTH + LANE_WIDTH / 2;
      if (this.x < maxX) {
        this.targetX = this.p.min(maxX, this.x + laneChangeSpeed);
      }
    }

    // Move towards target position
    if (this.x < this.targetX) {
      this.x = this.p.min(this.x + laneChangeSpeed, this.targetX);
      this.tiltAngle = this.p.lerp(this.tiltAngle, 0.1, 0.2);
    } else if (this.x > this.targetX) {
      this.x = this.p.max(this.x - laneChangeSpeed, this.targetX);
      this.tiltAngle = this.p.lerp(this.tiltAngle, -0.1, 0.2);
    } else {
      this.tiltAngle = this.p.lerp(this.tiltAngle, 0, 0.2);
    }

    // Update lane based on current position
    for (let i = 0; i < NUM_LANES; i++) {
      const laneCenter = TRACK_X_OFFSET + i * LANE_WIDTH + LANE_WIDTH / 2;
      if (this.p.abs(this.x - laneCenter) < LANE_WIDTH / 4) {
        this.lane = i;
        break;
      }
    }

    // Handle drifting
    const isChangingLanes = this.x !== this.targetX;
    if (gameState.inputState.space && isChangingLanes && this.speed > DRIFT_SPEED_THRESHOLD) {
      this.isDrifting = true;
      this.driftFrames++;
      
      // Add drift trails
      if (this.p.frameCount % 2 === 0) {
        this.driftTrails.push({
          x: this.x - 10,
          y: this.y + this.height / 2,
          life: 30,
          alpha: 180
        });
        this.driftTrails.push({
          x: this.x + 10,
          y: this.y + this.height / 2,
          life: 30,
          alpha: 180
        });
      }

      if (this.driftFrames >= DRIFT_DURATION_FOR_BONUS && !this.driftBonus) {
        this.driftBonus = true;
        gameState.score += DRIFT_POINTS * gameState.driftChainMultiplier;
        gameState.consecutiveDrifts++;
        gameState.driftChainMultiplier = this.p.min(5, 1 + gameState.consecutiveDrifts * 0.5);
        this.speed = this.p.min(this.speed * DRIFT_BOOST_MULTIPLIER, this.maxSpeed * 1.2);
      }
    } else {
      if (this.isDrifting && this.driftFrames > 0) {
        // Reset drift
        this.isDrifting = false;
        this.driftFrames = 0;
        this.driftBonus = false;
      }
    }

    // Update particles
    this.exhaustParticles = this.exhaustParticles.filter(p => {
      p.life--;
      p.alpha -= 7.5;
      p.y += 2;
      return p.life > 0;
    });

    this.driftTrails = this.driftTrails.filter(t => {
      t.life--;
      t.alpha -= 6;
      t.y += gameState.scrollSpeed;
      return t.life > 0;
    });

    // Update invulnerability
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames--;
      this.flashTimer++;
    }
  }

  takeDamage(amount) {
    if (this.invulnerableFrames > 0) return;
    
    this.health = this.p.max(0, this.health - amount);
    this.invulnerableFrames = 60;
    this.flashTimer = 0;
    gameState.noCollisionBonus = false;
    gameState.driftChainMultiplier = 1;
    gameState.consecutiveDrifts = 0;
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.tiltAngle);

    // Draw drift trails
    this.driftTrails.forEach(trail => {
      p.stroke(255, 255, 255, trail.alpha);
      p.strokeWeight(3);
      p.point(trail.x - this.x, trail.y - this.y);
    });

    // Draw exhaust particles
    this.exhaustParticles.forEach(particle => {
      p.fill(100, 100, 100, particle.alpha);
      p.noStroke();
      p.circle(particle.x - this.x, particle.y - this.y, 4);
    });

    // Flash when hit
    const isFlashing = this.invulnerableFrames > 0 && this.flashTimer % 8 < 4;
    if (!isFlashing) {
      // Car body
      p.fill(...this.color);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 5);

      // Windshield
      p.fill(150, 200, 255, 150);
      p.rect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, 15);

      // Wheels
      p.fill(40);
      p.rect(-this.width / 2 - 3, -this.height / 2 + 10, 6, 12);
      p.rect(this.width / 2 - 3, -this.height / 2 + 10, 6, 12);
      p.rect(-this.width / 2 - 3, this.height / 2 - 22, 6, 12);
      p.rect(this.width / 2 - 3, this.height / 2 - 22, 6, 12);

      // Tail lights (brake lights)
      if (gameState.inputState.space) {
        p.fill(255, 0, 0);
        p.noStroke();
        p.circle(-this.width / 2 + 5, this.height / 2 - 5, 4);
        p.circle(this.width / 2 - 5, this.height / 2 - 5, 4);
      }
    }

    p.pop();

    // Draw health bar
    this.renderHealthBar();
  }

  renderHealthBar() {
    const p = this.p;
    const barWidth = 40;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y + this.height / 2 + 10;
    
    const healthPercent = this.health / MAX_HEALTH;
    
    p.fill(50);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    const healthColor = healthPercent > 0.5 ? [100, 220, 100] : healthPercent > 0.25 ? [220, 180, 50] : [220, 50, 50];
    p.fill(...healthColor);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
  }
}

export class RivalCar {
  constructor(p, lane, speed, y = -50) {
    this.p = p;
    this.lane = lane;
    this.x = TRACK_X_OFFSET + lane * LANE_WIDTH + LANE_WIDTH / 2;
    this.y = y;
    this.speed = speed;
    this.width = RIVAL_CAR_WIDTH;
    this.height = RIVAL_CAR_HEIGHT;
    this.hasBeenOvertaken = false;
    this.color = this.generateColor();
  }

  generateColor() {
    const colors = [
      [200, 50, 50],
      [50, 100, 200],
      [200, 200, 50],
      [150, 50, 200],
      [200, 100, 50]
    ];
    return colors[Math.floor(this.p.random() * colors.length)];
  }

  update() {
    this.y += gameState.scrollSpeed - this.speed;

    // Check if overtaken by player
    if (!this.hasBeenOvertaken && gameState.player && this.y > gameState.player.y) {
      this.hasBeenOvertaken = true;
      gameState.score += POINTS_OVERTAKE;
    }

    // Simple AI: occasionally change lanes
    if (this.p.random() < 0.002) {
      const newLane = this.p.floor(this.p.random(NUM_LANES));
      this.lane = newLane;
      this.x = TRACK_X_OFFSET + newLane * LANE_WIDTH + LANE_WIDTH / 2;
    }
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);

    // Car body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 4);

    // Windshield
    p.fill(100, 150, 200, 150);
    p.rect(-this.width / 2 + 4, this.height / 2 - 15, this.width - 8, 10);

    // Wheels
    p.fill(40);
    p.rect(-this.width / 2 - 2, -this.height / 2 + 8, 5, 10);
    p.rect(this.width / 2 - 3, -this.height / 2 + 8, 5, 10);
    p.rect(-this.width / 2 - 2, this.height / 2 - 18, 5, 10);
    p.rect(this.width / 2 - 3, this.height / 2 - 18, 5, 10);

    p.pop();
  }

  isOffScreen() {
    return this.y > CANVAS_HEIGHT + 50;
  }
}

export class Obstacle {
  constructor(p, type, lane, y = -50) {
    this.p = p;
    this.type = type; // 'pothole', 'barrier', 'oil', 'ramp'
    this.lane = lane;
    this.x = TRACK_X_OFFSET + lane * LANE_WIDTH + LANE_WIDTH / 2;
    this.y = y;
    this.width = this.getWidth();
    this.height = this.getHeight();
  }

  getWidth() {
    switch (this.type) {
      case 'pothole': return 20;
      case 'barrier': return LANE_WIDTH - 20;
      case 'oil': return 40;
      case 'ramp': return 60;
      default: return 30;
    }
  }

  getHeight() {
    switch (this.type) {
      case 'pothole': return 20;
      case 'barrier': return 15;
      case 'oil': return 30;
      case 'ramp': return 20;
      default: return 30;
    }
  }

  update() {
    this.y += gameState.scrollSpeed;
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);

    switch (this.type) {
      case 'pothole':
        p.fill(30, 30, 30);
        p.stroke(50);
        p.strokeWeight(2);
        p.circle(0, 0, this.width);
        p.fill(40, 40, 40);
        p.circle(0, 0, this.width * 0.6);
        break;

      case 'barrier':
        p.fill(200, 200, 50);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        // Stripes
        for (let i = 0; i < 4; i++) {
          p.fill(0);
          p.rect(-this.width / 2 + i * 20, -this.height / 2, 10, this.height);
        }
        break;

      case 'oil':
        p.fill(20, 20, 40, 180);
        p.noStroke();
        p.ellipse(0, 0, this.width, this.height);
        p.fill(40, 40, 60, 100);
        p.ellipse(5, 5, this.width * 0.7, this.height * 0.7);
        break;

      case 'ramp':
        p.fill(120, 120, 120);
        p.stroke(80);
        p.strokeWeight(2);
        p.triangle(-this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0, -this.height / 2);
        break;
    }

    p.pop();
  }

  isOffScreen() {
    return this.y > CANVAS_HEIGHT + 50;
  }
}

export class BossCar {
  constructor(p) {
    this.p = p;
    this.x = CANVAS_WIDTH / 2;
    this.y = 100;
    this.width = BOSS_WIDTH;
    this.height = BOSS_HEIGHT;
    this.health = BOSS_MAX_HEALTH;
    this.maxHealth = BOSS_MAX_HEALTH;
    this.speed = 2;
    this.attackTimer = 0;
    this.attackCooldown = 120;
    this.ramming = false;
    this.ramTarget = null;
    this.vulnerable = false;
    this.phase = 1; // 1, 2, 3 for different attack patterns
  }

  update() {
    // Update phase based on health
    if (this.health < this.maxHealth * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.attackCooldown = 90;
    } else if (this.health < this.maxHealth * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.attackCooldown = 60;
    }

    // Move towards player horizontally
    if (gameState.player && !this.ramming) {
      const targetX = gameState.player.x;
      if (this.p.abs(this.x - targetX) > 5) {
        this.x += (targetX - this.x) * 0.02;
      }
    }

    // Attack logic
    this.attackTimer++;
    if (this.attackTimer >= this.attackCooldown) {
      this.attack();
      this.attackTimer = 0;
    }

    // Ramming behavior
    if (this.ramming) {
      this.y += 8;
      if (this.y > CANVAS_HEIGHT - 100) {
        this.y = 100;
        this.ramming = false;
        this.vulnerable = true;
        setTimeout(() => { this.vulnerable = false; }, 2000);
      }
    } else {
      // Return to top position
      if (this.y > 100) {
        this.y -= 2;
      }
    }

    // Keep boss within track bounds
    this.x = this.p.constrain(this.x, TRACK_X_OFFSET + this.width / 2, TRACK_X_OFFSET + TRACK_WIDTH - this.width / 2);
  }

  attack() {
    const attackType = this.p.floor(this.p.random(this.phase));
    
    switch (attackType) {
      case 0:
        // Ram attack
        this.ramming = true;
        break;
      case 1:
        // Spawn mines
        this.spawnMines();
        break;
      case 2:
        // Shoot projectiles
        this.shootProjectiles();
        break;
    }
  }

  spawnMines() {
    for (let i = 0; i < 3; i++) {
      const lane = this.p.floor(this.p.random(NUM_LANES));
      gameState.obstacles.push(new Obstacle(this.p, 'pothole', lane, this.y + 50));
    }
  }

  shootProjectiles() {
    gameState.projectiles.push(new BossProjectile(this.p, this.x - 15, this.y + this.height / 2));
    gameState.projectiles.push(new BossProjectile(this.p, this.x + 15, this.y + this.height / 2));
  }

  takeDamage(amount) {
    this.health = this.p.max(0, this.health - amount);
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);

    // Glow effect when vulnerable
    if (this.vulnerable) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.rect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10, 8);
    }

    // Boss body
    p.fill(150, 30, 30);
    p.stroke(0);
    p.strokeWeight(3);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 6);

    // Armor plates
    p.fill(100, 20, 20);
    p.rect(-this.width / 2 + 5, -this.height / 2, 10, 20);
    p.rect(this.width / 2 - 15, -this.height / 2, 10, 20);

    // Windshield
    p.fill(50, 50, 50, 200);
    p.rect(-this.width / 2 + 8, -this.height / 2 + 8, this.width - 16, 15);

    // Wheels
    p.fill(20);
    p.rect(-this.width / 2 - 4, -this.height / 2 + 15, 8, 14);
    p.rect(this.width / 2 - 4, -this.height / 2 + 15, 8, 14);
    p.rect(-this.width / 2 - 4, this.height / 2 - 29, 8, 14);
    p.rect(this.width / 2 - 4, this.height / 2 - 29, 8, 14);

    // Weapons
    p.fill(80, 80, 80);
    p.rect(-this.width / 2 - 8, 0, 6, 20);
    p.rect(this.width / 2 + 2, 0, 6, 20);

    p.pop();

    // Health bar
    this.renderHealthBar();
  }

  renderHealthBar() {
    const p = this.p;
    const barWidth = 100;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = 20;
    
    const healthPercent = this.health / this.maxHealth;
    
    p.fill(50);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    p.fill(200, 50, 50);
    p.rect(barX, barY, barWidth * healthPercent, barHeight);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("THE ENFORCER", this.x, barY - 10);
  }
}

export class BossProjectile {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.speed = 6;
    this.width = 8;
    this.height = 8;
  }

  update() {
    this.y += this.speed;
  }

  render() {
    const p = this.p;
    p.fill(255, 100, 0);
    p.stroke(255, 50, 0);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.width);
    p.fill(255, 200, 0);
    p.noStroke();
    p.circle(this.x, this.y, this.width * 0.5);
  }

  isOffScreen() {
    return this.y > CANVAS_HEIGHT + 20;
  }
}

export class Particle {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-2, 2);
    this.vy = p.random(-2, 2);
    this.life = 30;
    this.maxLife = 30;
    this.type = type; // 'explosion', 'spark', 'smoke'
    this.size = p.random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.life--;
  }

  render() {
    const p = this.p;
    const alpha = (this.life / this.maxLife) * 255;
    
    p.noStroke();
    if (this.type === 'explosion') {
      p.fill(255, 150, 0, alpha);
    } else if (this.type === 'spark') {
      p.fill(255, 255, 100, alpha);
    } else {
      p.fill(100, 100, 100, alpha);
    }
    
    p.circle(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}