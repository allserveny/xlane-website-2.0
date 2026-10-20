/**
 * XLane Rentals — Check-In & Check-Out Form Backend
 * -------------------------------------------------
 * This script receives submissions from check-in.html AND check-out.html,
 * saves the photos to Google Drive, and logs each submission as a row in
 * this spreadsheet:
 *   - Check-ins  -> "Check-Ins" tab,  photos in "XLane Check-In Photos"
 *   - Check-outs -> "Check-Outs" tab, photos in "XLane Check-Out Photos"
 * The "Check-Outs" tab and folder are created automatically on the first
 * check-out submission.
 *
 * It must be pasted into the Apps Script editor of the Check-In Google
 * Sheet (Extensions > Apps Script), replacing the old code, then
 * redeployed as a NEW VERSION of the existing Web App deployment
 * (Deploy > Manage deployments > pencil icon > Version: New version >
 * Deploy) so the Web App URL stays the same.
 */

var CHECKIN_FOLDER_NAME = 'XLane Check-In Photos';
var CHECKIN_SHEET_NAME = 'Check-Ins';
var CHECKIN_HEADERS = [
  'Timestamp', 'Full Name', 'Selfie (License)', 'Card Front', 'Card Back', 'Folder Link'
];

var CHECKOUT_FOLDER_NAME = 'XLane Check-Out Photos';
var CHECKOUT_SHEET_NAME = 'Check-Outs';
var CHECKOUT_HEADERS = [
  'Timestamp', 'Full Name', 'Front', 'Back', 'Driver Side', 'Passenger Side', 'Folder Link'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.fullName) {
      return jsonResponse({ status: 'error', message: 'Missing full name.' });
    }

    if (data.formType === 'checkout') {
      return handleCheckout(data);
    }
    return handleCheckin(data);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function handleCheckin(data) {
  var rootFolder = getOrCreateFolder(CHECKIN_FOLDER_NAME);
  var timestamp = new Date();
  var submissionFolder = rootFolder.createFolder(
    data.fullName + ' — ' + timestamp.toISOString()
  );

  var selfieUrl = saveFile(submissionFolder, data.selfiePhoto, 'selfie-with-license');
  var cardFrontUrl = saveFile(submissionFolder, data.cardFront, 'card-front');
  var cardBackUrl = saveFile(submissionFolder, data.cardBack, 'card-back');

  var sheet = getOrCreateSheet(CHECKIN_SHEET_NAME, CHECKIN_HEADERS);
  sheet.appendRow([
    timestamp,
    data.fullName,
    selfieUrl,
    cardFrontUrl,
    cardBackUrl,
    submissionFolder.getUrl()
  ]);

  return jsonResponse({ status: 'ok' });
}

function handleCheckout(data) {
  var rootFolder = getOrCreateFolder(CHECKOUT_FOLDER_NAME);
  var timestamp = new Date();
  var submissionFolder = rootFolder.createFolder(
    data.fullName + ' — ' + timestamp.toISOString()
  );

  var frontUrl = saveFile(submissionFolder, data.photoFront, 'front');
  var backUrl = saveFile(submissionFolder, data.photoBack, 'back');
  var driverUrl = saveFile(submissionFolder, data.photoDriver, 'driver-side');
  var passengerUrl = saveFile(submissionFolder, data.photoPassenger, 'passenger-side');

  var sheet = getOrCreateSheet(CHECKOUT_SHEET_NAME, CHECKOUT_HEADERS);
  sheet.appendRow([
    timestamp,
    data.fullName,
    frontUrl,
    backUrl,
    driverUrl,
    passengerUrl,
    submissionFolder.getUrl()
  ]);

  return jsonResponse({ status: 'ok' });
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

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
