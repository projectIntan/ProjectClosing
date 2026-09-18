import React, { useState } from 'react';
import {
  CheckCircle,
  RotateCcw,
  Printer,
  Copy,
  Check,
  Building,
  Download,
  FileText,
} from 'lucide-react';
import {
  FormResponses,
  Department,
  QuestionDefinition,
  QuestionnaireSubmissionPayload,
} from '../types';
import { SubmissionSummaryReport } from './SubmissionSummaryReport';
import { PdfPreviewModal } from './PdfPreviewModal';
import { downloadQuestionnairePdf } from '../services/pdfGenerator';

interface SuccessPageProps {
  submissionId: string;
  submittedAt: string;
  responses: FormResponses;
  selectedDepartment: Department;
  identityQuestions: QuestionDefinition[];
  departmentQuestions: QuestionDefinition[];
  conclusionQuestions: QuestionDefinition[];
  payload?: QuestionnaireSubmissionPayload;
  onReset: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  submissionId,
  submittedAt,
  responses,
  selectedDepartment,
  identityQuestions,
  departmentQuestions,
  conclusionQuestions,
  payload,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(submissionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPdfModal = () => {
    setIsPdfModalOpen(true);
  };

  const handleDirectDownload = () => {
    try {
      setIsDirectDownloading(true);
      downloadQuestionnairePdf({
        submissionId,
        submittedAt,
        responses,
        selectedDepartment,
        identityQuestions,
        departmentQuestions,
        conclusionQuestions,
        payload,
      });
    } catch (e) {
      console.error('Direct download error, opening modal fallback', e);
      setIsPdfModalOpen(true);
    } finally {
      setTimeout(() => setIsDirectDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-8">
      {/* Success Hero Card (Hidden on Print so Print output is the pure Official Report) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center shadow-xs print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
          <CheckCircle className="w-9 h-9" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Project Closing Questionnaire Berhasil Dikirim
        </h2>

        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          Terima kasih atas kontribusi dan evaluasi Anda. Data kuesioner Anda telah berhasil direkam ke sistem dan Google Sheets.
        </p>

        {/* Reference ID Pill */}
        <div className="mt-5 inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-600">
          <span>Submission Reference ID:</span>
          <span className="font-mono font-bold text-blue-700">{submissionId}</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors ml-1 cursor-pointer"
            title="Salin ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action Buttons Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleOpenPdfModal}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDirectDownload}
            disabled={isDirectDownloading}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            title="Download file PDF secara langsung"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isDirectDownloading ? 'Mengunduh...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Isi Kuesioner Baru</span>
          </button>
        </div>

        {/* Internal Note */}
        <div className="mt-6 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center space-x-2.5 text-xs text-slate-600 text-left sm:text-center">
          <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Tanggapan Anda telah tersimpan secara resmi dalam Enterprise PMIS & Google Sheets. Salinan dokumen resmi tercantum di bawah ini.
          </span>
        </div>
      </div>

      {/* Complete Summary Document: Included in Screen & Target for Print / PDF */}
      <SubmissionSummaryReport
        submissionId={submissionId}
        submittedAt={submittedAt}
        responses={responses}
        selectedDepartment={selectedDepartment}
        identityQuestions={identityQuestions}
        departmentQuestions={departmentQuestions}
        conclusionQuestions={conclusionQuestions}
        onPrint={handleOpenPdfModal}
      />

      {/* PDF Modal with Preview & Download Options */}
      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        submissionId={submissionId}
        submittedAt={submittedAt}
        responses={responses}
        selectedDepartment={selectedDepartment}
        identityQuestions={identityQuestions}
        departmentQuestions={departmentQuestions}
        conclusionQuestions={conclusionQuestions}
        payload={payload}
      />
    </div>
  );
};


