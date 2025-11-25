// memory.js - Memory scenes and fragments
import { CANVAS_WIDTH, CANVAS_HEIGHT, MEMORY_TYPES } from './globals.js';

export class Memory {
  constructor(p, type, description, color) {
    this.p = p;
    this.type = type;
    this.description = description;
    this.color = color;
    this.fragments = [];
    this.objects = [];
    this.backgroundElements = [];
    this.alpha = 0;
  }

  addFragment(x, y) {
    this.fragments.push(new Fragment(this.p, x, y, this.type));
  }

  addObject(x, y, width, height, visualType) {
    this.objects.push(new MemoryObject(this.p, x, y, width, height, visualType, this.type));
  }

  addBackgroundElement(x, y, elementType) {
    this.backgroundElements.push({ x, y, type: elementType });
  }

  update() {
    this.fragments.forEach(f => f.update());
    this.objects.forEach(o => o.update());
  }

  draw() {
    this.p.push();
    
    // Draw background based on memory type
    this.drawBackground();
    
    // Draw background decorative elements
    this.backgroundElements.forEach(el => this.drawBackgroundElement(el));
    
    // Draw objects
    this.objects.forEach(o => o.draw());
    
    // Draw fragments
    this.fragments.forEach(f => f.draw());
    
    // Draw memory description
    this.p.fill(255, 255, 255, 150);
    this.p.textAlign(this.p.CENTER);
    this.p.textSize(14);
    this.p.text(this.description, CANVAS_WIDTH/2, 30);
    
    this.p.pop();
  }

  drawBackground() {
    const colors = this.getBackgroundColors();
    
    // Gradient background
    for (let y = 0; y < CANVAS_HEIGHT - 50; y++) {
      const inter = y / (CANVAS_HEIGHT - 50);
      const c = this.p.lerpColor(
        this.p.color(...colors.top),
        this.p.color(...colors.bottom),
        inter
      );
      this.p.stroke(c);
      this.p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Ground
    this.p.noStroke();
    this.p.fill(...colors.ground);
    this.p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
  }

  getBackgroundColors() {
    switch(this.type) {
      case MEMORY_TYPES.CHILDHOOD:
        return {
          top: [135, 206, 235, 255],
          bottom: [255, 218, 185, 255],
          ground: [144, 238, 144, 255]
        };
      case MEMORY_TYPES.FIRST_LOVE:
        return {
          top: [255, 182, 193, 255],
          bottom: [255, 218, 224, 255],
          ground: [255, 228, 225, 255]
        };
      case MEMORY_TYPES.ARTISTIC:
        return {
          top: [147, 112, 219, 255],
          bottom: [186, 85, 211, 255],
          ground: [138, 43, 226, 150]
        };
      case MEMORY_TYPES.REGRET:
        return {
          top: [70, 70, 90, 255],
          bottom: [50, 50, 70, 255],
          ground: [40, 40, 60, 255]
        };
      case MEMORY_TYPES.PEACE:
        return {
          top: [240, 248, 255, 255],
          bottom: [230, 230, 250, 255],
          ground: [255, 255, 255, 200]
        };
      default:
        return {
          top: [100, 100, 120, 255],
          bottom: [80, 80, 100, 255],
          ground: [60, 60, 80, 255]
        };
    }
  }

  drawBackgroundElement(el) {
    this.p.push();
    const time = this.p.frameCount * 0.02;
    
    switch(el.type) {
      case 'cloud':
        this.p.noStroke();
        this.p.fill(255, 255, 255, 180);
        this.p.ellipse(el.x, el.y, 40, 25);
        this.p.ellipse(el.x + 20, el.y, 50, 30);
        this.p.ellipse(el.x + 40, el.y, 40, 25);
        break;
      case 'star':
        this.p.fill(255, 255, 200, 200);
        this.p.noStroke();
        const size = 3 + this.p.sin(time + el.x) * 1;
        this.p.ellipse(el.x, el.y, size, size);
        break;
      case 'heart':
        this.p.fill(255, 182, 193, 150);
        this.p.noStroke();
        const s = 15;
        this.p.ellipse(el.x - s/4, el.y, s/2, s/2);
        this.p.ellipse(el.x + s/4, el.y, s/2, s/2);
        this.p.triangle(el.x - s/2, el.y, el.x + s/2, el.y, el.x, el.y + s/2);
        break;
      case 'rain':
        this.p.stroke(150, 150, 170, 150);
        this.p.strokeWeight(1);
        const offsetY = (this.p.frameCount * 3 + el.x) % CANVAS_HEIGHT;
        this.p.line(el.x, offsetY, el.x, offsetY + 10);
        break;
    }
    
    this.p.pop();
  }
}

export class Fragment {
  constructor(p, x, y, memoryType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.collected = false;
    this.memoryType = memoryType;
    this.radius = 8;
    this.pulsePhase = this.p.random(this.p.TWO_PI);
    this.floatPhase = this.p.random(this.p.TWO_PI);
  }

  update() {
    // Floating animation
    this.floatPhase += 0.05;
  }

