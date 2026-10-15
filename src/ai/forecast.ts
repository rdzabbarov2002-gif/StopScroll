import {
  DAY_WORD_FORMS,
  SLIP_FORMS,
  capitalize,
  count,
  genitiveNumber,
  minutes,
  clock as hourClock,
  weekday,
} from "../coach/language";
import { DAY_FORMS, addDays } from "../utils/date";
import {
  type Day,
  type PartOfDay,
  type Timeline,
  dangerWindow,
  hourOf,
  isHard,
  isObserved,
  lossTimes,
  minuteOfDay,
  observedSince,
  partOfDay,
  streaks,
  urgeHours,
} from "./facts";
import type { AiForecast, AiMemory, RiskLevel } from "./types";

/**
 * Today's forecast, computed on the device — instantly, after every record, without a request.
 * The probability is the user's own empirical rate: how often the feed won from this time of day
 * on, on recent days and on the same weekday, adjusted for what already happened today. ChatGPT's
 * part comes from the memory: the dangerous periods it noticed and the personal advice.
 */

/** Days with records in the last four weeks before the forecast gives a number. */
export const FORECAST_MIN_DAYS = 5;

const PART: Record<PartOfDay, { adverb: string; hard: string }> = {
  morning: { adverb: "утром", hard: "Утро, скорее всего, будет непростым." },
  day: { adverb: "днём", hard: "День, скорее всего, будет непростым." },
  evening: { adverb: "вечером", hard: "Вечер, скорее всего, будет непростым." },
  night: { adverb: "ночью", hard: "Ночь, скорее всего, будет непростой." },
};

export const levelOf = (probability: number): RiskLevel =>
  probability >= 65 ? "high" : probability >= 35 ? "medium" : "low";

interface Reason {
  /** true — raises the risk, false — lowers it. */
  up: boolean;
  text: string;
}

