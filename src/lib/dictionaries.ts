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
  const currentDict = dict[lang] as Dictionary;
  const fallbackDict = dict['ru'] as Dictionary;
  
  return currentDict[key] || fallbackDict[key] || (key as string);
};
