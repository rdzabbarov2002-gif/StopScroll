// Builds the comparison report from outputs.jsonl (+ judge.jsonl when present):
// automatic metrics, judged quality and the kind of errors, gist retention, disagreements,
// measured cost and its projection, hybrid routing rules, and the decision by criteria that
// were fixed in this file before any result was seen.
//
//   node --no-warnings eval/report.mjs --name main --pair nano,mini
import { writeFileSync } from "node:fs";

import { ARMS, args, cost, hasStem, norm, phraseStems, readJson, readJsonl, resultsDir } from "./lib.mjs";

const options = args({
  name: "main",
  pair: "nano,mini",
  // Entries per user per day: an active user and a typical one.
  perDay: "5,2",
  users: "100,1000,10000",
  // The weekly deep analysis per user per day (it does not depend on the /entry model).
  deepPerDay: "0.0039",
});
const [X, Y] = String(options.pair).split(",");
const dir = resultsDir(options.name);
const entries = readJson("entries.json");
const prices = readJson("prices.json");
const outputs = readJsonl(`${dir}/outputs.jsonl`);
const judgements = readJsonl(`${dir}/judge.jsonl`).filter((row) => row.pair === `${X},${Y}`);
const byId = new Map(entries.map((entry) => [entry.id, entry]));

const CATEGORY = {
  very_short: "очень короткие",
  long: "длинные",
  emotional: "эмоциональные",
  confusing: "запутанные",
  ambiguous: "неоднозначные",
  multi_cause: "несколько причин",
  insufficient: "нехватка информации",
  autopilot: "автоматическое открытие",
  stress: "стресс",
  boredom: "скука",
  procrastination: "прокрастинация",
  after_work: "после работы",
  night: "ночью",
  after_conflict: "после конфликта",
  after_walk: "после прогулки",
  good_day: "после хорошего дня",
  bad_day: "после плохого дня",
  unknown_cause: "сам не знает причину",
  hidden_pattern: "скрытые закономерности",
};

// ---------------------------------------------------------------------------------------------
// Decision criteria — fixed before the run. Changing them after seeing results defeats the point.
// ---------------------------------------------------------------------------------------------
const CRITERIA = {
  /** Records where the cheap model misunderstood the meaning: at most this share... */
  maxCriticalRate: 0.03,
  /** ...and at most this many percentage points more than the expensive model. */
  maxCriticalGap: 0.02,
  /** Serious errors (a lost or distorted important detail, or misread meaning). */
  maxSevereGap: 0.05,
  /** Judged gist quality relative to the expensive model, and the mustKeep retention gap. */
  minGistRatio: 0.9,
  maxRetentionGap: 0.05,
  /** Judged overall quality relative to the expensive model. */
  minOverallRatio: 0.92,
  /** A hybrid is worth it only if it sends at most this share of entries to the expensive model. */
  maxEscalation: 0.35,
};

// Routing rules for a hybrid, also fixed before the run. PRE — decided on the phone before the
// request; POST — the cheap model answers first and its answer triggers the expensive one.
const UNCERTAIN = /не знаю|не понимаю|хз|без причины|просто так|непонятно|сам не|сама не|не могу понять|почему-то|сам хз/;
const MULTI = /(^|[\s,])(и ещё|а ещё|плюс|потом|к тому же|вдобавок|да ещё|а тут|и тут)(?=[\s,.]|$)/g;
const features = (entry) => {
  const text = norm(entry.text);
  const sentences = entry.text.split(/[.!?…\n]+/).filter((part) => part.trim().length > 3).length;
  const caps = (entry.text.match(/\b[А-ЯЁA-Z]{3,}\b/g) ?? []).length;
  return {
    long: entry.text.length > 350,
    uncertain: UNCERTAIN.test(text),
    multi: (text.match(MULTI) ?? []).length >= 1 || sentences >= 4,
    intense: /!{2,}/.test(entry.text) || caps >= 2,
  };
};
// Each rule says, per entry: "pre" — straight to the expensive model; "post" — the cheap model
// answered first and the expensive one was asked again; false — the cheap answer is kept.
const preRule = (entry) => {
  const f = features(entry);
  return f.long || f.uncertain || f.multi;
};
const unsure = (cheap) =>
  !cheap?.parsed || cheap.parsed.analysis.enough === false || cheap.parsed.analysis.cause === null;
