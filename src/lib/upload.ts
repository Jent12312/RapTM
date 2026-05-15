import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  console.log('Attempting to save file to:', uploadDir);
  
  // Ensure the directory exists
  try {
    await mkdir(uploadDir, { recursive: true });
    console.log('Directory exists or created:', uploadDir);
  } catch (err) {
    console.error('Error creating directory:', err);
  }

  const extension = file.name.split('.').pop() || 'png';
  const fileName = `${uuidv4()}.${extension}`;
  const filePath = join(uploadDir, fileName);
  
  console.log('Full file path:', filePath);
  
  await writeFile(filePath, buffer);
  console.log('File successfully written to:', filePath);
  
  return `/uploads/${fileName}`;
}
