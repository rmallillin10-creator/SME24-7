const SHEET_ID = "1mq3eaZ-0BMEtCfU-yCMsx7qIACyN_ck1_9aCCG9tmtc";
const SHEET_NAME = "Bookings";

// Comprehensive headers for all possible booking fields
const BOOKING_HEADERS = [
  "Timestamp",
  "Fullname",
  "Mobile Number",
  "Preferred Service",
  "Preferred Date",
  "Preferred Time",
  "Preferred Female Therapist",
  "Female Therapist Count",
  "Preferred Female Therapist Name",
  "Female Therapist Available",
  "Preferred Male Therapist",
  "Male Therapist Count",
  "Preferred Male Therapist Name",
  "Male Therapist Available",
  "Location",
  "Landmark",
  "Estimated Service Cost",
  "Taxi Fare",
  "Total Estimate",
  "Special Requests",
  "Booking Status",
  "Source",
  "Booking ID",
  "Date Submitted",
  "Terms Accepted"
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const { action, data, autoAdjustHeaders = false } = payload;

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

    if (action === 'saveBooking') {
      return handleSaveBooking(sheet, data, autoAdjustHeaders);
    } else if (action === 'saveTherapistCounts') {
      return handleSaveTherapistCounts(sheet, data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("doPost error:", error);
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSaveBooking(sheet, bookingData, autoAdjustHeaders) {
  // Ensure headers are present and correct
  if (sheet.getLastRow() === 0 || autoAdjustHeaders) {
    ensureHeaders(sheet, BOOKING_HEADERS);
  }

  // Get header row to map data to correct columns
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  headerRow.forEach((header, index) => {
    headerMap[header] = index + 1; // 1-based column index
  });

  // Prepare row data in correct order
  const rowData = new Array(headerRow.length).fill('');

  // Map booking data to correct columns
  Object.keys(bookingData).forEach(key => {
    const headerName = mapFieldToHeader(key);
    if (headerMap[headerName] !== undefined) {
      rowData[headerMap[headerName] - 1] = bookingData[key];
    }
  });

  // Append the row
  sheet.appendRow(rowData);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Booking saved successfully" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleSaveTherapistCounts(sheet, data) {
  // This would handle saving therapist booking counts
  // For now, just return success
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Therapist counts saved" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(sheet, expectedHeaders) {
  const currentHeaders = sheet.getLastRow() > 0 ?
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];

  // Check if headers need to be updated
  const needsUpdate = currentHeaders.length !== expectedHeaders.length ||
    !expectedHeaders.every((header, index) => currentHeaders[index] === header);

  if (needsUpdate) {
    // Clear existing headers and set new ones
    if (sheet.getLastRow() > 0) {
      sheet.getRange(1, 1, 1, Math.max(currentHeaders.length, expectedHeaders.length)).clear();
    }
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  }
}

function mapFieldToHeader(fieldName) {
  const fieldMapping = {
    timestamp: "Timestamp",
    fullname: "Fullname",
    mobileNumber: "Mobile Number",
    preferredService: "Preferred Service",
    preferredDate: "Preferred Date",
    preferredTime: "Preferred Time",
    preferredFemaleTherapist: "Preferred Female Therapists",
    femaleTherapistCount: "Female Therapist Count",
    preferredFemaleTherapistName: "Preferred Female Therapist Name",
    femaleTherapistAvailable: "Female Therapist Available",
    preferredMaleTherapist: "Preferred Male Therapists",
    maleTherapistCount: "Male Therapist Count",
    preferredMaleTherapistName: "Preferred Male Therapist Name",
    maleTherapistAvailable: "Male Therapist Available",
    location: "Location",
    landmark: "Landmark",
    estimatedServiceCost: "Estimated Service Cost",
    taxiFare: "Taxi Fare",
    totalEstimate: "Total Estimate",
    specialRequests: "Special Requests",
    bookingStatus: "Booking Status",
    source: "Source",
    bookingId: "Booking ID",
    dateSubmitted: "Date Submitted",
    termsAccepted: "Terms Accepted"
  };

  return fieldMapping[fieldName] || fieldName;
}
    .setMimeType(ContentService.MimeType.JSON);
}
