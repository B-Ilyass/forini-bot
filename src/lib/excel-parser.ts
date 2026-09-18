import axios from 'axios';
import * as XLSX from 'xlsx';
import { addDays, isWithinInterval, startOfDay, isValid } from 'date-fns';
import * as chrono from 'chrono-node';

export interface DeadlineRow {
  identifier: string;
  description: string;
  expiryDate: Date;
  type: string;
}

export async function fetchAndParseExcel(url: string, type: string): Promise<DeadlineRow[]> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const data = new Uint8Array(response.data);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
    
    return jsonData.map((row, index) => {
      let expiryDate: Date | null = null;
      let description = '';
      let identifier = '';

      // Pattern per Targa Italiana (es. AA123BB)
      const targaRegex = /[A-Z]{2}\s?\d{3}\s?[A-Z]{2}/i;

      for (const key in row) {
        const val = row[key];
        const valStr = String(val);

        // 1. Uso di Chrono (NLP) per trovare date in qualsiasi stringa
        if (!(val instanceof Date)) {
          const parsedDate = chrono.it.parseDate(valStr) || chrono.parseDate(valStr);
          if (parsedDate && parsedDate.getFullYear() > 2000) {
            // Se ci sono più date, preferiamo quella che sembra una scadenza futura
            if (!expiryDate || parsedDate > expiryDate) {
              expiryDate = parsedDate;
            }
          }
        } else if (isValid(val)) {
          expiryDate = val;
        }

        // 2. Rilevamento Targa
        if (targaRegex.test(valStr) && !identifier) {
          identifier = valStr.match(targaRegex)![0].toUpperCase();
        }

        // 3. Rilevamento Identificativo da nomi colonne
        const lowKey = key.toLowerCase();
        if ((lowKey.includes('targa') || lowKey.includes('id') || lowKey.includes('nome')) && !identifier) {
          identifier = valStr;
        }
        
        // Accumulo descrizione
        if (valStr.length > 3 && valStr.length < 100) {
          description += valStr + " ";
        }
      }

      // Fallbacks
      if (!identifier) identifier = String(Object.values(row)[0] || `Riga-${index}`);
      if (!description) description = Object.values(row).join(' ');

      return {
        identifier: identifier.trim(),
        description: description.trim(),
        expiryDate: expiryDate ? startOfDay(expiryDate) : new Date(0),
        type
      };
    }).filter(row => row.expiryDate.getTime() > 0);
  } catch (error) {
    console.error("Errore Smart Parser:", error);
    return [];
  }
}

export function isDeadlineApproaching(date: Date, minDays: number = 10, maxDays: number = 15): boolean {
  const today = startOfDay(new Date());
  const startRange = addDays(today, minDays);
  const endRange = addDays(today, maxDays);
  
  return isWithinInterval(date, { start: startRange, end: endRange });
}
