// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 32;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Facility types
export const FACILITY_TYPES = {
  POOL: {
    id: 'POOL',
    name: 'Pool',
    cost: 100,
    income: 5,
    satisfaction: 10,
    color: [100, 180, 255],
    size: 2,
    unlocked: true
  },
  WATERSLIDE: {
    id: 'WATERSLIDE',
    name: 'Waterslide',
    cost: 300,
    income: 15,
    satisfaction: 25,
    color: [255, 200, 100],
    size: 2,
    unlocked: false
  },
  RESTAURANT: {
    id: 'RESTAURANT',
    name: 'Restaurant',
    cost: 150,
    income: 8,
    satisfaction: 15,
    color: [255, 150, 150],
    size: 2,
    unlocked: true
  },
  DECORATION: {
    id: 'DECORATION',
    name: 'Decoration',
    cost: 50,
    income: 0,
    satisfaction: 5,
    color: [150, 255, 150],
    size: 1,
    unlocked: true
  },
  LOUNGE: {
    id: 'LOUNGE',
    name: 'Lounge',
    cost: 200,
    income: 10,
    satisfaction: 20,
    color: [200, 150, 255],
    size: 2,
    unlocked: false
  }<game_description>
Build and manage a tropical pool resort! Place pools, waterslides, restaurants, and decorations to attract customers and earn money. Keep customer satisfaction high by fulfilling their needs and offering diverse attractions. Unlock new facilities through research points and popularity milestones. Balance expansion with profitability to create the ultimate summer paradise!
</game_description>

<game_controls>
Arrow Keys: Navigate menu/select tiles
Space: Place selected facility / Confirm action
Z: Cancel placement / Go back
Shift: Upgrade selected facility (when hovering over placed facility)
Enter: Start game from menu
Esc: Pause/Unpause game
R: Restart game (return to start screen)
</game_controls>

<automated_testing>
<TEST_1>
<test_description>Basic functionality test that validates core game mechanics including facility placement, customer spawning, money earning, and basic interactions. Tests that the game loop functions correctly and entities behave as expected.</test_description>
<strategy_description>Place a few basic facilities (pool and restaurant) in strategic locations. Wait for customers to spawn and use facilities. Verify that money is earned from customer usage and that customer satisfaction updates appropriately.</strategy_description>
<expected_outcome>Successfully place multiple facilities, spawn customers, earn money from their usage, and maintain stable customer satisfaction above 50. Test passes if game runs without errors for sufficient duration and basic mechanics work.</expected_outcome>
</TEST_1>

<TEST_2>
<test_description>Win condition test that implements an optimal strategy to achieve victory by reaching the target SNS buzz points. Tests progression systems, unlocks, facility upgrades, and strategic resource management to maximize customer flow and satisfaction.</test_description>
<strategy_description>Systematically build a diverse resort with pools, waterslides, restaurants, and decorations. Prioritize high-appeal facilities and strategic placement to maximize customer satisfaction. Upgrade facilities when possible and maintain balanced resource allocation to reach 1000 SNS buzz points.</strategy_description>
<expected_outcome>Achieve GAME_OVER_WIN state by reaching 1000 SNS buzz points. Test validates that progression systems work correctly, facilities can be upgraded, customers generate sufficient revenue, and the win condition is properly triggered.</expected_outcome>
</TEST_2>
</automated_testing>

<code filename="globals.js">
// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = 12;
export const GRID_ROWS = 8;

export const FACILITY_TYPES = {
  POOL: { name: "Pool", cost: 50, appeal: 15, capacity: 4, color: [100, 200, 255], icon: "~", unlocked: true },
  WATERSLIDE: { name: "Waterslide", cost: 150, appeal: 30, capacity: 2, color: [255, 150, 50], icon: "S", unlocked: false },
  RESTAURANT: { name: "Restaurant", cost: 80, appeal: 20, capacity: 6, color: [255, 200, 100], icon: "R", unlocked: true },
  DECORATION: { name: "Decoration", cost: 30, appeal: 5, capacity: 0, color: [100, 255, 100], icon: "*", unlocked: true },
  CABANA: { name: "Cabana", cost: 120, appeal: 25, capacity: 3, color: [200, 150, 100], icon: "C", unlocked: false },
};

export const gameState = {
  gamePhase: "START",
  controlMode: "HUMAN",
  player: null,
  entities: [],
  facilities: [],
  customers: [],
  grid: [],
  money: 200,
  satisfaction: 70,
  snsBuzz: 0,
  researchPoints: 0,
  selectedFacilityType: "POOL",
  cursorX: 0,
  cursorY: 0,
  menuOpen: true,
  hoveredFacility: null,
  time: 0,
  customerSpawnTimer: 0,
  researchTimer: 0,
  paused: false,
  gameOverReason: "",
  customerRequests: [],
  unlockedFacilities: ["POOL", "RESTAURANT", "DECORATION"],
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}