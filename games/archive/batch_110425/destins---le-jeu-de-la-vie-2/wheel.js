// wheel.js - Spinning wheel mechanics

export class SpinWheel {
  constructor(p) {
    this.p = p;
    this.angle = 0;
    this.spinning = false;
    this.speed = 0;
    this.result = 0;
    this.segments = 10;
  }
  
  spin() {
    if (!this.spinning) {
      this.spinning = true;
      this.speed = 0.3 + this.p.random(0.2);
      this.result = Math.floor(this.p.random(1, 11));
    }
  }
  
  update() {
    if (this.spinning) {
      this.angle += this.speed;
      this.speed *= 0.98;
      
      if (this.speed < 0.01) {
        this.spinning = false;
        this.speed = 0;
        const segmentAngle = (Math.PI * 2) / this.segments;
        this.angle = this.result * segmentAngle;
        return this.result;
      }
    }
    return 0;
  }
  
  draw(x, y, radius) {
    const p = this.p;
    p.push();
    p.translate(x, y);
    
    // Wheel background
    p.fill(240, 240, 250);
    p.stroke(80);
    p.strokeWeight(3);
    p.circle(0, 0, radius * 2);
    
    // Segments
    for (let i = 0; i < this.segments; i++) {
      const segmentAngle = (Math.PI * 2) / this.segments;
      const startAngle = i * segmentAngle - this.angle;
      const endAngle = startAngle + segmentAngle;
      
      const hue = (i / this.segments) * 360;
      p.fill(hue % 360, 60, 90);
      p.stroke(80);
      p.strokeWeight(2);
      
      p.beginShape();
      p.vertex(0, 0);
      for (let a = startAngle; a <= endAngle; a += 0.1) {
        p.vertex(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      p.vertex(Math.cos(endAngle) * radius, Math.sin(endAngle) * radius);
      p.endShape(p.CLOSE);
      
      // Numbers
      const midAngle = (startAngle + endAngle) / 2;
      const textX = Math.cos(midAngle) * radius * 0.7;
      const textY = Math.sin(midAngle) * radius * 0.7;
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(i + 1, textX, textY);
    }
    
    // Center hub
    p.fill(255, 200, 50);
    p.stroke(80);
    p.strokeWeight(2);
    p.circle(0, 0, 20);
    
    // Pointer
    p.fill(255, 50, 50);
    p.noStroke();
    p.push();
    p.rotate(-Math.PI / 2);
    p.triangle(radius + 10, 0, radius + 25, -8, radius + 25, 8);
    p.pop();
    
    p.pop();
  }
}