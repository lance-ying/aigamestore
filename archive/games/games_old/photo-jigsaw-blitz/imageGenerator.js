// imageGenerator.js - Generate procedural images for puzzles

export function generateLevelImage(p, level) {
  const size = 600;
  const img = p.createGraphics(size, size);
  
  img.background(220);
  
  // Generate different patterns for each level
  switch(level) {
    case 1:
      generateSimplePattern(img, size);
      break;
    case 2:
      generateGeometricPattern(img, size);
      break;
    case 3:
      generateGradientPattern(img, size);
      break;
    case 4:
      generateComplexPattern(img, size);
      break;
    default:
      generateSimplePattern(img, size);
  }
  
  return img;
}

function generateSimplePattern(img, size) {
  // Large colorful circles
  img.noStroke();
  
  img.fill(255, 100, 100);
  img.circle(size * 0.3, size * 0.3, size * 0.4);
  
  img.fill(100, 255, 100);
  img.circle(size * 0.7, size * 0.3, size * 0.4);
  
  img.fill(100, 100, 255);
  img.circle(size * 0.5, size * 0.7, size * 0.4);
  
  img.fill(255, 255, 100);
  img.circle(size * 0.5, size * 0.5, size * 0.3);
}

function generateGeometricPattern(img, size) {
  // Geometric shapes
  img.noStroke();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const x = i * (size / 8) + size / 16;
      const y = j * (size / 8) + size / 16;
      const hue = (i * j * 30) % 360;
      
      img.fill(hue % 255, 150, 200);
      
      if ((i + j) % 2 === 0) {
        img.circle(x, y, size / 10);
      } else {
        img.rect(x - size / 20, y - size / 20, size / 10, size / 10);
      }
    }
  }
}

function generateGradientPattern(img, size) {
  // Radial gradient with patterns
  for (let r = size; r > 0; r -= 20) {
    const hue = (r / size) * 200 + 100;
    img.noStroke();
    img.fill(hue, 150, 200, 150);
    img.circle(size / 2, size / 2, r);
  }
  
  // Add some decorative elements
  img.stroke(255, 200);
  img.strokeWeight(3);
  img.noFill();
  
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * img.TWO_PI;
    const x1 = size / 2 + img.cos(angle) * size * 0.2;
    const y1 = size / 2 + img.sin(angle) * size * 0.2;
    const x2 = size / 2 + img.cos(angle) * size * 0.45;
    const y2 = size / 2 + img.sin(angle) * size * 0.45;
    img.line(x1, y1, x2, y2);
  }
}

function generateComplexPattern(img, size) {
  // Complex overlapping patterns
  img.colorMode(img.HSB);
  
  // Background gradient
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hue = (x + y) / (size * 2) * 180;
      img.stroke(hue, 80, 90);
      img.point(x, y);
    }
  }
  
  // Overlapping circles
  img.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (i % 5) * (size / 4) + size / 8;
    const y = Math.floor(i / 5) * (size / 4) + size / 8;
    const hue = (i * 30) % 360;
    
    img.fill(hue, 70, 90, 0.5);
    img.circle(x, y, size / 6);
  }
  
  // Add grid lines
  img.stroke(0, 0, 100, 0.3);
  img.strokeWeight(2);
  for (let i = 1; i < 5; i++) {
    img.line(0, i * size / 5, size, i * size / 5);
    img.line(i * size / 5, 0, i * size / 5, size);
  }
  
  img.colorMode(img.RGB);
}