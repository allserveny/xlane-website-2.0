/**
 * XLane Rentals — Membership Application & Agreement Backend
 * ------------------------------------------------------------
 * Handles two form types from the same deployed Web App URL:
 *   - "application" (members.html)          -> "Membership Applications" tab
 *                                                + driver's license photos saved to Drive
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
 *
 * If you get a "You do not have permission to call DriveApp..." error after
 * updating this script: select "authorize" in the function dropdown above
 * the toolbar, click Run, and approve the Drive permission prompt. You only
 * need to do this once — after that, the existing deployment will work.
 */

var APPLICATIONS_SHEET = 'Membership Applications';
var SIGNATURES_SHEET = 'Membership Signatures';
var LICENSE_FOLDER_NAME = 'XLane Membership — Driver License Photos';

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

  var licenseFrontUrl = '';
  var licenseBackUrl = '';

  if (data.licenseFront || data.licenseBack) {
    var rootFolder = getOrCreateFolder(LICENSE_FOLDER_NAME);
    var submissionFolder = rootFolder.createFolder(
      data.fullName + ' — ' + new Date().toISOString()
    );
    licenseFrontUrl = saveFile(submissionFolder, data.licenseFront, 'license-front');
    licenseBackUrl = saveFile(submissionFolder, data.licenseBack, 'license-back');
  }

  var sheet = getOrCreateSheet(APPLICATIONS_SHEET, [
    'Timestamp', 'Full Name', 'Phone', 'Email', 'Rental Frequency', 'Preferred Vehicle',
    'Notes', 'License Front', 'License Back', 'Agreed to Terms', 'Agreed At (client)', 'Status'
  ]);
  sheet.appendRow([
    new Date(),
    data.fullName,
    data.phone,
    data.email,
    data.frequency || '',
    data.vehicle || '',
    data.notes || '',
    licenseFrontUrl,
    licenseBackUrl,
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

function authorize() {
  // Run this function once manually (select it above, then click Run) any
  // time you add a new Google service to this script. Apps Script only
  // prompts for new permissions when a function is run directly in the
  // editor — a web app deployment alone will not trigger the prompt.
  DriveApp.getRootFolder();
  SpreadsheetApp.getActiveSpreadsheet();
}

function saveFile(folder, base64Data, label) {
  if (!base64Data) return '';
  var matches = base64Data.match(/^data:(.+);base64,(.*)$/);
  if (!matches) return '';
  var contentType = matches[1];
  var bytes = Utilities.base64Decode(matches[2]);
  var extension = contentType.indexOf('png') > -1 ? '.png' : '.jpg';
  var blob = Utilities.newBlob(bytes, contentType, label + extension);
  var file = folder.createFile(blob);
  // Files are private by default — viewable only by people with access to
  // this Drive (you / your team). No public sharing link is created.
  return file.getUrl();
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
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
