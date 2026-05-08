const businessProfileForm = document.getElementById("businessProfileForm");
const businessProfileStatus = document.getElementById("businessProfileStatus");
const businessLogoInput = document.getElementById("businessLogo");
const businessLogoPreview = document.getElementById("businessLogoPreview");
const taxiFareForm = document.getElementById("taxiFareForm");
const taxiFareStatus = document.getElementById("taxiFareStatus");
const therapistDraftForm = document.getElementById("therapistDraftForm");
const therapistProfilePictureInput = document.getElementById("therapistProfilePicture");
const therapistSlidesInput = document.getElementById("therapistSlides");
const therapistImagePreview = document.getElementById("therapistImagePreview");
const therapistDraftStatus = document.getElementById("therapistDraftStatus");

function setupAdminTabs() {
  document.querySelectorAll("[data-tab-button]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab-button]").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll("[data-tab-panel]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.tabButton)?.classList.add("active");
    });
  });
}

function loadBusinessProfileForm() {
  const settings = getSiteSettings();
  const business = settings.business;
  businessProfileForm.businessName.value = business.name || "";
  businessProfileForm.businessAddress.value = business.address || "";
  businessProfileForm.businessMapsLink.value = business.mapsLink || "";
  businessProfileForm.serviceType.value = business.serviceType || "Professional whole body massage and sensual massage booking service.";
  businessProfileForm.serviceArea.value = business.serviceArea || "Metro Manila, including Makati, BGC, Pasay, Quezon City, Ortigas, and Manila.";
  businessProfileForm.viber.value = settings.contacts?.viber || "";
  businessProfileForm.wechat.value = settings.contacts?.wechat || "";
  businessProfileForm.kakaotalk.value = settings.contacts?.kakaotalk || "";
  businessProfileForm.telegram.value = settings.contacts?.telegram || "";
  businessProfileForm.whatsapp.value = settings.contacts?.whatsapp || "";
  businessLogoPreview.src = business.logo || "../logo/elite%20logo.png";
}

function loadTaxiFareForm() {
  const settings = getSiteSettings();
  const taxiFares = settings.taxiFares || {};
  
  if (taxiFareForm) {
    taxiFareForm.taxiFare.value = taxiFares.default || 0;
    taxiFareForm.taxiFareCurrency.value = taxiFares.currency || "PHP";
    taxiFareForm.taxiFareNotes.value = taxiFares.notes || "";
  }
}

function readLogoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readImageFiles(files, limit = 10) {
  return Promise.all(Array.from(files || []).slice(0, limit).map(readLogoFile));
}

function setupImagePreviews() {
  // Business logo preview
  businessLogoInput?.addEventListener("change", async () => {
    const logo = await readLogoFile(businessLogoInput.files?.[0]);
    if (logo) businessLogoPreview.src = logo;
  });

  // Therapist profile picture preview
  therapistProfilePictureInput?.addEventListener("change", async () => {
    const profilePic = await readLogoFile(therapistProfilePictureInput.files?.[0]);
    if (profilePic && document.getElementById("therapistProfilePicturePreview")) {
      document.getElementById("therapistProfilePicturePreview").src = profilePic;
    }
  });

  // Therapist slides preview
  therapistSlidesInput?.addEventListener("change", async () => {
    const slides = await readImageFiles(therapistSlidesInput.files, 10);
    renderTherapistImagePreview();
  });
}

