// story_data.js - Story content and branching narratives
export const CHAPTERS = [
  {
    chapter: 1,
    title: "The Silk Pavilion",
    scenes: [
      {
        text: "You arrive at the Imperial Palace as a newly selected concubine. The Empress Dowager watches you with calculating eyes.",
        background: "palace",
        choices: [
          {
            text: "Bow deeply and speak humbly",
            statChanges: { charm: 5, wisdom: 3 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Meet her gaze confidently",
            statChanges: { courage: 8, charm: -3 },
            outcome: "risky",
            nextScene: 1,
            requiresCourage: 40
          },
          {
            text: "Remain silent and observant",
            statChanges: { wisdom: 5 },
            outcome: "neutral",
            nextScene: 1
          }
        ]
      },
      {
        text: "The Dowager nods approvingly. 'You show promise. But the palace is treacherous...'",
        background: "palace",
        choices: [
          {
            text: "Thank her for the warning",
            statChanges: { wisdom: 4, charm: 2 },
            outcome: "chapter_complete",
            item: "Jade Hairpin"
          },
          {
            text: "Ask about palace politics",
            statChanges: { wisdom: 6 },
            outcome: "chapter_complete",
            hiddenStory: "The Three Factions"
          }
        ]
      }
    ]
  },
  {
    chapter: 2,
    title: "The Garden Conspiracy",
    scenes: [
      {
        text: "You overhear two consorts plotting in the moonlit garden. They speak of poison...",
        background: "garden",
        choices: [
          {
            text: "Confront them directly",
            statChanges: { courage: 10, charm: -5 },
            outcome: "death",
            deathMessage: "Your boldness was foolish. The conspirators silence you permanently."
          },
          {
            text: "Slip away and report to guards",
            statChanges: { wisdom: 7, courage: 3 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Pretend you heard nothing",
            statChanges: { wisdom: -5 },
            outcome: "neutral",
            nextScene: 1
          },
          {
            text: "Blackmail them for information",
            statChanges: { wisdom: 8, courage: 5, charm: -3 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 45
          }
        ]
      },
      {
        text: "The plot is foiled. The Emperor takes notice of your cleverness.",
        background: "garden",
        choices: [
          {
            text: "Accept his praise graciously",
            statChanges: { charm: 8, wisdom: 2 },
            outcome: "chapter_complete",
            item: "Golden Phoenix Ornament"
          },
          {
            text: "Request an audience to discuss security",
            statChanges: { wisdom: 7, courage: 4 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 3,
    title: "The Scholar's Riddle",
    scenes: [
      {
        text: "A visiting scholar challenges palace ladies to solve ancient riddles. Victory brings honor.",
        background: "hall",
        choices: [
          {
            text: "Decline politely - too risky",
            statChanges: { charm: 2, courage: -5 },
            outcome: "neutral",
            nextScene: 1
          },
          {
            text: "Accept the challenge",
            statChanges: { courage: 5 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 50
          },
          {
            text: "Suggest a different competition",
            statChanges: { wisdom: 6, charm: 4 },
            outcome: "success",
            nextScene: 1
          }
        ]
      },
      {
        text: "The scholar poses his riddle: 'What has roots nobody sees, taller than trees?'",
        background: "hall",
        choices: [
          {
            text: "Answer: A mountain",
            statChanges: { wisdom: 10, charm: 5 },
            outcome: "chapter_complete",
            item: "Ancient Poetry Scroll",
            hiddenStory: "The Scholar's Secret"
          },
          {
            text: "Answer: The heavens",
            statChanges: { wisdom: -8 },
            outcome: "death",
            deathMessage: "Your incorrect answer humiliates you. You are banished from the palace."
          },
          {
            text: "Answer: Imperial authority",
            statChanges: { charm: 5, wisdom: 2 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 4,
    title: "The Feast of Lanterns",
    scenes: [
      {
        text: "During the festival, the Emperor asks you to perform. All eyes are upon you.",
        background: "festival",
        choices: [
          {
            text: "Perform a traditional dance",
            statChanges: { charm: 10, courage: 5 },
            outcome: "success",
            nextScene: 1,
            requiresCharm: 55
          },
          {
            text: "Recite classical poetry",
            statChanges: { wisdom: 8, charm: 6 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Politely defer to another",
            statChanges: { courage: -8, charm: -5 },
            outcome: "death",
            deathMessage: "Your refusal offends the Emperor. You lose all favor and position."
          }
        ]
      },
      {
        text: "Your performance captivates the court. The Emperor's favor grows...",
        background: "festival",
        choices: [
          {
            text: "Thank him humbly",
            statChanges: { charm: 6 },
            outcome: "chapter_complete"
          },
          {
            text: "Request a private audience",
            statChanges: { courage: 7, charm: 5 },
            outcome: "chapter_complete",
            item: "Imperial Favor Token"
          }
        ]
      }
    ]
  },
  {
    chapter: 5,
    title: "Whispers of Betrayal",
    scenes: [
      {
        text: "You discover evidence that your closest ally may be a spy for a rival faction.",
        background: "chamber",
        choices: [
          {
            text: "Confront your ally directly",
            statChanges: { courage: 8, wisdom: -4 },
            outcome: "death",
            deathMessage: "Your ally was indeed a spy. They eliminate you before you can expose them."
          },
          {
            text: "Set a trap to confirm suspicions",
            statChanges: { wisdom: 10, courage: 5 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 60
          },
          {
            text: "Feed them false information",
            statChanges: { wisdom: 12, charm: 3 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Ignore the evidence",
            statChanges: { wisdom: -10, courage: -5 },
            outcome: "neutral",
            nextScene: 1
          }
        ]
      },
      {
        text: "Your suspicions were correct. The spy is exposed and you gain powerful allies.",
        background: "chamber",
        choices: [
          {
            text: "Show mercy and exile the traitor",
            statChanges: { charm: 8, wisdom: 4 },
            outcome: "chapter_complete",
            hiddenStory: "The Spymaster's Network"
          },
          {
            text: "Demand harsh punishment",
            statChanges: { courage: 10, charm: -6 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 6,
    title: "The Emperor's Illness",
    scenes: [
      {
        text: "The Emperor falls gravely ill. The imperial physician seeks rare herbs. You know where they grow.",
        background: "palace",
        choices: [
          {
            text: "Volunteer to retrieve the herbs yourself",
            statChanges: { courage: 12, charm: 5 },
            outcome: "success",
            nextScene: 1,
            requiresCourage: 60
          },
          {
            text: "Send trusted servants instead",
            statChanges: { wisdom: 7, courage: -4 },
            outcome: "death",
            deathMessage: "Your servants are ambushed. The Emperor dies. You are blamed."
          },
          {
            text: "Suggest alternative medicine",
            statChanges: { wisdom: 10, charm: 4 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 65
          }
        ]
      },
      {
        text: "The Emperor recovers thanks to your actions. His gratitude knows no bounds.",
        background: "palace",
        choices: [
          {
            text: "Request elevation to Noble Consort",
            statChanges: { courage: 10, charm: 8 },
            outcome: "chapter_complete",
            item: "Noble Consort Seal"
          },
          {
            text: "Ask for nothing, showing virtue",
            statChanges: { charm: 12, wisdom: 6 },
            outcome: "chapter_complete",
            hiddenStory: "The Emperor's Trust"
          }
        ]
      }
    ]
  },
  {
    chapter: 7,
    title: "The Border Crisis",
    scenes: [
      {
        text: "Northern barbarians threaten the border. The Emperor seeks counsel on military strategy.",
        background: "throne",
        choices: [
          {
            text: "Advocate for defensive fortifications",
            statChanges: { wisdom: 10, courage: 5 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Suggest diplomatic negotiations",
            statChanges: { wisdom: 12, charm: 8 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 70
          },
          {
            text: "Remain silent on military matters",
            statChanges: { courage: -10, charm: -8 },
            outcome: "death",
            deathMessage: "Your silence is seen as weakness. You lose all influence at court."
          },
          {
            text: "Propose aggressive counterattack",
            statChanges: { courage: 15, wisdom: -5 },
            outcome: "neutral",
            nextScene: 1
          }
        ]
      },
      {
        text: "Your strategy succeeds. The border is secured and you are hailed as wise advisor.",
        background: "throne",
        choices: [
          {
            text: "Accept the title of Imperial Advisor",
            statChanges: { wisdom: 10, courage: 8 },
            outcome: "chapter_complete",
            item: "Jade Strategy Tablet"
          },
          {
            text: "Deflect credit to the generals",
            statChanges: { charm: 10, wisdom: 5 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 8,
    title: "The Succession Question",
    scenes: [
      {
        text: "The Emperor has no heir. Factions form around potential successors. You must choose sides.",
        background: "palace",
        choices: [
          {
            text: "Support the Emperor's nephew",
            statChanges: { wisdom: 8, courage: 6 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Back the military general",
            statChanges: { courage: 12, charm: -5 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Remain neutral and observe",
            statChanges: { wisdom: 15, courage: 10 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 75
          },
          {
            text: "Suggest yourself as regent",
            statChanges: { courage: 20, charm: -10 },
            outcome: "death",
            deathMessage: "Your audacity is seen as treason. You are executed for ambition."
          }
        ]
      },
      {
        text: "Your political acumen impresses the court. Your influence continues to grow.",
        background: "palace",
        choices: [
          {
            text: "Consolidate your power base",
            statChanges: { wisdom: 12, courage: 8 },
            outcome: "chapter_complete",
            hiddenStory: "The Power Behind the Throne"
          },
          {
            text: "Focus on winning hearts",
            statChanges: { charm: 15, wisdom: 5 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 9,
    title: "The Poisoned Cup",
    scenes: [
      {
        text: "At a royal banquet, you notice your wine cup has a strange odor. Someone wants you dead.",
        background: "hall",
        choices: [
          {
            text: "Drink it to avoid suspicion",
            statChanges: { courage: 10 },
            outcome: "death",
            deathMessage: "The poison works quickly. You die at the banquet table."
          },
          {
            text: "Pretend to drink, spill discreetly",
            statChanges: { wisdom: 15, courage: 8 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 80
          },
          {
            text: "Dramatically accuse the servants",
            statChanges: { courage: 12, charm: -8 },
            outcome: "neutral",
            nextScene: 1
          },
          {
            text: "Switch cups with neighbor",
            statChanges: { wisdom: -15, charm: -20 },
            outcome: "death",
            deathMessage: "Your callousness is discovered. You are executed for attempted murder."
          }
        ]
      },
      {
        text: "You survive the assassination attempt and identify the culprit.",
        background: "hall",
        choices: [
          {
            text: "Publicly expose the assassin",
            statChanges: { courage: 15, charm: 10 },
            outcome: "chapter_complete",
            item: "Silver Poison Detector"
          },
          {
            text: "Use the knowledge as leverage",
            statChanges: { wisdom: 18, courage: 8 },
            outcome: "chapter_complete",
            hiddenStory: "The Assassin's Guild"
          }
        ]
      }
    ]
  },
  {
    chapter: 10,
    title: "The Forbidden Archive",
    scenes: [
      {
        text: "You discover a secret passage to forbidden imperial archives. Ancient secrets await.",
        background: "archive",
        choices: [
          {
            text: "Enter alone at night",
            statChanges: { courage: 15, wisdom: 8 },
            outcome: "success",
            nextScene: 1,
            requiresCourage: 75
          },
          {
            text: "Bring a trusted confidant",
            statChanges: { wisdom: 12, courage: 8 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Report the discovery",
            statChanges: { charm: 5, wisdom: -10 },
            outcome: "death",
            deathMessage: "The archives' keeper ensures you never speak of what you found."
          }
        ]
      },
      {
        text: "You uncover proof of the dynasty's true founding - knowledge that could change everything.",
        background: "archive",
        choices: [
          {
            text: "Keep the secret to yourself",
            statChanges: { wisdom: 20, courage: 10 },
            outcome: "chapter_complete",
            item: "Ancient Dynasty Scroll",
            hiddenStory: "The True Emperor"
          },
          {
            text: "Share with the Emperor privately",
            statChanges: { charm: 15, wisdom: 12 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 11,
    title: "The Empress Dowager's Test",
    scenes: [
      {
        text: "The Empress Dowager summons you. She offers a deadly game: pass her test or die.",
        background: "chamber",
        choices: [
          {
            text: "Accept with courage",
            statChanges: { courage: 20 },
            outcome: "success",
            nextScene: 1,
            requiresCourage: 80
          },
          {
            text: "Request details of the test",
            statChanges: { wisdom: 15, courage: 8 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Refuse and flee",
            statChanges: { courage: -20, wisdom: -15 },
            outcome: "death",
            deathMessage: "You cannot escape the Dowager's reach. Guards end your flight."
          }
        ]
      },
      {
        text: "The test: Outsmart three court officials in debate while poisoned, with antidote as prize.",
        background: "chamber",
        choices: [
          {
            text: "Use wisdom and rhetoric",
            statChanges: { wisdom: 25, charm: 15 },
            outcome: "chapter_complete",
            item: "Dowager's Ring",
            requiresWisdom: 85
          },
          {
            text: "Appeal to tradition and law",
            statChanges: { wisdom: 20, charm: 12 },
            outcome: "chapter_complete"
          },
          {
            text: "Attack their character",
            statChanges: { courage: 10, charm: -15 },
            outcome: "death",
            deathMessage: "The poison takes hold as you fail the test. The Dowager watches you die."
          }
        ]
      }
    ]
  },
  {
    chapter: 12,
    title: "The Rebel Prince",
    scenes: [
      {
        text: "A charismatic prince arrives, claiming the throne is his by right. Civil war looms.",
        background: "palace",
        choices: [
          {
            text: "Stay loyal to the current Emperor",
            statChanges: { courage: 15, charm: 10 },
            outcome: "success",
            nextScene: 1
          },
          {
            text: "Join the rebel prince",
            statChanges: { courage: 20, wisdom: -10 },
            outcome: "death",
            deathMessage: "The rebellion fails. You are executed as a traitor."
          },
          {
            text: "Play both sides carefully",
            statChanges: { wisdom: 25, courage: 12 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 90
          },
          {
            text: "Attempt to mediate peace",
            statChanges: { charm: 20, wisdom: 15 },
            outcome: "success",
            nextScene: 1,
            requiresCharm: 85
          }
        ]
      },
      {
        text: "Your actions prevent bloodshed. Both princes recognize your wisdom and power.",
        background: "palace",
        choices: [
          {
            text: "Demand position as Grand Chancellor",
            statChanges: { courage: 20, wisdom: 15 },
            outcome: "chapter_complete",
            item: "Chancellor's Seal"
          },
          {
            text: "Suggest power-sharing compromise",
            statChanges: { wisdom: 20, charm: 18 },
            outcome: "chapter_complete",
            hiddenStory: "The Dual Throne"
          }
        ]
      }
    ]
  },
  {
    chapter: 13,
    title: "The Plague of Heaven",
    scenes: [
      {
        text: "A terrible plague strikes the capital. The people look to you for leadership.",
        background: "city",
        choices: [
          {
            text: "Organize medical care and quarantine",
            statChanges: { wisdom: 20, courage: 15 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 95
          },
          {
            text: "Flee to safety in the countryside",
            statChanges: { courage: -30, charm: -25 },
            outcome: "death",
            deathMessage: "Your cowardice is remembered. You are overthrown and executed."
          },
          {
            text: "Personally tend to the sick",
            statChanges: { charm: 25, courage: 20 },
            outcome: "success",
            nextScene: 1,
            requiresCourage: 90
          },
          {
            text: "Seek divine intervention through ritual",
            statChanges: { charm: 15, wisdom: 10 },
            outcome: "neutral",
            nextScene: 1
          }
        ]
      },
      {
        text: "The plague subsides. The people now see you as their savior and true leader.",
        background: "city",
        choices: [
          {
            text: "Accept their devotion graciously",
            statChanges: { charm: 20, courage: 15 },
            outcome: "chapter_complete",
            item: "People's Mandate"
          },
          {
            text: "Credit the gods and physicians",
            statChanges: { wisdom: 18, charm: 22 },
            outcome: "chapter_complete",
            hiddenStory: "The Healer Empress"
          }
        ]
      }
    ]
  },
  {
    chapter: 14,
    title: "The Dragon Throne",
    scenes: [
      {
        text: "The Emperor lies dying. His final words: he wishes you to succeed him as sovereign.",
        background: "throne",
        choices: [
          {
            text: "Accept with humility and grace",
            statChanges: { charm: 25, wisdom: 20 },
            outcome: "success",
            nextScene: 1,
            requiresCharm: 90
          },
          {
            text: "Refuse, citing tradition",
            statChanges: { wisdom: 15, courage: -20 },
            outcome: "death",
            deathMessage: "Factions tear the empire apart in your absence. You are assassinated in the chaos."
          },
          {
            text: "Seize power immediately",
            statChanges: { courage: 30, charm: -15 },
            outcome: "success",
            nextScene: 1,
            requiresCourage: 95
          }
        ]
      },
      {
        text: "You ascend the Dragon Throne. But coronation requires the approval of three Grand Ministers.",
        background: "throne",
        choices: [
          {
            text: "Convince them through wisdom",
            statChanges: { wisdom: 25, charm: 20 },
            outcome: "chapter_complete",
            requiresWisdom: 100
          },
          {
            text: "Intimidate them with power",
            statChanges: { courage: 25, charm: -10 },
            outcome: "chapter_complete",
            requiresCourage: 100
          },
          {
            text: "Win their hearts with virtue",
            statChanges: { charm: 30, wisdom: 15 },
            outcome: "chapter_complete",
            requiresCharm: 100
          },
          {
            text: "Replace them with loyalists",
            statChanges: { courage: 20, wisdom: -15 },
            outcome: "death",
            deathMessage: "Your purge sparks a coup. You are overthrown before coronation."
          }
        ]
      }
    ]
  },
  {
    chapter: 15,
    title: "The Final Opposition",
    scenes: [
      {
        text: "On coronation eve, your greatest rival makes their move. An army marches on the palace.",
        background: "palace",
        choices: [
          {
            text: "Lead your forces personally",
            statChanges: { courage: 30, charm: 20 },
            outcome: "success",
            nextScene: 1,
            requiresCourage: 105
          },
          {
            text: "Outmaneuver them strategically",
            statChanges: { wisdom: 30, courage: 15 },
            outcome: "success",
            nextScene: 1,
            requiresWisdom: 105
          },
          {
            text: "Negotiate from position of strength",
            statChanges: { charm: 25, wisdom: 20 },
            outcome: "success",
            nextScene: 1,
            requiresCharm: 105
          },
          {
            text: "Surrender to avoid bloodshed",
            statChanges: { courage: -40 },
            outcome: "death",
            deathMessage: "Your surrender is rejected. You are imprisoned and executed as weak."
          }
        ]
      },
      {
        text: "Victory is yours. The last threat to your rule is eliminated. The empire awaits its Empress.",
        background: "palace",
        choices: [
          {
            text: "Show mercy to defeated enemies",
            statChanges: { charm: 30, wisdom: 25 },
            outcome: "chapter_complete",
            hiddenStory: "The Merciful Empress"
          },
          {
            text: "Execute them as warning to others",
            statChanges: { courage: 25, charm: -20 },
            outcome: "chapter_complete"
          }
        ]
      }
    ]
  },
  {
    chapter: 16,
    title: "Coronation of the Empress",
    scenes: [
      {
        text: "The sacred ceremony begins. The crown is presented. Your final choice defines your reign.",
        background: "throne",
        choices: [
          {
            text: "Vow to rule with wisdom and justice",
            statChanges: { wisdom: 50, charm: 30, courage: 20 },
            outcome: "win",
            requiresWisdom: 110,
            requiresCharm: 100,
            requiresCourage: 100
          },
          {
            text: "Promise strength and glory",
            statChanges: { courage: 50, wisdom: 20, charm: 20 },
            outcome: "win",
            requiresCourage: 110,
            requiresWisdom: 100,
            requiresCharm: 100
          },
          {
            text: "Declare an era of prosperity",
            statChanges: { charm: 50, wisdom: 30, courage: 20 },
            outcome: "win",
            requiresCharm: 110,
            requiresWisdom: 100,
            requiresCourage: 100
          },
          {
            text: "Abdicate in favor of council rule",
            statChanges: {},
            outcome: "death",
            deathMessage: "You came so far only to surrender power. History forgets you."
          }
        ]
      }
    ]
  }
];

export function getChapterData(chapterNum) {
  return CHAPTERS.find(c => c.chapter === chapterNum) || CHAPTERS[0];
}

export function getSceneData(chapterNum, sceneNum) {
  const chapter = getChapterData(chapterNum);
  return chapter.scenes[sceneNum] || chapter.scenes[0];
}