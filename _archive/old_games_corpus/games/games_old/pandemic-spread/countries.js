import { COLORS } from './globals.js';

// Country class definition
export class Country {
  constructor(name, population, x, y, size, neighbors = [], climate = 'temperate') {
    this.name = name;
    this.population = population;
    this.infectedPopulation = 0;
    this.x = x;
    this.y = y;
    this.size = size;
    this.neighbors = neighbors;
    this.climate = climate;
    this.infectionRate = 0;
    this.infected = false;
    this.color = COLORS.HEALTHY;
    this.resistance = {
      cold: climate === 'cold' ? 0.5 : 0,
      heat: climate === 'hot' ? 0.5 : 0,
      drug: 0,
      humidity: climate === 'humid' ? 0.5 : 0
    };
  }

  draw(p) {
    // Calculate color based on infection percentage
    const infectionPercentage = this.infectedPopulation / this.population;
    const r = p.lerp(COLORS.HEALTHY[0], COLORS.INFECTED[0], infectionPercentage);
    const g = p.lerp(COLORS.HEALTHY[1], COLORS.INFECTED[1], infectionPercentage);
    const b = p.lerp(COLORS.HEALTHY[2], COLORS.INFECTED[2], infectionPercentage);
    
    p.fill(r, g, b);
    p.stroke(COLORS.COUNTRY_OUTLINE);
    p.strokeWeight(1);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Draw connections to neighbors
    p.strokeWeight(0.5);
    p.stroke(255, 255, 255, 50);
    for (const neighborName of this.neighbors) {
      const neighbor = this.findNeighbor(neighborName);
      if (neighbor) {
        p.line(this.x, this.y, neighbor.x, neighbor.y);
      }
    }
  }

  findNeighbor(neighborName) {
    // This will be set from outside after all countries are created
    return null;
  }

  update(transmissionFactors, resistanceFactors) {
    if (this.infectedPopulation > 0) {
      this.infected = true;
      
      // Calculate infection growth based on various factors
      let growthRate = this.calculateGrowthRate(transmissionFactors, resistanceFactors);
      
      // Apply the growth
      const newInfections = Math.min(
        Math.ceil(this.infectedPopulation * growthRate),
        this.population - this.infectedPopulation
      );
      
      this.infectedPopulation += newInfections;
      
      // Update infection rate
      this.infectionRate = this.infectedPopulation / this.population;
    }
  }

  calculateGrowthRate(transmissionFactors, resistanceFactors) {
    // Base growth rate
    let rate = 0.01;
    
    // Apply transmission bonuses
    if (transmissionFactors.air > 0) rate += 0.005 * transmissionFactors.air;
    if (transmissionFactors.water > 0) rate += 0.005 * transmissionFactors.water;
    if (transmissionFactors.animal > 0) rate += 0.004 * transmissionFactors.animal;
    if (transmissionFactors.insect > 0) rate += 0.004 * transmissionFactors.insect;
    
    // Apply climate resistances
    if (this.climate === 'cold' && resistanceFactors.cold > 0) {
      rate += 0.003 * resistanceFactors.cold;
    }
    if (this.climate === 'hot' && resistanceFactors.heat > 0) {
      rate += 0.003 * resistanceFactors.heat;
    }
    if (this.climate === 'humid' && resistanceFactors.humidity > 0) {
      rate += 0.003 * resistanceFactors.humidity;
    }
    
    // Apply drug resistance
    rate += 0.002 * resistanceFactors.drug;
    
    return rate;
  }

  spreadToNeighbors(countries, transmissionFactors) {
    if (this.infectedPopulation > 0) {
      for (const neighborName of this.neighbors) {
        const neighbor = countries.find(c => c.name === neighborName);
        if (neighbor && !neighbor.infected) {
          // Chance to spread based on transmission factors
          let spreadChance = 0.001;
          
          // Increase spread chance based on transmission methods
          if (transmissionFactors.air > 0) spreadChance += 0.002 * transmissionFactors.air;
          if (transmissionFactors.water > 0) spreadChance += 0.001 * transmissionFactors.water;
          
          // Higher chance based on infection rate
          spreadChance += this.infectionRate * 0.01;
          
          if (Math.random() < spreadChance) {
            neighbor.infectedPopulation = 1;
            neighbor.infected = true;
            return true;
          }
        }
      }
    }
    return false;
  }
}

// Function to create countries
export function createCountries() {
  const countries = [
    new Country("North America", 350000000, 150, 120, 30, ["South America", "Europe", "Asia"], "temperate"),
    new Country("South America", 200000000, 180, 200, 25, ["North America"], "humid"),
    new Country("Europe", 450000000, 280, 110, 28, ["North America", "Asia", "Africa"], "temperate"),
    new Country("Africa", 1200000000, 280, 200, 35, ["Europe", "Asia"], "hot"),
    new Country("Asia", 4500000000, 400, 150, 40, ["North America", "Europe", "Africa", "Oceania"], "varied"),
    new Country("Oceania", 40000000, 450, 250, 20, ["Asia"], "humid")
  ];
  
  // Set up neighbor references
  for (const country of countries) {
    country.findNeighbor = function(neighborName) {
      return countries.find(c => c.name === neighborName);
    };
  }
  
  return countries;
}