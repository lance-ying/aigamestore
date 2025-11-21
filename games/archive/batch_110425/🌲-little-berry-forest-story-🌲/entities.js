// entities.js - Game entity classes

import { PLAYER_SIZE, CHARACTER_SIZE, ITEM_SIZE, COOKING_STATION_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.speed = 2;
    this.direction = 0; // For animation
    this.animFrame = 0;
  }

  update(vx, vy, sprint) {
    const speed = sprint ? 3.5 : this.speed;
    this.x += vx * speed;
    this.y += vy * speed;

    // Keep within bounds
    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y));

    // Update animation
    if (vx !== 0 || vy !== 0) {
      this.animFrame += 0.15;
      if (vx !== 0) this.direction = vx > 0 ? 0 : 1;
    }
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Body (cute character with hat)
    p.fill(120, 200, 120);
    p.ellipse(0, 0, this.size * 1.2, this.size * 1.4);
    
    // Face
    p.fill(255, 230, 200);
    p.ellipse(0, -2, this.size * 0.8, this.size * 0.8);
    
    // Hat
    p.fill(180, 100, 100);
    p.ellipse(0, -10, this.size * 0.9, this.size * 0.5);
    p.fill(200, 120, 120);
    p.ellipse(0, -14, this.size * 0.4, this.size * 0.6);
    
    // Eyes
    p.fill(0);
    const eyeOffset = 3;
    p.ellipse(-eyeOffset, -4, 3, 3);
    p.ellipse(eyeOffset, -4, 3, 3);
    
    // Smile
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.arc(0, 0, 8, 6, 0, p.PI);
    
    // Moving animation (bobbing)
    if (Math.sin(this.animFrame) > 0) {
      p.translate(0, -2);
    }
    
    p.pop();
  }
}

export class Character {
  constructor(id, name, x, y, color, story) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.size = CHARACTER_SIZE;
    this.color = color;
    this.story = story;
    this.interacted = false;
    this.animFrame = 0;
    this.showExclamation = true;
  }

  update() {
    this.animFrame += 0.05;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Character body (round cute style)
    p.fill(...this.color);
    p.ellipse(0, 0, this.size, this.size * 1.1);
    
    // Face
    p.fill(255, 250, 240);
    p.ellipse(0, -2, this.size * 0.6, this.size * 0.6);
    
    // Eyes
    p.fill(0);
    p.ellipse(-4, -4, 4, 4);
    p.ellipse(4, -4, 4, 4);
    
    // Ears (small triangles)
    p.fill(...this.color);
    p.triangle(-8, -12, -4, -18, -4, -12);
    p.triangle(8, -12, 4, -18, 4, -12);
    
    // Exclamation mark if not interacted
    if (!this.interacted && this.showExclamation) {
      p.fill(255, 200, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      const bounce = Math.sin(this.animFrame * 4) * 2;
      p.text("!", 0, -25 + bounce);
    }
    
    // Name label
    if (this.interacted) {
      p.fill(100, 200, 100);
      p.noStroke();
      p.ellipse(10, -10, 8, 8);
    }
    
    p.pop();
  }

  interact() {
    this.interacted = true;
    this.showExclamation = false;
  }
}

export class Ingredient {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = ITEM_SIZE;
    this.collected = false;
    this.animFrame = 0;
  }

  update() {
    this.animFrame += 0.1;
  }

  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y + Math.sin(this.animFrame) * 2);
    
    // Draw based on type
    switch(this.type) {
      case "strawberry":
        p.fill(255, 80, 80);
        p.beginShape();
        p.vertex(0, 5);
        p.vertex(-5, -2);
        p.vertex(0, -5);
        p.vertex(5, -2);
        p.endShape(p.CLOSE);
        p.fill(100, 200, 100);
        p.ellipse(0, -5, 4, 2);
        break;
      case "blueberry":
        p.fill(80, 80, 255);
        p.ellipse(0, 0, this.size, this.size);
        break;
      case "mushroom":
        p.fill(200, 100, 100);
        p.arc(0, 0, this.size, this.size, p.PI, 0);
        p.fill(240, 230, 210);
        p.rect(-3, 0, 6, 8);
        break;
      case "honey":
        p.fill(255, 200, 50);
        p.ellipse(0, 0, this.size * 0.8, this.size * 1.2);
        p.fill(255, 220, 100);
        p.ellipse(0, 0, this.size * 0.6, this.size);
        break;
      case "flour":
        p.fill(250, 250, 240);
        p.rect(-6, -6, 12, 12);
        p.fill(200, 200, 190);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text("F", 0, 0);
        break;
    }
    
    p.pop();
  }

  collect() {
    this.collected = true;
  }
}

export class CookingStation {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = COOKING_STATION_SIZE;
    this.animFrame = 0;
  }

  update() {
    this.animFrame += 0.08;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Station base
    p.fill(139, 90, 60);
    p.rect(-this.size/2, -this.size/2, this.size, this.size);
    
    // Pot
    p.fill(100, 100, 120);
    p.ellipse(0, -5, 25, 20);
    p.rect(-12, -5, 24, 15);
    
    // Steam effect
    p.fill(200, 200, 220, 150);
    for (let i = 0; i < 3; i++) {
      const offset = (this.animFrame + i * 0.3) % 2;
      p.ellipse(-8 + i * 8, -15 - offset * 10, 4, 6);
    }
    
    // Label
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text("Press Z", 0, 25);
    
    p.pop();
  }
}