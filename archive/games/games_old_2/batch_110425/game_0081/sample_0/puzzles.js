// puzzles.js - Puzzle definitions and logic

export class Puzzle {
  constructor(id, type, difficulty, question, answer, hints, mandatory = false) {
    this.id = id;
    this.type = type; // "math", "logic", "pattern", "riddle"
    this.difficulty = difficulty; // 1-3
    this.question = question;
    this.answer = answer;
    this.hints = hints; // Array of 3 hints
    this.mandatory = mandatory;
    this.attempts = 0;
  }

  checkAnswer(input) {
    return input.toString().toLowerCase() === this.answer.toString().toLowerCase();
  }
}

export function createPuzzles(p) {
  return [
    // Area 0 - Tutorial puzzles
    new Puzzle(
      0,
      "math",
      1,
      "A train departs at 3:15 PM and\narrives at 5:45 PM.\nHow many minutes did it travel?",
      "150",
      [
        "Calculate the difference\nbetween the two times.",
        "From 3:15 to 5:15 is 2 hours.\nThen add 30 more minutes.",
        "2 hours = 120 minutes.\n120 + 30 = 150 minutes."
      ],
      true
    ),
    new Puzzle(
      1,
      "logic",
      1,
      "If all Bloops are Razzies and\nall Razzies are Lazzies,\nare all Bloops Lazzies?\nAnswer: YES or NO",
      "yes",
      [
        "Think about the relationship\nbetween the three groups.",
        "If A equals B and B equals C,\nthen A must equal C.",
        "Bloops -> Razzies -> Lazzies\nSo Bloops are Lazzies."
      ],
      true
    ),
    
    // Area 1 - Intermediate puzzles
    new Puzzle(
      2,
      "pattern",
      2,
      "Find the next number:\n2, 4, 8, 16, ?",
      "32",
      [
        "Look at how each number\nrelates to the previous one.",
        "Each number is double\nthe previous number.",
        "16 × 2 = 32"
      ],
      true
    ),
    new Puzzle(
      3,
      "riddle",
      2,
      "I have cities but no houses,\nforests but no trees,\nwater but no fish.\nWhat am I?",
      "map",
      [
        "Think about something that\nrepresents places but isn't\nthe place itself.",
        "It shows locations in\na flat, visual way.",
        "The answer is: MAP"
      ],
      false
    ),
    
    // Area 2 - Advanced puzzles
    new Puzzle(
      4,
      "logic",
      3,
      "Three switches control three\nlights in another room.\nYou can flip switches but\nonly check lights once.\nHow many switches do you\nneed to flip? Answer: 1, 2, or 3",
      "2",
      [
        "You need a strategy that\ngives unique information\nfrom each switch.",
        "Flipping 2 switches lets you\nidentify which is which by\nprocess of elimination.",
        "Flip 2, wait, turn 1 off.\nCheck: ON=second, WARM=first,\nOFF=unflipped. Answer: 2"
      ],
      true
    ),
    new Puzzle(
      5,
      "math",
      3,
      "A snail climbs a 10m wall.\nIt climbs 3m by day,\nslips 2m at night.\nHow many days to reach top?",
      "8",
      [
        "Don't forget the snail\nreaches the top during\na climbing phase.",
        "Each full day-night cycle\ngains 1m net. But on day 8,\nit reaches 10m before slipping.",
        "Day 7 ends at 7m.\nDay 8 climbs 3m to 10m.\nAnswer: 8 days"
      ],
      true
    )
  ];
}