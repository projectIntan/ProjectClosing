import React from 'react';

interface TextInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  hasError?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  readOnly = false,
  hasError = false,
}) => {
  return (
    <input
      id={id}
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={readOnly}
      className={`w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 text-base sm:text-sm rounded-xl border transition-colors outline-none ${
        readOnly
          ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed font-medium'
          : hasError
          ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
      }`}
    />
  );
};