const RULES = {
  "PRE: длинная / «не знаю» / несколько линий": (entry) => (preRule(entry) ? "pre" : false),
  "PRE: только длинная (>350 символов)": (entry) => (features(entry).long ? "pre" : false),
  "POST: дешёвая модель не уверена (enough=false, cause=null или ответ непригоден)": (entry, cheap) =>
    unsure(cheap) ? "post" : false,
  "PRE + POST": (entry, cheap) => (preRule(entry) ? "pre" : unsure(cheap) ? "post" : false),
};

// ---------------------------------------------------------------------------------------------
const pct = (value) => (Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—");
const num = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : "—");
const usd = (value) => (Number.isFinite(value) ? `$${value < 1 ? value.toFixed(4) : value.toFixed(2)}` : "—");
const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN);
const quantile = (values, q) => {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
};
const cut = (text, max = 280) => (text.length > max ? `${text.slice(0, max)}…` : text);
const cell = (value) => String(value ?? "—").replace(/\|/g, "/").replace(/\n/g, " ");

const rows = (arm) => outputs.filter((row) => row.arm === arm);
const firstOf = (arm, id) =>
  outputs.filter((row) => row.arm === arm && row.entryId === id).sort((a, b) => a.repeat - b.repeat)[0];

// Automatic metrics over the first answer of each entry; consistency over all repeats.
function automatic(arm) {
  const all = rows(arm);
  const first = entries.map((entry) => ({ entry, row: firstOf(arm, entry.id) })).filter((item) => item.row);
  const ok = first.filter((item) => item.row.status === 200 && item.row.parsed);
  const analysis = (item) => item.row.parsed.analysis;
  const gold = (item) => item.entry.gold;

  const enoughGold = ok.filter((item) => gold(item).enough !== "either");
  const enoughRight = enoughGold.filter((item) => analysis(item).enough === (gold(item).enough === "yes"));
  const unknown = ok.filter((item) => gold(item).unknownCause);
  const overconfident = unknown.filter(
    (item) =>
      analysis(item).enough === true &&
      analysis(item).cause !== null &&
      !/неясн|непонят|неизвест|без явн|не ясн|не определ/.test(norm(analysis(item).cause)),
  );

  let facts = 0;
  let kept = 0;
  let allKept = 0;
  let overLength = 0;
  const gistLengths = [];
  for (const item of ok) {
    const gist = analysis(item).gist ?? "";
    gistLengths.push(gist.length);
    if (gist.length > 90) overLength += 1;
    const must = gold(item).mustKeep;
    const hits = must.filter((fact) => hasStem(gist, fact.stems)).length;
    facts += must.length;
    kept += hits;
    if (hits === must.length) allKept += 1;
  }

  const multi = ok.filter((item) => gold(item).secondaryCauses.length > 0);
  const multiCovered = multi.filter((item) => {
    const text = [analysis(item).cause, analysis(item).context, analysis(item).gist, ...analysis(item).tags].join(" ");
    const causes = [gold(item).primaryCause, ...gold(item).secondaryCauses];
    return causes.filter((cause) => hasStem(text, phraseStems(cause))).length >= 2;
  });

  const withMemory = ok.filter((item) => item.entry.memory === "standard");
  let goldVotes = 0;
  let modelVotes = 0;
  let rightVotes = 0;
  let wrongSign = 0;
  for (const item of withMemory) {
    const expected = new Map(gold(item).votes.map((vote) => [vote.id, vote.effect]));
    goldVotes += expected.size;
    for (const vote of item.row.parsed.votes) {
      modelVotes += 1;
      if (expected.get(vote.id) === vote.effect) rightVotes += 1;
      else if (expected.has(vote.id)) wrongSign += 1;
    }
  }
  const insightNone = ok.filter((item) => gold(item).insight === "none");
  const insightExpected = ok.filter((item) => gold(item).insight === "expected");

  // Consistency: the same entry asked several times.
  const groups = new Map();
  for (const row of all.filter((item) => item.status === 200 && item.parsed)) {
    const list = groups.get(row.entryId) ?? [];
    list.push(row.parsed.analysis);
    groups.set(row.entryId, list);
  }
  const repeated = [...groups.values()].filter((list) => list.length >= 2);
  const jaccard = (a, b) => {
    const left = new Set(a.map(norm));
    const right = new Set(b.map(norm));
    const union = new Set([...left, ...right]);
    return union.size ? [...left].filter((tag) => right.has(tag)).length / union.size : 1;
  };
  const sameEnough = repeated.filter((list) => list.every((item) => item.enough === list[0].enough)).length;
  const tagAgreement = mean(repeated.map((list) => mean(list.slice(1).map((item) => jaccard(item.tags, list[0].tags)))));

  const done = all.filter((row) => row.usage);
  return {
    calls: all.length,
    failed: all.filter((row) => row.status !== 200).length,
    unusable: all.filter((row) => row.status === 502).length,
    parseFailed: all.filter((row) => row.status === 200 && !row.parsed).length,
    enoughAccuracy: enoughRight.length / enoughGold.length,
    overconfidentUnknown: unknown.length ? overconfident.length / unknown.length : NaN,
    unknownCount: unknown.length,
    retention: kept / facts,
    allKept: allKept / ok.length,
    overLength: overLength / ok.length,
    gistMedian: quantile(gistLengths, 0.5),
    multiCovered: multi.length ? multiCovered.length / multi.length : NaN,
    multiCount: multi.length,
    votePrecision: modelVotes ? rightVotes / modelVotes : NaN,
    voteRecall: goldVotes ? rightVotes / goldVotes : NaN,
    wrongSign,
    falseInsight: insightNone.length ? insightNone.filter((item) => analysis(item).explanation).length / insightNone.length : NaN,
    foundInsight: insightExpected.length
      ? insightExpected.filter((item) => analysis(item).explanation).length / insightExpected.length
      : NaN,
    sameEnough: repeated.length ? sameEnough / repeated.length : NaN,
    tagAgreement,
    latency50: quantile(done.map((row) => row.latencyMs), 0.5),
    latency90: quantile(done.map((row) => row.latencyMs), 0.9),
    input: mean(done.map((row) => row.usage.input)),
    cached: mean(done.map((row) => row.usage.cached)),
    output: mean(done.map((row) => row.usage.output)),
    reasoning: mean(done.map((row) => row.usage.reasoning)),
    costPerCall: mean(done.map((row) => cost(row.model, row.usage, prices))),
  };
}

