/**
 * =========================================================================
 * ENTERPRISE PROJECT CLOSING QUESTIONNAIRE - GOOGLE APPS SCRIPT BACKEND API
 * =========================================================================
 * 
 * Instructions:
 * 1. Open Google Sheets (create a new blank spreadsheet or use an existing one).
 * 2. Click on "Extensions" > "Apps Script".
 * 3. Replace the contents of Code.gs with this entire file.
 * 4. Run `setupSheet()` once from the Apps Script editor to create the sheets & headers.
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type: "Web app".
 * 7. Description: "PCQ API v1".
 * 8. Execute as: "Me" (your Google account).
 * 9. Who has access: "Anyone".
 * 10. Click "Deploy", authorize permissions, and copy the Web App URL (ending with /exec).
 * 11. Paste that URL into `src/config.ts` in your frontend application.
 */

// Timezone for Indonesia Western Time
var TIMEZONE = "Asia/Jakarta";

/**
 * One-time setup function to initialize the 3 required sheets and header formatting.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. SHEET: SUBMISSIONS
  var subSheet = ss.getSheetByName("SUBMISSIONS");
  if (!subSheet) {
    subSheet = ss.insertSheet("SUBMISSIONS");
  }
  var subHeaders = [
    "submission_id",
    "timestamp",
    "respondent_name",
    "function",
    "project_code",
    "project_name",
    "business_unit",
    "client",
    "status"
  ];
  if (subSheet.getLastRow() === 0) {
    subSheet.appendRow(subHeaders);
    formatHeaderRow(subSheet);
  }

  // 2. SHEET: ANSWERS
  var ansSheet = ss.getSheetByName("ANSWERS");
  if (!ansSheet) {
    ansSheet = ss.insertSheet("ANSWERS");
  }
  var ansHeaders = [
    "submission_id",
    "question_id",
    "function",
    "question",
    "answer",
    "timestamp"
  ];
  if (ansSheet.getLastRow() === 0) {
    ansSheet.appendRow(ansHeaders);
    formatHeaderRow(ansSheet);
  }

  // 3. SHEET: PROJECTS
  var prjSheet = ss.getSheetByName("PROJECTS");
  if (!prjSheet) {
    prjSheet = ss.insertSheet("PROJECTS");
  }
  var prjHeaders = [
    "project_code",
    "project_name",
    "business_unit",
    "client",
    "status"
  ];
  if (prjSheet.getLastRow() === 0) {
    prjSheet.appendRow(prjHeaders);
    formatHeaderRow(prjSheet);

    // Populate initial master projects
    var initialProjects = [
      ["PRJ-2026-001", "Pembangunan Smelter Fase 2 & Utilitas", "EPC & Infrastructure", "PT Freeport Indonesia", "Active"],
      ["PRJ-2026-002", "Refinery Expansion & Petrochemical Hub", "Oil & Gas Industrial", "PT Pertamina (Persero)", "Active"],
      ["PRJ-2026-003", "Pipeline Distribution Gas 42 Inch", "Pipeline & Energy", "PT Perusahaan Gas Negara", "Active"],
      ["PRJ-2026-004", "Geothermal Power Plant 110 MW", "Renewable Energy", "PT Geo Dipa Energi", "Active"],
      ["PRJ-2026-005", "Water Treatment Plant Industrial Estate", "Utilities & Water", "PT Kawasan Industri Terpadu", "Active"]
    ];
    for (var i = 0; i < initialProjects.length; i++) {
      prjSheet.appendRow(initialProjects[i]);
    }
  }

  // 4. SHEET: SUPPORTING_DOCUMENTS (never clear existing rows)
  var docSheet = ss.getSheetByName("SUPPORTING_DOCUMENTS");
  var docHeaders = ["document_id", "submission_id", "project_code", "project_name", "business_unit", "file_name", "mime_type", "file_size", "drive_file_id", "drive_url", "uploaded_at"];
  if (!docSheet) {
    docSheet = ss.insertSheet("SUPPORTING_DOCUMENTS");
    docSheet.appendRow(docHeaders);
    formatHeaderRow(docSheet);
  } else if (docSheet.getLastRow() === 0) {
    docSheet.appendRow(docHeaders);
    formatHeaderRow(docSheet);
  }

  Logger.log("Sheet setup completed successfully!");
}

/**
 * Format header rows with clean styling & freeze top row.
 */
