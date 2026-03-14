export type Language = 'ru' | 'tm' | 'en';

export const dict = {
  ru: {
    balanceLabel: "Общий баланс", salmak: "Пополнить", cykarmak: "Вывод", alyCaly: "Обменять",
    walyutalar: "Валюты", navGapjyk: "Кошелек", navAlys: "Обмен", navP2P: "P2P Маркет",
    userLabel: "Пользователь",
    // P2P слова
    buy: "Купить", sell: "Продать", amount: "Сумма", limit: "Лимит",
    trades: "сделок", cash: "Наличные", buyBtn: "Купить", sellBtn: "Продать"
  },
  tm: {
    balanceLabel: "Umumy balans", salmak: "Salmak", cykarmak: "Çykarmak", alyCaly: "Alyş-çalyş",
    walyutalar: "Walyutalar", navGapjyk: "Gapjyk", navAlys: "Alyş-çalyş", navP2P: "P2P Market",
    userLabel: "Ulanyjy",
    // P2P слова
    buy: "Satyn al", sell: "Satmak", amount: "Möçber", limit: "Limit",
    trades: "söwda", cash: "Nagt", buyBtn: "Almak", sellBtn: "Satmak"
  },
  en: {
    balanceLabel: "Total Balance", salmak: "Deposit", cykarmak: "Withdraw", alyCaly: "Exchange",
    walyutalar: "Currencies", navGapjyk: "Wallet", navAlys: "Exchange", navP2P: "P2P Market",
    userLabel: "User",
    // P2P слова
    buy: "Buy", sell: "Sell", amount: "Amount", limit: "Limit",
    trades: "trades", cash: "Cash", buyBtn: "Buy", sellBtn: "Sell"
  }
};

export const t = (lang: Language, key: keyof typeof dict['ru']) => {
  return dict[lang][key];
};