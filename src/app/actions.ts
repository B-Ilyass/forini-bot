'use server';

import { db } from '@/db';
import { monitoredFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addMonitoredFile(name: string, url: string) {
  await db.insert(monitoredFiles).values({
    name,
    url,
  });
  revalidatePath('/');
}

export async function deleteMonitoredFile(id: string) {
  await db.delete(monitoredFiles).where(eq(monitoredFiles.id, id));
  revalidatePath('/');
}
