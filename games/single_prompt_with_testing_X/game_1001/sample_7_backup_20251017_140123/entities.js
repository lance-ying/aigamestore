import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { World, Bodies, Body } = Matter;
import { gameState, GAME_CONFIG } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 60, 30, {
      label: 'player',
      friction: 0.5,
      restitution: 0.2,
      density: 0.02,
      inertia: Infinity
    });
    World.add(gameState.world, this.body);
    
    this.width = 60;
    this.height = 30;
    this.baseColor = [80, 80, 80];
    this.acceleration = 0.6;
    this.maxSpeed = 6;
    this.isBoosting = false;
    this.gunCooldown = 0;
  }

  update() {
    Body.setAngle(this.body, 0);
    
    if (this.body.velocity.x > this.maxSpeed) {
      Body.setVelocity(this.body, { x: this.maxSpeed, y: this.body.velocity.y });
    }
    if (this.body.velocity.x < -this.maxSpeed * 0.5) {
      Body.setVelocity(this.body, { x: -this.maxSpeed * 0.5, y: this.body.velocity.y });
    }
    
    if (this.body.position.y > 380) {
      Body.setPosition(this.body, { x: this.body.position.x, y: 380 });
      Body.setVelocity(this.body, { x: this.body.velocity.x, y: 0 });
    }
    
    gameState.distance = Math.max(0, this.body.position.x - 100);
    
    const dx = Math.abs(this.body.position.x - gameState.lastPlayerLogX);
    const dy = Math.abs(this.body.position.y - gameState.lastPlayerLogY);
    if (dx > 50 || dy > 20) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x - gameState.cameraX,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastPlayerLogX = this.body.position.x;
      gameState.lastPlayerLogY = this.body.position.y;
    }
    
    if (this.gunCooldown > 0) {
      this.gunCooldown--;
    }
  }

  render() {
    const screenX = this.body.position.x - gameState.cameraX;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Color changes based on armor level for damage feedback
    let color = [...this.baseColor];
    if (gameState.armor < 30) {
      color = [150, 50, 50]; // Red when low armor
    } else if (gameState.armor < 60) {
      color = [150, 100, 50]; // Orange when medium armor
    }
    
    // Flash red on damage
    if (gameState.damageFlash > 0) {
      color = [255, 0, 0];
    }
    
    this.p.fill(color);
    this.p.noStroke();
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    this.p.fill(100, 100, 120);
    this.p.rect(-20, -this.height / 2 - 8, 15, 8);
    
    this.p.fill(60, 60, 60);
    this.p.rect(-this.width / 2 + 5, this.height / 2, 10, 3);
    this.p.rect(this.width / 2 - 15, this.height / 2, 10, 3);
    
    if (this.isBoosting) {
      this.p.fill(255, 150, 0, 150);
      this.p.ellipse(-this.width / 2 - 10, 0, 15, 10);
    }
    
    this.p.pop();
  }

  accelerate() {
    if (gameState.fuel > 0) {
      Body.applyForce(this.body, this.body.position, { x: this.acceleration, y: 0 });
      gameState.fuel = Math.max(0, gameState.fuel - GAME_CONFIG.FUEL_CONSUMPTION_RATE);
    }
  }

  brake() {
    Body.applyForce(this.body, this.body.position, { x: -this.acceleration * 1.5, y: 0 });
  }

  boost() {
    if (gameState.fuel > 5) {
      Body.applyForce(this.body, this.body.position, { x: this.acceleration * 3, y: 0 });
      gameState.fuel = Math.max(0, gameState.fuel - GAME_CONFIG.BOOST_FUEL_RATE);
      this.isBoosting = true;
    } else {
      this.isBoosting = false;
    }
  }

  shoot() {
    if (this.gunCooldown <= 0) {
      const bullet = new Bullet(this.p, this.body.position.x + 40, this.body.position.y - 10);
      gameState.bullets.push(bullet);
      this.gunCooldown = 8;
    }
  }
}

export class Zombie {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 20, 30, {
      label: 'zombie',
      friction: 0.8,
      restitution: 0.1,
      density: 0.001
    });
    World.add(gameState.world, this.body);
    
    this.width = 20;
    this.height = 30;
    this.health = 2;
    this.destroyed = false;
  }

  update() {
    if (this.body.position.x < gameState.cameraX - 100 || this.destroyed) {
      World.remove(gameState.world, this.body);
      return false;
    }
    
    if (this.body.position.y > 380) {
      Body.setPosition(this.body, { x: this.body.position.x, y: 380 });
      Body.setVelocity(this.body, { x: this.body.velocity.x, y: 0 });
    }
    
    return true;
  }

  render() {
    if (this.destroyed) return;
    
    const screenX = this.body.position.x - gameState.cameraX;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    this.p.rotate(this.body.angle);
    
    this.p.fill(100, 150, 100);
    this.p.noStroke();
    this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    this.p.fill(80, 120, 80);
    this.p.ellipse(0, -this.height / 2 + 5, this.width * 0.8, 12);
    
    this.p.fill(255, 0, 0);
    this.p.ellipse(-4, -this.height / 2 + 4, 3, 3);
    this.p.ellipse(4, -this.height / 2 + 4, 3, 3);
    
    this.p.pop();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    this.destroyed = true;
    World.remove(gameState.world, this.body);
  }
}

