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
  businessProfileForm.wholeBodyPrice.value = settings.services?.find((service) => service.name === "Whole Body Massage")?.price || 0;
  businessProfileForm.sensualPrice.value = settings.services?.find((service) => service.name === "Sensual Massage")?.price || 0;
  businessProfileForm.viber.value = settings.contacts?.viber || "";
  businessProfileForm.wechat.value = settings.contacts?.wechat || "";
  businessProfileForm.kakaotalk.value = settings.contacts?.kakaotalk || "";
  businessProfileForm.telegram.value = settings.contacts?.telegram || "";
  businessProfileForm.whatsapp.value = settings.contacts?.whatsapp || "";
  businessLogoPreview.src = business.logo || "../logo/elite%20logo.png";
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

businessLogoInput?.addEventListener("change", async () => {
  const logo = await readLogoFile(businessLogoInput.files?.[0]);
  if (logo) businessLogoPreview.src = logo;
});

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
      logo: uploadedLogo || currentSettings.business.logo || ""
    },
    services: [
      { name: "Whole Body Massage", price: Number(data.get("wholeBodyPrice")) || 0 },
      { name: "Sensual Massage", price: Number(data.get("sensualPrice")) || 0 }
    ],
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
  
  // Also save to Supabase
  const supabaseResult = await saveSiteSettingsToSupabase(nextSettings);
  if (supabaseResult.error) {
    businessProfileStatus.textContent = "Business profile saved locally (Supabase sync failed).";
  } else {
    businessProfileStatus.textContent = "Business profile saved.";
  }
  
  applyBusinessProfile();
  renderOfficialNumber();
});

function loadTaxiFareForm() {
  const settings = getSiteSettings();
  taxiFareForm.taxiFare.value = settings.taxiFare || 0;
  taxiFareForm.taxiFareCurrency.value = settings.taxiFareCurrency || "PHP";
  taxiFareForm.taxiFareNotes.value = settings.taxiFareNotes || "";
}

taxiFareForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(taxiFareForm);
  const currentSettings = getSiteSettings();
  const nextSettings = {
    ...currentSettings,
    taxiFare: Number(data.get("taxiFare")) || 0,
    taxiFareCurrency: data.get("taxiFareCurrency") || "PHP",
    taxiFareNotes: data.get("taxiFareNotes").trim()
  };
  localStorage.setItem("eliteSiteSettings", JSON.stringify(nextSettings));
  taxiFareStatus.textContent = "Taxi fare saved.";
});

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
  
  // Save to localStorage drafts
  const drafts = JSON.parse(localStorage.getItem("eliteTherapistDrafts") || "[]");
  localStorage.setItem("eliteTherapistDrafts", JSON.stringify([...drafts, therapist]));
  
  // Also save to Supabase therapists table (not drafts)
  const supabaseResult = await saveTherapistToSupabase(therapist);
  if (supabaseResult.error) {
    therapistDraftStatus.textContent = "Therapist saved locally (Supabase sync failed).";
  } else {
    therapistDraftStatus.textContent = "Therapist saved successfully!";
    // Add to global therapist data for immediate display
    if (typeof therapistData !== 'undefined') {
      therapistData.push(therapist);
    }
  }
  
  therapistDraftForm.reset();
  renderTherapistImagePreview();
});

async function initializeAdminPage() {
  // Initialize admin tabs first
  setupAdminTabs();
  
  // Try to load from Supabase if available, otherwise use local
  if (typeof loadSiteSettingsFromSupabase === 'function') {
    try {
      await loadSiteSettingsFromSupabase();
    } catch (e) {
      console.warn("Supabase not available, using local settings");
    }
  }
  
  loadBusinessProfileForm();
  loadTaxiFareForm();
  setupImagePreviews();
  setupFormSubmissions();
  renderTherapistImagePreview();
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
