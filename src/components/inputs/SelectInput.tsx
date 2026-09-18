import React from 'react';
import { ChevronDown } from 'lucide-react';
import { isOtherOption } from '../../utils/formUtils';

interface SelectInputProps {
  id: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hasError?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  hasError = false,
  otherValue = '',
  onOtherChange,
}) => {
  const isOther = isOtherOption(value);

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <select
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full min-h-[44px] appearance-none px-3.5 sm:px-4 py-2.5 pr-10 text-base sm:text-sm rounded-xl border transition-colors outline-none cursor-pointer ${
            hasError
              ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
          } ${!value ? 'text-slate-400' : ''}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-slate-900">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {isOther && (
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 animate-in fade-in slide-in-from-top-1 duration-150">
          <label
            htmlFor={`${id}_other_input`}
            className="block text-xs font-semibold text-blue-900 mb-1.5"
          >
            Sebutkan / jelaskan pilihan lainnya: <span className="text-rose-600">*</span>
          </label>
          <input
            id={`${id}_other_input`}
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            placeholder="Tuliskan jawaban yang tidak ada di pilihan di sini..."
            className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white rounded-xl border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 placeholder:text-slate-400 shadow-2xs"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};
