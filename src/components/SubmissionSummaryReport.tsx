import React from 'react';
import {
  Department,
  FormResponses,
  QuestionDefinition,
  UploadedFileMock,
} from '../types';
import { isQuestionVisible, formatBytes, isOtherOption } from '../utils/formUtils';
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Paperclip,
  Printer,
  ShieldCheck,
  User,
  Briefcase,
  Layers,
  FileCheck2,
} from 'lucide-react';

interface SubmissionSummaryReportProps {
  submissionId: string;
  submittedAt: string;
  responses: FormResponses;
  selectedDepartment: Department | '';
  identityQuestions: QuestionDefinition[];
  departmentQuestions: QuestionDefinition[];
  conclusionQuestions: QuestionDefinition[];
  onPrint?: () => void;
}

export const SubmissionSummaryReport: React.FC<SubmissionSummaryReportProps> = ({
  submissionId,
  submittedAt,
  responses,
  selectedDepartment,
  identityQuestions,
  departmentQuestions,
  conclusionQuestions,
  onPrint,
}) => {
  const handlePrintAction = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const renderValue = (q: QuestionDefinition) => {
    const val = responses[q.id];

    if (val === undefined || val === null || val === '') {
      return <span className="text-slate-400 italic text-xs">Tidak ada data / Tidak diisi</span>;
    }

    if (q.type === 'checkbox') {
      if (!Array.isArray(val) || val.length === 0) {
        return <span className="text-slate-400 italic text-xs">Tidak ada yang dipilih</span>;
      }
      const otherVal = responses[`${q.id}_other`];
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {val.map((item: string, idx: number) => {
            const isOther = isOtherOption(item);
            const displayText = isOther && otherVal ? `${item}: ${otherVal}` : item;
            return (
              <span
                key={idx}
                className="inline-flex items-center text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded font-medium border border-slate-200 print:border-slate-300"
              >
                {displayText}
              </span>
            );
          })}
        </div>
      );
    }

    if (q.type === 'scale') {
      const numVal = Number(val);
      return (
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-900 px-2.5 py-1 rounded font-semibold text-xs border border-blue-200 print:bg-slate-50 print:border-slate-300">
          <span>Nilai: <strong>{val}</strong> dari 5</span>
          <div className="flex items-center space-x-0.5 text-amber-500 print:text-slate-600">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={star <= numVal ? 'opacity-100 font-bold' : 'opacity-20'}>
                ★
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (q.type === 'file') {
      const files: UploadedFileMock[] = Array.isArray(val) ? val : [];
      if (files.length === 0) {
        return <span className="text-slate-400 italic text-xs">Tidak ada file terlampir</span>;
      }
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 text-slate-800 px-2.5 py-1 rounded border border-slate-200"
            >
              <Paperclip className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="font-medium">{f.name}</span>
              <span className="text-slate-500 text-[11px]">({formatBytes(f.size)})</span>
            </div>
          ))}
        </div>
      );
    }

    const otherVal = responses[`${q.id}_other`];
    const displayVal =
      (q.type === 'radio' || q.type === 'select') && isOtherOption(val) && otherVal
        ? `${val}: ${otherVal}`
        : String(val);

    return (
      <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-line leading-relaxed">
        {displayVal}
        {q.unit ? ` ${q.unit}` : ''}
      </p>
    );
  };

  const renderQuestionList = (questions: QuestionDefinition[]) => {
    const visible = questions.filter((q) => isQuestionVisible(q.condition, responses));

    // Group by subsection if exists
    const grouped: { [key: string]: QuestionDefinition[] } = {};
    visible.forEach((q) => {
      const sub = q.subsection || 'Umum';
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(q);
    });

    const subKeys = Object.keys(grouped);

    return (
      <div className="divide-y divide-slate-200/80">
        {subKeys.map((subKey) => (
          <div key={subKey} className="py-3.5 first:pt-0 last:pb-0">
            {subKey !== 'Umum' && (
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200/60 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                  Sub-bagian: {subKey}
                </span>
              </div>
            )}
            <div className="space-y-3">
              {grouped[subKey].map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-50/50 p-3 rounded-lg border border-slate-200/70 print:bg-white print:border-slate-200 print-break-inside-avoid"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      <strong className="text-blue-700 font-bold mr-1 print:text-slate-900">
                        {q.number}.
                      </strong>
                      {q.question}
                    </span>
                  </div>
                  <div className="pl-3 sm:pl-4 border-l-2 border-blue-400/80 print:border-slate-400 mt-1.5">
                    {renderValue(q)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      id="project_closing_summary_report"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none overflow-hidden text-slate-800"
    >
      {/* Action Bar (Hidden on Print) */}
      <div className="bg-slate-800 text-white px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Ringkasan Data Kuesioner Penutupan Proyek
            </h3>
            <p className="text-xs text-slate-300">
              Dokumen resmi yang memuat seluruh jawaban yang telah diinput responden.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintAction}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Official Report Container */}
      <div className="p-6 sm:p-10 space-y-8 print:p-0 print:space-y-6">
        {/* Formal Header (Letterhead style) */}
        <div className="border-b-2 border-slate-800 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white print:text-black print:bg-slate-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 print:text-slate-800">
                    ENTERPRISE PROJECT MANAGEMENT OFFICE (PMO)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-300 print:border-slate-400">
                    RESMI / TERVERIFIKASI
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                  Laporan Hasil Evaluasi Penutupan Proyek
                </h1>
                <p className="text-xs text-slate-500">
                  Project Closing Questionnaire & Lessons Learned Documentation
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 print:border-none print:p-0">
              <div>
                <span className="text-slate-500">No. Referensi: </span>
                <span className="font-mono font-bold text-blue-700 print:text-slate-900">
                  {submissionId}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Waktu Submit: </span>
                <span className="font-semibold text-slate-800">{submittedAt}</span>
              </div>
              <div>
                <span className="text-slate-500">Klasifikasi: </span>
                <span className="font-semibold text-slate-700">Internal Confidential</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Metadata Table */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 print-break-inside-avoid">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Informasi Utama Proyek & Responden</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 pr-3">
              <span className="text-slate-500 block">Nama Responden / PIC:</span>
              <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                {responses.ident_01_name || '—'}
              </strong>
              <span className="text-slate-500 text-[11px]">
                Jabatan: {responses.ident_01_role || '—'}
              </span>
            </div>

            <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 pr-3">
              <span className="text-slate-500 block">Fungsi / Departemen:</span>
              <strong className="text-sm font-bold text-blue-700 print:text-slate-900 block mt-0.5">
                {selectedDepartment || '—'}
              </strong>
              <span className="text-slate-500 text-[11px]">
                Email: {responses.ident_01_email || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Nama Proyek:</span>
              <strong className="text-sm font-bold text-slate-900 block mt-0.5 break-words">
                {responses.ident_03_project || '—'}
              </strong>
              <span className="text-slate-500 text-[11px] block mt-0.5 break-words">
                Klien: {responses.ident_05_client || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Identitas Responden & Proyek */}
        <section className="space-y-3 print-break-inside-avoid">
          <div className="flex items-center space-x-2 border-b border-slate-300 pb-2">
            <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bagian 1: Identitas Responden dan Proyek
            </h2>
          </div>
          {renderQuestionList(identityQuestions)}
        </section>

        {/* Section 2: Evaluasi Khusus Fungsi */}
        <section className="space-y-3 print-break-inside-avoid print-break-before-page">
          <div className="flex items-center space-x-2 border-b border-slate-300 pb-2">
            <div className="w-6 h-6 rounded bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bagian 2: Evaluasi Khusus Fungsi ({selectedDepartment})
            </h2>
          </div>
          {renderQuestionList(departmentQuestions)}
        </section>

        {/* Section 3: Kesimpulan & Tindak Lanjut */}
        <section className="space-y-3 print-break-inside-avoid print-break-before-page">
          <div className="flex items-center space-x-2 border-b border-slate-300 pb-2">
            <div className="w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bagian 3: Kesimpulan, Lessons Learned & Rencana Tindak Lanjut
            </h2>
          </div>
          {renderQuestionList(conclusionQuestions)}
        </section>

        {/* Lembar Verifikasi & Pengesahan Dokumen Penutupan Proyek (Sementara di-hide sesuai permintaan) */}
        {/* 
        <div className="pt-6 border-t-2 border-slate-800 print-break-inside-avoid">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-6 text-center sm:text-left">
            Lembar Verifikasi & Pengesahan Dokumen Penutupan Proyek
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 print:bg-white flex flex-col justify-between h-40">
              <span className="font-semibold text-slate-700">Disiapkan Oleh (Responden):</span>
              <div className="my-auto">
                <div className="font-bold text-slate-900 text-sm">{responses.ident_01_name || '................................'}</div>
                <div className="text-slate-500 text-[11px]">{selectedDepartment || 'PIC Fungsi'}</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Tanda Tangan & Tanggal
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 print:bg-white flex flex-col justify-between h-40">
              <span className="font-semibold text-slate-700">Diketahui Oleh:</span>
              <div className="my-auto">
                <div className="font-bold text-slate-900 text-sm">Project Manager</div>
                <div className="text-slate-500 text-[11px]">{responses.ident_03_project || 'Proyek'}</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Tanda Tangan & Tanggal
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 print:bg-white flex flex-col justify-between h-40">
              <span className="font-semibold text-slate-700">Diverifikasi & Diarsipkan:</span>
              <div className="my-auto">
                <div className="font-bold text-slate-900 text-sm">PMO / Quality Assurance</div>
                <div className="text-slate-500 text-[11px]">Enterprise PMO Governance</div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Tanda Tangan & Tanggal
              </div>
            </div>
          </div>
        </div>
        */}

        {/* Footer Info Dokumen */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
          Dokumen ini dihasilkan secara otomatis oleh Enterprise Project Management Information System (PMIS)
          pada {submittedAt}. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </div>
    </div>
  );
};
