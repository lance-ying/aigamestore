// staff.js - Staff member entity

export class Staff {
  constructor(p, name, efficiency, personality) {
    this.p = p;
    this.name = name;
    this.efficiency = efficiency;
    this.personality = personality;
    this.cost = Math.floor(efficiency * 50);
    this.color = [p.random(100, 255), p.random(100, 255), p.random(100, 255)];
  }
  
  getEfficiencyBonus() {
    return this.efficiency;
  }
  
  render(p, x, y) {
    p.push();
    p.translate(x, y);
    
    // Draw staff member
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, 0, 15, 15);
    
    // Name tag
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(this.name[0], 0, 0);
    
    p.pop();
  }
}