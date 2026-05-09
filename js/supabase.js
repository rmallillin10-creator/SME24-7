// Supabase REST integration. This avoids CDN tracking/ad-blocker issues on GitHub Pages.
const SUPABASE_URL = "https://edalozmblhdautywwouz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d5yVOo4GClzQqz1ulKka7A_GIEgDufS";

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {})
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${response.status}: ${message || response.statusText}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function initSupabase() {
  return { mode: "rest", url: SUPABASE_URL };
}

function settingsToSupabaseRow(settings) {
  return {
    business_name: settings.business?.name || "",
    business_address: settings.business?.address || "",
    business_maps_link: settings.business?.mapsLink || "",
    business_logo: settings.business?.logo || "",
    business_service_type: settings.business?.serviceType || "",
    business_service_area: settings.business?.serviceArea || "",
    taxi_fare: Number(settings.taxiFare ?? settings.taxiFares?.default ?? 0),
    taxi_fare_currency: settings.taxiFareCurrency ?? settings.taxiFares?.currency ?? "PHP",
    taxi_fare_notes: settings.taxiFareNotes ?? settings.taxiFares?.notes ?? "",
    google_sheets_web_app_url: settings.googleSheetsWebAppUrl || "",
    service_1_name: settings.services?.[0]?.name || "Whole Body Massage",
    service_1_price: Number(settings.services?.[0]?.price || 0),
    service_2_name: settings.services?.[1]?.name || "Sensual Massage",
    service_2_price: Number(settings.services?.[1]?.price || 0),
    viber: settings.contacts?.viber || "",
    wechat: settings.contacts?.wechat || "",
    kakaotalk: settings.contacts?.kakaotalk || "",
    telegram: settings.contacts?.telegram || "",
    whatsapp: settings.contacts?.whatsapp || "",
    updated_at: new Date().toISOString()
  };
}

function therapistFromSupabaseRow(row) {
  const images = [
    row.image,
    ...(row.images || []),
    ...(row.slides || [])
  ].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index);

  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    location: row.location || "",
    bio: row.bio || "",
    rate: Number(row.rate || 0),
    specialties: row.specialties || [],
    pricing: row.pricing || {},
    featured: !!row.featured,
    image: images[0] || "images/therapists/default.svg",
    slides: row.slides || [],
    images,
    mapUrl: row.map_url || "",
    availability: row.availability || "24 hours",
    bookingCount: Number(row.booking_count || 0)
  };
}

function therapistToSupabaseRow(therapist) {
  const images = [
    therapist.image,
    ...(therapist.images || []),
    ...(therapist.slides || [])
  ].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index);
  const slides = therapist.slides?.length ? therapist.slides : images.slice(1);
  const row = {
    id: String(therapist.id),
    name: therapist.name,
    gender: therapist.gender,
    location: therapist.location || "",
    bio: therapist.bio || "",
    rate: Number(therapist.rate || 0),
    specialties: therapist.specialties || [],
    pricing: therapist.pricing || {},
    featured: !!therapist.featured,
    image: images[0] || "images/therapists/default.svg",
    slides,
    images,
    map_url: therapist.mapUrl || therapist.map_url || "",
    availability: therapist.availability || "24 hours",
    updated_at: new Date().toISOString()
  };

  if (therapist.bookingCount !== undefined || therapist.booking_count !== undefined) {
    row.booking_count = Number(therapist.bookingCount || therapist.booking_count || 0);
  }

  return row;
}

async function fetchSiteSettingsFromSupabase() {
  try {
    const rows = await supabaseRequest("site_settings?select=*&order=updated_at.desc.nullslast&limit=1");
    return rows?.[0] || null;
  } catch (e) {
    console.warn("Could not fetch site settings from Supabase:", e);
    return null;
  }
}

