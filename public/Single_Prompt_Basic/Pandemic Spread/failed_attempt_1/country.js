import { gameState } from './globals.js';

export class Country {
  constructor(name, x, y, population, color, connections = []) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.radius = Math.sqrt(population) * 0.05 + 5;
    this.population = population;
    this.infected = 0;
    this.color = color;
    this.connections = connections;
    this.isInfected = false;
    this.fullyInfected = false;
    this.closed = false;
    this.climate = this.assignClimate();
    this.highlighted = false;
  }
  
  assignClimate() {
    // Simple climate assignment based on y-coordinate (north-south position)
    if (this.y < 150) return "cold";
    if (this.y > 250) return "hot";
    return "temperate";
  }
  
  update(p) {
    // If country is infected, spread within the country
    if (this.infected > 0 && !this.fullyInfected) {
      // Calculate infection rate based on upgrades and game state
      let infectionMultiplier = BASE_INFECTION_RATE;
      
      // Apply transmission upgrades
      gameState.upgradeCategories[0].upgrades.forEach(upgrade => {
        infectionMultiplier += upgrade.level * upgrade.effect;
      });
      
      // Apply climate resistance if needed
      if (this.climate === "cold") {
        const coldResistance = gameState.upgradeCategories[2].upgrades[0].level * 
                              gameState.upgradeCategories[2].upgrades[0].effect;
        infectionMultiplier *= (1 + coldResistance);
      } else if (this.climate === "hot") {
        const heatResistance = gameState.upgradeCategories[2].upgrades[1].level * 
                              gameState.upgradeCategories[2].upgrades[1].effect;
        infectionMultiplier *= (1 + heatResistance);
      }
      
      // Apply symptoms for additional spread
      gameState.upgradeCategories[1].upgrades.forEach(upgrade => {
        infectionMultiplier += upgrade.level * upgrade.effect * 0.5;
      });
      
      // Calculate new infections with a logistic growth model
      const newInfections = Math.floor(
        this.infected * infectionMultiplier * 
        (1 - this.infected / this.population) * 
        gameState.gameSpeed
      );
      
      this.infected = Math.min(this.population, this.infected + newInfections);
      
      // Check if country is fully infected
      if (this.infected >= this.population * 0.99) {
        this.fullyInfected = true;
        this.infected = this.population;
      }
      
      // Update total infected count
      gameState.totalInfected += newInfections;
    }
    
    // Spread to connected countries if not closed
    if (this.infected > 0 && !this.closed && p.frameCount % 60 === 0) {
      this.spreadToConnections();
    }
    
    // Country might close borders if infection rate is high
    if (this.infected > this.population * 0.3 && !this.closed && Math.random() < 0.0005 * gameState.gameSpeed) {
      this.closed = true;
    }
  }
  
  spreadToConnections() {
    for (const connIdx of this.connections) {
      const connectedCountry = gameState.countries[connIdx];
      
      // Skip if the connected country is already infected or closed
      if (connectedCountry.isInfected || connectedCountry.closed) continue;
      
      // Calculate chance to infect based on current infection and upgrades
      const infectionChance = (this.infected / this.population) * 0.1;
      
      // Apply transmission upgrades
      let transmissionBonus = 0;
      gameState.upgradeCategories[0].upgrades.forEach(upgrade => {
        transmissionBonus += upgrade.level * upgrade.effect * 0.5;
      });
      
      if (Math.random() < infectionChance + transmissionBonus) {
        connectedCountry.infected = 1;
        connectedCountry.isInfected = true;
        
        // Log the new infection
        gameState.player.infectedCountries++;
      }
    }
  }
  
  draw(p) {
    p.push();
    
    // Draw connections
    p.strokeWeight(1);
    p.stroke(100, 100, 100, 100);
    for (const connIdx of this.connections) {
      const connectedCountry = gameState.countries[connIdx];
      p.line(this.x, this.y, connectedCountry.x, connectedCountry.y);
    }
    
    // Draw country circle
    if (this.highlighted) {
      p.strokeWeight(3);
      p.stroke(255, 255, 0);
    } else {
      p.strokeWeight(1);
      p.stroke(200);
    }
    
    // Determine fill color based on infection status
    if (this.infected > 0) {
      const infectionPercent = this.infected / this.population;
      const r = p.lerp(this.color[0], 200, infectionPercent);
      const g = p.lerp(this.color[1], 0, infectionPercent);
      const b = p.lerp(this.color[2], 0, infectionPercent);
      p.fill(r, g, b);
    } else {
      p.fill(this.color);
    }
    
    p.ellipse(this.x, this.y, this.radius * 2);
    
    // Draw closed border indicator
    if (this.closed) {
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.noFill();
      p.ellipse(this.x, this.y, this.radius * 2.5);
    }
    
    p.pop();
  }
  
  displayInfo(p, x, y) {
    p.push();
    p.fill(255);
    p.textAlign(p.LEFT);
    p.textSize(14);
    p.text(this.name, x, y);
    p.textSize(12);
    
    const infectionPercent = Math.floor((this.infected / this.population) * 100);
    p.text(`Population: ${this.population.toLocaleString()}`, x, y + 20);
    p.text(`Infected: ${this.infected.toLocaleString()} (${infectionPercent}%)`, x, y + 40);
    p.text(`Climate: ${this.climate}`, x, y + 60);
    if (this.closed) {
      p.fill(255, 0, 0);
      p.text("BORDERS CLOSED", x, y + 80);
    }
    p.pop();
  }
}

export function createCountries() {
  const countries = [
    new Country("North America", 150, 120, 350000000, [50, 100, 200], [1, 2, 3, 8]),
    new Country("South America", 200, 250, 250000000, [100, 150, 200], [0, 8]),
    new Country("Europe", 300, 100, 200000000, [100, 100, 200], [0, 3, 4, 5]),
    new Country("Africa", 300, 200, 300000000, [200, 150, 50], [0, 2, 4, 5, 6]),
    new Country("Russia", 400, 80, 150000000, [150, 150, 200], [2, 5, 6, 7]),
    new Country("Middle East", 350, 150, 100000000, [200, 180, 100], [2, 3, 4, 6]),
    new Country("India", 400, 180, 500000000, [200, 100, 100], [3, 4, 5, 7]),
    new Country("East Asia", 450, 130, 600000000, [220, 50, 50], [4, 6, 9]),
    new Country("Central America", 170, 180, 80000000, [150, 200, 100], [0, 1]),
    new Country("Oceania", 500, 250, 50000000, [150, 200, 200], [7])
  ];
  
  return countries;
}