// entities.js
import { CANVAS_HEIGHT, gameState, MUTATION_TYPES } from './globals.js';

export class Zombie {
  constructor(p, x, y, isMutated = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 20;
    this.vx = 0;
    this.vy = 0;
    this.direction = 1; // 1 = right, -1 = left
    this.onGround = false;
    this.mutation = null;
    this.mutationTimer = 0;
    this.wanderTimer = 0;
    this.wanderDirection = 1;
    this.isMutated = isMutated;
    this.explosionTimer = 0;
    this.runnerBoost = 1;
  }

  update() {
    const p = this.p;
    
    // Handle mutations
    if (this.mutation === MUTATION_TYPES.OVERLORD && this.mutationTimer > 0) {
      this.mutationTimer--;
      // Overlord moves toward nearest human
      const nearest = this.findNearestHuman();
      if (nearest) {
        this.direction = nearest.x > this.x ? 1 : -1;
        this.vx = 1.5 * this.direction;
      }
    } else if (this.mutation === MUTATION_TYPES.EXPLODER && this.mutationTimer > 0) {
      this.mutationTimer--;
      if (this.mutationTimer <= 0) {
        this.explode();
      }
    } else if (this.mutation === MUTATION_TYPES.RUNNER && this.mutationTimer > 0) {
      this.mutationTimer--;
      this.runnerBoost = 2;
    } else {
      this.runnerBoost = 1;
      // Normal wandering behavior
      if (this.onGround) {
        this.wanderTimer--;
        if (this.wanderTimer <= 0) {
          this.wanderTimer = p.floor(p.random(60, 180));
          this.wanderDirection = p.random() > 0.5 ? 1 : -1;
        }
        this.vx = 0.8 * this.wanderDirection * this.runnerBoost;
        this.direction = this.wanderDirection;
      }
    }

    // Apply gravity
    this.vy += 0.5;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    this.onGround = false;
    if (this.y + this.height >= CANVAS_HEIGHT - 30) {
      this.y = CANVAS_HEIGHT - 30 - this.height;
      this.vy = 0;
      this.onGround = true;
    }

    // Wall collisions
    this.checkWallCollisions();

    // Keep in bounds
    if (this.x < 0) {
      this.x = 0;
      this.wanderDirection *= -1;
    }
    if (this.x > gameState.levelWidth - this.width) {
      this.x = gameState.levelWidth - this.width;
      this.wanderDirection *= -1;
    }

    // Check human collisions
    this.checkHumanCollisions();
  }

  findNearestHuman() {
    let nearest = null;
    let minDist = Infinity;
    for (const human of gameState.humans) {
      const dist = this.p.dist(this.x, this.y, human.x, human.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = human;
      }
    }
    return nearest;
  }

