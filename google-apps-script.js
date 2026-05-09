const SHEET_ID = "1mq3eaZ-0BMEtCfU-yCMsx7qIACyN_ck1_9aCCG9tmtc";
const SHEET_NAME = "Bookings";
const REVIEW_SHEET_NAME = "Reviews";

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

const REVIEW_HEADERS = [
  "Timestamp",
  "Review ID",
  "Name",
  "Rating",
  "Comment",
  "Service Date",
  "Source",
  "Status"
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const { action, data, autoAdjustHeaders = false } = payload;

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

    let result;
    if (action === 'saveBooking') {
      const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
      result = handleSaveBooking(sheet, data, autoAdjustHeaders);
    } else if (action === 'saveTherapistCounts') {
      const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
      result = handleSaveTherapistCounts(sheet, data);
    } else if (action === 'saveReview') {
      const sheet = spreadsheet.getSheetByName(REVIEW_SHEET_NAME) || spreadsheet.insertSheet(REVIEW_SHEET_NAME);
      result = handleSaveReview(sheet, data);
    } else {
      result = { error: "Unknown action" };
    }

    return jsonResponse(result);

  } catch (error) {
    console.error("doPost error:", error);
    return jsonResponse({ success: false, error: error.message });
  }
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (params.action === "listReviews") {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(REVIEW_SHEET_NAME) || spreadsheet.insertSheet(REVIEW_SHEET_NAME);
    const result = handleListReviews(sheet);
    if (params.callback) {
      return jsonpResponse(params.callback, result);
    }
    return jsonResponse(result);
  }

  const result = {
    success: true,
    message: "SME booking endpoint is live",
    sheetName: SHEET_NAME,
    reviewSheetName: REVIEW_SHEET_NAME
  };

  if (params.callback) {
    return jsonpResponse(params.callback, result);
  }
  return jsonResponse(result);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpResponse(callback, data) {
  const safeCallback = String(callback || "").replace(/[^\w.$]/g, "");
  return ContentService
    .createTextOutput(`${safeCallback}(${JSON.stringify(data)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
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

  return { success: true, message: "Booking saved successfully" };
}

function handleSaveTherapistCounts(sheet, data) {
  // This would handle saving therapist booking counts
  // For now, just return success
  return { success: true, message: "Therapist counts saved" };
}

function handleSaveReview(sheet, reviewData) {
  ensureHeaders(sheet, REVIEW_HEADERS);

  const rating = Math.max(1, Math.min(5, Number(reviewData.rating || 5)));
  const rowData = [
    reviewData.timestamp || new Date().toISOString(),
    reviewData.reviewId || "RV" + Date.now(),
    sanitizeCell(reviewData.name || "Anonymous Client"),
    rating,
    sanitizeCell(reviewData.comment || ""),
    sanitizeCell(reviewData.serviceDate || ""),
    sanitizeCell(reviewData.source || "Website Review"),
    sanitizeCell(reviewData.status || "Approved")
  ];

  sheet.appendRow(rowData);

  return { success: true, message: "Review saved successfully" };
}

function handleListReviews(sheet) {
  ensureHeaders(sheet, REVIEW_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: true, reviews: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, REVIEW_HEADERS.length).getValues();
  const reviews = rows.map((row) => ({
    timestamp: row[0],
    reviewId: row[1],
    name: row[2],
    rating: row[3],
    comment: row[4],
    serviceDate: row[5],
    source: row[6],
    status: row[7]
  })).filter((review) => {
    const status = String(review.status || "Approved").toLowerCase();
    return review.comment && status !== "hidden" && status !== "rejected";
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { success: true, reviews };
}

function sanitizeCell(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
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
    preferredFemaleTherapist: "Preferred Female Therapist",
    femaleTherapistCount: "Female Therapist Count",
    preferredFemaleTherapistName: "Preferred Female Therapist Name",
    femaleTherapistAvailable: "Female Therapist Available",
    preferredMaleTherapist: "Preferred Male Therapist",
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
