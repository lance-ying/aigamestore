// puzzles.js - Puzzle room definitions and management
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Turret, Gate, Receiver, Sigil, Switch } from './entities.js';
import { Jammer, Connector, Box } from './tools.js';

export class Puzzle {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.completed = false;
  }

  setup() {
    // Override in specific puzzle implementations
  }

  checkCompletion() {
    // Override in specific puzzle implementations
    return false;
  }
}

export class Puzzle1 extends Puzzle {
  constructor() {
    super(1, 'Jammer Tutorial', 'Use the Jammer to disable the turret');
  }

  setup() {
    // Clear existing entities and tools
    gameState.entities = [];
    gameState.tools = [];

    // Place player
    if (gameState.player) {
      gameState.player.x = 100;
      gameState.player.y = 200;
      gameState.player.angle = 0;
    }

    // Create jammer tool
    const jammer = new Jammer(150, 200);
    gameState.tools.push(jammer);

    // Create turret
    const turret = new Turret(400, 200);
    gameState.entities.push(turret);

    // Create receiver and gate
    const receiver = new Receiver(500, 200);
    const gate = new Gate(550, 200, receiver);
    gameState.entities.push(receiver);
    gameState.entities.push(gate);

    // Create sigil behind gate
    const sigil = new Sigil(560, 200, [[0, 0], [1, 0], [0, 1], [1, 1]]); // Square tetromino
    gameState.entities.push(sigil);

    // Add walls for boundaries
    this.addBoundaryWalls();
  }

  addBoundaryWalls() {
    // Simple boundary markers (not actual collision walls)
    const wall1 = { type: 'WALL', x: 50, y: 200, width: 20 };
    const wall2 = { type: 'WALL', x: 580, y: 200, width: 20 };
    gameState.entities.push(wall1, wall2);
  }

  checkCompletion() {
    for (let entity of gameState.entities) {
      if (entity.type === 'SIGIL' && entity.collected) {
        return true;
      }
    }
    return false;
  }
}

export class Puzzle2 extends Puzzle {
  constructor() {
    super(2, 'Connector Challenge', 'Connect energy to open the gate');
  }

  setup() {
    gameState.entities = [];
    gameState.tools = [];

    if (gameState.player) {
      gameState.player.x = 100;
      gameState.player.y = 150;
      gameState.player.angle = 0;
    }

    // Create two connectors
    const connector1 = new Connector(200, 150);
    const connector2 = new Connector(350, 150);
    gameState.tools.push(connector1, connector2);

    // Create jammer to disable turret
    const jammer = new Jammer(150, 250);
    gameState.tools.push(jammer);

    // Create turret
    const turret = new Turret(350, 250);
    gameState.entities.push(turret);

    // Create receiver and gate
    const receiver = new Receiver(500, 150);
    const gate = new Gate(550, 200, receiver);
    gameState.entities.push(receiver);
    gameState.entities.push(gate);

    // Create sigil
    const sigil = new Sigil(560, 200, [[0, 0], [1, 0], [2, 0], [1, 1]]); // T tetromino
    gameState.entities.push(sigil);
  }

  checkCompletion() {
    for (let entity of gameState.entities) {
      if (entity.type === 'SIGIL' && entity.collected) {
        return true;
      }
    }
    return false;
  }
}

export class Puzzle3 extends Puzzle {
  constructor() {
    super(3, 'Advanced Sequence', 'Use all tools strategically');
  }

  setup() {
    gameState.entities = [];
    gameState.tools = [];

    if (gameState.player) {
      gameState.player.x = 80;
      gameState.player.y = 200;
      gameState.player.angle = 0;
    }

    // Create multiple tools
    const jammer1 = new Jammer(120, 150);
    const jammer2 = new Jammer(120, 250);
    const connector1 = new Connector(250, 120);
    const connector2 = new Connector(350, 120);
    const box = new Box(200, 280);

    gameState.tools.push(jammer1, jammer2, connector1, connector2, box);

    // Create multiple turrets
    const turret1 = new Turret(300, 180);
    const turret2 = new Turret(300, 220);
    const turret3 = new Turret(450, 200);
    gameState.entities.push(turret1, turret2, turret3);

    // Create receivers and gates
    const receiver1 = new Receiver(480, 120);
    const gate1 = new Gate(520, 150, receiver1);
    gameState.entities.push(receiver1);
    gameState.entities.push(gate1);

    // Create final sigil
    const sigil = new Sigil(540, 200, [[0, 0], [0, 1], [0, 2], [0, 3]]); // Line tetromino
    gameState.entities.push(sigil);
  }

  checkCompletion() {
    for (let entity of gameState.entities) {
      if (entity.type === 'SIGIL' && entity.collected) {
        return true;
      }
    }
    return false;
  }
}

export function initializePuzzles() {
  gameState.puzzles = [
    new Puzzle1(),
    new Puzzle2(),
    new Puzzle3()
  ];
  gameState.totalSigils = gameState.puzzles.length;
}

export function loadPuzzle(puzzleIndex) {
  if (puzzleIndex < gameState.puzzles.length) {
    gameState.currentPuzzle = puzzleIndex;
    gameState.puzzles[puzzleIndex].setup();
  }
}

export function checkPuzzleCompletion() {
  const currentPuzzle = gameState.puzzles[gameState.currentPuzzle];
  if (currentPuzzle && !currentPuzzle.completed && currentPuzzle.checkCompletion()) {
    currentPuzzle.completed = true;
    
    // Load next puzzle
    if (gameState.currentPuzzle + 1 < gameState.puzzles.length) {
      setTimeout(() => {
        loadPuzzle(gameState.currentPuzzle + 1);
        gameState.messages.push({ text: `Puzzle ${gameState.currentPuzzle + 1} Complete!`, frames: 120 });
      }, 1000);
    }
  }
}