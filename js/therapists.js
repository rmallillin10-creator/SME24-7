let therapistData = [
  {
    id: "sample-female-1",
    name: "Maria Santos",
    gender: "female",
    rate: 2400,
    location: "Makati",
    bio: "Professional female massage therapist with 5 years of experience. Specializes in relaxation and therapeutic massage.",
    specialties: ["Swedish Massage", "Deep Tissue", "Aromatherapy"],
    availability: "24 hours",
    image: "images/therapists/default.svg",
    featured: true
  },
  {
    id: "sample-female-2",
    name: "Ana Reyes",
    gender: "female",
    rate: 2500,
    location: "BGC",
    bio: "Experienced sensual massage therapist. Provides high-quality service with attention to detail.",
    specialties: ["Sensual Massage", "Body Scrub", "Hot Stone"],
    availability: "Daily 2 PM - 11 PM",
    image: "images/therapists/default.svg",
    featured: true
  },
  {
    id: "sample-male-1",
    name: "Juan Carlos",
    gender: "male",
    rate: 2200,
    location: "Quezon City",
    bio: "Professional male massage therapist specializing in sports massage and rehabilitation.",
    specialties: ["Sports Massage", "Reflexology", "Shiatsu"],
    availability: "Weekdays 9 AM - 9 PM",
    image: "images/therapists/default.svg",
    featured: true
  },
  {
    id: "sample-male-2",
    name: "Miguel Torres",
    gender: "male",
    rate: 2300,
    location: "Pasay",
    bio: "Expert male therapist with focus on client comfort and satisfaction.",
    specialties: ["Full Body Massage", "Head Massage", "Foot Massage"],
    availability: "24/7",
    image: "images/therapists/default.svg",
    featured: false
  }
];

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
