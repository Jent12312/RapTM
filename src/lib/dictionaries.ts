export type Language = 'ru' | 'tm' | 'en';

export const dict = {
  ru: {
    balanceLabel: "Общий баланс", salmak: "Пополнить", cykarmak: "Вывод", alyCaly: "Обменять",
    walyutalar: "Валюты", navGapjyk: "Кошелек", navAlys: "Обмен", navP2P: "P2P Маркет",
    userLabel: "Пользователь",
  },
  tm: {
    balanceLabel: "Umumy balans", salmak: "Salmak", cykarmak: "Çykarmak", alyCaly: "Alyş-çalyş",
    walyutalar: "Walyutalar", navGapjyk: "Gapjyk", navAlys: "Alyş-çalyş", navP2P: "P2P Market",
    userLabel: "Ulanyjy",
  },
  en: {
    balanceLabel: "Total Balance", salmak: "Deposit", cykarmak: "Withdraw", alyCaly: "Exchange",
    walyutalar: "Currencies", navGapjyk: "Wallet", navAlys: "Exchange", navP2P: "P2P Market",
    userLabel: "User",
  }
};

export const t = (lang: Language, key: keyof typeof dict['ru']) => {
  return dict[lang][key];
};