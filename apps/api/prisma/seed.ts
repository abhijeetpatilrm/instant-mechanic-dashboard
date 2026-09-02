/**
 * Instant Mechanic — Deterministic Seed Script
 *
 * Generates realistic Indian automotive service data:
 *   - 8 service categories / 24 services
 *   - 52 customers
 *   - 52 vehicles (1 per customer, some have 2)
 *   - 22 mechanics
 *   - 520 bookings spread across -90 to +14 days from today
 *
 * Safe to re-run: clears existing data first (development only).
 * Run with: npx prisma db seed
 */

import { PrismaClient, BookingStatus, MechanicSpecialization } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// ─── Deterministic PRNG ───────────────────────────────────────────────────────
// Simple LCG so every run produces identical data
class SeededRng {
  private state: number;
  constructor(seed = 42) {
    this.state = seed;
  }
  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) | 0;
    return ((this.state >>> 0) / 0xffffffff);
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)] as T;
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j] as T, a[i] as T];
    }
    return a;
  }
}

const rng = new SeededRng(2024);

// ─── Reference data ───────────────────────────────────────────────────────────

const MALE_NAMES = [
  'Aarav', 'Arjun', 'Rohit', 'Karan', 'Rahul', 'Sanjay', 'Vikram', 'Rajesh',
  'Ankit', 'Deepak', 'Gaurav', 'Ishaan', 'Kunal', 'Manish', 'Nikhil', 'Pranav',
  'Ravi', 'Tarun', 'Varun', 'Yash', 'Aditya', 'Amit', 'Chetan', 'Harsh', 'Dev',
  'Girish', 'Jayesh', 'Kapil', 'Lalit', 'Manoj',
] as const;

const FEMALE_NAMES = [
  'Priya', 'Neha', 'Pooja', 'Anita', 'Sunita', 'Kavya', 'Nisha', 'Divya',
  'Geeta', 'Isha', 'Jyoti', 'Komal', 'Maya', 'Poonam', 'Rekha', 'Tara',
  'Varsha', 'Disha', 'Ekta', 'Heena', 'Kiran', 'Lakshmi', 'Pallavi', 'Shruti',
] as const;

const LAST_NAMES = [
  'Sharma', 'Patel', 'Gupta', 'Singh', 'Mehta', 'Joshi', 'Kumar', 'Verma',
  'Nair', 'Iyer', 'Rao', 'Reddy', 'Shah', 'Kapoor', 'Khanna', 'Malhotra',
  'Banerjee', 'Das', 'Ghosh', 'Mukherjee', 'Pillai', 'Menon', 'Agarwal',
  'Arora', 'Bhatia', 'Chopra', 'Desai', 'Mishra', 'Pandey', 'Tiwari',
] as const;

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', stateCode: 'MH' },
  { city: 'Delhi', state: 'Delhi', stateCode: 'DL' },
  { city: 'Bangalore', state: 'Karnataka', stateCode: 'KA' },
  { city: 'Hyderabad', state: 'Telangana', stateCode: 'TS' },
  { city: 'Chennai', state: 'Tamil Nadu', stateCode: 'TN' },
  { city: 'Pune', state: 'Maharashtra', stateCode: 'MH' },
  { city: 'Kolkata', state: 'West Bengal', stateCode: 'WB' },
  { city: 'Ahmedabad', state: 'Gujarat', stateCode: 'GJ' },
  { city: 'Jaipur', state: 'Rajasthan', stateCode: 'RJ' },
  { city: 'Surat', state: 'Gujarat', stateCode: 'GJ' },
] as const;

