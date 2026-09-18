import { GOOGLE_APPS_SCRIPT_URL } from '../config';
import {
  Department,
  FormResponses,
  QuestionDefinition,
  QuestionnaireSubmissionPayload,
  SubmissionAnswerItem,
  SubmissionResponse,
} from '../types';
import { isQuestionVisible, isOtherOption } from '../utils/formUtils';

/**
 * Generates a unique submission ID adhering to SUB-YYYYMMDD-XXXX format.
 * Example: SUB-20260918-0001
 */
export function generateSubmissionId(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  // Random 4-digit number between 1000 and 9999
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SUB-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Formats an arbitrary response value into a clean, human-readable string.
 */
export function formatAnswerValue(
  question: QuestionDefinition,
  value: any,
  allResponses: FormResponses
): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  // Checkbox array
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const otherVal = allResponses[`${question.id}_other`];
    const items = value.map((item) => {
      if (isOtherOption(item) && otherVal) {
        return `${item}: ${otherVal}`;
      }
      return item;
    });
    return items.join('; ');
  }

  // Radio or Select with "Lainnya"
  if (
    (question.type === 'radio' || question.type === 'select') &&
    isOtherOption(value)
  ) {
    const otherVal = allResponses[`${question.id}_other`];
    return otherVal ? `${value}: ${otherVal}` : String(value);
  }

  // File upload mocks
  if (question.type === 'file' && Array.isArray(value)) {
    return value.map((f: any) => f.name || 'Dokumen Terlampir').join(', ');
  }

  const str = String(value).trim();
  if (question.unit && str) {
    return `${str} ${question.unit}`;
  }

  return str;
}

/**
 * Prepares the complete JSON payload for Google Sheets submission.
 * Strictly filters to include only visible, relevant questions for the respondent's function.
 */
export function prepareSubmissionPayload(
  responses: FormResponses,
  selectedDepartment: Department,
  identityQuestions: QuestionDefinition[],
  departmentQuestions: QuestionDefinition[],
  conclusionQuestions: QuestionDefinition[],
  customSubmissionId?: string
): QuestionnaireSubmissionPayload {
  const submissionId = customSubmissionId || generateSubmissionId();
  const nowIso = new Date().toISOString();

  // Extract project code and name from ident_03_project (e.g. "PRJ-2026-001 - Pembangunan Smelter...")
  const rawProject = responses.ident_03_project || '';
  let projectCode = '';
  let projectName = rawProject;

  if (rawProject.includes(' - ')) {
    const parts = rawProject.split(' - ');
    projectCode = parts[0].trim();
    projectName = parts.slice(1).join(' - ').trim();
  } else if (rawProject.startsWith('PRJ-')) {
    const spaceIndex = rawProject.indexOf(' ');
    if (spaceIndex > 0) {
      projectCode = rawProject.slice(0, spaceIndex).trim();
      projectName = rawProject.slice(spaceIndex).trim();
    } else {
      projectCode = rawProject;
      projectName = rawProject;
    }
  }

  const respondentName = String(responses.ident_01_name || '').trim();
  const businessUnit = String(responses.ident_04_bu || '').trim();
  const client = String(responses.ident_05_client || '').trim();

  const answers: SubmissionAnswerItem[] = [];

  // Helper to append question answers
  const collectAnswers = (questions: QuestionDefinition[], defaultSection: string) => {
    for (const q of questions) {
      // Visibility check
      if (!isQuestionVisible(q.condition, responses)) {
        continue;
      }

      const val = responses[q.id];
      const formatted = formatAnswerValue(q, val, responses);

      // Only push if there is an answer or user provided input
      if (formatted !== '') {
        answers.push({
          question_id: q.id,
          question: q.question,
          answer: formatted,
          function: selectedDepartment || defaultSection,
          section: q.subsection || q.section || defaultSection,
        });
      }
    }
  };

  // Collect from all 3 visible stages
  collectAnswers(identityQuestions, 'Identitas Proyek');
  collectAnswers(departmentQuestions, selectedDepartment);
  collectAnswers(conclusionQuestions, 'Kesimpulan & Tindak Lanjut');

  return {
    submission_id: submissionId,
    timestamp: nowIso,
    respondent_name: respondentName,
    function: selectedDepartment,
    project_code: projectCode,
    project_name: projectName,
    business_unit: businessUnit,
    client: client,
    answers: answers,
  };
}

