export class Spinner {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 50;
    this.angle = 0;
    this.value = 0;
    this.spinning = false;
    this.spinSpeed = 0;
    this.spinDuration = 0;
  }
  
  spin(p) {
    if (this.spinning) return;
    
    this.spinning = true;
    this.spinSpeed = p.random(0.3, 0.5);
    this.spinDuration = p.random(60, 90);
    this.value = Math.floor(p.random(1, 11));
  }
  
  update() {
    if (this.spinning) {
      this.angle += this.spinSpeed;
      this.spinDuration--;
      
      if (this.spinDuration <= 0) {
        this.spinning = false;
        // Align to value
        this.angle = (this.value / 10) * Math.PI * 2;
      } else if (this.spinDuration < 20) {
        // Slow down
        this.spinSpeed *= 0.95;
      }
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw spinner circle
    p.fill(40);
    p.stroke(255);
    p.strokeWeight(3);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    
    // Draw numbers around circle
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.noStroke();
    for (let i = 1; i <= 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * (this.radius - 15);
      const y = Math.sin(angle) * (this.radius - 15);
      
      p.fill(200);
      p.text(i, x, y);
    }
    
    // Draw pointer
    p.rotate(this.angle);
    p.fill(255, 0, 0);
    p.noStroke();
    p.triangle(0, -5, 0, 5, this.radius - 10, 0);
    
    p.pop();
    
    // Show current value below
    if (!this.spinning && this.value > 0) {
      p.push();
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(`Move ${this.value} spaces`, this.x, this.y + this.radius + 20);
      p.pop();
    }
  }
}