const VEHICLES = [
  { make: 'Maruti Suzuki', models: ['Swift', 'Baleno', 'Alto K10', 'WagonR', 'Vitara Brezza', 'Ertiga', 'Dzire', 'Celerio', 'Ignis'] },
  { make: 'Hyundai', models: ['i20', 'Creta', 'Verna', 'Venue', 'Grand i10 Nios', 'Alcazar', 'Aura', 'Tucson'] },
  { make: 'Tata', models: ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor', 'Punch', 'Tiago'] },
  { make: 'Honda', models: ['City', 'Amaze', 'Jazz', 'WR-V', 'Elevate'] },
  { make: 'Mahindra', models: ['Scorpio-N', 'XUV700', 'Thar', 'Bolero', 'XUV300', 'KUV100'] },
  { make: 'Toyota', models: ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser Hyryder', 'Camry'] },
  { make: 'Kia', models: ['Sonet', 'Seltos', 'Carnival', 'Carens', 'EV6'] },
  { make: 'MG', models: ['Hector', 'Astor', 'ZS EV', 'Gloster', 'Comet'] },
  { make: 'Renault', models: ['Kwid', 'Triber', 'Kiger', 'Duster'] },
  { make: 'Skoda', models: ['Slavia', 'Kushaq', 'Octavia', 'Superb', 'Kodiaq'] },
] as const;

const COLORS = ['White', 'Silver', 'Grey', 'Black', 'Blue', 'Red', 'Brown', 'Maroon', 'Pearl White', 'Golden', 'Bronze'] as const;

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com', 'icloud.com'] as const;

// ─── Service catalogue ────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
  {
    name: 'Oil & Fluids',
    description: 'Engine oil changes, fluid top-ups and flushes',
    iconSlug: 'oil-can',
    sortOrder: 1,
    services: [
      { name: 'Engine Oil Change', description: 'Full synthetic/semi-synthetic oil change with filter replacement', basePrice: 699, estimatedDuration: 45 },
      { name: 'Full Fluid Service', description: 'Oil, brake fluid, coolant, power steering and windshield washer top-up', basePrice: 1499, estimatedDuration: 90 },
      { name: 'Coolant Flush & Refill', description: 'Complete coolant system flush and refill with OEM-spec coolant', basePrice: 899, estimatedDuration: 60 },
    ],
  },
  {
    name: 'Brakes',
    description: 'Brake pad, rotor and caliper services',
    iconSlug: 'brake',
    sortOrder: 2,
    services: [
      { name: 'Brake Pad Replacement (Front)', description: 'Replace front brake pads with OEM-quality pads', basePrice: 1999, estimatedDuration: 90 },
      { name: 'Brake Pad Replacement (Rear)', description: 'Replace rear brake pads with OEM-quality pads', basePrice: 1799, estimatedDuration: 90 },
      { name: 'Brake Disc Resurfacing', description: 'Machine resurface brake discs to restore smooth braking', basePrice: 2799, estimatedDuration: 120 },
      { name: 'Full Brake Service', description: 'Full four-wheel brake inspection, pad replacement and disc check', basePrice: 4499, estimatedDuration: 180 },
    ],
  },
  {
    name: 'Tyres & Wheels',
    description: 'Tyre fitting, alignment, balancing and rotation',
    iconSlug: 'tire',
    sortOrder: 3,
    services: [
      { name: 'Wheel Alignment', description: 'Four-wheel computerised alignment adjustment', basePrice: 799, estimatedDuration: 60 },
      { name: 'Wheel Balancing', description: 'Dynamic balancing of all four wheels', basePrice: 599, estimatedDuration: 45 },
      { name: 'Tyre Rotation', description: 'Rotate all four tyres for even wear', basePrice: 399, estimatedDuration: 30 },
      { name: 'Tyre Replacement (per tyre)', description: 'Supply and fit a single tyre (tyre cost additional)', basePrice: 499, estimatedDuration: 30 },
    ],
  },
  {
    name: 'Engine',
    description: 'Engine diagnostics, tune-ups and repair',
    iconSlug: 'engine',
    sortOrder: 4,
    services: [
      { name: 'Engine Diagnostics & Tune-up', description: 'Full engine diagnostic scan + plugs, filters and timing check', basePrice: 2499, estimatedDuration: 120 },
      { name: 'Spark Plug Replacement', description: 'Replace all spark plugs with OEM-spec equivalents', basePrice: 1299, estimatedDuration: 60 },
      { name: 'Air Filter Replacement', description: 'Replace engine air filter', basePrice: 499, estimatedDuration: 30 },
      { name: 'Timing Belt Replacement', description: 'Replace timing belt and tensioner assembly', basePrice: 5999, estimatedDuration: 240 },
    ],
  },
  {
    name: 'Electrical',
    description: 'Battery, alternator and wiring services',
    iconSlug: 'zap',
    sortOrder: 5,
    services: [
      { name: 'Battery Replacement', description: 'Test and replace 12V battery with branded unit', basePrice: 3999, estimatedDuration: 45 },
      { name: 'Alternator Check & Service', description: 'Test charging system and service alternator', basePrice: 2199, estimatedDuration: 90 },
      { name: 'Starter Motor Service', description: 'Diagnose and service starter motor', basePrice: 2699, estimatedDuration: 120 },
    ],
  },
  {
    name: 'AC & Climate',
    description: 'Air conditioning service and heating system repairs',
    iconSlug: 'wind',
    sortOrder: 6,
    services: [
      { name: 'AC Gas Recharge (R134a)', description: 'Full AC system pressure test and gas recharge', basePrice: 1699, estimatedDuration: 60 },
      { name: 'AC Full Service', description: 'AC filter, condenser clean, evaporator flush and gas recharge', basePrice: 3499, estimatedDuration: 120 },
    ],
  },
  {
    name: 'Diagnostics',
    description: 'Comprehensive vehicle health checks',
    iconSlug: 'scan-line',
    sortOrder: 7,
    services: [
      { name: 'Full Vehicle Health Check', description: '50-point vehicle inspection with written report', basePrice: 999, estimatedDuration: 60 },
      { name: 'Pre-Purchase Inspection', description: 'In-depth pre-purchase vehicle inspection with detailed report', basePrice: 1699, estimatedDuration: 90 },
    ],
  },
  {
    name: 'General Maintenance',
    description: 'Scheduled service packages and general upkeep',
    iconSlug: 'wrench',
    sortOrder: 8,
    services: [
      { name: 'Minor Service Package', description: 'Oil change, filter, fluid top-up, tyre rotation and basic inspection', basePrice: 2999, estimatedDuration: 150 },
      { name: 'Major Service Package', description: 'Full service: oil, filters, plugs, belts, fluids, brakes and alignment', basePrice: 5999, estimatedDuration: 240 },
      { name: 'Exterior Wash & Interior Clean', description: 'Hand wash, vacuum, dashboard clean and glass polish', basePrice: 799, estimatedDuration: 90 },
    ],
  },
] as const;

// ─── Helper functions ─────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function setTimeOnDay(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function indianPhone(index: number): string {
  // Indian mobile numbers: 10 digits starting with 6-9
  const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70', '69', '68', '67', '66', '65'];
  const prefix = prefixes[index % prefixes.length] as string;
  const suffix = String(10000000 + index * 137 + 1234567).slice(-8);
  return `+91${prefix}${suffix}`;
}