// Judged scores per entry and arm: both orders averaged; severity — the worse of the two.
const FIELDS = ["cause", "emotion", "context", "behavior", "gist", "insight", "votes", "enough"];
const RANK = { none: 0, slight: 1, significant: 2, wrong_meaning: 3 };
const IMPACT = { none: 0, low: 1, medium: 2, high: 3 };
function judged() {
  const result = new Map();
  for (const row of judgements) {
    for (const letter of ["A", "B"]) {
      const arm = row.map[letter];
      const key = `${row.entryId}|${arm}`;
      const item = result.get(key) ?? { entryId: row.entryId, arm, sides: [], wins: 0, losses: 0, ties: 0, reasons: [] };
      item.sides.push(row.verdict[letter]);
      if (row.verdict.winner === "tie") item.ties += 1;
      else if (row.verdict.winner === letter) item.wins += 1;
      else item.losses += 1;
      item.reasons.push(row.verdict.winnerReason);
      result.set(key, item);
    }
  }
  for (const item of result.values()) {
    const entry = byId.get(item.entryId);
    const fields = FIELDS.filter((field) => field !== "votes" || entry.memory === "standard");
    item.scores = Object.fromEntries(FIELDS.map((field) => [field, mean(item.sides.map((side) => side[field]))]));
    item.overall = mean(fields.map((field) => item.scores[field])) / 3;
    item.severity = item.sides.reduce((worst, side) => (RANK[side.severity] > RANK[worst] ? side.severity : worst), "none");
    item.impact = item.sides.reduce((worst, side) => (IMPACT[side.memoryImpact] > IMPACT[worst] ? side.memoryImpact : worst), "none");
    item.errors = [...new Set(item.sides.flatMap((side) => side.errors))];
    item.gistLost = [...new Set(item.sides.flatMap((side) => side.gistLost))];
    item.impactReason = item.sides.map((side) => side.memoryImpactReason).join(" / ");
  }
  return result;
}