  checkWallCollisions() {
    const p = this.p;
    for (const wall of gameState.walls) {
      if (p.collideRectRect(this.x, this.y, this.width, this.height, wall.x, wall.y, wall.width, wall.height)) {
        // Push out of wall
        const overlapLeft = (this.x + this.width) - wall.x;
        const overlapRight = (wall.x + wall.width) - this.x;
        const overlapTop = (this.y + this.height) - wall.y;
        const overlapBottom = (wall.y + wall.height) - this.y;

        const minOverlap = p.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.vy > 0) {
          this.y = wall.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapBottom && this.vy < 0) {
          this.y = wall.y + wall.height;
          this.vy = 0;
        } else if (minOverlap === overlapLeft) {
          this.x = wall.x - this.width;
          this.vx = 0;
          this.wanderDirection *= -1;
        } else if (minOverlap === overlapRight) {
          this.x = wall.x + wall.width;
          this.vx = 0;
          this.wanderDirection *= -1;
        }
      }
    }
  }

  checkHumanCollisions() {
    const p = this.p;
    for (let i = gameState.humans.length - 1; i >= 0; i--) {
      const human = gameState.humans[i];
      if (p.collideRectRect(this.x, this.y, this.width, this.height, human.x, human.y, human.width, human.height)) {
        // Convert human to zombie
        gameState.humans.splice(i, 1);
        const newZombie = new Zombie(p, human.x, human.y, true);
        gameState.zombies.push(newZombie);
        gameState.entities.push(newZombie);
        gameState.dnaPoints += 10;
        gameState.humansConverted++;
        gameState.score += 100;
      }
    }
  }

  explode() {
    const explosion = {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      radius: 0,
      maxRadius: 40,
      timer: 30
    };
    gameState.explosions.push(explosion);

    // Damage nearby walls
    for (let i = gameState.walls.length - 1; i >= 0; i--) {
      const wall = gameState.walls[i];
      if (wall.destructible) {
        const dist = this.p.dist(explosion.x, explosion.y, wall.x + wall.width / 2, wall.y + wall.height / 2);
        if (dist < explosion.maxRadius + 20) {
          gameState.walls.splice(i, 1);
          gameState.score += 50;
        }
      }
    }

    // Remove this zombie
    const idx = gameState.zombies.indexOf(this);
    if (idx !== -1) {
      gameState.zombies.splice(idx, 1);
    }
    const idx2 = gameState.entities.indexOf(this);
    if (idx2 !== -1) {
      gameState.entities.splice(idx2, 1);
    }
  }

  applyMutation(mutationType) {
    this.mutation = mutationType;
    switch (mutationType) {
      case MUTATION_TYPES.OVERLORD:
        this.mutationTimer = 300; // 5 seconds
        break;
      case MUTATION_TYPES.EXPLODER:
        this.mutationTimer = 120; // 2 seconds before explosion
        break;
      case MUTATION_TYPES.RUNNER:
        this.mutationTimer = 240; // 4 seconds
        break;
    }
  }

  draw() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    if (screenX < -50 || screenX > CANVAS_HEIGHT + 50) return;

    p.push();
    
    // Mutation glow
    if (this.mutation === MUTATION_TYPES.OVERLORD && this.mutationTimer > 0) {
      p.fill(255, 100, 255, 100);
      p.noStroke();
      p.ellipse(screenX + this.width / 2, this.y + this.height / 2, 30, 30);
    } else if (this.mutation === MUTATION_TYPES.EXPLODER && this.mutationTimer > 0) {
      p.fill(255, 0, 0, 100 + p.sin(p.frameCount * 0.3) * 100);
      p.noStroke();
      p.ellipse(screenX + this.width / 2, this.y + this.height / 2, 30, 30);
    } else if (this.mutation === MUTATION_TYPES.RUNNER && this.mutationTimer > 0) {
      p.fill(0, 255, 255, 100);
      p.noStroke();
      p.ellipse(screenX + this.width / 2, this.y + this.height / 2, 30, 30);
    }

    // Body
    p.fill(80, 120, 80);
    p.stroke(50, 80, 50);
    p.strokeWeight(1);
    p.rect(screenX, this.y, this.width, this.height);

    // Head
    p.fill(100, 140, 100);
    p.ellipse(screenX + this.width / 2, this.y - 3, 10, 10);

    // Eyes (red)
    p.fill(255, 0, 0);
    p.noStroke();
    const eyeOffset = this.direction > 0 ? 2 : -2;
    p.ellipse(screenX + this.width / 2 + eyeOffset, this.y - 3, 2, 2);

    // Arms
    p.stroke(80, 120, 80);
    p.strokeWeight(2);
    const armWave = p.sin(p.frameCount * 0.1 + this.x * 0.1) * 3;
    p.line(screenX + this.width / 2, this.y + 5, screenX + this.width / 2 + 5 * this.direction, this.y + 8 + armWave);

    p.pop();
  }
}

