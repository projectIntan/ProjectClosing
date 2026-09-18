import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Department,
  FormResponses,
  ProjectMock,
  StepNumber,
  ValidationErrors,
  QuestionnaireSubmissionPayload,
} from '../types';
import { MOCK_PROJECTS, DEPARTMENTS } from '../data/mockData';
import {
  IDENTITY_QUESTIONS,
  DEPARTMENT_QUESTIONS,
  CONCLUSION_QUESTIONS,
} from '../data/questionnaireData';
import { isQuestionVisible, validateQuestions } from '../utils/formUtils';
import {
  prepareSubmissionPayload,
  submitQuestionnaire,
} from '../services/submissionService';
import { FormHeader } from './FormHeader';
import { ProgressBar } from './ProgressBar';
import { SectionHeader } from './SectionHeader';
import { QuestionRenderer } from './QuestionRenderer';
import { NavigationButtons } from './NavigationButtons';
import { ReviewPage } from './ReviewPage';
import { SuccessPage } from './SuccessPage';
import { ConfirmationModal } from './ConfirmationModal';
import { SubmissionErrorModal } from './SubmissionErrorModal';
import { Toast, ToastMessage } from './Toast';
import { UserCheck, Briefcase, FileText, Bookmark } from 'lucide-react';
import { SubmissionResponse } from '../types';

const STORAGE_KEY = 'pcq_enterprise_form_draft_v1';
const SUBMISSION_KEY = 'pcq_enterprise_submission_data_v1';

