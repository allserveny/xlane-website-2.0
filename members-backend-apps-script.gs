/**
 * XLane Rentals — Membership Application Backend
 * ------------------------------------------------
 * This script receives submissions from members.html and logs each
 * membership application as a row in this spreadsheet. Set up the same
 * way as check-in-backend-apps-script.gs.
 *
 * Setup:
 * 1. Create (or open) a Google Sheet to hold applications.
 * 2. Extensions > Apps Script, paste this file in, save.
 * 3. Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployed Web App URL and paste it into members.html as
 *    the value of MEMBER_SUBMIT_URL.
 */

var SHEET_NAME = 'Membership Applications';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.fullName || !data.phone || !data.email) {
      return jsonResponse({ status: 'error', message: 'Missing required field.' });
    }

    var sheet = getOrCreateSheet(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      data.fullName,
      data.phone,
      data.email,
      data.frequency || '',
      data.vehicle || '',
      data.notes || '',
      'New'   // Status column — update manually as applications are reviewed
    ]);

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow([
      'Timestamp', 'Full Name', 'Phone', 'Email', 'Rental Frequency', 'Preferred Vehicle', 'Notes', 'Status'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
