import React from 'react';
import { StepNumber, Department } from '../types';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: StepNumber;
  selectedDepartment: Department | '';
  onStepClick?: (step: StepNumber) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  selectedDepartment,
  onStepClick,
}) => {
  const steps = [
    { num: 1 as StepNumber, label: 'Identitas & Proyek', shortLabel: 'Identitas' },
    {
      num: 2 as StepNumber,
      label: selectedDepartment ? `Form: ${selectedDepartment}` : 'Form Evaluasi Fungsi',
      shortLabel: selectedDepartment ? selectedDepartment.split(' ')[0] : 'Fungsi',
    },
    { num: 3 as StepNumber, label: 'Kesimpulan & Tindak Lanjut', shortLabel: 'Kesimpulan' },
    { num: 4 as StepNumber, label: 'Review & Submit', shortLabel: 'Review' },
  ];

  // If in step 5 (Submitted), progress is 100%
  const progressPercent =
    currentStep === 5
      ? 100
      : Math.round(((currentStep - 1) / (steps.length - 1)) * 100) || 10;

  const currentStepObj = steps.find((s) => s.num === currentStep) || steps[0];

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-[53px] sm:top-[61px] z-10 py-2.5 sm:py-3 px-3.5 sm:px-6 shadow-xs print:hidden">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-between sm:justify-start sm:space-x-8 mb-2">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            // Only allow clicking to previously completed steps or current step
            const isClickable = onStepClick && currentStep < 5 && currentStep > step.num;

            return (
              <button
                key={step.num}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.num)}
                className={`flex items-center space-x-2 text-left transition-all min-h-[44px] min-w-[44px] justify-center sm:justify-start ${
                  isClickable
                    ? 'cursor-pointer hover:opacity-85 active:scale-95'
                    : 'cursor-default'
                }`}
                title={isClickable ? `Kembali ke ${step.label}` : step.label}
              >
                <div
                  className={`w-7 h-7 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 ring-2 ring-blue-100'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>

                <div className="hidden sm:block text-left">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isCurrent
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mobile & Desktop Step Details */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
          <span className="truncate pr-2">
            <strong className="text-slate-700 sm:font-normal">
              Langkah {Math.min(currentStep, 4)} dari 4:
            </strong>{' '}
            <span className="text-blue-700 font-semibold sm:hidden">
              {currentStepObj.shortLabel}
            </span>
            <span className="hidden sm:inline">
              {currentStepObj.label}
            </span>
            {currentStep === 5 && ' — Selesai'}
          </span>
          <span className="font-bold text-blue-600 flex-shrink-0">{progressPercent}%</span>
        </div>
      </div>
    </div>
  );
};
