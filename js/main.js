function peso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);
}

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxUW2plGdqrYoUTuhZviNVRcRMQf5CQ4XaYdh3xCT9ohal4Ease7oUp7tIoeLDBwYjb/exec";
const PHP_PER_USD = 57.5;
const DEFAULT_SITE_SETTINGS = {
  business: {
    name: "Sensual Massage Elite SME 24/7 Hotel and Condo Service Male and Female Therapist",
    address: "Metro Manila, Philippines",
    mapsLink: "https://www.google.com/maps/place/Sensual+Massage+Elite+SME+24%2F7+Hotel+and+Condo+Service+Male+and+Female+Therapist/@14.5479717,121.0337778,15z/data=!4m8!3m7!1s0x3397c92785855c51:0x811c86afc64b37e6!8m2!3d14.5479717!4d121.0502573!9m1!1b1!16s%2Fg%2F11y4r8yxjs?entry=ttu",
    logo: "",
    googleRating: "5.0",
    googleReviewCount: "",
    googleRatingLabel: "Google Maps rating"
  },
  taxiFare: 0,
  googleSheetsWebAppUrl: "",
  services: [
    { name: "Whole Body Massage", price: 0 },
    { name: "Sensual Massage", price: 0 }
  ],
  contacts: {
    viber: "",
    wechat: "",
    kakaotalk: "",
    telegram: "",
    whatsapp: ""
  }
};

function usd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

let cachedSettings = null;
let selectedFemaleTherapistIds = [];
let selectedMaleTherapistIds = [];
let cachedReviews = null;

const DEFAULT_REVIEWS = [];

function getSiteSettings() {
  // Return cached settings immediately
  if (cachedSettings) return cachedSettings;
  
  // Try localStorage first
  try {
    const saved = JSON.parse(localStorage.getItem("eliteSiteSettings") || "{}");
    const taxiFareFromSaved = saved.taxiFare ?? saved.taxiFares?.default ?? 0;
    const taxiFareCurrencyFromSaved = saved.taxiFareCurrency ?? saved.taxiFares?.currency ?? "PHP";
    const taxiFareNotesFromSaved = saved.taxiFareNotes ?? saved.taxiFares?.notes ?? "";
    const googleSheetsWebAppUrlFromSaved = saved.googleSheetsWebAppUrl || "";

    cachedSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...saved,
      taxiFare: taxiFareFromSaved,
      taxiFareCurrency: taxiFareCurrencyFromSaved,
      taxiFareNotes: taxiFareNotesFromSaved,
      googleSheetsWebAppUrl: googleSheetsWebAppUrlFromSaved,
      business: { ...DEFAULT_SITE_SETTINGS.business, ...(saved.business || {}) },
      contacts: { ...DEFAULT_SITE_SETTINGS.contacts, ...(saved.contacts || {}) }
    };
    return cachedSettings;
  } catch {
    cachedSettings = DEFAULT_SITE_SETTINGS;
    return DEFAULT_SITE_SETTINGS;
  }
}

