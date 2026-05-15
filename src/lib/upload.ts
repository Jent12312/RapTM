import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  
  // Ensure the directory exists
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
  }

  const extension = file.name.split('.').pop() || 'png';
  const fileName = `${uuidv4()}.${extension}`;
  const filePath = join(uploadDir, fileName);
  
  await writeFile(filePath, buffer);
  
  return `/uploads/${fileName}`;
}
