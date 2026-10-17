import type { Messages } from "./ru";

export const en: Messages = {
  triggers: {
    boredom: {
      label: "Boredom",
      hint: "Craving something new",
      ask: "I was bored",
      noun: "boredom",
      because: "out of boredom",
      reason: "out of boredom",
      advice:
        "Boredom is a hunger for novelty, and the feed feeds it empty calories. Keep one piece of “real” novelty within reach: a book, a puzzle, a new route.",
    },
    fatigue: {
      label: "Tiredness",
      hint: "No energy for anything",
      ask: "I had no energy",
      noun: "tiredness",
      because: "because of tiredness",
      reason: "because of tiredness",
      advice:
        "A tired brain picks the easiest option. The feed doesn’t restore you — it drains what’s left. Try 3 minutes with your eyes closed, or a glass of water by the window.",
    },
    stress: {
      label: "Stress",
      hint: "Want to escape",
      ask: "I felt anxious",
      noun: "stress",
      because: "because of stress",
      reason: "because of stress",
      advice:
        "The feed promises an escape, but the anxiety comes back stronger afterwards. Body first: a long exhale, some movement, cold water — decisions later.",
    },
    loneliness: {
      label: "Loneliness",
      hint: "Missing people",
      ask: "I felt lonely",
      noun: "loneliness",
      because: "out of loneliness",
      reason: "out of loneliness",
      advice:
        "Other people’s lives in a feed can’t replace real contact. One short message to a real person gives you more than an hour of videos.",
    },
    procrastination: {
      label: "Procrastination",
      hint: "Putting something off",
      ask: "I didn’t want to start a task",
      noun: "putting things off",
      because: "while putting things off",
      reason: "when you’re putting things off",
      advice:
        "The feed is the easiest way not to start. Shrink the task to a 2-minute step and do just that.",
    },
    autopilot: {
      label: "Autopilot",
      hint: "Opened it without thinking",
      ask: "It just opened, on autopilot",
      noun: "autopilot",
      because: "on autopilot",
      reason: "on autopilot",
      advice:
        "Habit fires before thought does. Move the apps off your Home Screen and put your phone face down — friction breaks the autopilot.",
    },
    relax: {
      label: "Rest",
      hint: "Want to unwind",
      ask: "I wanted to unwind",
      noun: "the urge to unwind",
      because: "out of the urge to unwind",
      reason: "when you want to unwind",
      advice:
        "The feed promises rest but rarely delivers. Choose rest that actually leaves you lighter: a shower, music with your eyes closed, five minutes of stretching.",
    },
    sleepless: {
      label: "Insomnia",
      hint: "Can’t fall asleep",
      ask: "I couldn’t fall asleep",
      noun: "insomnia",
      because: "because of insomnia",
      reason: "when you can’t fall asleep",
      advice:
        "A bright screen wakes the brain up even more. If you can’t sleep, dim the lights and read a paper book for about ten minutes — and charge your phone outside the bedroom.",
    },
    other: {
      label: "Other",
      hint: "Your own reason",
      ask: "Something else",
      noun: "other reasons",
      because: "for other reasons",
      reason: "for various reasons",
      advice:
        "A few words about what happened just before help you spot what repeats. Write them down — things will get clearer.",
    },
  },

  feedApps: {
    other: "Other",
  },

  categories: {
    body: { label: "Body", description: "Movement in 1–3 minutes" },
    mind: { label: "Mind", description: "Tasks that switch your brain on" },
    facts: { label: "Facts", description: "Short, useful novelty" },
  },

  items: {
    squats: {
      title: "15 squats",
      description: "A quick rush of blood to the brain and honest dopamine from getting it done.",
      steps: [
        "Stand up, feet shoulder-width apart.",
        "Do 15 slow squats, keeping your back straight.",
        "Finish with a deep breath and notice how much warmer you feel.",
      ],
    },
    "neck-shoulders": {
      title: "Neck and shoulder stretch",
      description: "Releases the tension that builds up from looking down at your phone.",
      steps: [
        "Slowly tilt your head to your right shoulder, then to the left — 3 times each.",
        "Roll your shoulders backwards 10 times.",
        "Clasp your hands behind your back and open your chest for 3 breaths.",
      ],
    },
    "eyes-20-20": {
      title: "20-20-20 eye break",
      description: "A screen keeps your focus at 30 cm. Give your eyes something far away.",
      steps: [
        "Go to a window or find the farthest point in the room.",
        "Look at it for 20 seconds, blinking naturally.",
        "Cover your eyes with your palms for 20 seconds, then blink slowly 10 times.",
      ],
    },
    "cold-water": {
      title: "Cold water",
      description: "A splash on the face and a glass of water — a quick reset for your nerves.",
      steps: [
        "Wash your face with cold water or hold your wrists under the tap for 30 seconds.",
        "Slowly drink a glass of water.",
        "Notice what has changed in your body.",
      ],
    },
    "walk-3": {
      title: "Three-minute walk",
      description: "Moving without a goal is the best reset for your attention.",
      steps: [
        "Leave your phone on the table.",
        "Walk around your home, office or the stairs for three minutes.",
        "Spot three new details along the way.",
      ],
    },
    "tidy-surface": {
      title: "Tidy one surface",
      description: "A small finished task gives you a sense of control.",
      steps: [
        "Pick one surface: a desk, a shelf, a windowsill.",
        "Clear everything unnecessary off it in 3 minutes.",
        "Look at the result — that’s your win.",
      ],
    },
    plank: {
      title: "45-second plank",
      description: "A short effort that shifts you from anxiety into your body.",
      steps: [
        "Get into a forearm plank, body in a straight line.",
        "Hold for 45 seconds, breathing evenly.",
        "Rest lying down for 15 seconds, letting your whole body relax.",
      ],
    },
    "shake-off": {
      title: "Shake off tension",
      description: "This is how animals release stress after danger.",
      steps: [
        "Stand up and shake out your hands for 20 seconds.",
        "Add your shoulders, then your legs — 30 more seconds.",
        "Stand still and take three slow breaths out.",
      ],
    },
    "muscle-relax": {
      title: "Muscle relaxation",
      description: "Tensing and releasing in turn — deep rest in 3 minutes.",
      steps: [
        "Clench your fists for 5 seconds, then let go all at once.",
        "Repeat for your shoulders, face, belly and legs.",
        "Finish by lying or sitting still for 30 seconds, feeling how heavy your body is.",
      ],
    },
    "serial-sevens": {
      title: "Count down by 7",
      description: "Puts your prefrontal cortex to work and cuts the automatic urge short.",
      steps: [
        "Keep subtracting 7 from 100 in your head: 93, 86, 79…",
        "Made a mistake? Pick up from the last correct number.",
        "Keep going until you get below 10.",
      ],
    },
    "two-minute-step": {
      title: "A 2-minute step",
      description: "Instead of the feed — the tiniest step of a task you’ve been putting off.",
      steps: [
        "Think of a task you’ve been putting off.",
        "Find a step in it that takes 2 minutes: open the file, write the first line.",
        "Do only that. You don’t have to keep going.",
      ],
    },
    gratitude: {
      title: "Three good things",
      description: "Shifts your attention from what’s missing to what you already have.",
      steps: [
        "Recall three good moments from today — even small ones.",
        "For each one, ask yourself: why did it happen?",
        "Write down one sentence if you have paper.",
      ],
    },
    "message-human": {
      title: "Message a real person",
      description: "Real contact instead of an endless stream of other people’s lives.",
      steps: [
        "Pick someone you haven’t talked to in a while.",
        "Send them one warm message or a question.",
        "Close the messenger without waiting for a reply.",
      ],
    },
    "brain-dump": {
      title: "Brain dump",
      description: "Anxiety gets quieter when your thoughts are on paper, not in your head.",
      steps: [
        "Grab a sheet of paper or open your notes.",
        "Write down everything on your mind for 2 minutes without stopping.",
        "Underline one thing you can do today.",
      ],
    },
    "alphabet-game": {
      title: "Alphabet game",
      description: "A light mental task that satisfies the hunger for novelty.",
      steps: [
        "Pick a theme: cities, animals, dishes.",
        "Name one word for each letter of the alphabet.",
        "Stuck? Skip the letter and come back to it at the end.",
      ],
    },
    "evening-plan": {
      title: "Picture your evening",
      description: "Your brain lets go of the feed more easily when it sees a better plan.",
      steps: [
        "Close your eyes.",
        "Picture in detail how you’ll spend the next hour without the feed.",
        "Choose the first thing you’ll do and open your eyes.",
      ],
    },
    "facts-brain": {
      title: "Brain and habits",
      description: "How the pull of the feed works — and why it can be retrained.",
      steps: [
        "Dopamine is tied more to expecting a reward than to the pleasure itself. That’s why an endless feed hooks you more than any single video.",
        "Short videos work like a slot machine: the reward comes unpredictably, so the brain keeps “pulling the lever”.",
        "An urge is like a wave: it builds and then subsides. Even a short pause interrupts the automatic action and gives you a chance to choose differently.",
        "The brain’s emotional systems react faster than the prefrontal cortex — the “manager” in charge of self-control. A pause gives it time to catch up with the urge.",
        "A new habit sticks through repetition in the same context. The same swap in the same situation works better than variety.",
      ],
    },
    "facts-nature": {
      title: "Amazing nature",
      description: "A little living novelty instead of the feed.",
      steps: [
        "An octopus “tastes” the world with its suckers: receptors on its arms can tell flavors apart.",
        "Trees in a forest can exchange substances through fungal networks woven around their roots.",
        "A hummingbird’s heart can beat more than 1,000 times a minute.",
        "Sea otters hold paws while they sleep so the current doesn’t carry them apart.",
        "Bees tell each other the way to flowers with a “waggle dance”.",
      ],
    },
    "facts-space": {
      title: "Space in a minute",
      description: "A scale that makes the feed look small.",
      steps: [
        "Sunlight takes about 8 minutes to reach Earth — we always see the Sun slightly in the past.",
        "A day on Venus is longer than its year: it spins more slowly than it orbits the Sun.",
        "There are more stars in the observable universe than grains of sand on all of Earth’s beaches.",
        "Astronauts’ footprints on the Moon can last for millions of years — there’s no wind there.",
        "A neutron star is so dense that a teaspoon of it would weigh billions of tons.",
      ],
    },
    "facts-history": {
      title: "History up close",
      description: "Short stories you’ll want to retell.",
      steps: [
        "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid of Giza.",
        "The University of Oxford is older than the Aztec Empire.",
        "The shortest war in history — the Anglo-Zanzibar War of 1896 — lasted less than an hour.",
        "Ancient Rome had its own “fast food”: street thermopolia serving hot meals.",
        "The word “robot” first appeared in Karel Čapek’s 1920 play, but it was coined by the writer’s brother, Josef.",
      ],
    },
  },

  breath: {
    inhale: "Breathe in",
    exhale: "Breathe out",
    hold: "Hold",
    rest: "Pause",
  },

  exercises: {
    "breath-ground": {
      title: "Breathe and ground",
      subtitle: "Long exhale + the 3-2-1 technique",
      prompts: [
        "Silently name 3 things you can see right now",
        "Feel 2 points of support: your feet on the floor and your back",
        "Take 1 long breath out and let your shoulders drop",
      ],
    },
    "box-breath": {
      title: "Box breathing",
      subtitle: "A steady rhythm for high stress",
      prompts: [
        "Breathe in through your nose — count to four",
        "Hold your breath without straining",
        "Breathe out slowly through your mouth",
        "Pause. Notice the stillness inside",
      ],
    },
    "serial-sevens": {
      title: "Count down by 7",
      subtitle: "Switches on the brain’s “manager”",
      prompts: [
        "Work it out in your head: 100 − 7 = ?",
        "Right, 93. Next: 93 − 7 = ?",
        "That’s 86. Once more: 86 − 7 = ?",
      ],
    },
    "intent-check": {
      title: "Three honest questions",
      subtitle: "Awareness instead of autopilot",
      prompts: [
        "What am I feeling right now, in one word?",
        "What do I really want to get from the feed?",
        "What could give me that feeling without my phone?",
      ],
    },
  },

  equivalents: {
    books: {
      unit: { one: "book", other: "books" },
      caption: "an average book ≈ 5 hours of reading",
    },
    sleep: {
      unit: { one: "hour of sleep", other: "hours of sleep" },
      caption: "time you could give back to sleep",
    },
    walks: {
      unit: { one: "walk", other: "walks" },
      caption: "30 minutes each in the fresh air",
    },
    workouts: {
      unit: { one: "workout", other: "workouts" },
      caption: "45 minutes each",
    },
    language: {
      unit: { one: "language lesson", other: "language lessons" },
      caption: "20 minutes each",
    },
    calls: {
      unit: { one: "call", other: "calls" },
      caption: "with loved ones, 15 minutes each",
    },
  },

  timeOfDay: {
    morning: { label: "Morning", phrase: "in the morning" },
    afternoon: { label: "Afternoon", phrase: "in the afternoon" },
    evening: { label: "Evening", phrase: "in the evening" },
    night: { label: "Night", phrase: "at night" },
  },
};