function getGoogleSheetsWebAppUrl() {
  const settings = getSiteSettings();
  const savedUrl = (settings.googleSheetsWebAppUrl || GOOGLE_SHEETS_WEB_APP_URL || "").trim();
  const placeholderFragment = "AKfycbyF7X3JnLzQ8W7kK9mX2p5r8t3y6u1i4o2w3e6r9t7y5u8i2o1w4e6r9t";
  if (!savedUrl || savedUrl.includes(placeholderFragment)) {
    return "";
  }
  return savedUrl;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Async function to fetch settings from Supabase
async function loadSiteSettingsFromSupabase() {
  const supabaseSettings = await fetchSiteSettingsFromSupabase();
  if (supabaseSettings) {
    cachedSettings = {
      ...DEFAULT_SITE_SETTINGS,
      business: {
        name: supabaseSettings.business_name || DEFAULT_SITE_SETTINGS.business.name,
        address: supabaseSettings.business_address || DEFAULT_SITE_SETTINGS.business.address,
        mapsLink: supabaseSettings.business_maps_link || DEFAULT_SITE_SETTINGS.business.mapsLink,
        logo: supabaseSettings.business_logo || "",
        serviceType: supabaseSettings.business_service_type || "",
        serviceArea: supabaseSettings.business_service_area || "",
        googleRating: supabaseSettings.business_google_rating || "5.0",
        googleReviewCount: supabaseSettings.business_google_review_count || "",
        googleRatingLabel: supabaseSettings.business_google_rating_label || "Google Maps rating"
      },
      taxiFare: supabaseSettings.taxi_fare || 0,
      taxiFareCurrency: supabaseSettings.taxi_fare_currency || "PHP",
      taxiFareNotes: supabaseSettings.taxi_fare_notes || "",
      googleSheetsWebAppUrl: supabaseSettings.google_sheets_web_app_url || "",
      services: [
        { name: supabaseSettings.service_1_name || "Whole Body Massage", price: supabaseSettings.service_1_price || 0 },
        { name: supabaseSettings.service_2_name || "Sensual Massage", price: supabaseSettings.service_2_price || 0 }
      ],
      contacts: {
        viber: supabaseSettings.viber || "",
        wechat: supabaseSettings.wechat || "",
        kakaotalk: supabaseSettings.kakaotalk || "",
        telegram: supabaseSettings.telegram || "",
        whatsapp: supabaseSettings.whatsapp || ""
      }
    };
    localStorage.setItem("eliteSiteSettings", JSON.stringify(cachedSettings));
    return cachedSettings;
  }
  return getSiteSettings();
}

async function loadTherapistsFromSupabase() {
  if (typeof fetchTherapistsFromSupabase !== "function") return [];
  const therapists = await fetchTherapistsFromSupabase();
  window.supabaseTherapists = therapists;
  if (therapists.length) {
    if (typeof therapistData !== "undefined") {
      therapists.forEach((therapist) => {
        const index = therapistData.findIndex((item) => item.id === therapist.id);
        if (index >= 0) {
          therapistData[index] = { ...therapistData[index], ...therapist };
        } else {
          therapistData.push(therapist);
        }
      });
    }
  }
  return therapists;
}

async function loadSharedDatabaseData() {
  await Promise.all([
    typeof fetchSiteSettingsFromSupabase === "function" ? loadSiteSettingsFromSupabase() : Promise.resolve(getSiteSettings()),
    loadTherapistsFromSupabase()
  ]);
}

function refreshCurrentPageWidgets() {
  applyBusinessProfile();
  renderOfficialNumber();

  if (document.getElementById("featuredTherapists")) {
    renderTherapists("featuredTherapists", { featured: true });
  }
  if (document.getElementById("femaleTherapists")) {
    setupDirectory("femaleTherapists", "female");
  }
  if (document.getElementById("maleTherapists")) {
    setupDirectory("maleTherapists", "male");
  }
  if (document.getElementById("companyContacts")) {
    renderCompanyContacts("companyContacts");
  }
  document.querySelectorAll("[data-business-map-rating]").forEach((target) => renderBusinessMapRating(target));
  if (document.getElementById("businessReviews")) {
    setupReviewsSection();
  }
  if (document.getElementById("bookingForm")) {
    populateBookingSelect();
    updateBookingEstimate();
  }
}

function applyBusinessProfile() {
  const settings = getSiteSettings();
  const business = settings.business || DEFAULT_SITE_SETTINGS.business;
  const logo = business.logo || (window.location.pathname.toLowerCase().includes("/admin/") ? "../logo/elite%20logo.png" : "logo/elite%20logo.png");
  const favicon = business.logo || (window.location.pathname.toLowerCase().includes("/admin/") ? "../logo/elite%20logo.png" : "logo/elite%20logo.png");

  document.querySelectorAll("[data-business-name]").forEach((target) => {
    target.textContent = business.name;
  });
  document.querySelectorAll("[data-business-address]").forEach((target) => {
    target.textContent = business.address;
  });
  document.querySelectorAll("[data-business-map]").forEach((target) => {
    target.href = business.mapsLink || "#";
  });
  document.querySelectorAll("[data-business-google-rating]").forEach((target) => {
    target.textContent = formatGoogleRating(business);
  });
  document.querySelectorAll(".brand-logo, [data-business-logo]").forEach((target) => {
    target.src = logo;
  });
  document.querySelectorAll("link[rel='icon'], link[rel='alternate icon'], link[rel='apple-touch-icon']").forEach((target) => {
    target.href = favicon;
  });
}

function getTherapistPrice(therapist, count) {
  if (!therapist || count <= 0) return 0;
  return Number(therapist.pricing?.[count] || therapist.rate * count || 0);
}

function formatAvailability(availability) {
  const value = String(availability || "").trim();
  if (!value) return "";
  if (/\b(today|daily|weekdays|24 hours)\b/i.test(value)) {
    return `<span class="availability-tag">24 hours</span>`;
  }
  return value;
}

function getTherapistBookings() {
  try {
    const localBookings = JSON.parse(localStorage.getItem("eliteTherapistBookings") || "{}");
    const sharedBookings = {};
    if (typeof getAllTherapists === "function") {
      getAllTherapists().forEach((therapist) => {
        const count = Number(therapist.bookingCount || 0);
        if (count > 0) sharedBookings[therapist.id] = count;
      });
    }

    Object.entries(localBookings).forEach(([therapistId, count]) => {
      sharedBookings[therapistId] = Math.max(Number(sharedBookings[therapistId] || 0), Number(count || 0));
    });

    return sharedBookings;
  } catch {
    return {};
  }
}

function getBookingCount(therapistId) {
  return Number(getTherapistBookings()[therapistId] || 0);
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderFeaturedTherapists(targetId, count = 4) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const therapists = getAllTherapists();
  if (!therapists.length) {
    target.innerHTML = `<p class="notice">No therapists available yet. Check back soon!</p>`;
    return;
  }

  const featured = therapists.filter((therapist) => therapist.featured);
  const selection = shuffleArray(featured.length ? featured : therapists);

  target.innerHTML = selection.slice(0, count).map((therapist) => {
    const displayImage = getTherapistImages(therapist)[0] || 'images/therapists/default.svg';
    return `
      <article class="featured-therapist-card">
        <img src="${displayImage}" alt="${therapist.name}">
        <div class="featured-therapist-name">${therapist.name}</div>
      </article>
    `;
  }).join("");
}

function renderTherapists(targetId, options = {}) {
  if (options.featured) {
    return renderFeaturedTherapists(targetId, options.count || 4);
  }

  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = `<p class="notice">No therapists available.</p>`;
}

function therapistCard(therapist, options = {}) {
  const images = getTherapistImages(therapist);
  const displayImage = images[0] || 'images/therapists/default.svg';
  const hasPhotoGallery = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const rank = options.rank;
  const bookingCount = Number(options.bookingCount || 0);
  const rankBadge = typeof rank === 'number'
    ? '<div class="therapist-rank-badge ' + (rank === 1 ? 'top-rank' : '') + '">#' + rank + ' ' + (rank === 1 ? 'Most booked' : 'Booked') + '</div>'
    : '';
  const bookingInfo = typeof rank === 'number'
    ? '<p class="therapist-bookings">' + bookingCount + ' booking' + (bookingCount === 1 ? '' : 's') + '</p>'
    : '';
  const availabilityText = therapist.availability || therapist.location || 'Available';
  const availabilityClass = therapist.availability ? ' availability-glow' : '';

  return '<div class="therapist-card' + availabilityClass + '">' +
    '    <div class="therapist-image">' +
      '      <img src="' + displayImage + '" alt="' + therapist.name + '">' +
      rankBadge +
      (hasMultipleImages ? '<div class="more-images-indicator">+' + (images.length - 1) + ' more</div>' : '') +
      '    </div>' +
      '    <div class="therapist-info">' +
      '      <h3>' + therapist.name + '</h3>' +
      '      <p class="therapist-availability">Availability: ' + availabilityText + '</p>' +
      '      <p class="therapist-bio">' + (therapist.bio || 'Professional massage therapist') + '</p>' +
      '      <p class="therapist-rate">Rate: ' + (therapist.rate ? '₱' + therapist.rate : 'Contact for rates') + '</p>' +
      bookingInfo +
      '      <div class="therapist-specialties">' + ((therapist.specialties || []).join(', ')) + '</div>' +
      '    </div>' +
      '    <div class="therapist-actions">' +
      '      <button class="btn-primary" type="button" onclick="selectTherapist(event, \'' + therapist.id + '\')">Select & Book</button>' +
      (hasPhotoGallery ? '<button class="btn-secondary" type="button" onclick="viewTherapistPhotos(event, \'' + therapist.id + '\')">View Photos</button>' : '') +
      '    </div>' +
      '  </div>';
}

function formatGoogleRating(business) {
  const rating = business.googleRating || "5.0";
  const reviewCount = business.googleReviewCount ? ` (${business.googleReviewCount})` : "";
  return `${rating} / 5.0${reviewCount}`;
}

function googleMapsEmbedUrl(business) {
  const query = [business.name, business.address].filter(Boolean).join(" ");
  return `https://www.google.com/maps?q=${encodeURIComponent(query || "Metro Manila Philippines")}&output=embed`;
}

function renderBusinessMapRating(target) {
  if (!target) return;
  const business = getSiteSettings().business || DEFAULT_SITE_SETTINGS.business;
  const mapsLink = business.mapsLink || DEFAULT_SITE_SETTINGS.business.mapsLink;
  const ratingLabel = business.googleRatingLabel || "Google Maps rating";
  target.innerHTML = `
    <div class="map-rating-panel">
      <div class="map-rating-summary">
        <div>
          <span class="eyebrow">${ratingLabel}</span>
          <h2>${business.name || DEFAULT_SITE_SETTINGS.business.name}</h2>
          <p>${business.address || DEFAULT_SITE_SETTINGS.business.address}</p>
        </div>
        <div class="rating-score" aria-label="${formatGoogleRating(business)}">
          <strong>${business.googleRating || "5.0"}</strong>
          <span class="rating-stars" aria-hidden="true">★★★★★</span>
          <small>${business.googleReviewCount || "Google reviews"}</small>
        </div>
      </div>
      <div class="map-frame">
        <iframe title="${business.name || "Business"} map" src="${googleMapsEmbedUrl(business)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      <a class="button secondary" href="${mapsLink}" target="_blank" rel="noopener">Open Google Maps</a>
    </div>
  `;
}

function normalizeReview(review) {
  return {
    reviewId: String(review.reviewId || review.id || `review-${Date.now()}`),
    name: String(review.name || "Anonymous Client").trim() || "Anonymous Client",
    rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
    comment: String(review.comment || "").trim(),
    serviceDate: String(review.serviceDate || "").trim(),
    source: String(review.source || "Website Review").trim(),
    timestamp: review.timestamp || new Date().toISOString()
  };
}

function getLocalReviews() {
  try {
    return JSON.parse(localStorage.getItem("eliteReviews") || "[]").map(normalizeReview);
  } catch {
    return [];
  }
}

function saveLocalReview(review) {
  const reviews = getLocalReviews();
  reviews.unshift(normalizeReview(review));
  localStorage.setItem("eliteReviews", JSON.stringify(reviews.slice(0, 50)));
}

function mergeReviews(...reviewGroups) {
  const seen = new Set();
  return reviewGroups.flat().map(normalizeReview).filter((review) => {
    if (!review.comment) return false;
    const key = review.reviewId || `${review.name}-${review.timestamp}-${review.comment}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function fetchReviewsFromGoogleSheets() {
  const url = getGoogleSheetsWebAppUrl();
  if (!url) return Promise.resolve([]);

  return new Promise((resolve) => {
    const callbackName = `eliteReviewsCallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve([]);
    }, 9000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();
      resolve(Array.isArray(response?.reviews) ? response.reviews : []);
    };

    script.onerror = () => {
      cleanup();
      resolve([]);
    };

    script.src = `${url}${separator}action=listReviews&callback=${encodeURIComponent(callbackName)}`;
    document.body.appendChild(script);
  });
}