async function saveSiteSettingsToSupabase(settings) {
  try {
    const row = settingsToSupabaseRow(settings);
    const existing = await supabaseRequest("site_settings?select=id&limit=1");
    if (existing?.[0]?.id) {
      const id = encodeURIComponent(existing[0].id);
      const data = await supabaseRequest(`site_settings?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(row)
      });
      return { data, error: null };
    }

    const data = await supabaseRequest("site_settings", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row)
    });
    return { data, error: null };
  } catch (e) {
    console.error("Error saving site settings:", e);
    return { data: null, error: e.message };
  }
}

async function fetchTherapistsFromSupabase() {
  try {
    const rows = await supabaseRequest("therapists?select=*&order=created_at.asc");
    return (rows || []).map(therapistFromSupabaseRow);
  } catch (e) {
    console.warn("Could not fetch therapists from Supabase:", e);
    return [];
  }
}

async function saveTherapistToSupabase(therapist) {
  try {
    const data = await supabaseRequest("therapists?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(therapistToSupabaseRow(therapist))
    });
    return { data, error: null };
  } catch (e) {
    console.error("Error saving therapist:", e);
    return { data: null, error: e.message };
  }
}

async function deleteTherapistFromSupabase(therapistId) {
  try {
    const id = encodeURIComponent(therapistId);
    const data = await supabaseRequest(`therapists?id=eq.${id}`, { method: "DELETE" });
    return { data, error: null };
  } catch (e) {
    console.error("Error deleting therapist:", e);
    return { data: null, error: e.message };
  }
}

function bookingToSupabaseRow(booking) {
  return {
    booking_id: booking.bookingId || `BK${Date.now()}`,
    timestamp: booking.timestamp || new Date().toISOString(),
    fullname: booking.fullname || "",
    mobile_number: booking.mobileNumber || "",
    preferred_service: booking.preferredService || "",
    preferred_date: booking.preferredDate || null,
    preferred_time: booking.preferredTime || null,
    preferred_female_therapist: booking.preferredFemaleTherapist || "",
    female_therapist_count: Number(booking.femaleTherapistCount || 0),
    preferred_female_therapist_name: booking.preferredFemaleTherapistName || "",
    preferred_male_therapist: booking.preferredMaleTherapist || "",
    male_therapist_count: Number(booking.maleTherapistCount || 0),
    preferred_male_therapist_name: booking.preferredMaleTherapistName || "",
    location: booking.location || "",
    landmark: booking.landmark || "",
    estimated_service_cost: booking.estimatedServiceCost || "",
    taxi_fare: booking.taxiFare || "",
    total_estimate: booking.totalEstimate || "",
    special_requests: booking.specialRequests || "",
    terms_accepted: booking.termsAccepted === "Yes",
    booking_status: booking.bookingStatus || "Pending",
    source: booking.source || "Website Booking"
  };
}

async function saveBookingToSupabase(booking) {
  try {
    const data = await supabaseRequest("bookings", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(bookingToSupabaseRow(booking))
    });
    return { data, error: null };
  } catch (e) {
    console.error("Error saving booking to Supabase:", e);
    return { data: null, error: e.message };
  }
}

async function incrementTherapistBookingCountsInSupabase(therapistIds) {
  try {
    const uniqueIds = [...new Set((therapistIds || []).map((id) => String(id).trim()).filter(Boolean))];
    const updates = uniqueIds.map(async (therapistId) => {
      const id = encodeURIComponent(therapistId);
      const rows = await supabaseRequest(`therapists?select=id,booking_count&id=eq.${id}&limit=1`);
      const nextCount = Number(rows?.[0]?.booking_count || 0) + 1;
      return supabaseRequest(`therapists?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          booking_count: nextCount,
          updated_at: new Date().toISOString()
        })
      });
    });

    const data = await Promise.all(updates);
    return { data, error: null };
  } catch (e) {
    console.error("Error updating therapist booking counts:", e);
    return { data: null, error: e.message };
  }
}

async function adminSignIn(email, password) {
  return fallbackAdminSignIn(email, password);
}
