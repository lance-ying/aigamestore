// entities.js - Entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, LANE_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT, NUM_LANES } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.targetLane = 1; // Middle lane (0, 1, 2)
    this.currentLane = 1;
    
    // Stack of cups
    this.cups = [new Cup(p, x, y, 0)]; // Start with 1 cup
    
    this.moveSpeed = 0.15; // Speed of lane transition
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
    // Move toward target lane
    const targetX = (this.targetLane + 0.5) * LANE_WIDTH;
    const currentX = this.cups[0].body.position.x;
    
    if (Math.abs(currentX - targetX) > 1) {
      const dx = targetX - currentX;
      const moveX = Math.sign(dx) * Math.min(Math.abs(dx), this.moveSpeed * 60);
      
      // Move all cups in the stack
      this.cups.forEach((cup, index) => {
        const newX = cup.body.position.x + moveX;
        Body.setPosition(cup.body, { x: newX, y: cup.body.position.y });
      });
    }
    
    // Update all cups
    this.cups.forEach(cup => cup.update());
    
    // Log player position if changed significantly
    const baseX = this.cups[0]?.body.position.x || 0;
    const baseY = this.cups[0]?.body.position.y || 0;
    
    if (Math.abs(baseX - this.lastLoggedX) > 10 || Math.abs(baseY - this.lastLoggedY) > 10) {
      this.p.logs.player_info.push({
        screen_x: baseX,
        screen_y: baseY,
        game_x: baseX,
        game_y: gameState.distanceTraveled,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = baseX;
      this.lastLoggedY = baseY;
    }
  }

  render() {
    this.cups.forEach(cup => cup.render());
  }

  moveLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
    }
  }

  moveRight() {
    if (this.targetLane < NUM_LANES - 1) {
      this.targetLane++;
    }
  }

  addCup() {
    const topCup = this.cups[this.cups.length - 1];
    const newY = topCup.body.position.y - 25; // Stack height
    const newCup = new Cup(this.p, topCup.body.position.x, newY, this.cups.length);
    this.cups.push(newCup);
    gameState.cupsCollected++;
  }

  removeCup() {
    if (this.cups.length > 0) {
      const removedCup = this.cups.pop();
      World.remove(gameState.world, removedCup.body);
    }
  }

  isEmpty() {
    return this.cups.length === 0;
  }

  applyGate(gateType) {
    // Apply gate effect to all cups
    this.cups.forEach(cup => {
      if (gateType === 'coffee' && !cup.hasCoffee) {
        cup.hasCoffee = true;
        cup.value += 3;
      } else if (gateType === 'sleeve' && !cup.hasSleeve) {
        cup.hasSleeve = true;
        cup.value += 3;
      } else if (gateType === 'lid' && !cup.hasLid) {
        cup.hasLid = true;
        cup.value += 3;
      }
    });
    gameState.gatesPassed++;
  }
}

export class Cup {
  constructor(p, x, y, stackIndex) {
    this.p = p;
    this.stackIndex = stackIndex;
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, 20, 24, {
      label: 'cup',
      isSensor: true, // Don't collide with physics
      isStatic: false
    });
    
    World.add(gameState.world, this.body);
    
    // Customization state
    this.hasCoffee = false;
    this.hasSleeve = false;
    this.hasLid = false;
    this.value = 1; // Base value
  }

  update() {
    // Keep cup following the base position
    // (Player class handles positioning)
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Draw cup body
    this.p.fill(255, 250, 240); // Off-white
    this.p.stroke(150, 100, 50);
    this.p.strokeWeight(1);
    
    // Trapezoid shape for cup
    this.p.beginShape();
    this.p.vertex(-8, 12);
    this.p.vertex(-10, -12);
    this.p.vertex(10, -12);
    this.p.vertex(8, 12);
    this.p.endShape(this.p.CLOSE);
    
    // Draw coffee if has coffee
    if (this.hasCoffee) {
      this.p.fill(101, 67, 33); // Brown coffee
      this.p.noStroke();
      this.p.beginShape();
      this.p.vertex(-7, 8);
      this.p.vertex(-9, -8);
      this.p.vertex(9, -8);
      this.p.vertex(7, 8);
      this.p.endShape(this.p.CLOSE);
    }
    
    // Draw sleeve if has sleeve
    if (this.hasSleeve) {
      this.p.fill(139, 69, 19); // Saddle brown
      this.p.noStroke();
      this.p.rect(-9, -2, 18, 8);
    }
    
    // Draw lid if has lid
    if (this.hasLid) {
      this.p.fill(255, 255, 255);
      this.p.stroke(150, 100, 50);
      this.p.strokeWeight(1);
      this.p.ellipse(0, -12, 22, 8);
      this.p.fill(200, 200, 200);
      this.p.noStroke();
      this.p.ellipse(0, -12, 18, 6);
    }
    
    this.p.pop();
  }
}

