import { google } from 'googleapis';
import * as XLSX from 'xlsx';

export async function getDriveClient() {
  // In produzione, puoi usare variabili d'ambiente invece di un file fisico
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function listExcelFilesInFolder(folderId: string) {
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv' or mimeType = 'application/vnd.google-apps.spreadsheet')`,
    fields: 'files(id, name, mimeType)',
  });
  return res.data.files || [];
}

export async function downloadAndParseDriveFile(fileId: string, mimeType: string) {
  const drive = await getDriveClient();
  let buffer: Buffer;

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    // Se è un Google Sheet, lo esportiamo come Excel
    const res = await drive.files.export({
      fileId: fileId,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data as ArrayBuffer);
  } else {
    // Se è già un Excel o CSV
    const res = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data as ArrayBuffer);
  }

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet) as any[];
}