async function loadReviews() {
  if (cachedReviews) return cachedReviews;
  const sheetReviews = await fetchReviewsFromGoogleSheets();
  cachedReviews = mergeReviews(sheetReviews, getLocalReviews(), DEFAULT_REVIEWS);
  return cachedReviews;
}

function reviewStars(rating) {
  const score = Math.max(1, Math.min(5, Number(rating || 5)));
  return "★".repeat(score) + "☆".repeat(5 - score);
}

function renderReviews(targetId, reviews) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const items = mergeReviews(reviews || [], getLocalReviews(), DEFAULT_REVIEWS);
  target.innerHTML = items.slice(0, 12).map((review) => `
    <article class="review-card">
      <div class="review-card-head">
        <div>
          <strong>${escapeHtml(review.name)}</strong>
          <span>${escapeHtml(review.source || "Website Review")}</span>
        </div>
        <span class="review-stars" aria-label="${review.rating} out of 5">${reviewStars(review.rating)}</span>
      </div>
      <p>${escapeHtml(review.comment)}</p>
      ${review.serviceDate ? `<small>Service date: ${escapeHtml(review.serviceDate)}</small>` : ""}
    </article>
  `).join("") || `<p class="notice">No reviews yet.</p>`;
}

async function saveReviewToGoogleSheets(review) {
  const url = getGoogleSheetsWebAppUrl();
  if (!url) throw new Error("Google Sheets URL is not configured");

  await fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "saveReview",
      data: normalizeReview(review),
      autoAdjustHeaders: true
    })
  });

  return { success: true, opaque: true };
}

function setupReviewsSection() {
  const list = document.getElementById("businessReviews");
  const form = document.getElementById("reviewForm");
  const status = document.getElementById("reviewStatus");
  if (!list) return;

  loadReviews().then((reviews) => renderReviews("businessReviews", reviews));

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const review = normalizeReview({
      reviewId: `RV${Date.now()}`,
      timestamp: new Date().toISOString(),
      name: data.get("reviewName"),
      rating: data.get("reviewRating"),
      comment: data.get("reviewComment"),
      serviceDate: data.get("reviewServiceDate"),
      source: "Website Review"
    });

    if (!review.comment) {
      if (status) status.textContent = "Please write your review before sending.";
      return;
    }

    if (status) status.textContent = "Saving review...";
    saveLocalReview(review);
    cachedReviews = mergeReviews([review], cachedReviews || []);
    renderReviews("businessReviews", cachedReviews);

    try {
      await saveReviewToGoogleSheets(review);
      if (status) status.textContent = "Review saved. Please click the Google review button next to add an official Google review.";
      form.reset();
    } catch (error) {
      console.warn("Could not save review to Google Sheets:", error);
      if (status) status.textContent = "Review shown here. Google Sheets is not configured yet. You can still leave an official Google review using the button above.";
    }
  });
}

function setupDirectory(targetId, gender) {
  const target = document.getElementById(targetId);
  const search = document.getElementById("search");
  const specialty = document.getElementById("specialty");
  if (!target) return;

  const draw = () => {
    const query = (search?.value || "").toLowerCase();
    const specialtyValue = specialty?.value || "";
    const bookings = getTherapistBookings();

    const therapists = getAllTherapists().filter((therapist) => {
      const matchesGender = therapist.gender === gender;
      const matchesText = [therapist.name, therapist.location, therapist.bio].join(" ").toLowerCase().includes(query);
      const matchesSpecialty = !specialtyValue || therapist.specialties.includes(specialtyValue);
      return matchesGender && matchesText && matchesSpecialty;
    }).sort((a, b) => {
      const countA = bookings[a.id] || 0;
      const countB = bookings[b.id] || 0;
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name);
    });

    target.innerHTML = therapists.map((therapist, index) => therapistCard(therapist, {
      rank: index + 1,
      bookingCount: bookings[therapist.id] || 0
    })).join("") || `<p class="notice">No therapists match that filter yet.</p>`;
    attachTherapistGallery(target);
  };

  search?.addEventListener("input", draw);
  specialty?.addEventListener("change", draw);
  draw();
}

function getTherapistImages(therapist) {
  if (!therapist) return [];
  return [
    therapist.image,
    ...(therapist.images || []),
    ...(therapist.slides || [])
  ].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index);
}

function closeTherapistGallery() {
  document.getElementById("therapistGalleryModal")?.remove();
}

