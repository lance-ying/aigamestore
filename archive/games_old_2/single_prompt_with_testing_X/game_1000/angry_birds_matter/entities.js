// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body } = Matter;

export class Bird {
  constructor(x, y, radius = 15) {
    this.body = Bodies.circle(x, y, radius, {
      density: 0.002,
      restitution: 0.4,
      friction: 0.5,
      label: 'bird'
    });
    this.radius = radius;
    this.launched = false;
    this.color = '#DD0000';
  }

  draw(ctx, cameraX, cameraY) {
    ctx.save();
    ctx.translate(this.body.position.x - cameraX, this.body.position.y - cameraY);
    ctx.rotate(this.body.angle);
    
    // Draw bird body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-5, -3, 4, 0, Math.PI * 2);
    ctx.arc(5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-4, -3, 2, 0, Math.PI * 2);
    ctx.arc(6, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw beak
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 0);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

export class Pig {
  constructor(x, y, radius = 18) {
    this.body = Bodies.circle(x, y, radius, {
      density: 0.001,
      restitution: 0.3,
      friction: 0.5,
      label: 'pig'
    });
    this.radius = radius;
    this.health = 100;
    this.alive = true;
    this.color = '#00DD00';
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  draw(ctx, cameraX, cameraY) {
    if (!this.alive) return;
    
    ctx.save();
    ctx.translate(this.body.position.x - cameraX, this.body.position.y - cameraY);
    ctx.rotate(this.body.angle);
    
    // Draw pig body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw snout
    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw nostrils
    ctx.fillStyle = '#006600';
    ctx.beginPath();
    ctx.arc(-3, 2, 2, 0, Math.PI * 2);
    ctx.arc(3, 2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-6, -4, 4, 0, Math.PI * 2);
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5, -3, 2, 0, Math.PI * 2);
    ctx.arc(7, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export class StructureBlock {
  constructor(x, y, width, height, type = 'wood') {
    this.body = Bodies.rectangle(x, y, width, height, {
      density: 0.001,
      restitution: 0.2,
      friction: 0.8,
      label: 'structure'
    });
    this.width = width;
    this.height = height;
    this.type = type;
    this.health = 100;
    this.destroyed = false;
    
    if (type === 'wood') {
      this.color = '#8B4513';
    } else if (type === 'stone') {
      this.color = '#808080';
      this.health = 200;
      this.body.density = 0.002;
    } else if (type === 'glass') {
      this.color = '#ADD8E6';
      this.health = 30;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroyed = true;
    }
  }

  draw(ctx, cameraX, cameraY) {
    if (this.destroyed) return;
    
    ctx.save();
    ctx.translate(this.body.position.x - cameraX, this.body.position.y - cameraY);
    ctx.rotate(this.body.angle);
    
    // Draw block with texture
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Add texture lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    if (this.type === 'wood') {
      for (let i = -this.width / 2; i < this.width / 2; i += 5) {
        ctx.beginPath();
        ctx.moveTo(i, -this.height / 2);
        ctx.lineTo(i, this.height / 2);
        ctx.stroke();
      }
    }
    
    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    ctx.restore();
  }
}

export class Slingshot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseWidth = 15;
    this.baseHeight = 60;
    this.bandWidth = 3;
  }

  draw(ctx, cameraX, cameraY, bird = null, isPulling = false, pullX = 0, pullY = 0) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    ctx.save();
    
    // Draw base posts
    ctx.fillStyle = '#654321';
    ctx.fillRect(screenX - this.baseWidth - 5, screenY, 8, this.baseHeight);
    ctx.fillRect(screenX + this.baseWidth - 3, screenY, 8, this.baseHeight);
    
    // Draw bands
    if (bird && isPulling) {
      const birdScreenX = pullX - cameraX;
      const birdScreenY = pullY - cameraY;
      
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = this.bandWidth;
      
      ctx.beginPath();
      ctx.moveTo(screenX - this.baseWidth, screenY + 10);
      ctx.lineTo(birdScreenX, birdScreenY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(screenX + this.baseWidth, screenY + 10);
      ctx.lineTo(birdScreenX, birdScreenY);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = this.bandWidth;
      
      ctx.beginPath();
      ctx.moveTo(screenX - this.baseWidth, screenY + 10);
      ctx.lineTo(screenX, screenY + 30);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(screenX + this.baseWidth, screenY + 10);
      ctx.lineTo(screenX, screenY + 30);
      ctx.stroke();
    }
    
    ctx.restore();
  }
}