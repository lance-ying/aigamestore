// elements.js - Element definitions and recipes

export const ELEMENT_RECIPES = {
  // Basic elements (starting)
  "Air": { category: "Basic", icon: "☁️", color: [200, 230, 255] },
  "Earth": { category: "Basic", icon: "🌍", color: [139, 90, 43] },
  "Fire": { category: "Basic", icon: "🔥", color: [255, 100, 50] },
  "Water": { category: "Basic", icon: "💧", color: [50, 150, 255] },
  
  // Nature category
  "Steam": { category: "Nature", icon: "💨", color: [220, 220, 240], recipe: ["Fire", "Water"] },
  "Lava": { category: "Nature", icon: "🌋", color: [255, 80, 0], recipe: ["Fire", "Earth"] },
  "Mud": { category: "Nature", icon: "🟤", color: [101, 67, 33], recipe: ["Water", "Earth"] },
  "Dust": { category: "Nature", icon: "✨", color: [180, 180, 160], recipe: ["Air", "Earth"] },
  "Rain": { category: "Nature", icon: "🌧️", color: [100, 150, 200], recipe: ["Air", "Water"] },
  "Wind": { category: "Nature", icon: "🌪️", color: [180, 210, 230], recipe: ["Air", "Air"] },
  "Stone": { category: "Nature", icon: "🪨", color: [120, 120, 120], recipe: ["Lava", "Water"] },
  "Sand": { category: "Nature", icon: "🏖️", color: [238, 214, 175], recipe: ["Stone", "Air"] },
  "Cloud": { category: "Nature", icon: "☁️", color: [240, 240, 250], recipe: ["Steam", "Air"] },
  "Swamp": { category: "Nature", icon: "🌿", color: [80, 100, 70], recipe: ["Mud", "Water"] },
  
  // Life category
  "Energy": { category: "Life", icon: "⚡", color: [255, 255, 100], recipe: ["Fire", "Air"] },
  "Life": { category: "Life", icon: "🧬", color: [100, 255, 100], recipe: ["Energy", "Swamp"] },
  "Seed": { category: "Life", icon: "🌱", color: [120, 180, 80], recipe: ["Life", "Sand"] },
  "Plant": { category: "Life", icon: "🌿", color: [50, 200, 50], recipe: ["Seed", "Water"] },
  "Tree": { category: "Life", icon: "🌳", color: [34, 139, 34], recipe: ["Plant", "Earth"] },
  "Grass": { category: "Life", icon: "🌾", color: [124, 252, 0], recipe: ["Plant", "Earth"] },
  "Moss": { category: "Life", icon: "🍀", color: [90, 140, 90], recipe: ["Plant", "Stone"] },
  "Algae": { category: "Life", icon: "🦠", color: [50, 180, 100], recipe: ["Life", "Water"] },
  "Bacteria": { category: "Life", icon: "🦠", color: [150, 200, 150], recipe: ["Life", "Swamp"] },
  "Plankton": { category: "Life", icon: "🔬", color: [100, 200, 200], recipe: ["Bacteria", "Water"] },
  
  // Materials category
  "Metal": { category: "Materials", icon: "⚙️", color: [180, 180, 200], recipe: ["Fire", "Stone"] },
  "Glass": { category: "Materials", icon: "🪟", color: [200, 240, 255], recipe: ["Fire", "Sand"] },
  "Clay": { category: "Materials", icon: "🧱", color: [160, 100, 80], recipe: ["Mud", "Sand"] },
  "Wood": { category: "Materials", icon: "🪵", color: [139, 90, 43], recipe: ["Tree", "Fire"] },
  "Coal": { category: "Materials", icon: "⚫", color: [40, 40, 40], recipe: ["Wood", "Earth"] },
  "Ash": { category: "Materials", icon: "💨", color: [150, 150, 150], recipe: ["Fire", "Wood"] },
  "Steam Engine": { category: "Materials", icon: "🚂", color: [100, 100, 120], recipe: ["Steam", "Metal"] },
  "Brick": { category: "Materials", icon: "🧱", color: [180, 80, 60], recipe: ["Clay", "Fire"] },
  "Cement": { category: "Materials", icon: "🏗️", color: [160, 160, 160], recipe: ["Clay", "Stone"] },
  "Concrete": { category: "Materials", icon: "🏢", color: [140, 140, 140], recipe: ["Cement", "Water"] },
  
  // Technology category
  "Tool": { category: "Technology", icon: "🔧", color: [150, 150, 170], recipe: ["Metal", "Wood"] },
  "Wheel": { category: "Technology", icon: "⚙️", color: [100, 100, 100], recipe: ["Stone", "Wood"] },
  "Machine": { category: "Technology", icon: "⚙️", color: [120, 120, 140], recipe: ["Tool", "Steam Engine"] },
  "Electricity": { category: "Technology", icon: "⚡", color: [255, 255, 0], recipe: ["Energy", "Metal"] },
  "Light": { category: "Technology", icon: "💡", color: [255, 255, 200], recipe: ["Electricity", "Glass"] },
  "Wire": { category: "Technology", icon: "〰️", color: [200, 150, 100], recipe: ["Metal", "Electricity"] },
  "Battery": { category: "Technology", icon: "🔋", color: [100, 200, 100], recipe: ["Electricity", "Metal"] },
  "Computer": { category: "Technology", icon: "💻", color: [100, 100, 150], recipe: ["Electricity", "Tool"] },
  "Robot": { category: "Technology", icon: "🤖", color: [150, 150, 180], recipe: ["Machine", "Electricity"] },
  "Engine": { category: "Technology", icon: "🔧", color: [120, 120, 120], recipe: ["Metal", "Energy"] },
  
  // Civilization category
  "House": { category: "Civilization", icon: "🏠", color: [200, 150, 100], recipe: ["Brick", "Wood"] },
  "Village": { category: "Civilization", icon: "🏘️", color: [180, 160, 120], recipe: ["House", "House"] },
  "City": { category: "Civilization", icon: "🏙️", color: [140, 140, 160], recipe: ["Village", "Concrete"] },
  "Farm": { category: "Civilization", icon: "🚜", color: [200, 180, 100], recipe: ["Grass", "Tool"] },
  "Field": { category: "Civilization", icon: "🌾", color: [220, 200, 100], recipe: ["Earth", "Seed"] },
  "Garden": { category: "Civilization", icon: "🌺", color: [180, 255, 180], recipe: ["Plant", "House"] },
  "Road": { category: "Civilization", icon: "🛣️", color: [100, 100, 100], recipe: ["Stone", "Wheel"] },
  "Bridge": { category: "Civilization", icon: "🌉", color: [120, 100, 80], recipe: ["Wood", "Road"] },
  "Factory": { category: "Civilization", icon: "🏭", color: [100, 100, 120], recipe: ["Machine", "House"] },
  "School": { category: "Civilization", icon: "🏫", color: [200, 180, 150], recipe: ["House", "Tool"] },
  
  // Creatures category
  "Fish": { category: "Creatures", icon: "🐟", color: [100, 150, 255], recipe: ["Plankton", "Life"] },
  "Bird": { category: "Creatures", icon: "🐦", color: [255, 200, 100], recipe: ["Life", "Air"] },
  "Beast": { category: "Creatures", icon: "🐺", color: [140, 100, 80], recipe: ["Life", "Earth"] },
  "Lizard": { category: "Creatures", icon: "🦎", color: [120, 180, 100], recipe: ["Swamp", "Life"] },
  "Snake": { category: "Creatures", icon: "🐍", color: [100, 140, 80], recipe: ["Lizard", "Sand"] },
  "Worm": { category: "Creatures", icon: "🪱", color: [180, 100, 100], recipe: ["Bacteria", "Earth"] },
  "Butterfly": { category: "Creatures", icon: "🦋", color: [255, 180, 200], recipe: ["Worm", "Air"] },
  "Beetle": { category: "Creatures", icon: "🪲", color: [80, 80, 100], recipe: ["Worm", "Stone"] },
  "Spider": { category: "Creatures", icon: "🕷️", color: [60, 60, 80], recipe: ["Beetle", "Thread"] },
  "Frog": { category: "Creatures", icon: "🐸", color: [100, 200, 100], recipe: ["Lizard", "Swamp"] },
  
  // Magic category
  "Magic": { category: "Magic", icon: "✨", color: [255, 100, 255], recipe: ["Energy", "Life"] },
  "Wizard": { category: "Magic", icon: "🧙", color: [150, 100, 200], recipe: ["Magic", "Life"] },
  "Potion": { category: "Magic", icon: "🧪", color: [200, 100, 255], recipe: ["Magic", "Water"] },
  "Spell": { category: "Magic", icon: "📜", color: [255, 200, 100], recipe: ["Magic", "Tool"] },
  "Crystal": { category: "Magic", icon: "💎", color: [150, 200, 255], recipe: ["Magic", "Stone"] },
  "Enchantment": { category: "Magic", icon: "✨", color: [255, 150, 255], recipe: ["Magic", "Metal"] },
  "Wand": { category: "Magic", icon: "🪄", color: [180, 140, 100], recipe: ["Wood", "Magic"] },
  "Cauldron": { category: "Magic", icon: "🍯", color: [80, 80, 90], recipe: ["Metal", "Magic"] },
  "Portal": { category: "Magic", icon: "🌀", color: [100, 100, 255], recipe: ["Magic", "Energy"] },
  "Teleport": { category: "Magic", icon: "✨", color: [200, 150, 255], recipe: ["Portal", "Magic"] },
  
  // Advanced category
  "Thread": { category: "Advanced", icon: "🧵", color: [220, 220, 220], recipe: ["Plant", "Tool"] },
  "Cloth": { category: "Advanced", icon: "🧶", color: [200, 180, 160], recipe: ["Thread", "Thread"] },
  "Paper": { category: "Advanced", icon: "📄", color: [250, 250, 240], recipe: ["Wood", "Water"] },
  "Book": { category: "Advanced", icon: "📚", color: [160, 100, 80], recipe: ["Paper", "Tool"] },
  "Knowledge": { category: "Advanced", icon: "🎓", color: [100, 150, 200], recipe: ["Book", "Magic"] },
  "Science": { category: "Advanced", icon: "🔬", color: [150, 200, 255], recipe: ["Knowledge", "Tool"] },
  "Philosophy": { category: "Advanced", icon: "💭", color: [180, 180, 200], recipe: ["Knowledge", "Life"] },
  "Art": { category: "Advanced", icon: "🎨", color: [255, 150, 150], recipe: ["Magic", "Tool"] },
  "Music": { category: "Advanced", icon: "🎵", color: [200, 150, 255], recipe: ["Air", "Art"] },
  "Time": { category: "Advanced", icon: "⏰", color: [200, 200, 220], recipe: ["Magic", "Sand"] },
  
  // Space category
  "Sky": { category: "Space", icon: "🌌", color: [100, 150, 255], recipe: ["Air", "Cloud"] },
  "Star": { category: "Space", icon: "⭐", color: [255, 255, 150], recipe: ["Fire", "Sky"] },
  "Moon": { category: "Space", icon: "🌙", color: [220, 220, 240], recipe: ["Stone", "Sky"] },
  "Sun": { category: "Space", icon: "☀️", color: [255, 220, 0], recipe: ["Fire", "Star"] },
  "Planet": { category: "Space", icon: "🪐", color: [180, 150, 200], recipe: ["Earth", "Star"] },
  "Comet": { category: "Space", icon: "☄️", color: [200, 200, 255], recipe: ["Stone", "Star"] },
  "Galaxy": { category: "Space", icon: "🌌", color: [100, 100, 200], recipe: ["Star", "Star"] },
  "Universe": { category: "Space", icon: "🌠", color: [50, 50, 150], recipe: ["Galaxy", "Time"] },
  "Void": { category: "Space", icon: "⚫", color: [20, 20, 40], recipe: ["Universe", "Magic"] },
  "Cosmos": { category: "Space", icon: "✨", color: [80, 80, 150], recipe: ["Universe", "Energy"] }
};

// Build reverse lookup for combinations
export function buildRecipeLookup() {
  const lookup = new Map();
  
  for (const [resultName, data] of Object.entries(ELEMENT_RECIPES)) {
    if (data.recipe && data.recipe.length === 2) {
      const [elem1, elem2] = data.recipe.sort();
      const key = `${elem1}|${elem2}`;
      lookup.set(key, resultName);
    }
  }
  
  return lookup;
}

export function getRecipeResult(elem1, elem2) {
  const lookup = buildRecipeLookup();
  const key = [elem1, elem2].sort().join('|');
  return lookup.get(key) || null;
}

export function getCategorizedElements(discoveredElements) {
  const categories = {};
  
  for (const elementName of discoveredElements) {
    const element = ELEMENT_RECIPES[elementName];
    if (!element) continue;
    
    if (!categories[element.category]) {
      categories[element.category] = [];
    }
    categories[element.category].push(elementName);
  }
  
  // Sort elements within each category
  for (const category in categories) {
    categories[category].sort();
  }
  
  return categories;
}

export function getStartingElements() {
  return ["Air", "Earth", "Fire", "Water"];
}

export function getTotalElementCount() {
  return Object.keys(ELEMENT_RECIPES).length;
}