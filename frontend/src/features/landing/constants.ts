// Static content for the MediNex+ landing page. Copy mirrors the design.

export const NAV_LINKS = [
  { label: "Solutions", href: "#solutions" },
  { label: "AI Rx", href: "#ai-rx" },
  { label: "Features", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const

export const TRUSTED_LOGOS = [
  "Apollo Hospitals",
  "Fortis Healthcare",
  "AIIMS",
  "Max Healthcare",
  "Manipal Group",
  "Narayana Health",
] as const

export type Solution = {
  variant: "purple" | "white"
  pill: string
  title: string
  features: string[]
}

export const SOLUTIONS: Solution[] = [
  {
    variant: "purple",
    pill: "For hospitals",
    title: "Hospital Management",
    features: [
      "Complete OPD & IPD workflows",
      "Ward & nursing management",
      "Administrative automation",
      "Staff & doctor scheduling",
      "Patient records & EMR",
    ],
  },
  {
    variant: "white",
    pill: "For pharmacies",
    title: "Pharmacy & Inventory",
    features: [
      "Counter sales & billing",
      "Smart stock alerts",
      "Purchase order management",
      "Pharmacy billing integration",
      "Expiry & batch tracking",
    ],
  },
  {
    variant: "white",
    pill: "For labs",
    title: "Lab & Diagnostics",
    features: [
      "Sample collection & tracking",
      "Test report generation",
      "Pathology dashboards",
      "Smart result delivery",
      "Lab billing & invoicing",
    ],
  },
  {
    variant: "purple",
    pill: "For finance teams",
    title: "Finance & Analytics",
    features: [
      "Real-time revenue analytics",
      "Billing queue management",
      "Financial reporting",
      "Expense & payroll tracking",
    ],
  },
]

export type AiBenefit = { title: string; desc: string }

export const AI_BENEFITS: AiBenefit[] = [
  {
    title: "Content-aware suggestions",
    desc: "AI reads diagnosis, history & vitals to suggest the right medicines and doses.",
  },
  {
    title: "Auto-fill prescription template",
    desc: "Complete prescriptions drafted in seconds, reducing the doctor's writing load to a glance.",
  },
  {
    title: "Zero handwriting errors",
    desc: "Structured, legible prescriptions remove misreads and pharmacy guesswork.",
  },
  {
    title: "Save 15+ minutes per patient",
    desc: "Doctors review and approve instead of writing, freeing time for real care.",
  },
]

export const AI_STATS = [
  { num: "80%", label: "Less writing time" },
  { num: "3x", label: "Faster consults" },
  { num: "99%", label: "Prescription accuracy" },
] as const

export type WhyCard = { title: string; desc: string }

export const WHY_CARDS: WhyCard[] = [
  {
    title: "24/7 online booking",
    desc: "Patients book appointments anytime, from any device, with instant confirmation.",
  },
  {
    title: "Automated reminders",
    desc: "SMS & email reminders cut no-shows and keep schedules running on time.",
  },
  {
    title: "Secure digital records",
    desc: "Encrypted patient records, access controlled and available when you need them.",
  },
  {
    title: "Seamless multi-device access",
    desc: "Run your hospital from a desktop, tablet, or phone without missing a beat.",
  },
  {
    title: "Simplified payments & billing",
    desc: "Integrated payment capture and billing keeps revenue moving without friction.",
  },
]

export type HowStep = { num: string; title: string; desc: string }

export const HOW_STEPS: HowStep[] = [
  {
    num: "01",
    title: "Register your hospital",
    desc: "Sign up and set up your hospital details, verify with OTP, and your workspace is ready.",
  },
  {
    num: "02",
    title: "Configure & invite team",
    desc: "Add departments, doctors, and staff, set roles, and reduce onboarding to minutes.",
  },
  {
    num: "03",
    title: "Go live & manage",
    desc: "Start accepting appointments, managing records, and tracking revenue from day one.",
  },
]

export type Testimonial = { text: string; name: string; role: string }

export const TESTIMONIALS: Testimonial[] = [
  {
    text: "MediNex+ transformed how we manage patient flow. The appointment system alone saved us hours every single day.",
    name: "Dr. Priya Sharma",
    role: "Cardiologist, Apollo",
  },
  {
    text: "The AI prescription drafting is a genuine breakthrough. I review instead of write, and my patients get clearer scripts.",
    name: "Dr. Rajesh Nair",
    role: "General Physician",
  },
  {
    text: "As a patient, booking and getting reminders is effortless. I never miss a follow-up appointment now.",
    name: "Sneha Iyer",
    role: "Patient",
  },
  {
    text: "Billing and inventory used to be a nightmare across our branches. Now everything reconciles in one place.",
    name: "Dr. Amina Patel",
    role: "Hospital Administrator",
  },
  {
    text: "Setup took an afternoon, not a quarter. Managing a multi-doctor practice has never felt this simple.",
    name: "Sanjay Mehta",
    role: "Clinic Owner",
  },
]

export type PriceTier = {
  name: string
  desc: string
  price: string
  badge?: string
  primary?: boolean
  features: { label: string; on: boolean }[]
}

export const PRICE_TIERS: PriceTier[] = [
  {
    name: "Starter",
    desc: "For single clinics getting started",
    price: "499",
    features: [
      { label: "Up to 5 doctors", on: true },
      { label: "OPD & appointments", on: true },
      { label: "Patient records & EMR", on: true },
      { label: "Basic billing & invoicing", on: true },
      { label: "Email support", on: true },
      { label: "AI prescriptions", on: false },
      { label: "Advanced analytics", on: false },
      { label: "Multi-branch support", on: false },
    ],
  },
  {
    name: "Pro",
    desc: "For growing hospitals and groups",
    price: "1,299",
    badge: "Most popular",
    primary: true,
    features: [
      { label: "Up to 50 doctors", on: true },
      { label: "OPD, IPD & ward management", on: true },
      { label: "AI prescriptions", on: true },
      { label: "Pharmacy & lab modules", on: true },
      { label: "Advanced analytics", on: true },
      { label: "Priority support", on: true },
      { label: "Multi-branch support", on: false },
      { label: "Dedicated account manager", on: false },
    ],
  },
  {
    name: "Enterprise",
    desc: "For multi-branch hospital networks",
    price: "2,999",
    features: [
      { label: "Unlimited doctors & staff", on: true },
      { label: "Multi-branch support", on: true },
      { label: "All Pro features", on: true },
      { label: "Custom integrations", on: true },
      { label: "Dedicated account manager", on: true },
      { label: "24/7 priority support", on: true },
      { label: "On-premise option", on: true },
      { label: "SLA & compliance support", on: true },
    ],
  },
]

export type Faq = { q: string; a: string }

export const FAQS: Faq[] = [
  {
    q: "What is MediNex+ and how is it different?",
    a: "MediNex+ is an all-in-one hospital management platform connecting doctors and patients. It unifies appointments, records, pharmacy, labs, billing, and AI-assisted prescriptions in a single secure system, so you run your whole hospital from one place.",
  },
  {
    q: "How do I onboard my hospital?",
    a: "Sign up, add your hospital details, then invite your departments, doctors, and staff. Most teams are live within a day, no technical team required.",
  },
  {
    q: "Is patient data secure and isolated per hospital?",
    a: "Yes. Data is encrypted in transit and at rest, access is role-controlled, and each hospital's data is isolated. We follow healthcare data protection best practices.",
  },
  {
    q: "Can I manage multiple hospitals under one account?",
    a: "Yes. The Enterprise plan supports multi-branch networks, letting you manage many hospitals and switch between them from a single account.",
  },
  {
    q: "Does MediNex+ support billing and pharmacy management?",
    a: "Absolutely. Integrated billing, invoicing, pharmacy counter sales, inventory, and lab modules are built in and reconcile together automatically.",
  },
  {
    q: "What support is included in all plans?",
    a: "Every plan includes onboarding help and email support. Pro adds priority support, and Enterprise includes a dedicated account manager with 24/7 support.",
  },
]

export const FOOTER_COLS = [
  {
    title: "Product",
    links: ["Solutions", "AI Prescriptions", "Pricing", "Integrations", "Security"],
  },
  {
    title: "Company",
    links: ["About us", "Careers", "Blog", "Contact", "Partners"],
  },
  {
    title: "Legal",
    links: ["Privacy policy", "Terms of service", "Data protection", "Compliance"],
  },
] as const