function setupFormSubmissions() {
  // Business profile form submission
  businessProfileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(businessProfileForm);
    const currentSettings = getSiteSettings();
    const uploadedLogo = await readLogoFile(businessLogoInput.files?.[0]);
    const nextSettings = {
      ...currentSettings,
      business: {
        name: data.get("businessName").trim(),
        address: data.get("businessAddress").trim(),
        mapsLink: data.get("businessMapsLink").trim(),
        serviceType: data.get("serviceType").trim(),
        serviceArea: data.get("serviceArea").trim(),
        logo: uploadedLogo || currentSettings.business.logo || ""
      },
      // Remove fixed services pricing - pricing will be handled by individual therapists
      services: currentSettings.services || [], // Keep existing services but don't update with fixed prices
      contacts: {
        viber: data.get("viber").trim(),
        wechat: data.get("wechat").trim(),
        kakaotalk: data.get("kakaotalk").trim(),
        telegram: data.get("telegram").trim(),
        whatsapp: data.get("whatsapp").trim()
      }
    };

    localStorage.setItem("eliteSiteSettings", JSON.stringify(nextSettings));
    cachedSettings = nextSettings;
    
    // Try to save to Supabase if available, but don't fail if it's not
    if (typeof saveSiteSettingsToSupabase === 'function') {
      try {
        const supabaseResult = await saveSiteSettingsToSupabase(nextSettings);
        if (supabaseResult.error) {
          businessProfileStatus.textContent = "✅ Business profile saved locally (Supabase sync failed)";
        } else {
          businessProfileStatus.textContent = "✅ Business profile saved successfully!";
        }
      } catch (e) {
        businessProfileStatus.textContent = "✅ Business profile saved locally";
      }
    } else {
      businessProfileStatus.textContent = "✅ Business profile saved successfully!";
    }
    
    applyBusinessProfile();
  });

  // Taxi fare form submission
  taxiFareForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(taxiFareForm);
    const settings = getSiteSettings();
    
    const taxiFares = {
      default: Number(data.get("taxiFare")) || 0,
      currency: data.get("taxiFareCurrency") || "PHP",
      notes: data.get("taxiFareNotes").trim()
    };
    
    const nextSettings = { ...settings, taxiFares };
    localStorage.setItem("eliteSiteSettings", JSON.stringify(nextSettings));
    cachedSettings = nextSettings;
    
    // Try to save to Supabase if available, but don't fail if it's not
    if (typeof saveSiteSettingsToSupabase === 'function') {
      try {
        const supabaseResult = await saveSiteSettingsToSupabase(nextSettings);
        if (supabaseResult.error) {
          taxiFareStatus.textContent = "✅ Taxi fares saved locally (Supabase sync failed)";
        } else {
          taxiFareStatus.textContent = "✅ Taxi fares saved successfully!";
        }
      } catch (e) {
        taxiFareStatus.textContent = "✅ Taxi fares saved locally";
      }
    } else {
      taxiFareStatus.textContent = "✅ Taxi fares saved successfully!";
    }
  });
}

async function renderTherapistImagePreview() {
  const profile = await readLogoFile(therapistProfilePictureInput?.files?.[0]);
  const slides = await readImageFiles(therapistSlidesInput?.files, 10);
  const images = [
    profile ? { label: "Profile", src: profile } : null,
    ...slides.map((src, index) => ({ label: `Slide ${index + 1}`, src }))
  ].filter(Boolean);

  therapistImagePreview.innerHTML = images.map((image) => `
    <div class="image-preview-item">
      <img src="${image.src}" alt="${image.label}">
      <span>${image.label}</span>
    </div>
  `).join("") || `<p class="notice">No images selected yet.</p>`;
}

therapistProfilePictureInput?.addEventListener("change", renderTherapistImagePreview);
therapistSlidesInput?.addEventListener("change", () => {
  if (therapistSlidesInput.files.length > 10) {
    therapistDraftStatus.textContent = "Only the first 10 slide images will be saved.";
  }
  renderTherapistImagePreview();
});

therapistDraftForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(therapistDraftForm);
  const profilePicture = await readLogoFile(therapistProfilePictureInput.files?.[0]);
  const slides = await readImageFiles(therapistSlidesInput.files, 10);
  
  // Create therapist object matching public data structure
  const therapist = {
    id: Date.now().toString(),
    name: data.get("therapistName").trim(),
    gender: data.get("therapistGender"),
    location: data.get("therapistLocation").trim(),
    rate: Number(data.get("therapistRate")) || 0,
    specialties: data.get("therapistSpecialties").split(',').map(s => s.trim()).filter(s => s),
    bio: data.get("therapistBio").trim(),
    availability: data.get("therapistAvailability").trim(),
    mapUrl: data.get("therapistMapUrl").trim(),
    image: profilePicture || "images/therapists/default.svg",
    slides: slides,
    pricing: { 1: Number(data.get("therapistRate")) || 0 },
    featured: false,
    createdAt: new Date().toISOString()
  };
  
  // Save to localStorage drafts with quota handling
  try {
    const drafts = JSON.parse(localStorage.getItem("eliteTherapistDrafts") || "[]");
    localStorage.setItem("eliteTherapistDrafts", JSON.stringify([...drafts, therapist]));
  } catch (quotaError) {
    if (quotaError.name === 'QuotaExceededError') {
      // Clear old drafts and try again
      console.warn("Storage quota exceeded, clearing old drafts...");
      try {
        localStorage.removeItem("eliteTherapistDrafts");
        localStorage.setItem("eliteTherapistDrafts", JSON.stringify([therapist]));
        therapistDraftStatus.textContent = "✅ Therapist saved (cleared old drafts to make space)";
      } catch (clearError) {
        therapistDraftStatus.textContent = "⚠️ Storage full. Please clear browser data or use smaller images.";
        console.error("Storage completely full:", clearError);
        return;
      }
    } else {
      therapistDraftStatus.textContent = "⚠️ Error saving therapist: " + quotaError.message;
      console.error("Storage error:", quotaError);
      return;
    }
  }
  
  // Try to save to Supabase if available, but don't fail if it's not
  let supabaseResult = { error: "Supabase not available" };
  if (typeof saveTherapistToSupabase === 'function') {
    try {
      supabaseResult = await saveTherapistToSupabase(therapist);
    } catch (e) {
      console.warn("Supabase save failed:", e);
      supabaseResult = { error: e.message };
    }
  }
  
  if (supabaseResult.error) {
    therapistDraftStatus.textContent = "✅ Therapist saved locally (Supabase sync failed)";
  } else {
    therapistDraftStatus.textContent = "✅ Therapist saved successfully!";
    // Add to global therapist data for immediate display and public pages
    if (typeof therapistData !== 'undefined') {
      const existingIndex = therapistData.findIndex(t => t.id === therapist.id);
      if (existingIndex >= 0) {
        therapistData[existingIndex] = therapist;
      } else {
        therapistData.push(therapist);
      }
    }
  }
  
  therapistDraftForm.reset();
  renderTherapistImagePreview();
});

// Function to clear therapist drafts when storage is full
function clearTherapistDrafts() {
  try {
    localStorage.removeItem("eliteTherapistDrafts");
    therapistDraftStatus.textContent = "✅ Therapist drafts cleared. Storage space freed.";
    console.log("Therapist drafts cleared successfully");
  } catch (error) {
    console.error("Error clearing drafts:", error);
    therapistDraftStatus.textContent = "⚠️ Error clearing drafts: " + error.message;
  }
}

// Get therapist booking data
function getTherapistBookings() {
  try {
    return JSON.parse(localStorage.getItem("eliteTherapistBookings") || "{}");
  } catch (e) {
    console.warn("Could not load therapist bookings:", e);
    return {};
  }
}

// Save therapist booking data
function saveTherapistBooking(therapistId) {
  try {
    const bookings = getTherapistBookings();
    bookings[therapistId] = (bookings[therapistId] || 0) + 1;
    localStorage.setItem("eliteTherapistBookings", JSON.stringify(bookings));
  } catch (e) {
    console.error("Error saving therapist booking:", e);
  }
}