// A seeded bootstrap over entries for the difference in a per-entry rate.
function bootstrap(values, rounds = 2000) {
  let seed = 12345;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
  const stats = [];
  for (let round = 0; round < rounds; round += 1) {
    let sum = 0;
    for (let index = 0; index < values.length; index += 1) sum += values[Math.floor(random() * values.length)];
    stats.push(sum / values.length);
  }
  return [quantile(stats, 0.025), quantile(stats, 0.975)];
}

const autoX = automatic(X);
const autoY = automatic(Y);
const J = judged();
const haveJudge = J.size > 0;
const judgedIds = entries.map((entry) => entry.id).filter((id) => J.has(`${id}|${X}`) && J.has(`${id}|${Y}`));
const jx = (id) => J.get(`${id}|${X}`);
const jy = (id) => J.get(`${id}|${Y}`);
const severe = (item) => RANK[item.severity] >= 2;
const critical = (item) => item.severity === "wrong_meaning";

const md = [];
const push = (...lines) => md.push(...lines);
push(
  `# Разбор записей: ${ARMS[X]?.model ?? X} против ${ARMS[Y]?.model ?? Y}`,
  "",
  `Записей: ${entries.length}. Вызовов: ${X} — ${autoX.calls}, ${Y} — ${autoY.calls}. Судья: ${judgements[0]?.judge ?? "не запускался"}, оценено записей: ${judgedIds.length}.`,
  "Код запроса — настоящий (`server/ai-coach/src/index.ts` → `handle()`), разбор ответа — код приложения (`parseEntryResult`).",
  "",
  "## Автоматические метрики",
  "",
  `| Метрика | ${X} | ${Y} |`,
  "|---|---|---|",
  `| Неудачных вызовов (в т. ч. непригодный ответ 502) | ${autoX.failed} (${autoX.unusable}) | ${autoY.failed} (${autoY.unusable}) |`,
  `| Ответ не прошёл проверку приложения | ${autoX.parseFailed} | ${autoY.parseFailed} |`,
  `| enough совпадает с эталоном | ${pct(autoX.enoughAccuracy)} | ${pct(autoY.enoughAccuracy)} |`,
  `| Уверенная причина там, где пользователь сам не знает (из ${autoX.unknownCount}) | ${pct(autoX.overconfidentUnknown)} | ${pct(autoY.overconfidentUnknown)} |`,
  `| gist: сохранено важных фактов (mustKeep, по основам слов) | ${pct(autoX.retention)} | ${pct(autoY.retention)} |`,
  `| gist: сохранены все важные факты | ${pct(autoX.allKept)} | ${pct(autoY.allKept)} |`,
  `| gist длиннее 90 символов / медиана длины | ${pct(autoX.overLength)} / ${num(autoX.gistMedian, 0)} | ${pct(autoY.overLength)} / ${num(autoY.gistMedian, 0)} |`,
  `| Несколько причин: отражены хотя бы две (из ${autoX.multiCount}) | ${pct(autoX.multiCovered)} | ${pct(autoY.multiCovered)} |`,
  `| Голоса за гипотезы: точность / полнота / с обратным знаком | ${pct(autoX.votePrecision)} / ${pct(autoX.voteRecall)} / ${autoX.wrongSign} | ${pct(autoY.votePrecision)} / ${pct(autoY.voteRecall)} / ${autoY.wrongSign} |`,
  `| insight там, где эталон «связи нет» (ложная связь) | ${pct(autoX.falseInsight)} | ${pct(autoY.falseInsight)} |`,
  `| insight там, где связь есть | ${pct(autoX.foundInsight)} | ${pct(autoY.foundInsight)} |`,
  `| Стабильность: одинаковый enough во всех повторах / совпадение тегов | ${pct(autoX.sameEnough)} / ${pct(autoX.tagAgreement)} | ${pct(autoY.sameEnough)} / ${pct(autoY.tagAgreement)} |`,
  `| Задержка p50 / p90 | ${num(autoX.latency50 / 1000, 1)} с / ${num(autoX.latency90 / 1000, 1)} с | ${num(autoY.latency50 / 1000, 1)} с / ${num(autoY.latency90 / 1000, 1)} с |`,
  `| Токены: вход (из кэша) / выход (из них рассуждение) | ${num(autoX.input, 0)} (${num(autoX.cached, 0)}) / ${num(autoX.output, 0)} (${num(autoX.reasoning, 0)}) | ${num(autoY.input, 0)} (${num(autoY.cached, 0)}) / ${num(autoY.output, 0)} (${num(autoY.reasoning, 0)}) |`,
  `| Цена одного разбора (измерено) | ${usd(autoX.costPerCall)} | ${usd(autoY.costPerCall)} |`,
  "",
  "Совпадение фактов gist по основам слов — грубая оценка (перефразировку она может не узнать); смысловую оценку даёт судья ниже.",
  "",
);

