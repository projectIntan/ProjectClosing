import jsPDF from 'jspdf';
import {
  Department,
  FormResponses,
  QuestionDefinition,
  QuestionnaireSubmissionPayload,
} from '../types';
import { isQuestionVisible, isOtherOption, formatBytes } from '../utils/formUtils';

export interface GeneratePdfOptions {
  submissionId: string;
  submittedAt: string;
  responses: FormResponses;
  selectedDepartment: Department;
  identityQuestions: QuestionDefinition[];
  departmentQuestions: QuestionDefinition[];
  conclusionQuestions: QuestionDefinition[];
  payload?: QuestionnaireSubmissionPayload;
}

/**
 * Sanitizes a string to make it safe for file names.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

/**
 * Formats a date string into readable Indonesian format, e.g. "18 September 2026".
 */
function formatDateLabel(dateStr?: string): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });
  }
}

/**
 * Creates and formats an executive, highly precise jsPDF document for the Project Closing Questionnaire.
 */
export function buildQuestionnairePdf(options: GeneratePdfOptions): jsPDF {
  const {
    submissionId,
    responses,
    selectedDepartment,
    identityQuestions,
    departmentQuestions,
    conclusionQuestions,
    payload,
  } = options;

  // Initialize jsPDF A4 portrait in millimeters
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight; // 180mm
  const marginBottom = 18;

  let currentY = 14;

  // Helper to add new page if content exceeds height
  const checkPageBreak = (neededHeight: number): boolean => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 16;
      return true;
    }
    return false;
  };

  // =========================================================================
  // 1. TOP HEADER SECTION (Clean, Executive & Non-Overlapping)
  // =========================================================================
  // Dual-color accent top banner
  doc.setFillColor(30, 58, 138); // Deep Navy
  doc.rect(marginLeft, currentY, contentWidth, 2.5, 'F');
  doc.setFillColor(2, 132, 199); // Sky Blue
  doc.rect(marginLeft, currentY + 3.2, contentWidth, 0.8, 'F');

  currentY += 10; // y = 24

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('PROJECT CLOSING QUESTIONNAIRE', marginLeft, currentY);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    'Enterprise Project Management Information System (PMIS) • Post-Project Review',
    marginLeft,
    currentY + 4.5
  );

  // Right-side Status Tag
  const badgeW = 46;
  const badgeH = 11;
  const badgeX = marginLeft + contentWidth - badgeW;
  const badgeY = currentY - 5;
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(186, 230, 253); // Sky 200
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(3, 105, 161); // Sky 700
  doc.text('DOKUMEN RESMI PMIS', badgeX + badgeW / 2, badgeY + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text('Status: Terverifikasi / Selesai', badgeX + badgeW / 2, badgeY + 8.2, { align: 'center' });

  currentY += 10.5;

  // =========================================================================
  // 2. METADATA SUMMARY TABLE (Dynamic Row Height, Zero Text Collision)
  // =========================================================================
  const projectFull = responses.ident_03_project || '';
  const projectCode =
    payload?.project_code ||
    (projectFull.includes(' - ') ? projectFull.split(' - ')[0] : 'PRJ-GEN');
  const projectName =
    payload?.project_name ||
    (projectFull.includes(' - ')
      ? projectFull.split(' - ').slice(1).join(' - ')
      : projectFull || 'Proyek Perusahaan');
  const respondentName = payload?.respondent_name || responses.ident_01_name || '—';
  const functionDept = payload?.function || selectedDepartment || '—';
  const businessUnit = payload?.business_unit || responses.ident_04_bu || '—';
  const clientName = payload?.client || responses.ident_05_client || '—';
  const formattedDate = formatDateLabel(payload?.timestamp || responses.ident_06_date);

  const col1Width = 82;
  const col2Width = 78;
  const col1X = marginLeft + 3.5;
  const col2X = marginLeft + 94;

  // CRITICAL: Ensure font is set to helvetica bold 8pt BEFORE calling splitTextToSize
  // so jsPDF calculates line breaks with the exact rendered font metrics!
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const prjNameLines = doc.splitTextToSize(projectName, col1Width);
  const clientLines = doc.splitTextToSize(clientName, col1Width);
  const funcLines = doc.splitTextToSize(functionDept, col2Width);

  // Calculate dynamic heights based on text lines
  const r1Lines = Math.max(prjNameLines.length, 1);
  const r1Height = 3.5 + r1Lines * 3.6 + 2;

  const r2Lines = Math.max(1, funcLines.length);
  const r2Height = 3.5 + r2Lines * 3.6 + 2;

  const r3Lines = Math.max(clientLines.length, 1);
  const r3Height = 3.5 + r3Lines * 3.6 + 2;

  const cardPadding = 3;
  const totalCardHeight = cardPadding * 2 + r1Height + r2Height + r3Height;

  // Draw Card Container
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, currentY, contentWidth, totalCardHeight, 2, 2, 'FD');

  let rowY = currentY + cardPadding;

  const renderField = (
    label: string,
    value: string | string[],
    x: number,
    y: number,
    isAccent = false
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label.toUpperCase(), x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (isAccent) {
      doc.setTextColor(30, 58, 138); // Deep Navy
    } else {
      doc.setTextColor(15, 23, 42); // Slate 900
    }

    if (Array.isArray(value)) {
      value.forEach((line, idx) => {
        doc.text(line, x, y + 3.8 + idx * 3.6);
      });
    } else {
      doc.text(value, x, y + 3.8);
    }
  };

  // Row 1: Project Name & Submission ID
  renderField('Nama Proyek / Project Name', prjNameLines, col1X, rowY + 2.5);
  renderField('Nomor Registrasi / Submission ID', submissionId, col2X, rowY + 2.5, true);

  rowY += r1Height;
  doc.setDrawColor(226, 232, 240);
  doc.line(col1X, rowY, marginLeft + contentWidth - 3.5, rowY);

  // Row 2: Project Code, BU & Function
  renderField('Kode Proyek', projectCode, col1X, rowY + 2.5);
  renderField('Business Unit', businessUnit, col1X + 42, rowY + 2.5);
  renderField('Fungsi / Departemen Evaluator', funcLines, col2X, rowY + 2.5);

  rowY += r2Height;
  doc.setDrawColor(226, 232, 240);
  doc.line(col1X, rowY, marginLeft + contentWidth - 3.5, rowY);

  // Row 3: Client, Respondent & Date
  renderField('Klien / Pemberi Kerja', clientLines, col1X, rowY + 2.5);
  renderField('Responden (PIC)', respondentName, col2X, rowY + 2.5);
  renderField('Tanggal Evaluasi', formattedDate, col2X + 44, rowY + 2.5);

  currentY += totalCardHeight + 6;

  // =========================================================================
  // 3. SECTIONS & QUESTIONS
  // =========================================================================
  const renderSectionHeader = (title: string) => {
    checkPageBreak(18);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.3);
    doc.roundedRect(marginLeft, currentY, contentWidth, 7.5, 1, 1, 'FD');

    // Left vertical accent bar
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(marginLeft, currentY, 2.5, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(String(title || '').toUpperCase(), marginLeft + 5, currentY + 5.2);

    currentY += 10.5;
  };

  const renderQuestionBlock = (q: QuestionDefinition, qIndex: number) => {
    const val = responses[q.id];
    let answerText = '';
    let isMultipleArray = false;
    let itemsArray: string[] = [];

    // 1. File Upload Question Handling
    if (q.type === 'file') {
      if (!val || (Array.isArray(val) && val.length === 0)) {
        answerText = '— Tidak ada berkas/dokumen yang dilampirkan —';
      } else if (Array.isArray(val)) {
        isMultipleArray = true;
        itemsArray = val.map((f: any) => {
          if (typeof f === 'string') return f;
          if (f && typeof f === 'object') {
            const fileName = f.name || 'Dokumen Terlampir';
            const sizeStr = typeof f.size === 'number' ? ` (${formatBytes(f.size)})` : '';
            return `${fileName}${sizeStr}`;
          }
          return String(f ?? 'Dokumen Terlampir');
        });
      } else if (typeof val === 'object' && val !== null) {
        const fileName = (val as any).name || 'Dokumen Terlampir';
        const sizeStr = typeof (val as any).size === 'number' ? ` (${formatBytes((val as any).size)})` : '';
        answerText = `${fileName}${sizeStr}`;
      } else {
        answerText = String(val);
      }
    } else if (val === undefined || val === null || val === '') {
      answerText = '— Tidak diisi / Tidak berlaku —';
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        answerText = '— Tidak ada yang dipilih —';
      } else {
        isMultipleArray = true;
        const otherVal = responses[`${q.id}_other`];
        itemsArray = val.map((item) => {
          if (item && typeof item === 'object') {
            return (item as any).name || (item as any).label || (item as any).title || JSON.stringify(item);
          }
          const itemStr = String(item);
          if (isOtherOption(itemStr) && otherVal) {
            return `${itemStr}: ${String(otherVal)}`;
          }
          return itemStr;
        });
      }
    } else if (
      (q.type === 'radio' || q.type === 'select') &&
      isOtherOption(String(val)) &&
      responses[`${q.id}_other`]
    ) {
      answerText = `${String(val)}: ${String(responses[`${q.id}_other`])}`;
    } else if (q.type === 'scale') {
      const num = Number(val);
      const stars = '★'.repeat(Math.min(5, Math.max(0, num))) + '☆'.repeat(Math.max(0, 5 - num));
      answerText = `Skala Nilai: ${val} dari 5  [ ${stars} ]`;
    } else if (typeof val === 'object' && val !== null) {
      answerText = (val as any).name || (val as any).label || (val as any).title || JSON.stringify(val);
    } else {
      answerText = String(val).trim();
      if (q.unit && answerText) {
        answerText += ` ${q.unit}`;
      }
    }

    // Question Label
    const qNum = typeof q.number === 'number' ? `${q.number}. ` : `${qIndex}. `;
    const fullQuestion = `${qNum}${q.question || ''}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const splitQuestion = doc.splitTextToSize(fullQuestion, contentWidth);
    const qHeight = splitQuestion.length * 3.8;

    // Answer calculation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let aHeight = 0;
    let splitAnswer: string[] = [];
    if (isMultipleArray) {
      const wrappedItems = itemsArray.map((item) => doc.splitTextToSize(String(item), contentWidth - 10));
      aHeight = wrappedItems.reduce((acc, lines) => acc + lines.length * 3.8, 0);
    } else {
      splitAnswer = doc.splitTextToSize(answerText, contentWidth - 8);
      aHeight = splitAnswer.length * 3.8;
    }

    const totalNeeded = qHeight + aHeight + 4.5;
    checkPageBreak(totalNeeded);

    // 1. Print Question
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(splitQuestion, marginLeft, currentY);
    currentY += qHeight + 0.8;

    // 2. Print Answer (Indented with clean typography)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    if (isMultipleArray) {
      for (const item of itemsArray) {
        const itemStr = typeof item === 'string' ? item : String(item ?? '');
        const splitLines = doc.splitTextToSize(itemStr, contentWidth - 10);
        checkPageBreak(splitLines.length * 3.8 + 1);

        // Bullet point
        doc.setFillColor(30, 58, 138); // Navy
        doc.circle(marginLeft + 3, currentY - 1, 0.6, 'F');

        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text(splitLines, marginLeft + 6, currentY);
        currentY += splitLines.length * 3.8;
      }
    } else {
      const isPlaceholder = answerText.startsWith('—');
      if (isPlaceholder) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // Slate 400
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59); // Slate 800
      }

      // Small subtle vertical indicator line for clean visual hierarchy
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.4);
      doc.line(marginLeft + 1.5, currentY - 2.5, marginLeft + 1.5, currentY + aHeight - 3);

      doc.text(splitAnswer, marginLeft + 4, currentY);
      currentY += aHeight;
    }

    currentY += 3; // spacing between questions
  };

  const renderQuestionsGroup = (
    sectionTitle: string,
    questions: QuestionDefinition[]
  ) => {
    const visibleQuestions = questions.filter((q) =>
      isQuestionVisible(q.condition, responses)
    );

    if (visibleQuestions.length === 0) return;

    renderSectionHeader(sectionTitle);

    let lastSubsection = '';
    let counter = 1;

    for (const q of visibleQuestions) {
      if (q.subsection && q.subsection !== lastSubsection) {
        lastSubsection = q.subsection;
        checkPageBreak(12);
        doc.setFillColor(239, 246, 255); // Blue 50
        doc.setDrawColor(219, 234, 254); // Blue 200
        doc.setLineWidth(0.2);
        doc.roundedRect(marginLeft, currentY, contentWidth, 6, 0.8, 0.8, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(29, 78, 216); // Blue 700
        doc.text(String(lastSubsection), marginLeft + 3.5, currentY + 4.2);
        currentY += 8;
      }

      renderQuestionBlock(q, counter);
      counter += 1;
    }

    currentY += 2;
  };

  // 1. Identity Section
  renderQuestionsGroup('1. Identitas Responden & Proyek', identityQuestions);

  // 2. Department Specific Section
  renderQuestionsGroup(
    `2. Evaluasi Khusus Fungsi: ${selectedDepartment}`,
    departmentQuestions
  );

  // 3. Conclusion Section
  renderQuestionsGroup('3. Kesimpulan & Tindak Lanjut Proyek', conclusionQuestions);

  // =========================================================================
  // 4. SIGN-OFF & VERIFICATION BLOCK (Sementara di-hide sesuai permintaan)
  // =========================================================================
  // const renderSignoffBlock = () => {
  //   const blockHeight = 42;
  //   checkPageBreak(blockHeight + 6);
  //
  //   doc.setFillColor(248, 250, 252); // Slate 50
  //   doc.setDrawColor(203, 213, 225); // Slate 300
  //   doc.setLineWidth(0.3);
  //   doc.roundedRect(marginLeft, currentY, contentWidth, blockHeight, 1.5, 1.5, 'FD');
  //
  //   // Sign-off Block Header Bar
  //   doc.setFillColor(241, 245, 249);
  //   doc.rect(marginLeft, currentY, contentWidth, 6.5, 'F');
  //   doc.setDrawColor(203, 213, 225);
  //   doc.line(marginLeft, currentY + 6.5, marginLeft + contentWidth, currentY + 6.5);
  //
  //   doc.setFont('helvetica', 'bold');
  //   doc.setFontSize(7);
  //   doc.setTextColor(30, 41, 59);
  //   doc.text('LEMBAR PENGESAHAN & ARSIP EVALUASI PENUTUPAN PROYEK', marginLeft + 4, currentY + 4.4);
  //
  //   const colWidth = (contentWidth - 8) / 3;
  //   const colY = currentY + 10;
  //
  //   const cols = [
  //     {
  //       title: 'DISIAPKAN OLEH (PIC)',
  //       name: respondentName,
  //       role: functionDept,
  //       date: formattedDate,
  //     },
  //     {
  //       title: 'DIKETAHUI OLEH',
  //       name: 'Project Manager / Dept. Head',
  //       role: 'Pimpinan Fungsi / Operasi',
  //       date: formattedDate,
  //     },
  //     {
  //       title: 'DIVERIFIKASI OLEH',
  //       name: 'Project Management Office',
  //       role: 'PMO & Quality Governance',
  //       date: formattedDate,
  //     },
  //   ];
  //
  //   cols.forEach((col, idx) => {
  //     const cx = marginLeft + 4 + idx * colWidth;
  //
  //     doc.setFont('helvetica', 'bold');
  //     doc.setFontSize(6.5);
  //     doc.setTextColor(100, 116, 139);
  //     doc.text(col.title, cx, colY);
  //
  //     // Signature line
  //     const lineY = colY + 18;
  //     doc.setDrawColor(148, 163, 184);
  //     doc.setLineWidth(0.2);
  //     doc.line(cx, lineY, cx + colWidth - 5, lineY);
  //
  //     doc.setFont('helvetica', 'bold');
  //     doc.setFontSize(7.5);
  //     doc.setTextColor(15, 23, 42);
  //     doc.text(col.name, cx, lineY + 3.5);
  //
  //     doc.setFont('helvetica', 'normal');
  //     doc.setFontSize(6.5);
  //     doc.setTextColor(100, 116, 139);
  //     doc.text(col.role, cx, lineY + 6.8);
  //     doc.text(`Tgl: ${col.date}`, cx, lineY + 9.8);
  //   });
  //
  //   currentY += blockHeight + 6;
  // };
  //
  // renderSignoffBlock();

  // =========================================================================
  // 5. RUNNING HEADER & RUNNING FOOTER (Applied to All Pages)
  // =========================================================================
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running top header for pages 2+
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      const truncatedPrj = projectName.length > 55 ? projectName.substring(0, 52) + '...' : projectName;
      doc.text(
        `PROJECT CLOSING QUESTIONNAIRE • ${projectCode} - ${truncatedPrj}`,
        marginLeft,
        9
      );
      doc.text(`Ref: ${submissionId}`, pageWidth - marginRight, 9, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(marginLeft, 11, pageWidth - marginRight, 11);
    }

    // Running bottom footer for all pages
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 11, pageWidth - marginRight, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400

    // Left Footer
    doc.text(
      `Enterprise PMIS • Dokumen ini sah sebagai rekaman resmi penutupan proyek • Ref: ${submissionId}`,
      marginLeft,
      pageHeight - 6.5
    );

    // Right Footer
    const pageText = `Halaman ${i} dari ${totalPages}`;
    doc.text(pageText, pageWidth - marginRight, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}

/**
 * Generates and downloads the PDF file directly to the user's computer.
 */
export function downloadQuestionnairePdf(options: GeneratePdfOptions): string {
  const doc = buildQuestionnairePdf(options);
  const projectCode = options.payload?.project_code || 'PRJ';
  const cleanPrj = sanitizeFileName(projectCode || 'PROJECT');
  const cleanSub = sanitizeFileName(options.submissionId || 'SUBMISSION');
  const fileName = `Project_Closing_${cleanPrj}_${cleanSub}.pdf`;

  doc.save(fileName);
  return fileName;
}

/**
 * Creates a blob URL for previewing the PDF inside an iframe or modal dialog.
 */
export function createQuestionnairePdfBlobUrl(options: GeneratePdfOptions): string {
  const doc = buildQuestionnairePdf(options);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
