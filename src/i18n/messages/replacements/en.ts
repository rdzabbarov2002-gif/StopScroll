import type { Messages } from "./ru";

const seconds = (count: number) => `${count} ${count === 1 ? "second" : "seconds"}`;

export const en: Messages = {
  units: {
    replacements: { one: "alternative", other: "alternatives" },
    seconds: { one: "second", other: "seconds" },
  },

  a11y: {
    locked: ", available in Pro",
    doneToday: ", done today",
  },

  close: "Close",

  list: {
    title: "Alternatives",
    add: "Add your own alternative",
    filterAll: "All",
    filterMine: "Mine",
    pickLabel: "Right for now",
    pickForTrigger: (phrase: string, title: string) =>
      `When the feed pulls you in ${phrase}, try “${title}”.`,
    pick: (title: string) => `Try “${title}” instead of the feed.`,
    triggerPhrase: {
      boredom: "out of boredom",
      fatigue: "when you’re tired",
      stress: "under stress",
      loneliness: "out of loneliness",
      procrastination: "instead of a task",
      autopilot: "on autopilot",
      relax: "to unwind",
      sleepless: "on a sleepless night",
      other: "",
    },
    start: "Start",
    emptyTitle: "Nothing here yet",
    emptyPro: "Add a habit that recharges you: guitar, push-ups, a page of a book.",
    emptyFree: "Your own alternatives and habits are available in Pro.",
    openPro: "Unlock Pro",
    catalog: "Catalog",
    today: (count: string) => `${count} today`,
  },

  card: {
    own: "Custom",
  },

  detail: {
    notFoundTitle: "Alternative not found",
    notFoundText: "You may have deleted it.",
    lockedTitle: "This alternative is in StopScroll Pro",
    lockedText: "Unlock the full catalog: more movement, tasks and facts.",
    fact: (index: number, total: number) => `Fact ${index} of ${total}`,
    nextFact: "Next fact",
    countWin: (minutes: string) => `Count as a win · +${minutes}`,
    cancel: "Cancel",
    delete: "Delete",
    deleteOwn: "Delete this alternative",
    timer: "Timer",
    timerDone: "Time’s up — well done!",
    secondsLeft: (count: number) => `${seconds(count)} left`,
    again: "Again",
    startTimer: (duration: string) => `Start a ${duration} timer`,
  },

  custom: {
    title: "Your own alternative",
    subtitle: "Whatever works for you: guitar, push-ups, a page of a book.",
    name: "Name",
    namePlaceholder: "For example: 10 push-ups",
    nameA11y: "Alternative name",
    how: "How to do it",
    howPlaceholder: "Optional: a few words as a hint",
    howA11y: "Alternative description, optional",
    type: "Type",
    duration: "Duration",
    save: "Save alternative",
  },

  intercept: {
    passed: "Pause complete",
    title: "Has the urge faded?",
    text: "You gave your prefrontal cortex time to kick in. Now the choice is yours, not the algorithm’s.",
    whatTriggered: "What set off the urge?",
    suggestionsFor: {
      boredom: "Alternatives for boredom",
      fatigue: "Alternatives for tiredness",
      stress: "Alternatives for stress",
      loneliness: "Alternatives for loneliness",
      procrastination: "Alternatives for procrastination",
      autopilot: "Alternatives for autopilot",
      relax: "Alternatives for unwinding",
      sleepless: "Alternatives for insomnia",
      other: "Alternatives for other reasons",
    },
    suggestionsAny: "Trade the feed for 1–3 minutes",
    switched: (minutes: string) => `I switched · +${minutes}`,
    more: "15 more seconds",
    logSlip: "The feed won — log a slip",
    pause: "Pause",
    closePause: "Close pause",
    heading: "15 seconds of quiet",
    wave: "An urge is like a wave. Let it pass — your phone can wait.",
    phaseA11y: (phase: string, count: number) => `${phase}. ${seconds(count)} left`,
    step: (index: number, total: number) => `step ${index} of ${total}`,
  },

  win: {
    overline: "Urge beaten",
    saved: "won back from the feed. Your brain got honest dopamine — from a choice, not a scroll.",
    today: "Today",
    total: "Total saved",
    already: "That’s already",
    back: "Done",
    undo: "Undo",
  },
};
