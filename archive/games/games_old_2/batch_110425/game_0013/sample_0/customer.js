// customer.js - Customer entity

export class Customer {
  constructor(p, x, y, desiredQuality) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.desiredQuality = desiredQuality;
    this.patience = 100;
    this.maxPatience = 100;
    this.served = false;
    this.satisfied = false;
    this.angry = false;
    this.color = [p.random(100, 255), p.random(100, 255), p.random(100, 255)];
    this.waitTime = 0;
    this.animOffset = p.random(0, p.TWO_PI);
  }
  
  update() {
    if (!this.served) {
      this.waitTime++;
      this.patience -= 0.15;
      
      if (this.patience <= 0) {
        this.angry = true;
      }
    }
  }
  
  serve(burgerQuality) {
    this.served = true;
    const qualityDiff = Math.abs(burgerQuality - this.desiredQuality);
    
    if (qualityDiff <= 15) {
      this.satisfied = true;
      return { money: Math.floor(burgerQuality * 0.8), reputation: 2 };
    } else if (qualityDiff <= 30) {
      this.satisfied = true;
      return { money: Math.floor(burgerQuality * 0.5), reputation: 1 };
    } else {
      this.satisfied = false;
      return { money: Math.floor(burgerQuality * 0.3), reputation: -1 };
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Idle animation
    const bob = Math.sin(p.frameCount * 0.05 + this.animOffset) * 2;
    p.translate(0, bob);
    
    // Draw customer
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, -15, 20, 20); // head
    
    // Body
    p.fill(...this.color.map(c => c * 0.8));
    p.rect(-10, 0, 20, 25, 3);
    
    // Eyes
    p.fill(0);
    p.ellipse(-4, -17, 3, 3);
    p.ellipse(4, -17, 3, 3);
    
    // Patience bar
    if (!this.served) {
      p.fill(200);
      p.rect(-15, -30, 30, 4);
      
      const patienceColor = this.patience > 50 ? [100, 255, 100] : 
                            this.patience > 25 ? [255, 200, 100] : [255, 100, 100];
      p.fill(...patienceColor);
      p.rect(-15, -30, 30 * (this.patience / this.maxPatience), 4);
    }
    
    // Status indicator
    if (this.served) {
      p.fill(this.satisfied ? [100, 255, 100] : [255, 100, 100]);
      p.ellipse(0, -35, 8, 8);
      
      if (this.satisfied) {
        p.stroke(255);
        p.strokeWeight(2);
        p.noFill();
        p.arc(0, -35, 6, 4, 0, p.PI);
      } else {
        p.stroke(255);
        p.strokeWeight(2);
        p.line(-2, -37, 2, -33);
        p.line(2, -37, -2, -33);
      }
    }
    
    p.pop();
  }
}