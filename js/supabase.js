// Supabase Configuration and Client Initialization
const SUPABASE_URL = "https://edalozmblhdautywwouz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d5yVOo4GClzQqz1ulKka7A_GIEgDufS";

// Initialize Supabase client (requires @supabase/supabase-js library)
let supabase = null;

async function initSupabase() {
  const waitForSupabase = async () => {
    for (let i = 0; i < 20; i += 1) {
      if (typeof window.supabase !== "undefined") {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.error("Supabase library not available after 2000ms");
    return false;
  };

  const loaded = await waitForSupabase();
  if (!loaded) {
    console.error("Supabase library not loaded. Check CDN.");
    return null;
  }
  
  if (!supabase) {
    try {
      const { createClient } = window.supabase;
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.error("Error initializing Supabase client:", err);
      return null;
    }
  }
  return supabase;
}

// Sign in admin with Supabase Auth
async function adminSignIn(email, password) {
  const client = await initSupabase();
  if (!client) return { success: false, error: "Supabase not initialized" };

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password)
    });

    if (error) throw error;

    return { success: true, error: null, user: data.user };
  } catch (err) {
    return { success: false, error: err.message, user: null };
  }
}

// Fetch site settings from Supabase
async function fetchSiteSettingsFromSupabase() {
  const client = await initSupabase();
  if (!client) return null;
  
  try {
    const { data, error } = await client
      .from("site_settings")
      .select("*")
      .limit(1)
      .single();
    
    if (error) {
      console.warn("Could not fetch site settings from Supabase:", error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.warn("Error fetching site settings:", e);
    return null;
  }
}

// Save site settings to Supabase
async function saveSiteSettingsToSupabase(settings) {
  const client = await initSupabase();
  if (!client) return { error: "Supabase not initialized" };
  
  try {
    const { data: existing } = await client
      .from("site_settings")
      .select("id")
      .limit(1)
      .single();
    
    let result;
    if (existing?.id) {
      result = await client
        .from("site_settings")
        .update({
          business_name: settings.business?.name,
          business_address: settings.business?.address,
          business_maps_link: settings.business?.mapsLink,
          business_logo: settings.business?.logo,
          taxi_fare: settings.taxiFare,
          taxi_fare_currency: settings.taxiFareCurrency,
          taxi_fare_notes: settings.taxiFareNotes,
          service_1_price: settings.services?.[0]?.price || 0,
          service_2_price: settings.services?.[1]?.price || 0,
          viber: settings.contacts?.viber,
          wechat: settings.contacts?.wechat,
          kakaotalk: settings.contacts?.kakaotalk,
          telegram: settings.contacts?.telegram,
          whatsapp: settings.contacts?.whatsapp,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      result = await client
        .from("site_settings")
        .insert([{
          business_name: settings.business?.name,
          business_address: settings.business?.address,
          business_maps_link: settings.business?.mapsLink,
          business_logo: settings.business?.logo,
          taxi_fare: settings.taxiFare,
          taxi_fare_currency: settings.taxiFareCurrency,
          taxi_fare_notes: settings.taxiFareNotes,
          service_1_price: settings.services?.[0]?.price || 0,
          service_2_price: settings.services?.[1]?.price || 0,
          viber: settings.contacts?.viber,
          wechat: settings.contacts?.wechat,
          kakaotalk: settings.contacts?.kakaotalk,
          telegram: settings.contacts?.telegram,
          whatsapp: settings.contacts?.whatsapp
        }]);
    }
    
    return result;
  } catch (e) {
    console.error("Error saving site settings:", e);
    return { error: e.message };
  }
}

// Fetch all therapists from Supabase
async function fetchTherapistsFromSupabase() {
  const client = await initSupabase();
  if (!client) return [];
  
  try {
    const { data, error } = await client
      .from("therapists")
      .select("*");
    
    if (error) {
      console.warn("Could not fetch therapists from Supabase:", error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.warn("Error fetching therapists:", e);
    return [];
  }
}

// Save therapist to Supabase
async function saveTherapistToSupabase(therapist) {
  const client = await initSupabase();
  if (!client) return { error: "Supabase not initialized" };
  
  try {
    const { data, error } = await client
      .from("therapists")
      .upsert({
        id: therapist.id,
        name: therapist.name,
        gender: therapist.gender,
        location: therapist.location,
        bio: therapist.bio,
        rate: therapist.rate,
        specialties: therapist.specialties || [],
        pricing: therapist.pricing || {},
        featured: therapist.featured || false,
        image: therapist.image,
        slides: therapist.slides || [],
        map_url: therapist.mapUrl,
        availability: therapist.availability,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    
    return { data, error };
  } catch (e) {
    console.error("Error saving therapist:", e);
    return { error: e.message };
  }
}