// Render therapist lists in admin panel
function renderTherapistLists() {
  const allTherapists = getAllTherapists();
  const bookings = getTherapistBookings();
  
  // Check if there are any bookings
  const hasAnyBookings = Object.keys(bookings).length > 0;
  
  let sortedTherapists;
  if (hasAnyBookings) {
    // Sort therapists by booking count (most booked first)
    sortedTherapists = allTherapists.map(therapist => ({
      ...therapist,
      bookingCount: bookings[therapist.id] || 0
    })).sort((a, b) => b.bookingCount - a.bookingCount);
  } else {
    // No bookings yet - random ranking until bookings are made
    sortedTherapists = allTherapists.map(therapist => ({
      ...therapist,
      bookingCount: bookings[therapist.id] || 0,
      randomRank: Math.random() // Add random rank for no bookings
    })).sort((a, b) => a.randomRank - b.randomRank);
  }
  
  const femaleTherapists = sortedTherapists.filter(t => t.gender === 'female');
  const maleTherapists = sortedTherapists.filter(t => t.gender === 'male');
  
  const femaleList = document.getElementById('femaleTherapistsList');
  const maleList = document.getElementById('maleTherapistsList');
  
  if (femaleList) {
    femaleList.innerHTML = femaleTherapists.map((therapist, index) => {
      const isMostBooked = hasAnyBookings && index === 0;
      const isRandomRank = !hasAnyBookings && therapist.randomRank !== undefined;
      
      return '<div class="therapist-item ' + (isMostBooked ? 'most-booked' : '') + ' ' + (isRandomRank ? 'random-ranked' : '') + '" data-id="' + therapist.id + '">' +
        '        <div class="therapist-avatar-container">' +
        '          <img class="therapist-avatar" src="' + (therapist.image || 'images/therapists/default.svg') + '" alt="' + therapist.name + '">' +
        '          ' + (isMostBooked ? '<div class="crown-icon">👑</div>' : '') +
        '          ' + (isRandomRank ? '<div class="random-icon">🎲</div>' : '') +
        '        </div>' +
        '        <div class="therapist-info">' +
        '          <div class="therapist-name" onclick="editTherapist(\'' + therapist.id + '\')">' + therapist.name + '</div>' +
        '          <div class="therapist-details">' +
        '            Rate: ' + (therapist.rate ? '₱' + therapist.rate : 'Contact for rates') + ' | ' +
        '            ' + (therapist.location || 'Metro Manila') + ' | ' +
        '            Bookings: ' + (bookings[therapist.id] || 0) +
        '          </div>' +
        '        </div>' +
        '        <div class="therapist-actions">' +
        '          <button class="edit-btn" onclick="editTherapist(\'' + therapist.id + '\')">Edit</button>' +
        '          <button class="delete-btn" onclick="deleteTherapist(\'' + therapist.id + '\')">Delete</button>' +
        '        </div>' +
        '      </div>';
    }).join('');
  }
  
  if (maleList) {
    maleList.innerHTML = maleTherapists.map((therapist, index) => {
      const isMostBooked = hasAnyBookings && index === 0;
      const isRandomRank = !hasAnyBookings && therapist.randomRank !== undefined;
      
      return `
      <div class="therapist-item ${isMostBooked ? 'most-booked' : ''} ${isRandomRank ? 'random-ranked' : ''}" data-id="${therapist.id}">
        <div class="therapist-avatar-container">
          <img class="therapist-avatar" src="${therapist.image || 'images/therapists/default.svg'}" alt="${therapist.name}">
          ${isMostBooked ? '<div class="crown-icon">👑</div>' : ''}
          ${isRandomRank ? '<div class="random-icon">🎲</div>' : ''}
        </div>
        <div class="therapist-info">
          <div class="therapist-name" onclick="editTherapist('${therapist.id}')">${therapist.name}</div>
          <div class="therapist-details">
            Rate: ${therapist.rate ? '₱' + therapist.rate : 'Contact for rates'} | 
            ${therapist.location || 'Metro Manila'} | 
            Bookings: ${bookings[therapist.id] || 0}
          </div>
        </div>
        <div class="therapist-actions">
          <button class="edit-btn" onclick="editTherapist('${therapist.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteTherapist('${therapist.id}')">Delete</button>
        </div>
      </div>
      `;
    }).join('');
  }
}

