import type { Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  si: () => import("./dictionaries/si.json").then((module) => module.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