function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1e293b"); // Slate 800
  headerRange.setFontColor("#ffffff");
  headerRange.setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
}

/**
 * HTTP GET endpoint - for testing connection & health check
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "dashboard") {
    try {
      return ContentService.createTextOutput(JSON.stringify(getDashboardData()))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Dashboard data gagal dimuat." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  var response = {
    status: "active",
    service: "Enterprise Project Closing Questionnaire API",
    timestamp: getJakartaTimestamp(),
    message: "Google Apps Script Web App is connected and ready to receive POST submissions."
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST endpoint - handles questionnaire submissions
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  // Wait up to 30 seconds for lock to ensure atomic writes
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse(false, null, "Server is currently busy, please retry in a moment: " + err.toString());
  }

  try {
    var rawData = e.postData.contents;
    if (!rawData) {
      return createJsonResponse(false, null, "No post data received in request.");
    }

    var payload = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Ensure sheets exist
    var subSheet = ss.getSheetByName("SUBMISSIONS");
    var ansSheet = ss.getSheetByName("ANSWERS");
    var docSheet = ss.getSheetByName("SUPPORTING_DOCUMENTS");
    if (!subSheet || !ansSheet || !docSheet) {
      setupSheet();
      subSheet = ss.getSheetByName("SUBMISSIONS");
      ansSheet = ss.getSheetByName("ANSWERS");
      docSheet = ss.getSheetByName("SUPPORTING_DOCUMENTS");
    }

    // Timestamp in Asia/Jakarta
    var timestamp = getJakartaTimestamp();

    // Determine or generate unique Submission ID
    var submissionId = payload.submission_id;
    if (!submissionId) {
      var dateStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyyMMdd");
      var randNum = Math.floor(1000 + Math.random() * 9000);
      submissionId = "SUB-" + dateStr + "-" + randNum;
    }

    validateSubmissionPayload(payload);

    // 1. SAVE TO SUBMISSIONS SHEET
    var submissionRow = [
      submissionId,
      timestamp,
      payload.respondent_name || "",
      payload.function || "",
      payload.project_code || "",
      payload.project_name || "",
      payload.business_unit || "",
      payload.client || "",
      "SUBMITTED"
    ];
    subSheet.appendRow(submissionRow);

    // 2. SAVE TO ANSWERS SHEET
    // Columns: submission_id | question_id | function | question | answer | timestamp
    var answers = payload.answers || [];
    if (answers.length > 0) {
      var answerRows = [];
      for (var i = 0; i < answers.length; i++) {
        var a = answers[i];
        var ansText = a.answer;
        if (typeof ansText === "object" && ansText !== null) {
          ansText = JSON.stringify(ansText);
        } else {
          ansText = String(ansText || "");
        }

        answerRows.push([
          submissionId,
          a.question_id || "",
          a.function || payload.function || "",
          a.question || "",
          ansText,
          timestamp
        ]);
      }

      // Bulk write rows for performance
      if (answerRows.length > 0) {
        var startRow = ansSheet.getLastRow() + 1;
        var range = ansSheet.getRange(startRow, 1, answerRows.length, 6);
        range.setValues(answerRows);
      }
    }

    var documents = payload.supporting_documents || [];
    var savedDocuments = [];
    for (var d = 0; d < documents.length; d++) {
      savedDocuments.push(saveSupportingDocument(documents[d], payload, submissionId, docSheet));
    }

    return createJsonResponse(true, submissionId, documents.length > 0 ? "Response and supporting documents saved successfully" : "Response saved successfully", savedDocuments);

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return createJsonResponse(false, null, err.message || "Failed to record response.");
  } finally {
    lock.releaseLock();
  }
}

/**
 * Read-only dashboard data contract. The response contains raw submitted
 * values needed by the UI; it does not expose Base64 file contents.
 */
