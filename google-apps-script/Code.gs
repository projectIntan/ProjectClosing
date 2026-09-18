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
    if (!subSheet || !ansSheet) {
      setupSheet();
      subSheet = ss.getSheetByName("SUBMISSIONS");
      ansSheet = ss.getSheetByName("ANSWERS");
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

    // 1. SAVE TO SUBMISSIONS SHEET
    // Columns: submission_id | timestamp | respondent_name | function | project_code | project_name | business_unit | client | status
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

    return createJsonResponse(true, submissionId, "Response saved successfully");

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return createJsonResponse(false, null, "Failed to record response: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper to construct JSON response
 */
function createJsonResponse(success, submissionId, message) {
  var output = {
    success: success,
    submission_id: submissionId,
    message: message
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Returns formatted timestamp in Asia/Jakarta
 */
function getJakartaTimestamp() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
