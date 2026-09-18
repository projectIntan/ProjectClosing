import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileDown,
  RefreshCw,
  X,
  BookOpen,
} from 'lucide-react';
import { SubmissionResponse } from '../types';

interface SubmissionErrorModalProps {
  isOpen: boolean;
  errorInfo: SubmissionResponse | null;
  onClose: () => void;
  onRetry: () => void;
  onProceedOffline: () => void;
  isRetrying?: boolean;
}

export const SubmissionErrorModal: React.FC<SubmissionErrorModalProps> = ({
  isOpen,
  errorInfo,
  onClose,
  onRetry,
  onProceedOffline,
  isRetrying = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !errorInfo) return null;

  const instructions = errorInfo.instructions || [
    'Buka Google Spreadsheet kuesioner Anda di Google Sheets.',
    'Klik menu Ekstensi (Extensions) > Apps Script.',
    'Buka file Code.gs dan pastikan isi kode dari project ini (google-apps-script/Code.gs) telah ditempelkan, lalu simpan (Ctrl+S).',
    'Klik Deploy (Terapkan) > Manage deployments (Kelola penerapan).',
    'Klik ikon Pensil (Edit) pada Web app, ubah Versi menjadi "New version" (Versi baru).',
    'Pastikan "Who has access" adalah "Anyone" (Siapa saja), lalu klik Deploy.',
  ];

  const handleCopySampleCode = async () => {
    try {
      // Basic Google Apps Script template snippet or fetch if needed
      const codeSample = `// Pastikan fungsi doPost ada dan mengembalikan JSON:
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
  // Buka file google-apps-script/Code.gs untuk kode lengkap
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "OK" })).setMimeType(ContentService.MimeType.JSON);
}`;
      await navigator.clipboard.writeText(codeSample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Pemberitahuan Pengiriman Kuesioner
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Integrasi Google Sheets memerlukan pembaruan versi Apps Script
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="py-4 space-y-4 text-sm text-slate-700">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-900">
              {errorInfo.error || 'Terjadi kendala saat mengirim ke Google Apps Script.'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Data jawaban kuesioner Anda tetap aman dan tidak hilang. Anda dapat memperbarui penerapan Google Apps Script lalu mencoba kirim kembali, atau langsung mengunduh ringkasan PDF resmi sekarang.
            </p>
          </div>

          {/* Step by step fix instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                Cara Memperbaiki di Google Apps Script:
              </span>
            </div>
            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside pl-1">
              {instructions.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-slate-800">{step.replace(/^\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="text-xs text-slate-500 bg-slate-100/70 p-3 rounded-lg flex items-center justify-between">
            <span>Kode lengkap tersedia di folder project: <code>google-apps-script/Code.gs</code></span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
          >
            Kembali ke Form
          </button>

          <button
            type="button"
            onClick={onProceedOffline}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 active:bg-emerald-800 shadow-sm transition-all"
            title="Lanjutkan ke halaman selesai dan download PDF langsung"
          >
            <FileDown className="w-4 h-4" />
            <span>Lanjutkan & Unduh PDF</span>
          </button>

          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-xs hover:bg-primary-hover active:bg-primary-dark shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Mengirim Ulang...' : 'Coba Kirim Ulang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
