// globals.js - Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not used in this game but required by template
  entities: [], // Not used in this game but required by template
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3"
  
  // Game specific state
  currentDay: 1,
  maxDays: 5,
  reputation: 100,
  score: 0,
  
  // UI state
  currentView: "ENCYCLOPEDIA", // "ENCYCLOPEDIA", "INVENTORY", "CUSTOMER"
  selectedPlantId: null,
  encyclopediaPage: 0,
  inventoryScroll: 0,
  
  // Customer state
  currentCustomer: null,
  customerQueue: [],
  customersServedToday: 0,
  customersPerDay: 3,
  
  // Plants
  unlockedPlants: [],
  
  // Input tracking
  navigationCooldown: 0,
  
  // Position tracking for logs
  cursorX: 300,
  cursorY: 200
};

// Plant database
export const PLANT_DATABASE = [
  {
    id: 1,
    name: "Moonflower",
    description: "Pale white petals that glow faintly in darkness. Blooms only at night. Used for insomnia and prophetic dreams.",
    properties: ["nocturnal", "white", "luminescent", "sleep", "visions"],
    rarity: "common"
  },
  {
    id: 2,
    name: "Crimson Sage",
    description: "Deep red leaves with silver veins. Strong earthy scent. Known for blood purification and courage.",
    properties: ["red", "aromatic", "blood", "courage", "medicinal"],
    rarity: "common"
  },
  {
    id: 3,
    name: "Shadow Fern",
    description: "Black fronds that seem to absorb light. Grows in complete darkness. Aids in concealment and shadow walking.",
    properties: ["black", "dark", "stealth", "shadow", "rare"],
    rarity: "uncommon"
  },
  {
    id: 4,
    name: "Golden Thistle",
    description: "Spiky plant with metallic gold flowers. Extremely prickly. Attracts wealth and prosperity.",
    properties: ["gold", "spiky", "wealth", "thorny", "bright"],
    rarity: "common"
  },
  {
    id: 5,
    name: "Serpent's Tongue",
    description: "Long forked leaves resembling snake tongues. Hisses when touched. Grants eloquence and persuasion.",
    properties: ["green", "forked", "speech", "serpentine", "unusual"],
    rarity: "uncommon"
  },
  {
    id: 6,
    name: "Frost Lily",
    description: "Ice-blue petals cold to the touch. Never wilts. Soothes fever and calms heated emotions.",
    properties: ["blue", "cold", "calming", "medicinal", "eternal"],
    rarity: "common"
  },
  {
    id: 7,
    name: "Ember Root",
    description: "Orange tuberous root that radiates warmth. Glows like dying coals. Provides energy and passion.",
    properties: ["orange", "warm", "root", "energy", "glowing"],
    rarity: "uncommon"
  },
  {
    id: 8,
    name: "Witch's Breath",
    description: "Purple flowers that release sweet smoke when disturbed. Enhances magical potency and divination.",
    properties: ["purple", "smoke", "magic", "sweet", "mystical"],
    rarity: "rare"
  },
  {
    id: 9,
    name: "Memory Moss",
    description: "Soft green moss that glows when memories are spoken near it. Preserves and recalls forgotten knowledge.",
    properties: ["green", "moss", "memory", "knowledge", "glowing"],
    rarity: "uncommon"
  },
  {
    id: 10,
    name: "Bone Flower",
    description: "White petals arranged like a skeletal hand. Grows from graveyards. Communicates with the deceased.",
    properties: ["white", "death", "skeletal", "spirit", "macabre"],
    rarity: "rare"
  },
  {
    id: 11,
    name: "Storm Vine",
    description: "Crackling tendrils that spark with static electricity. Leaves taste of ozone. Controls weather and lightning.",
    properties: ["electric", "vine", "storm", "lightning", "crackling"],
    rarity: "rare"
  },
  {
    id: 12,
    name: "Dream Petal",
    description: "Iridescent pink petals that shift colors. Smells like childhood memories. Induces lucid dreaming.",
    properties: ["pink", "iridescent", "dreams", "shifting", "nostalgic"],
    rarity: "uncommon"
  }
];

// Customer clue templates
export const CUSTOMER_CLUES = [
  {
    plantId: 1,
    clues: [
      "I need something that blooms when others sleep...",
      "My insomnia is unbearable. I need a pale flower...",
      "They say it glows in the dark. White petals..."
    ]
  },
  {
    plantId: 2,
    clues: [
      "I seek the red herb that strengthens the blood...",
      "Something with silver veins and crimson leaves...",
      "My courage falters. I need the aromatic red plant..."
    ]
  },
  {
    plantId: 3,
    clues: [
      "I must vanish. Give me the plant that absorbs light...",
      "Black as night, helps one walk in shadows...",
      "The fern that grows where no light reaches..."
    ]
  },
  {
    plantId: 4,
    clues: [
      "My fortune has turned. I need the golden spiky one...",
      "They say it attracts wealth, metallic and thorny...",
      "The plant that shines like coins but pricks the hand..."
    ]
  },
  {
    plantId: 5,
    clues: [
      "I must speak well. The plant with forked leaves...",
      "It hisses when touched, grants eloquence...",
      "Serpentine leaves that aid persuasion..."
    ]
  },
  {
    plantId: 6,
    clues: [
      "My fever burns. I need the eternal cold flower...",
      "Ice-blue petals that never wilt...",
      "The lily that's cold to touch, soothes heated minds..."
    ]
  },
  {
    plantId: 7,
    clues: [
      "I'm always tired. Need the glowing orange root...",
      "Warm as embers, provides endless energy...",
      "The tuberous root that radiates heat and passion..."
    ]
  },
  {
    plantId: 8,
    clues: [
      "For my ritual, I need the purple smoke flower...",
      "Sweet-smelling, releases smoke, enhances magic...",
      "The witch's favorite, purple and mystical..."
    ]
  },
  {
    plantId: 9,
    clues: [
      "I'm forgetting everything. The glowing green moss...",
      "Preserves memories when spoken to...",
      "Soft moss that lights up with knowledge..."
    ]
  },
  {
    plantId: 10,
    clues: [
      "I must speak to the dead. The skeletal white flower...",
      "Grows in graveyards, petals like bone fingers...",
      "The macabre bloom that bridges life and death..."
    ]
  },
  {
    plantId: 11,
    clues: [
      "I need to control storms. The crackling vine...",
      "Sparks with lightning, tastes of ozone...",
      "Electric tendrils that command the weather..."
    ]
  },
  {
    plantId: 12,
    clues: [
      "My dreams are nightmares. The shifting pink petals...",
      "Iridescent, smells of childhood, grants lucid dreams...",
      "The petal that changes color and controls sleep visions..."
    ]
  }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;