function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allSubmissions = readSheetObjects(ss.getSheetByName("SUBMISSIONS"));
  var submissions = allSubmissions;
  var visibleSubmissionIds = {};
  submissions.forEach(function (submission) { visibleSubmissionIds[String(submission.submission_id || "")] = true; });
  var answers = readSheetObjects(ss.getSheetByName("ANSWERS"));
  var projects = readSheetObjects(ss.getSheetByName("PROJECTS"));
  var documents = readSheetObjects(ss.getSheetByName("SUPPORTING_DOCUMENTS")).filter(function (document) {
    return visibleSubmissionIds[String(document.submission_id || "")];
  });
  var answersBySubmission = {};

  answers.forEach(function (answer) {
    var id = String(answer.submission_id || "");
    if (!answersBySubmission[id]) answersBySubmission[id] = [];
    answersBySubmission[id].push(answer);
  });

  var submissionRecords = submissions.map(function (submission) {
    return {
      submission_id: String(submission.submission_id || ""),
      timestamp: submission.timestamp || "",
      respondent_name: submission.respondent_name || "",
      function: submission.function || "",
      project_code: submission.project_code || "",
      project_name: submission.project_name || "",
      business_unit: submission.business_unit || "",
      client: submission.client || "",
      status: submission.status || "",
      answers: answersBySubmission[String(submission.submission_id || "")] || []
    };
  });

  var answerValue = function (submission, questionId) {
    var found = (submission.answers || []).find(function (answer) { return answer.question_id === questionId; });
    return found ? String(found.answer || "") : "";
  };
  var nonEmpty = function (value) { return value && value.trim() !== ""; };
  var issueValues = ["ident_06_open_issues", "op_03_delayed_activities", "op_04_delay_causes", "op_16_recurring_issues", "fin_03_rejected_invoices", "fin_04_rejection_reason", "fin_07_financial_risks", "hr_05_competency_gap", "hr_10_turnover_causes", "hr_12_overtime_causes", "amw_04_idle_assets", "amw_06_damaged_lost_assets", "amw_14_dead_stock", "amw_15_slow_moving", "tpd_02_mismatched_assumptions", "tpd_04_cost_deviations", "tpd_08_unidentified_risks"];
  var enriched = submissionRecords.map(function (submission) {
    var issueText = issueValues.map(function (id) { return answerValue(submission, id); }).filter(nonEmpty).join("; ");
    var followup = answerValue(submission, "conc_04_followup_needed");
    var priority = answerValue(submission, "conc_08_priority_level");
    return {
      submission_id: submission.submission_id,
      timestamp: submission.timestamp,
      respondent_name: submission.respondent_name,
      function: submission.function,
      project_code: submission.project_code,
      project_name: submission.project_name,
      business_unit: submission.business_unit,
      client: submission.client,
      status: submission.status,
      issues: issueText,
      followup_required: followup,
      action_plan: answerValue(submission, "conc_05_action_plan"),
      pic_name: answerValue(submission, "conc_06_pic_name"),
      target_date: answerValue(submission, "conc_07_target_date"),
      priority: priority,
      finding_category: answerValue(submission, "conc_09_finding_category"),
      lessons_learned: answerValue(submission, "conc_01_three_lessons"),
      best_practices: answerValue(submission, "conc_02_best_practices"),
      never_again: answerValue(submission, "conc_03_never_again_issues"),
      answers: submission.answers
    };
  });

  var countBy = function (key) {
    var counts = {};
    enriched.forEach(function (item) {
      var value = String(item[key] || "Tidak diisi");
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.keys(counts).map(function (label) { return { label: label, count: counts[label] }; });
  };
  var uniqueProjects = {};
  enriched.forEach(function (item) { if (item.project_code) uniqueProjects[item.project_code] = true; });
  var openIssueCount = enriched.filter(function (item) { return nonEmpty(item.issues) && item.issues.toLowerCase() !== "tidak ada"; }).length;
  var followupCount = enriched.filter(function (item) { return ["ya", "yes"].indexOf(item.followup_required.toLowerCase()) >= 0; }).length;
  var priorityCount = enriched.filter(function (item) { return /high|critical|tinggi|kritis/i.test(item.priority); }).length;
  var lessonsCount = enriched.filter(function (item) { return nonEmpty(item.lessons_learned); }).length;

  return {
    success: true,
    generated_at: getJakartaTimestamp(),
    summary: {
      total_projects: Object.keys(uniqueProjects).length,
      total_submissions: enriched.length,
      open_issues: openIssueCount,
      followup_required: followupCount,
      high_critical_priority: priorityCount,
      lessons_learned: lessonsCount
    },
    projects: projects,
    submissions: enriched,
    by_business_unit: countBy("business_unit"),
    by_function: countBy("function"),
    supporting_documents: documents
  };
}

function readSheetObjects(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var headers = values[0].map(function (header) { return String(header || ""); });
  return values.slice(1).filter(function (row) {
    return row.some(function (value) { return value !== "" && value !== null; });
  }).map(function (row) {
    var object = {};
    headers.forEach(function (header, index) { object[header] = row[index] instanceof Date ? row[index].toISOString() : row[index]; });
    return object;
  });
}

function validateSubmissionPayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Payload kuesioner tidak valid.");
  var documents = payload.supporting_documents || [];
  if (!Array.isArray(documents)) throw new Error("Supporting documents tidak valid.");
  if (documents.length > 20) throw new Error("Jumlah supporting document terlalu banyak.");
  for (var i = 0; i < documents.length; i++) {
    var file = documents[i];
    if (!file || typeof file.fileName !== "string" || !file.fileName.trim() || typeof file.base64Data !== "string") {
      throw new Error("Data supporting document tidak lengkap.");
    }
    var extension = file.fileName.split(".").pop().toLowerCase();
    var allowed = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "zip"];
    if (allowed.indexOf(extension) === -1) throw new Error("Format supporting document tidak didukung.");
    if (Number(file.fileSize) <= 0 || Number(file.fileSize) > 10 * 1024 * 1024) throw new Error("Ukuran supporting document melebihi batas 10 MB.");
    if (file.base64Data.length > 15 * 1024 * 1024) throw new Error("Data supporting document terlalu besar.");
  }
}

