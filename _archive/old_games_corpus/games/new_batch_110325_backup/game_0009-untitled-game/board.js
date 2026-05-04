import { SPACE_TYPES, PROPERTY_GROUPS } from './globals.js';

export function createBoard() {
  const spaces = [];
  
  // Corner: GO
  spaces.push({ type: SPACE_TYPES.GO, name: "GO", position: 0 });
  
  // Bottom row (1-9)
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Mediterranean", group: "BROWN", price: 60, rent: [2, 10, 30, 90, 160, 250], position: 1 });
  spaces.push({ type: SPACE_TYPES.COMMUNITY_CHEST, name: "Community Chest", position: 2 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Baltic", group: "BROWN", price: 60, rent: [4, 20, 60, 180, 320, 450], position: 3 });
  spaces.push({ type: SPACE_TYPES.TAX, name: "Income Tax", amount: 200, position: 4 });
  spaces.push({ type: SPACE_TYPES.RAILROAD, name: "Reading RR", price: 200, position: 5 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Oriental", group: "LIGHT_BLUE", price: 100, rent: [6, 30, 90, 270, 400, 550], position: 6 });
  spaces.push({ type: SPACE_TYPES.CHANCE, name: "Chance", position: 7 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Vermont", group: "LIGHT_BLUE", price: 100, rent: [6, 30, 90, 270, 400, 550], position: 8 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Connecticut", group: "LIGHT_BLUE", price: 120, rent: [8, 40, 100, 300, 450, 600], position: 9 });
  
  // Corner: Just Visiting/Jail
  spaces.push({ type: SPACE_TYPES.JAIL, name: "Jail", position: 10 });
  
  // Left row (11-19)
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "St. Charles", group: "PINK", price: 140, rent: [10, 50, 150, 450, 625, 750], position: 11 });
  spaces.push({ type: SPACE_TYPES.UTILITY, name: "Electric Co.", price: 150, position: 12 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "States", group: "PINK", price: 140, rent: [10, 50, 150, 450, 625, 750], position: 13 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Virginia", group: "PINK", price: 160, rent: [12, 60, 180, 500, 700, 900], position: 14 });
  spaces.push({ type: SPACE_TYPES.RAILROAD, name: "Pennsylvania RR", price: 200, position: 15 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "St. James", group: "ORANGE", price: 180, rent: [14, 70, 200, 550, 750, 950], position: 16 });
  spaces.push({ type: SPACE_TYPES.COMMUNITY_CHEST, name: "Community Chest", position: 17 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Tennessee", group: "ORANGE", price: 180, rent: [14, 70, 200, 550, 750, 950], position: 18 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "New York", group: "ORANGE", price: 200, rent: [16, 80, 220, 600, 800, 1000], position: 19 });
  
  // Corner: Free Parking
  spaces.push({ type: SPACE_TYPES.FREE_PARKING, name: "Free Parking", position: 20 });
  
  // Top row (21-29)
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Kentucky", group: "RED", price: 220, rent: [18, 90, 250, 700, 875, 1050], position: 21 });
  spaces.push({ type: SPACE_TYPES.CHANCE, name: "Chance", position: 22 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Indiana", group: "RED", price: 220, rent: [18, 90, 250, 700, 875, 1050], position: 23 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Illinois", group: "RED", price: 240, rent: [20, 100, 300, 750, 925, 1100], position: 24 });
  spaces.push({ type: SPACE_TYPES.RAILROAD, name: "B&O RR", price: 200, position: 25 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Atlantic", group: "YELLOW", price: 260, rent: [22, 110, 330, 800, 975, 1150], position: 26 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Ventnor", group: "YELLOW", price: 260, rent: [22, 110, 330, 800, 975, 1150], position: 27 });
  spaces.push({ type: SPACE_TYPES.UTILITY, name: "Water Works", price: 150, position: 28 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Marvin Gardens", group: "YELLOW", price: 280, rent: [24, 120, 360, 850, 1025, 1200], position: 29 });
  
  // Corner: Go To Jail
  spaces.push({ type: SPACE_TYPES.GO_TO_JAIL, name: "Go To Jail", position: 30 });
  
  // Right row (31-39)
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Pacific", group: "GREEN", price: 300, rent: [26, 130, 390, 900, 1100, 1275], position: 31 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "N. Carolina", group: "GREEN", price: 300, rent: [26, 130, 390, 900, 1100, 1275], position: 32 });
  spaces.push({ type: SPACE_TYPES.COMMUNITY_CHEST, name: "Community Chest", position: 33 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Pennsylvania", group: "GREEN", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], position: 34 });
  spaces.push({ type: SPACE_TYPES.RAILROAD, name: "Short Line", price: 200, position: 35 });
  spaces.push({ type: SPACE_TYPES.CHANCE, name: "Chance", position: 36 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Park Place", group: "DARK_BLUE", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], position: 37 });
  spaces.push({ type: SPACE_TYPES.TAX, name: "Luxury Tax", amount: 100, position: 38 });
  spaces.push({ type: SPACE_TYPES.PROPERTY, name: "Boardwalk", group: "DARK_BLUE", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], position: 39 });
  
  // Initialize property ownership
  spaces.forEach(space => {
    if (space.type === SPACE_TYPES.PROPERTY || 
        space.type === SPACE_TYPES.RAILROAD || 
        space.type === SPACE_TYPES.UTILITY) {
      space.owner = null;
      space.houses = 0;
      space.mortgaged = false;
    }
  });
  
  return spaces;
}

export function createChanceCards() {
  return [
    { text: "Advance to GO, collect $200", action: "ADVANCE_TO_GO" },
    { text: "Bank pays you $50", action: "COLLECT", amount: 50 },
    { text: "Go Back 3 Spaces", action: "MOVE_BACK", spaces: 3 },
    { text: "Go to Jail", action: "GO_TO_JAIL" },
    { text: "Make repairs: $25 per house, $100 per hotel", action: "REPAIRS", house: 25, hotel: 100 },
    { text: "Pay poor tax of $15", action: "PAY", amount: 15 },
    { text: "Advance to nearest Railroad", action: "ADVANCE_TO_RAILROAD" },
    { text: "Your building loan matures, collect $150", action: "COLLECT", amount: 150 }
  ];
}

export function createCommunityChestCards() {
  return [
    { text: "Bank error in your favor, collect $200", action: "COLLECT", amount: 200 },
    { text: "Doctor's fees, pay $50", action: "PAY", amount: 50 },
    { text: "From sale of stock, collect $50", action: "COLLECT", amount: 50 },
    { text: "Go to Jail", action: "GO_TO_JAIL" },
    { text: "Holiday fund matures, collect $100", action: "COLLECT", amount: 100 },
    { text: "Income tax refund, collect $20", action: "COLLECT", amount: 20 },
    { text: "Life insurance matures, collect $100", action: "COLLECT", amount: 100 },
    { text: "Pay school fees of $50", action: "PAY", amount: 50 }
  ];
}

export function getSpaceScreenPosition(position) {
  const cornerSize = 45;
  const spaceSize = 35;
  
  // Bottom row (0-10)
  if (position <= 10) {
    return {
      x: 550 - position * spaceSize,
      y: 355
    };
  }
  // Left row (11-20)
  else if (position <= 20) {
    return {
      x: 45,
      y: 355 - (position - 10) * spaceSize
    };
  }
  // Top row (21-30)
  else if (position <= 30) {
    return {
      x: 45 + (position - 20) * spaceSize,
      y: 45
    };
  }
  // Right row (31-39)
  else {
    return {
      x: 555,
      y: 45 + (position - 30) * spaceSize
    };
  }
}

export function getColorForGroup(group) {
  const colors = {
    BROWN: [139, 69, 19],
    LIGHT_BLUE: [135, 206, 250],
    PINK: [255, 192, 203],
    ORANGE: [255, 165, 0],
    RED: [220, 20, 60],
    YELLOW: [255, 255, 0],
    GREEN: [34, 139, 34],
    DARK_BLUE: [0, 0, 139]
  };
  return colors[group] || [200, 200, 200];
}