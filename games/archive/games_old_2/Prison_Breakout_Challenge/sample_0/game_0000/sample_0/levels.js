// levels.js - Level definitions
import { Platform } from './platform.js';
import { Objective } from './objectives.js';
import { Guard } from './guard.js';
import { CANVAS_HEIGHT } from './globals.js';

export function createLevel1() {
  const platforms = [
    new Platform(0, CANVAS_HEIGHT - 20, 800, 20, [60, 60, 60]), // Ground
    new Platform(150, CANVAS_HEIGHT - 80, 120, 10, [100, 100, 100]),
    new Platform(350, CANVAS_HEIGHT - 140, 100, 10, [100, 100, 100]),
    new Platform(550, CANVAS_HEIGHT - 100, 150, 10, [100, 100, 100])
  ];

  const objectives = [
    new Objective("KEY", 200, CANVAS_HEIGHT - 120),
    new Objective("DOOR", 650, CANVAS_HEIGHT - 50, { requiredKeys: 1 }),
    new Objective("EXIT", 700, CANVAS_HEIGHT - 50)
  ];

  const guards = [
    new Guard(300, CANVAS_HEIGHT - 75, [
      {x: 250, y: CANVAS_HEIGHT - 75},
      {x: 450, y: CANVAS_HEIGHT - 75}
    ])
  ];

  return { platforms, objectives, guards, playerStart: {x: 50, y: CANVAS_HEIGHT - 90} };
}

export function createLevel2() {
  const platforms = [
    new Platform(0, CANVAS_HEIGHT - 20, 1200, 20, [60, 60, 60]), // Ground
    new Platform(100, CANVAS_HEIGHT - 90, 150, 10, [100, 100, 100]),
    new Platform(300, CANVAS_HEIGHT - 160, 120, 10, [100, 100, 100]),
    new Platform(500, CANVAS_HEIGHT - 130, 100, 10, [100, 100, 100]),
    new Platform(700, CANVAS_HEIGHT - 200, 150, 10, [100, 100, 100]),
    new Platform(900, CANVAS_HEIGHT - 150, 120, 10, [100, 100, 100]),
    new Platform(650, CANVAS_HEIGHT - 90, 80, 10, [100, 100, 100])
  ];

  const objectives = [
    new Objective("KEY", 350, CANVAS_HEIGHT - 200),
    new Objective("KEY", 950, CANVAS_HEIGHT - 190),
    new Objective("SWITCH", 550, CANVAS_HEIGHT - 160),
    new Objective("DOOR", 1050, CANVAS_HEIGHT - 50, { requiredKeys: 2 }),
    new Objective("EXIT", 1100, CANVAS_HEIGHT - 50)
  ];

  const guards = [
    new Guard(200, CANVAS_HEIGHT - 55, [
      {x: 150, y: CANVAS_HEIGHT - 55},
      {x: 400, y: CANVAS_HEIGHT - 55}
    ]),
    new Guard(800, CANVAS_HEIGHT - 55, [
      {x: 700, y: CANVAS_HEIGHT - 55},
      {x: 1000, y: CANVAS_HEIGHT - 55}
    ])
  ];

  return { platforms, objectives, guards, playerStart: {x: 30, y: CANVAS_HEIGHT - 90} };
}

export function createLevel3() {
  const platforms = [
    new Platform(0, CANVAS_HEIGHT - 20, 1600, 20, [60, 60, 60]), // Ground
    new Platform(120, CANVAS_HEIGHT - 90, 140, 10, [100, 100, 100]),
    new Platform(320, CANVAS_HEIGHT - 160, 100, 10, [100, 100, 100]),
    new Platform(480, CANVAS_HEIGHT - 230, 120, 10, [100, 100, 100]),
    new Platform(670, CANVAS_HEIGHT - 180, 90, 10, [100, 100, 100]),
    new Platform(830, CANVAS_HEIGHT - 250, 100, 10, [100, 100, 100]),
    new Platform(1000, CANVAS_HEIGHT - 200, 130, 10, [100, 100, 100]),
    new Platform(1200, CANVAS_HEIGHT - 150, 100, 10, [100, 100, 100]),
    new Platform(1380, CANVAS_HEIGHT - 100, 150, 10, [100, 100, 100]),
    new Platform(300, CANVAS_HEIGHT - 90, 60, 10, [100, 100, 100]),
    new Platform(800, CANVAS_HEIGHT - 100, 80, 10, [100, 100, 100])
  ];

  const objectives = [
    new Objective("KEY", 530, CANVAS_HEIGHT - 270),
    new Objective("KEY", 1050, CANVAS_HEIGHT - 240),
    new Objective("SWITCH", 710, CANVAS_HEIGHT - 210),
    new Objective("SWITCH", 1250, CANVAS_HEIGHT - 180),
    new Objective("DOOR", 1450, CANVAS_HEIGHT - 50, { requiredKeys: 2 }),
    new Objective("EXIT", 1500, CANVAS_HEIGHT - 50)
  ];

  const guards = [
    new Guard(250, CANVAS_HEIGHT - 55, [
      {x: 150, y: CANVAS_HEIGHT - 55},
      {x: 400, y: CANVAS_HEIGHT - 55}
    ]),
    new Guard(700, CANVAS_HEIGHT - 55, [
      {x: 600, y: CANVAS_HEIGHT - 55},
      {x: 900, y: CANVAS_HEIGHT - 55}
    ]),
    new Guard(1200, CANVAS_HEIGHT - 55, [
      {x: 1100, y: CANVAS_HEIGHT - 55},
      {x: 1350, y: CANVAS_HEIGHT - 55}
    ])
  ];

  return { platforms, objectives, guards, playerStart: {x: 40, y: CANVAS_HEIGHT - 90} };
}