function licensePlate(stateCode: string, index: number): string {
  const districtNum = String(10 + (index % 89)).padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPRSTUVWXY';
  const l1 = letters[index % letters.length] as string;
  const l2 = letters[(index * 7 + 3) % letters.length] as string;
  const num = String(1000 + (index * 97 % 8999)).padStart(4, '0');
  return `${stateCode} ${districtNum} ${l1}${l2} ${num}`;
}

/**
 * Determine booking status based on how many days from today the booking is scheduled.
 * Uses modValue (0–99) as a percentage-like selector for deterministic distribution.
 */
function resolveStatus(dayOffset: number, modValue: number): BookingStatus {
  if (dayOffset < -30) {
    // Older bookings: mostly settled
    if (modValue < 72) return BookingStatus.COMPLETED;
    if (modValue < 90) return BookingStatus.CANCELLED;
    return BookingStatus.ASSIGNED; // a few abandoned/unresolved
  }
  if (dayOffset < -7) {
    if (modValue < 60) return BookingStatus.COMPLETED;
    if (modValue < 75) return BookingStatus.CANCELLED;
    if (modValue < 88) return BookingStatus.IN_PROGRESS;
    return BookingStatus.ASSIGNED;
  }
  if (dayOffset < 0) {
    // Last week: active mix
    if (modValue < 45) return BookingStatus.COMPLETED;
    if (modValue < 60) return BookingStatus.CANCELLED;
    if (modValue < 78) return BookingStatus.IN_PROGRESS;
    if (modValue < 92) return BookingStatus.ASSIGNED;
    return BookingStatus.MECHANIC_ON_THE_WAY;
  }
  if (dayOffset === 0) {
    // Today: live operations
    if (modValue < 20) return BookingStatus.COMPLETED;
    if (modValue < 38) return BookingStatus.IN_PROGRESS;
    if (modValue < 55) return BookingStatus.MECHANIC_ON_THE_WAY;
    if (modValue < 75) return BookingStatus.ASSIGNED;
    return BookingStatus.PENDING;
  }
  // Future
  if (modValue < 55) return BookingStatus.PENDING;
  return BookingStatus.ASSIGNED;
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Starting seed...\n');

  // Clear existing data (FK-safe order)
  console.log('🗑️  Clearing existing data...');
  await prisma.booking.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  console.log('   ✓ Cleared\n');

  // ── Service Categories + Services ──────────────────────────────────────────
  console.log('🔧 Seeding service categories & services...');
  const createdServices: Array<{ id: string; basePrice: Decimal; estimatedDuration: number }> = [];

  for (const cat of SERVICE_CATEGORIES) {
    const category = await prisma.serviceCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        iconSlug: cat.iconSlug,
        sortOrder: cat.sortOrder,
        services: {
          create: cat.services.map((s) => ({
            name: s.name,
            description: s.description,
            basePrice: s.basePrice,
            estimatedDuration: s.estimatedDuration,
          })),
        },
      },
      include: { services: true },
    });
    createdServices.push(...category.services.map((s) => ({ id: s.id, basePrice: s.basePrice, estimatedDuration: s.estimatedDuration })));
  }
  console.log(`   ✓ ${SERVICE_CATEGORIES.length} categories, ${createdServices.length} services\n`);

  // ── Customers ─────────────────────────────────────────────────────────────
  console.log('👥 Seeding customers...');
  const allFirstNames = [...MALE_NAMES, ...FEMALE_NAMES];
  const customerData: Array<{ id: string; cityInfo: (typeof CITIES)[number] }> = [];

  const customerRecords = await Promise.all(
    Array.from({ length: 52 }, async (_, i) => {
      const firstName = allFirstNames[i % allFirstNames.length] as string;
      const lastName = LAST_NAMES[i % LAST_NAMES.length] as string;
      const cityInfo = CITIES[i % CITIES.length] as (typeof CITIES)[number];
      const emailDomain = EMAIL_DOMAINS[i % EMAIL_DOMAINS.length] as string;
      // Suffix to ensure uniqueness
      const suffix = i > 0 ? (i > allFirstNames.length - 1 ? `${i}` : '') : '';
      const email = `${firstName.toLowerCase()}${suffix ? `.${suffix}` : ''}.${lastName.toLowerCase()}@${emailDomain}`;

      // Spread createdAt over past 12 months for realistic new-customer distribution
      const createdDaysAgo = 365 - Math.floor(i * (365 / 52));
      const createdAt = addDays(new Date(), -createdDaysAgo);

      const customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone: indianPhone(i),
          city: cityInfo.city,
          state: cityInfo.state,
          address: `${rng.int(1, 999)}, ${rng.pick(['MG Road', 'Park Street', 'Anna Salai', 'FC Road', 'SV Road', 'Linking Road', 'Brigade Road', 'Connaught Place', 'CP Road', 'Nehru Street'])}`,
          zipCode: String(400001 + i * 11),
          createdAt,
        },
      });
      customerData.push({ id: customer.id, cityInfo });
      return customer;
    }),
  );
  console.log(`   ✓ ${customerRecords.length} customers\n`);

  // ── Vehicles ──────────────────────────────────────────────────────────────
  console.log('🚗 Seeding vehicles...');
  const vehicleData: Array<{ id: string; customerId: string }> = [];
  let plateIndex = 0;

  for (let i = 0; i < customerData.length; i++) {
    const custInfo = customerData[i] as (typeof customerData)[number];
    const vehicleCount = i % 5 === 0 ? 2 : 1; // 20% of customers have 2 vehicles

    for (let v = 0; v < vehicleCount; v++) {
      const brand = VEHICLES[(i + v) % VEHICLES.length] as (typeof VEHICLES)[number];
      const model = brand.models[rng.int(0, brand.models.length - 1)] as string;
      const year = rng.int(2015, 2024);
      const plate = licensePlate(custInfo.cityInfo.stateCode, plateIndex++);

      const vehicle = await prisma.vehicle.create({
        data: {
          customerId: custInfo.id,
          make: brand.make,
          model,
          year,
          licensePlate: plate,
          color: rng.pick(COLORS),
          mileage: rng.int(3000, 120000),
        },
      });
      vehicleData.push({ id: vehicle.id, customerId: custInfo.id });
    }
  }
  console.log(`   ✓ ${vehicleData.length} vehicles\n`);

  // ── Mechanics ─────────────────────────────────────────────────────────────
  console.log('🔨 Seeding mechanics...');
  const mechanicSpecializations: Array<[MechanicSpecialization, ...MechanicSpecialization[]]> = [
    [MechanicSpecialization.OIL_CHANGE, MechanicSpecialization.GENERAL],
    [MechanicSpecialization.BRAKES, MechanicSpecialization.TYRES],
    [MechanicSpecialization.ENGINE, MechanicSpecialization.DIAGNOSTICS],
    [MechanicSpecialization.ELECTRICAL, MechanicSpecialization.DIAGNOSTICS],
    [MechanicSpecialization.AC_HEATING, MechanicSpecialization.ELECTRICAL],
    [MechanicSpecialization.TYRES, MechanicSpecialization.BRAKES],
    [MechanicSpecialization.ENGINE, MechanicSpecialization.TRANSMISSION],
    [MechanicSpecialization.GENERAL, MechanicSpecialization.OIL_CHANGE],
    [MechanicSpecialization.DIAGNOSTICS, MechanicSpecialization.ENGINE],
    [MechanicSpecialization.BODYWORK, MechanicSpecialization.GENERAL],
    [MechanicSpecialization.ELECTRICAL, MechanicSpecialization.ENGINE],
    [MechanicSpecialization.BRAKES, MechanicSpecialization.ENGINE],
    [MechanicSpecialization.OIL_CHANGE, MechanicSpecialization.TYRES],
    [MechanicSpecialization.TRANSMISSION, MechanicSpecialization.ENGINE],
    [MechanicSpecialization.AC_HEATING],
    [MechanicSpecialization.GENERAL],
    [MechanicSpecialization.ENGINE, MechanicSpecialization.DIAGNOSTICS, MechanicSpecialization.TRANSMISSION],
    [MechanicSpecialization.ELECTRICAL],
    [MechanicSpecialization.BRAKES, MechanicSpecialization.TYRES, MechanicSpecialization.GENERAL],
    [MechanicSpecialization.DIAGNOSTICS],
    [MechanicSpecialization.OIL_CHANGE, MechanicSpecialization.GENERAL, MechanicSpecialization.TYRES],
    [MechanicSpecialization.ENGINE, MechanicSpecialization.BODYWORK],
  ];

  const mechanicFirstNames = [
    'Ramesh', 'Suresh', 'Mahesh', 'Dinesh', 'Naresh', 'Ganesh', 'Rajesh', 'Rakesh',
    'Umesh', 'Yogesh', 'Lokesh', 'Brijesh', 'Devesh', 'Mukesh', 'Nilesh',
    'Harish', 'Girish', 'Satish', 'Manish', 'Rupesh', 'Jagdish', 'Santosh',
  ];
  const mechanicLastNames = [
    'Yadav', 'Maurya', 'Nishad', 'Chauhan', 'Rajput', 'Tiwari', 'Pandey',
    'Kushwaha', 'Bind', 'Prajapati', 'Vishwakarma', 'Lodhi', 'Verma', 'Singh',
    'Sahu', 'Gupta', 'Patel', 'Sharma', 'Mishra', 'Dubey', 'Tripathi', 'Shukla',
  ];

  const mechanicRecords = await Promise.all(
    Array.from({ length: 22 }, async (_, i) => {
      const firstName = mechanicFirstNames[i] as string;
      const lastName = mechanicLastNames[i] as string;
      const specs = mechanicSpecializations[i] as MechanicSpecialization[];
      const totalJobs = rng.int(45, 320);
      const rating = Number((rng.float(3.8, 5.0)).toFixed(1));
      const experience = rng.int(2, 15);

      // Last 4 mechanics are marked unavailable (on leave)
      const isAvailable = i < 18;

      return prisma.mechanic.create({
        data: {
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@mechanic.instantmechanic.in`,
          phone: indianPhone(100 + i),
          specializations: specs,
          isAvailable,
          isActive: true,
          rating,
          totalJobs,
          experienceYears: experience,
          // Simulate GPS positions around major Indian cities
          latitude: rng.float(12.9, 28.7),
          longitude: rng.float(72.8, 88.4),
          locationUpdatedAt: new Date(),
        },
      });
    }),
  );
  console.log(`   ✓ ${mechanicRecords.length} mechanics (${mechanicRecords.filter((m) => m.isAvailable).length} available)\n`);

  // ── Bookings ─────────────────────────────────────────────────────────────
  console.log('📋 Seeding 520 bookings across 104 days...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;
  const sampleNotes = [
    'Car is making a rattling sound when braking.',
    'Engine light has been on for 2 days.',
    'AC stopped working suddenly.',
    'Noticed oil stain under the car.',
    'Steering feels stiff on turns.',
    'Strange vibration at speeds above 60 km/h.',
    'Battery died this morning, jump-started it.',
    'Tyre pressure warning light is on.',
    null, null, null, // 30% no notes
  ] as const;

  let bookingCount = 0;
  const TOTAL_BOOKINGS = 520;
  const DAYS_RANGE = 104; // -90 to +14

  for (let i = 0; i < TOTAL_BOOKINGS; i++) {
    const dayOffset = Math.floor(i / (TOTAL_BOOKINGS / DAYS_RANGE)) - 90;
    const scheduledDate = addDays(today, dayOffset);
    const hour = bookingHours[i % bookingHours.length] as number;
    const minute = [0, 15, 30, 45][i % 4] as number;
    const scheduledAt = setTimeOnDay(scheduledDate, hour, minute);

    const modValue = i % 100;
    const status = resolveStatus(dayOffset, modValue);

    const customerInfo = customerData[i % customerData.length] as (typeof customerData)[number];
    // Find a vehicle belonging to this customer
    const custVehicles = vehicleData.filter((v) => v.customerId === customerInfo.id);
    const vehicle = custVehicles[i % custVehicles.length] as (typeof vehicleData)[number];

    const service = createdServices[i % createdServices.length] as (typeof createdServices)[number];
    const needsMechanic = status !== BookingStatus.PENDING;
    const mechanic = needsMechanic ? (mechanicRecords[i % 18] as (typeof mechanicRecords)[number]) : null; // only use available mechanics

    // Compute timestamps + amount
    const waitMinutes = rng.int(0, 25);
    const startedAt = (status === BookingStatus.IN_PROGRESS || status === BookingStatus.COMPLETED)
      ? addMinutes(scheduledAt, waitMinutes)
      : null;

    const workMinutes = service.estimatedDuration + rng.int(-15, 30);
    const completedAt = status === BookingStatus.COMPLETED && startedAt
      ? addMinutes(startedAt, Math.max(workMinutes, 20))
      : null;

    const cancelledAt = status === BookingStatus.CANCELLED
      ? addMinutes(scheduledAt, rng.int(-120, -10))
      : null;

    // Total amount: base price ± 15% variation
    const priceVariation = 0.85 + rng.float(0, 0.30);
    const totalAmount = status === BookingStatus.COMPLETED
      ? Number((Number(service.basePrice) * priceVariation).toFixed(2))
      : null;

    const rating = status === BookingStatus.COMPLETED ? rng.int(3, 5) : null;
    const notes = rng.pick(sampleNotes) ?? null;

    await prisma.booking.create({
      data: {
        customerId: customerInfo.id,
        vehicleId: vehicle.id,
        mechanicId: mechanic?.id ?? null,
        serviceId: service.id,
        status,
        scheduledAt,
        startedAt,
        completedAt,
        cancelledAt,
        notes,
        totalAmount,
        rating,
        // Spread createdAt slightly before scheduledAt
        createdAt: addDays(scheduledAt, -rng.int(1, 5)),
      },
    });
    bookingCount++;
  }

  console.log(`   ✓ ${bookingCount} bookings created\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.serviceCategory.count(),
    prisma.service.count(),
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.mechanic.count(),
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  console.log('✅ Seed complete!\n');
  console.log('─────────────────────────────');
  console.log(`  Categories : ${counts[0]}`);
  console.log(`  Services   : ${counts[1]}`);
  console.log(`  Customers  : ${counts[2]}`);
  console.log(`  Vehicles   : ${counts[3]}`);
  console.log(`  Mechanics  : ${counts[4]}`);
  console.log(`  Bookings   : ${counts[5]}`);
  console.log('─────────────────────────────');
  const statusGroups = counts[6] as Array<{ status: BookingStatus; _count: { _all: number } }>;
  for (const g of statusGroups.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`  ${g.status.padEnd(22)}: ${g._count._all}`);
  }
  console.log('─────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
