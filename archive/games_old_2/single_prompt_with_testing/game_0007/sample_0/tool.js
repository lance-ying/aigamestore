// tool.js

export class Tool {
  constructor(p, name, type, data, x, y, size = 40) {
    this.p = p;
    this.name = name;
    this.type = type;
    this.data = data;
    this.x = x;
    this.y = y;
    this.size = size;
    this.isSelected = false;
  }

  render() {
    const p = this.p;
    p.push();
    
    // Background
    if (this.isSelected) {
      p.fill(100, 150, 255, 150);
      p.stroke(100, 150, 255);
    } else {
      p.fill(60, 60, 70);
      p.stroke(100);
    }
    p.strokeWeight(2);
    p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size, 5);
    
    // Draw tool icon
    this.renderIcon();
    
    p.pop();
  }

  renderIcon() {
    const p = this.p;
    const s = this.size * 0.7;
    
    switch (this.type) {
      case 'paint':
        // Paint bucket
        p.fill(...this.data.color);
        p.noStroke();
        p.beginShape();
        p.vertex(this.x - s/3, this.y - s/4);
        p.vertex(this.x + s/3, this.y - s/4);
        p.vertex(this.x + s/4, this.y + s/3);
        p.vertex(this.x - s/4, this.y + s/3);
        p.endShape(p.CLOSE);
        // Handle
        p.stroke(...this.data.color);
        p.strokeWeight(2);
        p.noFill();
        p.arc(this.x, this.y - s/3, s/2, s/3, p.PI, 0);
        break;
        
      case 'mask_circle':
        // Glasses/mask icon
        p.fill(255);
        p.noStroke();
        for (let pos of this.data.positions) {
          p.circle(
            this.x + pos.x * s * 0.4,
            this.y + pos.y * s * 0.4,
            this.data.sizes[0] * s * 0.8
          );
        }
        p.stroke(150);
        p.strokeWeight(2);
        p.noFill();
        p.line(this.x - s*0.15, this.y, this.x + s*0.15, this.y);
        break;
        
      case 'mask_horizontal':
        // Horizontal band
        p.fill(255);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, s, s * 0.4);
        break;
        
      case 'mask_vertical':
        // Vertical band
        p.fill(255);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, s * 0.4, s);
        break;
        
      case 'dots':
        // Dots pattern
        p.fill(...this.data.color);
        p.noStroke();
        const dotSize = s * 0.15;
        p.circle(this.x, this.y, dotSize);
        p.circle(this.x + s*0.3, this.y, dotSize);
        p.circle(this.x - s*0.3, this.y, dotSize);
        p.circle(this.x, this.y + s*0.3, dotSize);
        p.circle(this.x, this.y - s*0.3, dotSize);
        break;
        
      case 'stripes':
        // Stripes pattern
        p.fill(...this.data.color);
        p.noStroke();
        const stripeCount = 3;
        const stripeW = s / (stripeCount * 2 + 1);
        for (let i = 0; i < stripeCount; i++) {
          p.rect(
            this.x - s/2 + stripeW * (i * 2 + 1),
            this.y - s/2,
            stripeW,
            s
          );
        }
        break;
        
      case 'ring':
        // Ring/outline
        p.noFill();
        p.stroke(...this.data.color);
        p.strokeWeight(this.data.thickness * s * 0.3);
        p.circle(this.x, this.y, s * 0.7);
        break;
    }
  }

  getOperation() {
    return {
      type: this.type,
      ...this.data
    };
  }
}

export default Tool;