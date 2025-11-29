// dictionary.js - Word dictionary and validation
export class Dictionary {
  constructor() {
    // Comprehensive word list (subset for performance, but extensive)
    this.words = this.generateWordList();
  }
  
  generateWordList() {
    // Generate a comprehensive dictionary with common and uncommon words
    const commonWords = [
      // 2-letter words
      "AM", "AN", "AS", "AT", "AX", "BY", "DO", "GO", "HE", "IF", "IN", "IS", "IT", "ME", "MY", "NO", "OF", "ON", "OR", "OX", "SO", "TO", "UP", "US", "WE",
      // 3-letter words
      "ACE", "ACT", "ADD", "AGE", "AGO", "AID", "AIM", "AIR", "ALL", "AND", "ANT", "ANY", "APE", "ARC", "ARE", "ARK", "ARM", "ART", "ASH", "ASK", "ATE",
      "BAD", "BAG", "BAN", "BAR", "BAT", "BAY", "BED", "BEE", "BET", "BIG", "BIN", "BIT", "BOW", "BOX", "BOY", "BUD", "BUG", "BUS", "BUT", "BUY",
      "CAB", "CAN", "CAP", "CAR", "CAT", "COB", "COD", "COG", "COP", "COT", "COW", "COX", "COY", "CRY", "CUB", "CUD", "CUE", "CUP", "CUR", "CUT",
      "DAB", "DAD", "DAM", "DAY", "DEN", "DEW", "DID", "DIE", "DIG", "DIM", "DIN", "DIP", "DOC", "DOE", "DOG", "DOT", "DRY", "DUB", "DUD", "DUE", "DUG", "DYE",
      "EAR", "EAT", "EEL", "EGG", "ELF", "ELK", "ELM", "END", "ERA", "EVE", "EWE", "EYE",
      "FAD", "FAN", "FAR", "FAT", "FAX", "FED", "FEE", "FEW", "FIG", "FIN", "FIR", "FIT", "FIX", "FLU", "FLY", "FOE", "FOG", "FOR", "FOX", "FRY", "FUN", "FUR",
      "GAB", "GAG", "GAL", "GAP", "GAS", "GAY", "GEL", "GEM", "GET", "GIG", "GIN", "GNU", "GOB", "GOD", "GOT", "GUM", "GUN", "GUT", "GUY", "GYM",
      "HAD", "HAM", "HAS", "HAT", "HAY", "HEM", "HEN", "HER", "HEW", "HEX", "HID", "HIM", "HIP", "HIS", "HIT", "HOB", "HOD", "HOE", "HOG", "HOP", "HOT", "HOW", "HUB", "HUE", "HUG", "HUM", "HUT",
      "ICE", "ICY", "ILL", "IMP", "INK", "INN", "ION", "IRE", "IRK", "ITS", "IVY",
      "JAB", "JAG", "JAM", "JAR", "JAW", "JAY", "JET", "JIG", "JOB", "JOG", "JOT", "JOY", "JUG",
      "KEG", "KEN", "KEY", "KID", "KIN", "KIT",
      "LAB", "LAC", "LAD", "LAG", "LAP", "LAW", "LAX", "LAY", "LEA", "LED", "LEG", "LET", "LID", "LIE", "LIP", "LIT", "LOG", "LOT", "LOW", "LUG",
      "MAD", "MAN", "MAP", "MAR", "MAT", "MAW", "MAX", "MAY", "MEN", "MET", "MID", "MIX", "MOB", "MOD", "MOM", "MOP", "MOW", "MUD", "MUG",
      "NAB", "NAG", "NAP", "NAY", "NET", "NEW", "NIL", "NIT", "NOD", "NOR", "NOT", "NOW", "NUB", "NUN", "NUT",
      "OAK", "OAR", "OAT", "ODD", "ODE", "OFF", "OFT", "OHM", "OIL", "OLD", "ONE", "OPT", "ORB", "ORE", "OUR", "OUT", "OWE", "OWL", "OWN",
      "PAD", "PAL", "PAN", "PAP", "PAR", "PAT", "PAW", "PAX", "PAY", "PEA", "PEG", "PEN", "PEP", "PER", "PET", "PEW", "PIE", "PIG", "PIN", "PIT", "PLY", "POD", "POP", "POT", "POX", "PRY", "PUB", "PUG", "PUN", "PUP", "PUS", "PUT",
      "RAG", "RAM", "RAN", "RAP", "RAT", "RAW", "RAY", "RED", "REF", "REM", "REP", "RIB", "RID", "RIG", "RIM", "RIP", "ROB", "ROD", "ROE", "ROT", "ROW", "RUB", "RUG", "RUM", "RUN", "RUT", "RYE",
      "SAC", "SAD", "SAG", "SAP", "SAT", "SAW", "SAX", "SAY", "SEA", "SET", "SEW", "SEX", "SHE", "SHY", "SIN", "SIP", "SIR", "SIS", "SIT", "SIX", "SKI", "SKY", "SLY", "SOB", "SOD", "SON", "SOP", "SOT", "SOW", "SOX", "SOY", "SPA", "SPY", "STY", "SUB", "SUM", "SUN", "SUP",
      "TAB", "TAD", "TAG", "TAN", "TAP", "TAR", "TAT", "TAX", "TEA", "TEN", "THE", "THY", "TIC", "TIE", "TIN", "TIP", "TIT", "TOE", "TON", "TOO", "TOP", "TOT", "TOW", "TOY", "TRY", "TUB", "TUG", "TUX", "TWO",
      "URN", "USE",
      "VAN", "VAT", "VET", "VIA", "VIE", "VOW",
      "WAD", "WAG", "WAR", "WAS", "WAX", "WAY", "WEB", "WED", "WEE", "WET", "WHO", "WHY", "WIG", "WIN", "WIT", "WOE", "WOK", "WON", "WOO", "WOW",
      "YAK", "YAM", "YAP", "YAW", "YEA", "YES", "YET", "YEW", "YIN", "YON", "YOU", "YOW",
      "ZAP", "ZED", "ZEN", "ZIP", "ZIT", "ZOO",
      // 4-letter words
      "ABLE", "ACHE", "ACID", "ACME", "ACNE", "ACRE", "AGED", "AIDE", "AJAR", "AKIN", "ALSO", "AMID", "AMEN", "ANTE", "ANTI", "APEX", "AQUA", "ARCH", "AREA", "ARID", "ARMY", "ATOM", "AUTO", "AVID", "AWAY", "AXLE", "BABY", "BACK", "BAIT", "BAKE", "BALD", "BALL", "BAND", "BANG", "BANK", "BARE", "BARK", "BARN", "BASE", "BASH", "BATH", "BEAD", "BEAK", "BEAM", "BEAN", "BEAR", "BEAT", "BEEF", "BEEN", "BEER", "BELL", "BELT", "BEND", "BENT", "BEST", "BIAS", "BIKE", "BILE", "BILL", "BIND", "BIRD", "BITE", "BLOW", "BLUE", "BLUR", "BOAR", "BOAT", "BODY", "BOIL", "BOLD", "BOLT", "BOMB", "BOND", "BONE", "BOOK", "BOOM", "BOOT", "BORE", "BORN", "BOSS", "BOTH", "BOWL", "BOYS", "BRAG", "BRAN", "BRAT", "BRED", "BREW", "BRIG", "BRIM", "BULK", "BULL", "BUMP", "BUNK", "BURN", "BURP", "BURY", "BUSH", "BUSY", "BUZZ", "CAFE", "CAGE", "CAKE", "CALF", "CALL", "CALM", "CAME", "CAMP", "CANE", "CAPE", "CARD", "CARE", "CARP", "CART", "CASE", "CASH", "CAST", "CAVE", "CELL", "CENT", "CHAD", "CHAP", "CHAT", "CHEF", "CHEW", "CHIN", "CHIP", "CHOP", "CHUG", "CITE", "CITY", "CLAD", "CLAM", "CLAN", "CLAP", "CLAW", "CLAY", "CLIP", "CLOD", "CLOG", "CLUB", "CLUE", "COAL", "COAT", "COAX", "CODE", "COIL", "COIN", "COLD", "COLT", "COMA", "COMB", "COME", "CONE", "COOK", "COOL", "COPE", "COPY", "CORD", "CORE", "CORK", "CORN", "COST", "COVE", "CRAB", "CRAM", "CRAP", "CREW", "CRIB", "CROP", "CROW", "CRUD", "CUBE", "CUFF", "CULT", "CURB", "CURE", "CURL", "CURT", "CUTE", "DAFT", "DALE", "DAME", "DAMP", "DARE", "DARK", "DARN", "DART", "DASH", "DATA", "DATE", "DAWN", "DAYS", "DEAD", "DEAF", "DEAL", "DEAN", "DEAR", "DEBT", "DECK", "DEED", "DEEM", "DEEP", "DEER", "DEFT", "DEMO", "DENT", "DENY", "DESK", "DIAL", "DICE", "DIED", "DIET", "DIME", "DINE", "DIRE", "DIRT", "DISC", "DISH", "DISK", "DIVE", "DOCK", "DOLE", "DOLL", "DOME", "DONE", "DOOM", "DOOR", "DOPE", "DOSE", "DOTE", "DOVE", "DOWN", "DOZE", "DRAB", "DRAG", "DRAM", "DRAW", "DRIP", "DROP", "DRUG", "DRUM", "DUAL", "DUCK", "DUCT", "DUEL", "DUET", "DUKE", "DULL", "DULY", "DUMB", "DUMP", "DUNE", "DUNG", "DUNK", "DUPE", "DUSK", "DUST", "DUTY", "DYED", "DYER", "EACH", "EARL", "EARN", "EASE", "EAST", "EASY", "ECHO", "EDGE", "EDGY", "EDIT", "EELS", "EERY", "EGGS", "EMIT", "ENVY", "EPIC", "EVEN", "EVER", "EVIL", "EXAM", "EXIT", "FACE", "FACT", "FADE", "FAIL", "FAIR", "FAKE", "FALL", "FAME", "FANG", "FARE", "FARM", "FAST", "FATE", "FAWN", "FEAR", "FEAT", "FEED", "FEEL", "FEET", "FELL", "FELT", "FEND", "FERN", "FEST", "FEUD", "FILE", "FILL", "FILM", "FIND", "FINE", "FIRE", "FIRM", "FISH", "FIST", "FIVE", "FLAG", "FLAK", "FLAP", "FLAT", "FLAW", "FLEA", "FLED", "FLEE", "FLEW", "FLEX", "FLIP", "FLOG", "FLOP", "FLOW", "FOAM", "FOIL", "FOLD", "FOLK", "FOND", "FONT", "FOOD", "FOOL", "FOOT", "FORD", "FORE", "FORK", "FORM", "FORT", "FOUL", "FOUR", "FOWL", "FOXY", "FRAY", "FREE", "FRET", "FROG", "FROM", "FUEL", "FULL", "FUME", "FUND", "FUNK", "FURY", "FUSE", "FUSS", "FUZZ", "GAIN", "GAIT", "GALA", "GALE", "GALL", "GAME", "GANG", "GAPE", "GARB", "GATE", "GAVE", "GAWK", "GAZE", "GEAR", "GEEK", "GELS", "GEMS", "GENE", "GERM", "GIFT", "GILD", "GILL", "GILT", "GIRL", "GIST", "GIVE", "GLAD", "GLEE", "GLEN", "GLOB", "GLOW", "GLUE", "GLUM", "GLUT", "GNAT", "GNAW", "GOAL", "GOAT", "GOES", "GOLD", "GOLF", "GONE", "GONG", "GOOD", "GOOF", "GORE", "GORY", "GOSH", "GOWN", "GRAB", "GRAM", "GRAY", "GREW", "GREY", "GRID", "GRIM", "GRIN", "GRIP", "GRIT", "GRUB", "GULF", "GULL", "GULP", "GUNK", "GURU", "GUSH", "GUST", "GUYS", "HACK", "HAIL", "HAIR", "HALF", "HALL", "HALT", "HAND", "HANG", "HARD", "HARE", "HARM", "HARP", "HASH", "HATE", "HAUL", "HAVE", "HAWK", "HAZE", "HAZY", "HEAD", "HEAL", "HEAP", "HEAR", "HEAT", "HECK", "HEED", "HEEL", "HEIR", "HELD", "HELL", "HELM", "HELP", "HEMP", "HERB", "HERD", "HERE", "HERO", "HERS", "HIDE", "HIGH", "HIKE", "HILL", "HILT", "HIND", "HINT", "HIRE", "HISS", "HIVE", "HOAX", "HOLD", "HOLE", "HOLY", "HOME", "HONE", "HONK", "HOOD", "HOOF", "HOOK", "HOOP", "HOOT", "HOPE", "HORN", "HOSE", "HOST", "HOUR", "HOWL", "HUGE", "HULK", "HULL", "HUMP", "HUNG", "HUNK", "HUNT", "HURL", "HURT", "HUSH", "HUSK", "HYMN", "ICON", "IDEA", "IDLE", "IDOL", "INCH", "INFO", "INTO", "IRIS", "IRON", "ISLE", "ITCH", "ITEM", "JADE", "JAIL", "JAMB", "JAVA", "JAWS", "JAZZ", "JEAN", "JEEP", "JEER", "JERK", "JEST", "JETS", "JINX", "JOBS", "JOCK", "JOEY", "JOIN", "JOKE", "JOLT", "JOWL", "JUDGE", "JUDO", "JUDY", "JUKE", "JULY", "JUMP", "JUNE", "JUNK", "JURY", "JUST", "JUTE", "KEEL", "KEEN", "KEEP", "KELP", "KEPT", "KEYS", "KHAN", "KICK", "KILL", "KILN", "KILT", "KIND", "KING", "KINK", "KISS", "KITE", "KIWI", "KNEE", "KNEW", "KNIT", "KNOB", "KNOT", "KNOW", "LACE", "LACK", "LACY", "LADS", "LADY", "LAID", "LAIR", "LAKE", "LAMB", "LAME", "LAMP", "LAND", "LANE", "LANK", "LARD", "LARK", "LASH", "LASS", "LAST", "LATE", "LAUD", "LAVA", "LAWN", "LAZY", "LEAD", "LEAF", "LEAK", "LEAN", "LEAP", "LEFT", "LEND", "LENS", "LENT", "LESS", "LEST", "LEVY", "LEWD", "LIAR", "LICE", "LICK", "LIED", "LIEN", "LIES", "LIFE", "LIFT", "LIKE", "LILT", "LILY", "LIMB", "LIME", "LIMP", "LINE", "LING", "LINK", "LINT", "LION", "LIPS", "LISP", "LIST", "LIVE", "LOAD", "LOAF", "LOAM", "LOAN", "LOBE", "LOCK", "LODE", "LOFT", "LOGO", "LOIN", "LONE", "LONG", "LOOK", "LOOM", "LOON", "LOOP", "LOOT", "LOPE", "LORD", "LORE", "LORN", "LOSE", "LOSS", "LOST", "LOUD", "LOUT", "LOVE", "LUCK", "LULL", "LUMP", "LUNG", "LURE", "LURK", "LUSH", "LUST", "LUTE", "LYNX", "LYRE", "MACE", "MADE", "MAID", "MAIL", "MAIM", "MAIN", "MAKE", "MALE", "MALL", "MALT", "MAMA", "MANE", "MANY", "MARE", "MARK", "MARS", "MART", "MASH", "MASK", "MASS", "MAST", "MATE", "MATH", "MAUL", "MAYO", "MAZE", "MEAD", "MEAL", "MEAN", "MEAT", "MEEK", "MEET", "MELD", "MELT", "MEMO", "MEND", "MENU", "MEOW", "MERE", "MESH", "MESS", "MICA", "MICE", "MILD", "MILE", "MILK", "MILL", "MIME", "MINCE", "MIND", "MINE", "MINI", "MINK", "MINT", "MINX", "MIRE", "MISS", "MIST", "MITE", "MITT", "MOAN", "MOAT", "MOCK", "MODE", "MOLD", "MOLE", "MOLT", "MONK", "MOOD", "MOON", "MOOR", "MOOT", "MOPE", "MORE", "MORN", "MOSS", "MOST", "MOTH", "MOVE", "MOWN", "MUCH", "MUCK", "MUFF", "MULE", "MULL", "MUSE", "MUSH", "MUSK", "MUST", "MUTE", "MUTT", "MYTH", "NAIL", "NAME", "NAPE", "NAVY", "NEAR", "NEAT", "NECK", "NEED", "NEON", "NEST", "NEWS", "NEWT", "NEXT", "NICE", "NICK", "NINE", "NODE", "NONE", "NOOK", "NOON", "NORM", "NOSE", "NOTE", "NOVA", "NUDE", "NULL", "NUMB", "OAFS", "OAKS", "OARS", "OATH", "OATS", "OBEY", "OBOE", "ODDS", "ODES", "ODOR", "OFFS", "OGLE", "OILS", "OILY", "OKAY", "OMEN", "OMIT", "ONCE", "ONES", "ONLY", "ONTO", "ONUS", "OOZE", "OPAL", "OPEN", "ORAL", "ORBS", "ORCA", "ORES", "ORGY", "OURS", "OUST", "OUTS", "OVEN", "OVER", "OWED", "OWES", "OWLS", "OWNS", "OXEN", "PACE", "PACK", "PACT", "PAGE", "PAID", "PAIL", "PAIN", "PAIR", "PALE", "PALL", "PALM", "PANE", "PANG", "PANT", "PAPA", "PARK", "PART", "PASS", "PAST", "PATH", "PAVE", "PAWN", "PEAK", "PEAL", "PEAR", "PEAS", "PEAT", "PECK", "PEEK", "PEEL", "PEER", "PEGS", "PELT", "PENS", "PENT", "PEON", "PERK", "PERT", "PEST", "PETS", "PEWS", "PICK", "PIER", "PIES", "PIGS", "PIKE", "PILE", "PILL", "PIMP", "PINE", "PING", "PINK", "PINS", "PINT", "PIPE", "PISS", "PITH", "PITY", "PLAN", "PLAY", "PLEA", "PLED", "PLOT", "PLOW", "PLOY", "PLUG", "PLUM", "PLUS", "POCK", "PODS", "POEM", "POET", "POKE", "POLE", "POLL", "POLO", "POMP", "POND", "PONY", "POOH", "POOL", "POOP", "POOR", "POPE", "POPS", "PORE", "PORK", "PORN", "PORT", "POSE", "POSH", "POST", "POSY", "POTS", "POUF", "POUR", "POUT", "PRAM", "PRAY", "PREP", "PREY", "PRIM", "PROD", "PROF", "PROM", "PROP", "PROW", "PRUDE", "PRUNE", "PRUNE", "PUFF", "PUKE", "PULL", "PULP", "PUMA", "PUMP", "PUNK", "PUNT", "PUNY", "PUPA", "PURE", "PURR", "PUSH", "PUTS", "PUTT", "QUAD", "QUAY", "QUID", "QUIP", "QUIT", "QUIZ", "RACE", "RACK", "RACY", "RAFT", "RAGE", "RAGS", "RAID", "RAIL", "RAIN", "RAKE", "RAMP", "RAMS", "RANK", "RANT", "RARE", "RASH", "RASP", "RATE", "RATS", "RAVE", "RAYS", "RAZE", "READ", "REAL", "REAM", "REAP", "REAR", "REDO", "REED", "REEF", "REEK", "REEL", "REFS", "REIN", "RELY", "REND", "RENT", "REPS", "REST", "RHYME", "RIAL", "RIBS", "RICE", "RICH", "RICK", "RIDE", "RIFE", "RIFT", "RIGS", "RILE", "RILL", "RIME", "RIMS", "RIND", "RING", "RINK", "RIOT", "RIPE", "RISE", "RISK", "RITE", "ROAD", "ROAM", "ROAN", "ROAR", "ROBE", "ROBS", "ROCK", "RODE", "RODS", "ROES", "ROIL", "ROLE", "ROLL", "ROMP", "ROOD", "ROOF", "ROOK", "ROOM", "ROOT", "ROPE", "ROPY", "ROSE", "ROSY", "ROTE", "ROTS", "ROUT", "ROVE", "ROWS", "RUBE", "RUBS", "RUBY", "RUCK", "RUDE", "RUFF", "RUGS", "RUIN", "RULE", "RUMP", "RUMS", "RUNE", "RUNG", "RUNS", "RUNT", "RUSE", "RUSH", "RUST", "RUTS", "SACK", "SAFE", "SAGA", "SAGE", "SAGO", "SAGS", "SAID", "SAIL", "SAKE", "SALE", "SALT", "SAME", "SAND", "SANE", "SANG", "SANK", "SAPS", "SARI", "SASH", "SASS", "SATE", "SAVE", "SAWS", "SAYS", "SCAB", "SCAD", "SCAM", "SCAN", "SCAR", "SCAT", "SCOW", "SEAL", "SEAM", "SEAR", "SEAS", "SEAT", "SECT", "SEED", "SEEK", "SEEM", "SEEN", "SEEP", "SEER", "SEES", "SELF", "SELL", "SEND", "SENT", "SERF", "SETS", "SETT", "SEWN", "SEWS", "SEXY", "SHAD", "SHAG", "SHAH", "SHAM", "SHED", "SHIM", "SHIN", "SHIP", "SHIV", "SHOD", "SHOE", "SHOO", "SHOP", "SHOT", "SHOW", "SHUN", "SHUT", "SICK", "SIDE", "SIFT", "SIGH", "SIGN", "SILK", "SILL", "SILO", "SILT", "SING", "SINK", "SINS", "SIPS", "SIRE", "SITE", "SITS", "SIZE", "SKID", "SKIM", "SKIN", "SKIP", "SKIS", "SKIT", "SLAB", "SLAG", "SLAM", "SLAP", "SLAT", "SLAY", "SLED", "SLEW", "SLID", "SLIM", "SLIP", "SLIT", "SLOB", "SLOE", "SLOG", "SLOP", "SLOT", "SLOW", "SLUG", "SLUM", "SLUR", "SMOG", "SMUG", "SNAG", "SNAP", "SNIP", "SNIT", "SNOB", "SNOT", "SNOW", "SNUB", "SNUG", "SOAK", "SOAP", "SOAR", "SOBS", "SOCK", "SODA", "SOFA", "SOFT", "SOIL", "SOLD", "SOLE", "SOLO", "SOME", "SONG", "SONS", "SOON", "SOOT", "SOPS", "SORE", "SORT", "SOUL", "SOUP", "SOUR", "SOWN", "SOWS", "SPAN", "SPAR", "SPAS", "SPAT", "SPED", "SPEW", "SPIN", "SPIT", "SPOT", "SPRY", "SPUD", "SPUN", "SPUR", "STAB", "STAG", "STAR", "STAY", "STEM", "STEP", "STEW", "STIR", "STOP", "STOW", "STUB", "STUD", "STUN", "SUBS", "SUCH", "SUDS", "SUED", "SUET", "SUIT", "SULK", "SUMO", "SUMP", "SUMS", "SUNG", "SUNK", "SUNS", "SUPE", "SUPS", "SURE", "SURF", "SWAB", "SWAG", "SWAM", "SWAN", "SWAP", "SWAT", "SWAY", "SWIM", "SWOP", "SWUM", "TACK", "TACO", "TACT", "TAIL", "TAKE", "TALE", "TALK", "TALL", "TAME", "TAMP", "TANG", "TANK", "TAPE", "TAPS", "TARE", "TARN", "TARP", "TART", "TASK", "TAUT", "TAXI", "TEAK", "TEAL", "TEAM", "TEAR", "TEAS", "TEAT", "TECH", "TEED", "TEEM", "TEEN", "TEES", "TELL", "TEMP", "TEND", "TENS", "TENT", "TERM", "TERN", "TEST", "TEXT", "THAN", "THAT", "THAW", "THEE", "THEM", "THEN", "THEW", "THEY", "THIN", "THIS", "THUD", "THUG", "THUS", "TICK", "TIDE", "TIDY", "TIED", "TIER", "TIES", "TIFF", "TILE", "TILL", "TILT", "TIME", "TINE", "TING", "TINS", "TINT", "TINY", "TIPS", "TIRE", "TOAD", "TOCK", "TOED", "TOES", "TOFU", "TOGA", "TOGS", "TOIL", "TOLD", "TOLL", "TOMB", "TOME", "TONE", "TONG", "TONS", "TOOK", "TOOL", "TOOT", "TOPS", "TORE", "TORN", "TORS", "TORT", "TOSS", "TOTE", "TOTS", "TOUR", "TOUT", "TOWS", "TOYS", "TRAM", "TRAP", "TRAY", "TREE", "TREK", "TRIM", "TRIO", "TRIP", "TROD", "TROT", "TROY", "TRUE", "TSAR", "TUBA", "TUBE", "TUBS", "TUCK", "TUFT", "TUGS", "TUNA", "TUNE", "TUNS", "TURD", "TURF", "TURN", "TUSK", "TUTU", "TWIG", "TWIN", "TWIT", "TWOS", "TYPE", "TYPO", "UGLY", "UNDO", "UNIT", "UNTO", "UPON", "URGE", "URNS", "USED", "USER", "USES", "VAIN", "VALE", "VAMP", "VANE", "VANS", "VARY", "VASE", "VAST", "VATS", "VEAL", "VEER", "VEIL", "VEIN", "VEND", "VENT", "VERB", "VERS", "VERY", "VEST", "VETO", "VETS", "VIAL", "VICE", "VIDE", "VIED", "VIES", "VIEW", "VILE", "VINE", "VINO", "VIOL", "VISE", "VOID", "VOLT", "VOTE", "VOWS", "WADE", "WADS", "WAFT", "WAGE", "WAGS", "WAIF", "WAIL", "WAIT", "WAKE", "WALK", "WALL", "WANE", "WANT", "WARD", "WARE", "WARM", "WARN", "WARP", "WARS", "WART", "WARY", "WASH", "WASP", "WATT", "WAVE", "WAVY", "WAXY", "WAYS", "WEAK", "WEAL", "WEAN", "WEAR", "WEDS", "WEED", "WEEK", "WEEP", "WEFT", "WEIR", "WELD", "WELL", "WELT", "WENT", "WEPT", "WERE", "WEST", "WETS", "WHAM", "WHAT", "WHEN", "WHET", "WHEY", "WHIM", "WHIP", "WHIR", "WHIT", "WHOM", "WICK", "WIDE", "WIFE", "WIGS", "WILD", "WILE", "WILL", "WILT", "WILY", "WIMP", "WIND", "WINE", "WING", "WINK", "WINO", "WINS", "WINY", "WIPE", "WIRE", "WIRY", "WISE", "WISH", "WISP", "WITH", "WITS", "WIVE", "WOES", "WOKE", "WOKS", "WOLF", "WOMB", "WONT", "WOOD", "WOOF", "WOOL", "WOOS", "WORD", "WORE", "WORK", "WORM", "WORN", "WORT", "WOVE", "WRAP", "WREN", "WRIT", "WUSS", "YACK", "YAKS", "YAMS", "YANK", "YAPS", "YARD", "YARN", "YAWL", "YAWN", "YAWS", "YEAH", "YEAR", "YEAS", "YELL", "YELP", "YENS", "YEPS", "YEWS", "YIDS", "YINS", "YIPS", "YOKE", "YOLK", "YORE", "YOUR", "YOWS", "YUCK", "YULE", "YUPS", "ZANY", "ZAPS", "ZEAL", "ZEBU", "ZEDS", "ZEES", "ZENS", "ZERO", "ZEST", "ZETA", "ZINC", "ZING", "ZIPS", "ZITS", "ZONE", "ZONK", "ZOOM", "ZOOS", "ZULU",
      // 5-letter words (selection)
      "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN", "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLOW", "ALONE", "ALONG", "ALTER", "ANGEL", "ANGER", "ANGLE", "ANGRY", "APART", "APPLE", "APPLY", "ARENA", "ARGUE", "ARISE", "ARRAY", "ARROW", "ASIDE", "ASSET", "AVOID", "AWARD", "AWARE", "BADLY", "BAKER", "BASIS", "BEACH", "BEGAN", "BEGIN", "BEING", "BELOW", "BENCH", "BILLY", "BIRTH", "BLACK", "BLADE", "BLAME", "BLANK", "BLAST", "BLEED", "BLESS", "BLIND", "BLOCK", "BLOOD", "BLOOM", "BOARD", "BOOST", "BOOTH", "BOUND", "BRAIN", "BRAND", "BRAVE", "BREAD", "BREAK", "BREED", "BRIEF", "BRING", "BROAD", "BROKE", "BROWN", "BUILD", "BUILT", "BUYER", "CABLE", "CALIF", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHAOS", "CHARM", "CHART", "CHASE", "CHEAP", "CHEAT", "CHECK", "CHEEK", "CHESS", "CHEST", "CHIEF", "CHILD", "CHINA", "CHOSE", "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLICK", "CLIFF", "CLIMB", "CLOCK", "CLOSE", "CLOTH", "CLOUD", "COACH", "COAST", "COULD", "COUNT", "COURT", "COVER", "CRACK", "CRAFT", "CRASH", "CRAZY", "CREAM", "CRIME", "CROSS", "CROWD", "CROWN", "CRUDE", "CURVE", "CYCLE", "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DEBUT", "DELAY", "DELTA", "DENSE", "DEPTH", "DOING", "DOUBT", "DOZEN", "DRAFT", "DRAMA", "DRANK", "DRAWN", "DREAM", "DRESS", "DRIED", "DRILL", "DRINK", "DRIVE", "DROVE", "DYING", "EAGER", "EARLY", "EARTH", "EIGHT", "ELECT", "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT", "EXIST", "EXTRA", "FAITH", "FALSE", "FAULT", "FIBER", "FIELD", "FIFTH", "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLASH", "FLEET", "FLESH", "FLOAT", "FLOOD", "FLOOR", "FLUID", "FOCUS", "FORCE", "FORTH", "FORTY", "FORUM", "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FRUIT", "FULLY", "FUNNY", "GIANT", "GIVEN", "GLASS", "GLOBE", "GOING", "GRACE", "GRADE", "GRAND", "GRANT", "GRASS", "GRAVE", "GREAT", "GREEN", "GROSS", "GROUP", "GROWN", "GUARD", "GUESS", "GUEST", "GUIDE", "HAPPY", "HARRY", "HEART", "HEAVY", "HENCE", "HENRY", "HORSE", "HOTEL", "HOUSE", "HUMAN", "IDEAL", "IMAGE", "INDEX", "INNER", "INPUT", "ISSUE", "JAPAN", "JIMMY", "JOINT", "JONES", "JUDGE", "KNOWN", "LABEL", "LARGE", "LASER", "LATER", "LAUGH", "LAYER", "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL", "LEMON", "LEVEL", "LEWIS", "LIGHT", "LIMIT", "LINKS", "LIVES", "LOCAL", "LOGIC", "LOOSE", "LOWER", "LUCKY", "LUNCH", "LYING", "MAGIC", "MAJOR", "MAKER", "MARCH", "MARIA", "MATCH", "MAYBE", "MAYOR", "MEANT", "MEDIA", "METAL", "MIGHT", "MINOR", "MINUS", "MIXED", "MODEL", "MONEY", "MONTH", "MORAL", "MOTOR", "MOUNT", "MOUSE", "MOUTH", "MOVED", "MOVIE", "MUSIC", "NEEDS", "NEVER", "NEWLY", "NIGHT", "NOISE", "NORTH", "NOTED", "NOVEL", "NURSE", "OCCUR", "OCEAN", "OFFER", "OFTEN", "ORDER", "OTHER", "OUGHT", "PAINT", "PANEL", "PAPER", "PARTY", "PEACE", "PETER", "PHASE", "PHONE", "PHOTO", "PIECE", "PILOT", "PITCH", "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE", "POINT", "POUND", "POWER", "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF", "PROUD", "PROVE", "QUEEN", "QUICK", "QUIET", "QUITE", "RADIO", "RAISE", "RANGE", "RAPID", "RATIO", "REACH", "READY", "REFER", "RIGHT", "RIVAL", "RIVER", "ROBIN", "ROGER", "ROMAN", "ROUGH", "ROUND", "ROUTE", "ROYAL", "RURAL", "SCALE", "SCENE", "SCOPE", "SCORE", "SENSE", "SERVE", "SEVEN", "SHALL", "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF", "SHELL", "SHIFT", "SHINE", "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOWN", "SIGHT", "SINCE", "SIXTH", "SIXTY", "SIZED", "SKILL", "SLEEP", "SLIDE", "SMALL", "SMART", "SMILE", "SMITH", "SMOKE", "SOLID", "SOLVE", "SORRY", "SOUND", "SOUTH", "SPACE", "SPARE", "SPEAK", "SPEED", "SPEND", "SPENT", "SPLIT", "SPOKE", "SPORT", "STAFF", "STAGE", "STAKE", "STAND", "START", "STATE", "STEAM", "STEEL", "STICK", "STILL", "STOCK", "STONE", "STOOD", "STORE", "STORM", "STORY", "STRIP", "STUCK", "STUDY", "STUFF", "STYLE", "SUGAR", "SUITE", "SUPER", "SWEET", "TABLE", "TAKEN", "TASTE", "TAXES", "TEACH", "TEETH", "TERRY", "TEXAS", "THANK", "THEFT", "THEIR", "THEME", "THERE", "THESE", "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW", "THROW", "TIGHT", "TIMES", "TITLE", "TODAY", "TOPIC", "TOTAL", "TOUCH", "TOUGH", "TOWER", "TRACK", "TRADE", "TRAIN", "TREAT", "TREND", "TRIAL", "TRIBE", "TRICK", "TRIED", "TRIES", "TROOP", "TRUCK", "TRULY", "TRUNK", "TRUST", "TRUTH", "TWICE", "UNDER", "UNDUE", "UNION", "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE", "USUAL", "VALID", "VALUE", "VIDEO", "VIRUS", "VISIT", "VITAL", "VOCAL", "VOICE", "WASTE", "WATCH", "WATER", "WHEEL", "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE", "WHOSE", "WOMAN", "WOMEN", "WORLD", "WORRY", "WORSE", "WORST", "WORTH", "WOULD", "WOUND", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG", "YOUTH"
    ];
    
    // Convert to uppercase and create Set for fast lookup
    const wordSet = new Set(commonWords.map(w => w.toUpperCase()));
    return wordSet;
  }
  
