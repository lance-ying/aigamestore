// country.js - Country entity and world generation

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Country {
  constructor(name, x, y, population, climate, neighbors) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.population = population;
    this.infected = 0;
    this.dead = 0;
    this.healthy = population;
    this.climate = climate; // 'cold', 'temperate', 'hot'
    this.neighbors = neighbors; // Array of country indices
    this.infectionRate = 0;
    this.deathRate = 0;
    this.isPatientZero = false;
  }
  
  update(p) {
    if (this.infected <= 0) return;
    
    // Calculate infection rate based on disease properties
    let baseInfectionRate = gameState.infectivity * 0.001;
    
    // Climate resistance
    if (this.climate === 'cold') {
      baseInfectionRate *= gameState.abilities.coldResist1 ? 1.0 : 0.5;
      baseInfectionRate *= gameState.abilities.coldResist2 ? 1.5 : 1.0;
    } else if (this.climate === 'hot') {
      baseInfectionRate *= gameState.abilities.heatResist1 ? 1.0 : 0.5;
      baseInfectionRate *= gameState.abilities.heatResist2 ? 1.5 : 1.0;
    }
    
    // Apply time multiplier
    baseInfectionRate *= gameState.timeMultiplier;
    
    // Infect healthy population
    const newInfections = Math.min(
      this.healthy,
      Math.floor(this.healthy * baseInfectionRate * (this.infected / this.population))
    );
    
    if (newInfections > 0) {
      this.infected += newInfections;
      this.healthy -= newInfections;
      gameState.infectedPopulation += newInfections;
      
      // Award DNA points (small chance per infection)
      if (Math.random() < 0.02 * gameState.timeMultiplier) {
        gameState.dnaPoints += 1;
      }
      
      // Spawn DNA bubble occasionally
      if (Math.random() < 0.005 * gameState.timeMultiplier) {
        this.spawnDNABubble(p);
      }
    }
    
    // Death rate calculation
    if (gameState.lethality > 0 && this.infected > 0) {
      const baseDeathRate = gameState.lethality * 0.0005 * gameState.timeMultiplier;
      const newDeaths = Math.min(
        this.infected,
        Math.floor(this.infected * baseDeathRate)
      );
      
      if (newDeaths > 0) {
        this.infected -= newDeaths;
        this.dead += newDeaths;
        gameState.infectedPopulation -= newDeaths;
        gameState.deadPopulation += newDeaths;
      }
    }
    
    // Spread to neighbors
    if (this.infected > this.population * 0.1) { // 10% infection threshold
      this.spreadToNeighbors(p);
    }
  }
  
  spreadToNeighbors(p) {
    for (const neighborIndex of this.neighbors) {
      const neighbor = gameState.countries[neighborIndex];
      if (neighbor && neighbor.infected === 0 && neighbor.healthy > 0) {
        // Chance to spread based on infectivity
        const spreadChance = gameState.infectivity * 0.002 * gameState.timeMultiplier;
        if (Math.random() < spreadChance) {
          // Infect patient zero in neighbor country
          const initialInfection = Math.min(10, neighbor.healthy);
          neighbor.infected = initialInfection;
          neighbor.healthy -= initialInfection;
          gameState.infectedPopulation += initialInfection;
          
          // Award DNA points for spreading to new country
          gameState.dnaPoints += 3;
        }
      }
    }
  }
  
  spawnDNABubble(p) {
    const bubble = {
      x: this.x + (Math.random() - 0.5) * 30,
      y: this.y + (Math.random() - 0.5) * 30,
      radius: 8,
      value: Math.floor(Math.random() * 10) + 5,
      lifetime: 180, // 3 seconds
      age: 0,
      pulse: 0
    };
    gameState.dnaBubbles.push(bubble);
  }
  
  render(p, isSelected) {
    // Calculate infection percentage
    const infectionPercent = this.infected / this.population;
    
    // Color based on infection level
    let fillColor;
    if (this.infected === 0) {
      fillColor = p.color(100, 200, 100); // Healthy green
    } else if (infectionPercent < 0.25) {
      fillColor = p.color(200, 200, 100); // Light yellow
    } else if (infectionPercent < 0.5) {
      fillColor = p.color(255, 150, 50); // Orange
    } else if (infectionPercent < 0.75) {
      fillColor = p.color(255, 100, 50); // Red-orange
    } else {
      fillColor = p.color(200, 50, 50); // Dark red
    }
    
    // Draw country circle
    p.fill(fillColor);
    p.stroke(isSelected ? p.color(255, 255, 0) : p.color(80, 80, 80));
    p.strokeWeight(isSelected ? 3 : 2);
    p.circle(this.x, this.y, 25);
    
    // Draw skull if high death rate
    if (this.dead > this.population * 0.5) {
      p.fill(255);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('☠', this.x, this.y);
    }
    
    // Draw patient zero marker
    if (this.isPatientZero && this.infected > 0) {
      p.noFill();
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.circle(this.x, this.y, 35 + p.sin(gameState.frameCount * 0.1) * 3);
    }
  }
  
  renderLabel(p) {
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.name, this.x, this.y - 20);
  }
}

export function createWorldMap() {
  // Create simplified world map with countries
  const countries = [];
  
  // Define countries with positions and populations
  const countryData = [
    { name: 'USA', x: 150, y: 150, pop: 330000000, climate: 'temperate', neighbors: [1, 5] },
    { name: 'Mexico', x: 150, y: 200, pop: 130000000, climate: 'hot', neighbors: [0, 2] },
    { name: 'Brazil', x: 250, y: 280, pop: 210000000, climate: 'hot', neighbors: [1, 3] },
    { name: 'UK', x: 300, y: 120, pop: 67000000, climate: 'temperate', neighbors: [4, 5] },
    { name: 'Germany', x: 330, y: 130, pop: 83000000, climate: 'temperate', neighbors: [3, 5, 6] },
    { name: 'Russia', x: 380, y: 100, pop: 145000000, climate: 'cold', neighbors: [0, 3, 4, 6, 8] },
    { name: 'India', x: 420, y: 200, pop: 1400000000, climate: 'hot', neighbors: [4, 5, 7, 8] },
    { name: 'S.Africa', x: 350, y: 310, pop: 60000000, climate: 'hot', neighbors: [6] },
    { name: 'China', x: 480, y: 160, pop: 1400000000, climate: 'temperate', neighbors: [5, 6, 9] },
    { name: 'Australia', x: 520, y: 300, pop: 26000000, climate: 'hot', neighbors: [8] }
  ];
  
  gameState.totalPopulation = 0;
  
  for (let i = 0; i < countryData.length; i++) {
    const data = countryData[i];
    const country = new Country(
      data.name,
      data.x,
      data.y,
      data.pop,
      data.climate,
      data.neighbors
    );
    
    // Patient Zero starts in USA
    if (i === 0) {
      country.infected = 1;
      country.healthy = country.population - 1;
      country.isPatientZero = true;
      gameState.infectedPopulation = 1;
    }
    
    countries.push(country);
    gameState.totalPopulation += data.pop;
  }
  
  gameState.countries = countries;
}