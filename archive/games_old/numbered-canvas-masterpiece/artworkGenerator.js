// artworkGenerator.js - Generates artwork data for each level

import { LEVELS, GAME_HEIGHT, CANVAS_WIDTH } from './globals.js';

export function generateArtworkForLevel(level) {
  const config = LEVELS[level - 1];
  const segments = [];
  const colors = config.colors;
  
  // Generate color palette
  const palette = generateColorPalette(colors);
  
  // Generate segments based on level complexity
  const segmentCount = config.segments;
  
  if (level === 1) {
    // Simple large shapes - a flower
    generateFlowerArtwork(segments, colors, palette);
  } else if (level === 2) {
    // Simple animal - a butterfly
    generateButterflyArtwork(segments, colors, palette);
  } else if (level === 3) {
    // Detailed pattern - mandala
    generateMandalaArtwork(segments, colors, palette);
  } else if (level === 4) {
    // Complex scene - house
    generateHouseArtwork(segments, colors, palette);
  } else if (level === 5) {
    // Master artwork - landscape
    generateLandscapeArtwork(segments, colors, palette);
  }
  
  return { segments, palette };
}

function generateColorPalette(colorCount) {
  const palette = [];
  const hueStep = 360 / colorCount;
  
  for (let i = 0; i < colorCount; i++) {
    const hue = (i * hueStep) % 360;
    const saturation = 70 + Math.random() * 20;
    const brightness = 50 + Math.random() * 30;
    palette.push({
      id: i + 1,
      hue: hue,
      saturation: saturation,
      brightness: brightness
    });
  }
  
  return palette;
}

function generateFlowerArtwork(segments, colorCount, palette) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;
  
  // Center circle
  const petalCount = 8;
  const petalRadius = 60;
  
  // Add center
  segments.push(createCircleSegment(0, centerX, centerY, 30, 1, palette));
  
  // Add petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i * Math.PI * 2) / petalCount;
    const px = centerX + Math.cos(angle) * petalRadius;
    const py = centerY + Math.sin(angle) * petalRadius;
    const colorID = (i % (colorCount - 1)) + 2;
    segments.push(createPetalSegment(i + 1, px, py, angle, 40, colorID, palette));
  }
  
  // Add outer petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i * Math.PI * 2) / petalCount + Math.PI / petalCount;
    const px = centerX + Math.cos(angle) * (petalRadius + 50);
    const py = centerY + Math.sin(angle) * (petalRadius + 50);
    const colorID = (i % (colorCount - 1)) + 2;
    segments.push(createPetalSegment(i + 9, px, py, angle, 35, colorID, palette));
  }
  
  // Add leaves
  segments.push(createLeafSegment(17, centerX - 80, centerY + 80, -0.3, colorCount, palette));
  segments.push(createLeafSegment(18, centerX + 80, centerY + 80, 0.3, colorCount, palette));
  
  // Fill in background segments
  const bgSegments = 60;
  for (let i = 0; i < bgSegments; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 100;
    const px = centerX + Math.cos(angle) * distance;
    const py = centerY + Math.sin(angle) * distance;
    if (px > 20 && px < CANVAS_WIDTH - 20 && py > 20 && py < GAME_HEIGHT - 20) {
      const colorID = Math.floor(Math.random() * colorCount) + 1;
      segments.push(createSmallTriangle(segments.length, px, py, 15, colorID, palette));
    }
  }
}

