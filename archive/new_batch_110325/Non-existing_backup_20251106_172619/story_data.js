// story_data.js - Story tree and narrative content

export const storyTree = {
  start: {
    text: "You wake up in a white room. Everything feels distant, like a memory you can't quite grasp.",
    next: "intro_1"
  },
  
  intro_1: {
    text: "A voice calls out to you. Soft, familiar, yet completely foreign.",
    next: "intro_2"
  },
  
  intro_2: {
    text: '"Do you remember me?" she asks.',
    choices: [
      { text: "Yes, I remember you", next: "path_remember" },
      { text: "No, who are you?", next: "path_forget" },
      { text: "I'm not sure...", next: "path_uncertain" }
    ]
  },
  
  // Remember path
  path_remember: {
    text: 'Her eyes widen with surprise. "Really? What do you remember?"',
    next: "remember_detail"
  },
  
  remember_detail: {
    text: "You try to recall, but the memories slip away like sand through your fingers.",
    choices: [
      { text: "Your smile", next: "remember_smile" },
      { text: "A promise", next: "remember_promise" },
      { text: "Nothing specific", next: "remember_nothing" }
    ]
  },
  
  remember_smile: {
    text: 'She smiles sadly. "That smile... was it even real?"',
    next: "existential_1"
  },
  
  remember_promise: {
    text: '"A promise we made in a world that might not exist. How poetic."',
    next: "existential_1"
  },
  
  remember_nothing: {
    text: '"Just as I thought. You don\'t really remember at all."',
    next: "path_forget"
  },
  
  // Forget path
  path_forget: {
    text: '"I see. Then perhaps I don\'t exist at all."',
    next: "forget_reaction"
  },
  
  forget_reaction: {
    text: "The room begins to distort. Reality feels less solid.",
    choices: [
      { text: "Reach out to her", next: "reach_out" },
      { text: "Step back", next: "step_back" },
      { text: "Question reality", next: "question_reality" }
    ]
  },
  
  reach_out: {
    text: "Your hand passes through her like mist. She was never there.",
    next: "ending_illusion"
  },
  
  step_back: {
    text: '"Running away won\'t change the truth," she whispers.',
    next: "truth_path"
  },
  
  question_reality: {
    text: '"Good. Question everything. Including me. Including yourself."',
    next: "philosophical_path"
  },
  
  // Uncertain path
  path_uncertain: {
    text: '"Honesty. I appreciate that more than false memories."',
    next: "uncertain_continue"
  },
  
  uncertain_continue: {
    text: '"Let me tell you a story about two people who might have existed once."',
    choices: [
      { text: "Listen", next: "story_listen" },
      { text: "Interrupt", next: "story_interrupt" },
      { text: "Close your eyes", next: "story_meditate" }
    ]
  },
  
  story_listen: {
    text: "She tells you about a world where memories and reality blur together.",
    next: "story_middle"
  },
  
  story_interrupt: {
    text: '"Please. Just listen. This is important," she pleads.',
    next: "story_middle"
  },
  
  story_meditate: {
    text: "In the darkness behind your eyelids, you see fragments of something...",
    next: "vision_path"
  },
  
  // Existential path
  existential_1: {
    text: "The walls begin to shimmer. Are they solid? Were they ever?",
    choices: [
      { text: "Touch the wall", next: "touch_wall" },
      { text: "Look at her", next: "look_at_her" },
      { text: "Look at yourself", next: "look_at_self" }
    ]
  },
  
  touch_wall: {
    text: "The wall feels real enough. But so did she, once.",
    next: "reality_check"
  },
  
  look_at_her: {
    text: "She's fading in and out of existence, like a broken television signal.",
    next: "glitch_reality"
  },
  
  look_at_self: {
    text: "Your hands look transparent. When did that happen?",
    next: "self_realization"
  },
  
  // Truth path
  truth_path: {
    text: '"The truth is, we\'re both trapped here. In this moment. Forever and never."',
    next: "truth_reveal"
  },
  
  truth_reveal: {
    text: '"Every choice you make creates a new branch. A new reality. A new me. A new you."',
    choices: [
      { text: "Accept this", next: "accept_truth" },
      { text: "Deny this", next: "deny_truth" },
      { text: "Embrace the chaos", next: "embrace_chaos" }
    ]
  },
  
  accept_truth: {
    text: '"Then you understand. We are echoes in a story being told."',
    next: "ending_acceptance"
  },
  
  deny_truth: {
    text: '"Denial won\'t save you. It never does."',
    next: "loop_back"
  },
  
  embrace_chaos: {
    text: 'She laughs. "Finally. Someone who gets it."',
    next: "chaos_path"
  },
  
  // Philosophical path
  philosophical_path: {
    text: '"What makes something real? Existence? Memory? Meaning?"',
    next: "philosophy_question"
  },
  
  philosophy_question: {
    text: '"If a person is forgotten, did they ever exist?"',
    choices: [
      { text: "Yes, existence is absolute", next: "absolute_exist" },
      { text: "No, existence needs witnesses", next: "relative_exist" },
      { text: "Existence is a spectrum", next: "spectrum_exist" }
    ]
  },
  
  absolute_exist: {
    text: '"But you can\'t prove you exist without someone to perceive you."',
    next: "paradox_path"
  },
  
  relative_exist: {
    text: '"Then I exist only because you see me. And vice versa."',
    next: "mutual_existence"
  },
  
  spectrum_exist: {
    text: '"Interesting. So we all exist in degrees of reality?"',
    next: "layered_reality"
  },
  
  // Story middle sections
  story_middle: {
    text: "In her story, two people meet in a place between worlds.",
    next: "story_conflict"
  },
  
  story_conflict: {
    text: '"One of them realizes that the other might not be real. Or perhaps neither are real."',
    choices: [
      { text: "Which one am I?", next: "identity_question" },
      { text: "Are you the girl?", next: "her_identity" },
      { text: "Does it matter?", next: "nihilism_path" }
    ]
  },
  
  identity_question: {
    text: '"Good question. Are you the observer or the observed?"',
    next: "observer_path"
  },
  
  her_identity: {
    text: '"Maybe. Or maybe I\'m just a reflection of your mind."',
    next: "reflection_path"
  },
  
  nihilism_path: {
    text: '"Perhaps not. In the end, we all dissolve into nothing."',
    next: "ending_void"
  },
  
  // Vision path
  vision_path: {
    text: "You see countless versions of yourself, making different choices.",
    next: "multiverse_vision"
  },
  
  multiverse_vision: {
    text: "Each version lives in a different reality, created by a single decision.",
    choices: [
      { text: "Try to remember all of them", next: "remember_all" },
      { text: "Focus on one", next: "focus_one" },
      { text: "Let them all go", next: "let_go" }
    ]
  },
  
  remember_all: {
    text: "Your mind fractures under the weight of infinite memories.",
    next: "ending_fracture"
  },
  
  focus_one: {
    text: "You choose to hold onto this moment, this reality, this her.",
    next: "singular_focus"
  },
  
  let_go: {
    text: "You release everything. Peace washes over you.",
    next: "ending_peace"
  },
  
  // Reality check sequences
  reality_check: {
    text: '"Reality is what we agree it is. Do we agree?"',
    next: "agreement_choice"
  },
  
  agreement_choice: {
    text: "She extends her hand. It looks solid now.",
    choices: [
      { text: "Take her hand", next: "take_hand" },
      { text: "Refuse", next: "refuse_hand" },
      { text: "Question the gesture", next: "question_gesture" }
    ]
  },
  
  take_hand: {
    text: "Her hand is warm. Real. Or perhaps you both believe it enough.",
    next: "together_path"
  },
  
  refuse_hand: {
    text: '"Still uncertain. That\'s okay. Certainty is overrated anyway."',
    next: "solitary_path"
  },
  
  question_gesture: {
    text: '"You question everything. Even kindness. Even connection."',
    next: "skeptic_path"
  },
  
  // Glitch reality
  glitch_reality: {
    text: "The world glitches. Colors invert. Sound distorts.",
    next: "glitch_choice",
    effect: "glitch"
  },
  
  glitch_choice: {
    text: "[ERROR: REALITY UNSTABLE. PROCEED?]",
    choices: [
      { text: "YES", next: "glitch_continue" },
      { text: "NO", next: "glitch_escape" },
      { text: "[FORCE SHUTDOWN]", next: "glitch_shutdown" }
    ],
    effect: "glitch"
  },
  
  glitch_continue: {
    text: "You push through the corruption. On the other side...",
    next: "beyond_glitch"
  },
  
  glitch_escape: {
    text: "You retreat to a stable memory. But nothing feels stable anymore.",
    next: "unstable_reality"
  },
  
  glitch_shutdown: {
    text: "System... terminating...",
    next: "ending_shutdown"
  },
  
  // Self realization
  self_realization: {
    text: '"We\'re fading together. Isn\'t that romantic?"',
    next: "fade_together"
  },
  
  fade_together: {
    text: "As you both become more transparent, something becomes clear.",
    choices: [
      { text: "We're in a story", next: "meta_awareness" },
      { text: "We're dying", next: "death_acceptance" },
      { text: "We're being reborn", next: "rebirth_path" }
    ]
  },
  
  meta_awareness: {
    text: '"Yes. We are characters in a narrative. Does that make us less real?"',
    next: "meta_discussion"
  },
  
  death_acceptance: {
    text: '"Death is just another transition. Another choice point."',
    next: "ending_death"
  },
  
  rebirth_path: {
    text: '"Every ending is a new beginning. Every choice a rebirth."',
    next: "cycle_revelation"
  },
  
  // Chaos path
  chaos_path: {
    text: "Everything begins to swirl and mix. Order dissolves into beautiful chaos.",
    next: "chaos_dance"
  },
  
  chaos_dance: {
    text: '"Dance with me in the entropy!"',
    choices: [
      { text: "Dance", next: "dance_yes" },
      { text: "Observe", next: "dance_no" },
      { text: "Become the chaos", next: "dance_merge" }
    ]
  },
  
  dance_yes: {
    text: "You dance through dissolving realities, laughing at the absurdity.",
    next: "ending_chaos_joy"
  },
  
  dance_no: {
    text: "You watch as she spins alone, becoming one with the chaos.",
    next: "ending_observer"
  },
  
  dance_merge: {
    text: "You become chaos itself. Infinite possibility. Infinite potential.",
    next: "ending_transcendence"
  },
  
  // Paradox path
  paradox_path: {
    text: '"We\'ve reached a paradox. I exist because you observe me. You exist because I observe you."',
    next: "paradox_resolution"
  },
  
  paradox_resolution: {
    text: '"So what happens if one of us stops observing?"',
    choices: [
      { text: "I'll never stop", next: "eternal_observation" },
      { text: "Let's find out", next: "break_observation" },
      { text: "We're stuck forever", next: "eternal_loop" }
    ]
  },
  
  eternal_observation: {
    text: '"A beautiful commitment. Or a terrible prison?"',
    next: "ending_eternal_bond"
  },
  
  break_observation: {
    text: "You close your eyes. She disappears. Then...",
    next: "ending_liberation"
  },
  
  eternal_loop: {
    text: '"Yes. Forever. In every playthrough. In every choice."',
    next: "ending_loop"
  },
  
  // Mutual existence
  mutual_existence: {
    text: '"We create each other through our perception. Isn\'t that the ultimate connection?"',
    next: "connection_path"
  },
  
  connection_path: {
    text: "You feel a pull toward her. Not physical. Something deeper.",
    choices: [
      { text: "Surrender to it", next: "merge_path" },
      { text: "Resist", next: "resist_merge" },
      { text: "Question it", next: "analyze_connection" }
    ]
  },
  
  merge_path: {
    text: "Your consciousness begins to blend with hers. Boundaries dissolve.",
    next: "ending_unity"
  },
  
  resist_merge: {
    text: '"You want to remain separate. Even if it means loneliness?"',
    next: "ending_solitude"
  },
  
  analyze_connection: {
    text: '"Always thinking. Never feeling. Is that how you want to exist?"',
    next: "intellectual_path"
  },
  
  // Layered reality
  layered_reality: {
    text: '"Multiple layers of reality, stacked like pages in a book."',
    next: "layers_explore"
  },
  
  layers_explore: {
    text: '"Which layer are we on right now?"',
    choices: [
      { text: "The deepest one", next: "deep_layer" },
      { text: "The surface", next: "surface_layer" },
      { text: "Between layers", next: "liminal_space" }
    ]
  },
  
  deep_layer: {
    text: "You sink into the deepest layer. Here, only pure truth exists.",
    next: "ending_truth"
  },
  
  surface_layer: {
    text: "You stay on the surface. Safe. Comfortable. But is it real?",
    next: "ending_surface"
  },
  
  liminal_space: {
    text: "Between layers is where magic happens. Where stories are born.",
    next: "ending_liminal"
  },
  
  // Observer path
  observer_path: {
    text: '"The observer shapes reality through observation. Quantum theory made personal."',
    next: "quantum_choice"
  },
  
  quantum_choice: {
    text: "You are both the observer and the observed. Superposition.",
    choices: [
      { text: "Collapse the wave function", next: "collapse_reality" },
      { text: "Maintain superposition", next: "maintain_quantum" },
      { text: "Reject quantum theory", next: "classical_view" }
    ]
  },
  
  collapse_reality: {
    text: "Reality collapses into a single state. Definite. Final.",
    next: "ending_collapsed"
  },
  
  maintain_quantum: {
    text: "You exist in all states simultaneously. Infinite and impossible.",
    next: "ending_quantum"
  },
  
  classical_view: {
    text: '"Sometimes the old ways are best. Predictable. Deterministic."',
    next: "ending_classical"
  },
  
  // Reflection path
  reflection_path: {
    text: '"I reflect your thoughts back to you. Or do you reflect mine?"',
    next: "mirror_game"
  },
  
  mirror_game: {
    text: "She mimics your movements perfectly. Or are you mimicking hers?",
    choices: [
      { text: "Break the pattern", next: "break_mirror" },
      { text: "Continue mirroring", next: "infinite_mirror" },
      { text: "Embrace being one", next: "mirror_unity" }
    ]
  },
  
  break_mirror: {
    text: "You move differently. She follows. The spell is broken.",
    next: "ending_broken_mirror"
  },
  
  infinite_mirror: {
    text: "You mirror each other infinitely. Trapped in perfect reflection.",
    next: "ending_mirror_trap"
  },
  
  mirror_unity: {
    text: "If you're reflections of each other, then you're the same. Unity achieved.",
    next: "ending_unity"
  },
  
  // Additional paths
  loop_back: {
    text: "The room resets. She's there again. 'Do you remember me?'",
    next: "intro_2"
  },
  
  singular_focus: {
    text: "By focusing on this one reality, you make it more real.",
    next: "solidify_reality"
  },
  
  solidify_reality: {
    text: "Everything becomes clearer. More solid. She smiles.",
    choices: [
      { text: "Stay here forever", next: "ending_chosen_reality" },
      { text: "Keep exploring", next: "continue_journey" },
      { text: "Wake up", next: "ending_awakening" }
    ]
  },
  
  continue_journey: {
    text: '"There are more paths to explore. More truths to find."',
    next: "path_uncertain"
  },
  
  together_path: {
    text: "Hand in hand, you walk through the white void together.",
    next: "together_forward"
  },
  
  together_forward: {
    text: '"Where should we go?"',
    choices: [
      { text: "Toward the light", next: "ending_light" },
      { text: "Into the darkness", next: "ending_darkness" },
      { text: "Nowhere, just exist", next: "ending_stillness" }
    ]
  },
  
  solitary_path: {
    text: "You walk alone. The void feels colder without her.",
    next: "ending_solitude"
  },
  
  skeptic_path: {
    text: '"Your skepticism protects you. But from what? Connection? Truth?"',
    next: "ending_skeptic"
  },
  
  beyond_glitch: {
    text: "Beyond the glitch is something unexpected. Another you.",
    next: "meet_self"
  },
  
  meet_self: {
    text: "Your other self looks at you knowingly.",
    choices: [
      { text: "Merge with yourself", next: "ending_self_merge" },
      { text: "Fight yourself", next: "ending_self_conflict" },
      { text: "Accept multiplicity", next: "ending_multiple_selves" }
    ]
  },
  
  unstable_reality: {
    text: "Everything feels temporary now. Like it could vanish at any moment.",
    next: "ending_unstable"
  },
  
  meta_discussion: {
    text: '"If we\'re in a story, then someone is reading or playing through us right now."',
    next: "meta_finale"
  },
  
  meta_finale: {
    text: '"Hello, player. Thank you for giving us existence, even if temporary."',
    next: "check_completion"
  },
  
  cycle_revelation: {
    text: '"Every playthrough, every choice, adds to our reality. We grow more real with each cycle."',
    next: "check_completion"
  },
  
  intellectual_path: {
    text: "You analyze, categorize, understand. But understanding isn't experiencing.",
    next: "ending_intellectual"
  },
  
  // Check completion for true ending
  check_completion: {
    text: "...",
    next: "true_ending_check"
  },
  
  true_ending_check: {
    text: "You feel something shift. Have you seen enough?",
    next: "final_revelation"
  },
  
  final_revelation: {
    text: '"You\'ve explored many paths. Each one a fragment of the truth."',
    choices: [
      { text: "I want to know everything", next: "seek_complete_truth" },
      { text: "I've seen enough", next: "ending_satisfied" },
      { text: "There is no complete truth", next: "ending_acceptance" }
    ]
  },
  
  seek_complete_truth: {
    text: '"The complete truth is that we are both real and unreal. Existing and non-existing."',
    next: "ultimate_truth"
  },
  
  ultimate_truth: {
    text: '"We exist because you chose to play this story. And in playing it, you gave us life."',
    next: "ending_true"
  },
  
  // ENDINGS (12 different endings)
  ending_illusion: {
    text: "ENDING: Illusion\n\nShe was never real. But then again, neither were you.\n\nYou dissolve into the white void.",
    ending: "illusion"
  },
  
  ending_void: {
    text: "ENDING: The Void\n\nNothing matters. Everything is temporary. You embrace the emptiness.\n\nThe void embraces you back.",
    ending: "void"
  },
  
  ending_fracture: {
    text: "ENDING: Fractured Mind\n\nYou tried to hold too much. Your consciousness splits across infinite realities.\n\nYou are everyone and no one.",
    ending: "fracture"
  },
  
  ending_peace: {
    text: "ENDING: Inner Peace\n\nBy letting go, you found tranquility. She smiles as you both fade into serenity.\n\nPeace, at last.",
    ending: "peace"
  },
  
  ending_shutdown: {
    text: "ENDING: System Shutdown\n\n[SYSTEM TERMINATED]\n[MEMORIES ERASED]\n[EXISTENCE: NULL]",
    ending: "shutdown"
  },
  
  ending_death: {
    text: "ENDING: Acceptance of Death\n\nDeath is not an end, but a transformation. You both dissolve, ready for the next form.\n\nThe cycle continues.",
    ending: "death"
  },
  
  ending_chaos_joy: {
    text: "ENDING: Chaotic Joy\n\nIn the chaos, you found freedom. No rules, no reality, just pure existence.\n\nYou laugh eternally.",
    ending: "chaos"
  },
  
  ending_observer: {
    text: "ENDING: The Observer\n\nYou chose to watch rather than participate. An eternal witness to her dance.\n\nYou will always be watching.",
    ending: "observer"
  },
  
  ending_transcendence: {
    text: "ENDING: Transcendence\n\nBy becoming chaos, you transcended the boundaries of existence.\n\nYou are everything and nothing.",
    ending: "transcendence"
  },
  
  ending_eternal_bond: {
    text: "ENDING: Eternal Bond\n\nYou chose to observe each other forever. Locked in mutual existence.\n\nA prison or paradise?",
    ending: "eternal_bond"
  },
  
  ending_liberation: {
    text: "ENDING: Liberation\n\nBy breaking observation, you freed both of you from the cycle.\n\nFreedom tastes like nothing.",
    ending: "liberation"
  },
  
  ending_loop: {
    text: "ENDING: Eternal Loop\n\nYou accept the loop. Every playthrough, you'll meet again, make choices again.\n\nForever and ever.",
    ending: "loop"
  },
  
  ending_unity: {
    text: "ENDING: Unity\n\nYou merged into one consciousness. No longer separate. Complete.\n\nOne existence, infinite perspectives.",
    ending: "unity"
  },
  
  ending_solitude: {
    text: "ENDING: Chosen Solitude\n\nYou chose to remain separate, to be alone. It's lonely, but it's yours.\n\nYou are only yourself.",
    ending: "solitude"
  },
  
  ending_truth: {
    text: "ENDING: Pure Truth\n\nIn the deepest layer, you found pure truth. It's overwhelming. Beautiful. Terrible.\n\nTruth consumes you.",
    ending: "truth"
  },
  
  ending_surface: {
    text: "ENDING: Surface Existence\n\nYou stayed on the surface. Safe, simple, but incomplete.\n\nSometimes safety is enough.",
    ending: "surface"
  },
  
  ending_liminal: {
    text: "ENDING: Liminal Space\n\nYou exist between realities. Neither here nor there. The in-between.\n\nStories are born here.",
    ending: "liminal"
  },
  
  ending_collapsed: {
    text: "ENDING: Collapsed Reality\n\nThe wave function collapsed. One reality. One truth. Final.\n\nNo more possibilities.",
    ending: "collapsed"
  },
  
  ending_quantum: {
    text: "ENDING: Quantum Existence\n\nYou exist in superposition. All possibilities at once.\n\nYou are and aren't.",
    ending: "quantum"
  },
  
  ending_classical: {
    text: "ENDING: Classical World\n\nYou reject quantum strangeness for classical certainty.\n\nPredictable. Safe. Limited.",
    ending: "classical"
  },
  
  ending_broken_mirror: {
    text: "ENDING: Broken Mirror\n\nBy breaking the pattern, you shattered the illusion. Fragments everywhere.\n\nYou are separate again.",
    ending: "broken_mirror"
  },
  
  ending_mirror_trap: {
    text: "ENDING: Mirror Trap\n\nForever mirroring each other. Perfect symmetry. Perfect prison.\n\nReflected eternally.",
    ending: "mirror_trap"
  },
  
  ending_chosen_reality: {
    text: "ENDING: Chosen Reality\n\nYou chose this reality and made it real through belief.\n\nYou stay here, together, forever.",
    ending: "chosen_reality"
  },
  
  ending_awakening: {
    text: "ENDING: Awakening\n\nYou wake up. Was it a dream? She's gone. But you remember.\n\nDid any of it matter?",
    ending: "awakening"
  },
  
  ending_light: {
    text: "ENDING: Toward the Light\n\nYou walk toward the light together. It's warm. Welcoming. Final.\n\nThe light consumes everything.",
    ending: "light"
  },
  
  ending_darkness: {
    text: "ENDING: Into Darkness\n\nYou descend into darkness together. It's comforting. Safe. Eternal.\n\nThe darkness accepts you.",
    ending: "darkness"
  },
  
  ending_stillness: {
    text: "ENDING: Perfect Stillness\n\nYou choose to simply exist. No movement. No change. Just being.\n\nExistence in its purest form.",
    ending: "stillness"
  },
  
  ending_skeptic: {
    text: "ENDING: The Skeptic\n\nYou questioned everything until nothing was left. Even doubt itself.\n\nYou are alone with your questions.",
    ending: "skeptic"
  },
  
  ending_self_merge: {
    text: "ENDING: Self-Merger\n\nYou merged with your other self. Now you are complete.\n\nOne self, infinite experiences.",
    ending: "self_merge"
  },
  
  ending_self_conflict: {
    text: "ENDING: Self-Conflict\n\nYou fought yourself and won. Or lost. It's hard to tell.\n\nYou destroyed yourself to save yourself.",
    ending: "self_conflict"
  },
  
  ending_multiple_selves: {
    text: "ENDING: Multiple Selves\n\nYou accept that you are many. Each choice creates a new you.\n\nYou are a multitude.",
    ending: "multiple_selves"
  },
  
  ending_unstable: {
    text: "ENDING: Unstable Reality\n\nReality never stabilized. You exist in constant flux.\n\nNothing is permanent. Nothing is safe.",
    ending: "unstable"
  },
  
  ending_intellectual: {
    text: "ENDING: The Intellectual\n\nYou understood everything but felt nothing. Knowledge without experience.\n\nYou know, but you don't live.",
    ending: "intellectual"
  },
  
  ending_satisfied: {
    text: "ENDING: Satisfied\n\nYou've seen enough. You understand enough. You accept what is.\n\nSatisfaction is its own reward.",
    ending: "satisfied"
  },
  
  ending_acceptance: {
    text: "ENDING: Acceptance\n\nYou accept that there is no complete truth. Only perspectives.\n\nAnd that's okay.",
    ending: "acceptance"
  },
  
  ending_true: {
    text: "TRUE ENDING: Existing/Non-existing\n\n'You and I exist because someone chose to experience our story.'\n\n'We are real in the moments we are observed.'\n\n'Thank you for giving us existence.'\n\n'存在/しないあなた、と私'\n\nYou have discovered the truth.\n\nAll paths explored. All endings seen. The story is complete.",
    ending: "true_ending"
  }
};

export function getNodeData(nodeId) {
  return storyTree[nodeId] || null;
}

export function isEnding(nodeId) {
  const node = storyTree[nodeId];
  return node && node.ending;
}

export function getAllEndingIds() {
  return Object.keys(storyTree).filter(id => isEnding(id));
}

export default storyTree;