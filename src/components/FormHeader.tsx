import React from 'react';
import { Building2, ShieldCheck, Clock, RotateCcw } from 'lucide-react';

interface FormHeaderProps {
  lastSavedAt: string | null;
  onResetDraft: () => void;
  hasDraft: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  lastSavedAt,
  onResetDraft,
  hasDraft,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs print:hidden">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        {/* Company Brand */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-700 truncate">
                Enterprise PMO
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                Internal Confidential
              </span>
            </div>
            <h1 className="text-xs sm:text-lg font-bold text-slate-900 leading-tight truncate">
              Project Closing Questionnaire
            </h1>
          </div>
        </div>

        {/* Autosave & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 text-xs flex-shrink-0">
          {lastSavedAt && (
            <div className="flex items-center space-x-1 sm:space-x-1.5 text-slate-600 bg-slate-50 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] sm:text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline text-slate-500">Tersimpan:</span>
              <strong className="text-slate-700">{lastSavedAt}</strong>
            </div>
          )}

          {hasDraft && (
            <button
              type="button"
              onClick={onResetDraft}
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 active:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors min-h-[36px]"
              title="Reset seluruh isian dan mulai form baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Form</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
