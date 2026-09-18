import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  Department,
  FormResponses,
  QuestionDefinition,
  QuestionnaireSubmissionPayload,
} from '../types';
import {
  downloadQuestionnairePdf,
  createQuestionnairePdfBlobUrl,
} from '../services/pdfGenerator';
import { isQuestionVisible } from '../utils/formUtils';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  submittedAt: string;
  responses: FormResponses;
  selectedDepartment: Department;
  identityQuestions: QuestionDefinition[];
  departmentQuestions: QuestionDefinition[];
  conclusionQuestions: QuestionDefinition[];
  payload?: QuestionnaireSubmissionPayload;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  submittedAt,
  responses,
  selectedDepartment,
  identityQuestions,
  departmentQuestions,
  conclusionQuestions,
  payload,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'pdf'>('summary');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate blob URL when opening or switching to PDF tab
  useEffect(() => {
    if (!isOpen) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setActiveTab('summary');
      setDownloadSuccess(null);
      setErrorMsg(null);
      return;
    }

    try {
      const url = createQuestionnairePdfBlobUrl({
        submissionId,
        submittedAt,
        responses,
        selectedDepartment,
        identityQuestions,
        departmentQuestions,
        conclusionQuestions,
        payload,
      });
      setBlobUrl(url);
    } catch (e: any) {
      console.error('Failed to create PDF blob URL', e);
      setErrorMsg(
        'Pratinjau PDF tidak dapat dimuat langsung. Anda tetap dapat mencetak atau mengekspor dokumen menggunakan tombol cetak di atas.'
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const fileName = downloadQuestionnairePdf({
        submissionId,
        submittedAt,
        responses,
        selectedDepartment,
        identityQuestions,
        departmentQuestions,
        conclusionQuestions,
        payload,
      });
      setDownloadSuccess(`File berhasil diunduh: ${fileName}`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: any) {
      console.error('PDF Generation failed, fallback to print:', err);
      setErrorMsg(
        'Gagal membuat PDF otomatis. Mengalihkan ke dialog Cetak / Simpan PDF browser...'
      );
      setTimeout(() => {
        window.print();
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrowserPrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const projectCode =
    payload?.project_code ||
    (responses.ident_03_project?.includes(' - ')
      ? responses.ident_03_project.split(' - ')[0]
      : 'PRJ');
  const projectName =
    payload?.project_name ||
    (responses.ident_03_project?.includes(' - ')
      ? responses.ident_03_project.split(' - ').slice(1).join(' - ')
      : responses.ident_03_project || 'Proyek');

  return (
    <div
      id="pdf-preview-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden"
    >
      <div
        id="pdf-preview-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Ringkasan Project Closing Questionnaire
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {submissionId} • {submittedAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Notifications */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ringkasan Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-md transition-all inline-flex items-center space-x-1 ${
                activeTab === 'pdf'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Preview Tata Letak PDF</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          {activeTab === 'pdf' && blobUrl ? (
            <div className="w-full h-[55vh] rounded-xl border border-slate-200 overflow-hidden bg-white">
              <iframe
                src={blobUrl}
                title="PDF Document Preview"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Metadata Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Informasi Proyek & Responden
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Nama Proyek:</span>
                    <p className="font-semibold text-slate-800 break-words">{projectName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Kode Proyek:</span>
                    <p className="font-semibold text-slate-800 font-mono">{projectCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Business Unit:</span>
                    <p className="font-semibold text-slate-800">
                      {payload?.business_unit || responses.ident_04_bu || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Klien:</span>
                    <p className="font-semibold text-slate-800">
                      {payload?.client || responses.ident_05_client || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Responden:</span>
                    <p className="font-semibold text-slate-800">
                      {payload?.respondent_name || responses.ident_01_name || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Fungsi / Departemen:</span>
                    <p className="font-semibold text-blue-700">
                      {payload?.function || selectedDepartment || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answers List */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Pertanyaan & Jawaban
                </h4>

                {/* Section 2 Department Questions */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded">
                    Evaluasi Fungsi: {selectedDepartment}
                  </h5>

                  {departmentQuestions
                    .filter((q) => isQuestionVisible(q.condition, responses))
                    .map((q, idx) => {
                      const val = responses[q.id];
                      let displayVal = '—';
                      if (Array.isArray(val) && val.length > 0) {
                        displayVal = val.join(', ');
                      } else if (val) {
                        displayVal = String(val);
                      }

                      return (
                        <div key={q.id} className="text-xs border-b border-slate-100 pb-2.5">
                          <p className="text-slate-600 font-medium">
                            {idx + 1}. {q.question}
                          </p>
                          <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line pl-3 border-l-2 border-blue-500">
                            {displayVal} {q.unit || ''}
                          </p>
                        </div>
                      );
                    })}
                </div>

                {/* Section 3 Conclusion Questions */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                    Kesimpulan & Tindak Lanjut
                  </h5>

                  {conclusionQuestions
                    .filter((q) => isQuestionVisible(q.condition, responses))
                    .map((q, idx) => {
                      const val = responses[q.id];
                      return (
                        <div key={q.id} className="text-xs border-b border-slate-100 pb-2.5">
                          <p className="text-slate-600 font-medium">
                            {idx + 1}. {q.question}
                          </p>
                          <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line pl-3 border-l-2 border-slate-400">
                            {val ? String(val) : '—'}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Browser</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Menyiapkan PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
