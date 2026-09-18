import React from 'react';
import { ScaleConfig } from '../../types';

interface RatingScaleProps {
  id: string;
  value: number | string;
  onChange: (val: number) => void;
  scaleConfig?: ScaleConfig;
  hasError?: boolean;
}

export const RatingScale: React.FC<RatingScaleProps> = ({
  id,
  value,
  onChange,
  scaleConfig,
  hasError = false,
}) => {
  const min = scaleConfig?.min ?? 1;
  const max = scaleConfig?.max ?? 5;
  const minLabel = scaleConfig?.minLabel;
  const maxLabel = scaleConfig?.maxLabel;

  const steps = [];
  for (let i = min; i <= max; i++) {
    steps.push(i);
  }

  const currentVal = value !== undefined && value !== '' ? Number(value) : null;

  return (
    <div id={id} className="pt-1">
      <div className="flex items-center gap-1.5 sm:gap-3">
        {steps.map((num) => {
          const isSelected = currentVal === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`flex-1 min-h-[48px] py-2.5 px-2 sm:px-4 flex flex-col items-center justify-center rounded-xl border text-sm font-bold transition-all select-none touch-manipulation active:scale-95 ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : hasError
                  ? 'border-rose-200 bg-white hover:border-slate-300 text-slate-700'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="text-base sm:text-base leading-none">{num}</span>
              <span className={`text-[10px] mt-0.5 leading-none ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                ★
              </span>
            </button>
          );
        })}
      </div>

      {(minLabel || maxLabel) && (
        <div className="flex items-start justify-between text-[11px] sm:text-xs text-slate-500 mt-2.5 px-1 leading-snug">
          <span className="font-normal text-left max-w-[48%]">
            {minLabel}
          </span>
          <span className="font-normal text-right max-w-[48%]">
            {maxLabel}
          </span>
        </div>
      )}
    </div>
  );
};
