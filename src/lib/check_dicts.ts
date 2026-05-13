// src/lib/check_dicts.ts
import { ru } from './dicts/ru';
import { tm } from './dicts/tm';
import { en } from './dicts/en';

/**
 * Script to verify consistency between language dictionaries.
 * Checks that all dictionaries have the exact same set of keys.
 */

const checkDicts = () => {
  const ruKeys = Object.keys(ru).sort();
  const tmKeys = Object.keys(tm).sort();
  const enKeys = Object.keys(en).sort();

  const missingInTm = ruKeys.filter(key => !tmKeys.includes(key));
  const missingInEn = ruKeys.filter(key => !enKeys.includes(key));
  const extraInTm = tmKeys.filter(key => !ruKeys.includes(key));
  const extraInEn = enKeys.filter(key => !ruKeys.includes(key));

  console.log('--- Dictionary Consistency Report ---');
  
  if (missingInTm.length > 0) console.error('Missing in TM:', missingInTm);
  if (missingInEn.length > 0) console.error('Missing in EN:', missingInEn);
  if (extraInTm.length > 0) console.error('Extra in TM (not in RU):', extraInTm);
  if (extraInEn.length > 0) console.error('Extra in EN (not in RU):', extraInEn);

  if (
    missingInTm.length === 0 && 
    missingInEn.length === 0 && 
    extraInTm.length === 0 && 
    extraInEn.length === 0
  ) {
    console.log('✅ All dictionaries are synchronized!');
  } else {
    console.error('❌ Inconsistencies found!');
  }
};

checkDicts();
