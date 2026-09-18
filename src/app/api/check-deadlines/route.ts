import { NextResponse } from 'next/server';
import { db } from '@/db';
import { monitoredFiles, sentNotifications } from '@/db/schema';
import { fetchAndParseExcel } from '@/lib/excel-parser';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';
import { differenceInCalendarDays, startOfDay, isValid } from 'date-fns';

// Chiave API di Gianluca Rossi
const resend = new Resend(process.env.RESEND_API_KEY || 're_VLDHMFNu_6FDfQjAh5qYsUCu9qdcYvfkP'); 
const TARGET_EMAIL = 'gianluca.rossi@forini.com';
const INTERVALS = [15, 7, 1];

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  try {
    const files = await db.select().from(monitoredFiles);
    const notificationsSent = [];
    const debugInfo: any[] = [];

    for (const file of files) {
      const bustUrl = `${file.url}&t=${Date.now()}`;
      const rows = await fetchAndParseExcel(bustUrl, 'generic');
      const details: any[] = [];
      const skipped: any[] = [];
      
      for (const row of rows) {
        if (row.expiryDate && isValid(row.expiryDate)) {
          const today = startOfDay(new Date());
          const target = startOfDay(row.expiryDate);
          const daysToExpiry = differenceInCalendarDays(target, today);
          
          details.push({ item: row.identifier, date: target.toLocaleDateString(), daysTo: daysToExpiry });

          if (INTERVALS.includes(daysToExpiry)) {
            const idStr = String(row.identifier);
            
            const alreadySent = await db.select().from(sentNotifications).where(
              and(
                eq(sentNotifications.identifier, idStr),
                eq(sentNotifications.daysRemaining, daysToExpiry),
                eq(sentNotifications.deadlineDate, row.expiryDate)
              )
            );

            if (alreadySent.length === 0 || force) {
              try {
                const { error } = await resend.emails.send({
                  from: 'Scadenze Bot <onboarding@resend.dev>',
                  to: TARGET_EMAIL,
                  subject: `SCADENZA: [${file.name.toUpperCase()}] ${idStr} tra ${daysToExpiry} gg`,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 3px solid #f59e0b; border-radius: 15px;">
                      <h2 style="color: #d97706;">Avviso Scadenza: ${file.name}</h2>
                      <p>Ciao Gianluca, mancano <strong>${daysToExpiry} giorni</strong> alla scadenza di:</p>
                      <div style="background-color: #fef3c7; padding: 15px; border-radius: 10px;">
                        <p><strong>Elemento:</strong> ${idStr}</p>
                        <p><strong>Data:</strong> ${row.expiryDate.toLocaleDateString('it-IT')}</p>
                        <p><strong>Dettagli:</strong> ${row.description}</p>
                      </div>
                    </div>
                  `
                });

                if (!error) {
                  if (!force) {
                    await db.insert(sentNotifications).values({
                      identifier: idStr,
                      daysRemaining: daysToExpiry,
                      deadlineDate: row.expiryDate,
                      fileName: file.name
                    });
                  }
                  notificationsSent.push({ item: idStr, status: 'sent', file: file.name });
                } else {
                  notificationsSent.push({ item: idStr, status: 'error', msg: error.message });
                }
              } catch (e: any) {
                notificationsSent.push({ item: idStr, status: 'crash', msg: e.message });
              }
            } else {
              skipped.push({ item: idStr, reason: 'Già inviato' });
            }
          }
        }
      }
      debugInfo.push({ file: file.name, totalRows: rows.length, details, skipped });
    }

    return NextResponse.json({ 
      success: true, 
      target: TARGET_EMAIL,
      debug: debugInfo,
      notificationsSent 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
