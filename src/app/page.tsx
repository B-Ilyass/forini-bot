import { db } from '@/db';
import { monitoredFiles, sentNotifications } from '@/db/schema';
import { addMonitoredFile, deleteMonitoredFile } from './actions';
import { FileText, Plus, Trash2, RefreshCw, AlertCircle, Mail, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let files: any[] = [];
  let recentEmails: any[] = [];

  try {
    files = await db.select().from(monitoredFiles);
    recentEmails = await db.select().from(sentNotifications).orderBy(desc(sentNotifications.sentAt)).limit(10);
  } catch (error) {
    console.error("Database not ready during build:", error);
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Bot Scadenze Forini</h1>
            <p className="text-neutral-500 mt-1">Invio automatico a <span className="font-semibold text-blue-600">stage2@forini.com</span></p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/api/check-deadlines" 
              target="_blank"
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
            >
              <RefreshCw size={18} />
              Esegui Controllo Scadenze Ora
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-neutral-800">
              <Plus className="text-indigo-600" size={20} />
              Nuovo Foglio
            </h2>
            <form action={async (formData) => {
              'use server';
              const name = formData.get('name') as string;
              const url = formData.get('url') as string;
              if (name && url) {
                await addMonitoredFile(name, url);
              }
            }} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 ml-1">Descrizione</label>
                <input name="name" type="text" placeholder="es. Scadenze Bolli" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" required />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 ml-1">Link CSV (Pubblicato sul Web)</label>
                <input name="url" type="url" placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" required />
              </div>
              <button type="submit" className="w-full bg-neutral-900 text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition">
                Aggiungi Link
              </button>
            </form>
          </section>

          {/* List */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-800 px-2">
              <FileText className="text-indigo-600" size={20} />
              File in Monitoraggio
            </h2>
            
            {files.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl py-16 text-center text-neutral-400">
                <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                <p>Nessun link configurato.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {files.map(file => (
                  <div key={file.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900">{file.name}</h3>
                        <p className="text-xs text-neutral-400 truncate max-w-[200px] md:max-w-xs">{file.url}</p>
                      </div>
                    </div>
                    <form action={async () => {
                      'use server';
                      await deleteMonitoredFile(file.id);
                    }}>
                      <button className="text-neutral-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-800 mb-4 px-2">
            <Clock className="text-indigo-600" size={20} />
            Ultime Notifiche Inviate (Max 10)
          </h2>
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            {recentEmails.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 italic">Nessuna notifica inviata recentemente.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-3">Data Invio</th>
                    <th className="px-6 py-3">Excel</th>
                    <th className="px-6 py-3">Elemento</th>
                    <th className="px-6 py-3">Soglia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentEmails.map(email => (
                    <tr key={email.id}>
                      <td className="px-6 py-4 text-neutral-500">{email.sentAt.toLocaleString('it-IT')}</td>
                      <td className="px-6 py-4 font-semibold text-indigo-600">{email.fileName || 'Sconosciuto'}</td>
                      <td className="px-6 py-4 font-medium">{email.identifier}</td>
                      <td className="px-6 py-4"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">-{email.daysRemaining} GG</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <footer className="mt-12 bg-indigo-900 text-indigo-100 p-8 rounded-3xl overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Mail /> Logica di Invio Email
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <span className="text-2xl font-black block mb-1">15 gg</span>
                Primo avviso preventivo
              </div>
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <span className="text-2xl font-black block mb-1">7 gg</span>
                Secondo avviso di allerta
              </div>
              <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                <span className="text-2xl font-black block mb-1">1 gg</span>
                Avviso urgente finale
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Mail size={120} />
          </div>
        </footer>
      </div>
    </div>
  );
}
