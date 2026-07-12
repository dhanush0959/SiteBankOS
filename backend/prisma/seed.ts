import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randHex(len: number): string {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}
function randSession(): string {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}
function recentDate(daysBack: number): Date {
  // Skew toward recent using sqrt
  const factor = Math.sqrt(Math.random());
  return new Date(Date.now() - factor * daysBack * 86400 * 1000);
}

async function main() {
  // Create subscription plans
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      limits: { properties: 3, photosPerProperty: 5, videosPerProperty: 0, thumbnailsPerMonth: 3, teamMembers: 1 },
      priceInr: 0,
      features: { aiTitle: true, aiDescription: false, analytics: false, documents: false },
      isActive: true,
    },
  });

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Basic Agent' },
    update: {},
    create: {
      name: 'Basic Agent',
      limits: { properties: 25, photosPerProperty: 20, videosPerProperty: 1, thumbnailsPerMonth: 25, teamMembers: 1 },
      priceInr: 999,
      features: { aiTitle: true, aiDescription: true, analytics: true, documents: true },
      isActive: true,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Pro Agent' },
    update: {},
    create: {
      name: 'Pro Agent',
      limits: { properties: 100, photosPerProperty: 50, videosPerProperty: 3, thumbnailsPerMonth: 100, teamMembers: 1 },
      priceInr: 2499,
      features: { aiTitle: true, aiDescription: true, analytics: true, documents: true, aiPitch: true, aiQA: true },
      isActive: true,
    },
  });

  const agencyPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Agency' },
    update: {},
    create: {
      name: 'Agency',
      limits: { properties: 500, photosPerProperty: -1, videosPerProperty: -1, thumbnailsPerMonth: -1, teamMembers: 20 },
      priceInr: 7999,
      features: { aiTitle: true, aiDescription: true, analytics: true, documents: true, aiPitch: true, aiQA: true, teamManagement: true, customBranding: true },
      isActive: true,
    },
  });

  // Create super admin
  const adminHash = await bcrypt.hash('SiteBank@Admin2026!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@sitebank.in' },
    update: {},
    create: {
      name: 'SiteBank Admin',
      email: 'admin@sitebank.in',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      isVerified: true,
      status: 'ACTIVE',
    },
  });

  // ----------------------------------------------------------------------------
  // Demo data — clean & re-create on each seed run
  // ----------------------------------------------------------------------------
  try {
    // Demo agent
    const demoAgentHash = await bcrypt.hash('Demo@2026', 12);
    const demoAgent = await prisma.user.upsert({
      where: { email: 'demo@sitebank.in' },
      update: {
        name: 'Ravi Kumar',
        passwordHash: demoAgentHash,
        role: 'AGENT',
        isVerified: true,
        status: 'ACTIVE',
        phone: '9876543210',
        whatsappNumber: '9876543210',
        reraNumber: 'A52100012345',
        profilePhotoUrl: null,
      },
      create: {
        name: 'Ravi Kumar',
        email: 'demo@sitebank.in',
        passwordHash: demoAgentHash,
        role: 'AGENT',
        isVerified: true,
        status: 'ACTIVE',
        phone: '9876543210',
        whatsappNumber: '9876543210',
        reraNumber: 'A52100012345',
        profilePhotoUrl: null,
      },
    });

    // Demo agency owner
    const agencyOwnerHash = await bcrypt.hash('Agency@2026', 12);
    const agencyOwner = await prisma.user.upsert({
      where: { email: 'agency@sitebank.in' },
      update: {
        name: 'Priya Nair',
        passwordHash: agencyOwnerHash,
        role: 'AGENCY_ADMIN',
        isVerified: true,
        status: 'ACTIVE',
      },
      create: {
        name: 'Priya Nair',
        email: 'agency@sitebank.in',
        passwordHash: agencyOwnerHash,
        role: 'AGENCY_ADMIN',
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    // Agency: ownerUserId is unique, so upsert by ownerUserId
    const nairRealty = await prisma.agency.upsert({
      where: { ownerUserId: agencyOwner.id },
      update: { name: 'Nair Realty', status: 'ACTIVE' },
      create: {
        name: 'Nair Realty',
        ownerUserId: agencyOwner.id,
        status: 'ACTIVE',
      },
    });

    // Link agency owner to their agency (member relation)
    await prisma.user.update({
      where: { id: agencyOwner.id },
      data: { agencyId: nairRealty.id },
    });

    // Subscriptions: userId/agencyId are unique on Subscription
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86400 * 1000);

    await prisma.subscription.upsert({
      where: { userId: demoAgent.id },
      update: {
        planId: proPlan.id,
        startDate: now,
        endDate: in30Days,
        paymentStatus: 'ACTIVE',
        paymentProvider: 'seed',
        entityType: 'USER',
      },
      create: {
        entityType: 'USER',
        userId: demoAgent.id,
        planId: proPlan.id,
        startDate: now,
        endDate: in30Days,
        paymentStatus: 'ACTIVE',
        paymentProvider: 'seed',
      },
    });

    await prisma.subscription.upsert({
      where: { agencyId: nairRealty.id },
      update: {
        planId: agencyPlan.id,
        startDate: now,
        endDate: in30Days,
        paymentStatus: 'ACTIVE',
        paymentProvider: 'seed',
        entityType: 'AGENCY',
      },
      create: {
        entityType: 'AGENCY',
        agencyId: nairRealty.id,
        planId: agencyPlan.id,
        startDate: now,
        endDate: in30Days,
        paymentStatus: 'ACTIVE',
        paymentProvider: 'seed',
      },
    });

    // Wipe existing demo properties (cascades media/smartLinks/leads/reminders/thumbnails)
    await prisma.property.deleteMany({ where: { ownerUserId: demoAgent.id } });

    // Property definitions
    type PropertySeed = {
      slug: string;
      title: string;
      aiGeneratedTitle: string;
      aiGeneratedDescription: string;
      propertyType: Prisma.PropertyCreateInput['propertyType'];
      transactionType: Prisma.PropertyCreateInput['transactionType'];
      price: string;
      priceNegotiable: boolean;
      priceOnRequest: boolean;
      location: Prisma.JsonObject;
      specs: Prisma.JsonObject;
      amenities: string[];
      approvals: Prisma.JsonObject;
      status: Prisma.PropertyCreateInput['status'];
      verificationStatus: Prisma.PropertyCreateInput['verificationStatus'];
      media: { url: string }[];
    };

    const propertySeeds: PropertySeed[] = [
      {
        slug: 'demo-prop-1',
        title: 'Spacious 3BHK Apartment in Gachibowli',
        aiGeneratedTitle: 'Luxury 3BHK Apartment with Skyline Views in Gachibowli',
        aiGeneratedDescription:
          'Step into a beautifully designed 3BHK apartment located in the heart of Gachibowli, one of Hyderabad’s most sought-after IT corridors. The home offers 1850 sqft of carpet area with elegant vitrified flooring, modular kitchen, and floor-to-ceiling windows that flood the rooms with natural light. Residents enjoy access to a fully equipped clubhouse, infinity pool, gymnasium, kids’ play area, and 24x7 security. The project is HMDA approved and located within 5 minutes of major IT parks, international schools, and reputed hospitals. An ideal home for working professionals and growing families looking for comfort, convenience and an investment-grade location.',
        propertyType: 'APARTMENT',
        transactionType: 'SALE',
        price: '12500000',
        priceNegotiable: true,
        priceOnRequest: false,
        location: { address: 'Aparna Sarovar Grande, Tellapur Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500032', lat: 17.4399, lng: 78.3489, locality: 'Gachibowli' },
        specs: { bedrooms: 3, bathrooms: 3, areaSqft: 1850, floor: 8, totalFloors: 18, ageYears: 2, facing: 'East', furnishing: 'Semi-Furnished' },
        amenities: ['Swimming Pool', 'Gymnasium', 'Clubhouse', 'Children Play Area', '24x7 Security', 'Power Backup', 'Covered Parking', 'Landscaped Gardens', 'Indoor Games', 'Jogging Track'],
        approvals: { authority: 'HMDA', certificateNumber: 'HMDA/2023/GCB/4521' },
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        media: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00' },
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2' },
          { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb' },
        ],
      },
      {
        slug: 'demo-prop-2',
        title: 'Premium 2BHK Apartment in Kondapur',
        aiGeneratedTitle: 'Modern 2BHK Apartment with Premium Finishes in Kondapur',
        aiGeneratedDescription:
          'A thoughtfully designed 2BHK apartment in Kondapur, perfect for young professionals and small families. Spread over 1180 sqft, the home features Italian marble flooring in the living room, modular wardrobes, and a contemporary modular kitchen with chimney and hob. The gated community offers a rooftop infinity pool, fully-equipped gym, yoga deck, and dedicated work-from-home pods. Located 10 minutes from Hitech City and Cyberabad, with metro connectivity, ORR access, and proximity to the best malls and restaurants in the city. RERA registered and HMDA approved with clear titles and ready possession.',
        propertyType: 'APARTMENT',
        transactionType: 'SALE',
        price: '8500000',
        priceNegotiable: false,
        priceOnRequest: false,
        location: { address: 'Botanical Garden Rd, Kondapur', city: 'Hyderabad', state: 'Telangana', pincode: '500084', lat: 17.4615, lng: 78.3645, locality: 'Kondapur' },
        specs: { bedrooms: 2, bathrooms: 2, areaSqft: 1180, floor: 5, totalFloors: 12, ageYears: 1, facing: 'North-East', furnishing: 'Unfurnished' },
        amenities: ['Swimming Pool', 'Gymnasium', 'Clubhouse', '24x7 Security', 'Power Backup', 'Covered Parking', 'Yoga Deck', 'Co-working Space'],
        approvals: { authority: 'HMDA', certificateNumber: 'HMDA/2024/KDP/8821' },
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        media: [
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688' },
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267' },
          { url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a' },
        ],
      },
      {
        slug: 'demo-prop-3',
        title: 'Luxury Villa in Jubilee Hills',
        aiGeneratedTitle: 'Exquisite 5BHK Independent Villa in Jubilee Hills with Private Garden',
        aiGeneratedDescription:
          'Welcome to a magnificent 5BHK villa in the prestigious neighborhood of Jubilee Hills, Hyderabad. Built across three levels with 5400 sqft of built-up area on a 600 sqyd plot, the home features double-height ceilings in the living room, imported Italian flooring, a private home theatre, and a landscaped garden with a swimming pool. The master suite includes a walk-in wardrobe and spa-style bathroom. The property comes with a private elevator, smart home automation, four-car garage, and dedicated staff quarters. Walking distance to KBR National Park, top-tier schools and Hyderabad’s finest dining scene. A rare offering for the discerning buyer who values privacy, prestige, and craftsmanship.',
        propertyType: 'VILLA',
        transactionType: 'SALE',
        price: '65000000',
        priceNegotiable: true,
        priceOnRequest: false,
        location: { address: 'Road No. 36, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', lat: 17.4239, lng: 78.4071, locality: 'Jubilee Hills' },
        specs: { bedrooms: 5, bathrooms: 6, areaSqft: 5400, plotSizeSqyd: 600, floor: 0, totalFloors: 3, ageYears: 4, facing: 'East', furnishing: 'Semi-Furnished' },
        amenities: ['Private Swimming Pool', 'Home Theatre', 'Private Elevator', 'Smart Home Automation', 'Landscaped Garden', '4-Car Garage', 'Staff Quarters', 'Solar Panels', 'Borewell', 'CCTV Surveillance', 'Gazebo', 'Backup Generator'],
        approvals: { authority: 'GHMC', certificateNumber: 'GHMC/JBH/2021/0987' },
        status: 'UNDER_NEGOTIATION',
        verificationStatus: 'VERIFIED',
        media: [
          { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6' },
          { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c' },
        ],
      },
      {
        slug: 'demo-prop-4',
        title: 'HMDA Approved Plot in Shadnagar',
        aiGeneratedTitle: '300 Sq Yd HMDA Approved Residential Plot in Shadnagar',
        aiGeneratedDescription:
          'A premium 300 sq yd HMDA approved residential plot in a fast-developing layout near Shadnagar, off the Bangalore Highway. The plot is rectangular, north-facing, and located in a fully developed gated community with 40-feet asphalted roads, underground drainage, water supply, electricity, and street lighting already in place. The layout offers walking-distance amenities including a clubhouse, kids play area, and a temple. Perfect for self-construction or as a long-term investment, given proximity to the upcoming Pharma City and the Outer Ring Road. Clear titles, single ownership, and ready for immediate registration.',
        propertyType: 'PLOT',
        transactionType: 'SALE',
        price: '4500000',
        priceNegotiable: true,
        priceOnRequest: false,
        location: { address: 'Janaki Nagar, Shadnagar', city: 'Hyderabad', state: 'Telangana', pincode: '509216', lat: 17.0758, lng: 78.2056, locality: 'Shadnagar' },
        specs: { plotSizeSqft: 2700, plotSizeSqyd: 300, facing: 'North', dimensions: '30x90 feet', boundaryWall: true, cornerPlot: false },
        amenities: ['Gated Community', 'Asphalted Roads', 'Underground Drainage', 'Water Supply', 'Electricity', 'Street Lighting', 'Clubhouse', 'Park', 'Temple'],
        approvals: { authority: 'HMDA', certificateNumber: 'HMDA/SHD/2022/1145' },
        status: 'ACTIVE',
        verificationStatus: 'SUBMITTED',
        media: [
          { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef' },
          { url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff' },
          { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470' },
        ],
      },
      {
        slug: 'demo-prop-5',
        title: '4BHK Independent House in Whitefield',
        aiGeneratedTitle: 'Spacious 4BHK Independent House on 2400 sqft in Whitefield, Bangalore',
        aiGeneratedDescription:
          'A well-maintained 4BHK independent house built on a 2400 sqft plot in a quiet residential pocket of Whitefield, Bangalore. Built across two floors with 3200 sqft of built-up area, the home features a spacious puja room, separate servant quarters, and a covered parking for two cars. The terrace can accommodate a kitchen garden or outdoor seating. Located 10 minutes from ITPL, Phoenix Marketcity, and reputed schools like Inventure Academy and Vidyashilp. The house has BBMP approval, comes with all utility connections including Cauvery water, and is move-in ready. Ideal for families wanting independence without compromising on community living.',
        propertyType: 'INDEPENDENT_HOUSE',
        transactionType: 'SALE',
        price: '18500000',
        priceNegotiable: false,
        priceOnRequest: false,
        location: { address: 'Borewell Rd, Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066', lat: 12.9698, lng: 77.7499, locality: 'Whitefield' },
        specs: { bedrooms: 4, bathrooms: 4, areaSqft: 3200, plotSizeSqft: 2400, floor: 0, totalFloors: 2, ageYears: 6, facing: 'East', furnishing: 'Unfurnished' },
        amenities: ['Covered Parking', 'Puja Room', 'Servant Quarters', 'Terrace', 'Borewell', 'Cauvery Water', 'Solar Water Heater', 'CCTV', 'Boundary Wall'],
        approvals: { authority: 'BBMP', certificateNumber: 'BBMP/WHF/2018/3344' },
        status: 'ACTIVE',
        verificationStatus: 'SUBMITTED',
        media: [
          { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994' },
          { url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83' },
          { url: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126' },
        ],
      },
      {
        slug: 'demo-prop-6',
        title: 'Commercial Office Space in Hitech City',
        aiGeneratedTitle: 'Grade-A Commercial Office Space for Lease in Hitech City',
        aiGeneratedDescription:
          'A Grade-A commercial office space available for long-term lease in the heart of Hitech City, Hyderabad. The unit offers 4500 sqft of carpet area on the 12th floor of a glass-facade IT tower with panoramic city views. The space is delivered as a warm shell with raised flooring, central air-conditioning ducts, false ceiling provision, and dedicated power backup of 1.5 KVA per 100 sqft. The building features double-height lobby, valet parking, food court, gym, EV charging stations, and 100% DG backup. Located 2 minutes from the metro station and major IT campuses including Microsoft, Google, and Amazon. Ideal for startups scaling rapidly or established businesses setting up regional headquarters.',
        propertyType: 'COMMERCIAL',
        transactionType: 'LEASE',
        price: '180000',
        priceNegotiable: true,
        priceOnRequest: false,
        location: { address: 'HITEC City Main Rd, Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', lat: 17.4485, lng: 78.3908, locality: 'Hitech City' },
        specs: { areaSqft: 4500, floor: 12, totalFloors: 18, ageYears: 3, facing: 'West', cabins: 6, workstations: 60, parkingSlots: 8, washrooms: 4 },
        amenities: ['Central AC Ducting', 'Raised Flooring', '100% Power Backup', 'Valet Parking', 'Food Court', 'Gymnasium', 'EV Charging', 'Metro Connectivity', 'Cafeteria', '24x7 Security', 'Visitor Parking'],
        approvals: { authority: 'HMDA', certificateNumber: 'HMDA/HTC/2020/5567' },
        status: 'SOLD',
        verificationStatus: 'UNVERIFIED',
        media: [
          { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c' },
          { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2' },
          { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7' },
        ],
      },
    ];

    // Override one to be RENT to satisfy mix (4 SALE / 1 RENT / 1 LEASE)
    propertySeeds[1].transactionType = 'RENT';
    propertySeeds[1].price = '25000';
    propertySeeds[1].title = 'Premium 2BHK Apartment for Rent in Kondapur';
    propertySeeds[1].aiGeneratedTitle = 'Modern Furnished 2BHK for Rent in Kondapur, Hyderabad';

    const createdProperties: { id: string; slug: string }[] = [];

    for (const p of propertySeeds) {
      const property = await prisma.property.create({
        data: {
          ownerUserId: demoAgent.id,
          title: p.title,
          aiGeneratedTitle: p.aiGeneratedTitle,
          aiGeneratedDescription: p.aiGeneratedDescription,
          propertyType: p.propertyType,
          transactionType: p.transactionType,
          price: new Prisma.Decimal(p.price),
          priceNegotiable: p.priceNegotiable,
          priceOnRequest: p.priceOnRequest,
          location: p.location as Prisma.InputJsonValue,
          specs: p.specs as Prisma.InputJsonValue,
          amenities: p.amenities as unknown as Prisma.InputJsonValue,
          approvals: p.approvals as Prisma.InputJsonValue,
          status: p.status,
          verificationStatus: p.verificationStatus,
        },
      });

      // Property media
      for (let i = 0; i < p.media.length; i++) {
        await prisma.propertyMedia.create({
          data: {
            propertyId: property.id,
            fileUrl: p.media[i].url,
            cdnUrl: p.media[i].url,
            fileType: 'PHOTO',
            orderIndex: i,
            isCover: i === 0,
            width: 1920,
            height: 1080,
          },
        });
      }

      createdProperties.push({ id: property.id, slug: p.slug });
    }

    // SmartLinks (1 per property), with deterministic slugs
    const smartLinks: { id: string; propertyId: string }[] = [];
    for (let i = 0; i < createdProperties.length; i++) {
      const cp = createdProperties[i];
      const expiryAt = i === 0 ? new Date(Date.now() + 60 * 86400 * 1000) : null;
      const sl = await prisma.smartLink.create({
        data: {
          propertyId: cp.id,
          slug: cp.slug,
          status: 'ACTIVE',
          expiryAt,
          shareCount: randInt(5, 150),
        },
      });
      smartLinks.push({ id: sl.id, propertyId: cp.id });
    }

    // Link events
    const referrers = ['', 'https://wa.me/', 'https://t.co/', 'https://google.com/', 'https://instagram.com/'];
    type EventInput = {
      smartLinkId: string;
      eventType: string;
      sessionId: string;
      ipHash: string;
      deviceHash: string;
      referrer: string;
      timeOnPageSeconds: number;
      scrollDepthPct: number;
      createdAt: Date;
    };
    const allEvents: EventInput[] = [];
    for (const sl of smartLinks) {
      const eventCount = randInt(30, 200);
      for (let i = 0; i < eventCount; i++) {
        const r = Math.random();
        let eventType = 'VIEW';
        if (r < 0.7) eventType = 'VIEW';
        else if (r < 0.85) eventType = 'CLICK_WHATSAPP';
        else if (r < 0.95) eventType = 'CLICK_CALL';
        else eventType = 'LEAD_FORM_SUBMIT';

        allEvents.push({
          smartLinkId: sl.id,
          eventType,
          sessionId: randSession(),
          ipHash: randHex(16),
          deviceHash: randHex(16),
          referrer: rand(referrers),
          timeOnPageSeconds: randInt(5, 600),
          scrollDepthPct: randInt(10, 100),
          createdAt: recentDate(30),
        });
      }
    }

    // Bulk insert events in chunks
    const CHUNK = 500;
    for (let i = 0; i < allEvents.length; i += CHUNK) {
      await prisma.linkEvent.createMany({ data: allEvents.slice(i, i + CHUNK) });
    }

    // Leads: 12 distributed across the 6 properties
    const leadNames = [
      'Arjun Reddy', 'Sneha Iyer', 'Rohan Sharma', 'Kavya Menon',
      'Vikram Patel', 'Ananya Rao', 'Sandeep Naidu', 'Pooja Krishnan',
      'Karthik Subramanian', 'Divya Shetty', 'Aditya Joshi', 'Meera Pillai',
    ];
    const leadStatusPlan: { status: Prisma.LeadCreateInput['status']; count: number }[] = [
      { status: 'NEW', count: 4 },
      { status: 'CONTACTED', count: 3 },
      { status: 'SITE_VISIT_SCHEDULED', count: 2 },
      { status: 'NEGOTIATING', count: 2 },
      { status: 'CLOSED', count: 1 },
    ];
    const sources = ['SMART_LINK', 'DIRECT', 'REFERRAL', 'WALK_IN'];
    const noteSamples = [
      'Asked about EMI options and home loan tie-ups.',
      'Visited site on Saturday, liked the location and amenities.',
      'Looking to close in next 30 days, awaiting pre-approval.',
      'Interested but wants to negotiate the final price.',
      'Wants to bring family for a second visit next weekend.',
      'Inquired about parking allocation and maintenance charges.',
      'Comparing this property with two others in the same area.',
      'Engineer at TCS, relocating from Chennai for IT job.',
      'NRI based in Dubai, wants virtual tour first.',
      'Wants documentation review by their lawyer before proceeding.',
      'Closed deal — registration scheduled for next week.',
      'Asked about RERA registration and approvals.',
    ];

    function scoreFor(status: string): number {
      switch (status) {
        case 'NEW': return randInt(20, 40);
        case 'CONTACTED': return randInt(40, 60);
        case 'SITE_VISIT_SCHEDULED': return randInt(60, 80);
        case 'NEGOTIATING': return randInt(70, 95);
        case 'CLOSED': return 100;
        default: return 30;
      }
    }

    const expandedLeadStatuses: Prisma.LeadCreateInput['status'][] = [];
    for (const lp of leadStatusPlan) {
      for (let i = 0; i < lp.count; i++) expandedLeadStatuses.push(lp.status);
    }

    const createdLeads: { id: string; status: string }[] = [];
    for (let i = 0; i < expandedLeadStatuses.length; i++) {
      const status = expandedLeadStatuses[i];
      const property = createdProperties[i % createdProperties.length];
      const lastActivityAt = status === 'CLOSED'
        ? new Date(Date.now() - randInt(20, 60) * 86400 * 1000)
        : new Date(Date.now() - randInt(0, 14) * 86400 * 1000);

      const phone = '9' + String(randInt(100000000, 999999999));

      const lead = await prisma.lead.create({
        data: {
          propertyId: property.id,
          agentId: demoAgent.id,
          name: leadNames[i],
          phone,
          source: rand(sources),
          hotScore: scoreFor(status),
          status,
          lastActivityAt,
          notes: noteSamples[i],
        },
      });
      createdLeads.push({ id: lead.id, status });
    }

    // 4 follow-up reminders for first 4 leads
    const reminderNotes = [
      'Call back to schedule a site visit.',
      'Send loan pre-approval documents.',
      'Follow up after second visit feedback.',
      'Confirm final price negotiation outcome.',
    ];
    for (let i = 0; i < 4; i++) {
      const lead = createdLeads[i];
      await prisma.followUpReminder.create({
        data: {
          agentId: demoAgent.id,
          leadId: lead.id,
          propertyId: createdProperties[i % createdProperties.length].id,
          remindAt: new Date(Date.now() + randInt(1, 7) * 86400 * 1000),
          status: 'PENDING',
          note: reminderNotes[i],
        },
      });
    }

    console.log('Seed complete:');
    console.log('  Plans: 4');
    console.log('  Users: admin, demo, agency-admin (3)');
    console.log(`  Properties: ${createdProperties.length}`);
    console.log(`  SmartLinks: ${smartLinks.length}`);
    console.log(`  Events: ~${allEvents.length}`);
    console.log(`  Leads: ${createdLeads.length}`);
    console.log('  Reminders: 4');
    console.log('Demo credentials:');
    console.log('  Agent:     demo@sitebank.in     / Demo@2026');
    console.log('  Agency:    agency@sitebank.in   / Agency@2026');
    console.log('  Admin:     admin@sitebank.in    / SiteBank@Admin2026!');
    console.log('Plan IDs:', { freePlan: freePlan.id, basicPlan: basicPlan.id, proPlan: proPlan.id, agencyPlan: agencyPlan.id });
  } catch (err) {
    console.error('Demo data seeding failed:');
    console.error(err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
