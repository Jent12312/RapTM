import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

export async function GET(
  req: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  
  // Путь должен совпадать с тем, куда мы сохраняем в saveFile
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const filePath = join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    // Пробуем также абсолютный путь, если относительный не сработал
    const absolutePath = join('/app/public/uploads', filename);
    if (!fs.existsSync(absolutePath)) {
        return new NextResponse('File not found', { status: 404 });
    }
    return serveFile(absolutePath, filename);
  }

  return serveFile(filePath, filename);
}

async function serveFile(path: string, filename: string) {
  try {
    const fileBuffer = await readFile(path);
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 
                        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                        'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Error reading file', { status: 500 });
  }
}