function getDriveRootFolder() {
  var folderId = PropertiesService.getScriptProperties().getProperty("PROJECT_CLOSING_DRIVE_ROOT_FOLDER_ID");
  if (!folderId) throw new Error("Konfigurasi Google Drive belum tersedia: PROJECT_CLOSING_DRIVE_ROOT_FOLDER_ID.");
  try {
    return DriveApp.getFolderById(folderId);
  } catch (err) {
    throw new Error("Konfigurasi Google Drive tidak valid. Periksa PROJECT_CLOSING_DRIVE_ROOT_FOLDER_ID.");
  }
}

function sanitizeFolderName(value) {
  return String(value || "UNSPECIFIED").replace(/[\\\\\/:*?"<>|]/g, "_").trim().substring(0, 100) || "UNSPECIFIED";
}

function getOrCreateProjectFolder(projectCode) {
  var root = getDriveRootFolder();
  var name = sanitizeFolderName(projectCode);
  var folders = root.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : root.createFolder(name);
}

function getOrCreateSubmissionFolder(projectFolder, submissionId) {
  var name = sanitizeFolderName(submissionId);
  var folders = projectFolder.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : projectFolder.createFolder(name);
}

function saveSupportingDocument(fileData, payload, submissionId, docSheet) {
  var bytes = Utilities.base64Decode(fileData.base64Data);
  var projectFolder = getOrCreateProjectFolder(payload.project_code);
  var submissionFolder = getOrCreateSubmissionFolder(projectFolder, submissionId);
  var blob = Utilities.newBlob(bytes, fileData.mimeType || "application/octet-stream", sanitizeFolderName(fileData.fileName));
  var driveFile = submissionFolder.createFile(blob);
  var uploadedAt = getJakartaTimestamp();
  var documentId = "DOC-" + Utilities.formatDate(new Date(), TIMEZONE, "yyyyMMdd") + "-" + Math.floor(100000 + Math.random() * 900000);
  docSheet.appendRow([documentId, submissionId, payload.project_code || "", payload.project_name || "", payload.business_unit || "", fileData.fileName, fileData.mimeType || "", Number(fileData.fileSize), driveFile.getId(), driveFile.getUrl(), uploadedAt]);
  return { success: true, document_id: documentId, submission_id: submissionId, project_code: payload.project_code || "", file_name: fileData.fileName, mime_type: fileData.mimeType || "", file_size: Number(fileData.fileSize), drive_file_id: driveFile.getId(), drive_url: driveFile.getUrl(), uploaded_at: uploadedAt };
}

/**
 * Helper to construct JSON response
 */
function createJsonResponse(success, submissionId, message, documents) {
  var output = {
    success: success,
    submission_id: submissionId,
    message: message
  };
  if (documents) output.documents = documents;

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Returns formatted timestamp in Asia/Jakarta
 */
function getJakartaTimestamp() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

