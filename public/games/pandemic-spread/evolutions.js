import { EVOLUTION_CATEGORIES } from './globals.js';

// Create all available evolutions for the game
export function createEvolutions() {
  return {
    [EVOLUTION_CATEGORIES.TRANSMISSION]: [
      {
        id: 'air1',
        name: 'Air 1',
        description: 'Basic air transmission. Increases infection rate slightly.',
        cost: 5,
        purchased: false,
        effect: { type: 'transmission', factor: 'air', value: 1 },
        visibility: 0.1
      },
      {
        id: 'air2',
        name: 'Air 2',
        description: 'Advanced air transmission. Significantly increases infection rate through air.',
        cost: 15,
        purchased: false,
        effect: { type: 'transmission', factor: 'air', value: 2 },
        prerequisites: ['air1'],
        visibility: 0.2
      },
      {
        id: 'water1',
        name: 'Water 1',
        description: 'Basic water transmission. Increases infection rate through water sources.',
        cost: 7,
        purchased: false,
        effect: { type: 'transmission', factor: 'water', value: 1 },
        visibility: 0.1
      },
      {
        id: 'water2',
        name: 'Water 2',
        description: 'Advanced water transmission. Significantly increases infection rate through water.',
        cost: 18,
        purchased: false,
        effect: { type: 'transmission', factor: 'water', value: 2 },
        prerequisites: ['water1'],
        visibility: 0.2
      },
      {
        id: 'animal1',
        name: 'Animal 1',
        description: 'Basic animal transmission. Allows spread through animals.',
        cost: 8,
        purchased: false,
        effect: { type: 'transmission', factor: 'animal', value: 1 },
        visibility: 0.15
      },
      {
        id: 'insect1',
        name: 'Insect 1',
        description: 'Basic insect transmission. Allows spread through insects like mosquitoes.',
        cost: 10,
        purchased: false,
        effect: { type: 'transmission', factor: 'insect', value: 1 },
        visibility: 0.15
      }
    ],
    [EVOLUTION_CATEGORIES.SYMPTOMS]: [
      {
        id: 'cough',
        name: 'Coughing',
        description: 'Infected develop coughs, increasing air transmission.',
        cost: 4,
        purchased: false,
        effect: { type: 'symptom', factor: 'transmission', value: 0.3 },
        visibility: 0.2
      },
      {
        id: 'sneeze',
        name: 'Sneezing',
        description: 'Infected develop sneezing, significantly increasing air transmission.',
        cost: 8,
        purchased: false,
        effect: { type: 'symptom', factor: 'transmission', value: 0.5 },
        visibility: 0.3,
        prerequisites: ['cough']
      },
      {
        id: 'nausea',
        name: 'Nausea',
        description: 'Infected develop nausea, increasing water transmission.',
        cost: 7,
        purchased: false,
        effect: { type: 'symptom', factor: 'transmission', value: 0.4 },
        visibility: 0.25
      },
      {
        id: 'rash',
        name: 'Rash',
        description: 'Infected develop rashes, increasing transmission through contact.',
        cost: 6,
        purchased: false,
        effect: { type: 'symptom', factor: 'transmission', value: 0.3 },
        visibility: 0.2
      },
      {
        id: 'insomnia',
        name: 'Insomnia',
        description: 'Infected have trouble sleeping, reducing productivity.',
        cost: 10,
        purchased: false,
        effect: { type: 'symptom', factor: 'severity', value: 0.4 },
        visibility: 0.3
      },
      {
        id: 'pneumonia',
        name: 'Pneumonia',
        description: 'Infected develop pneumonia, greatly increasing transmission and severity.',
        cost: 20,
        purchased: false,
        effect: { type: 'symptom', factor: 'severity', value: 0.8 },
        visibility: 0.6,
        prerequisites: ['cough', 'sneeze']
      }
    ],
    [EVOLUTION_CATEGORIES.RESISTANCES]: [
      {
        id: 'cold1',
        name: 'Cold Resistance 1',
        description: 'Increases survival and transmission in cold climates.',
        cost: 12,
        purchased: false,
        effect: { type: 'resistance', factor: 'cold', value: 1 },
        visibility: 0.1
      },
      {
        id: 'cold2',
        name: 'Cold Resistance 2',
        description: 'Greatly increases survival and transmission in cold climates.',
        cost: 20,
        purchased: false,
        effect: { type: 'resistance', factor: 'cold', value: 2 },
        prerequisites: ['cold1'],
        visibility: 0.15
      },
      {
        id: 'heat1',
        name: 'Heat Resistance 1',
        description: 'Increases survival and transmission in hot climates.',
        cost: 12,
        purchased: false,
        effect: { type: 'resistance', factor: 'heat', value: 1 },
        visibility: 0.1
      },
      {
        id: 'heat2',
        name: 'Heat Resistance 2',
        description: 'Greatly increases survival and transmission in hot climates.',
        cost: 20,
        purchased: false,
        effect: { type: 'resistance', factor: 'heat', value: 2 },
        prerequisites: ['heat1'],
        visibility: 0.15
      },
      {
        id: 'drug1',
        name: 'Drug Resistance 1',
        description: 'Provides resistance to basic medications.',
        cost: 15,
        purchased: false,
        effect: { type: 'resistance', factor: 'drug', value: 1 },
        visibility: 0.2
      },
      {
        id: 'drug2',
        name: 'Drug Resistance 2',
        description: 'Provides strong resistance to advanced medications.',
        cost: 25,
        purchased: false,
        effect: { type: 'resistance', factor: 'drug', value: 2 },
        prerequisites: ['drug1'],
        visibility: 0.3
      },
      {
        id: 'humid1',
        name: 'Humidity Resistance',
        description: 'Increases survival and transmission in humid climates.',
        cost: 12,
        purchased: false,
        effect: { type: 'resistance', factor: 'humidity', value: 1 },
        visibility: 0.1
      }
    ]
  };
}