function generateButterflyArtwork(segments, colorCount, palette) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;
  
  // Body
  segments.push(createEllipseSegment(0, centerX, centerY, 15, 50, 1, palette));
  
  // Wings - left top
  segments.push(createWingSegment(1, centerX - 50, centerY - 40, -1, 2, palette));
  segments.push(createWingSegment(2, centerX - 80, centerY - 60, -1, 3, palette));
  
  // Wings - right top
  segments.push(createWingSegment(3, centerX + 50, centerY - 40, 1, 2, palette));
  segments.push(createWingSegment(4, centerX + 80, centerY - 60, 1, 3, palette));
  
  // Wings - left bottom
  segments.push(createWingSegment(5, centerX - 50, centerY + 40, -1, 4, palette));
  segments.push(createWingSegment(6, centerX - 80, centerY + 60, -1, 5, palette));
  
  // Wings - right bottom
  segments.push(createWingSegment(7, centerX + 50, centerY + 40, 1, 4, palette));
  segments.push(createWingSegment(8, centerX + 80, centerY + 60, 1, 5, palette));
  
  // Wing patterns
  for (let i = 0; i < 40; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = centerX + side * (30 + Math.random() * 80);
    const y = centerY - 60 + Math.random() * 120;
    const colorID = Math.floor(Math.random() * colorCount) + 1;
    segments.push(createSmallCircle(segments.length, x, y, 8, colorID, palette));
  }
  
  // Background fill
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * GAME_HEIGHT;
    const colorID = Math.floor(Math.random() * colorCount) + 1;
    segments.push(createSmallTriangle(segments.length, x, y, 12, colorID, palette));
  }
}

function generateMandalaArtwork(segments, colorCount, palette) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = GAME_HEIGHT / 2;
  
  // Create concentric rings
  const rings = 8;
  const segmentsPerRing = [1, 8, 12, 16, 20, 24, 28, 32];
  
  for (let ring = 0; ring < rings; ring++) {
    const radius = 20 + ring * 35;
    const count = segmentsPerRing[ring];
    
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const colorID = ((ring + i) % colorCount) + 1;
      
      if (ring === 0) {
        segments.push(createCircleSegment(segments.length, centerX, centerY, 20, colorID, palette));
      } else {
        const nextAngle = ((i + 1) * Math.PI * 2) / count;
        const innerRadius = 20 + (ring - 1) * 35;
        
        const vertices = [
          [centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius],
          [centerX + Math.cos(nextAngle) * innerRadius, centerY + Math.sin(nextAngle) * innerRadius],
          [centerX + Math.cos(nextAngle) * radius, centerY + Math.sin(nextAngle) * radius],
          [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius]
        ];
        
        segments.push(createPolygonSegment(segments.length, vertices, colorID, palette));
      }
    }
  }
}

function generateHouseArtwork(segments, colorCount, palette) {
  const baseX = CANVAS_WIDTH / 2 - 100;
  const baseY = GAME_HEIGHT / 2;
  
  // Roof
  segments.push(createTriangleSegment(0, baseX + 100, baseY - 80, baseX, baseY - 20, baseX + 200, baseY - 20, 1, palette));
  
  // Walls
  const wallSegments = 20;
  for (let i = 0; i < wallSegments; i++) {
    const x = baseX + (i % 10) * 20;
    const y = baseY - 20 + Math.floor(i / 10) * 40;
    segments.push(createRectSegment(segments.length, x, y, 20, 40, ((i % (colorCount - 1)) + 2), palette));
  }
  
  // Windows
  segments.push(createRectSegment(segments.length, baseX + 30, baseY - 10, 30, 30, colorCount, palette));
  segments.push(createRectSegment(segments.length, baseX + 140, baseY - 10, 30, 30, colorCount, palette));
  
  // Door
  segments.push(createRectSegment(segments.length, baseX + 85, baseY + 20, 30, 40, colorCount - 1, palette));
  
  // Chimney
  segments.push(createRectSegment(segments.length, baseX + 150, baseY - 90, 20, 40, 2, palette));
  
  // Garden
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = baseY + 60 + Math.random() * 60;
    const colorID = Math.floor(Math.random() * colorCount) + 1;
    segments.push(createSmallTriangle(segments.length, x, y, 10, colorID, palette));
  }
  
  // Sky
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * (baseY - 100);
    const colorID = Math.floor(Math.random() * 3) + 1;
    segments.push(createSmallCircle(segments.length, x, y, 8, colorID, palette));
  }
}