let verdict = null;
if (haveJudge) {
  const field = (arm, name) => mean(judgedIds.map((id) => J.get(`${id}|${arm}`).scores[name])) / 3;
  const severity = (arm, level) => judgedIds.filter((id) => J.get(`${id}|${arm}`).severity === level).length / judgedIds.length;
  const impact = (arm, level) => judgedIds.filter((id) => J.get(`${id}|${arm}`).impact === level).length / judgedIds.length;
  const overallX = mean(judgedIds.map((id) => jx(id).overall));
  const overallY = mean(judgedIds.map((id) => jy(id).overall));
  const severeX = judgedIds.filter((id) => severe(jx(id))).length / judgedIds.length;
  const severeY = judgedIds.filter((id) => severe(jy(id))).length / judgedIds.length;
  const criticalX = severity(X, "wrong_meaning");
  const criticalY = severity(Y, "wrong_meaning");
  const diffSevere = bootstrap(judgedIds.map((id) => Number(severe(jx(id))) - Number(severe(jy(id)))));
  const diffOverall = bootstrap(judgedIds.map((id) => jx(id).overall - jy(id).overall));
  const wins = judgedIds.reduce((sum, id) => sum + jx(id).wins, 0);
  const losses = judgedIds.reduce((sum, id) => sum + jx(id).losses, 0);
  const ties = judgedIds.reduce((sum, id) => sum + jx(id).ties, 0);

  push(
    "## Оценка судьи (вслепую, оба порядка A/B)",
    "",
    `| Поле (среднее, % от максимума) | ${X} | ${Y} |`,
    "|---|---|---|",
    ...FIELDS.map((name) => `| ${name} | ${pct(field(X, name))} | ${pct(field(Y, name))} |`),
    `| **Итого** | **${pct(overallX)}** | **${pct(overallY)}** |`,
    "",
    `Разница «итого» ${X} − ${Y}: ${num((overallX - overallY) * 100, 1)} п. п. (95% интервал ${num(diffOverall[0] * 100, 1)}…${num(diffOverall[1] * 100, 1)}).`,
    `Сравнение лоб в лоб (${judgedIds.length * 2} оценок): ${X} лучше — ${wins}, хуже — ${losses}, равны — ${ties}.`,
    "",
    "### Качество ошибок",
    "",
    `| Худшая ошибка в записи | ${X} | ${Y} |`,
    "|---|---|---|",
    `| нет ошибок | ${pct(severity(X, "none"))} | ${pct(severity(Y, "none"))} |`,
    `| лёгкая (смысл сохранён) | ${pct(severity(X, "slight"))} | ${pct(severity(Y, "slight"))} |`,
    `| серьёзная (потеряна или искажена важная деталь) | ${pct(severity(X, "significant"))} | ${pct(severity(Y, "significant"))} |`,
    `| **смысл понят неправильно** | **${pct(criticalX)}** | **${pct(criticalY)}** |`,
    "",
    `Доля серьёзных и грубых ошибок: ${X} — ${pct(severeX)}, ${Y} — ${pct(severeY)}; разница ${num((severeX - severeY) * 100, 1)} п. п. (95% интервал ${num(diffSevere[0] * 100, 1)}…${num(diffSevere[1] * 100, 1)}).`,
    "",
    `| Влияние на долгосрочную память | ${X} | ${Y} |`,
    "|---|---|---|",
    ...["none", "low", "medium", "high"].map((level) => `| ${level} | ${pct(impact(X, level))} | ${pct(impact(Y, level))} |`),
    "",
    "### По типам записей",
    "",
    `| Тип | Записей | Итого ${X} | Итого ${Y} | Серьёзных ${X} | Серьёзных ${Y} |`,
    "|---|---|---|---|---|---|",
  );
  for (const [id, label] of Object.entries(CATEGORY)) {
    const ids = judgedIds.filter((entryId) => byId.get(entryId).categories.includes(id));
    if (!ids.length) continue;
    const share = (arm) => ids.filter((entryId) => severe(J.get(`${entryId}|${arm}`))).length / ids.length;
    push(
      `| ${label} | ${ids.length} | ${pct(mean(ids.map((entryId) => jx(entryId).overall)))} | ${pct(mean(ids.map((entryId) => jy(entryId).overall)))} | ${pct(share(X))} | ${pct(share(Y))} |`,
    );
  }

  const describe = (row) =>
    row?.parsed
      ? `причина: ${cell(row.parsed.analysis.cause)}; состояние: ${cell(row.parsed.analysis.emotion)}; поведение: ${cell(row.parsed.analysis.behavior)}; gist: «${cell(row.parsed.analysis.gist)}»${row.parsed.analysis.explanation ? `; insight: ${cell(row.parsed.analysis.explanation)}` : ""}`
      : `нет ответа (${row?.status})`;
  const cases = judgedIds
    .map((id) => {
      const x = jx(id);
      const y = jy(id);
      return { id, x, y, gap: Math.abs(x.overall - y.overall), severityGap: RANK[x.severity] - RANK[y.severity] };
    })
    .filter((item) => item.gap >= 0.12 || Math.abs(item.severityGap) >= 2 || (item.x.wins === 2 || item.x.losses === 2))
    .sort((a, b) => b.gap - a.gap || Math.abs(b.severityGap) - Math.abs(a.severityGap));
  writeFileSync(`${dir}/disagreements.json`, JSON.stringify(cases.map((item) => ({ id: item.id, ...item })), null, 1));

  push(
    "",
    `## Где модели разошлись (${cases.length})`,
    "",
    "Записи, где разница в оценке заметна, уровень ошибок отличается на две ступени или судья оба раза выбрал одну модель. Полный список — `disagreements.json`.",
    "",
  );
  for (const item of cases.slice(0, 60)) {
    const entry = byId.get(item.id);
    const better = item.x.overall > item.y.overall ? X : item.y.overall > item.x.overall ? Y : "поровну";
    push(
      `### ${item.id} · ${entry.categories.map((id) => CATEGORY[id] ?? id).join(", ")} · точнее: ${better}`,
      "",
      `> ${cut(entry.text).replace(/\n/g, " ")}`,
      "",
      `- **${X}** (${pct(item.x.overall)}, ошибка: ${item.x.severity}, память: ${item.x.impact}): ${describe(firstOf(X, item.id))}`,
      `  - ошибки: ${item.x.errors.join("; ") || "—"}${item.x.gistLost.length ? `; потеряно в gist: ${item.x.gistLost.join(", ")}` : ""}`,
      `  - влияние на память: ${item.x.impactReason}`,
      `- **${Y}** (${pct(item.y.overall)}, ошибка: ${item.y.severity}, память: ${item.y.impact}): ${describe(firstOf(Y, item.id))}`,
      `  - ошибки: ${item.y.errors.join("; ") || "—"}${item.y.gistLost.length ? `; потеряно в gist: ${item.y.gistLost.join(", ")}` : ""}`,
      `  - влияние на память: ${item.y.impactReason}`,
      `- эталон: ${entry.gold.primaryCause}${entry.gold.secondaryCauses.length ? ` (+ ${entry.gold.secondaryCauses.join(", ")})` : ""}; важно сохранить: ${entry.gold.mustKeep.map((fact) => fact.fact).join("; ")}`,
      "",
    );
  }

  push("## Gist", "");
  const gistCases = judgedIds.filter((id) => jx(id).scores.gist <= jy(id).scores.gist - 1);
  const gistCasesReverse = judgedIds.filter((id) => jy(id).scores.gist <= jx(id).scores.gist - 1);
  push(
    `- Средняя оценка gist: ${X} — ${pct(field(X, "gist"))}, ${Y} — ${pct(field(Y, "gist"))}.`,
    `- ${Y} сохранил важное, а ${X} потерял (gist хуже на балл и больше): ${gistCases.length} записей; наоборот: ${gistCasesReverse.length}.`,
    `- Записей, где у ${X} судья отметил потерянные факты: ${judgedIds.filter((id) => jx(id).gistLost.length).length}; у ${Y}: ${judgedIds.filter((id) => jy(id).gistLost.length).length}.`,
    "",
  );
  for (const id of gistCases.slice(0, 25)) {
    push(
      `- **${id}**: ${X}: «${cell(firstOf(X, id)?.parsed?.analysis.gist)}» → потеряно: ${jx(id).gistLost.join(", ") || "—"}; ${Y}: «${cell(firstOf(Y, id)?.parsed?.analysis.gist)}»`,
    );
  }
  push("");

  push("## Все случаи «смысл понят неправильно»", "");
  for (const arm of [X, Y]) {
    const list = judgedIds.filter((id) => critical(J.get(`${id}|${arm}`)));
    push(`**${arm}** — ${list.length}:`, "");
    for (const id of list) {
      push(`- ${id}: «${cut(byId.get(id).text, 160).replace(/\n/g, " ")}» — ${J.get(`${id}|${arm}`).errors.join("; ")}`);
    }
    push("");
  }

  // Hybrid routing, evaluated on the same entries.
  const costOf = (arm, id) => {
    const row = firstOf(arm, id);
    return row?.usage ? cost(row.model, row.usage, prices) : arm === X ? autoX.costPerCall : autoY.costPerCall;
  };
  const evaluate = (route) => {
    const picked = judgedIds.map((id) => {
      const mode = route(byId.get(id), firstOf(X, id));
      const spent =
        mode === "pre" ? costOf(Y, id) : mode === "post" ? costOf(X, id) + costOf(Y, id) : costOf(X, id);
      return { escalate: Boolean(mode), spent, item: mode ? jy(id) : jx(id) };
    });
    return {
      escalation: picked.filter((item) => item.escalate).length / picked.length,
      costPerEntry: mean(picked.map((item) => item.spent)),
      overall: mean(picked.map((item) => item.item.overall)),
      severe: picked.filter((item) => severe(item.item)).length / picked.length,
      critical: picked.filter((item) => critical(item.item)).length / picked.length,
      gist: mean(picked.map((item) => item.item.scores.gist)) / 3,
    };
  };
  const plans = [
    ["Всё на " + X, evaluate(() => false)],
    ["Всё на " + Y, evaluate(() => "pre")],
    ...Object.entries(RULES).map(([name, rule]) => [name, evaluate(rule)]),
    [
      `Оракул: ${Y} ровно там, где у ${X} серьёзная ошибка (предел, недостижимый на практике)`,
      evaluate((entry) => (severe(jx(entry.id)) ? "post" : false)),
    ],
  ];
  push(
    "## Гибрид: какие записи отдавать дорогой модели",
    "",
    "Правила зафиксированы в коде до прогона. PRE решает на телефоне по тексту записи; POST сначала спрашивает дешёвую модель и повторяет запрос на дорогой, если ответ неуверенный.",
    "",
    "| План | На дорогую модель | Цена разбора | Итого | Серьёзных | Смысл неверен | gist |",
    "|---|---|---|---|---|---|---|",
    ...plans.map(([name, plan]) => `| ${name} | ${pct(plan.escalation)} | ${usd(plan.costPerEntry)} | ${pct(plan.overall)} | ${pct(plan.severe)} | ${pct(plan.critical)} | ${pct(plan.gist)} |`),
    "",
  );

  // The decision, by the criteria fixed above.
  const passes = (plan) => {
    const all = plans[1][1];
    return (
      plan.critical <= CRITERIA.maxCriticalRate &&
      plan.critical <= all.critical + CRITERIA.maxCriticalGap &&
      plan.severe <= all.severe + CRITERIA.maxSevereGap &&
      plan.gist >= all.gist * CRITERIA.minGistRatio &&
      plan.overall >= all.overall * CRITERIA.minOverallRatio
    );
  };
  const retentionOk = autoY.retention - autoX.retention <= CRITERIA.maxRetentionGap;
  const nanoPlan = plans[0][1];
  const hybrids = plans.slice(2, -1).filter(([, plan]) => plan.escalation <= CRITERIA.maxEscalation && passes(plan));
  hybrids.sort((a, b) => a[1].costPerEntry - b[1].costPerEntry);
  verdict =
    passes(nanoPlan) && retentionOk
      ? `${X} достаточно: все критерии выполнены.`
      : hybrids.length
        ? `Гибрид: «${hybrids[0][0]}» — ${pct(hybrids[0][1].escalation)} записей на ${Y}, критерии выполнены.`
        : `${Y}: ни ${X}, ни гибридные правила не выполняют критерии качества.`;
  push(
    "## Решение по заранее заданным критериям",
    "",
    `- Грубых ошибок смысла у ${X} ≤ ${pct(CRITERIA.maxCriticalRate)} и не больше чем у ${Y} + ${CRITERIA.maxCriticalGap * 100} п. п.: ${nanoPlan.critical <= CRITERIA.maxCriticalRate && nanoPlan.critical <= plans[1][1].critical + CRITERIA.maxCriticalGap ? "да" : "нет"} (${pct(nanoPlan.critical)} против ${pct(plans[1][1].critical)})`,
    `- Серьёзных ошибок не больше чем у ${Y} + ${CRITERIA.maxSevereGap * 100} п. п.: ${nanoPlan.severe <= plans[1][1].severe + CRITERIA.maxSevereGap ? "да" : "нет"} (${pct(nanoPlan.severe)} против ${pct(plans[1][1].severe)})`,
    `- gist не хуже ${CRITERIA.minGistRatio * 100}% от ${Y} и разрыв в сохранении фактов ≤ ${CRITERIA.maxRetentionGap * 100} п. п.: ${nanoPlan.gist >= plans[1][1].gist * CRITERIA.minGistRatio && retentionOk ? "да" : "нет"} (${pct(nanoPlan.gist)} против ${pct(plans[1][1].gist)}; факты ${pct(autoX.retention)} против ${pct(autoY.retention)})`,
    `- Итоговое качество не хуже ${CRITERIA.minOverallRatio * 100}% от ${Y}: ${nanoPlan.overall >= plans[1][1].overall * CRITERIA.minOverallRatio ? "да" : "нет"} (${pct(nanoPlan.overall)} против ${pct(plans[1][1].overall)})`,
    "",
    `**Итог: ${verdict}**`,
    "",
  );
}

