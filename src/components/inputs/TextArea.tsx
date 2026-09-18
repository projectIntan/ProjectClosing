import React from 'react';

interface TextAreaProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hasError?: boolean;
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  hasError = false,
  rows = 4,
}) => {
  return (
    <textarea
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3.5 sm:px-4 py-3 text-base sm:text-sm rounded-xl border transition-colors outline-none resize-y min-h-[110px] leading-relaxed ${
        hasError
          ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
      }`}
    />
  );
};
