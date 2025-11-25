// crosshair.js - Crosshair rendering

import { gameState } from './globals.js';

export function renderCrosshair(p, x, y) {
  const design = gameState.crosshairDesign;
  
  p.push();
  p.translate(x, y);
  p.rotate(p.radians(design.rotation));
  
  const lineColor = [design.colorR, design.colorG, design.colorB];
  const outlineColor = [0, 0, 0];
  
  // Draw outlines first (if thickness > 0)
  if (design.outlineThickness > 0) {
    p.stroke(...outlineColor, design.outlineOpacity);
    p.strokeWeight(design.lineWidth + design.outlineThickness * 2);
    
    // Top line
    p.line(0, -(design.lineOffset + design.lineLength), 0, -design.lineOffset);
    // Bottom line
    p.line(0, design.lineOffset, 0, design.lineOffset + design.lineLength);
    // Left line
    p.line(-(design.lineOffset + design.lineLength), 0, -design.lineOffset, 0);
    // Right line
    p.line(design.lineOffset, 0, design.lineOffset + design.lineLength, 0);
  }
  
  // Draw main crosshair lines
  p.stroke(...lineColor, design.lineOpacity);
  p.strokeWeight(design.lineWidth);
  
  // Top line
  p.line(0, -(design.lineOffset + design.lineLength), 0, -design.lineOffset);
  // Bottom line
  p.line(0, design.lineOffset, 0, design.lineOffset + design.lineLength);
  // Left line
  p.line(-(design.lineOffset + design.lineLength), 0, -design.lineOffset, 0);
  // Right line
  p.line(design.lineOffset, 0, design.lineOffset + design.lineLength, 0);
  
  // Draw center dot outline
  if (design.centerDotSize > 0 && design.outlineThickness > 0) {
    p.fill(...outlineColor, design.outlineOpacity);
    p.noStroke();
    p.ellipse(0, 0, design.centerDotSize * 2 + design.outlineThickness * 2);
  }
  
  // Draw center dot
  if (design.centerDotSize > 0) {
    p.fill(...lineColor, design.centerDotOpacity);
    p.noStroke();
    p.ellipse(0, 0, design.centerDotSize * 2);
  }
  
  p.pop();
}

export function renderCrosshairPreview(p, x, y, scale = 1) {
  p.push();
  p.translate(x, y);
  p.scale(scale);
  renderCrosshair(p, 0, 0);
  p.pop();
}