export const Questionnaire: React.FC = () => {
  // --- States ---
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [responses, setResponses] = useState<FormResponses>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<SubmissionResponse | null>(null);
  const [pendingPayload, setPendingPayload] = useState<QuestionnaireSubmissionPayload | null>(null);
  const [submissionData, setSubmissionData] = useState<{
    id: string;
    submittedAt: string;
    payload?: QuestionnaireSubmissionPayload;
  } | null>(null);

  const topRef = useRef<HTMLDivElement>(null);
  const toastSeqRef = useRef(0);

  // Add toast helper
  const addToast = (type: 'success' | 'info' | 'warning', title: string, description?: string) => {
    toastSeqRef.current += 1;
    const id = `toast_${Date.now()}_${toastSeqRef.current}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  // Actively purge all previous questionnaire caches/drafts so the form always starts completely fresh
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SUBMISSION_KEY);

      // Scan and remove any leftover keys from previous questionnaire versions or sessions
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('pcq_') ||
            key.toLowerCase().includes('questionnaire') ||
            key.toLowerCase().includes('draft'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.warn('Cache purge notice:', e);
    }
  }, []);

  // Scroll to top on step change
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selected Department from Section 1
  const selectedDepartment = (responses.ident_02_department as Department) || '';

  // Questions for Step 2 based on selected department
  const currentDepartmentQuestions = useMemo(() => {
    if (!selectedDepartment || !DEPARTMENT_QUESTIONS[selectedDepartment]) {
      return [];
    }
    return DEPARTMENT_QUESTIONS[selectedDepartment];
  }, [selectedDepartment]);

  // Handle Project selection from SearchableSelect
  const handleSelectProject = (project: ProjectMock | null) => {
    setResponses((prev) => {
      const updated = { ...prev };
      if (project) {
        updated.ident_03_project = `${project.code} - ${project.name}`;
        updated.ident_05_client = project.client;
        if (project.businessUnit) {
          updated.ident_04_bu = project.businessUnit;
        }
      } else {
        updated.ident_03_project = '';
        updated.ident_05_client = '';
      }
      return updated;
    });

    // Clear error on project selection
    if (errors.ident_03_project || errors.ident_05_client || errors.ident_04_bu) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ident_03_project;
        delete next.ident_05_client;
        delete next.ident_04_bu;
        return next;
      });
    }
  };

  // Handle generic question change
  const handleQuestionChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Remove error when user starts providing input
    const baseId = questionId.endsWith('_other') ? questionId.replace('_other', '') : questionId;
    if (errors[questionId] || errors[baseId] || errors[`${baseId}_other`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        delete next[baseId];
        delete next[`${baseId}_other`];
        return next;
      });
    }
  };

  // Step 1 Validation & Next

  const handleNextFromStep1 = () => {
    const stepErrors = validateQuestions(IDENTITY_QUESTIONS, responses);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      addToast('warning', 'Terdapat Bidang Wajib yang Belum Diisi', 'Silakan lengkapi pertanyaan yang ditandai bintang merah.');
      // Scroll to first error
      const firstErrorKey = Object.keys(stepErrors)[0]?.replace('_other', '');
      const element = document.getElementById(`container_${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setCurrentStep(2);
    scrollToTop();
  };

  // Step 2 Validation & Next
  const handleNextFromStep2 = () => {
    const stepErrors = validateQuestions(currentDepartmentQuestions, responses);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      addToast('warning', 'Terdapat Bidang Wajib yang Belum Diisi', 'Silakan periksa kembali isian form fungsi.');
      const firstErrorKey = Object.keys(stepErrors)[0]?.replace('_other', '');
      const element = document.getElementById(`container_${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setCurrentStep(3);
    scrollToTop();
  };

  // Step 3 Validation & Next
  const handleNextFromStep3 = () => {
    const stepErrors = validateQuestions(CONCLUSION_QUESTIONS, responses);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      addToast('warning', 'Terdapat Bidang Wajib yang Belum Diisi', 'Pertanyaan tiga pembelajaran wajib diisi.');
      const firstErrorKey = Object.keys(stepErrors)[0]?.replace('_other', '');
      const element = document.getElementById(`container_${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setCurrentStep(4);
    scrollToTop();
  };

  // Generic Next handler
  const handleNext = () => {
    if (currentStep === 1) handleNextFromStep1();
    else if (currentStep === 2) handleNextFromStep2();
    else if (currentStep === 3) handleNextFromStep3();
  };

  // Back handler
  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => ((prev - 1) as StepNumber));
      scrollToTop();
    }
  };

  // Reset Form and purge any cache
  const handleConfirmReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SUBMISSION_KEY);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('pcq_') ||
            key.toLowerCase().includes('questionnaire') ||
            key.toLowerCase().includes('draft'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    setResponses({});
    setErrors({});
    setSubmissionData(null);
    setCurrentStep(1);
    setIsResetModalOpen(false);
    addToast('info', 'Form Direset', 'Seluruh isian kuesioner dan cache telah dibersihkan.');
    scrollToTop();
  };

  // Final Submit Handler
  const handleSubmit = async () => {
    // 1. Full validation across all steps
    const step1Errors = validateQuestions(IDENTITY_QUESTIONS, responses);
    const step2Errors = validateQuestions(currentDepartmentQuestions, responses);
    const step3Errors = validateQuestions(CONCLUSION_QUESTIONS, responses);
    const allErrors = { ...step1Errors, ...step2Errors, ...step3Errors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      addToast(
        'warning',
        'Data Kuesioner Belum Lengkap',
        'Mohon periksa dan lengkapi pertanyaan wajib sebelum mengirim kuesioner.'
      );
      if (Object.keys(step1Errors).length > 0) {
        setCurrentStep(1);
      } else if (Object.keys(step2Errors).length > 0) {
        setCurrentStep(2);
      } else if (Object.keys(step3Errors).length > 0) {
        setCurrentStep(3);
      }
      scrollToTop();
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Prepare payload
      const payload = prepareSubmissionPayload(
        responses,
        selectedDepartment,
        IDENTITY_QUESTIONS,
        currentDepartmentQuestions,
        CONCLUSION_QUESTIONS
      );

      // 3. Send to API / Google Apps Script
      const result = await submitQuestionnaire(payload);

      if (result.success) {
        const finalSubmissionId = result.submission_id || payload.submission_id;
        const nowFormatted = new Date().toLocaleString('id-ID', {
          dateStyle: 'long',
          timeStyle: 'short',
        });

        const completedPayload = { ...payload, submission_id: finalSubmissionId };

        setSubmissionData({
          id: finalSubmissionId,
          submittedAt: nowFormatted,
          payload: completedPayload,
        });

        // Ensure all draft and temporary cache are removed
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SUBMISSION_KEY);
        } catch (e) {
          // ignore
        }

        setCurrentStep(5);
        scrollToTop();
        addToast(
          'success',
          'Kuesioner Berhasil Dikirim',
          'Tanggapan Anda telah berhasil tersimpan dalam sistem & Google Sheets.'
        );
      } else {
        setPendingPayload(payload);
        if (result.isAppsScriptIssue || result.errorType) {
          setSubmissionError(result);
        }
        addToast(
          'warning',
          'Gagal Mengirim Kuesioner',
          result.error || 'Terjadi kendala saat menyimpan data ke Google Sheets. Silakan coba klik tombol submit kembali.'
        );
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      addToast(
        'warning',
        'Gagal Mengirim Kuesioner',
        err?.message || 'Terjadi kesalahan pada sistem kuesioner. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedOffline = () => {
    if (!pendingPayload) return;
    const finalSubmissionId = pendingPayload.submission_id;
    const nowFormatted = new Date().toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    setSubmissionData({
      id: finalSubmissionId,
      submittedAt: nowFormatted,
      payload: pendingPayload,
    });

    setSubmissionError(null);
    setCurrentStep(5);
    scrollToTop();
    addToast(
      'info',
      'Mode Dokumen Siap',
      'Jawaban kuesioner Anda siap diunduh dan dicetak dalam format PDF resmi.'
    );
  };

  // Render Step 2 questions with clean subsection headers
  const renderDepartmentForm = () => {
    if (!selectedDepartment) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600">
            Anda belum memilih Fungsi / Departemen pada Langkah 1.
          </p>
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
          >
            Kembali ke Langkah 1
          </button>
        </div>
      );
    }

    let lastSubsection = '';

    return (
      <div className="space-y-4">
        {currentDepartmentQuestions.map((q) => {
          // Check visibility
          if (!isQuestionVisible(q.condition, responses)) {
            return null;
          }

          const showSubsectionHeader = q.subsection && q.subsection !== lastSubsection;
          if (q.subsection) {
            lastSubsection = q.subsection;
          }

          return (
            <React.Fragment key={q.id}>
              {showSubsectionHeader && (
                <div className="pt-3 pb-1">
                  <div className="bg-slate-100/90 border border-slate-200/80 px-4 py-2.5 rounded-lg flex items-center space-x-2">
                    <Bookmark className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                      {q.subsection}
                    </h3>
                  </div>
                </div>
              )}
              <QuestionRenderer
                question={q}
                responses={responses}
                onChange={handleQuestionChange}
                error={errors[q.id]}
              />
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const hasAnyDraftData = Object.keys(responses).length > 0;

  return (
    <div ref={topRef} className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans print:bg-white print:p-0">
      {/* 1. Header Bar */}
      <FormHeader
        lastSavedAt={null}
        onResetDraft={() => setIsResetModalOpen(true)}
        hasDraft={hasAnyDraftData && currentStep < 5}
      />

      {/* 2. Sticky Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        selectedDepartment={selectedDepartment}
        onStepClick={(step) => {
          setErrors({});
          setCurrentStep(step);
          scrollToTop();
        }}
      />

      {/* 3. Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8 print:p-0 print:max-w-none">
        {/* Step 1: Identitas Responden & Proyek */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <SectionHeader
              stepNumber={1}
              totalSteps={4}
              title="Identitas Responden dan Proyek"
              description="Bagian ini wajib diisi oleh seluruh responden untuk mengidentifikasi PIC, departemen yang mengevaluasi, serta data referensi proyek yang ditutup."
              badgeText="Wajib Seluruh Responden"
              icon={UserCheck}
            />

            <div className="space-y-4 mt-4">
              {IDENTITY_QUESTIONS.map((q) => {
                if (!isQuestionVisible(q.condition, responses)) return null;
                return (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    responses={responses}
                    onChange={handleQuestionChange}
                    error={errors[q.id]}
                    projects={MOCK_PROJECTS}
                    onSelectProject={handleSelectProject}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Form Berdasarkan Fungsi (Hanya muncul setelah klik Lanjutkan pada Step 1) */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <SectionHeader
              stepNumber={2}
              totalSteps={4}
              title={`Evaluasi Khusus Fungsi: ${selectedDepartment}`}
              description={`Kuesioner ini dirancang secara spesifik untuk mengevaluasi aktivitas, kendala teknis, dan pencapaian target kerja fungsi ${selectedDepartment}.`}
              badgeText={selectedDepartment}
              icon={Briefcase}
            />

            <div className="mt-4">{renderDepartmentForm()}</div>
          </div>
        )}

        {/* Step 3: Kesimpulan & Tindak Lanjut */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <SectionHeader
              stepNumber={3}
              totalSteps={4}
              title="Kesimpulan & Tindak Lanjut"
              description="Bagian penutup ini diisi oleh seluruh responden untuk merumuskan pembelajaran kunci, praktik terbaik, serta rencana aksi tindak lanjut bila diperlukan."
              badgeText="Diisi Seluruh Fungsi"
              icon={FileText}
            />

            <div className="space-y-4 mt-4">
              {CONCLUSION_QUESTIONS.map((q) => {
                if (!isQuestionVisible(q.condition, responses)) return null;
                return (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    responses={responses}
                    onChange={handleQuestionChange}
                    error={errors[q.id]}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Review Jawaban */}
        {currentStep === 4 && (
          <div className="animate-in fade-in duration-200">
            <ReviewPage
              responses={responses}
              identityQuestions={IDENTITY_QUESTIONS}
              departmentQuestions={currentDepartmentQuestions}
              conclusionQuestions={CONCLUSION_QUESTIONS}
              selectedDepartment={selectedDepartment}
              onEditStep={(step) => {
                setErrors({});
                setCurrentStep(step);
                scrollToTop();
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Step 5: Submitted Screen */}
        {currentStep === 5 && submissionData && (
          <div className="animate-in fade-in duration-200">
            <SuccessPage
              submissionId={submissionData.id}
              submittedAt={submissionData.submittedAt}
              responses={responses}
              selectedDepartment={selectedDepartment}
              identityQuestions={IDENTITY_QUESTIONS}
              departmentQuestions={currentDepartmentQuestions}
              conclusionQuestions={CONCLUSION_QUESTIONS}
              payload={submissionData.payload}
              onReset={handleConfirmReset}
            />
          </div>
        )}

        {/* Navigation Buttons (Steps 1 to 4) */}
        {currentStep < 5 && (
          <NavigationButtons
            currentStep={currentStep}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-medium text-slate-700">
            Project Management Office & Quality Governance System
          </p>
          <p className="mt-1 text-slate-400">
            Formulir Penutupan Proyek Standar Perusahaan © {new Date().getFullYear()} • Dilindungi Kerahasiaan Perusahaan
          </p>
        </div>
      </footer>

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset Seluruh Isian?"
        message="Tindakan ini akan menghapus seluruh data yang telah Anda isi pada kuesioner ini dan mengembalikannya ke kondisi awal. Apakah Anda yakin?"
        confirmText="Ya, Reset Form"
        cancelText="Batal"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
        isDestructive={true}
      />

      {/* Submission Error & Google Apps Script Diagnostic Modal */}
      <SubmissionErrorModal
        isOpen={submissionError !== null}
        errorInfo={submissionError}
        onClose={() => setSubmissionError(null)}
        onRetry={handleSubmit}
        onProceedOffline={handleProceedOffline}
        isRetrying={isSubmitting}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
};
