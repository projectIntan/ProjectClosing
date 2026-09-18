import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  stepNumber: number;
  totalSteps?: number;
  title: string;
  description: string;
  badgeText?: string;
  icon?: LucideIcon;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  stepNumber,
  totalSteps = 4,
  title,
  description,
  badgeText,
  icon: Icon,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-7 shadow-xs relative overflow-hidden border-t-4 border-t-blue-600">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Bagian {stepNumber} dari {totalSteps}
            </span>
            {badgeText && (
              <span className="text-[11px] sm:text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[200px] sm:max-w-none">
                {badgeText}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>

        {Icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
        <span className="text-rose-600 font-medium">
          * Menunjukkan pertanyaan yang wajib diisi
        </span>
      </div>
    </div>
  );
};