export function buildForecast(t: Timeline, memory: AiMemory | null): AiForecast | null {
  if (!t.all.some(isObserved)) return null;
  const today = t.todayRecord;
  const nowMinute = minuteOfDay(t.now);
  const recent = observedSince(t, addDays(t.today, -28));
  const sameDay = t.past
    .filter((day) => day.weekday === today.weekday && isObserved(day))
    .slice(-8);

  // Did the feed win on that day from this time of day on?
  const restHard = (day: Day) =>
    lossTimes(day).some((timestamp) => minuteOfDay(timestamp) >= nowMinute) ||
    (nowMinute < 18 * 60 && day.feed !== null && day.feed > t.limit);
  const rate = (list: readonly Day[]) => (list.filter(restHard).length + 1) / (list.length + 2);

  // When the urges cluster (two months of slips and entries).
  const window = dangerWindow(urgeHours(t, 60));
  const wraps = window !== null && window.to !== 0 && window.to < window.from;
  const windowEnd = window ? (window.to === 0 ? 24 * 60 : window.to * 60) : 0;
  const inWindow = (hour: number) => window !== null && (hour - window.from + 24) % 24 < 3;
  const ahead = window !== null && (wraps || nowMinute < windowEnd);
  const lostInWindow = lossTimes(today).some((timestamp) => inWindow(hourOf(timestamp)));
  const passed =
    window !== null && !wraps && nowMinute >= windowEnd && !lostInWindow
      ? `Опасное время ${hourClock(window.from)}–${hourClock(window.to)} уже позади, и сегодня оно прошло спокойно.`
      : null;

  const lostToday = lossTimes(today).length > 0;
  const overToday = today.feed !== null && today.feed > t.limit;
  const yesterday = t.days.get(addDays(t.today, -1));
  const yesterdayHard =
    yesterday !== undefined && isObserved(yesterday) && isHard(yesterday, t.limit);
  const lastThreeSlips = t.past.slice(-3).reduce((sum, day) => sum + day.slips.length, 0);
  const streak = streaks(t).current;

  let probability: number | null = null;
  if (recent.length >= FORECAST_MIN_DAYS) {
    let p = sameDay.length >= 3 ? (rate(recent) + rate(sameDay)) / 2 : rate(recent);
    const raise = (share: number) => {
      p += (1 - p) * share;
    };
    if (overToday) raise(0.35);
    else if (lostToday) raise(0.25);
    if (yesterdayHard) raise(0.1);
    if (lastThreeSlips >= 2) raise(0.15);
    if (streak >= 3) p *= 0.85;
    if (passed) p *= 0.7;
    probability = Math.round(Math.min(0.97, Math.max(0.03, p)) * 100);
  }
  const level = probability === null ? null : levelOf(probability);

  const reasons: Reason[] = [];
  // ChatGPT's memory first: a dangerous period it noticed that applies to today.
  const zone = memory?.dangerZones.find(
    (item) =>
      (item.weekday === today.weekday || (item.weekday === null && item.from !== null)) &&
      (item.to === null || item.from === null || item.to < item.from || item.to * 60 > nowMinute),
  );
  if (zone) reasons.push({ up: true, text: zone.note || zone.title });

  if (overToday) {
    reasons.push({
      up: true,
      text: `Сегодня лимит уже исчерпан: ${minutes(today.feed!)} из ${minutes(t.limit)}.`,
    });
  } else if (lostToday) {
    reasons.push({
      up: true,
      text: today.slips.length
        ? "Сегодня уже был срыв — в такие дни импульсы обычно сильнее."
        : "Сегодня лента уже была открыта — в такие дни импульсы обычно сильнее.",
    });
  }

  if (window && ahead) {
    reasons.push({
      up: true,
      text: `${window.count} из ${window.total} срывов и записей за два месяца — между ${hourClock(window.from)} и ${hourClock(window.to)}.`,
    });
  }

  if (sameDay.length >= 3) {
    const hard = sameDay.filter((day) => isHard(day, t.limit)).length;
    const of = `из последних ${genitiveNumber(sameDay.length)}`;
    if (hard / sameDay.length >= 0.5) {
      reasons.push({
        up: true,
        text: `${hard} ${of} ${weekday(today.weekday, "genitivePlural")} были трудными.`,
      });
    } else if (hard / sameDay.length <= 0.2) {
      reasons.push({
        up: false,
        text: `${capitalize(weekday(today.weekday, "accusative"))} обычно спокойно: трудных дней — ${hard} ${of}.`,
      });
    }
  }

  if (yesterdayHard) {
    // How the day after a hard day usually goes for this user.
    const after = t.past.filter((day) => {
      const before = t.days.get(addDays(day.key, -1));
      return (
        isObserved(day) && before !== undefined && isObserved(before) && isHard(before, t.limit)
      );
    });
    const hardAfter = after.filter((day) => isHard(day, t.limit)).length;
    if (after.length >= 4 && hardAfter / after.length >= 0.5) {
      reasons.push({
        up: true,
        text: `Вчера был трудный день, а после таких дней следующий бывает трудным в ${hardAfter} из ${after.length} случаев.`,
      });
    } else if (after.length >= 4) {
      reasons.push({
        up: false,
        text: `Вчера был трудный день, но обычно вы быстро возвращаетесь: после таких дней трудным бывает ${hardAfter} из ${after.length}.`,
      });
    } else {
      reasons.push({ up: true, text: "Вчера был трудный день." });
    }
  }

  if (lastThreeSlips >= 2) {
    reasons.push({
      up: true,
      text: `За последние три дня было ${count(lastThreeSlips, SLIP_FORMS)} — импульсы сейчас сильнее обычного.`,
    });
  }
  if (streak >= 3) {
    reasons.push({
      up: false,
      text: `${capitalize(count(streak, DAY_WORD_FORMS))} подряд вы держитесь в пределах лимита.`,
    });
  }
  const lastWeek = observedSince(t, addDays(t.today, -7));
  if (lastWeek.length >= 4 && lastWeek.every((day) => lossTimes(day).length === 0)) {
    reasons.push({ up: false, text: "За последнюю неделю лента ни разу не победила." });
  }

  const ordered =
    level === "low"
      ? [...reasons.filter((item) => !item.up), ...reasons.filter((item) => item.up)]
      : [...reasons.filter((item) => item.up), ...reasons.filter((item) => !item.up)];
  const texts = ordered.slice(0, 4).map((item) => item.text);

  const part = window && ahead ? partOfDay((window.from + 1) % 24) : partOfDay(hourOf(t.now));
  // After the feed already won today, the forecast is about the rest of the day.
  const rest = lostToday || overToday;
  const headline =
    probability === null
      ? "Прогноз пока предварительный: истории ещё мало."
      : passed && level !== "high"
        ? "Самое трудное время сегодня позади."
        : level === "high"
          ? PART[part].hard
          : level === "medium"
            ? `${rest ? "Остаток дня" : "День"} может быть непростым${window && ahead ? ` — особенно ${PART[part].adverb}` : ""}.`
            : rest
              ? "Похоже, остаток дня пройдёт спокойнее."
              : "Похоже, день будет спокойным.";

  // Personal advice from the memory, for the time that matters today.
  const tips = memory?.tips ?? [];
  const tip = tips.find((item) => item.when === part) ?? tips.find((item) => item.when === "any");
  const advice =
    tip?.text ??
    (window && ahead
      ? `Решите заранее, чем займёте время с ${hourClock(window.from)} до ${hourClock(window.to)} вместо ленты.`
      : null);

  return {
    probability,
    level,
    headline,
    reasons: texts.length
      ? texts
      : probability === null
        ? [
            `Для прогноза нужно хотя бы ${FORECAST_MIN_DAYS} дней с записями за четыре недели — пока их ${recent.length}.`,
          ]
        : ["Явных сигналов риска сегодня нет."],
    window: {
      until: window && ahead ? hourClock(window.to) : null,
      message:
        window && ahead && probability !== null
          ? rest
            ? `Если удастся больше не открывать ленту до ${hourClock(window.to)}, остаток дня пройдёт спокойнее.`
            : `Если удастся не открыть ленту до ${hourClock(window.to)}, шанс спокойного дня заметно вырастет.`
          : null,
    },
    passed,
    advice,
    basis: `история за ${count(t.all.filter(isObserved).length, DAY_FORMS)}`,
    day: t.today,
    createdAt: t.now,
  };
}
