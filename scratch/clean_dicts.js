
import fs from 'fs';

const content = fs.readFileSync('b:/RapTM/rapira-tm-app/src/lib/dictionaries.ts', 'utf8');

// Simple regex to extract the objects. This is risky but the file structure is predictable.
const ruMatch = content.match(/ru: \{([\s\S]*?)\n {2}\},/);
const tmMatch = content.match(/tm: \{([\s\S]*?)\n {2}\},/);
const enMatch = content.match(/en: \{([\s\S]*?)\n {2}\}/);

function deduplicate(match) {
    if (!match) return {};
    const lines = match[1].split('\n');
    const result = {};
    lines.forEach(line => {
        const m = line.match(/^\s*([a-zA-Z0-9]+):\s*"(.*)",?\s*$/);
        if (m) {
            result[m[1]] = m[2];
        }
    });
    return result;
}

const ru = deduplicate(ruMatch);
const tm = deduplicate(tmMatch);
const en = deduplicate(enMatch);

// Add missing keys
const missingKeys = {
    walDepositWithdraw: { ru: "Ввод и Вывод", tm: "Giriş we Çykyş", en: "Deposit & Withdrawal" },
    faqNetSupport: { ru: "Какие сети поддерживаются?", tm: "Haýsy torlar goldanylýar?", en: "Which networks are supported?" },
    faqNetSupportDesc: { ru: "Мы поддерживаем USDT в сетях TRC-20, ERC-20 и BEP-20.", tm: "Biz TRC-20, ERC-20 we BEP-20 torlarynda USDT goldaýarys.", en: "We support USDT on TRC-20, ERC-20, and BEP-20 networks." },
    faqWithdrawTime: { ru: "Как быстро приходят деньги?", tm: "Pul nähili çalt gelýär?", en: "How fast do funds arrive?" },
    faqWithdrawTimeDesc: { ru: "Обычно вывод занимает от 5 до 15 минут.", tm: "Adatça çykaryş 5-15 minut alýar.", en: "Withdrawal usually takes 5 to 15 minutes." },
    faqHowDepositCrypto: { ru: "Как пополнить криптой?", tm: "Kripto bilen nähili doldurmaly?", en: "How to deposit with crypto?" },
    faqHowDepositCryptoDesc: { ru: "Зайдите в Кошелек -> Пополнить -> Крипто и следуйте инструкциям.", tm: "Gapjyk -> Salmak -> Kripto bölümine giriň we görkezmeleri berjaý ediň.", en: "Go to Wallet -> Deposit -> Crypto and follow the instructions." },
    faqHowDepositCash: { ru: "Как пополнить наличными?", tm: "Nagt bilen nähili doldurmaly?", en: "How to deposit with cash?" },
    faqHowDepositCashDesc: { ru: "Зайдите в Кошелек -> Пополнить -> Наличные и выберите ваш город.", tm: "Gapjyk -> Salmak -> Nagt bölümine giriň we şäheriňizi saýlaň.", en: "Go to Wallet -> Deposit -> Cash and select your city." },
    faqHowWithdrawTime: { ru: "Время вывода?", tm: "Çykaryş wagty?", en: "Withdrawal time?" },
    faqHowWithdrawTimeDesc: { ru: "Вывод на крипто-кошельки занимает до 15 минут, наличными — по договоренности с оператором.", tm: "Kripto-gapjyga çykaryş 15 minuda çenli, nagt bolsa operator bilen ylalaşykly.", en: "Crypto withdrawal takes up to 15 mins, cash depends on operator agreement." },
    faqP2PDetails: { ru: "Как работает P2P?", tm: "P2P nähili işleýär?", en: "How does P2P work?" },
    faqP2PDetailsDesc: { ru: "Вы выбираете объявление, переводите деньги партнеру, а платформа гарантирует получение крипты.", tm: "Siz bildiriş saýlaýarsyňyz, partnýora pul geçirýärsiňiz, platforma bolsa kripto almagyňyza kepil geçýär.", en: "Choose an ad, transfer funds to the partner, and the platform guarantees crypto release." },
    faqP2PTimeout: { ru: "Что если партнер не платит?", tm: "Partnýor tölemese näme etmeli?", en: "What if the partner doesn't pay?" },
    faqP2PTimeoutDesc: { ru: "Сделка будет автоматически отменена по истечении времени.", tm: "Söwda wagt gutaranda awtomatiki ýatyrylar.", en: "The trade will be automatically cancelled after the timeout." },
    faqArbitration: { ru: "Что такое арбитраж?", tm: "Arbitraž näme?", en: "What is arbitration?" },
    faqArbitrationDesc: { ru: "Это решение спора администратором платформы в случае возникновения проблем в сделке.", tm: "Bu söwdada kynçylyk ýüze çykanda admin tarapyndan dawanyň çözülmegidir.", en: "Dispute resolution by a platform admin in case of trade issues." },
    faqAMLTitle: { ru: "AML Проверки", tm: "AML Barlaglary", en: "AML Checks" },
    faqWhatIsAML: { ru: "Что такое AML?", tm: "AML näme?", en: "What is AML?" },
    faqWhatIsAMLDesc: { ru: "Система борьбы с отмыванием денег, проверяющая чистоту ваших транзакций.", tm: "Puluň ýuwulmagyna garşy sistema, tranzaksiýalaryňyzyň arassalygyny barlaýar.", en: "Anti-Money Laundering system checking your transactions for risks." },
    faqRiskScore: { ru: "Что такое Risk Score?", tm: "Risk Score näme?", en: "What is Risk Score?" },
    faqRiskScoreDesc: { ru: "Это показатель риска вашего кошелька. Высокий риск может привести к блокировке.", tm: "Bu gapjygyňyzyň töwekgelçilik derejesidir. Ýokary töwekgelçilik bloklanmaga sebäp bolup biler.", en: "A risk indicator for your wallet. High risk may lead to blocking." },
    faqReferralTitle: { ru: "Реферальная программа", tm: "Referal programmasy", en: "Referral Program" },
    faqHowInvite: { ru: "Как пригласить друга?", tm: "Dostuňy nähili çagyrmaly?", en: "How to invite a friend?" },
    faqHowInviteDesc: { ru: "Скопируйте вашу ссылку в разделе Профиль -> Реферальная программа.", tm: "Profil -> Referal programmasy bölüminden salgyňyzy kopyalaň.", en: "Copy your link in Profile -> Referral Program section." },
    faqRewards: { ru: "Какие награды?", tm: "Nähili baýraklar?", en: "What are the rewards?" },
    faqRewardsDesc: { ru: "Вы получаете 15 USDT за каждого друга, совершившего первую сделку.", tm: "Ilkinji söwdasyny eden her dostuňyz üçin 15 USDT alýarsyňyz.", en: "You get 15 USDT for each friend who completes their first trade." },
    faqAPITitle: { ru: "API-ключи", tm: "API açarlary", en: "API Keys" },
    faqHowCreateAPI: { ru: "Как создать API ключ?", tm: "API açaryny nähili döretmeli?", en: "How to create an API key?" },
    faqHowCreateAPIDesc: { ru: "Раздел API находится в разработке и будет доступен в ближайшее время.", tm: "API bölümi işlenilýär we tiz wagtda elýeterli bolar.", en: "API section is under development and will be available soon." },
    faqLevelsTitle: { ru: "Финансовые уровни", tm: "Maliýe derejeleri", en: "Financial Levels" },
    faqHowLevelUp: { ru: "Как повысить уровень?", tm: "Derejäni nähili ýokarlandyrmaly?", en: "How to level up?" },
    faqHowLevelUpDesc: { ru: "Увеличивайте объем торгов и проходите верификацию.", tm: "Söwda göwrümini artdyryň we tassyklamadan geçiň.", en: "Increase trade volume and complete verification." },
    faqOfficesTitle: { ru: "Офисы", tm: "Ofisler", en: "Offices" },
    faqWhereOffices: { ru: "Где находятся офисы?", tm: "Ofisler nirede ýerleşýär?", en: "Where are the offices located?" },
    faqWhereOfficesDesc: { ru: "Наши офисы находятся во всех велаятах Туркменистана.", tm: "Ofislerimiz Türkmenistanyň ähli welaýatlarynda ýerleşýär.", en: "Our offices are located in all regions of Turkmenistan." },
    walCashWithdrawal: { ru: "Вывод наличных", tm: "Nagt çykarmak", en: "Cash Withdrawal" },
    walSelectCityWithdraw: { ru: "Выберите город для получения наличных", tm: "Nagt almak üçin şäher saýlaň", en: "Select city to receive cash" },
    walCashWithdrawalNote: { ru: "Оператор свяжется с вами для организации встречи.", tm: "Operator duşuşyk guramak üçin habarlaşar.", en: "Operator will contact you to arrange a meeting." },
    walVoucherCreation: { ru: "Создание ваучера", tm: "Wawçer döretmek", en: "Voucher Creation" },
    walVoucherCreationNote: { ru: "Ваучер можно передать другому пользователю для мгновенного зачисления.", tm: "Wawçer başga ulanyja dessine geçirmek üçin berlip bilner.", en: "Voucher can be given to another user for instant credit." },
    walAmountRapCode: { ru: "Сумма ваучера", tm: "Wawçer möçberi", en: "Voucher Amount" },
    walWithdrawBtn: { ru: "Вывести средства", tm: "Pul çykarmak", en: "Withdraw Funds" },
    confirm: { ru: "Подтвердить", tm: "Tassyklamak", en: "Confirm" }
};

Object.keys(missingKeys).forEach(key => {
    ru[key] = missingKeys[key].ru;
    tm[key] = missingKeys[key].tm;
    en[key] = missingKeys[key].en;
});

function formatObj(obj) {
    return Object.keys(obj).sort().map(key => `    ${key}: "${obj[key]}"`).join(',\n');
}

const newContent = `// src/lib/dictionaries.ts

export type Language = 'ru' | 'tm' | 'en';

export const dict = {
  ru: {
${formatObj(ru)}
  },

  tm: {
${formatObj(tm)}
  },

  en: {
${formatObj(en)}
  }
};

export const t = (lang: Language, key: keyof typeof dict['ru']) => {
  return dict[lang][key] || dict['ru'][key] || key;
};
`;

fs.writeFileSync('b:/RapTM/rapira-tm-app/src/lib/dictionaries.ts', newContent);
console.log('Dictionaries cleaned and updated!');
