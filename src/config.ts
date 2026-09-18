/**
 * Configuration file for Project Closing Questionnaire.
 * 
 * To connect with Google Sheets:
 * 1. Deploy the Google Apps Script provided in `google-apps-script/Code.gs` as a Web App.
 * 2. Set 'Execute as: Me' and 'Who has access: Anyone'.
 * 3. Copy the Web App URL and paste it below into GOOGLE_APPS_SCRIPT_URL.
 * 
 * If GOOGLE_APPS_SCRIPT_URL is empty or default, the app runs in Mock Mode
 * so you can test submissions and PDF generation locally without errors.
 */

export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9gWUIlLr5jqEZNy-yNTUq8VhGoHqD6BSfkNbFRr3DElQjGmxDWxpgvGi_giQjo0L1/exec';

/**
 * Optional Company Logo URL to show on the top of the generated PDF document.
 * Example: 'https://example.com/logo.png' or a data URL (base64).
 * If empty, the PDF is generated cleanly with standard enterprise text header.
 */
export const COMPANY_LOGO_URL = '';
