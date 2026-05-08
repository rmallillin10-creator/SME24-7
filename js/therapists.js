let therapistData = [
  {
    id: "aria",
    name: "Aria Santos",
    gender: "female",
    location: "BGC, Taguig",
    specialties: ["Swedish", "Aromatherapy", "Deep Relaxation"],
    rate: 2500,
    pricing: { 1: 2500, 2: 4800, 3: 7000, 4: 9200, 5: 11500 },
    featured: true,
    image: "images/therapists/aria.svg",
    slides: ["images/therapists/aria.svg"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=BGC%2C%20Taguig",
    availability: "Today, 2 PM - 11 PM",
    bio: "Calm, polished spa service with a steady pressure style and hotel-call convenience."
  },
  {
    id: "mika",
    name: "Mika Reyes",
    gender: "female",
    location: "Makati",
    specialties: ["Shiatsu", "Hot Oil", "Stress Relief"],
    rate: 2200,
    pricing: { 1: 2200, 2: 4200, 3: 6200, 4: 8200, 5: 10200 },
    featured: true,
    image: "images/therapists/mika.svg",
    slides: ["images/therapists/mika.svg"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Makati%2C%20Metro%20Manila",
    availability: "Daily, 12 PM - 10 PM",
    bio: "Known for slow, precise technique and a quiet luxury session feel."
  },
  {
    id: "leo",
    name: "Leo Cruz",
    gender: "male",
    location: "Quezon City",
    specialties: ["Sports", "Deep Tissue", "Recovery"],
    rate: 2400,
    pricing: { 1: 2400, 2: 4600, 3: 6800, 4: 9000, 5: 11200 },
    featured: true,
    image: "images/therapists/leo.svg",
    slides: ["images/therapists/leo.svg"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Quezon%20City%2C%20Metro%20Manila",
    availability: "Today, 4 PM - 12 AM",
    bio: "Focused therapeutic massage for body tension, gym recovery, and long work weeks."
  },
  {
    id: "nico",
    name: "Nico Valdez",
    gender: "male",
    location: "Pasay",
    specialties: ["Swedish", "Reflexology", "Back Care"],
    rate: 2100,
    pricing: { 1: 2100, 2: 4000, 3: 5900, 4: 7800, 5: 9700 },
    featured: false,
    image: "images/therapists/nico.svg",
    slides: ["images/therapists/nico.svg"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pasay%2C%20Metro%20Manila",
    availability: "By appointment",
    bio: "Friendly, professional service with reliable home and hotel appointments."
  },
  {
    id: "janelle",
    name: "Janelle Lim",
    gender: "female",
    location: "Ortigas",
    specialties: ["Lymphatic", "Aromatherapy", "Wellness"],
    rate: 2600,
    pricing: { 1: 2600, 2: 5000, 3: 7400, 4: 9800, 5: 12200 },
    featured: false,
    image: "images/therapists/janelle.svg",
    slides: ["images/therapists/janelle.svg"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Ortigas%2C%20Metro%20Manila",
    availability: "24 hours",
    bio: "Gentle pressure specialist for clients who prefer a restorative spa rhythm."
  },
  {
    id: "marco",
    name: "Marco Tan",
    gender: "male",
    location: "Manila",
    specialties: ["Deep Tissue", "Stretching", "Sports"],
    rate: 2300,
    pricing: { 1: 2300, 2: 4400, 3: 6500, 4: 8600, 5: 10700 },
    featured: false,
    image: "images/therapists/marco.svg",
    slides: ["images/therapists/marco.svg"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Manila%2C%20Philippines",
    availability: "Daily, 3 PM - 1 AM",
    bio: "Strong, structured sessions for shoulder, lower back, and leg tension."
  }
];

function getAllTherapists() {
  return therapistData;
}
