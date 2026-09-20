import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GOOGLE_APPS_SCRIPT_URL } from './src/config';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support JSON request bodies up to 20MB (for any base64/attachments)
  app.use(express.json({ limit: '20mb' }));

  // 1. Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Google Apps Script Connectivity Diagnostic
  app.post('/api/check-gas', async (req: Request, res: Response) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'URL Google Apps Script tidak valid.',
      });
    }

    try {
      // Test GET and POST to the Web App URL
      const testPostResponse = await fetch(url.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping', test: true }),
        redirect: 'follow',
      });

      const rawText = await testPostResponse.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (e) {
        // Not JSON - might be Google error HTML
      }

      if (parsedJson) {
        return res.json({
          success: true,
          status: 'ready',
          data: parsedJson,
          message: 'Google Apps Script Web App siap menerima data.',
        });
      }

      // Check for specific Google Apps Script error signatures in HTML
      const isMissingDoPost =
        rawText.includes('doPost') &&
        (rawText.includes('找不到以下指令碼函式') ||
          rawText.includes('Script function not found') ||
          rawText.includes('Fungsi skrip tidak ditemukan'));

      const isAuthRequired =
        rawText.includes('ServiceLogin') ||
        rawText.includes('accounts.google.com') ||
        rawText.includes('Sign in - Google Accounts');

      if (isMissingDoPost) {
        return res.json({
          success: false,
          errorType: 'DO_POST_MISSING',
          message:
            "Fungsi 'doPost' belum aktif di Google Apps Script Anda. Pastikan kode google-apps-script/Code.gs telah di-paste, di-save, dan di-deploy versi baru.",
          details: rawText.slice(0, 500),
        });
      }

      if (isAuthRequired) {
        return res.json({
          success: false,
          errorType: 'AUTH_REQUIRED',
          message:
            "Akses Web App memerlukan login Google. Pastikan setelan 'Who has access' (Siapa yang memiliki akses) diubah menjadi 'Anyone' (Siapa saja).",
          details: 'Google login redirect detected',
        });
      }

      return res.json({
        success: false,
        errorType: 'HTML_RESPONSE',
        message:
          'Google Apps Script merespons dengan halaman HTML, bukan respons JSON.',
        snippet: rawText.slice(0, 300),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        errorType: 'FETCH_ERROR',
        message: err?.message || 'Gagal menghubungi server Google Apps Script.',
      });
    }
  });

  // 3. Questionnaire Submission Proxy
  // Relays submissions server-side to eliminate all browser CORS & redirect errors
  app.post('/api/submit-questionnaire', async (req: Request, res: Response) => {
    const payload = req.body;
    const targetUrl = (req.headers['x-target-gas-url'] as string) || '';

    if (!payload || !payload.submission_id) {
      return res.status(400).json({
        success: false,
        error: 'Payload kuesioner tidak lengkap atau tidak valid.',
      });
    }

    // Determine target URL from header or config
    let gasUrl = targetUrl.trim();
    if (!gasUrl) {
      gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL || '';
    }

    if (!gasUrl || gasUrl.includes('YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL')) {
      return res.json({
        success: true,
        submission_id: payload.submission_id,
        isMock: true,
        message: 'Disimpan secara lokal (Mock Mode - URL Apps Script belum diisi)',
      });
    }

    try {
      const gasResponse = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const responseText = await gasResponse.text();

      // Try parsing as JSON
      let resultJson: any = null;
      try {
        resultJson = JSON.parse(responseText);
      } catch (e) {
        // Response was not JSON
      }

      if (resultJson && resultJson.success) {
        return res.json({
          success: true,
          submission_id: resultJson.submission_id || payload.submission_id,
          message: resultJson.message || 'Jawaban kuesioner berhasil disimpan ke Google Sheets.',
        });
      }

      // Check if it's the known "doPost not found" error in Google Apps Script
      const isMissingDoPost =
        responseText.includes('doPost') &&
        (responseText.includes('找不到以下指令碼函式') ||
          responseText.includes('Script function not found') ||
          responseText.includes('Fungsi skrip tidak ditemukan'));

      if (isMissingDoPost) {
        return res.status(200).json({
          success: false,
          isAppsScriptIssue: true,
          errorType: 'DO_POST_NOT_FOUND',
          error:
            "URL Google Apps Script terhubung, namun fungsi 'doPost' belum aktif di versi deployment Anda.",
          instructions: [
            '1. Buka Google Spreadsheet kuesioner Anda.',
            '2. Klik Extensions (Ekstensi) > Apps Script.',
            '3. Pastikan isi file Code.gs telah diganti dengan seluruh kode dari google-apps-script/Code.gs, lalu klik ikon Simpan (Ctrl+S).',
            '4. Klik tombol Deploy > Manage deployments (Kelola penerapan).',
            '5. Klik ikon Pensil (Edit) pada deployment aktif, ubah Version ke "New version" (Versi baru).',
            '6. Klik Deploy. Setelah itu, klik tombol Coba Kirim Ulang di bawah.',
          ],
        });
      }

      // Check if it's an authorization/login requirement
      const isAuthRequired =
        responseText.includes('ServiceLogin') ||
        responseText.includes('accounts.google.com') ||
        responseText.includes('Sign in - Google Accounts');

      if (isAuthRequired) {
        return res.status(200).json({
          success: false,
          isAppsScriptIssue: true,
          errorType: 'AUTH_REQUIRED',
          error:
            "Akses Google Apps Script memerlukan login akun Google.",
          instructions: [
            '1. Buka Google Spreadsheet > Extensions > Apps Script.',
            '2. Klik Deploy > Manage deployments.',
            '3. Klik Edit (pensil) pada Web app.',
            '4. Pastikan "Who has access" dipilih "Anyone" (Siapa saja), bukan "Only myself".',
            '5. Simpan & deploy versi baru.',
          ],
        });
      }

      if (resultJson && !resultJson.success) {
        return res.status(200).json({
          success: false,
          error: resultJson.message || resultJson.error || 'Gagal menyimpan ke Google Sheets.',
        });
      }

      // Fallback for unexpected HTML response
      return res.status(200).json({
        success: false,
        error: 'Google Apps Script merespons dengan halaman tidak terduga.',
        rawSnippet: responseText.slice(0, 300),
      });
    } catch (networkError: any) {
      console.error('Server-side fetch to Google Apps Script failed:', networkError);
      return res.status(500).json({
        success: false,
        error: `Koneksi ke Google Apps Script gagal: ${networkError.message || networkError}`,
      });
    }
  });

  // 4. Vite middleware for development & static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
