import React from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  value,
  onChange,
  hasError = false,
}) => {
  return (
    <div className="relative w-full sm:max-w-xs">
      <input
        id={id}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 pr-10 text-base sm:text-sm rounded-xl border transition-colors outline-none cursor-pointer ${
          hasError
            ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
            : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
        }`}
      />
      <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
};
