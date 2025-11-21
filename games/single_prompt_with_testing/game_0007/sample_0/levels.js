// levels.js

export class LevelGenerator {
  constructor() {
    this.levels = [];
    this.generateLevels();
  }

  generateLevels() {
    // Level 1: Simple red ball
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [255, 80, 80] } }
      ],
      solution: [
        { type: 'paint', color: [255, 80, 80] }
      ]
    });

    // Level 2: Blue ball with white eyes
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [80, 120, 255] } },
        { type: 'mask_circle', data: { 
          positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }],
          sizes: [0.35, 0.35]
        }}
      ],
      solution: [
        { type: 'paint', color: [80, 120, 255] },
        { type: 'mask_circle', positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }], sizes: [0.35, 0.35] }
      ]
    });

    // Level 3: Yellow with black pupils
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [255, 220, 80] } },
        { type: 'mask_circle', data: { 
          positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }],
          sizes: [0.35, 0.35]
        }},
        { type: 'dots', data: { color: [40, 40, 40], count: 4 } }
      ],
      solution: [
        { type: 'paint', color: [255, 220, 80] },
        { type: 'mask_circle', positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }], sizes: [0.35, 0.35] },
        { type: 'dots', color: [40, 40, 40], count: 4 }
      ]
    });

    // Level 4: Green with horizontal mask
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [80, 200, 100] } },
        { type: 'mask_horizontal', data: {} }
      ],
      solution: [
        { type: 'paint', color: [80, 200, 100] },
        { type: 'horizontal_band', color: [255, 255, 255] }
      ]
    });

    // Level 5: Purple with vertical mask
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [180, 80, 200] } },
        { type: 'mask_vertical', data: {} }
      ],
      solution: [
        { type: 'paint', color: [180, 80, 200] },
        { type: 'vertical_band', color: [255, 255, 255] }
      ]
    });

    // Level 6: Orange with stripes
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [255, 150, 60] } },
        { type: 'stripes', data: { color: [100, 50, 20], count: 3 } }
      ],
      solution: [
        { type: 'paint', color: [255, 150, 60] },
        { type: 'stripes', color: [100, 50, 20], count: 3 }
      ]
    });

    // Level 7: Cyan with ring
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [80, 220, 230] } },
        { type: 'ring', data: { color: [200, 100, 50], thickness: 0.15 } }
      ],
      solution: [
        { type: 'paint', color: [80, 220, 230] },
        { type: 'ring', color: [200, 100, 50], thickness: 0.15 }
      ]
    });

    // Level 8: Complex - red base, white eyes, black pupils
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [255, 80, 80] } },
        { type: 'mask_circle', data: { 
          positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }],
          sizes: [0.35, 0.35]
        }},
        { type: 'paint', data: { color: [40, 40, 40] } }
      ],
      solution: [
        { type: 'paint', color: [255, 80, 80] },
        { type: 'mask_circle', positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }], sizes: [0.35, 0.35] },
        { type: 'paint', color: [40, 40, 40] },
        { type: 'mask_circle', positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }], sizes: [0.35, 0.35] }
      ]
    });

    // Level 9: Green with dots
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [100, 200, 100] } },
        { type: 'dots', data: { color: [255, 220, 100], count: 5 } }
      ],
      solution: [
        { type: 'paint', color: [100, 200, 100] },
        { type: 'dots', color: [255, 220, 100], count: 5 }
      ]
    });

    // Level 10: Blue with stripes and ring
    this.levels.push({
      tools: [
        { type: 'paint', data: { color: [80, 120, 255] } },
        { type: 'stripes', data: { color: [255, 255, 255], count: 4 } },
        { type: 'ring', data: { color: [255, 200, 80], thickness: 0.12 } }
      ],
      solution: [
        { type: 'paint', color: [80, 120, 255] },
        { type: 'stripes', color: [255, 255, 255], count: 4 },
        { type: 'ring', color: [255, 200, 80], thickness: 0.12 }
      ]
    });

    // Continue with more complex combinations
    for (let i = 10; i < 20; i++) {
      this.levels.push(this.generateRandomLevel(i));
    }
  }

  generateRandomLevel(levelNum) {
    const toolTypes = ['paint', 'mask_circle', 'mask_horizontal', 'mask_vertical', 'dots', 'stripes', 'ring'];
    const colors = [
      [255, 80, 80], [80, 120, 255], [255, 220, 80], [80, 200, 100],
      [180, 80, 200], [255, 150, 60], [80, 220, 230], [200, 100, 50]
    ];
    
    const toolCount = Math.min(3 + Math.floor(levelNum / 5), 6);
    const tools = [];
    const solution = [];
    
    // Start with paint
    const baseColor = colors[levelNum % colors.length];
    tools.push({ type: 'paint', data: { color: baseColor } });
    solution.push({ type: 'paint', color: baseColor });
    
    // Add 1-2 more tools
    const additionalTools = Math.min(toolCount - 1, 3);
    for (let i = 0; i < additionalTools; i++) {
      const toolType = toolTypes[(levelNum + i + 1) % toolTypes.length];
      let tool;
      
      switch (toolType) {
        case 'paint':
          tool = { type: 'paint', data: { color: colors[(levelNum + i + 2) % colors.length] } };
          solution.push({ type: 'paint', color: colors[(levelNum + i + 2) % colors.length] });
          break;
        case 'mask_circle':
          tool = { type: 'mask_circle', data: { 
            positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }],
            sizes: [0.35, 0.35]
          }};
          solution.push({ 
            type: 'mask_circle', 
            positions: [{ x: -0.4, y: -0.3 }, { x: 0.4, y: -0.3 }],
            sizes: [0.35, 0.35]
          });
          break;
        case 'dots':
          tool = { type: 'dots', data: { color: colors[(levelNum + i + 3) % colors.length], count: 4 + (i % 3) } };
          solution.push({ type: 'dots', color: colors[(levelNum + i + 3) % colors.length], count: 4 + (i % 3) });
          break;
        case 'stripes':
          tool = { type: 'stripes', data: { color: colors[(levelNum + i + 4) % colors.length], count: 3 + (i % 2) } };
          solution.push({ type: 'stripes', color: colors[(levelNum + i + 4) % colors.length], count: 3 + (i % 2) });
          break;
        case 'ring':
          tool = { type: 'ring', data: { color: colors[(levelNum + i + 5) % colors.length], thickness: 0.12 + (i * 0.02) } };
          solution.push({ type: 'ring', color: colors[(levelNum + i + 5) % colors.length], thickness: 0.12 + (i * 0.02) });
          break;
        default:
          continue;
      }
      
      if (tool) {
        tools.push(tool);
      }
    }
    
    return { tools, solution };
  }

  getLevel(levelNum) {
    return this.levels[Math.min(levelNum - 1, this.levels.length - 1)];
  }
}

export default LevelGenerator;