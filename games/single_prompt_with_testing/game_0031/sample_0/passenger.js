// passenger.js - Passenger animations
export class Passenger {
  constructor(p, x, y, boarding) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.boarding = boarding; // true = boarding, false = exiting
    this.progress = 0;
    this.done = false;
  }

  update() {
    this.progress += 0.05;
    if (this.progress >= 1) {
      this.done = true;
    }
  }

  draw(p) {
    if (this.done) return;

    const alpha = this.boarding ? (1 - this.progress) * 255 : this.progress * 255;
    p.push();
    p.fill(255, 200, 150, alpha);
    p.noStroke();
    
    // Simple person shape
    const offsetY = this.boarding ? this.progress * 20 : -this.progress * 20;
    p.circle(this.x, this.y + offsetY, 8);
    p.rect(this.x - 3, this.y + 4 + offsetY, 6, 10);
    
    p.pop();
  }
}