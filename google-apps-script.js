const SHEET_ID = "1mq3eaZ-0BMEtCfU-yCMsx7qIACyN_ck1_9aCCG9tmtc";
const SHEET_NAME = "Bookings";

const BOOKING_HEADERS = [
  "Timestamp",
  "Fullname",
  "Mobile Number",
  "Preferred Service",
  "Female Therapist Count",
  "Male Therapist Count",
  "Preferred Date",
  "Preferred Time",
  "Preferred Female Therapists",
  "Preferred Male Therapists",
  "Taxi Fare",
  "Estimated Service Cost",
  "Total Estimate in USD/PESO",
  "Notes",
  "Terms Accepted"
];

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BOOKING_HEADERS);
  }

  sheet.appendRow([
    payload.timestamp || new Date().toISOString(),
    payload.fullname || "",
    payload.mobileNumber || "",
    payload.preferredService || "",
    payload.femaleTherapistCount || "",
    payload.maleTherapistCount || "",
    payload.preferredDate || "",
    payload.preferredTime || "",
    payload.preferredFemaleTherapists || "",
    payload.preferredMaleTherapists || "",
    payload.taxiFare || "",
    payload.estimatedServiceCost || "",
    payload.totalEstimateUsdPeso || "",
    payload.notes || "",
    payload.termsAccepted || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