function openTherapistGallery(therapist) {
  const images = getTherapistImages(therapist);
  if (!images.length) return;
  closeTherapistGallery();
  const modal = document.createElement("div");
  modal.className = "gallery-modal";
  modal.id = "therapistGalleryModal";
  modal.innerHTML = `
    <div class="gallery-dialog" role="dialog" aria-modal="true" aria-label="${therapist.name} photo gallery">
      <button class="gallery-close" type="button" aria-label="Close gallery">×</button>
      <div class="gallery-main">
        <img id="galleryMainImage" src="${images[0]}" alt="${therapist.name}">
      </div>
      <div class="gallery-info">
        <h2>${therapist.name}</h2>
        <p>${therapist.location}</p>
      </div>
      <div class="gallery-thumbs">
        ${images.map((image, index) => `<button class="gallery-thumb ${index === 0 ? "active" : ""}" type="button" data-image="${image}"><img src="${image}" alt="${therapist.name} photo ${index + 1}"></button>`).join("")}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".gallery-close").addEventListener("click", closeTherapistGallery);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeTherapistGallery();
  });
  modal.querySelectorAll(".gallery-thumb").forEach((button) => {
    button.addEventListener("click", () => {
      modal.querySelector("#galleryMainImage").src = button.dataset.image;
      modal.querySelectorAll(".gallery-thumb").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

// View therapist photos function
function viewTherapistPhotos(event, therapistId) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const therapist = getTherapistById(therapistId);
  if (!therapist) return;
  openTherapistGallery(therapist);
}

function selectTherapist(event, therapistId) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (!therapistId) return;
  const bookingPath = window.location.pathname.toLowerCase().includes("/admin/") ? "../booking.html" : "booking.html";
  window.location.href = `${bookingPath}?therapist=${encodeURIComponent(therapistId)}`;
}

function attachTherapistGallery(scope = document) {
  scope.querySelectorAll("[data-gallery-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const therapist = getTherapistById(button.dataset.galleryId);
      if (therapist) openTherapistGallery(therapist);
    });
  });
}

function populateBookingSelect() {
  const serviceSelect = document.getElementById("preferredService");
  const femaleContainer = document.getElementById("femaleTherapistSelector");
  const maleContainer = document.getElementById("maleTherapistSelector");
  const femaleCountInput = document.getElementById("femaleTherapistCount");
  const maleCountInput = document.getElementById("maleTherapistCount");
  if (!serviceSelect || !femaleContainer || !maleContainer || !femaleCountInput || !maleCountInput) return;

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("therapist");
  const therapists = getAllTherapists();
  const settings = getSiteSettings();

  serviceSelect.innerHTML = `<option value="">Choose service</option>` + settings.services
    .map((service) => `<option value="${service.name}" data-price="${Number(service.price || 0)}">${service.name}${Number(service.price || 0) ? ` - ${peso(Number(service.price))}` : ""}</option>`)
    .join("");

  selectedFemaleTherapistIds = [];
  selectedMaleTherapistIds = [];

  const selectedTherapist = therapists.find((therapist) => therapist.id === requested);
  if (selectedTherapist?.gender === "female") {
    selectedFemaleTherapistIds = [requested];
    femaleCountInput.value = "1";
  }
  if (selectedTherapist?.gender === "male") {
    selectedMaleTherapistIds = [requested];
    maleCountInput.value = "1";
  }

  renderTherapistSelection("female");
  renderTherapistSelection("male");
}

function getTherapistsByIds(ids) {
  return (Array.isArray(ids) ? ids : String(ids || "").split(",")).map((id) => String(id).trim()).filter(Boolean).map(getTherapistById).filter(Boolean);
}

function updateTherapistSelectionInputs(gender) {
  const hiddenInput = document.getElementById(gender === "female" ? "preferredFemaleTherapist" : "preferredMaleTherapist");
  const selectedIds = gender === "female" ? selectedFemaleTherapistIds : selectedMaleTherapistIds;
  if (hiddenInput) hiddenInput.value = selectedIds.join(",");
}

function renderTherapistSelection(gender) {
  const container = document.getElementById(`${gender}TherapistSelector`);
  const countInput = document.getElementById(`${gender}TherapistCount`);
  if (!container || !countInput) return;

  const count = Number(countInput.value || 0);
  const available = getAllTherapists().filter((therapist) => therapist.gender === gender);
  const selectedIds = gender === "female" ? selectedFemaleTherapistIds : selectedMaleTherapistIds;

  if (count <= 0) {
    selectedIds.length = 0;
    updateTherapistSelectionInputs(gender);
    container.innerHTML = `<p class="notice">Set ${gender} therapist count above to choose ${gender} therapists.</p>`;
    return;
  }

  if (selectedIds.length > count) {
    selectedIds.splice(count);
  }

  const canAddMore = selectedIds.length < count;
  const rows = available.map((therapist) => {
    const isSelected = selectedIds.includes(therapist.id);
    return `
      <div class="therapist-row ${isSelected ? "selected" : ""}">
        <strong>${therapist.name}</strong>
        <div class="therapist-actions">
          <button type="button" class="therapist-add" data-gender="${gender}" data-id="${therapist.id}" ${isSelected || !canAddMore ? "disabled" : ""}>+</button>
          <button type="button" class="therapist-remove" data-gender="${gender}" data-id="${therapist.id}" ${!isSelected ? "disabled" : ""}>−</button>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = `<div class="selection-summary">Selected ${selectedIds.length}/${count} ${gender} therapist${count === 1 ? "" : "s"}</div>${rows}`;
  updateTherapistSelectionInputs(gender);

  container.querySelectorAll(".therapist-add").forEach((button) => {
    button.addEventListener("click", () => addTherapistSelection(button.dataset.gender, button.dataset.id));
  });
  container.querySelectorAll(".therapist-remove").forEach((button) => {
    button.addEventListener("click", () => removeTherapistSelection(button.dataset.gender, button.dataset.id));
  });
}

function addTherapistSelection(gender, therapistId) {
  if (!therapistId) return;
  const selectedIds = gender === "female" ? selectedFemaleTherapistIds : selectedMaleTherapistIds;
  const count = Number(document.getElementById(`${gender}TherapistCount`)?.value || 0);
  if (!count || selectedIds.includes(therapistId) || selectedIds.length >= count) return;
  selectedIds.push(therapistId);
  updateTherapistSelectionInputs(gender);
  renderTherapistSelection(gender);
  updateBookingEstimate();
}

function removeTherapistSelection(gender, therapistId) {
  if (!therapistId) return;
  const selectedIds = gender === "female" ? selectedFemaleTherapistIds : selectedMaleTherapistIds;
  const index = selectedIds.indexOf(therapistId);
  if (index === -1) return;
  selectedIds.splice(index, 1);
  updateTherapistSelectionInputs(gender);
  renderTherapistSelection(gender);
  updateBookingEstimate();
}

function getTherapistById(id) {
  return getAllTherapists().find((therapist) => therapist.id === id);
}

// Function to calculate taxi fare based on location
function calculateTaxiFarePerTherapist(location) {
  const settings = getSiteSettings();
  const baseFare = Number(settings.taxiFare || 0);
  const locationLower = String(location || "").toLowerCase();
  let locationFare = baseFare;

  // Location-based adjustments
  const locationRates = {
    'makati': baseFare,
    'bgc': baseFare,
    'bonifacio global city': baseFare,
    'taguig': baseFare + 50,
    'pasig': baseFare + 50,
    'mandaluyong': baseFare + 50,
    'quezon city': baseFare + 100,
    'manila': baseFare + 100,
    'alabang': baseFare + 150,
    'parañaque': baseFare + 100,
    'las piñas': baseFare + 150,
    'muntinlupa': baseFare + 150,
    'cavite': baseFare + 200,
    'laguna': baseFare + 250,
    'batangas': baseFare + 300,
    'rizal': baseFare + 200,
    'bulacan': baseFare + 250
  };

  for (const [area, rate] of Object.entries(locationRates)) {
    if (locationLower.includes(area)) {
      locationFare = rate;
      break;
    }
  }

  return locationFare;
}

function calculateTaxiFare(location, therapistCount = 1) {
  const perTherapistFare = calculateTaxiFarePerTherapist(location);
  const count = Number(therapistCount || 0);
  if (count <= 0) return 0;
  return perTherapistFare * count;
}

// Increment therapist booking count when viewed
function incrementTherapistBooking(therapistId) {
  try {
    const bookings = JSON.parse(localStorage.getItem("eliteTherapistBookings") || "{}");
    bookings[therapistId] = (bookings[therapistId] || 0) + 1;
    localStorage.setItem("eliteTherapistBookings", JSON.stringify(bookings));
    console.log(`Therapist ${therapistId} booking count: ${bookings[therapistId]}`);
  } catch (e) {
    console.error("Error incrementing therapist booking:", e);
  }
}

