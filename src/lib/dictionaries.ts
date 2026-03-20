// src/lib/dictionaries.ts

export type Language = 'ru' | 'tm' | 'en';

export const dict = {
  ru: {
    // --- Навигация ---
    navGapjyk: "Кошелек",
    navAlys: "Обмен",
    navP2P: "P2P Маркет",
    userLabel: "Пользователь",

    // --- Кошелек ---
    balanceLabel: "Общий баланс",
    salmak: "Пополнить",
    cykarmak: "Вывод",
    alyCaly: "Обменять",
    walyutalar: "Валюты",
    digitalDollar: "Цифровой доллар",
    localCurrency: "Местная валюта",

    // --- P2P Маркет ---
    buy: "Купить",
    sell: "Продать",
    amount: "Сумма",
    filterAmount: "Сумма",
    limit: "Лимит",
    trades: "сделок",
    completion: "выполнено",
    price: "Цена",
    time: "мин",
    cash: "Наличные",
    buyBtn: "Купить",
    sellBtn: "Продать",
    noAds: "Нет активных объявлений для",
    searchPlaceholder: "Поиск по сумме...",
    refresh: "Обновить",

    // --- Профиль ---
    profileTitle: "Профиль",
    merchantCenter: "P2P Центр",
    myAds: "Мои объявления",
    createAd: "Создать объявление",
    myOrders: "Мои сделки",
    security: "Безопасность",
    phone: "Телефон",
    email: "Почта",
    notifications: "Уведомления",
    help: "Помощь",
    deleteAccount: "Удалить аккаунт",
    kycLabel: "Верификация",
    verified: "Верифицирован",
    unverified: "Не верифицирован",
    edit: "Изменить",
    save: "Сохранить",
    cancel: "Отмена",
    nickname: "Никнейм",
    stats: "Статистика",
    positiveReviews: "положительных отзывов",
    shareProfile: "Поделиться профилем",

    // --- Экран Сделки (Order) ---
    orderId: "Сделка",
    safeDeal: "Безопасная сделка",
    statusPending: "Ожидание оплаты",
    statusPaid: "Оплачено",
    statusCompleted: "Завершена",
    statusCancelled: "Отменена",
    iPay: "Я оплатил",
    confirmRec: "Подтвердить получение",
    payAmount: "Сумма к оплате",
    receiveAmount: "Вы получаете",
    meetingCity: "Город встречи",
    whatToDo: "Что нужно сделать?",
    step1: "Напишите партнеру в чат для встречи.",
    step2: "После передачи денег нажмите кнопку 'Я оплатил'.",
    step3: "Партнер подтвердит получение и монеты зачислятся.",
    returnToWallet: "Вернуться в кошелек",

    // --- Чат ---
    chatPlaceholder: "Написать сообщение...",
    online: "В сети",
    securityWarning: "Внимание! Не переводите крипту до получения наличных.",

    // --- Отзывы ---
    reviewTitle: "Оцените сделку",
    excellent: "Отлично",
    neutral: "Нормально",
    bad: "Плохо",
    reviewSuccess: "Отзыв сохранен. Спасибо!",

    // --- Создание объявления ---
    createAdHeader: "Создать объявление",
    onReceive: "На приём",
    onPayout: "На выплаты",
    asset: "Актив",
    fiat: "Фиат",
    priceType: "Тип цены",
    fixed: "Фиксированная",
    floating: "Плавающая",
    minLimit: "Мин. лимит",
    maxLimit: "Макс. лимит",
    city: "Город",
    autoReply: "Условия сделки (Автоответ)",
    publish: "Опубликовать",

    // --- Системные сообщения ---
    processing: "В обработке...",
    exchangeStub: "Этот раздел временно недоступен по юридическим причинам.",
    error: "Произошла ошибка",
    success: "Успешно!",
    loading: "Загрузка...",
  },

  tm: {
    // --- Nawigasiýa ---
    navGapjyk: "Gapjyk",
    navAlys: "Alyş-çalyş",
    navP2P: "P2P Market",
    userLabel: "Ulanyjy",

    // --- Gapjyk ---
    balanceLabel: "Umumy balans",
    salmak: "Salmak",
    cykarmak: "Çykarmak",
    alyCaly: "Çalyşmak",
    walyutalar: "Walyutalar",
    digitalDollar: "Sanly dollar",
    localCurrency: "Ýerli walyuta",

    // --- P2P Market ---
    buy: "Satyn al",
    sell: "Satmak",
    amount: "Möçber",
    filterAmount: "Möçber",
    limit: "Limit",
    trades: "söwda",
    completion: "ýerine ýetirildi",
    price: "Bahasy",
    time: "min",
    cash: "Nagt",
    buyBtn: "Almak",
    sellBtn: "Satmak",
    noAds: "Işjeň bildiriş ýok:",
    searchPlaceholder: "Möçber boýunça gözleg...",
    refresh: "Tazele",

    // --- Profil ---
    profileTitle: "Profil",
    merchantCenter: "P2P Merkezi",
    myAds: "Meniň bildirişlerim",
    createAd: "Bildiriş döretmek",
    myOrders: "Meniň söwdalarym",
    security: "Howpsuzlyk",
    phone: "Telefon",
    email: "Poçta",
    notifications: "Bildirişler",
    help: "Goldaw",
    deleteAccount: "Hasaby pozmak",
    kycLabel: "Tassyklama",
    verified: "Tassyklanan",
    unverified: "Tassyklanmadyk",
    edit: "Üýtget",
    save: "Sakla",
    cancel: "Goýbolsun",
    nickname: "Lakam",
    stats: "Statistika",
    positiveReviews: "oňat synlar",
    shareProfile: "Profili paýlaş",

    // --- Söwda ekrany (Order) ---
    orderId: "Söwda",
    safeDeal: "Howpsuz söwda",
    statusPending: "Tolege garaşylýar",
    statusPaid: "Tölendi",
    statusCompleted: "Tamamlandy",
    statusCancelled: "Goýbolsun edildi",
    iPay: "Men töledim",
    confirmRec: "Alanyňy tassykhala",
    payAmount: "Tölener duman",
    receiveAmount: "Siz alýarsyňyz",
    meetingCity: "Duşuşyk şäheri",
    whatToDo: "Näme etmeli?",
    step1: "Duşuşmak üçin partnýora hat ýazyň.",
    step2: "Pul bereniňizden soň 'Men töledim' düwmesine basyň.",
    step3: "Partnýor tassykhalar we monetalaryňyz geler.",
    returnToWallet: "Gapjyga gaýt",

    // --- Çat ---
    chatPlaceholder: "Hat ýazyň...",
    online: "Ulgamda",
    securityWarning: "Üns beriň! Nagt pul almazdan ozal kripto ugratmaň.",

    // --- Synlar ---
    reviewTitle: "Söwdany bahalandyryň",
    excellent: "Gaty gowy",
    neutral: "Kadaly",
    bad: "Erbet",
    reviewSuccess: "Syn ýazyldy. Sag boluň!",

    // --- Bildiriş döretmek ---
    createAdHeader: "Bildiriş döretmek",
    onReceive: "Almak üçin",
    onPayout: "Tölemek üçin",
    asset: "Aktiw",
    fiat: "Fiat",
    priceType: "Baha görnüşi",
    fixed: "Fiksirlenen",
    floating: "Üýtgeýän",
    minLimit: "Min. limit",
    maxLimit: "Maks. limit",
    city: "Şäher",
    autoReply: "Söwda şertleri (Awto-jogap)",
    publish: "Goýmak",

    // --- Ulgam hatlary ---
    processing: "Işlenilýär...",
    exchangeStub: "Bu bölüm wagtlaýyn elýeterli däl.",
    error: "Ýalňyşlyk ýüze çykdy",
    success: "Şowly!",
    loading: "Ýüklenilýär...",
  },

  en: {
    // --- Navigation ---
    navGapjyk: "Wallet",
    navAlys: "Exchange",
    navP2P: "P2P Market",
    userLabel: "User",

    // --- Wallet ---
    balanceLabel: "Total Balance",
    salmak: "Deposit",
    cykarmak: "Withdraw",
    alyCaly: "Swap",
    walyutalar: "Currencies",
    digitalDollar: "Digital Dollar",
    localCurrency: "Local Currency",

    // --- P2P Market ---
    buy: "Buy",
    sell: "Sell",
    amount: "Amount",
    filterAmount: "Amount",
    limit: "Limit",
    trades: "trades",
    completion: "completion",
    price: "Price",
    time: "min",
    cash: "Cash",
    buyBtn: "Buy",
    sellBtn: "Sell",
    noAds: "No active ads for",
    searchPlaceholder: "Search by amount...",
    refresh: "Refresh",

    // --- Profile ---
    profileTitle: "Profile",
    merchantCenter: "P2P Center",
    myAds: "My Ads",
    createAd: "Create Ad",
    myOrders: "My Orders",
    security: "Security",
    phone: "Phone",
    email: "Email",
    notifications: "Notifications",
    help: "Help",
    deleteAccount: "Delete Account",
    kycLabel: "Verification",
    verified: "Verified",
    unverified: "Unverified",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    nickname: "Nickname",
    stats: "Statistics",
    positiveReviews: "positive reviews",
    shareProfile: "Share Profile",

    // --- Order Screen ---
    orderId: "Order",
    safeDeal: "Safe Trade",
    statusPending: "Pending Payment",
    statusPaid: "Paid",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    iPay: "I have paid",
    confirmRec: "Confirm Receipt",
    payAmount: "Payment amount",
    receiveAmount: "You receive",
    meetingCity: "Meeting City",
    whatToDo: "What to do?",
    step1: "Chat with the partner to arrange a meeting.",
    step2: "Click 'I have paid' after giving the cash.",
    step3: "Partner will confirm and coins will be released.",
    returnToWallet: "Back to Wallet",

    // --- Chat ---
    chatPlaceholder: "Type a message...",
    online: "Online",
    securityWarning: "Warning! Never release crypto before receiving cash.",

    // --- Reviews ---
    reviewTitle: "Rate the trade",
    excellent: "Excellent",
    neutral: "Neutral",
    bad: "Bad",
    reviewSuccess: "Review saved. Thanks!",

    // --- Create Ad ---
    createAdHeader: "Create Ad",
    onReceive: "For Buy",
    onPayout: "For Sell",
    asset: "Asset",
    fiat: "Fiat",
    priceType: "Price Type",
    fixed: "Fixed",
    floating: "Floating",
    minLimit: "Min Limit",
    maxLimit: "Max Limit",
    city: "City",
    autoReply: "Trade terms (Auto-reply)",
    publish: "Publish",

    // --- System messages ---
    processing: "Processing...",
    exchangeStub: "This section is temporarily unavailable for legal reasons.",
    error: "An error occurred",
    success: "Success!",
    loading: "Loading...",
  }
};

export const t = (lang: Language, key: keyof typeof dict['ru']) => {
  return dict[lang][key] || dict['ru'][key] || key;
};