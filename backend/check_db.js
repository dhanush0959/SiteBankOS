
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const p = await prisma.property.findFirst({
      where: {
        OR: [
          { title: { contains: 'Pithapuram', mode: 'insensitive' } },
          { location: { path: ['city'], string_contains: 'Visakhapatnam' } }
        ]
      },
      select: { id: true, title: true, location: true }
    });
    console.log(JSON.stringify(p, null, 2));
    
    if (p) {
      const amenities = await prisma.nearbyAmenity.findMany({
        where: { propertyId: p.id }
      });
      console.log('--- Cached Amenities ---');
      console.log(JSON.stringify(amenities, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
