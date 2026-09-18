import { QuestionCondition, QuestionDefinition, FormResponses, ValidationErrors } from '../types';

/**
 * Checks if a question should be shown based on its condition.
 */
export function isQuestionVisible(
  condition: QuestionCondition | undefined,
  responses: FormResponses
): boolean {
  if (!condition) return true;

  const parentValue = responses[condition.questionId];

  switch (condition.operator) {
    case 'equals':
      return parentValue === condition.value;
    case 'notEquals':
      return parentValue !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(parentValue);
    case 'notIn':
      return Array.isArray(condition.value) && !condition.value.includes(parentValue);
    default:
      return true;
  }
}

/**
 * Detects if an option text represents an "Other" / "Lainnya" choice.
 */
export function isOtherOption(optionText: string | undefined | null): boolean {
  if (!optionText || typeof optionText !== 'string') return false;
  const lower = optionText.trim().toLowerCase();
  return (
    lower === 'lainnya' ||
    lower === 'lain-lain' ||
    lower.startsWith('lainnya') ||
    lower.startsWith('lain-lain') ||
    lower.includes('(sebutkan)') ||
    lower === 'other' ||
    lower.startsWith('other')
  );
}

/**
 * Validates a list of questions against current responses.
 * Only validates questions that are currently visible.
 */
export function validateQuestions(
  questions: QuestionDefinition[],
  responses: FormResponses
): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const q of questions) {
    if (!isQuestionVisible(q.condition, responses)) {
      continue;
    }

    const val = responses[q.id];
    const otherVal = responses[`${q.id}_other`];

    if (q.required) {
      if (q.type === 'checkbox') {
        if (!Array.isArray(val) || val.length === 0) {
          errors[q.id] = 'Pilihan ini wajib dicentang minimal satu.';
        }
      } else if (q.type === 'file') {
        // Files can be optional unless explicitly required
        if (!val || (Array.isArray(val) && val.length === 0)) {
          errors[q.id] = 'Silakan unggah dokumen pendukung.';
        }
      } else if (q.type === 'number') {
        if (val === undefined || val === null || String(val).trim() === '' || isNaN(Number(val))) {
          errors[q.id] = 'Bidang angka ini wajib diisi.';
        }
      } else {
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[q.id] = 'Pertanyaan ini wajib diisi.';
        }
      }
    }

    // If user chose "Lainnya" in radio, select, or checkbox, ensure the detail text field is completed
    if (q.type === 'radio' || q.type === 'select') {
      if (isOtherOption(val) && (!otherVal || String(otherVal).trim() === '')) {
        errors[q.id] = 'Silakan isi rincian jawaban untuk pilihan Lainnya.';
      }
    } else if (q.type === 'checkbox' && Array.isArray(val)) {
      const hasOther = val.some((item) => isOtherOption(item));
      if (hasOther && (!otherVal || String(otherVal).trim() === '')) {
        errors[q.id] = 'Silakan isi rincian jawaban untuk pilihan Lainnya.';
      }
    }
  }

  return errors;
}

/**
 * Formats bytes into a readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
