export function generateLevelImages(p, levelNumber) {
  const leftImage = p.createGraphics(280, 350);
  const rightImage = p.createGraphics(280, 350);
  
  if (levelNumber === 1) {
    generateParkScene(p, leftImage, rightImage);
  } else if (levelNumber === 2) {
    generateBookstoreScene(p, leftImage, rightImage);
  } else if (levelNumber === 3) {
    generateForestScene(p, leftImage, rightImage);
  }
  
  return { left: leftImage, right: rightImage };
}

function generateParkScene(p, leftImg, rightImg) {
  // Left image (base)
  leftImg.background(135, 206, 235); // Sky blue
  
  // Grass
  leftImg.fill(34, 139, 34);
  leftImg.noStroke();
  leftImg.rect(0, 250, 280, 100);
  
  // Sun
  leftImg.fill(255, 223, 0);
  leftImg.circle(50, 50, 40);
  
  // Trees
  leftImg.fill(139, 69, 19);
  leftImg.rect(200, 180, 20, 80);
  leftImg.fill(34, 139, 34);
  leftImg.circle(210, 160, 60);
  
  leftImg.fill(139, 69, 19);
  leftImg.rect(60, 190, 15, 70);
  leftImg.fill(34, 139, 34);
  leftImg.circle(67, 175, 50);
  
  // Bench
  leftImg.fill(139, 69, 19);
  leftImg.rect(100, 280, 80, 10);
  leftImg.rect(105, 290, 5, 20);
  leftImg.rect(170, 290, 5, 20);
  
  // Person
  leftImg.fill(255, 220, 177); // Skin
  leftImg.circle(250, 260, 20);
  leftImg.fill(255, 0, 0); // Red shirt
  leftImg.rect(240, 270, 20, 30);
  leftImg.fill(0, 0, 255); // Blue pants
  leftImg.rect(240, 300, 8, 25);
  leftImg.rect(252, 300, 8, 25);
  
  // Bird
  leftImg.stroke(0);
  leftImg.strokeWeight(2);
  leftImg.noFill();
  leftImg.arc(150, 100, 15, 10, p.PI, p.TWO_PI);
  leftImg.arc(165, 100, 15, 10, p.PI, p.TWO_PI);
  
  // Right image (with differences)
  rightImg.image(leftImg, 0, 0);
  
  // Difference 1: Sun color (x: 150, y: 150 - adjusted position)
  rightImg.fill(255, 165, 0); // Orange sun
  rightImg.noStroke();
  rightImg.circle(50, 50, 40);
  
  // Difference 2: Missing bird (x: 250, y: 100)
  rightImg.fill(135, 206, 235);
  rightImg.noStroke();
  rightImg.rect(142, 90, 30, 20);
  
  // Difference 3: Bench missing plank (x: 100, y: 250)
  rightImg.fill(34, 139, 34);
  rightImg.rect(105, 290, 5, 20);
  
  // Difference 4: Person's shirt color (x: 200, y: 300)
  rightImg.fill(0, 255, 0); // Green shirt
  rightImg.rect(240, 270, 20, 30);
  
  // Difference 5: Tree trunk color (x: 280, y: 220)
  rightImg.fill(101, 67, 33);
  rightImg.rect(200, 180, 20, 80);
}

function generateBookstoreScene(p, leftImg, rightImg) {
  // Left image
  leftImg.background(101, 67, 33); // Brown wooden background
  
  // Floor
  leftImg.fill(139, 90, 43);
  leftImg.rect(0, 300, 280, 50);
  
  // Bookshelves
  for (let i = 0; i < 4; i++) {
    leftImg.fill(160, 82, 45);
    leftImg.rect(20 + i * 60, 80, 50, 200);
    
    // Books
    for (let j = 0; j < 8; j++) {
      const bookColors = [
        [200, 50, 50], [50, 150, 200], [100, 200, 100],
        [200, 200, 50], [150, 100, 200], [200, 150, 100]
      ];
      const colorIndex = (i * 8 + j) % bookColors.length;
      leftImg.fill(...bookColors[colorIndex]);
      leftImg.rect(22 + i * 60, 85 + j * 23, 46, 20);
      leftImg.stroke(0);
      leftImg.strokeWeight(1);
      leftImg.line(22 + i * 60, 85 + j * 23, 22 + i * 60, 105 + j * 23);
      leftImg.noStroke();
    }
  }
  
  // Lamp
  leftImg.fill(255, 215, 0);
  leftImg.circle(140, 40, 30);
  leftImg.fill(180, 180, 180);
  leftImg.rect(135, 55, 10, 25);
  
  // Chair
  leftImg.fill(139, 69, 19);
  leftImg.rect(220, 250, 40, 10);
  leftImg.rect(225, 260, 5, 30);
  leftImg.rect(250, 260, 5, 30);
  leftImg.rect(230, 230, 20, 20);
  
  // Rug
  leftImg.fill(178, 34, 34);
  leftImg.rect(90, 310, 100, 30);
  
  // Right image (with differences)
  rightImg.image(leftImg, 0, 0);
  
  // Difference 1: Book color change (x: 120, y: 120)
  rightImg.fill(255, 100, 255);
  rightImg.rect(22, 85 + 1 * 23, 46, 20);
  
  // Difference 2: Missing book spine line (x: 180, y: 180)
  rightImg.fill(50, 150, 200);
  rightImg.noStroke();
  rightImg.rect(82, 85 + 4 * 23, 46, 20);
  
  // Difference 3: Lamp glow color (x: 240, y: 140)
  rightImg.fill(200, 200, 255);
  rightImg.circle(140, 40, 30);
  
  // Difference 4: Chair leg missing (x: 150, y: 260)
  rightImg.fill(139, 90, 43);
  rightImg.rect(225, 260, 5, 30);
  
  // Difference 5: Book color (x: 260, y: 280)
  rightImg.fill(0, 255, 255);
  rightImg.rect(202, 85 + 6 * 23, 46, 20);
  
  // Difference 6: Rug pattern (x: 100, y: 320)
  rightImg.fill(139, 0, 0);
  rightImg.rect(90, 310, 100, 30);
  
  // Difference 7: Book spine (x: 280, y: 100)
  rightImg.fill(255, 255, 0);
  rightImg.rect(142, 85, 46, 20);
}

