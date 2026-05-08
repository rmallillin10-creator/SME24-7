let therapistData = [];

function getAllTherapists() {
  // Get hardcoded therapists
  const hardcodedTherapists = therapistData;
  
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