function generateLandscapeArtwork(segments, colorCount, palette) {
  // Sky layer
  for (let y = 0; y < GAME_HEIGHT / 3; y += 15) {
    for (let x = 0; x < CANVAS_WIDTH; x += 15) {
      const colorID = Math.floor(Math.random() * 3) + 1;
      segments.push(createRectSegment(segments.length, x, y, 15, 15, colorID, palette));
    }
  }
  
  // Mountains
  const mountainCount = 5;
  for (let i = 0; i < mountainCount; i++) {
    const baseX = (i * CANVAS_WIDTH) / mountainCount;
    const height = 60 + Math.random() * 40;
    const colorID = 3 + (i % (colorCount - 3));
    
    for (let j = 0; j < 10; j++) {
      const x = baseX + j * 12;
      const y = GAME_HEIGHT / 3 + (height * j) / 10;
      segments.push(createTriangleSegment(segments.length, x, y - height, x - 10, y, x + 22, y, colorID, palette));
    }
  }
  
  // Trees
  const treeCount = 15;
  for (let i = 0; i < treeCount; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = GAME_HEIGHT / 2 + Math.random() * (GAME_HEIGHT / 3);
    const colorID = 4 + Math.floor(Math.random() * 4);
    
    // Trunk
    segments.push(createRectSegment(segments.length, x - 5, y, 10, 30, colorID, palette));
    // Foliage
    segments.push(createCircleSegment(segments.length, x, y - 15, 20, colorID + 1, palette));
  }
  
  // Ground
  for (let y = GAME_HEIGHT * 2 / 3; y < GAME_HEIGHT; y += 12) {
    for (let x = 0; x < CANVAS_WIDTH; x += 12) {
      const colorID = 5 + Math.floor(Math.random() * (colorCount - 5));
      segments.push(createRectSegment(segments.length, x, y, 12, 12, colorID, palette));
    }
  }
}

// Helper functions to create different segment shapes
function createCircleSegment(id, x, y, radius, colorID, palette) {
  const vertices = [];
  const sides = 20;
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides;
    vertices.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createEllipseSegment(id, x, y, rx, ry, colorID, palette) {
  const vertices = [];
  const sides = 20;
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides;
    vertices.push([x + Math.cos(angle) * rx, y + Math.sin(angle) * ry]);
  }
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createRectSegment(id, x, y, w, h, colorID, palette) {
  const vertices = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ];
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createTriangleSegment(id, x1, y1, x2, y2, x3, y3, colorID, palette) {
  const vertices = [[x1, y1], [x2, y2], [x3, y3]];
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createPetalSegment(id, x, y, angle, size, colorID, palette) {
  const vertices = [];
  for (let i = 0; i <= 10; i++) {
    const a = angle - Math.PI / 4 + (i * Math.PI / 2) / 10;
    const r = i <= 5 ? (i * size) / 5 : ((10 - i) * size) / 5;
    vertices.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createLeafSegment(id, x, y, angle, colorID, palette) {
  const vertices = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = Math.sin(t * Math.PI) * 40;
    const a = angle + (t - 0.5) * 0.8;
    vertices.push([x + Math.cos(a) * r, y + Math.sin(a) * r + t * 60]);
  }
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createWingSegment(id, x, y, side, colorID, palette) {
  const vertices = [];
  for (let i = 0; i <= 10; i++) {
    const angle = (i * Math.PI) / 10;
    const radius = 40 * Math.sin(angle);
    vertices.push([x + side * Math.cos(angle) * 50, y + Math.sin(angle) * radius - 20]);
  }
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createSmallCircle(id, x, y, radius, colorID, palette) {
  return createCircleSegment(id, x, y, radius, colorID, palette);
}

function createSmallTriangle(id, x, y, size, colorID, palette) {
  const vertices = [
    [x, y - size],
    [x - size, y + size],
    [x + size, y + size]
  ];
  return createPolygonSegment(id, vertices, colorID, palette);
}

function createPolygonSegment(id, vertices, colorID, palette) {
  const color = palette[colorID - 1];
  
  // Calculate center for number placement
  let centerX = 0, centerY = 0;
  for (let v of vertices) {
    centerX += v[0];
    centerY += v[1];
  }
  centerX /= vertices.length;
  centerY /= vertices.length;
  
  return {
    id: id,
    vertices: vertices,
    number: colorID,
    targetColorID: colorID,
    isFilled: false,
    fillColor: null,
    targetColor: color,
    centerX: centerX,
    centerY: centerY
  };
}