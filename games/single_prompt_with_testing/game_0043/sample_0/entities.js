// entities.js - Game entities (packages, customers, treasures, buildings)

export class Package {
  constructor(x, y, destinationId) {
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 20;
    this.destinationId = destinationId;
    this.pickedUp = false;
    this.delivered = false;
    this.bobOffset = Math.random() * Math.PI * 2;
  }
  
  render(p, cameraX, cameraY) {
    if (this.pickedUp || this.delivered) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    const bob = Math.sin(p.frameCount * 0.05 + this.bobOffset) * 3;
    
    p.push();
    
    // Package shadow
    p.fill(0, 0, 0, 30);
    p.noStroke();
    p.ellipse(screenX, screenY + this.height / 2 + 5, this.width, 8);
    
    // Package box
    p.fill(180, 120, 60);
    p.stroke(120, 80, 40);
    p.strokeWeight(2);
    p.rect(screenX - this.width / 2, screenY - this.height / 2 + bob, this.width, this.height, 2);
    
    // Package tape
    p.stroke(220, 200, 100);
    p.strokeWeight(3);
    p.line(screenX - this.width / 2, screenY + bob, screenX + this.width / 2, screenY + bob);
    p.line(screenX, screenY - this.height / 2 + bob, screenX, screenY + this.height / 2 + bob);
    
    // Glow effect
    p.noFill();
    p.stroke(255, 220, 100, 100);
    p.strokeWeight(2);
    p.rect(screenX - this.width / 2 - 3, screenY - this.height / 2 + bob - 3, this.width + 6, this.height + 6, 2);
    
    p.pop();
  }
  
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

export class Customer {
  constructor(x, y, id, name) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.width = 35;
    this.height = 45;
    this.waiting = true;
    this.satisfied = false;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.color = [
      Math.random() * 100 + 100,
      Math.random() * 100 + 100,
      Math.random() * 100 + 100
    ];
  }
  
  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    const wobble = Math.sin(p.frameCount * 0.03 + this.wobbleOffset) * 2;
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 30);
    p.noStroke();
    p.ellipse(screenX, screenY + this.height / 2 + 5, this.width, 10);
    
    // Body
    if (this.satisfied) {
      p.fill(100, 255, 100);
    } else if (this.waiting) {
      p.fill(...this.color);
    } else {
      p.fill(150, 150, 150);
    }
    p.stroke(this.color[0] - 50, this.color[1] - 50, this.color[2] - 50);
    p.strokeWeight(2);
    p.ellipse(screenX + wobble, screenY, this.width, this.height);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    p.ellipse(screenX - 6, screenY - 8, 8, 10);
    p.ellipse(screenX + 6, screenY - 8, 8, 10);
    
    p.fill(0);
    p.ellipse(screenX - 6, screenY - 7, 4, 5);
    p.ellipse(screenX + 6, screenY - 7, 4, 5);
    
    // Waiting indicator
    if (this.waiting && !this.satisfied) {
      p.fill(255, 200, 50);
      p.noStroke();
      const indicatorY = screenY - this.height / 2 - 15 + Math.sin(p.frameCount * 0.1) * 3;
      p.text("!", screenX, indicatorY);
    }
    
    // Satisfied indicator
    if (this.satisfied) {
      p.fill(100, 255, 100);
      p.noStroke();
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("✓", screenX, screenY - this.height / 2 - 15);
    }
    
    p.pop();
  }
  
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

