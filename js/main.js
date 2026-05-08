function peso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);
}

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyF7X3JnLzQ8W7kK9mX2p5r8t3y6u1i4o2w3e6r9t7y5u8i2o1w4e6r9t/exec";
const PHP_PER_USD = 57.5;
const DEFAULT_SITE_SETTINGS = {
  business: {
    name: "Sensual Massage Elite SME 24/7 Hotel and Condo Service Male and Female Therapist",
    address: "Metro Manila, Philippines",
    mapsLink: "https://www.google.com/maps/search/?api=1&query=Metro%20Manila%2C%20Philippines",
    logo: ""
  },
  taxiFare: 0,
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

function getSiteSettings() {
  // Return cached settings immediately
  if (cachedSettings) return cachedSettings;
  
  // Try localStorage first
  try {
    const saved = JSON.parse(localStorage.getItem("eliteSiteSettings") || "{}");
    cachedSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...saved,
      business: { ...DEFAULT_SITE_SETTINGS.business, ...(saved.business || {}) },
      contacts: { ...DEFAULT_SITE_SETTINGS.contacts, ...(saved.contacts || {}) }
    };
    return cachedSettings;
  } catch {
    cachedSettings = DEFAULT_SITE_SETTINGS;
    return DEFAULT_SITE_SETTINGS;
  }
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
        logo: supabaseSettings.business_logo || ""
      },
      taxiFare: supabaseSettings.taxi_fare || 0,
      taxiFareCurrency: supabaseSettings.taxi_fare_currency || "PHP",
      taxiFareNotes: supabaseSettings.taxi_fare_notes || "",
      services: [
        { name: "Whole Body Massage", price: supabaseSettings.service_1_price || 0 },
        { name: "Sensual Massage", price: supabaseSettings.service_2_price || 0 }
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
    return JSON.parse(localStorage.getItem("eliteTherapistBookings") || "{}");
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

  const featured = shuffleArray(getAllTherapists().filter((therapist) => therapist.featured));
  if (featured.length === 0) {
    target.innerHTML = `<p class="notice">No therapists available yet. Check back soon!</p>`;
    return;
  }
  
  target.innerHTML = featured.slice(0, count).map((therapist) => {
    const displayImage = therapist.image || (therapist.images && therapist.images.length > 0 ? therapist.images[0] : 'images/therapists/default.svg');
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
  const displayImage = therapist.image || (therapist.images && therapist.images.length > 0 ? therapist.images[0] : 'images/therapists/default.svg');
  const hasMultipleImages = therapist.images && therapist.images.length > 1;
  const rank = options.rank;
  const bookingCount = Number(options.bookingCount || 0);
  const rankBadge = typeof rank === 'number'
    ? '<div class="therapist-rank-badge ' + (rank === 1 ? 'top-rank' : '') + '">#' + rank + ' ' + (rank === 1 ? 'Most booked' : 'Booked') + '</div>'
    : '';
  const bookingInfo = typeof rank === 'number'
    ? '<p class="therapist-bookings">' + bookingCount + ' booking' + (bookingCount === 1 ? '' : 's') + '</p>'
    : '';

  return '<div class="therapist-card" onclick="incrementTherapistBooking(\'' + therapist.id + '\')">' +
    '    <div class="therapist-image">' +
      '      <img src="' + displayImage + '" alt="' + therapist.name + '">' +
      rankBadge +
      (hasMultipleImages ? '<div class="more-images-indicator">+' + (therapist.images.length - 1) + ' more</div>' : '') +
      '    </div>' +
      '    <div class="therapist-info">' +
      '      <h3>' + therapist.name + '</h3>' +
      '      <p class="therapist-location">' + (therapist.location || 'Metro Manila') + '</p>' +
      '      <p class="therapist-bio">' + (therapist.bio || 'Professional massage therapist') + '</p>' +
      '      <p class="therapist-rate">Rate: ' + (therapist.rate ? '₱' + therapist.rate : 'Contact for rates') + '</p>' +
      bookingInfo +
      '      <div class="therapist-specialties">' + ((therapist.specialties || []).join(', ')) + '</div>' +
      '    </div>' +
      '    <div class="therapist-actions">' +
      '      <button class="btn-primary" onclick="selectTherapist(\'' + therapist.id + '\')">Select & Book</button>' +
      (hasMultipleImages ? '<button class="btn-secondary" onclick="viewTherapistPhotos(\'' + therapist.id + '\')">View Photos</button>' : '') +
      '    </div>' +
      '  </div>';
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
  return [therapist.image, ...(therapist.slides || [])].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index);
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
function viewTherapistPhotos(therapistId) {
  const therapist = getTherapistById(therapistId);
  if (!therapist) return;
  openTherapistGallery(therapist);
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
  const femaleSelect = document.getElementById("preferredFemaleTherapist");
  const maleSelect = document.getElementById("preferredMaleTherapist");
  const serviceSelect = document.getElementById("preferredService");
  if (!femaleSelect || !maleSelect) return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("therapist");
  const therapists = getAllTherapists();
  const settings = getSiteSettings();
  const option = (therapist) => `<option value="${therapist.id}">${therapist.name} - ${peso(therapist.rate)}</option>`;

  if (serviceSelect) {
    serviceSelect.innerHTML = `<option value="">Choose service</option>` + settings.services
      .map((service) => `<option value="${service.name}" data-price="${Number(service.price || 0)}">${service.name}${Number(service.price || 0) ? ` - ${peso(Number(service.price))}` : ""}</option>`)
      .join("");
  }

  femaleSelect.innerHTML = `<option value="">Choose female therapist</option>` + therapists
    .filter((therapist) => therapist.gender === "female")
    .map(option)
    .join("");
  maleSelect.innerHTML = `<option value="">Choose male therapist</option>` + therapists
    .filter((therapist) => therapist.gender === "male")
    .map(option)
    .join("");

  const selectedTherapist = therapists.find((therapist) => therapist.id === requested);
  if (selectedTherapist?.gender === "female") {
    femaleSelect.value = requested;
    document.getElementById("femaleTherapistCount").value = "1";
  }
  if (selectedTherapist?.gender === "male") {
    maleSelect.value = requested;
    document.getElementById("maleTherapistCount").value = "1";
  }
}

function getTherapistById(id) {
  return getAllTherapists().find((therapist) => therapist.id === id);
}

// Function to calculate taxi fare based on location
function calculateTaxiFare(location) {
  if (!location) return 0;

  const locationLower = location.toLowerCase();
  const settings = getSiteSettings();

  // Default taxi fare from settings
  let baseFare = settings.taxiFare || 0;

  // Location-based adjustments
  const locationRates = {
    // Metro Manila areas
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

    // Outside Metro Manila
    'cavite': baseFare + 200,
    'laguna': baseFare + 250,
    'batangas': baseFare + 300,
    'rizal': baseFare + 200,
    'bulacan': baseFare + 250
  };

  // Check for location matches
  for (const [area, rate] of Object.entries(locationRates)) {
    if (locationLower.includes(area)) {
      return rate;
    }
  }

  // Return base fare if no specific location match
  return baseFare;
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
  const femaleTherapist = getTherapistById(document.getElementById("preferredFemaleTherapist")?.value);
  const maleTherapist = getTherapistById(document.getElementById("preferredMaleTherapist")?.value);
  const serviceSelect = document.getElementById("preferredService");
  const selectedService = serviceSelect?.selectedOptions?.[0];
  const serviceBasePhp = Number(selectedService?.dataset?.price || 0);
  const taxiFarePhp = Number(document.getElementById("taxiFare")?.value || settings.taxiFare || 0);
  const femaleServicePhp = getTherapistPrice(femaleTherapist, femaleCount);
  const maleServicePhp = getTherapistPrice(maleTherapist, maleCount);
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
  const locationInput = document.getElementById("location");

  // Auto-calculate taxi fare based on location
  const updateTaxiFare = () => {
    if (taxiFare && locationInput) {
      const calculatedFare = calculateTaxiFare(locationInput.value);
      if (calculatedFare > 0) {
        taxiFare.value = calculatedFare;
      } else if (Number(taxiFare.value) === 0) {
        taxiFare.value = settings.taxiFare || 0;
      }
    }
  };

  // Set initial taxi fare
  updateTaxiFare();

  // Add location change listener for auto taxi fare calculation
  if (locationInput) {
    locationInput.addEventListener("input", updateTaxiFare);
    locationInput.addEventListener("change", updateTaxiFare);
  }

  // Add count-based selection logic
  const femaleCount = document.getElementById("femaleTherapistCount");
  const maleCount = document.getElementById("maleTherapistCount");
  const femaleSelect = document.getElementById("preferredFemaleTherapist");
  const maleSelect = document.getElementById("preferredMaleTherapist");

  // Function to handle count changes and enable/disable therapist selection
  function handleCountChange(countInput, selectInput) {
    const count = Number(countInput.value) || 0;
    selectInput.disabled = count <= 0;
    if (count <= 0) {
      selectInput.value = "";
      selectInput.multiple = false;
      selectInput.size = 1;
    } else if (count === 1) {
      selectInput.multiple = false;
      selectInput.size = 1;
    } else {
      // For multiple therapists, enable multiple selection
      selectInput.multiple = true;
      selectInput.size = Math.min(count + 1, 5); // Show up to 5 options
    }
  }

  // Set up event listeners for count-based selection
  femaleCount?.addEventListener("input", () => handleCountChange(femaleCount, femaleSelect));
  maleCount?.addEventListener("input", () => handleCountChange(maleCount, maleSelect));

  // Initial setup of selection states
  handleCountChange(femaleCount, femaleSelect);
  handleCountChange(maleCount, maleSelect);

  ["preferredService", "femaleTherapistCount", "maleTherapistCount", "preferredFemaleTherapist", "preferredMaleTherapist", "taxiFare", "location"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateBookingEstimate);
    document.getElementById(id)?.addEventListener("change", updateBookingEstimate);
  });
  updateBookingEstimate();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updateBookingEstimate();

    if (!GOOGLE_SHEETS_WEB_APP_URL) {
      status.textContent = "Add your Google Apps Script web app URL in js/main.js first.";
      return;
    }

    const estimate = getBookingEstimate();
    const data = new FormData(form);

    // Handle multiple therapist selections
    const getTherapistSelections = (name) => {
      const selections = data.getAll(name);
      return selections.length > 0 ? selections.join(", ") : "";
    };

    const payload = {
      timestamp: new Date().toISOString(),
      fullname: data.get("fullname"),
      mobileNumber: data.get("mobileNumber"),
      preferredService: data.get("preferredService"),
      femaleTherapistCount: data.get("femaleTherapistCount"),
      maleTherapistCount: data.get("maleTherapistCount"),
      preferredDate: data.get("preferredDate"),
      preferredTime: data.get("preferredTime"),
      preferredFemaleTherapist: getTherapistSelections("preferredFemaleTherapist"),
      preferredMaleTherapist: getTherapistSelections("preferredMaleTherapist"),
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

      // Check if Google Sheets URL is configured (not a placeholder)
      if (GOOGLE_SHEETS_WEB_APP_URL.includes('AKfycbyF7X3JnLzQ8W7kK9mX2p5r8t3y6u1i4o2w3e6r9t7y5u8i2o1w4e6r9t')) {
        // For testing without Google Sheets, save to localStorage
        console.warn("Google Sheets URL is placeholder, saving to localStorage for testing");
        const bookings = JSON.parse(localStorage.getItem("testBookings") || "[]");
        bookings.push(payload);
        localStorage.setItem("testBookings", JSON.stringify(bookings));
        status.textContent = "✅ Booking saved locally (Google Sheets not configured)";
        form.reset();
        const taxiFare = document.getElementById("taxiFare");
        if (taxiFare) taxiFare.value = getSiteSettings().taxiFare || 0;
        updateBookingEstimate();
        return;
      }

      await saveBookingToGoogleSheets(payload);
      status.textContent = "✅ Booking request saved successfully!";
      form.reset();
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
      bookingId: 'BK' + Date.now(),
      dateSubmitted: new Date().toLocaleString('en-PH', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveBooking',
        data: enhancedBookingData,
        autoAdjustHeaders: true // Enable auto-adjusting headers
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Booking saved to Google Sheets:', result);
    return result;
  } catch (error) {
    console.error('Error saving booking to Google Sheets:', error);
    throw error;
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

    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveTherapistCounts',
        data: therapistCounts
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
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
  
  // Check female therapist availability
  if (bookingData.preferredFemaleTherapist && bookingData.femaleTherapistCount > 0) {
    const femaleTherapist = getTherapistById(bookingData.preferredFemaleTherapist);
    if (femaleTherapist) {
      validation.femaleTherapistName = femaleTherapist.name;
      validation.femaleAvailable = isTherapistAvailable(femaleTherapist, bookingData.preferredDate, bookingData.preferredTime);
      if (!validation.femaleAvailable) {
        validation.isValid = false;
        validation.error = `${femaleTherapist.name} is not available on ${bookingData.preferredDate} at ${bookingData.preferredTime}. Please choose a different time or therapist.`;
      }
    } else {
      validation.isValid = false;
      validation.error = 'Female therapist not found';
    }
  }
  
  // Check male therapist availability
  if (bookingData.preferredMaleTherapist && bookingData.maleTherapistCount > 0) {
    const maleTherapist = getTherapistById(bookingData.preferredMaleTherapist);
    if (maleTherapist) {
      validation.maleTherapistName = maleTherapist.name;
      validation.maleAvailable = isTherapistAvailable(maleTherapist, bookingData.preferredDate, bookingData.preferredTime);
      if (!validation.maleAvailable) {
        validation.isValid = false;
        validation.error = `${maleTherapist.name} is not available on ${bookingData.preferredDate} at ${bookingData.preferredTime}. Please choose a different time or therapist.`;
      }
    } else {
      validation.isValid = false;
      validation.error = 'Male therapist not found';
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

// Add admin navigation button to all pages
addAdminLoginToNavigation();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Use local data only since we removed Supabase dependency
    console.log("Using local data system (no external dependencies)");
    
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

    applyBusinessProfile();
    renderOfficialNumber();

    console.log("Website fully initialized (local mode).");
  } catch (error) {
    console.error("Website initialization failed:", error);
  }
});
