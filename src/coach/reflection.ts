import { getTrigger } from "../utils/catalog";
import { MS_PER_DAY } from "../utils/date";
import { isLocked, suggestReplacements } from "../utils/replacements";
import type { SlipEntry, TriggerId } from "../utils/types";
import { hourOf, isLate } from "./history";
import { ordinalMasculine, variant } from "./language";

/** What the coach says after the user answers "Что произошло?". */
export interface Reflection {
  text: string;
  /** A replacement for the next time this happens. */
  replacementId?: string;
}

const UNDERSTANDING: Record<TriggerId, string> = {
  boredom: "Скука — одна из самых частых причин, по которым рука тянется к ленте.",
  fatigue: "Когда нет сил, мозг выбирает самое лёгкое, а лента всегда под рукой.",
  relax: "Хотеть отдыха нормально. Просто лента редко даёт тот отдых, за которым к ней приходишь.",
  sleepless: "Когда не спится, экран кажется спасением, но обычно только отодвигает сон.",
  autopilot: "Автопилот срабатывает раньше мысли — это привычка, а не слабость.",
  stress: "Когда тревожно, лента обещает передышку. Понятно, почему к ней тянется рука.",
  loneliness: "Когда одиноко, чужие жизни в ленте ненадолго создают ощущение компании.",
  procrastination: "Лента часто помогает не начинать трудное дело. Так бывает у всех.",
  other: "Разобрать, что случилось, — уже полезный шаг.",
};

const NEXT_TIME: Record<TriggerId, string> = {
  boredom: "В следующий раз попробуй сначала короткую замену — скуке нужна новизна.",
  fatigue: "Сегодня лучше лечь пораньше, чем держаться на силе воли.",
  relax: "В следующий раз попробуй отдых без экрана — хотя бы пять минут.",
  sleepless: "Если снова не будет спаться, приглуши свет и отложи телефон подальше от кровати.",
  autopilot: "Помогает трение: убери приложение с первого экрана, и автопилоту станет сложнее.",
  stress: "В следующий раз начни с длинного выдоха или SOS-паузы — тело успокоится быстрее.",
  loneliness: "В следующий раз попробуй написать кому-то живому — это греет дольше.",
  procrastination: "В следующий раз начни дело с шага на две минуты — дальше обычно легче.",
  other: "Если захочется, добавь пару слов — так проще заметить, что повторяется.",
};

/**
 * A short, calm answer: understanding without blame, what the history says about this reason
 * (only real counts), and one small step for next time.
 */
export function buildReflection(
  slip: SlipEntry,
  trigger: TriggerId,
  slips: readonly SlipEntry[],
  isPro: boolean,
  note = "",
): Reflection {
  const twoWeeks = slips.filter(
    (entry) =>
      entry.timestamp > slip.timestamp - 14 * MS_PER_DAY &&
      entry.timestamp <= slip.timestamp &&
      (entry.id === slip.id ? trigger : entry.trigger) === trigger,
  ).length;
  const noun = getTrigger(trigger).noun;
  const late = isLate(hourOf(slip.timestamp), 21);

  let pattern: string;
  if (trigger === "other") {
    pattern = note.trim() ? "Спасибо, что рассказываешь своими словами — запомню." : "Запомню это.";
  } else if (twoWeeks >= 3) {
    pattern = `Это уже ${ordinalMasculine(twoWeeks)} раз за две недели, когда причина — ${noun}.`;
  } else if (twoWeeks === 2) {
    pattern = "Похожее было и на днях — запомню это.";
  } else {
    pattern = "Запомню это: чем честнее заметки, тем точнее мои советы.";
  }

  const sentences = [UNDERSTANDING[trigger], pattern];
  if (late && (trigger === "fatigue" || trigger === "sleepless")) {
    sentences.push(`Поздний вечер и ${noun} — сочетание, в котором лента почти всегда выигрывает.`);
  }
  if (!(trigger === "other" && note.trim())) sentences.push(NEXT_TIME[trigger]);
  sentences.push(
    variant(`${slip.id}:close`, [
      "Один срыв ничего не перечёркивает.",
      "Это один эпизод, а не итог дня.",
      "Завтра будет новый день.",
    ]),
  );

  // Late in the evening a calm replacement fits better than squats or a walk.
  const matching = suggestReplacements(trigger, isPro, 8).filter(
    (item) => !isLocked(item, isPro) && item.triggers.includes(trigger),
  );
  const calm = (item: (typeof matching)[number]) =>
    item.triggers.includes("relax") || item.triggers.includes("sleepless");
  const replacement = (late ? matching.find(calm) : undefined) ?? matching[0];
  return {
    text: sentences.join(" "),
    ...(replacement ? { replacementId: replacement.id } : {}),
  };
}