function getBookingEstimate() {
  const settings = getSiteSettings();
  const femaleCount = Number(document.getElementById("femaleTherapistCount")?.value || 0);
  const maleCount = Number(document.getElementById("maleTherapistCount")?.value || 0);
  const totalTherapists = femaleCount + maleCount;
  const femaleIds = String(document.getElementById("preferredFemaleTherapist")?.value || "").split(",").map((id) => id.trim()).filter(Boolean);
  const maleIds = String(document.getElementById("preferredMaleTherapist")?.value || "").split(",").map((id) => id.trim()).filter(Boolean);
  const femaleTherapists = getTherapistsByIds(femaleIds);
  const maleTherapists = getTherapistsByIds(maleIds);
  const serviceSelect = document.getElementById("preferredService");
  const selectedService = serviceSelect?.selectedOptions?.[0];
  const serviceBasePhp = Number(selectedService?.dataset?.price || 0);
  const locationValue = document.getElementById("location")?.value || "";
  const taxiFareInput = Number(document.getElementById("taxiFare")?.value || 0);
  const perTherapistFare = calculateTaxiFarePerTherapist(locationValue);
  const taxiFarePhp = taxiFareInput || perTherapistFare * totalTherapists;
  const femaleServicePhp = femaleTherapists.reduce((sum, therapist) => sum + getTherapistPrice(therapist, 1), 0);
  const maleServicePhp = maleTherapists.reduce((sum, therapist) => sum + getTherapistPrice(therapist, 1), 0);
  const servicePhp = serviceBasePhp + femaleServicePhp + maleServicePhp;
  const totalPhp = servicePhp + taxiFarePhp;
  const serviceUsd = servicePhp / PHP_PER_USD;
  const taxiUsd = taxiFarePhp / PHP_PER_USD;
  const totalUsd = totalPhp / PHP_PER_USD;

  return {
    servicePhp,
    taxiFarePhp,
    totalPhp,
    serviceUsd,
    taxiUsd,
    totalUsd,
    estimatedServiceCost: `${usd(serviceUsd)} (${peso(servicePhp)})`,
    totalEstimate: `${usd(totalUsd)} / ${peso(totalPhp)}`
  };
}

function updateBookingEstimate() {
  const estimate = getBookingEstimate();
  const serviceCost = document.getElementById("estimatedServiceCost");
  const totalEstimate = document.getElementById("totalEstimate");
  if (serviceCost) serviceCost.value = estimate.estimatedServiceCost;
  if (totalEstimate) totalEstimate.value = estimate.totalEstimate;
}

function getSelectedTherapistName(id) {
  const therapist = getTherapistById(id);
  return therapist ? therapist.name : "";
}

function setupBookingForm() {
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("status");
  if (!form || !status) return;

  populateBookingSelect();
  const settings = getSiteSettings();
  const taxiFare = document.getElementById("taxiFare");
  const taxiFarePerTherapist = document.getElementById("taxiFarePerTherapist");
  const locationInput = document.getElementById("location");
  const preferredDateInput = document.getElementById("preferredDate");
  const preferredTimeInput = document.getElementById("preferredTime");
  const femaleCount = document.getElementById("femaleTherapistCount");
  const maleCount = document.getElementById("maleTherapistCount");

  if (preferredDateInput) {
    preferredDateInput.min = new Date().toISOString().slice(0, 10);
    preferredDateInput.setAttribute("autocomplete", "off");
  }
  if (preferredTimeInput) {
    preferredTimeInput.step = 1800;
    preferredTimeInput.setAttribute("autocomplete", "off");
  }

  const updateTaxiFare = () => {
    if (!taxiFare) return;
    const totalTherapists = Number(femaleCount?.value || 0) + Number(maleCount?.value || 0);
    const locationValue = locationInput?.value || "";
    const perTherapistFare = calculateTaxiFarePerTherapist(locationValue);
    const calculatedFare = calculateTaxiFare(locationValue, totalTherapists);
    if (taxiFarePerTherapist) taxiFarePerTherapist.value = perTherapistFare;
    taxiFare.value = calculatedFare;
  };

  // Set initial taxi fare based on saved admin value and therapist count
  updateTaxiFare();

  if (locationInput) {
    locationInput.addEventListener("input", updateTaxiFare);
    locationInput.addEventListener("change", updateTaxiFare);
  }

  // Add count-based selection logic
  function handleCountChange(countInput, gender) {
    const count = Number(countInput.value) || 0;
    const selectedIds = gender === "female" ? selectedFemaleTherapistIds : selectedMaleTherapistIds;
    if (count <= 0) {
      selectedIds.length = 0;
    } else if (selectedIds.length > count) {
      selectedIds.splice(count);
    }
    renderTherapistSelection(gender);
    updateTaxiFare();
    updateBookingEstimate();
  }

  // Set up event listeners for count-based selection
  femaleCount?.addEventListener("input", () => handleCountChange(femaleCount, "female"));
  maleCount?.addEventListener("input", () => handleCountChange(maleCount, "male"));

  // Initial setup of selection states
  handleCountChange(femaleCount, "female");
  handleCountChange(maleCount, "male");

  ["preferredService", "femaleTherapistCount", "maleTherapistCount", "preferredFemaleTherapist", "preferredMaleTherapist", "taxiFare", "location"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateBookingEstimate);
    document.getElementById(id)?.addEventListener("change", updateBookingEstimate);
  });
  updateBookingEstimate();
  updateTaxiFare(); // Initialize taxi fare field

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateBookingEstimate();

    const data = new FormData(form);
    const googleSheetsWebAppUrl = getGoogleSheetsWebAppUrl();
    const useLocalFallback = !googleSheetsWebAppUrl;
    if (useLocalFallback) {
      console.warn("Google Sheets URL is not configured; booking will be saved locally.");
      status.textContent = "Google Sheets not configured; booking will be saved locally.";
    }

    const estimate = getBookingEstimate();

    // Handle multiple therapist selections
    const getTherapistSelections = (name) => {
      const selections = data.getAll(name);
      return selections.length > 0 ? selections.join(",") : "";
    };

    const selectedFemaleTherapistValue = getTherapistSelections("preferredFemaleTherapist");
    const selectedMaleTherapistValue = getTherapistSelections("preferredMaleTherapist");
    const preferredFemaleTherapistNames = selectedFemaleTherapistValue
      .split(",")
      .map((id) => getTherapistById(id)?.name)
      .filter(Boolean)
      .join(", ");
    const preferredMaleTherapistNames = selectedMaleTherapistValue
      .split(",")
      .map((id) => getTherapistById(id)?.name)
      .filter(Boolean)
      .join(", ");

    const payload = {
      bookingId: 'BK' + Date.now(),
      timestamp: new Date().toISOString(),
      fullname: data.get("fullname"),
      mobileNumber: data.get("mobileNumber"),
      preferredService: data.get("preferredService"),
      femaleTherapistCount: data.get("femaleTherapistCount"),
      maleTherapistCount: data.get("maleTherapistCount"),
      preferredDate: data.get("preferredDate"),
      preferredTime: data.get("preferredTime"),
      preferredFemaleTherapist: selectedFemaleTherapistValue,
      preferredMaleTherapist: selectedMaleTherapistValue,
      preferredFemaleTherapistName: preferredFemaleTherapistNames,
      preferredMaleTherapistName: preferredMaleTherapistNames,
      location: data.get("location"),
      landmark: data.get("landmark"),
      specialRequests: data.get("notes"),
      estimatedServiceCost: estimate.estimatedServiceCost,
      taxiFare: `${usd(estimate.taxiUsd)} (${peso(estimate.taxiFarePhp)})`,
      totalEstimate: estimate.totalEstimate,
      termsAccepted: data.get("termsAccepted") === "on" ? "Yes" : "No"
    };

    status.textContent = "Sending booking request...";
    try {
      // Validate therapist availability before saving
      const validation = await validateTherapistAvailability(payload);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const saveResult = await saveBookingEverywhere(payload);
      if (!saveResult.supabase.ok && !saveResult.googleSheets.ok) {
        console.warn("Shared databases unavailable, saving booking locally.", saveResult);
        const bookings = JSON.parse(localStorage.getItem("testBookings") || "[]");
        bookings.push(payload);
        localStorage.setItem("testBookings", JSON.stringify(bookings));
        status.textContent = "Saved locally (shared database unavailable)";
        form.reset();
        selectedFemaleTherapistIds = [];
        selectedMaleTherapistIds = [];
        renderTherapistSelection("female");
        renderTherapistSelection("male");
        const taxiFare = document.getElementById("taxiFare");
        if (taxiFare) taxiFare.value = getSiteSettings().taxiFare || 0;
        updateBookingEstimate();
        return;
      }

      updateSelectedTherapistBookingCounts(payload);

      status.textContent = "Saved";
      form.reset();
      selectedFemaleTherapistIds = [];
      selectedMaleTherapistIds = [];
      renderTherapistSelection("female");
      renderTherapistSelection("male");
      const taxiFare = document.getElementById("taxiFare");
      if (taxiFare) taxiFare.value = getSiteSettings().taxiFare || 0;
      updateBookingEstimate();
      
      // Also save therapist booking counts
      try {
        await saveTherapistBookingCountsToGoogleSheets();
      } catch (bookingError) {
        console.warn("Could not save therapist booking counts:", bookingError);
      }
    } catch (error) {
      console.error("Booking submission error:", error);
      status.textContent = `⚠️ Booking error: ${error.message || "Please try again or contact support."}`;
    }
  });
}

