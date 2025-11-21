// entities.js - Game entity classes

import { BALL_RADIUS, OPPONENT_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Ball {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = BALL_RADIUS;
    this.p = p;
  }

  applyForce(fx, fy) {
    this.vx += fx;
    this.vy += fy;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Apply friction
    this.vx *= 0.95;
    this.vy *= 0.95;

    // Boundary collision with walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -0.6;
    }
    if (this.x + this.radius > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.radius;
      this.vx *= -0.6;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -0.6;
    }
    if (this.y + this.radius > CANVAS_HEIGHT) {
      this.y = CANVAS_HEIGHT - this.radius;
      this.vy *= -0.6;
    }

    // Speed limit
    const maxSpeed = 8;
    const speed = this.p.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
  }

  draw() {
    this.p.push();
    this.p.fill(255);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Pentagon pattern on ball
    this.p.noFill();
    this.p.stroke(0);
    this.p.strokeWeight(1);
    for (let i = 0; i < 5; i++) {
      const angle = (this.p.TWO_PI / 5) * i - this.p.HALF_PI;
      const x1 = this.x + this.p.cos(angle) * this.radius * 0.6;
      const y1 = this.y + this.p.sin(angle) * this.radius * 0.6;
      const angle2 = (this.p.TWO_PI / 5) * ((i + 2) % 5) - this.p.HALF_PI;
      const x2 = this.x + this.p.cos(angle2) * this.radius * 0.6;
      const y2 = this.y + this.p.sin(angle2) * this.radius * 0.6;
      this.p.line(x1, y1, x2, y2);
    }
    this.p.pop();
  }
}

export class Opponent {
  constructor(x, y, behavior, speed, p) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = OPPONENT_RADIUS;
    this.behavior = behavior; // 'patrol', 'chase', 'goalie'
    this.speed = speed;
    this.p = p;
    this.patrolTarget = { x: x + 100, y: y };
    this.patrolStart = { x: x, y: y };
    this.hasCollided = false;
    this.collisionTimer = 0;
  }

  update(ball) {
    if (this.behavior === 'patrol') {
      this.patrol();
    } else if (this.behavior === 'chase') {
      this.chase(ball);
    } else if (this.behavior === 'goalie') {
      this.goalie(ball);
    }

    this.x += this.vx;
    this.y += this.vy;

    // Boundary constraints
    this.x = this.p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = this.p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);

    // Collision flash timer
    if (this.collisionTimer > 0) {
      this.collisionTimer--;
    }
    if (this.collisionTimer === 0) {
      this.hasCollided = false;
    }
  }

  patrol() {
    const dx = this.patrolTarget.x - this.x;
    const dy = this.patrolTarget.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Swap patrol targets
      const temp = { ...this.patrolTarget };
      this.patrolTarget = { ...this.patrolStart };
      this.patrolStart = temp;
    }

    this.vx = (dx / dist) * this.speed * 0.8;
    this.vy = (dy / dist) * this.speed * 0.8;
  }

  chase(ball) {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const dist = this.p.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
  }

  goalie(ball) {
    // Goalie stays near goal and moves to intercept
    const goalX = CANVAS_WIDTH - 40;
    const targetY = ball.y;
    
    const dx = goalX - this.x;
    const dy = targetY - this.y;
    
    this.vx = dx * 0.1;
    this.vy = dy * 0.15;
  }

  draw() {
    this.p.push();
    
    // Determine color based on collision state
    const fillColor = this.hasCollided ? [255, 100, 100] : [0, 100, 255];
    this.p.fill(...fillColor);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Direction indicator
    this.p.fill(255);
    this.p.noStroke();
    const angle = this.p.atan2(this.vy, this.vx);
    const dx = this.p.cos(angle) * this.radius * 0.6;
    const dy = this.p.sin(angle) * this.radius * 0.6;
    this.p.circle(this.x + dx, this.y + dy, 5);
    
    this.p.pop();
  }

  markCollision() {
    this.hasCollided = true;
    this.collisionTimer = 30; // Flash for 30 frames
  }
}

export class Obstacle {
  constructor(x, y, width, height, isMoving, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isMoving = isMoving;
    this.p = p;
    
    if (isMoving) {
      this.startX = x;
      this.startY = y;
      this.moveRange = 100;
      this.moveSpeed = 1;
      this.moveDirection = 1;
      this.axis = this.p.random() > 0.5 ? 'horizontal' : 'vertical';
    }
  }

  update() {
    if (this.isMoving) {
      if (this.axis === 'horizontal') {
        this.x += this.moveSpeed * this.moveDirection;
        if (this.x > this.startX + this.moveRange || this.x < this.startX - this.moveRange) {
          this.moveDirection *= -1;
        }
      } else {
        this.y += this.moveSpeed * this.moveDirection;
        if (this.y > this.startY + this.moveRange || this.y < this.startY - this.moveRange) {
          this.moveDirection *= -1;
        }
      }
    }
  }

  draw() {
    this.p.push();
    const fillColor = this.isMoving ? [200, 0, 0] : [100, 100, 100];
    this.p.fill(...fillColor);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height);
    this.p.pop();
  }

  collidesWith(ball) {
    return this.p.collideCircleRect(ball.x, ball.y, ball.radius * 2, this.x, this.y, this.width, this.height);
  }
}

export class Goal {
  constructor(x, y, width, height, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.p = p;
  }

  draw() {
    this.p.push();
    
    // Goal zone (semi-transparent)
    this.p.fill(100, 200, 255, 80);
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Goalposts
    this.p.fill(255);
    this.p.stroke(0);
    this.p.strokeWeight(3);
    this.p.rect(this.x, this.y - 5, 8, this.height + 10);
    this.p.rect(this.x + this.width - 8, this.y - 5, 8, this.height + 10);
    
    // Crossbar
    this.p.rect(this.x, this.y - 5, this.width, 8);
    
    this.p.pop();
  }

  collidesWith(ball) {
    return this.p.collideCircleRect(ball.x, ball.y, ball.radius * 2, this.x, this.y, this.width, this.height);
  }
}