/**
 * Service abstraction for submitting questionnaire responses.
 * Can be migrated from Google Apps Script to PHP / FastAPI / MySQL without altering UI components.
 */
export async function submitQuestionnaire(
  payload: QuestionnaireSubmissionPayload
): Promise<SubmissionResponse> {
  const targetGasUrl = GOOGLE_APPS_SCRIPT_URL?.trim() || '';
  const isMockMode =
    !targetGasUrl ||
    targetGasUrl === '' ||
    targetGasUrl.includes('YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL');

  if (isMockMode) {
    console.log('Google Sheets integration is in mock mode. Simulating submission.');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      submission_id: payload.submission_id,
      message: 'Kuesioner berhasil tersimpan (Mode Mock Development)',
    };
  }

  // 1. First Attempt: Use internal proxy route /api/submit-questionnaire
  // This completely eliminates browser CORS issues and follows Google redirects on the server side
  try {
    const proxyResponse = await fetch('/api/submit-questionnaire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-target-gas-url': targetGasUrl,
      },
      body: JSON.stringify(payload),
    });

    if (proxyResponse.ok) {
      const proxyResult = (await proxyResponse.json()) as SubmissionResponse;
      if (proxyResult.success) {
        return {
          success: true,
          submission_id: proxyResult.submission_id || payload.submission_id,
          message: proxyResult.message || 'Jawaban berhasil disimpan ke Google Sheets.',
        };
      } else {
        // Returned an Apps Script configuration or business error
        return {
          success: false,
          error: proxyResult.error || 'Gagal menyimpan jawaban ke Google Sheets.',
          isAppsScriptIssue: proxyResult.isAppsScriptIssue,
          errorType: proxyResult.errorType,
          instructions: proxyResult.instructions,
          rawSnippet: proxyResult.rawSnippet,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy submission attempt bypassed or unavailable, trying direct fetch:', proxyErr);
  }

  // 2. Second Attempt: Direct fetch to Google Apps Script Web App
  try {
    const response = await fetch(targetGasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result && result.success) {
      return {
        success: true,
        submission_id: result.submission_id || payload.submission_id,
        message: result.message || 'Response saved successfully',
      };
    } else {
      throw new Error(result?.message || result?.error || 'Gagal menyimpan data ke Google Sheets');
    }
  } catch (error: any) {
    console.error('Direct submission error:', error);
    const isCorsOrNetwork =
      error?.name === 'TypeError' ||
      error?.message?.toLowerCase().includes('failed to fetch') ||
      error?.message?.toLowerCase().includes('networkerror');

    if (isCorsOrNetwork) {
      return {
        success: false,
        isAppsScriptIssue: true,
        errorType: 'FAILED_TO_FETCH',
        error:
          "Koneksi ke Google Apps Script diblokir oleh browser (Failed to fetch). Hal ini terjadi karena Google Apps Script belum mempublikasikan fungsi 'doPost' atau setelan akses belum 'Anyone'.",
        instructions: [
          '1. Buka spreadsheet kuesioner Anda di Google Sheets.',
          '2. Klik menu Ekstensi (Extensions) > Apps Script.',
          '3. Buka file Code.gs, pastikan seluruh kode dari file google-apps-script/Code.gs telah ditempelkan, lalu tekan Ctrl + S (Simpan).',
          '4. Klik Deploy (Terapkan) di kanan atas > Kelola penerapan (Manage deployments).',
          '5. Klik ikon Pensil (Edit), ubah Versi menjadi "Versi baru" (New version), dan pastikan "Siapa yang memiliki akses" adalah "Siapa saja" (Anyone).',
          '6. Klik Terapkan (Deploy). Setelah selesai, klik tombol "Coba Kirim Ulang".',
        ],
      };
    }

    return {
      success: false,
      error:
        error.message ||
        'Gagal menghubungi Google Apps Script API. Periksa koneksi internet atau URL Web App.',
    };
  }
}
