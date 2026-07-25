/**
 * XLane Rentals — Membership Application & Agreement Backend
 * ------------------------------------------------------------
 * Handles two form types from the same deployed Web App URL:
 *   - "application" (members.html)          -> "Membership Applications" tab
 *   - "signature"   (membership-agreement.html) -> "Membership Signatures" tab
 *
 * If you already deployed an earlier version of this script, you do NOT
 * need to create a new deployment/URL. Just replace the code below in the
 * same Apps Script project, save, then:
 *   Deploy > Manage deployments > (pencil icon on the existing deployment)
 *   > Version: New version > Deploy.
 * This keeps the same Web App URL already pasted into members.html.
 *
 * Setup (first time only):
 * 1. Create (or open) a Google Sheet to hold applications.
 * 2. Extensions > Apps Script, paste this file in, save.
 * 3. Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployed Web App URL and paste it into members.html AND
 *    membership-agreement.html as the value of MEMBER_SUBMIT_URL.
 */

var APPLICATIONS_SHEET = 'Membership Applications';
var SIGNATURES_SHEET = 'Membership Signatures';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.formType === 'signature') {
      return handleSignature(data);
    }
    return handleApplication(data);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function handleApplication(data) {
  if (!data.fullName || !data.phone || !data.email) {
    return jsonResponse({ status: 'error', message: 'Missing required field.' });
  }

  var sheet = getOrCreateSheet(APPLICATIONS_SHEET, [
    'Timestamp', 'Full Name', 'Phone', 'Email', 'Rental Frequency', 'Preferred Vehicle',
    'Notes', 'Agreed to Terms', 'Agreed At (client)', 'Status'
  ]);
  sheet.appendRow([
    new Date(),
    data.fullName,
    data.phone,
    data.email,
    data.frequency || '',
    data.vehicle || '',
    data.notes || '',
    data.agreedToTerms ? 'Yes' : 'No',
    data.agreedAt || '',
    'New'   // Status column — update manually as applications are reviewed
  ]);

  return jsonResponse({ status: 'ok' });
}

function handleSignature(data) {
  if (!data.fullName || !data.phone || !data.email || !data.signature || !data.agreedToTerms) {
    return jsonResponse({ status: 'error', message: 'Missing required field or terms not confirmed.' });
  }

  var sheet = getOrCreateSheet(SIGNATURES_SHEET, [
    'Timestamp', 'Full Name', 'Phone', 'Email', 'Typed Signature',
    'Agreed to Terms', 'Agreed At (client)', 'Billing Status'
  ]);
  sheet.appendRow([
    new Date(),
    data.fullName,
    data.phone,
    data.email,
    data.signature,
    data.agreedToTerms ? 'Yes' : 'No',
    data.agreedAt || '',
    'Pending'   // Billing Status column — update manually once the Stripe subscription is created
  ]);

  return jsonResponse({ status: 'ok' });
}

function getOrCreateSheet(name, headerRow) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headerRow);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
