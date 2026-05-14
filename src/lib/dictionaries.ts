// src/lib/dictionaries.ts
import { ru } from './dicts/ru';
import { tm } from './dicts/tm';
import { en } from './dicts/en';

export type Language = 'ru' | 'tm' | 'en';

export const dict = {
  ru,
  tm,
  en,
};

export type Dictionary = typeof ru;
export type DictionaryKey = keyof Dictionary;

export const t = (lang: Language, key: DictionaryKey): string => {
  // Защита от неопределенного языка или отсутствующего словаря
  const currentDict = (dict[lang] || dict['ru']) as Dictionary;
  const fallbackDict = dict['ru'] as Dictionary;
  
  if (!currentDict) {
    return (key as string);
  }

  return currentDict[key] || fallbackDict[key] || (key as string);
};