export class Obstacle {
  constructor(p, x, y, type) {
    this.p = p;
    this.type = type;
    
    if (type === 'barrel') {
      this.body = Bodies.circle(x, y, 15, {
        label: 'obstacle',
        friction: 0.5,
        restitution: 0.3,
        density: 0.005
      });
      this.radius = 15;
    } else {
      this.body = Bodies.rectangle(x, y, 40, 40, {
        label: 'obstacle',
        friction: 0.8,
        restitution: 0.1,
        density: 0.01
      });
      this.width = 40;
      this.height = 40;
    }
    
    World.add(gameState.world, this.body);
    this.health = 3;
    this.destroyed = false;
  }

  update() {
    if (this.body.position.x < gameState.cameraX - 100 || this.destroyed) {
      World.remove(gameState.world, this.body);
      return false;
    }
    
    if (this.body.position.y > 400) {
      Body.setPosition(this.body, { x: this.body.position.x, y: 390 });
      Body.setVelocity(this.body, { x: this.body.velocity.x * 0.8, y: 0 });
    }
    
    return true;
  }

  render() {
    if (this.destroyed) return;
    
    const screenX = this.body.position.x - gameState.cameraX;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    this.p.rotate(this.body.angle);
    
    if (this.type === 'barrel') {
      this.p.fill(180, 100, 50);
      this.p.noStroke();
      this.p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      this.p.fill(140, 80, 40);
      this.p.rect(-2, -this.radius, 4, this.radius * 2);
    } else {
      this.p.fill(120, 120, 120);
      this.p.noStroke();
      this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
      this.p.fill(100, 100, 100);
      this.p.rect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height - 10);
    }
    
    this.p.pop();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    this.destroyed = true;
    World.remove(gameState.world, this.body);
  }
}

export class FuelPickup {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 12, {
      label: 'fuel',
      friction: 0.3,
      restitution: 0.5,
      density: 0.001,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    
    this.radius = 12;
    this.collected = false;
    this.pulsePhase = 0;
  }

  update() {
    if (this.body.position.x < gameState.cameraX - 100 || this.collected) {
      World.remove(gameState.world, this.body);
      return false;
    }
    
    this.pulsePhase += 0.1;
    
    return true;
  }

  render() {
    if (this.collected) return;
    
    const screenX = this.body.position.x - gameState.cameraX;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
    this.p.fill(255, 200, 0, 200);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.radius * 2 * pulse, this.radius * 2 * pulse);
    
    this.p.fill(200, 150, 0);
    this.p.ellipse(0, 0, this.radius * 1.5, this.radius * 1.5);
    
    this.p.fill(255, 220, 50);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text('F', 0, 0);
    
    this.p.pop();
  }

  collect() {
    this.collected = true;
    World.remove(gameState.world, this.body);
    gameState.fuel = Math.min(100, gameState.fuel + 25);
  }
}

export class ArmorPickup {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 12, {
      label: 'armor',
      friction: 0.3,
      restitution: 0.5,
      density: 0.001,
      isSensor: true
    });
    World.add(gameState.world, this.body);
    
    this.radius = 12;
    this.collected = false;
    this.pulsePhase = 0;
  }

  update() {
    if (this.body.position.x < gameState.cameraX - 100 || this.collected) {
      World.remove(gameState.world, this.body);
      return false;
    }
    
    this.pulsePhase += 0.1;
    
    return true;
  }

  render() {
    if (this.collected) return;
    
    const screenX = this.body.position.x - gameState.cameraX;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
    this.p.fill(100, 200, 255, 200);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.radius * 2 * pulse, this.radius * 2 * pulse);
    
    this.p.fill(80, 150, 200);
    this.p.ellipse(0, 0, this.radius * 1.5, this.radius * 1.5);
    
    this.p.fill(150, 220, 255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text('A', 0, 0);
    
    this.p.pop();
  }

  collect() {
    this.collected = true;
    World.remove(gameState.world, this.body);
    gameState.armor = Math.min(100, gameState.armor + 30);
  }
}

export class Bullet {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.circle(x, y, 8, {
      label: 'bullet',
      friction: 0,
      restitution: 0,
      density: 0.001,
      isSensor: true
    });
    Body.setVelocity(this.body, { x: 15, y: 0 });
    World.add(gameState.world, this.body);
    
    this.radius = 8;
    this.destroyed = false;
    this.lifetime = 60;
  }

  update() {
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.body.position.x < gameState.cameraX - 50 || this.destroyed) {
      World.remove(gameState.world, this.body);
      return false;
    }
    
    return true;
  }

  render() {
    if (this.destroyed) return;
    
    const screenX = this.body.position.x - gameState.cameraX;
    const screenY = this.body.position.y;
    
    this.p.push();
    this.p.fill(255, 255, 0);
    this.p.noStroke();
    this.p.ellipse(screenX, screenY, this.radius * 2, this.radius * 2);
    this.p.pop();
  }

  destroy() {
    this.destroyed = true;
    World.remove(gameState.world, this.body);
  }
}

export class BackgroundObject {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.scale = 0.5 + Math.random() * 0.5;
  }

  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    if (screenX < -100 || screenX > 700) return;
    
    p.push();
    p.translate(screenX, this.y);
    p.scale(this.scale);
    
    if (this.type === 'building') {
      p.fill(60, 60, 70);
      p.noStroke();
      p.rect(0, 0, 80, -120);
      p.fill(40, 40, 50);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
          p.rect(10 + i * 20, -110 + j * 20, 15, 15);
        }
      }
    } else if (this.type === 'tree') {
      p.fill(80, 50, 30);
      p.rect(-5, -30, 10, 30);
      p.fill(50, 100, 50);
      p.ellipse(0, -40, 30, 30);
      p.ellipse(-10, -30, 25, 25);
      p.ellipse(10, -30, 25, 25);
    }
    
    p.pop();
  }
}