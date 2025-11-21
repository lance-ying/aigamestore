import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, COLORS, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.lastLoggedPosition = { x: 0, y: 0 };
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, 15, {
      label: 'player',
      friction: 0.8,
      restitution: 0.1,
      density: 0.001,
      frictionAir: 0.01
    });
    World.add(gameState.world, this.body);

    this.color = COLORS.LEPRECHAUN_GREEN;
    this.hatColor = COLORS.LEPRECHAUN_HAT;
    this.onGround = false;
    this.jumpForce = -0.015;
    this.moveForce = 0.005;
    this.maxSpeed = 5;
    this.jumpHoldMultiplier = 1.5;
  }

  update() {
    // Check if on ground
    this.onGround = gameState.groundContactCount > 0;
    
    // Apply movement based on control mode
    if (gameState.controlMode === "HUMAN") {
      this.handleHumanInput();
    } else if (gameState.controlMode === "TEST_1") {
      this.handleTest1();
    } else if (gameState.controlMode === "TEST_2") {
      this.handleTest2();
    } else if (gameState.controlMode === "TEST_3") {
      this.handleTest3();
    } else if (gameState.controlMode === "TEST_4") {
      this.handleTest4();
    } else if (gameState.controlMode === "TEST_5") {
      this.handleTest5();
    }
    
    // Limit horizontal speed
    if (Math.abs(this.body.velocity.x) > this.maxSpeed) {
      Body.setVelocity(this.body, {
        x: Math.sign(this.body.velocity.x) * this.maxSpeed,
        y: this.body.velocity.y
      });
    }
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedPosition.x);
    const dy = Math.abs(this.body.position.y - this.lastLoggedPosition.y);
    
    if (dx > 5 || dy > 5) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x - gameState.camera.x,
        screen_y: this.body.position.y - gameState.camera.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedPosition = { x: this.body.position.x, y: this.body.position.y };
    }
    
    // Check for fall death
    if (this.body.position.y > CANVAS_HEIGHT + 100) {
      this.die();
    }
    
    // Update camera to follow player
    this.updateCamera();
  }

  updateCamera() {
    const targetX = this.body.position.x - CANVAS_WIDTH / 2;
    gameState.camera.x = Math.max(0, Math.min(targetX, gameState.levelWidth - CANVAS_WIDTH));
  }

  handleHumanInput() {
    // Movement
    if (gameState.keys[65] || gameState.keys[37]) { // A or Left Arrow
      Body.applyForce(this.body, this.body.position, { x: -this.moveForce, y: 0 });
    }
    if (gameState.keys[68] || gameState.keys[39]) { // D or Right Arrow
      Body.applyForce(this.body, this.body.position, { x: this.moveForce, y: 0 });
    }
    
    // Jumping
    if ((gameState.keys[87] || gameState.keys[38] || gameState.keys[32]) && this.onGround) { // W, Up Arrow, or Space
      if (!gameState.isJumping) {
        gameState.isJumping = true;
        gameState.jumpStartTime = Date.now();
        this.jump();
      } else {
        // Hold for higher jump
        const holdTime = Date.now() - gameState.jumpStartTime;
        if (holdTime < 200) { // Max hold time
          Body.applyForce(this.body, this.body.position, { 
            x: 0, 
            y: this.jumpForce * this.jumpHoldMultiplier * 0.3 
          });
        }
      }
    }
    
    // Reset jumping when key released
    if (!gameState.keys[87] && !gameState.keys[38] && !gameState.keys[32]) {
      gameState.isJumping = false;
    }
  }

  handleTest1() {
    const testTime = Date.now() - gameState.testState.startTime;
    const phase = gameState.testState.phase;
    
    if (testTime < 2000) {
      // Move right
      Body.applyForce(this.body, this.body.position, { x: this.moveForce, y: 0 });
    } else if (testTime < 4000) {
      // Move left
      Body.applyForce(this.body, this.body.position, { x: -this.moveForce, y: 0 });
    } else if (testTime < 5000) {
      // Jump test
      if (this.onGround && gameState.testState.jumpTestCount < 3) {
        this.jump();
        gameState.testState.jumpTestCount++;
      }
    } else if (testTime < 7000) {
      // High jump test by holding
      if (this.onGround && !gameState.isJumping) {
        gameState.isJumping = true;
        gameState.jumpStartTime = Date.now();
        this.jump();
      } else if (gameState.isJumping) {
        const holdTime = Date.now() - gameState.jumpStartTime;
        if (holdTime < 150) {
          Body.applyForce(this.body, this.body.position, { 
            x: 0, 
            y: this.jumpForce * this.jumpHoldMultiplier * 0.3 
          });
        } else {
          gameState.isJumping = false;
        }
      }
    } else {
      // Continue basic movement
      Body.applyForce(this.body, this.body.position, { x: this.moveForce * 0.5, y: 0 });
    }
  }

  handleTest2() {
    // Move toward flag
    if (gameState.flag) {
      const dx = gameState.flag.body.position.x - this.body.position.x;
      if (Math.abs(dx) > 10) {
        const direction = Math.sign(dx);
        Body.applyForce(this.body, this.body.position, { x: this.moveForce * direction, y: 0 });
        
        // Jump over obstacles
        if (this.onGround && Math.random() < 0.1) {
          this.jump();
        }
      }
    } else {
      // Default movement right
      Body.applyForce(this.body, this.body.position, { x: this.moveForce, y: 0 });
    }
  }

  handleTest3() {
    // Move toward enemies to test collision
    if (gameState.enemies.length > 0 && !gameState.testState.enemyTestComplete) {
      const enemy = gameState.enemies[0];
      const dx = enemy.body.position.x - this.body.position.x;
      const dy = enemy.body.position.y - this.body.position.y;
      
      if (Math.abs(dx) > 20) {
        const direction = Math.sign(dx);
        Body.applyForce(this.body, this.body.position, { x: this.moveForce * direction, y: 0 });
      } else if (dy < -10 && this.onGround) {
        // Jump on enemy
        this.jump();
        gameState.testState.enemyTestComplete = true;
      }
    } else {
      // Continue moving right
      Body.applyForce(this.body, this.body.position, { x: this.moveForce, y: 0 });
    }
  }

  handleTest4() {
    // Move toward collectibles
    let target = null;
    
    // Find nearest coin or cloverleaf
    [...gameState.coins, ...gameState.cloverleaves].forEach(item => {
      if (!target || Math.abs(item.body.position.x - this.body.position.x) < 
                     Math.abs(target.body.position.x - this.body.position.x)) {
        target = item;
      }
    });
    
    if (target) {
      const dx = target.body.position.x - this.body.position.x;
      if (Math.abs(dx) > 10) {
        const direction = Math.sign(dx);
        Body.applyForce(this.body, this.body.position, { x: this.moveForce * direction, y: 0 });
        
        // Jump if needed
        if (this.onGround && Math.random() < 0.05) {
          this.jump();
        }
      }
    } else {
      // Move right if no collectibles
      Body.applyForce(this.body, this.body.position, { x: this.moveForce, y: 0 });
    }
  }

  handleTest5() {
    // Move toward pit to test fall death
    if (!gameState.testState.fallTestComplete) {
      Body.applyForce(this.body, this.body.position, { x: this.moveForce * 2, y: 0 });
      
      // After some time, just fall
      if (Date.now() - gameState.testState.startTime > 3000) {
        Body.setPosition(this.body, { x: this.body.position.x, y: CANVAS_HEIGHT + 50 });
        gameState.testState.fallTestComplete = true;
      }
    }
  }

  jump() {
    if (this.onGround) {
      Body.setVelocity(this.body, { x: this.body.velocity.x, y: this.jumpForce * 20 });
    }
  }

  takeDamage() {
    gameState.playerHealth--;
    if (gameState.playerHealth <= 0) {
      this.die();
    }
  }

  heal() {
    if (gameState.playerHealth < gameState.maxHealth) {
      gameState.playerHealth++;
    }
  }

  die() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    this.p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_LOSE", reason: "player_died" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y - gameState.camera.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw leprechaun body
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, 30);
    
    // Draw hat
    this.p.fill(this.hatColor);
    this.p.triangle(-8, -15, 8, -15, 0, -25);
    
    // Draw eyes
    this.p.fill(COLORS.WHITE);
    this.p.circle(-5, -5, 4);
    this.p.circle(5, -5, 4);
    this.p.fill(COLORS.BLACK);
    this.p.circle(-5, -5, 2);
    this.p.circle(5, -5, 2);
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, type = 'basic') {
    this.p = p;
    this.type = type;
    
    this.body = Bodies.circle(x, y, 12, {
      label: 'enemy',
      friction: 0.8,
      restitution: 0.1,
      density: 0.001
    });
    World.add(gameState.world, this.body);

    this.color = COLORS.ENEMY_RED;
    this.moveSpeed = 0.002;
    this.direction = Math.random() < 0.5 ? -1 : 1;
    this.defeated = false;
    this.patrolDistance = 100;
    this.startX = x;
  }

  update() {
    if (this.defeated) return;
    
    // Simple patrol movement
    const distanceFromStart = this.body.position.x - this.startX;
    if (Math.abs(distanceFromStart) > this.patrolDistance) {
      this.direction *= -1;
    }
    
    Body.applyForce(this.body, this.body.position, { 
      x: this.moveSpeed * this.direction, 
      y: 0 
    });
  }

  defeat() {
    this.defeated = true;
    World.remove(gameState.world, this.body);
    gameState.score += 100;
  }

  render() {
    if (this.defeated) return;
    
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y - gameState.camera.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw enemy
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.circle(0, 0, 24);
    
    // Draw eyes
    this.p.fill(COLORS.WHITE);
    this.p.circle(-4, -3, 3);
    this.p.circle(4, -3, 3);
    this.p.fill(COLORS.BLACK);
    this.p.circle(-4, -3, 1);
    this.p.circle(4, -3, 1);
    
    this.p.pop();
  }
}

