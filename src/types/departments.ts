export const departments = [
  {
    id: 'general-consultation',
    name: 'General Consultation',
    description: 'General medical consultations and check-ups',
    icon: 'Stethoscope'
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    description: 'Medical care for infants, children, and adolescents',
    icon: 'Baby'
  },
  {
    id: 'dental',
    name: 'Dental',
    description: 'Dental care and oral health services',
    icon: 'Tooth'
  },
  {
    id: 'gynecology',
    name: 'Gynecology',
    description: 'Women\'s health and reproductive care',
    icon: 'UserRound'
  },
  {
    id: 'orthopedic',
    name: 'Orthopedic',
    description: 'Musculoskeletal system and bone health',
    icon: 'Bone'
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Heart and cardiovascular system care',
    icon: 'Heart'
  },
  {
    id: 'neurology',
    name: 'Neurology',
    description: 'Nervous system disorders and treatment',
    icon: 'Brain'
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    description: 'Eye care and vision services',
    icon: 'Eye'
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Skin, hair, and nail health',
    icon: 'Scan'
  },
  {
    id: 'ent',
    name: 'ENT',
    description: 'Ear, nose, and throat care',
    icon: 'Ear'
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    description: 'Mental health services and counseling',
    icon: 'Brain'
  },
  {
    id: 'urology',
    name: 'Urology',
    description: 'Urinary tract and reproductive system care',
    icon: 'Droplets'
  }
];

export const departmentNames: Record<string, string> = departments.reduce((acc, dept) => {
  acc[dept.id] = dept.name;
  return acc;
}, {} as Record<string, string>);