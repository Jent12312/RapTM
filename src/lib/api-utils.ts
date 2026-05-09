// src/lib/api-utils.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Validates request body or search params against a Zod schema.
 * Returns the parsed data or a NextResponse error.
 */
export async function validateRequest<T>(
  req: Request,
  schema: z.Schema<T>,
  type: 'body' | 'query' = 'body'
): Promise<{ data: T; error?: null } | { data?: null; error: NextResponse }> {
  try {
    let input: any;
    if (type === 'body') {
      input = await req.json();
    } else {
      const { searchParams } = new URL(req.url);
      input = Object.fromEntries(searchParams.entries());
    }

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        ),
      };
    }

    return { data: parsed.data };
  } catch (error) {
    return {
      error: NextResponse.json({ error: 'Invalid input' }, { status: 400 }),
    };
  }
}