export class Treasure {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 0: coin, 1: gem, 2: star
    this.width = 20;
    this.height = 20;
    this.collected = false;
    this.rotation = 0;
    this.bobOffset = Math.random() * Math.PI * 2;
  }
  
  render(p, cameraX, cameraY) {
    if (this.collected) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    const bob = Math.sin(p.frameCount * 0.05 + this.bobOffset) * 5;
    
    p.push();
    p.translate(screenX, screenY + bob);
    p.rotate(this.rotation);
    
    // Glow
    p.noFill();
    for (let i = 3; i > 0; i--) {
      p.stroke(255, 220, 100, 30 * i);
      p.strokeWeight(i * 2);
      p.ellipse(0, 0, this.width + i * 4, this.height + i * 4);
    }
    
    if (this.type === 0) {
      // Coin
      p.fill(255, 215, 0);
      p.stroke(200, 165, 0);
      p.strokeWeight(2);
      p.ellipse(0, 0, this.width, this.height);
      p.fill(200, 165, 0);
      p.noStroke();
      p.ellipse(0, 0, this.width - 8, this.height - 8);
    } else if (this.type === 1) {
      // Gem
      p.fill(100, 200, 255);
      p.stroke(50, 150, 200);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const r = i % 2 === 0 ? this.width / 2 : this.width / 3;
        p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
    } else {
      // Star
      p.fill(255, 255, 100);
      p.stroke(200, 200, 50);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i - Math.PI / 2;
        const r = i % 2 === 0 ? this.width / 2 : this.width / 4;
        p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
    }
    
    p.pop();
    
    this.rotation += 0.02;
  }
  
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

export class Building {
  constructor(x, y, width, height, color, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.type = type; // "house", "shop", "tree"
  }
  
  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    
    if (this.type === "house") {
      // Building body
      p.fill(...this.color);
      p.stroke(this.color[0] - 50, this.color[1] - 50, this.color[2] - 50);
      p.strokeWeight(2);
      p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
      
      // Roof
      p.fill(150, 75, 75);
      p.triangle(
        screenX - this.width / 2 - 10, screenY - this.height / 2,
        screenX + this.width / 2 + 10, screenY - this.height / 2,
        screenX, screenY - this.height / 2 - 30
      );
      
      // Windows
      p.fill(200, 230, 255);
      p.rect(screenX - 15, screenY - 20, 12, 12);
      p.rect(screenX + 3, screenY - 20, 12, 12);
      
      // Door
      p.fill(120, 80, 60);
      p.rect(screenX - 10, screenY + 10, 20, 30);
    } else if (this.type === "shop") {
      // Shop body
      p.fill(...this.color);
      p.stroke(this.color[0] - 50, this.color[1] - 50, this.color[2] - 50);
      p.strokeWeight(2);
      p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
      
      // Awning
      p.fill(200, 50, 50);
      p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, 20);
      p.triangle(
        screenX - this.width / 2, screenY - this.height / 2 + 20,
        screenX - this.width / 2 - 10, screenY - this.height / 2 + 30,
        screenX - this.width / 2, screenY - this.height / 2 + 30
      );
      p.triangle(
        screenX + this.width / 2, screenY - this.height / 2 + 20,
        screenX + this.width / 2 + 10, screenY - this.height / 2 + 30,
        screenX + this.width / 2, screenY - this.height / 2 + 30
      );
      
      // Window
      p.fill(200, 230, 255);
      p.rect(screenX - 20, screenY - 15, 40, 25);
    } else if (this.type === "tree") {
      // Tree trunk
      p.fill(100, 70, 50);
      p.noStroke();
      p.rect(screenX - 8, screenY, 16, this.height / 2);
      
      // Tree foliage
      p.fill(80, 150, 80);
      p.ellipse(screenX, screenY - this.height / 4, this.width, this.height / 2);
      p.ellipse(screenX - 15, screenY - this.height / 6, this.width * 0.8, this.height * 0.4);
      p.ellipse(screenX + 15, screenY - this.height / 6, this.width * 0.8, this.height * 0.4);
    }
    
    p.pop();
  }
  
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}

export class Obstacle {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // "platform", "rock"
  }
  
  render(p, cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    p.push();
    
    if (this.type === "platform") {
      p.fill(100, 80, 60);
      p.stroke(70, 50, 40);
      p.strokeWeight(2);
      p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height, 5);
    } else if (this.type === "rock") {
      p.fill(120, 120, 120);
      p.stroke(80, 80, 80);
      p.strokeWeight(2);
      p.ellipse(screenX, screenY, this.width, this.height);
      p.fill(100, 100, 100);
      p.noStroke();
      p.ellipse(screenX - 5, screenY - 3, this.width * 0.4, this.height * 0.4);
    }
    
    p.pop();
  }
  
  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}