// Enhanced function to save booking to Google Sheets with auto-adjusting headers
async function saveBookingToGoogleSheets(bookingData) {
  const url = getGoogleSheetsWebAppUrl();
  console.log('Attempting to save to Google Sheets URL:', url);

  if (!url) {
    throw new Error('Google Sheets URL is not configured');
  }

  try {
    // Ensure all required fields are present with proper formatting
    const enhancedBookingData = {
      // Timestamp
      timestamp: bookingData.timestamp || new Date().toISOString(),
      
      // Customer Information
      fullname: bookingData.fullname || '',
      mobileNumber: bookingData.mobileNumber || '',
      
      // Booking Details
      preferredService: bookingData.preferredService || '',
      preferredDate: bookingData.preferredDate || '',
      preferredTime: bookingData.preferredTime || '',
      
      // Therapist Selection with validation
      preferredFemaleTherapist: bookingData.preferredFemaleTherapist || '',
      femaleTherapistCount: bookingData.femaleTherapistCount || '0',
      preferredFemaleTherapistName: bookingData.preferredFemaleTherapistName || '',
      femaleTherapistAvailable: bookingData.femaleTherapistAvailable,
      
      preferredMaleTherapist: bookingData.preferredMaleTherapist || '',
      maleTherapistCount: bookingData.maleTherapistCount || '0',
      preferredMaleTherapistName: bookingData.preferredMaleTherapistName || '',
      maleTherapistAvailable: bookingData.maleTherapistAvailable,
      
      // Location Details
      location: bookingData.location || '',
      landmark: bookingData.landmark || '',
      
      // Pricing Information
      estimatedServiceCost: bookingData.estimatedServiceCost || '',
      taxiFare: bookingData.taxiFare || '',
      totalEstimate: bookingData.totalEstimate || '',
      
      // Additional Information
      specialRequests: bookingData.specialRequests || '',
      bookingStatus: 'Pending',
      source: 'Website Booking',
      
      // Auto-generated fields
      bookingId: bookingData.bookingId || 'BK' + Date.now(),
      dateSubmitted: new Date().toLocaleString('en-PH', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveBooking',
        data: enhancedBookingData,
        autoAdjustHeaders: true // Enable auto-adjusting headers
      })
    });

    const result = { success: true, opaque: true, message: "Booking request sent to Google Sheets" };
    console.log('Booking saved to Google Sheets:', result);
    return result;
  } catch (error) {
    console.error('Error saving booking to Google Sheets:', error);
    throw error;
  }
}

async function saveBookingEverywhere(payload) {
  const result = {
    supabase: { ok: false, skipped: typeof saveBookingToSupabase !== "function", error: null },
    googleSheets: { ok: false, skipped: !getGoogleSheetsWebAppUrl(), error: null }
  };

  const jobs = [];

  if (typeof saveBookingToSupabase === "function") {
    jobs.push(saveBookingToSupabase(payload).then((response) => {
      if (response?.error) throw new Error(response.error);
      result.supabase.ok = true;
    }).catch((error) => {
      result.supabase.error = error.message || String(error);
    }));
  }

  if (getGoogleSheetsWebAppUrl()) {
    jobs.push(saveBookingToGoogleSheets(payload).then(() => {
      result.googleSheets.ok = true;
    }).catch((error) => {
      result.googleSheets.error = error.message || String(error);
    }));
  }

  await Promise.all(jobs);
  return result;
}

function getSelectedTherapistIdsFromBooking(payload) {
  return [
    ...String(payload.preferredFemaleTherapist || "").split(","),
    ...String(payload.preferredMaleTherapist || "").split(",")
  ].map((id) => id.trim()).filter(Boolean);
}

function updateSelectedTherapistBookingCounts(payload) {
  const therapistIds = getSelectedTherapistIdsFromBooking(payload);
  if (!therapistIds.length) return;

  try {
    const bookings = JSON.parse(localStorage.getItem("eliteTherapistBookings") || "{}");
    therapistIds.forEach((therapistId) => {
      bookings[therapistId] = Number(bookings[therapistId] || 0) + 1;
      const therapist = getTherapistById(therapistId);
      if (therapist) therapist.bookingCount = Math.max(Number(therapist.bookingCount || 0), bookings[therapistId]);
    });
    localStorage.setItem("eliteTherapistBookings", JSON.stringify(bookings));
  } catch (e) {
    console.warn("Could not update local therapist ranking counts:", e);
  }

  if (typeof incrementTherapistBookingCountsInSupabase === "function") {
    incrementTherapistBookingCountsInSupabase(therapistIds).then((result) => {
      if (result?.error) console.warn("Could not update Supabase therapist ranking counts:", result.error);
    });
  }
}

// Function to test Google Sheets connectivity
async function testGoogleSheetsConnection() {
  const url = getGoogleSheetsWebAppUrl();
  if (!url) {
    console.warn('Google Sheets URL not configured');
    return false;
  }

  try {
    console.log('Testing Google Sheets connection to:', url);
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors'
    });
    console.log('Google Sheets connection request sent');
    return true;
  } catch (error) {
    console.warn('Google Sheets connection test error:', error);
    return false;
  }
}

