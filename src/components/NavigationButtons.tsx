import React from 'react';
import { ArrowLeft, ArrowRight, Save, CheckCircle2 } from 'lucide-react';
import { StepNumber } from '../types';

interface NavigationButtonsProps {
  currentStep: StepNumber;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  onBack,
  onNext,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
}) => {
  return (
    <div className="pt-6 pb-14 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 print:hidden">
      {/* Back button */}
      <div className="flex-shrink-0">
        {currentStep > 1 && currentStep < 5 && (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-medium text-sm transition-all shadow-2xs touch-manipulation cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        )}
      </div>

      {/* Right/Primary actions: Save Draft (if enabled) & Next/Submit */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {currentStep < 4 && onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 font-medium text-sm transition-all touch-manipulation cursor-pointer"
            title="Simpan sementara di browser ini"
          >
            <Save className="w-4 h-4 text-slate-400" />
            <span>Simpan Draft</span>
          </button>
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-[0.99] touch-manipulation"
          >
            <span>Lanjutkan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : currentStep === 4 ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center space-x-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation active:scale-[0.99]"
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
        ) : null}
      </div>
    </div>
  );
};