export class Coin {
  constructor(p, x, y) {
    this.p = p;
    
    this.body = Bodies.circle(x, y, 8, {
      label: 'coin',
      isSensor: true // No collision, just detection
    });
    World.add(gameState.world, this.body);

    this.color = COLORS.GOLD;
    this.collected = false;
    this.rotation = 0;
  }

  update() {
    this.rotation += 0.1;
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      World.remove(gameState.world, this.body);
      gameState.score += 10;
    }
  }

  render() {
    if (this.collected) return;
    
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y - gameState.camera.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    this.p.rotate(this.rotation);
    
    // Draw spinning coin
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.ellipse(0, 0, 16, 16 * Math.abs(Math.cos(this.rotation * 2)));
    
    this.p.pop();
  }
}

export class Cloverleaf {
  constructor(p, x, y) {
    this.p = p;
    
    this.body = Bodies.circle(x, y, 8, {
      label: 'cloverleaf',
      isSensor: true
    });
    World.add(gameState.world, this.body);

    this.color = COLORS.CLOVER_GREEN;
    this.collected = false;
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      World.remove(gameState.world, this.body);
      if (gameState.player) {
        gameState.player.heal();
      }
    }
  }

  render() {
    if (this.collected) return;
    
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y - gameState.camera.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw 4-leaf clover
    this.p.fill(this.color);
    this.p.noStroke();
    
    // Four leaves
    this.p.ellipse(-4, -4, 8, 8);
    this.p.ellipse(4, -4, 8, 8);
    this.p.ellipse(-4, 4, 8, 8);
    this.p.ellipse(4, 4, 8, 8);
    
    // Stem
    this.p.stroke(COLORS.GRASS_GREEN);
    this.p.strokeWeight(2);
    this.p.line(0, 6, 0, 12);
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, width, height) {
    this.p = p;
    
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: true
    });
    World.add(gameState.world, this.body);

    this.color = COLORS.BROWN;
    this.width = width;
    this.height = height;
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y - gameState.camera.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw platform
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.rect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Add grass on top
    this.p.fill(COLORS.GRASS_GREEN);
    this.p.rect(-this.width/2, -this.height/2, this.width, 5);
    
    this.p.pop();
  }
}

export class Flag {
  constructor(p, x, y) {
    this.p = p;
    
    this.body = Bodies.rectangle(x, y, 20, 80, {
      label: 'flag',
      isSensor: true,
      isStatic: true
    });
    World.add(gameState.world, this.body);

    this.flagColor = COLORS.FLAG_RED;
    this.poleColor = COLORS.FLAG_POLE;
    this.reached = false;
  }

  reach() {
    if (!this.reached) {
      this.reached = true;
      gameState.gamePhase = "GAME_OVER_WIN";
      this.p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", reason: "level_complete" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  render() {
    const screenX = this.body.position.x - gameState.camera.x;
    const screenY = this.body.position.y - gameState.camera.y;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw pole
    this.p.fill(this.poleColor);
    this.p.noStroke();
    this.p.rect(-2, -40, 4, 80);
    
    // Draw flag
    this.p.fill(this.flagColor);
    this.p.triangle(2, -35, 2, -15, 25, -25);
    
    this.p.pop();
  }
}