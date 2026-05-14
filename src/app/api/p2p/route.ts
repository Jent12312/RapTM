import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

// Zod-схема для валидации создания объявления
const createAdSchema = z.object({
  type: z.enum(['BUY', 'SELL']),
  asset: z.string().min(1, 'Asset is required'),
  fiat: z.string().min(1, 'Fiat is required'),
  priceType: z.enum(['FIXED', 'FLOATING']),
  price: z.number().positive('Price must be greater than 0'),
  minLimit: z.number().positive('Min limit must be greater than 0'),
  maxLimit: z.number().positive('Max limit must be greater than 0'),
  city: z.string().optional().nullable(), // ИСПРАВЛЕНО: теперь может быть пустым/null
  autoReply: z.string().optional().nullable(),
  description: z.string().optional().default(''),
  paymentTime: z.number().int().min(5).max(120).optional().default(15),
  isPrivate: z.boolean().optional().default(false),
  reqKyc: z.boolean().optional().default(false),
  reqMinTrades: z.number().int().min(0).optional().default(0),
  reqRating: z.number().min(0).max(5).optional().default(0),
  reqFastConfirm: z.boolean().optional().default(false), // ДОБАВЛЕНО: чтобы совпадало с фронтом
  paymentMethods: z.array(z.string()).optional().default([]),
}).refine(data => data.maxLimit > data.minLimit, {
  message: 'Max limit must be greater than min limit',
  path: ['maxLimit'],
});

// Пагинация по умолчанию
const DEFAULT_PAGE_SIZE = 20;

// 1. Получить объявления (с пагинацией)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));
    const skip = (page - 1) * limit;

    // Фильтры
    const type = searchParams.get('type'); // BUY | SELL
    const asset = searchParams.get('asset');
    const city = searchParams.get('city');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isDeleted: false };

    if (userId) {
      const authUser = await getAuthUser();
      const isOwner = authUser?.userId === userId;

      where.userId = userId;
      
      if (!isOwner) {
        // Если смотрит не владелец — только активные и публичные
        where.isActive = true;
        where.isPrivate = false;
      }
      // Если владелец — показываем всё (isActive true/false, isPrivate true/false)
    } else {
      // Общий маркет — только активные и публичные
      where.isActive = true;
      where.isPrivate = false;
    }

    if (type === 'BUY' || type === 'SELL') where.type = type;
    if (asset) where.asset = asset;
    if (city) where.city = city;
    
    const adId = searchParams.get('adId');
    if (adId) where.id = adId;

    const [ads, total] = await Promise.all([
      prisma.p2PAd.findMany({
        where,
        include: { 
          user: { 
            select: { 
              id: true, 
              username: true, 
              firstName: true, 
              avatarUrl: true, 
              tradesCount: true, 
              level: true, 
              isVerified: true, 
              rating: true 
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.p2PAd.count({ where }),
    ]);

    return NextResponse.json({
      ads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Fetch Ads Error:", error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}

// 2. Создать новое объявление (защищено JWT)
export async function POST(req: Request) {
  try {
    // Извлекаем пользователя из JWT (токен должен быть в заголовке Authorization: Bearer <token>)
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Пожалуйста, авторизуйтесь.' }, { status: 401 });
    }

    const body = await req.json();

    // Валидация через Zod
    const parsed = createAdSchema.safeParse({
      ...body,
      price: Number(body.price),
      minLimit: Number(body.minLimit),
      maxLimit: Number(body.maxLimit),
      paymentTime: body.paymentTime ? Number(body.paymentTime) : 15,
      reqMinTrades: body.reqMinTrades ? Number(body.reqMinTrades) : 0,
      reqRating: body.reqRating ? Number(body.reqRating) : 0,
    });

    if (!parsed.success) {
      console.error("Zod Validation Error:", parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: 'Ошибка валидации данных', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Вставка в базу данных
    // Примечание: если в вашей схеме Prisma нет поля reqFastConfirm, 
    // просто удалите эту строку ниже, иначе Prisma выдаст ошибку.
    const newAd = await prisma.p2PAd.create({
      data: {
        userId: authUser.userId, // ← из JWT
        type: data.type,
        asset: data.asset,
        fiat: data.fiat,
        priceType: data.priceType,
        price: data.price,
        minLimit: data.minLimit,
        maxLimit: data.maxLimit,
        city: data.city || "Не указан",
        autoReply: data.autoReply || null,
        description: data.description,
        paymentTime: data.paymentTime,
        isPrivate: data.isPrivate,
        reqKyc: data.reqKyc,
        reqMinTrades: data.reqMinTrades,
        reqRating: data.reqRating,
        paymentMethods: data.paymentMethods,
        // Если в Prisma есть поле reqFastConfirm, раскомментируйте строчку ниже:
        // reqFastConfirm: data.reqFastConfirm 
      }
    });

    return NextResponse.json({ success: true, ad: newAd });
  } catch (error) {
    console.error("Create Ad Error:", error);
    return NextResponse.json({ error: 'Ошибка сервера при создании объявления' }, { status: 500 });
  }
}