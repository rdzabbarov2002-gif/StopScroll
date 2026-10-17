import type { Messages, Months, Week } from "./ru";

/** "4 Ekim" */
const MONTHS: Months = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** "4 Eki" */
const MONTHS_SHORT: Months = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const WEEKDAYS: Week = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const WEEKDAYS_SHORT: Week = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const withYear = (text: string, year?: number) => (year === undefined ? text : `${text} ${year}`);

export const tr: Messages = {
  tabs: {
    home: "Ana Sayfa",
    ai: "AI",
    replacements: "Alternatifler",
    stats: "İstatistik",
    journal: "Günlük",
  },
  back: "Geri",
  close: "Kapat",
  closeSheet: "Pencereyi kapat",
  noData: "veri yok",
  sos: {
    label: "SOS molası",
    hint: "Dürtünün geçmesi için 15 saniyelik bir nefes molası açar",
  },
  pro: {
    lockedCard: (title: string) => `${title}. StopScroll Pro ile kullanılabilir`,
    lockedOption: (label: string) => `${label}, Pro ile kullanılabilir`,
  },
  theme: {
    light: "Açık",
    dark: "Koyu",
    lightA11y: "Açık tema",
    darkA11y: "Koyu tema",
    system: "Sistem ayarını kullan",
    systemA11y: "Sistem temasını kullan",
  },
  date: {
    weekdays: WEEKDAYS,
    weekdaysShort: WEEKDAYS_SHORT,
    todayAt: (time: string) => `Bugün ${time}`,
    yesterdayAt: (time: string) => `Dün ${time}`,
    dateAt: (date: string, time: string) => `${date} ${time}`,
    day: (day: number, month: number, year?: number) => withYear(`${day} ${MONTHS[month]}`, year),
    dayShort: (day: number, month: number, year?: number) =>
      withYear(`${day} ${MONTHS_SHORT[month]}`, year),
    long: (weekday: number, day: number, month: number) =>
      `${day} ${MONTHS[month]} ${WEEKDAYS[weekday]}`,
    rangeInMonth: (startDay: number, endDay: number, month: number) =>
      `${startDay}–${endDay} ${MONTHS[month]}`,
    range: (startDay: number, startMonth: number, endDay: number, endMonth: number) =>
      `${startDay} ${MONTHS[startMonth]} – ${endDay} ${MONTHS[endMonth]}`,
  },
  duration: {
    minute: "dk",
    hour: "sa",
    compactMinute: "dk",
    compactHour: "sa",
    hours: { one: "saat", other: "saat" },
    minutes: { one: "dakika", other: "dakika" },
  },
  greeting: {
    morning: "Günaydın",
    afternoon: "İyi günler",
    evening: "İyi akşamlar",
    night: "İyi geceler",
  },
  number: {
    group: ".",
    decimal: ",",
  },
  units: {
    days: { one: "gün", other: "gün" },
    entries: { one: "kayıt", other: "kayıt" },
    wins: { one: "zafer", other: "zafer" },
    times: { one: "kez", other: "kez" },
  },
};