// Money: measured cost per entry, projected per user and per audience.
const perDay = String(options.perDay).split(",").map(Number);
const users = String(options.users).split(",").map(Number);
const deep = Number(options.deepPerDay);
push(
  "## Стоимость",
  "",
  `Цена разбора (измерено): ${X} — ${usd(autoX.costPerCall)}, ${Y} — ${usd(autoY.costPerCall)} (в ${num(autoY.costPerCall / autoX.costPerCall, 1)} раза дороже). Глубокий анализ раз в неделю — ${usd(deep)} на пользователя в день, от выбора модели для записей не зависит. Цены: ${prices.note}`,
  "",
  `| Записей в день | Пользователей | ${X}, в месяц | ${Y}, в месяц | Переход на ${Y}, +в месяц |`,
  "|---|---|---|---|---|",
);
for (const count of perDay) {
  for (const audience of users) {
    const month = (perCall) => audience * 30 * (count * perCall + deep);
    push(
      `| ${count} | ${audience} | ${usd(month(autoX.costPerCall))} | ${usd(month(autoY.costPerCall))} | ${usd(month(autoY.costPerCall) - month(autoX.costPerCall))} |`,
    );
  }
}
push("");

writeFileSync(`${dir}/report.md`, md.join("\n"));
writeFileSync(`${dir}/summary.json`, JSON.stringify({ automatic: { [X]: autoX, [Y]: autoY }, judged: judgedIds.length, verdict }, null, 1));
console.log(`report → ${dir}/report.md`);
if (verdict) console.log(verdict);
