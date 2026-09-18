import React from 'react';
import { QuestionDefinition, FormResponses, ProjectMock } from '../types';
import { TextInput } from './inputs/TextInput';
import { TextArea } from './inputs/TextArea';
import { RadioGroup } from './inputs/RadioGroup';
import { CheckboxGroup } from './inputs/CheckboxGroup';
import { SelectInput } from './inputs/SelectInput';
import { SearchableSelect } from './inputs/SearchableSelect';
import { DateInput } from './inputs/DateInput';
import { NumberInput } from './inputs/NumberInput';
import { RatingScale } from './inputs/RatingScale';
import { FileUpload } from './inputs/FileUpload';
import { AlertCircle } from 'lucide-react';

interface QuestionRendererProps {
  question: QuestionDefinition;
  responses: FormResponses;
  onChange: (questionId: string, value: any) => void;
  error?: string;
  projects?: ProjectMock[];
  onSelectProject?: (project: ProjectMock | null) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  responses,
  onChange,
  error,
  projects = [],
  onSelectProject,
}) => {
  const value = responses[question.id];
  const hasError = Boolean(error);

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <TextInput
            id={question.id}
            value={value || ''}
            onChange={(val) => onChange(question.id, val)}
            placeholder={question.placeholder}
            readOnly={question.readOnly}
            hasError={hasError}
          />
        );

      case 'textarea':
        return (
          <TextArea
            id={question.id}
            value={value || ''}
            onChange={(val) => onChange(question.id, val)}
            placeholder={question.placeholder}
            hasError={hasError}
          />
        );

      case 'radio':
        return (
          <RadioGroup
            id={question.id}
            name={question.id}
            options={question.options || []}
            value={value || ''}
            onChange={(val) => onChange(question.id, val)}
            hasError={hasError}
            otherValue={responses[`${question.id}_other`] || ''}
            onOtherChange={(otherVal) => onChange(`${question.id}_other`, otherVal)}
          />
        );

      case 'checkbox':
        return (
          <CheckboxGroup
            id={question.id}
            options={question.options || []}
            value={value || []}
            onChange={(val) => onChange(question.id, val)}
            hasError={hasError}
            otherValue={responses[`${question.id}_other`] || ''}
            onOtherChange={(otherVal) => onChange(`${question.id}_other`, otherVal)}
          />
        );

      case 'select':
        return (
          <SelectInput
            id={question.id}
            options={question.options || []}
            value={value || ''}
            onChange={(val) => onChange(question.id, val)}
            placeholder={question.placeholder}
            hasError={hasError}
            otherValue={responses[`${question.id}_other`] || ''}
            onOtherChange={(otherVal) => onChange(`${question.id}_other`, otherVal)}
          />
        );

      case 'searchable-select':
        return (
          <SearchableSelect
            id={question.id}
            projects={projects}
            selectedCode={value || ''}
            onSelectProject={(proj) => {
              if (onSelectProject) {
                onSelectProject(proj);
              } else {
                onChange(question.id, proj ? `${proj.code} - ${proj.name}` : '');
              }
            }}
            hasError={hasError}
          />
        );

      case 'date':
        return (
          <DateInput
            id={question.id}
            value={value || ''}
            onChange={(val) => onChange(question.id, val)}
            hasError={hasError}
          />
        );

      case 'number':
        return (
          <NumberInput
            id={question.id}
            value={value ?? ''}
            onChange={(val) => onChange(question.id, val)}
            unit={question.unit}
            placeholder={question.placeholder}
            hasError={hasError}
          />
        );

      case 'scale':
        return (
          <RatingScale
            id={question.id}
            value={value ?? ''}
            onChange={(val) => onChange(question.id, val)}
            scaleConfig={question.scaleConfig}
            hasError={hasError}
          />
        );

      case 'file':
        return (
          <FileUpload
            id={question.id}
            files={value || []}
            onChange={(files) => onChange(question.id, files)}
            helperText={question.helperText}
            hasError={hasError}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      id={`container_${question.id}`}
      className={`p-4 sm:p-6 rounded-xl border bg-white transition-all shadow-xs ${
        hasError
          ? 'border-rose-300 ring-1 ring-rose-200'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="mb-2.5 sm:mb-3">
        <label
          htmlFor={question.id}
          className="block text-sm sm:text-base font-semibold text-slate-800 leading-snug"
        >
          <span className="text-blue-600 font-bold mr-1.5">{question.number}.</span>
          {question.question}
          {question.required && (
            <span className="text-rose-500 font-bold ml-1" title="Pertanyaan ini wajib diisi">
              *
            </span>
          )}
        </label>

        {question.helperText && question.type !== 'file' && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{question.helperText}</p>
        )}
      </div>

      <div className="mt-2">{renderInput()}</div>

      {hasError && (
        <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