// Function to check if an evolution can be purchased
export function canPurchaseEvolution(evolution, dnaPoints, purchasedEvolutions) {
  if (evolution.purchased) return false;
  if (evolution.cost > dnaPoints) return false;
  
  // Check prerequisites
  if (evolution.prerequisites) {
    for (const prereq of evolution.prerequisites) {
      const category = findEvolutionCategory(prereq);
      if (!category) return false;
      
      const prereqEvolution = purchasedEvolutions[category].find(e => e.id === prereq);
      if (!prereqEvolution || !prereqEvolution.purchased) return false;
    }
  }
  
  return true;
}

// Helper function to find which category an evolution ID belongs to
function findEvolutionCategory(evolutionId) {
  const evolutions = createEvolutions();
  for (const category in evolutions) {
    if (evolutions[category].some(e => e.id === evolutionId)) {
      return category;
    }
  }
  return null;
}

// Function to calculate total transmission factors from purchased evolutions
export function calculateTransmissionFactors(purchasedEvolutions) {
  const factors = {
    air: 0,
    water: 0,
    animal: 0,
    insect: 0
  };
  
  // Add transmission evolutions
  for (const evolution of purchasedEvolutions[EVOLUTION_CATEGORIES.TRANSMISSION]) {
    if (evolution.purchased && evolution.effect.type === 'transmission') {
      factors[evolution.effect.factor] += evolution.effect.value;
    }
  }
  
  // Add symptom bonuses to transmission
  for (const evolution of purchasedEvolutions[EVOLUTION_CATEGORIES.SYMPTOMS]) {
    if (evolution.purchased && evolution.effect.factor === 'transmission') {
      // Apply a general boost to all transmission methods
      for (const factor in factors) {
        factors[factor] += evolution.effect.value;
      }
    }
  }
  
  return factors;
}

// Function to calculate total resistance factors from purchased evolutions
export function calculateResistanceFactors(purchasedEvolutions) {
  const factors = {
    cold: 0,
    heat: 0,
    drug: 0,
    humidity: 0
  };
  
  for (const evolution of purchasedEvolutions[EVOLUTION_CATEGORIES.RESISTANCES]) {
    if (evolution.purchased && evolution.effect.type === 'resistance') {
      factors[evolution.effect.factor] += evolution.effect.value;
    }
  }
  
  return factors;
}

// Function to calculate virus visibility based on purchased evolutions
export function calculateVirusVisibility(purchasedEvolutions) {
  let visibility = 0;
  
  // Add visibility from all categories
  for (const category in purchasedEvolutions) {
    for (const evolution of purchasedEvolutions[category]) {
      if (evolution.purchased) {
        visibility += evolution.visibility || 0;
      }
    }
  }
  
  return Math.min(visibility, 1); // Cap at 1.0 (100%)
}