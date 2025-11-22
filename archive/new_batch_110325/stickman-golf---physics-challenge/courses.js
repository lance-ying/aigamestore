// courses.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Hazard } from './entities.js';

export function getCourseData(courseIndex) {
  const courses = [
    // Course 0: Tutorial - Simple straight shot
    {
      name: "Beginner's Luck",
      par: 3,
      ballStart: { x: 100, y: 350 },
      holePos: { x: 500, y: 350 },
      platforms: [
        { x: 300, y: 380, width: 580, height: 40, options: {} }
      ],
      hazards: []
    },
    
    // Course 1: Elevated hole
    {
      name: "Up and Away",
      par: 4,
      ballStart: { x: 80, y: 350 },
      holePos: { x: 520, y: 250 },
      platforms: [
        { x: 200, y: 380, width: 380, height: 40, options: {} },
        { x: 470, y: 280, width: 150, height: 40, options: {} }
      ],
      hazards: [
        { x: 300, y: 360, width: 60, height: 20 }
      ]
    },
    
    // Course 2: Moving platform
    {
      name: "Moving Target",
      par: 5,
      ballStart: { x: 80, y: 350 },
      holePos: { x: 520, y: 200 },
      platforms: [
        { x: 150, y: 380, width: 250, height: 40, options: {} },
        { x: 350, y: 300, width: 80, height: 20, options: { moving: true, moveRange: 80, moveSpeed: 0.02, moveDirection: 'horizontal' } },
        { x: 480, y: 230, width: 120, height: 40, options: {} }
      ],
      hazards: [
        { x: 250, y: 360, width: 40, height: 15 },
        { x: 400, y: 360, width: 40, height: 15 }
      ]
    },
    
    // Course 3: Bouncy platform
    {
      name: "Bounce House",
      par: 4,
      ballStart: { x: 80, y: 350 },
      holePos: { x: 520, y: 150 },
      platforms: [
        { x: 150, y: 380, width: 250, height: 40, options: {} },
        { x: 350, y: 320, width: 100, height: 20, options: { bouncy: true } },
        { x: 480, y: 180, width: 120, height: 40, options: {} }
      ],
      hazards: []
    },
    
    // Course 4: The Gauntlet
    {
      name: "The Gauntlet",
      par: 6,
      ballStart: { x: 80, y: 350 },
      holePos: { x: 520, y: 100 },
      platforms: [
        { x: 150, y: 380, width: 250, height: 40, options: {} },
        { x: 300, y: 320, width: 60, height: 20, options: { moving: true, moveRange: 50, moveSpeed: 0.03, moveDirection: 'vertical' } },
        { x: 400, y: 250, width: 80, height: 20, options: { bouncy: true } },
        { x: 480, y: 130, width: 120, height: 40, options: {} }
      ],
      hazards: [
        { x: 220, y: 360, width: 30, height: 15 },
        { x: 350, y: 280, width: 40, height: 15 },
        { x: 450, y: 200, width: 35, height: 15 }
      ]
    }
  ];
  
  return courses[Math.min(courseIndex, courses.length - 1)];
}

export function loadCourse(p, courseIndex) {
  const courseData = getCourseData(courseIndex);
  
  const platforms = courseData.platforms.map(plat => 
    new Platform(p, plat.x, plat.y, plat.width, plat.height, plat.options)
  );
  
  const hazards = courseData.hazards.map(haz =>
    new Hazard(p, haz.x, haz.y, haz.width, haz.height)
  );
  
  return {
    name: courseData.name,
    par: courseData.par,
    ballStart: courseData.ballStart,
    holePos: courseData.holePos,
    platforms,
    hazards
  };
}