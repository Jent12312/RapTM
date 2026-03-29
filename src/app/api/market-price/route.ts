// src/app/api/market-price/route.ts
import { NextResponse } from 'next/server';

// Кэширование цен (чтобы не делать запрос к внешнему API каждый раз)
let cachedPrices: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Функция получения курса USD/TMT из внешнего API
async function fetchUSDTMT(): Promise<number> {
  try {
    // Используем бесплатный Exchange Rate API
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.rates?.TMT || 3.50; // Fallback на мокаемую цену
  } catch (error) {
    console.error('Failed to fetch USD/TMT:', error);
    return 3.50; // Fallback
  }
}

// Функция получения курса USDT/USD (всегда ~1, но можно взять с Binance)
async function fetchUSDTUSD(): Promise<number> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTUSD', {
      cache: 'no-store',
    });
    const data = await res.json();
    return parseFloat(data.price) || 1.00;
  } catch (error) {
    return 1.00; // Fallback
  }
}

// Получение базовой цены для пары
async function getBasePrice(asset: string, fiat: string): Promise<number> {
  const cacheKey = `${asset}/${fiat}`;
  const cached = cachedPrices[cacheKey];
  
  // Возвращаем кэшированную цену если она ещё актуальна
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  let price: number;

  switch (cacheKey) {
    case 'USDT/USD':
      price = await fetchUSDTUSD();
      break;
    case 'USD/TMT':
      price = await fetchUSDTMT();
      break;
    case 'USDT/TMT':
      // Кросс-курс: USDT/TMT = USDT/USD × USD/TMT
      const [usdtUsd, usdTmt] = await Promise.all([
        fetchUSDTUSD(),
        fetchUSDTMT(),
      ]);
      price = usdtUsd * usdTmt;
      break;
    case 'TMT/USDT':
      const tmtUsd = await fetchUSDTMT();
      price = 1 / tmtUsd; // Обратный курс
      break;
    case 'TMT/USD':
      const tmtUsd2 = await fetchUSDTMT();
      price = 1 / tmtUsd2; // Обратный курс
      break;
    case 'USD/USDT':
      price = 1.00; // Почти всегда 1
      break;
    default:
      throw new Error(`Unknown pair: ${cacheKey}`);
  }

  // Кэшируем результат
  cachedPrices[cacheKey] = { price, timestamp: Date.now() };
  return price;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const asset = searchParams.get('asset');
    const fiat = searchParams.get('fiat');

    if (!asset || !fiat) {
      return NextResponse.json({ error: 'Asset and Fiat are required' }, { status: 400 });
    }

    const basePrice = await getBasePrice(asset, fiat);

    // Симулируем небольшое изменение для демонстрации (в будущем можно взять из API)
    const change24h = (Math.random() * 2 - 1).toFixed(2);

    return NextResponse.json({
      basePrice,
      pair: `${asset}/${fiat}`,
      timestamp: Date.now(),
      change24h: parseFloat(change24h),
      source: 'live', // Помечаем что это реальные данные
    });
  } catch (error) {
    console.error('Market Price API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch market price' }, { status: 500 });
  }
}
