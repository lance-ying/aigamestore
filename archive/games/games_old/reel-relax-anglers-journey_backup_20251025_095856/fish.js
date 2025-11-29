import { FISH_DATA, RARITY_MULTIPLIERS } from './globals.js';

export class Fish {
  constructor(p, species, rarity, location) {
    this.species = species;
    this.rarity = rarity;
    
    const data = FISH_DATA[species];
    this.size = p.random(data.sizeRange[0], data.sizeRange[1]);
    this.strength = p.random(data.strengthRange[0], data.strengthRange[1]);
    this.baseValue = data.baseValue;
    
    // Calculate value
    const rarityMult = RARITY_MULTIPLIERS[rarity];
    this.value = Math.floor(this.baseValue * rarityMult * this.size);
    
    // Stamina based on strength and rarity
    this.maxStamina = 100 + (this.strength * 20) + (rarityMult * 50);
    this.stamina = this.maxStamina;
    
    // Pull force based on strength
    this.basePullForce = this.strength * 0.5;
    
    // Visual properties
    this.colors = this.getColorsBySpecies();
  }
  
  getColorsBySpecies() {
    const colorMap = {
      "Lake Perch": [[100, 140, 80], [80, 120, 60]],
      "Sunfish": [[255, 180, 50], [255, 140, 20]],
      "River Trout": [[140, 100, 160], [100, 70, 120]],
      "Catfish": [[100, 100, 100], [70, 70, 70]],
      "Rock Bass": [[150, 120, 80], [120, 90, 60]],
      "Cod": [[180, 180, 140], [150, 150, 110]],
      "Flounder": [[160, 140, 120], [130, 110, 90]],
      "Marlin": [[50, 100, 200], [30, 70, 160]],
      "Giant Squid": [[200, 50, 80], [160, 30, 60]],
      "Swordfish": [[120, 130, 180], [90, 100, 150]]
    };
    return colorMap[this.species] || [[150, 150, 150], [100, 100, 100]];
  }
  
  getPullForce(p) {
    // Erratic pull based on strength and stamina
    const staminaFactor = this.stamina / this.maxStamina;
    const erraticness = p.sin(p.frameCount * 0.1 * this.strength) * 0.5 + 0.5;
    return this.basePullForce * (0.5 + staminaFactor * 0.5) * (0.7 + erraticness * 0.6);
  }
  
  draw(p, x, y, size) {
    p.push();
    p.translate(x, y);
    const s = size * this.size;
    
    // Draw fish body
    p.fill(...this.colors[0]);
    p.ellipse(0, 0, s * 1.5, s * 0.8);
    
    // Draw tail
    p.fill(...this.colors[1]);
    p.triangle(-s * 0.75, 0, -s * 1.2, -s * 0.4, -s * 1.2, s * 0.4);
    
    // Draw fins
    p.triangle(s * 0.2, 0, s * 0.4, -s * 0.5, s * 0.5, 0);
    
    // Eye
    p.fill(255);
    p.ellipse(s * 0.4, -s * 0.2, s * 0.2, s * 0.2);
    p.fill(0);
    p.ellipse(s * 0.4, -s * 0.2, s * 0.1, s * 0.1);
    
    p.pop();
  }
}