// Function to save therapist booking counts to Google Sheets
async function saveTherapistBookingCountsToGoogleSheets() {
  try {
    const therapists = getAllTherapists();
    const therapistCounts = therapists.map(therapist => ({
      therapistId: therapist.id,
      therapistName: therapist.name,
      gender: therapist.gender,
      bookingCount: therapist.bookingCount || 0,
      lastUpdated: new Date().toISOString()
    }));

    await fetch(getGoogleSheetsWebAppUrl(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveTherapistCounts',
        data: therapistCounts
      })
    });

    const result = { success: true, opaque: true };
    console.log('Therapist booking counts saved:', result);
    return result;
  } catch (error) {
    console.error('Error saving therapist booking counts:', error);
    throw error;
  }
}

// Function to validate therapist availability
async function validateTherapistAvailability(bookingData) {
  const validation = {
    isValid: true,
    error: '',
    femaleAvailable: true,
    maleAvailable: true,
    femaleTherapistName: '',
    maleTherapistName: ''
  };
  
  const femaleIds = String(bookingData.preferredFemaleTherapist || "").split(",").map((id) => id.trim()).filter(Boolean);
  if (Number(bookingData.femaleTherapistCount) > 0) {
    if (femaleIds.length !== Number(bookingData.femaleTherapistCount)) {
      validation.isValid = false;
      validation.error = `Please select ${bookingData.femaleTherapistCount} female therapist${bookingData.femaleTherapistCount === "1" ? "" : "s"}.`;
      return validation;
    }

    if (femaleIds.some((id) => !getTherapistById(id))) {
      validation.isValid = false;
      validation.error = "One or more selected female therapists could not be found.";
      return validation;
    }

    validation.femaleTherapistName = femaleIds.map((id) => getTherapistById(id)?.name).filter(Boolean).join(", ");
    validation.femaleAvailable = femaleIds.every((id) => {
      const therapist = getTherapistById(id);
      return isTherapistAvailable(therapist, bookingData.preferredDate, bookingData.preferredTime);
    });

    if (!validation.femaleAvailable) {
      validation.isValid = false;
      validation.error = `One or more selected female therapists are unavailable for the requested schedule.`;
      return validation;
    }
  }

  const maleIds = String(bookingData.preferredMaleTherapist || "").split(",").map((id) => id.trim()).filter(Boolean);
  if (Number(bookingData.maleTherapistCount) > 0) {
    if (maleIds.length !== Number(bookingData.maleTherapistCount)) {
      validation.isValid = false;
      validation.error = `Please select ${bookingData.maleTherapistCount} male therapist${bookingData.maleTherapistCount === "1" ? "" : "s"}.`;
      return validation;
    }

    if (maleIds.some((id) => !getTherapistById(id))) {
      validation.isValid = false;
      validation.error = "One or more selected male therapists could not be found.";
      return validation;
    }

    validation.maleTherapistName = maleIds.map((id) => getTherapistById(id)?.name).filter(Boolean).join(", ");
    validation.maleAvailable = maleIds.every((id) => {
      const therapist = getTherapistById(id);
      return isTherapistAvailable(therapist, bookingData.preferredDate, bookingData.preferredTime);
    });

    if (!validation.maleAvailable) {
      validation.isValid = false;
      validation.error = `One or more selected male therapists are unavailable for the requested schedule.`;
      return validation;
    }
  }
  
  return validation;
}

// Function to check if therapist is available
function isTherapistAvailable(therapist, date, time) {
  if (!therapist || !therapist.availability) return true;
  
  const availability = therapist.availability.toLowerCase();
  const bookingDateTime = new Date(`${date} ${time}`);
  const bookingHour = bookingDateTime.getHours();
  const bookingDay = bookingDateTime.getDay();
  
  // Check for 24/7 availability
  if (availability.includes('24 hours') || availability.includes('daily')) {
    return true;
  }
  
  // Check for specific time ranges
  if (availability.includes('today')) {
    // Available today - check if booking time is reasonable
    return bookingHour >= 12 && bookingHour <= 23; // 12 PM to 11 PM
  }
  
  // Check for weekday availability
  if (availability.includes('weekdays') && bookingDay >= 1 && bookingDay <= 5) {
    return true;
  }
  
  // Parse specific time ranges like "2 PM - 11 PM"
  const timeRangeMatch = availability.match(/(\d+)\s*(am|pm)\s*-\s*(\d+)\s*(am|pm)/i);
  if (timeRangeMatch) {
    const startHour = convertTo24Hour(parseInt(timeRangeMatch[1]), timeRangeMatch[2]);
    const endHour = convertTo24Hour(parseInt(timeRangeMatch[3]), timeRangeMatch[4]);
    return bookingHour >= startHour && bookingHour <= endHour;
  }
  
  return true; // Default to available if no specific constraints found
}

// Helper function to convert 12-hour to 24-hour format
function convertTo24Hour(hour, period) {
  if (period.toLowerCase() === 'pm' && hour !== 12) {
    return hour + 12;
  }
  if (period.toLowerCase() === 'am' && hour === 12) {
    return 0;
  }
  return hour;
}

function getOfficialContact() {
  const contacts = getSiteSettings().contacts || {};
  const order = [
    ["whatsapp", contacts.whatsapp, "logo/whatsapp.png"],
    ["viber", contacts.viber, "logo/viber.png"],
    ["telegram", contacts.telegram, "logo/telegram.png"],
    ["wechat", contacts.wechat, "logo/wechat.png"],
    ["kakaotalk", contacts.kakaotalk, "logo/kakaotalk.png"]
  ];
  const found = order.find(([, value]) => value);
  return found ? { app: found[0], value: found[1], icon: found[2] } : { app: "", value: "", icon: "logo/whatsapp.png" };
}

function getOfficialNumber() {
  return getOfficialContact().value;
}