export class Collectible {
  constructor(p, x, y, lane) {
    this.p = p;
    this.lane = lane;
    this.collected = false;
    
    this.body = Bodies.circle(x, y, 12, {
      label: 'collectible',
      isSensor: true,
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
  }

  update() {
    // Static, just exists
  }

  render() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Draw empty cup icon
    this.p.fill(255, 250, 240);
    this.p.stroke(150, 100, 50);
    this.p.strokeWeight(2);
    this.p.beginShape();
    this.p.vertex(-8, 10);
    this.p.vertex(-10, -10);
    this.p.vertex(10, -10);
    this.p.vertex(8, 10);
    this.p.endShape(this.p.CLOSE);
    
    // Sparkle effect
    this.p.noStroke();
    this.p.fill(255, 255, 0, 150);
    this.p.circle(-12, -8, 4);
    this.p.circle(12, 8, 4);
    
    this.p.pop();
  }

  collect() {
    this.collected = true;
  }
}

export class Obstacle {
  constructor(p, x, y, lane) {
    this.p = p;
    this.lane = lane;
    this.hit = false;
    
    this.body = Bodies.rectangle(x, y, 30, 30, {
      label: 'obstacle',
      isSensor: true,
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
  }

  update() {
    // Rotate for visual effect
    Body.rotate(this.body, 0.02);
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw barrier/grinder
    this.p.fill(180, 50, 50);
    this.p.stroke(120, 30, 30);
    this.p.strokeWeight(2);
    this.p.rect(-15, -15, 30, 30);
    
    // X mark
    this.p.stroke(255, 100, 100);
    this.p.strokeWeight(3);
    this.p.line(-10, -10, 10, 10);
    this.p.line(-10, 10, 10, -10);
    
    this.p.pop();
  }

  onHit() {
    this.hit = true;
  }
}

export class Gate {
  constructor(p, x, y, type) {
    this.p = p;
    this.type = type; // 'coffee', 'sleeve', 'lid'
    this.activated = false;
    
    this.body = Bodies.rectangle(x, y, LANE_WIDTH * NUM_LANES, 40, {
      label: `gate_${type}`,
      isSensor: true,
      isStatic: true
    });
    
    World.add(gameState.world, this.body);
  }

  update() {
    // Static
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Draw gate background
    const alpha = this.activated ? 100 : 200;
    if (this.type === 'coffee') {
      this.p.fill(101, 67, 33, alpha);
    } else if (this.type === 'sleeve') {
      this.p.fill(139, 69, 19, alpha);
    } else if (this.type === 'lid') {
      this.p.fill(200, 200, 200, alpha);
    }
    
    this.p.noStroke();
    this.p.rect(-CANVAS_WIDTH / 2, -20, CANVAS_WIDTH, 40);
    
    // Draw label
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(16);
    this.p.text(this.type.toUpperCase(), 0, 0);
    
    this.p.pop();
  }

  activate() {
    this.activated = true;
  }
}

export class Customer {
  constructor(p, x, y, index) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.index = index;
    this.satisfied = false;
  }

  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Draw simple customer
    // Head
    this.p.fill(this.satisfied ? 100 : 255, 200, 150);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.circle(0, -15, 20);
    
    // Body
    this.p.fill(this.satisfied ? 50 : 100, this.satisfied ? 150 : 100, 200);
    this.p.rect(-10, 0, 20, 25);
    
    // Eyes
    this.p.fill(0);
    this.p.noStroke();
    this.p.circle(-5, -17, 3);
    this.p.circle(5, -17, 3);
    
    // Mouth
    if (this.satisfied) {
      this.p.stroke(0);
      this.p.strokeWeight(2);
      this.p.noFill();
      this.p.arc(0, -12, 8, 8, 0, this.p.PI);
    }
    
    this.p.pop();
  }

  serve() {
    this.satisfied = true;
  }
}