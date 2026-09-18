import React from 'react';
import {
  Department,
  FormResponses,
  QuestionDefinition,
  StepNumber,
  UploadedFileMock,
} from '../types';
import { isQuestionVisible, formatBytes, isOtherOption } from '../utils/formUtils';
import {
  Edit3,
  User,
  Layers,
  FileCheck2,
  Paperclip,
  CheckCircle2,
  Printer,
} from 'lucide-react';

interface ReviewPageProps {
  responses: FormResponses;
  identityQuestions: QuestionDefinition[];
  departmentQuestions: QuestionDefinition[];
  conclusionQuestions: QuestionDefinition[];
  selectedDepartment: Department;
  onEditStep: (step: StepNumber) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  responses,
  identityQuestions,
  departmentQuestions,
  conclusionQuestions,
  selectedDepartment,
  onEditStep,
  onSubmit,
  isSubmitting = false,
}) => {
  const renderValue = (q: QuestionDefinition) => {
    const val = responses[q.id];

    if (val === undefined || val === null || val === '') {
      return <span className="text-slate-400 italic">Tidak diisi / Belum ada jawaban</span>;
    }

    if (q.type === 'checkbox') {
      if (!Array.isArray(val) || val.length === 0) {
        return <span className="text-slate-400 italic">Tidak ada yang dipilih</span>;
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
                className="inline-flex items-center text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200"
              >
                {displayText}
              </span>
            );
          })}
        </div>
      );
    }

    if (q.type === 'scale') {
      return (
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-800 px-2.5 py-1 rounded font-semibold text-xs border border-blue-200">
          <span>Skala: {val} dari 5</span>
        </div>
      );
    }

    if (q.type === 'file') {
      const files: UploadedFileMock[] = Array.isArray(val) ? val : [];
      if (files.length === 0) {
        return <span className="text-slate-400 italic">Tidak ada file terlampir</span>;
      }
      return (
        <div className="space-y-1.5 mt-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="inline-flex items-center space-x-2 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 mr-2"
            >
              <Paperclip className="w-3 h-3 text-slate-500" />
              <span>{f.name}</span>
              <span className="text-slate-500">({formatBytes(f.size)})</span>
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
      <p className="text-sm text-slate-800 font-medium whitespace-pre-line leading-relaxed">
        {displayVal}
        {q.unit ? ` ${q.unit}` : ''}
      </p>
    );
  };

  const renderSectionAnswers = (
    questions: QuestionDefinition[],
    stepTarget: StepNumber,
    sectionTitle: string,
    icon: React.ReactNode
  ) => {
    // Filter visible questions according to conditional logic
    const visibleQuestions = questions.filter((q) =>
      isQuestionVisible(q.condition, responses)
    );

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <div className="text-blue-600 flex-shrink-0">{icon}</div>
            <h3 className="text-xs sm:text-base font-bold text-slate-900 truncate">
              {sectionTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(stepTarget)}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs flex-shrink-0 min-h-[36px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 divide-y divide-slate-100">
          {visibleQuestions.map((q) => (
            <div key={q.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-xs text-slate-500 mb-1 font-medium">
                <span className="text-blue-600 font-bold mr-1">{q.number}.</span>
                {q.question}
                {q.required && <span className="text-rose-500 ml-1">*</span>}
              </p>
              <div>{renderValue(q)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs border-t-4 border-t-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Langkah 4 dari 4
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
              Review Jawaban Kuesioner
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Periksa kembali seluruh jawaban Anda sebelum melakukan pengiriman final. Anda
              dapat mengubah jawaban pada setiap bagian menggunakan tombol edit.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex-shrink-0 print:hidden min-h-[44px]"
            title="Cetak atau Simpan PDF Ringkasan Review"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>

        {/* Executive Summary Card */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Responden</span>
            <strong className="text-slate-800 text-xs sm:text-sm truncate block">
              {responses.ident_01_name || '—'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Fungsi</span>
            <strong className="text-slate-800 text-xs sm:text-sm truncate block">
              {selectedDepartment || '—'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Proyek</span>
            <strong className="text-slate-800 text-xs sm:text-sm truncate block">
              {responses.ident_03_project || '—'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium text-[11px]">Klien</span>
            <strong className="text-slate-800 text-xs sm:text-sm truncate block">
              {responses.ident_05_client || '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* Grouped Sections */}
      {renderSectionAnswers(
        identityQuestions,
        1,
        '1. Identitas Responden & Proyek',
        <User className="w-5 h-5" />
      )}

      {renderSectionAnswers(
        departmentQuestions,
        2,
        `2. Evaluasi: ${selectedDepartment}`,
        <Layers className="w-5 h-5" />
      )}

      {renderSectionAnswers(
        conclusionQuestions,
        3,
        '3. Kesimpulan & Tindak Lanjut',
        <FileCheck2 className="w-5 h-5" />
      )}

      {/* Confirmation Box */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              Apakah seluruh data sudah benar?
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600">
              Setelah dikirim, tanggapan Anda akan tercatat dalam basis data penutupan proyek internal.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center space-x-2 flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Menyimpan jawaban...</span>
            </span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Questionnaire</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