function generateForestScene(p, leftImg, rightImg) {
  // Left image
  leftImg.background(20, 40, 20); // Dark green
  
  // Ground
  leftImg.fill(40, 30, 20);
  leftImg.rect(0, 280, 280, 70);
  
  // Trees
  for (let i = 0; i < 6; i++) {
    const x = 30 + i * 45;
    const h = 180 + (i % 3) * 20;
    leftImg.fill(40, 25, 15);
    leftImg.rect(x, 100, 15, h);
    leftImg.fill(15, 60, 15);
    leftImg.ellipse(x + 7, 80 + (i % 2) * 10, 40, 50);
  }
  
  // Rocks
  leftImg.fill(100, 100, 100);
  leftImg.ellipse(80, 310, 40, 25);
  leftImg.ellipse(180, 320, 35, 20);
  leftImg.ellipse(240, 315, 30, 22);
  
  // Foliage
  for (let i = 0; i < 15; i++) {
    leftImg.fill(10, 80 + (i % 3) * 20, 10);
    const x = (i * 37 + 23) % 260 + 10;
    const y = 250 + (i % 4) * 10;
    leftImg.ellipse(x, y, 20, 15);
  }
  
  // Ancient ruins
  leftImg.fill(150, 150, 150);
  leftImg.rect(200, 180, 60, 100);
  leftImg.fill(20, 40, 20);
  leftImg.rect(210, 190, 20, 30);
  
  // Moon
  leftImg.fill(240, 240, 200);
  leftImg.circle(50, 50, 35);
  
  // Moss on rocks
  leftImg.fill(0, 100, 0);
  leftImg.ellipse(85, 305, 15, 8);
  
  // Right image (with differences)
  rightImg.image(leftImg, 0, 0);
  
  // Difference 1: Moon color (x: 130, y: 110)
  rightImg.fill(200, 200, 240);
  rightImg.noStroke();
  rightImg.circle(50, 50, 35);
  
  // Difference 2: Tree foliage shape (x: 170, y: 160)
  rightImg.fill(10, 70, 10);
  rightImg.ellipse(142, 90, 45, 55);
  
  // Difference 3: Missing moss (x: 210, y: 130)
  rightImg.fill(100, 100, 100);
  rightImg.ellipse(85, 305, 15, 8);
  
  // Difference 4: Rock size (x: 250, y: 190)
  rightImg.fill(100, 100, 100);
  rightImg.ellipse(180, 320, 30, 18);
  
  // Difference 5: Foliage color (x: 140, y: 240)
  rightImg.fill(50, 150, 50);
  const xf = (5 * 37 + 23) % 260 + 10;
  const yf = 250 + (5 % 4) * 10;
  rightImg.ellipse(xf, yf, 20, 15);
  
  // Difference 6: Ruin crack (x: 200, y: 280)
  rightImg.stroke(0);
  rightImg.strokeWeight(2);
  rightImg.line(220, 200, 225, 250);
  rightImg.noStroke();
  
  // Difference 7: Tree trunk width (x: 270, y: 250)
  rightImg.fill(40, 25, 15);
  rightImg.rect(255, 100, 18, 200);
  
  // Difference 8: Ground foliage missing (x: 110, y: 320)
  rightImg.fill(40, 30, 20);
  const x8 = (2 * 37 + 23) % 260 + 10;
  const y8 = 250 + (2 % 4) * 10;
  rightImg.ellipse(x8, y8, 20, 15);
  
  // Difference 9: Rock position (x: 260, y: 320)
  rightImg.fill(100, 100, 100);
  rightImg.ellipse(245, 315, 30, 22);
  
  // Difference 10: Ruin window (x: 180, y: 90)
  rightImg.fill(100, 100, 100);
  rightImg.rect(210, 190, 20, 30);
}