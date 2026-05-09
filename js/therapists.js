let therapistData = [
  // No default therapists - only use therapists added through admin
];

function getAllTherapists() {
  // Get hardcoded therapists
  const hardcodedTherapists = therapistData;
  const supabaseTherapists = Array.isArray(window.supabaseTherapists) ? window.supabaseTherapists : [];
  
  // Get therapist drafts from localStorage
  let draftTherapists = [];
  try {
    const drafts = JSON.parse(localStorage.getItem("eliteTherapistDrafts") || "[]");
    draftTherapists = drafts;
  } catch (e) {
    console.warn("Could not load therapist drafts from localStorage:", e);
  }
  
  // Combine both, with drafts taking precedence for matching IDs
  const allTherapists = [...hardcodedTherapists];

  supabaseTherapists.forEach(therapist => {
    const existingIndex = allTherapists.findIndex(t => t.id === therapist.id);
    if (existingIndex >= 0) {
      allTherapists[existingIndex] = { ...allTherapists[existingIndex], ...therapist };
    } else {
      allTherapists.push(therapist);
    }
  });
  
  // Add or update therapists from drafts
  draftTherapists.forEach(draft => {
    const existingIndex = allTherapists.findIndex(t => t.id === draft.id);
    if (existingIndex >= 0) {
      // Update existing therapist
      allTherapists[existingIndex] = { ...allTherapists[existingIndex], ...draft };
    } else {
      // Add new therapist
      allTherapists.push(draft);
    }
  });
  
  return allTherapists;
}
