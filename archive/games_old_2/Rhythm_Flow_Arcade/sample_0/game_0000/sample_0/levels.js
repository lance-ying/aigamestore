// levels.js - Level definitions and chart data

export const LEVEL_DEFINITIONS = [
  {
    level: 1,
    name: "Beginner's Beat",
    bpm: 110,
    scrollSpeed: 150,
    timingGoodWindow: 150,
    description: "Slow and simple - learn the basics"
  },
  {
    level: 2,
    name: "Groovy Glide",
    bpm: 135,
    scrollSpeed: 180,
    timingGoodWindow: 120,
    description: "Pick up the pace with coordination"
  },
  {
    level: 3,
    name: "Rhythm Rush",
    bpm: 155,
    scrollSpeed: 220,
    timingGoodWindow: 100,
    description: "Fast patterns across all lanes"
  },
  {
    level: 4,
    name: "Maestro Mix",
    bpm: 175,
    scrollSpeed: 260,
    timingGoodWindow: 80,
    description: "Complex chords and rapid streams"
  },
  {
    level: 5,
    name: "Project Pro",
    bpm: 195,
    scrollSpeed: 300,
    timingGoodWindow: 60,
    description: "The ultimate challenge awaits"
  }
];

// Generate note charts procedurally with increasing difficulty
export function generateChart(level) {
  const chart = [];
  const def = LEVEL_DEFINITIONS[level - 1];
  const beatInterval = (60000 / def.bpm); // ms per beat
  const songDuration = 30000 + (level * 10000); // 30-70 seconds depending on level
  
  let time = 2000; // Start after 2 seconds
  
  // Level 1: Simple single notes
  if (level === 1) {
    while (time < songDuration) {
      const lane = Math.floor(Math.random() * 4);
      chart.push({ time, lane, type: 'tap' });
      time += beatInterval * (Math.random() < 0.3 ? 2 : 1);
      
      // Occasional hold note
      if (Math.random() < 0.1) {
        chart.push({ time, lane, type: 'hold', duration: beatInterval * 2 });
        time += beatInterval * 3;
      }
    }
  }
  
  // Level 2: Some double notes
  else if (level === 2) {
    while (time < songDuration) {
      const lane = Math.floor(Math.random() * 4);
      chart.push({ time, lane, type: 'tap' });
      
      // Add double notes
      if (Math.random() < 0.3) {
        let lane2 = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
        chart.push({ time, lane: lane2, type: 'tap' });
      }
      
      time += beatInterval * (Math.random() < 0.5 ? 1 : 0.5);
      
      // More hold notes
      if (Math.random() < 0.15) {
        const holdLane = Math.floor(Math.random() * 4);
        chart.push({ time, lane: holdLane, type: 'hold', duration: beatInterval * 2 });
        time += beatInterval * 2.5;
      }
    }
  }
  
  // Level 3: Triple notes and faster
  else if (level === 3) {
    while (time < songDuration) {
      const numNotes = Math.random() < 0.4 ? (Math.random() < 0.5 ? 2 : 3) : 1;
      const lanes = [];
      
      for (let i = 0; i < numNotes; i++) {
        let lane;
        do {
          lane = Math.floor(Math.random() * 4);
        } while (lanes.includes(lane));
        lanes.push(lane);
        chart.push({ time, lane, type: 'tap' });
      }
      
      time += beatInterval * (Math.random() < 0.6 ? 0.5 : 0.25);
      
      // Hold notes with taps
      if (Math.random() < 0.2) {
        const holdLane = Math.floor(Math.random() * 4);
        chart.push({ time, lane: holdLane, type: 'hold', duration: beatInterval * 3 });
        time += beatInterval * 3.5;
      }
    }
  }
  
  // Level 4: Four-note chords and complex patterns
  else if (level === 4) {
    while (time < songDuration) {
      const pattern = Math.random();
      
      if (pattern < 0.2) {
        // Four-note chord
        for (let i = 0; i < 4; i++) {
          chart.push({ time, lane: i, type: 'tap' });
        }
        time += beatInterval;
      } else if (pattern < 0.5) {
        // Rapid stream
        for (let i = 0; i < 4; i++) {
          const lane = Math.floor(Math.random() * 4);
          chart.push({ time: time + i * (beatInterval * 0.25), lane, type: 'tap' });
        }
        time += beatInterval * 1.5;
      } else {
        // Mixed
        const numNotes = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < numNotes; i++) {
          const lane = Math.floor(Math.random() * 4);
          chart.push({ time, lane, type: 'tap' });
        }
        time += beatInterval * 0.5;
      }
      
      // Complex hold notes
      if (Math.random() < 0.15) {
        const holdLane = Math.floor(Math.random() * 4);
        chart.push({ time, lane: holdLane, type: 'hold', duration: beatInterval * 4 });
        // Add taps during hold
        for (let i = 0; i < 3; i++) {
          const tapLane = (holdLane + 1 + Math.floor(Math.random() * 3)) % 4;
          chart.push({ time: time + i * beatInterval, lane: tapLane, type: 'tap' });
        }
        time += beatInterval * 4.5;
      }
    }
  }
  
  // Level 5: Maximum difficulty
  else {
    while (time < songDuration) {
      const pattern = Math.random();
      
      if (pattern < 0.3) {
        // Chord spam
        for (let j = 0; j < 3; j++) {
          const numNotes = Math.floor(Math.random() * 2) + 3;
          for (let i = 0; i < numNotes; i++) {
            const lane = Math.floor(Math.random() * 4);
            chart.push({ time: time + j * beatInterval * 0.5, lane, type: 'tap' });
          }
        }
        time += beatInterval * 2;
      } else if (pattern < 0.6) {
        // Ultra rapid stream
        for (let i = 0; i < 8; i++) {
          const lane = i % 4;
          chart.push({ time: time + i * (beatInterval * 0.2), lane, type: 'tap' });
        }
        time += beatInterval * 2;
      } else {
        // Complex holds with interference
        const holdLane = Math.floor(Math.random() * 4);
        chart.push({ time, lane: holdLane, type: 'hold', duration: beatInterval * 5 });
        for (let i = 0; i < 6; i++) {
          const tapLane = (holdLane + 1 + Math.floor(Math.random() * 3)) % 4;
          chart.push({ time: time + i * beatInterval * 0.5, lane: tapLane, type: 'tap' });
        }
        time += beatInterval * 5.5;
      }
    }
  }
  
  // Sort by time
  chart.sort((a, b) => a.time - b.time);
  
  return chart;
}