import React from 'react';

interface NumberInputProps {
  id: string;
  value: string | number;
  onChange: (val: string) => void;
  unit?: string;
  placeholder?: string;
  hasError?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  value,
  onChange,
  unit,
  placeholder = '0',
  hasError = false,
}) => {
  return (
    <div className="relative w-full sm:max-w-xs flex items-center">
      <input
        id={id}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className={`w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 text-base sm:text-sm rounded-xl border transition-colors outline-none ${
          unit ? 'pr-16' : ''
        } ${
          hasError
            ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
        }`}
      />
      {unit && (
        <span className="absolute right-3 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  );
};
