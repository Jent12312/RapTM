// src/lib/upload.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExtension = file.name.split('.').pop() || 'png';
  const fileName = `${uuidv4()}.${fileExtension}`;
  
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {}

  const absolutePath = join(uploadDir, fileName);
  await writeFile(absolutePath, buffer);

  return `/uploads/${fileName}`;
}
