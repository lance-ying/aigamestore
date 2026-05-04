// ball.js
import { CANVAS_WIDTH } from './globals.js';

export class Ball {
  constructor(p, x, y, radius = 50) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.layers = []; // Each layer: { type, color, data }
    this.initializeWhite();
  }

  initializeWhite() {
    this.layers = [{
      type: 'base',
      color: [255, 255, 255]
    }];
  }

  reset() {
    this.initializeWhite();
  }

  applyOperation(operation) {
    switch (operation.type) {
      case 'paint':
        this.applyPaint(operation.color);
        break;
      case 'mask_circle':
        this.applyCircleMask(operation.positions, operation.sizes);
        break;
      case 'mask_horizontal':
        this.applyHorizontalMask();
        break;
      case 'mask_vertical':
        this.applyVerticalMask();
        break;
      case 'dots':
        this.applyDots(operation.color, operation.count);
        break;
      case 'stripes':
        this.applyStripes(operation.color, operation.count);
        break;
      case 'ring':
        this.applyRing(operation.color, operation.thickness);
        break;
    }
  }

  applyPaint(color) {
    // Paint overwrites everything
    this.layers = [{
      type: 'base',
      color: color
    }];
  }

  applyCircleMask(positions, sizes) {
    // Add white circles at positions
    this.layers.push({
      type: 'circles',
      color: [255, 255, 255],
      positions: positions,
      sizes: sizes
    });
  }

  applyHorizontalMask() {
    // Adds white horizontal band in middle
    this.layers.push({
      type: 'horizontal_band',
      color: [255, 255, 255]
    });
  }

  applyVerticalMask() {
    // Adds white vertical band in middle
    this.layers.push({
      type: 'vertical_band',
      color: [255, 255, 255]
    });
  }

  applyDots(color, count) {
    this.layers.push({
      type: 'dots',
      color: color,
      count: count
    });
  }

  applyStripes(color, count) {
    this.layers.push({
      type: 'stripes',
      color: color,
      count: count
    });
  }

  applyRing(color, thickness) {
    this.layers.push({
      type: 'ring',
      color: color,
      thickness: thickness
    });
  }

  render() {
    const p = this.p;
    p.push();
    
    // Render each layer in order
    for (let layer of this.layers) {
      this.renderLayer(layer);
    }
    
    // Outline
    p.noFill();
    p.stroke(80);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    p.pop();
  }

  renderLayer(layer) {
    const p = this.p;
    
    switch (layer.type) {
      case 'base':
        p.fill(...layer.color);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        break;
        
      case 'circles':
        p.fill(...layer.color);
        p.noStroke();
        for (let i = 0; i < layer.positions.length; i++) {
          const pos = layer.positions[i];
          const size = layer.sizes[i];
          p.circle(
            this.x + pos.x * this.radius,
            this.y + pos.y * this.radius,
            size * this.radius * 2
          );
        }
        break;
        
      case 'horizontal_band':
        p.fill(...layer.color);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.radius * 2, this.radius * 0.6);
        break;
        
      case 'vertical_band':
        p.fill(...layer.color);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.radius * 0.6, this.radius * 2);
        break;
        
      case 'dots':
        p.fill(...layer.color);
        p.noStroke();
        const dotPositions = this.getDotPositions(layer.count);
        for (let pos of dotPositions) {
          p.circle(
            this.x + pos.x * this.radius * 0.7,
            this.y + pos.y * this.radius * 0.7,
            this.radius * 0.2
          );
        }
        break;
        
      case 'stripes':
        p.fill(...layer.color);
        p.noStroke();
        const stripeWidth = (this.radius * 2) / (layer.count * 2 + 1);
        for (let i = 0; i < layer.count; i++) {
          const x = this.x - this.radius + stripeWidth * (i * 2 + 1);
          // Clip to circle
          p.push();
          p.drawingContext.save();
          p.drawingContext.beginPath();
          p.drawingContext.arc(this.x, this.y, this.radius, 0, p.TWO_PI);
          p.drawingContext.clip();
          p.rect(x, this.y - this.radius, stripeWidth, this.radius * 2);
          p.drawingContext.restore();
          p.pop();
        }
        break;
        
      case 'ring':
        p.noFill();
        p.stroke(...layer.color);
        p.strokeWeight(layer.thickness * this.radius);
        p.circle(this.x, this.y, (this.radius - layer.thickness * this.radius / 2) * 2);
        break;
    }
  }

  getDotPositions(count) {
    const positions = [];
    if (count === 4) {
      positions.push({ x: 0.6, y: 0.6 });
      positions.push({ x: -0.6, y: 0.6 });
      positions.push({ x: 0.6, y: -0.6 });
      positions.push({ x: -0.6, y: -0.6 });
    } else if (count === 5) {
      positions.push({ x: 0, y: 0 });
      positions.push({ x: 0.7, y: 0 });
      positions.push({ x: -0.7, y: 0 });
      positions.push({ x: 0, y: 0.7 });
      positions.push({ x: 0, y: -0.7 });
    } else if (count === 6) {
      positions.push({ x: 0.6, y: 0.6 });
      positions.push({ x: -0.6, y: 0.6 });
      positions.push({ x: 0.6, y: -0.6 });
      positions.push({ x: -0.6, y: -0.6 });
      positions.push({ x: 0.7, y: 0 });
      positions.push({ x: -0.7, y: 0 });
    }
    return positions;
  }

  matches(otherBall) {
    // Compare layers
    if (this.layers.length !== otherBall.layers.length) {
      return false;
    }
    
    for (let i = 0; i < this.layers.length; i++) {
      const layer1 = this.layers[i];
      const layer2 = otherBall.layers[i];
      
      if (layer1.type !== layer2.type) return false;
      
      // Compare colors
      if (layer1.color && layer2.color) {
        for (let j = 0; j < 3; j++) {
          if (layer1.color[j] !== layer2.color[j]) return false;
        }
      }
      
      // Compare type-specific properties
      if (layer1.type === 'circles') {
        if (layer1.positions.length !== layer2.positions.length) return false;
      }
      if (layer1.type === 'dots' || layer1.type === 'stripes') {
        if (layer1.count !== layer2.count) return false;
      }
      if (layer1.type === 'ring') {
        if (layer1.thickness !== layer2.thickness) return false;
      }
    }
    
    return true;
  }

  clone() {
    const newBall = new Ball(this.p, this.x, this.y, this.radius);
    newBall.layers = JSON.parse(JSON.stringify(this.layers));
    return newBall;
  }
}

export default Ball;