function renderOfficialNumber() {
  const official = getOfficialContact();
  const isAdminPage = window.location.pathname.toLowerCase().includes("/admin/");
  const iconPath = isAdminPage ? `../${official.icon}` : official.icon;
  document.querySelectorAll("[data-official-number]").forEach((target) => {
    target.textContent = official.value ? `Official number: ${official.value}` : "Official number: Add in Admin";
  });
  document.querySelectorAll("[data-official-icon]").forEach((target) => {
    target.src = iconPath;
    target.alt = official.app ? `${official.app} icon` : "Official contact icon";
  });
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function appContactLink(app, value) {
  const clean = normalizePhone(value);
  const text = encodeURIComponent(value);
  if (app === "whatsapp" && clean) return `https://wa.me/${clean.replace("+", "")}`;
  if (app === "viber" && clean) return `viber://chat?number=${encodeURIComponent(clean)}`;
  if (app === "telegram") {
    const handle = String(value || "").trim().replace(/^@/, "");
    return handle && !/^\+?\d+$/.test(handle) ? `https://t.me/${encodeURIComponent(handle)}` : `Telegram: ${value}`;
  }
  if (app === "wechat") return `WeChat: ${value}`;
  if (app === "kakaotalk") return `KakaoTalk: ${value}`;
  return value;
}

function clickTargetForQr(value) {
  return /^https?:\/\//.test(value) || /^[a-z]+:\/\//.test(value) ? value : "#";
}

function qrImageUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(value)}`;
}

function renderCompanyContacts(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const contacts = getSiteSettings().contacts || {};
  const labels = [
    ["viber", "Viber", contacts.viber, "logo/viber.png"],
    ["wechat", "WeChat", contacts.wechat, "logo/wechat.png"],
    ["kakaotalk", "KakaoTalk", contacts.kakaotalk, "logo/kakaotalk.png"],
    ["telegram", "Telegram", contacts.telegram, "logo/telegram.png"],
    ["whatsapp", "WhatsApp", contacts.whatsapp, "logo/whatsapp.png"]
  ];
  target.innerHTML = labels
    .filter(([, , value]) => value)
    .map(([app, label, value, icon]) => {
      const qrValue = appContactLink(app, value);
      const clickTarget = clickTargetForQr(qrValue);
      return `
        <div class="contact-item app-contact">
          <img class="app-icon" src="${icon}" alt="${label} icon">
          <div>
            <strong>${label}</strong><br>
            <span>${value}</span>
          </div>
          <a class="app-qr" href="${clickTarget}" target="_blank" rel="noopener" aria-label="${label} QR code">
            <img src="${qrImageUrl(qrValue)}" alt="${label} QR code">
          </a>
        </div>
      `;
    })
    .join("") || `<p class="notice">Company chat numbers can be added in the admin panel.</p>`;
}

function renderTherapistLocations(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = getAllTherapists().map((therapist) => `
    <div class="contact-item">
      <strong>${therapist.name}</strong><br>
      ${therapist.location}<br>
      ${therapist.mapUrl ? `<a class="map-link" href="${therapist.mapUrl}" target="_blank" rel="noopener">Open Map</a>` : ""}
    </div>
  `).join("");
}

function setupFormMessage(formId, message) {
  const form = document.getElementById(formId);
  const status = document.getElementById("status");
  if (!form || !status) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = message;
    form.reset();
  });
}

function isAdminLoggedIn() {
  return !!sessionStorage.getItem("adminLoggedIn");
}

function openAdminLogin(options = {}) {
  const { required = false, redirectToAdmin = false, onSuccess } = options;

  // Remove any existing modal
  const existing = document.getElementById("adminLoginModal");
  if (existing) existing.remove();

  // Create modal
  const modal = document.createElement("div");
  modal.id = "adminLoginModal";
  modal.className = "admin-login-modal";
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <h2>Admin Login</h2>
      <form id="adminLoginForm">
        <div class="form-group">
          <label for="adminEmail">Email</label>
          <input type="email" id="adminEmail" placeholder="admin@example.com" autocomplete="email" required>
        </div>
        <div class="form-group">
          <label for="adminPassword">Password</label>
          <input type="password" id="adminPassword" placeholder="Your password" autocomplete="current-password" required>
        </div>
        <div class="form-actions">
          <button type="submit">Login</button>
          ${required ? '' : '<button type="button" id="cancelLogin">Cancel</button>'}
        </div>
        <div id="loginStatus"></div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#adminLoginForm");
  const statusEl = modal.querySelector("#loginStatus");
  const cancelBtn = modal.querySelector("#cancelLogin");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = modal.querySelector("#adminEmail").value;
    const password = modal.querySelector("#adminPassword").value;

    statusEl.textContent = "Logging in...";

    try {
      // Always use fallback authentication since we removed Supabase CDN
      console.log("Using local authentication system");
      const fallbackResult = await fallbackAdminSignIn(email, password);
      
      if (fallbackResult.user) {
        statusEl.textContent = "Login successful! Redirecting...";
        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminEmail", fallbackResult.user.email);
        setTimeout(() => {
          modal.remove();
          document.body.classList.remove("admin-locked");
          if (redirectToAdmin) {
            const adminPageUrl = window.location.pathname.toLowerCase().includes("/admin/")
              ? "add-therapist.html"
              : "admin/add-therapist.html";
            window.location.href = adminPageUrl;
          } else {
            onSuccess?.();
          }
        }, 500);
      } else {
        statusEl.textContent = `Login failed: ${fallbackResult.error?.message || 'Invalid credentials'}`;
      }
    } catch (error) {
      console.error("Login error:", error);
      statusEl.textContent = `Login error: ${error.message}`;
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.remove();
      if (required) {
        // If required, redirect to home or something
        window.location.href = "index.html";
      }
    });
  }

  // Close on backdrop click if not required
  if (!required) {
    modal.querySelector(".modal-backdrop").addEventListener("click", () => modal.remove());
  }
}

function attachFooterAdminLink() {
  // Completely disable footer admin link - no admin buttons in footer
  return;
}

function requireAdminAccess(onSuccess) {
  if (isAdminLoggedIn()) {
    document.body.classList.remove("admin-locked");
    onSuccess?.();
    return;
  }
  const statusEl = document.getElementById("adminAccessStatus");
  if (statusEl) {
    statusEl.style.display = "block";
    statusEl.textContent = "Opening admin login...";
  }
  openAdminLogin({ required: true, onSuccess });
}


function createAdminLoginButton() {
  // Disable admin login button - use navigation button only
  return;
}

// Fallback authentication function when Supabase is not available
async function fallbackAdminSignIn(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  // Fallback credentials for local authentication
  const FALLBACK_CREDENTIALS = {
    "admin@example.com": "admin123@",
    "r.mallillin.psa@gmail.com": "admin123@"
  };

  if (FALLBACK_CREDENTIALS[normalizedEmail] === normalizedPassword) {
    return {
      user: {
        email: normalizedEmail,
        id: "fallback-admin",
        isFallbackAdmin: true
      },
      error: null
    };
  }

  return {
    user: null,
    error: { message: "Invalid email or password. Use admin@example.com with admin123@" }
  };
}

function addAdminLoginToNavigation() {
  // Add admin button to all pages for easier access
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;
  
  // Remove any existing admin buttons first
  const existingAdminButtons = navLinks.querySelectorAll(".admin-login-nav, a[href='#'][onclick*='openAdminLogin']");
  existingAdminButtons.forEach(button => button.remove());
  
  const adminLink = document.createElement("a");
  adminLink.href = "#";
  adminLink.className = "admin-login-nav";
  adminLink.textContent = "Admin";
  adminLink.addEventListener("click", (e) => {
    e.preventDefault();
    openAdminLogin({ redirectToAdmin: true });
  });
  
  navLinks.appendChild(adminLink);
}

// attachFooterAdminLink(); // Disabled - no footer admin buttons
// createAdminLoginButton(); // Disabled - no floating admin button

// Add admin navigation button only on contact page
if (window.location.pathname.toLowerCase().endsWith("contact.html")) {
  addAdminLoginToNavigation();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Initializing shared data system");
    
    // Load local settings if available
    const localSettings = localStorage.getItem("eliteSiteSettings");
    if (localSettings) {
      try {
        const settings = JSON.parse(localSettings);
        window.siteSettings = settings;
        console.log("Loaded local site settings");
      } catch (e) {
        console.warn("Failed to load local settings:", e);
      }
    }

    await loadSharedDatabaseData();
    refreshCurrentPageWidgets();

    console.log("Website fully initialized.");
  } catch (error) {
    console.error("Website initialization failed:", error);
    applyBusinessProfile();
    renderOfficialNumber();
  }
});
