/**
 * XLane Rentals — Renter Verification, Check-In & Check-Out Form Backend
 * ----------------------------------------------------------------------
 * Receives submissions from three pages, saves the photos to Google Drive,
 * and logs each submission as a row in this spreadsheet:
 *   - verify.html    (ID & card)        -> "Verifications" tab, photos in "XLane Verification Photos"
 *   - check-in.html  (vehicle, pickup)  -> "Check-Ins" tab,     photos in "XLane Vehicle Check-In Photos"
 *   - check-out.html (vehicle, return)  -> "Check-Outs" tab,    photos in "XLane Check-Out Photos"
 *
 * One-time migration (automatic): the identity data used to live in a tab
 * called "Check-Ins" and a Drive folder called "XLane Check-In Photos".
 * On the first submission after this version is deployed, that tab is
 * renamed to "Verifications" and that folder to "XLane Verification
 * Photos", so the name "Check-Ins" is free for vehicle check-ins.
 *
 * Paste into the Apps Script editor of this Google Sheet (Extensions >
 * Apps Script), replacing the old code, then redeploy as a NEW VERSION of
 * the existing Web App deployment (Deploy > Manage deployments > pencil
 * icon > Version: New version > Deploy) so the Web App URL stays the same.
 */

var VERIFY_FOLDER_NAME = 'XLane Verification Photos';
var VERIFY_SHEET_NAME = 'Verifications';
var VERIFY_HEADERS = [
  'Timestamp', 'Full Name', 'Selfie (License)', 'Card Front', 'Card Back', 'Folder Link'
];
var OLD_VERIFY_SHEET_NAME = 'Check-Ins';
var OLD_VERIFY_FOLDER_NAME = 'XLane Check-In Photos';

var CHECKIN_FOLDER_NAME = 'XLane Vehicle Check-In Photos';
var CHECKIN_SHEET_NAME = 'Check-Ins';
var CHECKIN_HEADERS = [
  'Timestamp', 'Full Name', 'Front', 'Back', 'Driver Side', 'Passenger Side',
  'Dashboard (Mileage & Fuel)', 'Damage Close-Ups', 'Folder Link'
];

var CHECKOUT_FOLDER_NAME = 'XLane Check-Out Photos';
var CHECKOUT_SHEET_NAME = 'Check-Outs';
var CHECKOUT_HEADERS = [
  'Timestamp', 'Full Name', 'Front', 'Back', 'Driver Side', 'Passenger Side', 'Folder Link',
  'Dashboard (Mileage & Fuel)'
];

// Renames the old identity tab/folder the first time this version runs.
function migrateOldNames() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(VERIFY_SHEET_NAME)) {
    var old = ss.getSheetByName(OLD_VERIFY_SHEET_NAME);
    if (old && old.getRange(1, 3).getValue() === 'Selfie (License)') {
      old.setName(VERIFY_SHEET_NAME);
    }
  }
  if (!DriveApp.getFoldersByName(VERIFY_FOLDER_NAME).hasNext()) {
    var folders = DriveApp.getFoldersByName(OLD_VERIFY_FOLDER_NAME);
    if (folders.hasNext()) folders.next().setName(VERIFY_FOLDER_NAME);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.fullName) {
      return jsonResponse({ status: 'error', message: 'Missing full name.' });
    }

    migrateOldNames();

    if (data.formType === 'checkout') {
      return handleCheckout(data);
    }
    if (data.formType === 'pickup') {
      return handleVehicleCheckin(data);
    }
    return handleVerification(data);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function handleVerification(data) {
  var rootFolder = getOrCreateFolder(VERIFY_FOLDER_NAME);
  var timestamp = new Date();
  var submissionFolder = rootFolder.createFolder(
    data.fullName + ' — ' + timestamp.toISOString()
  );

  var selfieUrl = saveFile(submissionFolder, data.selfiePhoto, 'selfie-with-license');
  var cardFrontUrl = saveFile(submissionFolder, data.cardFront, 'card-front');
  var cardBackUrl = saveFile(submissionFolder, data.cardBack, 'card-back');

  var sheet = getOrCreateSheet(VERIFY_SHEET_NAME, VERIFY_HEADERS);
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

function handleVehicleCheckin(data) {
  var rootFolder = getOrCreateFolder(CHECKIN_FOLDER_NAME);
  var timestamp = new Date();
  var submissionFolder = rootFolder.createFolder(
    data.fullName + ' — ' + timestamp.toISOString()
  );

  var frontUrl = saveFile(submissionFolder, data.photoFront, 'front');
  var backUrl = saveFile(submissionFolder, data.photoBack, 'back');
  var driverUrl = saveFile(submissionFolder, data.photoDriver, 'driver-side');
  var passengerUrl = saveFile(submissionFolder, data.photoPassenger, 'passenger-side');
  var dashboardUrl = saveFile(submissionFolder, data.photoDashboard, 'dashboard-mileage-fuel');
  var damageUrls = (data.damagePhotos || []).slice(0, 6).map(function(img, i) {
    return saveFile(submissionFolder, img, 'damage-' + (i + 1));
  }).filter(function(u) { return u; });

  var sheet = getOrCreateSheet(CHECKIN_SHEET_NAME, CHECKIN_HEADERS);
  sheet.appendRow([
    timestamp,
    data.fullName,
    frontUrl,
    backUrl,
    driverUrl,
    passengerUrl,
    dashboardUrl,
    damageUrls.length ? damageUrls.join('\n') : 'None',
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
  var dashboardUrl = saveFile(submissionFolder, data.photoDashboard, 'dashboard-mileage-fuel');

  var sheet = getOrCreateSheet(CHECKOUT_SHEET_NAME, CHECKOUT_HEADERS);
  ensureHeaders(sheet, CHECKOUT_HEADERS);
  sheet.appendRow([
    timestamp,
    data.fullName,
    frontUrl,
    backUrl,
    driverUrl,
    passengerUrl,
    submissionFolder.getUrl(),
    dashboardUrl
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

// Adds any header cells that are missing (e.g. the Dashboard column added
// after the Check-Outs tab was first created). Existing rows are untouched.
function ensureHeaders(sheet, headers) {
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (current[i] !== headers[i]) {
      sheet.getRange(1, i + 1).setValue(headers[i]);
    }
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