// Edit therapist popup
function editTherapist(therapistId) {
  const allTherapists = getAllTherapists();
  const therapist = allTherapists.find(t => t.id === therapistId);
  
  if (!therapist) {
    console.error('Therapist not found:', therapistId);
    return;
  }
  
  // Create edit modal
  const modal = document.createElement('div');
  modal.className = 'edit-modal';
  modal.innerHTML = `
    <div class="edit-modal-content">
      <h3>Edit Therapist</h3>
      <form id="editTherapistForm">
        <div class="form-grid">
          <div class="field full"><label>Name</label><input type="text" id="editName" value="${therapist.name || ''}" required></div>
          <div class="field full"><label>Location</label><input type="text" id="editLocation" value="${therapist.location || ''}"></div>
          <div class="field"><label>Rate</label><input type="number" id="editRate" value="${therapist.rate || ''}" min="0"></div>
          <div class="field full"><label>Bio</label><textarea id="editBio">${therapist.bio || ''}</textarea></div>
          <div class="field full"><label>Specialties</label><input type="text" id="editSpecialties" value="${(therapist.specialties || []).join(', ')}" placeholder="comma separated"></div>
          <div class="field full"><label>Availability</label><input type="text" id="editAvailability" value="${therapist.availability || ''}"></div>
        </div>
        <div class="actions">
          <button type="button" onclick="closeEditModal()">Cancel</button>
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  
  modal.onclick = (e) => {
    if (e.target === modal) closeEditModal();
  };
  
  document.body.appendChild(modal);
  modal.style.display = 'block';
  
  // Handle form submission
  document.getElementById('editTherapistForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const updatedTherapist = {
      ...therapist,
      name: document.getElementById('editName').value.trim(),
      location: document.getElementById('editLocation').value.trim(),
      rate: Number(document.getElementById('editRate').value) || 0,
      bio: document.getElementById('editBio').value.trim(),
      specialties: document.getElementById('editSpecialties').value.split(',').map(s => s.trim()).filter(s => s),
      availability: document.getElementById('editAvailability').value.trim()
    };
    
    // Update in localStorage
    const drafts = JSON.parse(localStorage.getItem("eliteTherapistDrafts") || "[]");
    const updatedDrafts = drafts.map(d => d.id === therapistId ? updatedTherapist : d);
    localStorage.setItem("eliteTherapistDrafts", JSON.stringify(updatedDrafts));
    
    // Update global therapistData
    if (typeof therapistData !== 'undefined') {
      const index = therapistData.findIndex(t => t.id === therapistId);
      if (index >= 0) {
        therapistData[index] = updatedTherapist;
      }
    }
    
    closeEditModal();
    renderTherapistLists();
    console.log('Therapist updated:', updatedTherapist);
  };
}

// Close edit modal
function closeEditModal() {
  const modal = document.querySelector('.edit-modal');
  if (modal) {
    modal.remove();
  }
}

// Delete therapist
function deleteTherapist(therapistId) {
  if (confirm('Are you sure you want to delete this therapist? This action cannot be undone.')) {
    // Remove from localStorage
    const drafts = JSON.parse(localStorage.getItem("eliteTherapistDrafts") || "[]");
    const filteredDrafts = drafts.filter(d => d.id !== therapistId);
    localStorage.setItem("eliteTherapistDrafts", JSON.stringify(filteredDrafts));
    
    // Remove from global therapistData
    if (typeof therapistData !== 'undefined') {
      const index = therapistData.findIndex(t => t.id === therapistId);
      if (index >= 0) {
        therapistData.splice(index, 1);
      }
    }
    
    renderTherapistLists();
    console.log('Therapist deleted:', therapistId);
  }
}

async function initializeAdminPage() {
  // Initialize admin tabs first
  setupAdminTabs();
  
  // Use local settings only since Supabase CDN is removed
  console.log("Admin panel initialized with local storage");
  
  loadBusinessProfileForm();
  loadTaxiFareForm();
  setupImagePreviews();
  setupFormSubmissions();
  renderTherapistImagePreview();
  
  // Initialize therapist management
  renderTherapistLists();
}

if (isAdminLoggedIn()) {
  document.body.classList.remove("admin-locked");
  initializeAdminPage();
} else {
  requireAdminAccess(() => {
    document.body.classList.remove("admin-locked");
    initializeAdminPage();
  });
}
