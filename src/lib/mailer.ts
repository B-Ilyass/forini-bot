import nodemailer from 'nodemailer';

// Configurazione Nodemailer con le tue credenziali Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'stage2@forini.com',
    pass: 'oemb fkwa euzh dcmu', // Password per le app generata
  },
});

export async function sendEmail(to: string[], subject: string, html: string) {
  const mailOptions = {
    from: '"Bot Scadenze Forini" <stage2@forini.com>',
    to: to.join(', '),
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email inviata con successo: ' + info.response);
    return { success: true, response: info.response };
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email:', error);
    throw error;
  }
}