export class Human {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 18;
    this.vx = 0;
    this.vy = 0;
    this.direction = 1;
    this.onGround = false;
    this.fleeTimer = 0;
    this.panicDirection = 1;
  }

  update() {
    const p = this.p;

    // Check for nearby zombies and flee
    let nearestZombie = null;
    let minDist = Infinity;
    for (const zombie of gameState.zombies) {
      const dist = p.dist(this.x, this.y, zombie.x, zombie.y);
      if (dist < 80 && dist < minDist) {
        minDist = dist;
        nearestZombie = zombie;
      }
    }

    if (nearestZombie && minDist < 80) {
      this.fleeTimer = 60;
      this.panicDirection = nearestZombie.x > this.x ? -1 : 1;
    }

    if (this.fleeTimer > 0) {
      this.fleeTimer--;
      if (this.onGround) {
        this.vx = 2 * this.panicDirection;
        this.direction = this.panicDirection;
      }
    } else {
      this.vx = 0;
    }

    // Apply gravity
    this.vy += 0.5;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    this.onGround = false;
    if (this.y + this.height >= CANVAS_HEIGHT - 30) {
      this.y = CANVAS_HEIGHT - 30 - this.height;
      this.vy = 0;
      this.onGround = true;
    }

    // Wall collisions
    this.checkWallCollisions();

    // Keep in bounds
    if (this.x < 0) {
      this.x = 0;
      this.panicDirection *= -1;
    }
    if (this.x > gameState.levelWidth - this.width) {
      this.x = gameState.levelWidth - this.width;
      this.panicDirection *= -1;
    }
  }

  checkWallCollisions() {
    const p = this.p;
    for (const wall of gameState.walls) {
      if (p.collideRectRect(this.x, this.y, this.width, this.height, wall.x, wall.y, wall.width, wall.height)) {
        const overlapLeft = (this.x + this.width) - wall.x;
        const overlapRight = (wall.x + wall.width) - this.x;
        const overlapTop = (this.y + this.height) - wall.y;
        const overlapBottom = (wall.y + wall.height) - this.y;

        const minOverlap = p.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.vy > 0) {
          this.y = wall.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } else if (minOverlap === overlapBottom && this.vy < 0) {
          this.y = wall.y + wall.height;
          this.vy = 0;
        } else if (minOverlap === overlapLeft) {
          this.x = wall.x - this.width;
          this.vx = 0;
          this.panicDirection *= -1;
        } else if (minOverlap === overlapRight) {
          this.x = wall.x + wall.width;
          this.vx = 0;
          this.panicDirection *= -1;
        }
      }
    }
  }

  draw() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    if (screenX < -50 || screenX > CANVAS_HEIGHT + 50) return;

    p.push();
    
    // Body
    p.fill(200, 180, 160);
    p.stroke(150, 130, 110);
    p.strokeWeight(1);
    p.rect(screenX, this.y, this.width, this.height);

    // Head
    p.fill(220, 200, 180);
    p.ellipse(screenX + this.width / 2, this.y - 3, 8, 8);

    // Eyes
    p.fill(0);
    p.noStroke();
    const eyeOffset = this.direction > 0 ? 1 : -1;
    p.ellipse(screenX + this.width / 2 + eyeOffset, this.y - 3, 1.5, 1.5);

    // Panic indicator
    if (this.fleeTimer > 0) {
      p.stroke(255, 0, 0);
      p.noFill();
      p.strokeWeight(1);
      p.ellipse(screenX + this.width / 2, this.y - 10, 12, 12);
    }

    p.pop();
  }
}

export class Wall {
  constructor(p, x, y, width, height, destructible = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.destructible = destructible;
  }

  draw() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    if (screenX + this.width < -50 || screenX > CANVAS_HEIGHT + 50) return;

    p.push();
    if (this.destructible) {
      p.fill(120, 80, 60);
      p.stroke(90, 60, 40);
    } else {
      p.fill(80, 80, 80);
      p.stroke(60, 60, 60);
    }
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);

    // Brick pattern
    if (this.destructible) {
      p.stroke(100, 70, 50);
      p.strokeWeight(1);
      for (let i = 0; i < this.height; i += 10) {
        p.line(screenX, this.y + i, screenX + this.width, this.y + i);
      }
    }

    p.pop();
  }
}

export class Hazard {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update() {
    // Check zombie collisions
    for (let i = gameState.zombies.length - 1; i >= 0; i--) {
      const zombie = gameState.zombies[i];
      if (this.p.collideRectRect(zombie.x, zombie.y, zombie.width, zombie.height, this.x, this.y, this.width, this.height)) {
        gameState.zombies.splice(i, 1);
        const idx = gameState.entities.indexOf(zombie);
        if (idx !== -1) {
          gameState.entities.splice(idx, 1);
        }
      }
    }
  }

  draw() {
    const p = this.p;
    const screenX = this.x - gameState.cameraX;
    
    if (screenX + this.width < -50 || screenX > CANVAS_HEIGHT + 50) return;

    p.push();
    p.fill(255, 50, 0);
    p.noStroke();
    
    // Spiky hazard
    for (let i = 0; i < this.width; i += 8) {
      p.triangle(
        screenX + i, this.y + this.height,
        screenX + i + 4, this.y,
        screenX + i + 8, this.y + this.height
      );
    }
    
    p.pop();
  }
}