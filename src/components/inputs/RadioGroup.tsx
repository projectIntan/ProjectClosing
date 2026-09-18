import React from 'react';
import { isOtherOption } from '../../utils/formUtils';

interface RadioGroupProps {
  id: string;
  name: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  id,
  name,
  options,
  value,
  onChange,
  hasError = false,
  otherValue = '',
  onOtherChange,
}) => {
  return (
    <div id={id} className="space-y-2.5">
      {options.map((opt, idx) => {
        const isSelected = value === opt;
        const optId = `${id}_opt_${idx}`;
        const isOther = isOtherOption(opt);

        return (
          <div
            key={opt}
            className={`rounded-xl border transition-all ${
              isSelected
                ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30 shadow-2xs'
                : hasError
                ? 'border-rose-200 bg-white hover:border-slate-300'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
            }`}
          >
            <label
              htmlFor={optId}
              className="flex items-start min-h-[48px] p-3 sm:p-3.5 cursor-pointer select-none text-sm touch-manipulation active:scale-[0.99]"
            >
              <div className="flex items-center h-5 mr-3 pt-0.5">
                <input
                  id={optId}
                  name={name}
                  type="radio"
                  value={opt}
                  checked={isSelected}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <span className={`leading-snug pt-0.5 flex-1 ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                {opt}
              </span>
            </label>

            {/* When "Lainnya" is selected, show text field */}
            {isSelected && isOther && (
              <div className="px-3 sm:px-3.5 pb-3.5 pt-0 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="pt-2.5 border-t border-blue-200/70">
                  <label
                    htmlFor={`${optId}_other_input`}
                    className="block text-xs font-semibold text-blue-900 mb-1.5"
                  >
                    Sebutkan / jelaskan jawaban lainnya: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id={`${optId}_other_input`}
                    type="text"
                    value={otherValue}
                    onChange={(e) => onOtherChange?.(e.target.value)}
                    placeholder="Tuliskan jawaban yang tidak ada di pilihan di sini..."
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white rounded-xl border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 placeholder:text-slate-400 shadow-2xs"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