  draw() {
    if (this.collected) return;

    this.p.push();
    
    const floatOffset = this.p.sin(this.floatPhase) * 3;
    const drawY = this.y + floatOffset;
    
    // Glow effect
    this.p.noStroke();
    this.p.fill(255, 215, 0, 30);
    this.p.ellipse(this.x, drawY, this.radius * 4, this.radius * 4);
    
    // Main fragment
    const pulse = 1 + this.p.sin(this.p.frameCount * 0.1 + this.pulsePhase) * 0.2;
    this.p.fill(255, 215, 0, 220);
    this.p.ellipse(this.x, drawY, this.radius * 2 * pulse, this.radius * 2 * pulse);
    
    // Inner sparkle
    this.p.fill(255, 255, 200, 250);
    this.p.ellipse(this.x, drawY, this.radius * pulse, this.radius * pulse);
    
    // Particle trails
    for (let i = 0; i < 3; i++) {
      const angle = this.p.frameCount * 0.05 + i * this.p.TWO_PI / 3;
      const particleX = this.x + this.p.cos(angle) * 12;
      const particleY = drawY + this.p.sin(angle) * 12;
      this.p.fill(255, 215, 0, 100);
      this.p.ellipse(particleX, particleY, 3, 3);
    }
    
    this.p.pop();
  }

  checkCollision(player) {
    if (this.collected) return false;
    
    const dist = this.p.dist(
      player.x + player.width/2,
      player.y + player.height/2,
      this.x,
      this.y
    );
    
    return dist < this.radius + player.width/2;
  }
}

export class MemoryObject {
  constructor(p, x, y, width, height, visualType, memoryType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visualType = visualType;
    this.memoryType = memoryType;
  }

  update() {
    // Animation updates can go here
  }

  draw() {
    this.p.push();
    
    switch(this.visualType) {
      case 'house':
        this.drawHouse();
        break;
      case 'tree':
        this.drawTree();
        break;
      case 'easel':
        this.drawEasel();
        break;
      case 'swing':
        this.drawSwing();
        break;
      case 'bench':
        this.drawBench();
        break;
      case 'door':
        this.drawDoor();
        break;
    }
    
    this.p.pop();
  }

  drawHouse() {
    // House body
    this.p.fill(200, 150, 100);
    this.p.stroke(150, 100, 70);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Roof
    this.p.fill(180, 100, 80);
    this.p.triangle(
      this.x - 10, this.y,
      this.x + this.width + 10, this.y,
      this.x + this.width/2, this.y - 30
    );
    
    // Window
    this.p.fill(135, 206, 235, 150);
    this.p.rect(this.x + 10, this.y + 15, 20, 20);
  }

  drawTree() {
    // Trunk
    this.p.fill(101, 67, 33);
    this.p.stroke(80, 50, 20);
    this.p.strokeWeight(2);
    this.p.rect(this.x + this.width/2 - 8, this.y + 20, 16, 40);
    
    // Leaves
    this.p.fill(34, 139, 34, 200);
    this.p.noStroke();
    this.p.ellipse(this.x + this.width/2, this.y, 50, 50);
    this.p.ellipse(this.x + this.width/2 - 15, this.y + 10, 40, 40);
    this.p.ellipse(this.x + this.width/2 + 15, this.y + 10, 40, 40);
  }

  drawEasel() {
    // Easel legs
    this.p.stroke(139, 90, 43);
    this.p.strokeWeight(3);
    this.p.line(this.x, this.y + this.height, this.x + this.width/2, this.y);
    this.p.line(this.x + this.width, this.y + this.height, this.x + this.width/2, this.y);
    this.p.line(this.x + 10, this.y + this.height, this.x + this.width - 10, this.y + this.height);
    
    // Canvas
    this.p.fill(255, 250, 240);
    this.p.stroke(100);
    this.p.strokeWeight(2);
    this.p.rect(this.x + 10, this.y + 10, this.width - 20, this.height - 40);
    
    // Paint on canvas
    this.p.noStroke();
    this.p.fill(255, 100, 150, 200);
    this.p.ellipse(this.x + this.width/2, this.y + 30, 20, 20);
  }

  drawSwing() {
    // Ropes
    this.p.stroke(139, 90, 43);
    this.p.strokeWeight(2);
    const swingOffset = this.p.sin(this.p.frameCount * 0.05) * 5;
    this.p.line(this.x + 10, this.y, this.x + 10 + swingOffset, this.y + this.height - 10);
    this.p.line(this.x + this.width - 10, this.y, this.x + this.width - 10 + swingOffset, this.y + this.height - 10);
    
    // Seat
    this.p.fill(139, 90, 43);
    this.p.noStroke();
    this.p.rect(this.x + swingOffset, this.y + this.height - 15, this.width, 10, 3);
  }

  drawBench() {
    // Seat
    this.p.fill(139, 90, 43);
    this.p.stroke(100, 60, 30);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, 8, 2);
    
    // Legs
    this.p.line(this.x + 10, this.y, this.x + 10, this.y + this.height);
    this.p.line(this.x + this.width - 10, this.y, this.x + this.width - 10, this.y + this.height);
  }

  drawDoor() {
    // Door
    this.p.fill(240, 240, 255, 220);
    this.p.stroke(200, 200, 220);
    this.p.strokeWeight(3);
    this.p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Door glow
    this.p.noStroke();
    this.p.fill(255, 255, 255, 100);
    this.p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 10, 3);
    
    // Light rays
    for (let i = 0; i < 5; i++) {
      const alpha = 20 + this.p.sin(this.p.frameCount * 0.05 + i) * 10;
      this.p.fill(255, 255, 200, alpha);
      this.p.beginShape();
      this.p.vertex(this.x + this.width/2, this.y + this.height/2);
      const angle = i * this.p.TWO_PI / 5 + this.p.frameCount * 0.02;
      this.p.vertex(this.x + this.width/2 + this.p.cos(angle) * 100, this.y + this.height/2 + this.p.sin(angle) * 100);
      this.p.vertex(this.x + this.width/2 + this.p.cos(angle + 0.3) * 100, this.y + this.height/2 + this.p.sin(angle + 0.3) * 100);
      this.p.endShape(this.p.CLOSE);
    }
  }
}