  isValidWord(word) {
    return this.words.has(word.toUpperCase());
  }
  
  searchWords(pattern) {
    // Convert pattern to regex
    // ? = any single letter
    // * = any number of letters
    let regexPattern = pattern
      .toUpperCase()
      .replace(/\?/g, '.')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp('^' + regexPattern + '$');
    const results = [];
    
    for (let word of this.words) {
      if (regex.test(word)) {
        results.push(word);
      }
    }
    
    return results.sort((a, b) => {
      // Sort by length first, then alphabetically
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });
  }
  
  findAnagrams(letters, maxResults = 100) {
    const upperLetters = letters.toUpperCase().replace(/[^A-Z?*]/g, '');
    const results = [];
    const letterCount = {};
    let wildcards = 0;
    
    // Count letters and wildcards
    for (let char of upperLetters) {
      if (char === '?' || char === '*') {
        wildcards++;
      } else {
        letterCount[char] = (letterCount[char] || 0) + 1;
      }
    }
    
    // Check each word
    for (let word of this.words) {
      if (word.length > upperLetters.length) continue;
      if (this.canMakeWord(word, letterCount, wildcards)) {
        results.push(word);
        if (results.length >= maxResults) break;
      }
    }
    
    return results.sort((a, b) => {
      // Sort by score (descending), then length
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.length - a.length;
    });
  }
  
  canMakeWord(word, availableLetters, wildcards) {
    const needed = {};
    for (let char of word) {
      needed[char] = (needed[char] || 0) + 1;
    }
    
    let wildcardsNeeded = 0;
    for (let char in needed) {
      const available = availableLetters[char] || 0;
      if (needed[char] > available) {
        wildcardsNeeded += needed[char] - available;
      }
    }
    
    return wildcardsNeeded <= wildcards;
  }
  
  calculateScore(word) {
    let score = 0;
    for (let char of word) {
      score += LETTER_SCORES[char] || 0;
    }
    return score;
  }
}

import { LETTER_SCORES } from './globals.js';