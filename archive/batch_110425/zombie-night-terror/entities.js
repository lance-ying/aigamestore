// entities.js - Entity classes

import { 
  ENTITY_ZOMBIE, 
  ENTITY_HUMAN, 
  ENTITY_OBSTACLE, 
  ENTITY_EXIT, 
  ENTITY_PIT,
  MUTATION_BLOCKER,
  MUTATION_EXPLODER,
  MUTATION_JUMPER,
  MUTATION_RUNNER,
  MUTATION_TANK
} from './globals.js';

export class Entity {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 30;
    this.active = true;
  }

  update(deltaTime) {
    // Base update - override in subclasses
  }

  render(p, cameraX) {
    // Base render - override in subclasses
  }
}

export class Zombie extends Entity {
  constructor(x, y) {
    super(x, y, ENTITY_ZOMBIE);
    this.velocityX = 1;
    this.velocityY = 0;
    this.mutation = null;
    this.onGround = false;
    this.jumpCooldown = 0;
    this.explodeTimer = 0;
    this.blockerActive = false;
  }

  applyMutation(mutationType) {
    this.mutation = mutationType;
    
    switch(mutationType) {
      case MUTATION_BLOCKER:
        this.velocityX = 0;
        this.blockerActive = true;
        break;
      case MUTATION_RUNNER:
        this.velocityX = this.velocityX > 0 ? 2.5 : -2.5;
        break;
      case MUTATION_EXPLODER:
        this.explodeTimer = 60; // 1 second fuse
        break;
    }
  }

  update(deltaTime, entities, groundY) {
    if (!this.active) return;

    // Apply gravity
    if (this.y < groundY - this.height) {
      this.velocityY += 0.5 * deltaTime;
      this.onGround = false;
    } else {
      this.y = groundY - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    // Update position
    if (!this.blockerActive) {
      this.x += this.velocityX * deltaTime;
    }
    this.y += this.velocityY * deltaTime;

    // Update cooldowns
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
    }

    // Exploder countdown
    if (this.mutation === MUTATION_EXPLODER && this.explodeTimer > 0) {
      this.explodeTimer -= deltaTime;
      if (this.explodeTimer <= 0) {
        return { explode: true, x: this.x, y: this.y };
      }
    }

    return null;
  }

  render(p, cameraX) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    
    p.push();
    
    // Base zombie color
    let baseColor = [100, 200, 100];
    
    // Mutation colors
    if (this.mutation === MUTATION_BLOCKER) {
      baseColor = [150, 150, 200];
    } else if (this.mutation === MUTATION_EXPLODER) {
      const flash = this.explodeTimer > 0 && this.explodeTimer < 30 && Math.floor(this.explodeTimer / 5) % 2 === 0;
      baseColor = flash ? [255, 100, 100] : [200, 100, 100];
    } else if (this.mutation === MUTATION_JUMPER) {
      baseColor = [100, 200, 200];
    } else if (this.mutation === MUTATION_RUNNER) {
      baseColor = [200, 200, 100];
    } else if (this.mutation === MUTATION_TANK) {
      baseColor = [150, 100, 150];
    }

    // Body
    p.fill(...baseColor);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Head
    p.fill(...baseColor.map(c => c * 0.8));
    p.ellipse(screenX + this.width / 2, this.y - 5, 12, 12);
    
    // Eyes
    p.fill(255, 0, 0);
    p.circle(screenX + this.width / 2 - 3, this.y - 5, 3);
    p.circle(screenX + this.width / 2 + 3, this.y - 5, 3);
    
    // Arms
    p.stroke(...baseColor);
    p.strokeWeight(2);
    p.line(screenX + 2, this.y + 10, screenX - 3, this.y + 15);
    p.line(screenX + this.width - 2, this.y + 10, screenX + this.width + 3, this.y + 15);
    p.noStroke();
    
    p.pop();
  }
}

export class Human extends Entity {
  constructor(x, y, isCritical = false) {
    super(x, y, ENTITY_HUMAN);
    this.velocityX = -0.5; // Humans run away
    this.velocityY = 0;
    this.isCritical = isCritical;
    this.onGround = false;
    this.infected = false;
  }

  update(deltaTime, entities, groundY) {
    if (!this.active || this.infected) return;

    // Apply gravity
    if (this.y < groundY - this.height) {
      this.velocityY += 0.5 * deltaTime;
      this.onGround = false;
    } else {
      this.y = groundY - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    // Update position
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }

  render(p, cameraX) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    
    p.push();
    
    // Body color
    const bodyColor = this.isCritical ? [255, 200, 100] : [200, 150, 150];
    
    // Body
    p.fill(...bodyColor);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(screenX + this.width / 2, this.y - 5, 12, 12);
    
    // Critical indicator
    if (this.isCritical) {
      p.fill(255, 0, 0);
      p.textSize(10);
      p.textAlign(p.CENTER);
      p.text("!", screenX + this.width / 2, this.y - 15);
    }
    
    p.pop();
  }
}

export class Obstacle extends Entity {
  constructor(x, y, width, height, destructible = true) {
    super(x, y, ENTITY_OBSTACLE);
    this.width = width;
    this.height = height;
    this.destructible = destructible;
    this.health = destructible ? 100 : -1;
  }

  takeDamage(amount) {
    if (!this.destructible) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  render(p, cameraX) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    
    p.push();
    
    if (this.destructible) {
      const healthPercent = this.health / 100;
      p.fill(150 - healthPercent * 50, 100, 50);
    } else {
      p.fill(80, 80, 80);
    }
    
    p.rect(screenX, this.y, this.width, this.height);
    
    // Draw cracks if damaged
    if (this.destructible && this.health < 100) {
      p.stroke(50);
      p.strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        const crackY = this.y + (this.height / 4) * (i + 1);
        p.line(screenX, crackY, screenX + this.width, crackY - 5);
      }
      p.noStroke();
    }
    
    p.pop();
  }
}

export class Exit extends Entity {
  constructor(x, y) {
    super(x, y, ENTITY_EXIT);
    this.width = 40;
    this.height = 60;
  }

  render(p, cameraX) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    
    p.push();
    
    // Door frame
    p.fill(100, 50, 20);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Door
    p.fill(150, 100, 50);
    p.rect(screenX + 5, this.y + 5, this.width - 10, this.height - 5);
    
    // Handle
    p.fill(200, 180, 100);
    p.circle(screenX + this.width - 15, this.y + this.height / 2, 5);
    
    // Exit sign
    p.fill(100, 255, 100);
    p.textSize(10);
    p.textAlign(p.CENTER);
    p.text("EXIT", screenX + this.width / 2, this.y - 5);
    
    p.pop();
  }
}

export class Pit extends Entity {
  constructor(x, y, width) {
    super(x, y, ENTITY_PIT);
    this.width = width;
    this.height = 50;
  }

  render(p, cameraX) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    
    p.push();
    p.fill(20, 20, 30);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Danger stripes
    p.stroke(200, 200, 0);
    p.strokeWeight(2);
    for (let i = 0; i < this.width; i += 20) {
      p.line(screenX + i, this.y, screenX + i + 10, this.y);
    }
    p.noStroke();
    
    p.pop();
  }
}