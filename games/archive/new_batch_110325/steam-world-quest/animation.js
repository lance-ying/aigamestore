// animation.js - Animation system

export class Animation {
  constructor(type, x, y, data) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.data = data;
    this.timer = 0;
    this.maxTime = data.duration || 30;
    this.completed = false;
  }
  
  update() {
    this.timer++;
    if (this.timer >= this.maxTime) {
      this.completed = true;
    }
  }
  
  render(p) {
    const progress = this.timer / this.maxTime;
    
    switch (this.type) {
      case "DAMAGE":
        this.renderDamage(p, progress);
        break;
      case "HEAL":
        this.renderHeal(p, progress);
        break;
      case "SHIELD":
        this.renderShield(p, progress);
        break;
      case "ATTACK":
        this.renderAttack(p, progress);
        break;
    }
  }
  
  renderDamage(p, progress) {
    p.push();
    const alpha = 255 * (1 - progress);
    const yOffset = -progress * 30;
    p.fill(255, 50, 50, alpha);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`-${this.data.amount}`, this.x, this.y + yOffset);
    p.pop();
  }
  
  renderHeal(p, progress) {
    p.push();
    const alpha = 255 * (1 - progress);
    const yOffset = -progress * 30;
    p.fill(50, 255, 50, alpha);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`+${this.data.amount}`, this.x, this.y + yOffset);
    p.pop();
  }
  
  renderShield(p, progress) {
    p.push();
    const alpha = 255 * (1 - progress);
    const scale = 1 + progress * 0.5;
    p.fill(100, 150, 255, alpha);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`+${this.data.amount} Shield`, this.x, this.y - 30);
    p.pop();
  }
  
  renderAttack(p, progress) {
    p.push();
    const alpha = 255 * (1 - progress * 0.5);
    p.stroke(255, 200, 0, alpha);
    p.strokeWeight(3);
    const x2 = p.lerp(this.x, this.data.targetX, progress);
    const y2 = p.lerp(this.y, this.data.targetY, progress);
    p.line(this.x, this.y, x2, y2);
    p.pop();
  }
}