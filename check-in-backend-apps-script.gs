/**
 * XLane Rentals — Check-In Form Backend
 * -------------------------------------
 * This script receives submissions from check-in.html, saves the photos
 * to a Google Drive folder, and logs each check-in as a row in this
 * spreadsheet. See the setup instructions provided alongside this file.
 *
 * It must be pasted into the Apps Script editor of a Google Sheet
 * (Extensions > Apps Script), then deployed as a Web App.
 */

var FOLDER_NAME = 'XLane Check-In Photos';
var SHEET_NAME = 'Check-Ins';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.fullName) {
      return jsonResponse({ status: 'error', message: 'Missing full name.' });
    }

    var rootFolder = getOrCreateFolder(FOLDER_NAME);
    var timestamp = new Date();
    var submissionFolder = rootFolder.createFolder(
      data.fullName + ' — ' + timestamp.toISOString()
    );

    var selfieUrl = saveFile(submissionFolder, data.selfiePhoto, 'selfie-with-license');
    var cardFrontUrl = saveFile(submissionFolder, data.cardFront, 'card-front');
    var cardBackUrl = saveFile(submissionFolder, data.cardBack, 'card-back');

    var sheet = getOrCreateSheet(SHEET_NAME);
    sheet.appendRow([
      timestamp,
      data.fullName,
      selfieUrl,
      cardFrontUrl,
      cardBackUrl,
      submissionFolder.getUrl()
    ]);

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
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

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow([
      'Timestamp', 'Full Name', 'Selfie (License)', 'Card Front', 'Card Back', 'Folder Link'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
