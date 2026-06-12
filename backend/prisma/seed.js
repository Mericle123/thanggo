// Seed script with realistic Bhutan data
const prisma = require('../src/db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Clear existing data
  await Promise.all([
    prisma.chatMessage.deleteMany({}),
    prisma.chatRoom.deleteMany({}),
    prisma.comment.deleteMany({}),
    prisma.like.deleteMany({}),
    prisma.savedItem.deleteMany({}),
    prisma.post.deleteMany({}),
    prisma.tacticsPlan.deleteMany({}),
    prisma.matchLobby.deleteMany({}),
    prisma.matchRequest.deleteMany({}),
    prisma.matchPost.deleteMany({}),
    prisma.eventRegistration.deleteMany({}),
    prisma.event.deleteMany({}),
    prisma.gymMembership.deleteMany({}),
    prisma.booking.deleteMany({}),
    prisma.slotOverride.deleteMany({}),
    prisma.venue.deleteMany({}),
    prisma.squadJoinRequest.deleteMany({}),
    prisma.squadMember.deleteMany({}),
    prisma.squad.deleteMany({}),
    prisma.follow.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);
  
  console.log('✓ Cleared existing data');
  
  // Create users with Bhutan names
  const users = await prisma.user.createMany({
    data: [
      {
        email: 'ngawang@thanggo.app',
        name: 'Ngawang Thinley',
        username: 'ngawang.thinley',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'Super Admin',
        verified: true,
        profileComplete: true,
        location: 'Thimphu',
        mainSport: 'Football',
        skillLevel: 'Expert',
        photo: 'https://via.placeholder.com/150?text=Ngawang',
      },
      {
        email: 'kencho@thanggo.app',
        name: 'Kencho Phuntsog',
        username: 'kencho.p',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'Venue Manager',
        verified: true,
        profileComplete: true,
        location: 'Thimphu',
        mainSport: 'Futsal',
        skillLevel: 'Advanced',
        photo: 'https://via.placeholder.com/150?text=Kencho',
      },
      {
        email: 'tashi@thanggo.app',
        name: 'Tashi Dorji',
        username: 'tashi.d',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'User',
        verified: true,
        profileComplete: true,
        location: 'Paro',
        mainSport: 'Basketball',
        skillLevel: 'Intermediate',
        photo: 'https://via.placeholder.com/150?text=Tashi',
      },
      {
        email: 'sonam@thanggo.app',
        name: 'Sonam Tshering',
        username: 'sonam.t',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'User',
        verified: true,
        profileComplete: true,
        location: 'Punakha',
        mainSport: 'Badminton',
        skillLevel: 'Advanced',
        photo: 'https://via.placeholder.com/150?text=Sonam',
      },
      {
        email: 'jigme@thanggo.app',
        name: 'Jigme Lobzang',
        username: 'jigme.l',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'User',
        verified: true,
        profileComplete: true,
        location: 'Thimphu',
        mainSport: 'Cricket',
        skillLevel: 'Beginner',
        photo: 'https://via.placeholder.com/150?text=Jigme',
      },
      {
        email: 'pema@thanggo.app',
        name: 'Pema Wangchuk',
        username: 'pema.w',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'User',
        verified: true,
        profileComplete: true,
        location: 'Phuentsholing',
        mainSport: 'Volleyball',
        skillLevel: 'Intermediate',
        photo: 'https://via.placeholder.com/150?text=Pema',
      },
    ],
  });
  
  console.log('✓ Created 6 users');
  
  // Get user IDs
  const [ngawang, kencho, tashi, sonam, jigme, pema] = await prisma.user.findMany({
    where: { email: { in: ['ngawang@thanggo.app', 'kencho@thanggo.app', 'tashi@thanggo.app', 'sonam@thanggo.app', 'jigme@thanggo.app', 'pema@thanggo.app'] } },
  });
  
  // Create squads
  const squads = await prisma.squad.createMany({
    data: [
      {
        name: 'Thimphu Strikers',
        handle: 'thimphu-strikers',
        sport: 'Football',
        captainId: tashi.id,
        location: 'Thimphu',
        skillLevel: 'Advanced',
        description: 'Premier football squad in Thimphu',
        verified: true,
      },
      {
        name: 'Dragon FC',
        handle: 'dragon-fc',
        sport: 'Football',
        captainId: sonam.id,
        location: 'Punakha',
        skillLevel: 'Intermediate',
        description: 'Community football team from Punakha',
      },
      {
        name: 'Paro Warriors',
        handle: 'paro-warriors',
        sport: 'Basketball',
        captainId: pema.id,
        location: 'Paro',
        skillLevel: 'Advanced',
        description: 'Dynamic basketball squad',
      },
      {
        name: 'Thunder Hoopers',
        handle: 'thunder-hoopers',
        sport: 'Basketball',
        captainId: jigme.id,
        location: 'Thimphu',
        skillLevel: 'Beginner',
        description: 'Casual basketball team',
      },
      {
        name: 'Weekend Smashers',
        handle: 'weekend-smashers',
        sport: 'Badminton',
        captainId: kencho.id,
        location: 'Thimphu',
        skillLevel: 'Intermediate',
        description: 'Badminton enthusiasts group',
      },
    ],
  });
  
  console.log('✓ Created 5 squads');
  
  // Add squad members
  const [squad1, squad2, squad3, squad4, squad5] = await prisma.squad.findMany({
    orderBy: { createdAt: 'asc' },
    take: 5,
  });
  
  await prisma.squadMember.createMany({
    data: [
      { squadId: squad1.id, userId: tashi.id, role: 'Captain', isCaptain: true },
      { squadId: squad1.id, userId: ngawang.id, role: 'Player' },
      { squadId: squad1.id, userId: kencho.id, role: 'Coach/Manager' },
      { squadId: squad2.id, userId: sonam.id, role: 'Captain', isCaptain: true },
      { squadId: squad2.id, userId: jigme.id, role: 'Player' },
      { squadId: squad3.id, userId: pema.id, role: 'Captain', isCaptain: true },
      { squadId: squad3.id, userId: tashi.id, role: 'Player' },
      { squadId: squad4.id, userId: jigme.id, role: 'Captain', isCaptain: true },
      { squadId: squad4.id, userId: ngawang.id, role: 'Player' },
      { squadId: squad5.id, userId: kencho.id, role: 'Captain', isCaptain: true },
      { squadId: squad5.id, userId: sonam.id, role: 'Player' },
    ],
  });
  
  console.log('✓ Added squad members');
  
  // Create venues
  const venues = await prisma.venue.createMany({
    data: [
      {
        name: 'Changlimithang Futsal Arena',
        venueType: 'Indoor Hall',
        location: 'Thimphu',
        ownerId: kencho.id,
        managerId: kencho.id,
        sports: JSON.stringify(['Futsal', 'Badminton', 'Volleyball']),
        facilities: JSON.stringify(['Parking', 'Rest Room', 'Changing Room', 'Canteen']),
        pricePerHour: 1200,
        status: 'Approved',
        verified: true,
      },
      {
        name: 'Thimphu Sports Complex',
        venueType: 'Ground',
        location: 'Thimphu',
        ownerId: ngawang.id,
        managerId: ngawang.id,
        sports: JSON.stringify(['Football', 'Cricket']),
        facilities: JSON.stringify(['Parking', 'Rest Room', 'Floodlight']),
        pricePerHour: 600,
        status: 'Approved',
        verified: true,
      },
      {
        name: 'Paro Community Court',
        venueType: 'Court',
        location: 'Paro',
        ownerId: sonam.id,
        managerId: sonam.id,
        sports: JSON.stringify(['Basketball', 'Volleyball', 'Badminton']),
        facilities: JSON.stringify(['Parking', 'Changing Room']),
        pricePerHour: 400,
        status: 'Approved',
        verified: true,
      },
      {
        name: 'Dragon Gym',
        venueType: 'Gym',
        location: 'Thimphu',
        ownerId: pema.id,
        managerId: pema.id,
        sports: JSON.stringify(['Gym', 'Fitness']),
        facilities: JSON.stringify(['Locker', 'Shower', 'Trainer', 'Equipment']),
        pricePerHour: 150,
        status: 'Approved',
        verified: true,
        membership: JSON.stringify([
          { plan: 'Day Pass', period: '1 day', price: 150 },
          { plan: 'Monthly', period: '1 month', price: 1500 },
          { plan: 'Quarterly', period: '3 months', price: 4000 },
          { plan: 'Yearly', period: '1 year', price: 12000 },
        ]),
      },
      {
        name: 'Thimphu Fitness Club',
        venueType: 'Gym',
        location: 'Thimphu',
        ownerId: jigme.id,
        managerId: jigme.id,
        sports: JSON.stringify(['Gym', 'Yoga', 'Zumba']),
        facilities: JSON.stringify(['Locker', 'Shower', 'Trainer']),
        pricePerHour: 200,
        status: 'Approved',
        verified: true,
      },
    ],
  });
  
  console.log('✓ Created 5 venues');
  
  // Create events
  const events = await prisma.event.createMany({
    data: [
      {
        title: 'Weekend Futsal Clash',
        sport: 'Futsal',
        eventType: 'Tournament',
        location: 'Thimphu',
        date: '2026-06-20',
        deadline: '2026-06-18',
        capacity: 8,
        organizerId: kencho.id,
        status: 'Registration Open',
        fee: JSON.stringify({ amount: 2000, currency: 'BTN' }),
      },
      {
        title: 'Thimphu Basketball Night',
        sport: 'Basketball',
        eventType: 'Friendly Match Night',
        location: 'Thimphu',
        date: '2026-06-22',
        deadline: '2026-06-21',
        capacity: 4,
        organizerId: sonam.id,
        status: 'Registration Open',
        fee: JSON.stringify({ amount: 500, currency: 'BTN' }),
      },
      {
        title: 'Paro Badminton Doubles',
        sport: 'Badminton',
        eventType: 'Knockout Competition',
        location: 'Paro',
        date: '2026-06-25',
        deadline: '2026-06-24',
        capacity: 16,
        organizerId: sonam.id,
        status: 'Registration Open',
        fee: JSON.stringify({ amount: 300, currency: 'BTN' }),
      },
    ],
  });
  
  console.log('✓ Created 3 events');
  
  // Create bookings
  await prisma.booking.createMany({
    data: [
      {
        userId: tashi.id,
        venueId: (await prisma.venue.findFirst({ where: { name: 'Thimphu Sports Complex' } })).id,
        date: '2026-06-15',
        slot: '18:00',
        sport: 'Football',
        participants: 11,
        bookingType: 'Court Booking',
        price: 600,
        status: 'Confirmed',
        paymentStatus: 'Paid',
      },
      {
        userId: sonam.id,
        venueId: (await prisma.venue.findFirst({ where: { name: 'Paro Community Court' } })).id,
        date: '2026-06-16',
        slot: '19:00',
        sport: 'Basketball',
        participants: 10,
        bookingType: 'Court Booking',
        price: 400,
        status: 'Confirmed',
        paymentStatus: 'Paid',
      },
    ],
  });
  
  console.log('✓ Created bookings');
  
  // Create gym memberships
  await prisma.gymMembership.createMany({
    data: [
      {
        userId: ngawang.id,
        venueId: (await prisma.venue.findFirst({ where: { name: 'Dragon Gym' } })).id,
        plan: 'Monthly',
        period: '1 month',
        price: 1500,
        startDate: new Date().toISOString(),
        status: 'Active',
        paymentStatus: 'Paid',
      },
      {
        userId: pema.id,
        venueId: (await prisma.venue.findFirst({ where: { name: 'Thimphu Fitness Club' } })).id,
        plan: 'Quarterly',
        period: '3 months',
        price: 4000,
        startDate: new Date().toISOString(),
        status: 'Active',
        paymentStatus: 'Paid',
      },
    ],
  });
  
  console.log('✓ Created gym memberships');
  
  // Create follow relationships
  await prisma.follow.createMany({
    data: [
      { followerId: tashi.id, kind: 'user', targetId: ngawang.id },
      { followerId: sonam.id, kind: 'user', targetId: tashi.id },
      { followerId: ngawang.id, kind: 'squad', targetId: squad1.id },
      { followerId: kencho.id, kind: 'squad', targetId: squad2.id },
      { followerId: tashi.id, kind: 'venue', targetId: (await prisma.venue.findFirst({ where: { name: 'Thimphu Sports Complex' } })).id },
      { followerId: sonam.id, kind: 'venue', targetId: (await prisma.venue.findFirst({ where: { name: 'Paro Community Court' } })).id },
    ],
  });
  
  console.log('✓ Created follow relationships');
  
  // Create social posts
  await prisma.post.createMany({
    data: [
      {
        authorType: 'user',
        createdBy: tashi.id,
        postType: 'Match Challenge',
        sport: 'Football',
        title: 'Looking for football match tomorrow',
        caption: 'Experienced team seeking friendly match tomorrow evening at Thimphu Sports Complex',
        image: 'https://via.placeholder.com/400x300?text=Football+Match',
        modStatus: 'Active',
      },
      {
        authorType: 'user',
        createdBy: sonam.id,
        postType: 'Squad Recruitment',
        sport: 'Basketball',
        title: 'Paro Warriors recruiting new members',
        caption: 'Join our dynamic basketball squad! All skill levels welcome.',
        image: 'https://via.placeholder.com/400x300?text=Basketball+Recruitment',
        modStatus: 'Active',
      },
      {
        authorType: 'user',
        createdBy: ngawang.id,
        postType: 'General Post',
        title: 'Great match at Dragon Gym today!',
        caption: 'Had an amazing badminton session today. Great community!',
        image: 'https://via.placeholder.com/400x300?text=Gym+Session',
        modStatus: 'Active',
      },
    ],
  });
  
  console.log('✓ Created social posts');
  
  // Create payments
  await prisma.payment.createMany({
    data: [
      {
        userId: tashi.id,
        purpose: 'Venue Booking',
        amount: 600,
        refType: 'booking',
        status: 'Paid',
      },
      {
        userId: ngawang.id,
        purpose: 'Gym Membership',
        amount: 1500,
        refType: 'membership',
        status: 'Paid',
      },
    ],
  });
  
  console.log('✓ Created payments');
  
  console.log('✅ Seeding completed successfully!');
}

seed()
  .catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
