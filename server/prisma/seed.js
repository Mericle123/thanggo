// Seed ThangGo with realistic Bhutan data.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const IMG = {
  futsal: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
  court: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=80',
  gym: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80',
  pool: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
  complex: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=1000&q=80',
  feed: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1000&q=80',
  event: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=80',
};

async function wipe() {
  // order respects FKs (children first)
  const models = ['adminActivityLog', 'analyticsEvent', 'setting', 'supportTicket', 'report', 'notification', 'chatMessage', 'chatRoom', 'paymentSplit', 'payment', 'tacticsPlayerPosition', 'tacticsPlan', 'lobbyLineup', 'matchLobby', 'matchRequest', 'shareLog', 'savedItem', 'like', 'commentReply', 'comment', 'postMedia', 'post', 'eventLobby', 'eventRegistration', 'event', 'classSession', 'gymMembership', 'booking', 'venueTimeSlot', 'venueSport', 'venueFacility', 'venueGallery', 'venue', 'squadJoinRequest', 'squadMember', 'squad', 'follow', 'profile', 'user'];
  for (const m of models) { try { await prisma[m].deleteMany(); } catch (e) { /* ignore */ } }
}

async function main() {
  console.log('Wiping…'); await wipe();
  const pw = await bcrypt.hash('password', 10);
  const adminPw = await bcrypt.hash('admin123', 10);

  // ── Users + profiles ──
  const usersData = [
    { email: 'ngawang@thanggo.bt', name: 'Ngawang', username: 'ngawang927', sport: 'Futsal', skill: 'Competitive', loc: 'Thimphu', av: 'Evenings', followers: 1200, following: 214 },
    { email: 'kencho@thanggo.bt', name: 'Kencho P.', username: 'kencho10', sport: 'Futsal', skill: 'Competitive', loc: 'Thimphu', av: 'Available', followers: 540, following: 120 },
    { email: 'tashi@thanggo.bt', name: 'Tashi D.', username: 'tashipivot', sport: 'Futsal', skill: 'Competitive', loc: 'Thimphu', av: 'Available', followers: 610, following: 201 },
    { email: 'sonam@thanggo.bt', name: 'Sonam T.', username: 'sonamala', sport: 'Futsal', skill: 'Competitive', loc: 'Thimphu', av: 'Available', followers: 430, following: 98 },
    { email: 'jigme@thanggo.bt', name: 'Jigme L.', username: 'jigmegk', sport: 'Futsal', skill: 'Intermediate', loc: 'Thimphu', av: 'Maybe', followers: 280, following: 150 },
    { email: 'pema@thanggo.bt', name: 'Pema W.', username: 'pema17', sport: 'Badminton', skill: 'Pro', loc: 'Paro', av: 'Available', followers: 920, following: 60 },
    { email: 'dorji@thanggo.bt', name: 'Dorji N.', username: 'dorjidunks', sport: 'Basketball', skill: 'Competitive', loc: 'Thimphu', av: 'Available', followers: 710, following: 88 },
  ];
  const U = {};
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: { email: u.email, passwordHash: pw, role: 'User', verified: true, profile: { create: { name: u.name, username: u.username, location: u.loc, mainSport: u.sport, skillLevel: u.skill, availability: u.av, followers: u.followers, following: u.following, rating: 4.8, completed: true, bio: `${u.sport} player from ${u.loc}.` } } },
    });
    U[u.username] = created.id;
  }
  // admins
  const superAdmin = await prisma.user.create({ data: { email: 'admin@thanggo.bt', passwordHash: adminPw, role: 'Super Admin', verified: true, profile: { create: { name: 'Platform Admin', username: 'admin', location: 'Thimphu', mainSport: 'Futsal', completed: true } } } });
  await prisma.user.create({ data: { email: 'finance@thanggo.bt', passwordHash: adminPw, role: 'Finance Admin', verified: true, profile: { create: { name: 'Finance Admin', username: 'finance', completed: true } } } });

  // ── Squads ──
  const squadsData = [
    { name: 'Thimphu Strikers', handle: 'thimphustrikers', sport: 'Futsal', loc: 'Thimphu', captain: 'kencho10', vice: 'ngawang927', wins: 12, losses: 4, draws: 2, followers: 860, members: [['kencho10', 'Captain', 'Fixo'], ['ngawang927', 'Vice Captain', 'Ala'], ['sonamala', 'Player', 'Ala'], ['tashipivot', 'Player', 'Pivot'], ['jigmegk', 'Player', 'Goalkeeper'], ['dorjidunks', 'Substitute', 'Substitute']] },
    { name: 'Dragon FC', handle: 'dragonfc', sport: 'Futsal', loc: 'Thimphu', captain: 'tashipivot', wins: 10, losses: 5, draws: 1, followers: 690, members: [['tashipivot', 'Captain', 'Pivot'], ['kencho10', 'Player', 'Fixo'], ['sonamala', 'Player', 'Ala'], ['jigmegk', 'Player', 'Goalkeeper'], ['ngawang927', 'Player', 'Ala']] },
    { name: 'Paro Warriors', handle: 'parowarriors', sport: 'Football', loc: 'Paro', captain: 'pema17', wins: 7, losses: 3, draws: 3, followers: 420, members: [['pema17', 'Captain', 'ST'], ['dorjidunks', 'Player', 'CB']] },
    { name: 'Thunder Hoopers', handle: 'thunderhoopers', sport: 'Basketball', loc: 'Thimphu', captain: 'dorjidunks', wins: 15, losses: 6, draws: 0, followers: 580, members: [['dorjidunks', 'Captain', 'PG'], ['kencho10', 'Player', 'SG'], ['sonamala', 'Player', 'SF']] },
    { name: 'Weekend Smashers', handle: 'weekendsmashers', sport: 'Badminton', loc: 'Thimphu', captain: 'pema17', wins: 18, losses: 6, draws: 0, followers: 350, members: [['pema17', 'Captain', 'Front'], ['tashipivot', 'Player', 'Back']] },
  ];
  const S = {};
  for (const s of squadsData) {
    const squad = await prisma.squad.create({
      data: {
        name: s.name, handle: s.handle, sport: s.sport, location: s.loc, skillLevel: 'Competitive', captainId: U[s.captain], viceCaptainId: s.vice ? U[s.vice] : null,
        wins: s.wins, losses: s.losses, draws: s.draws, rating: 4.7, followers: s.followers, description: `${s.sport} squad from ${s.loc}.`,
        members: { create: s.members.map(([uname, role, sportRole]) => ({ userId: U[uname], role, sportRole, isCaptain: role === 'Captain', isViceCaptain: role === 'Vice Captain', availability: 'Available' })) },
      },
    });
    S[s.handle] = squad.id;
  }

  // ── Venues ──
  const venuesData = [
    { name: 'Changlimithang Futsal Arena', loc: 'Changlimithang, Thimphu', area: 'Thimphu', type: 'Court', indoor: 'Indoor', price: 1200, unit: 'court', img: IMG.futsal, sports: ['Futsal', 'Football'], fac: ['Indoor court', 'Changing room', 'Parking', 'Flood lights'], hours: '6:00 AM – 10:00 PM' },
    { name: 'Thimphu Sports Complex', loc: 'Chubachu, Thimphu', area: 'Thimphu', type: 'Sports Club', indoor: 'Indoor', price: 900, unit: 'court', img: IMG.complex, sports: ['Basketball', 'Volleyball', 'Badminton', 'Futsal'], fac: ['Multi-court', 'Changing rooms', 'Cafe'], hours: '6:00 AM – 9:00 PM' },
    { name: 'Paro Community Court', loc: 'Paro Town', area: 'Paro', type: 'Court', indoor: 'Outdoor', price: 600, unit: 'court', img: IMG.court, sports: ['Football', 'Futsal', 'Basketball'], fac: ['Outdoor court', 'Lighting'], hours: '7:00 AM – 8:00 PM' },
    { name: 'Phuentsholing Indoor Hall', loc: 'Phuentsholing', area: 'Phuentsholing', type: 'Indoor Hall', indoor: 'Indoor', price: 450, unit: 'hour', img: IMG.badminton, sports: ['Badminton', 'Table Tennis', 'Volleyball'], fac: ['Indoor hall', 'Rackets rental', 'AC'], hours: '2:00 PM – 10:00 PM' },
    { name: 'GCIT Sports Ground', loc: 'Kuensel Phodrang, Thimphu', area: 'Thimphu', type: 'Ground', indoor: 'Outdoor', price: 600, unit: 'ground', img: IMG.cricket, sports: ['Cricket', 'Football'], fac: ['Full ground', 'Cricket nets', 'Pavilion'], hours: '6:00 AM – 7:00 PM' },
    { name: 'Dragon Gym', loc: 'Babesa, Thimphu', area: 'Thimphu', type: 'Gym', indoor: 'Indoor', price: 150, unit: 'day pass', img: IMG.gym, sports: ['Gym', 'Taekwondo', 'Fitness Class'], fac: ['Free weights', 'Machines', 'Showers'], hours: '5:30 AM – 9:30 PM', membership: [{ plan: 'Day Pass', price: 150, period: 'day' }, { plan: 'Monthly', price: 1500, period: 'month' }, { plan: 'Quarterly', price: 3800, period: '3 months' }, { plan: 'Yearly', price: 13000, period: 'year' }] },
    { name: 'Thimphu Fitness Club', loc: 'Norzin Lam, Thimphu', area: 'Thimphu', type: 'Gym', indoor: 'Indoor', price: 150, unit: 'day pass', img: IMG.gym, sports: ['Gym', 'Yoga', 'Zumba', 'Fitness Class'], fac: ['Cardio zone', 'Sauna', 'Lockers'], hours: '5:00 AM – 10:00 PM', membership: [{ plan: 'Day Pass', price: 150, period: 'day' }, { plan: 'Monthly', price: 1500, period: 'month' }, { plan: 'Yearly', price: 14000, period: 'year' }] },
    { name: 'Weekend Badminton Hall', loc: 'Motithang, Thimphu', area: 'Thimphu', type: 'Indoor Hall', indoor: 'Indoor', price: 450, unit: 'court', img: IMG.badminton, sports: ['Badminton'], fac: ['4 courts', 'Rackets rental'], hours: '3:00 PM – 10:00 PM' },
  ];
  const V = {};
  for (const v of venuesData) {
    const venue = await prisma.venue.create({
      data: {
        name: v.name, location: v.loc, area: v.area, venueType: v.type, indoor: v.indoor, pricePerHour: v.price, priceUnit: v.unit, hours: v.hours,
        rating: 4.8, reviews: 80, image: v.img, managerId: U['kencho10'], ownerId: U['kencho10'], status: 'Approved', verified: true,
        hasMembership: !!v.membership, membership: v.membership ? JSON.stringify(v.membership) : null,
        sportsList: { create: v.sports.map((s) => ({ sport: s })) },
        facilities: { create: v.fac.map((f) => ({ name: f })) },
        gallery: { create: [{ url: v.img, isHero: true, order: 0 }] },
      },
    });
    V[v.name] = venue.id;
  }
  // pre-book a slot to prove slot-locking (Changlimithang 7 PM today)
  await prisma.venueTimeSlot.create({ data: { venueId: V['Changlimithang Futsal Arena'], date: 'Today', startTime: '7:00 PM', endTime: '8:00 PM', status: 'Booked' } });

  // ── Events ──
  const eventsData = [
    { title: 'Weekend Futsal Clash', sport: 'Futsal', type: 'Tournament', loc: 'Changlimithang, Thimphu', date: 'Saturday, 7:00 PM', fee: 'Nu. 1,500/team', slots: '12/16 teams', prize: 'Nu. 20,000', status: 'Registration Open', img: IMG.event },
    { title: 'Thimphu Basketball Night', sport: 'Basketball', type: 'Friendly Match Night', loc: 'Thimphu Sports Complex', date: 'Friday, 6:00 PM', fee: 'Nu. 800/team', slots: '8/12 teams', prize: 'Nu. 10,000', status: 'Registration Open', img: IMG.court },
    { title: 'Paro Badminton Doubles', sport: 'Badminton', type: 'Tournament', loc: 'Paro', date: 'Sunday, 9:00 AM', fee: 'Nu. 300/pair', slots: '16 pairs', prize: 'Trophy + medals', status: 'Upcoming', img: IMG.badminton },
    { title: 'Dragon Gym Challenge', sport: 'Fitness Class', type: 'Gym Challenge', loc: 'Dragon Gym', date: 'Saturday, 6:00 AM', fee: 'Nu. 300', slots: '40 spots', prize: 'Membership prizes', status: 'Registration Open', img: IMG.gym },
  ];
  for (const e of eventsData) {
    await prisma.event.create({ data: { title: e.title, sport: e.sport, eventType: e.type, location: e.loc, date: e.date, fee: e.fee, slots: e.slots, prize: e.prize, status: e.status, banner: e.img, organizerId: superAdmin.id, about: `${e.title} — ${e.sport} in Bhutan.` } });
  }

  // ── Posts ──
  await prisma.post.create({ data: { authorId: S['thimphustrikers'], authorType: 'squad', squadId: S['thimphustrikers'], postType: 'Match Challenge', title: 'Strikers want a 5v5 tonight 🔥', caption: 'We have a full 5v5 futsal team ready tonight. Looking for a competitive opponent at Changlimithang. 50/50 split.', sport: 'Futsal', status: 'Looking for Opponent', teamSize: '5v5', preferredTime: 'Tonight, 7:00 PM', venueId: V['Changlimithang Futsal Arena'], venueName: 'Changlimithang Futsal Arena', paymentSplit: '50/50 Team Split', skillLevel: 'Competitive', expiry: '2h 40m', likes: 42 } });
  await prisma.post.create({ data: { authorId: S['dragonfc'], authorType: 'squad', squadId: S['dragonfc'], postType: 'Match Result', title: 'Dragon FC 5 – 3 Phoenix', caption: 'Dragon FC won 5-3 last night. Great game, great spirit. 🐉', sport: 'Futsal', result: '5 - 3', opponentName: 'Phoenix', image: IMG.feed, likes: 96 } });
  await prisma.post.create({ data: { authorId: U['ngawang927'], authorType: 'user', postType: 'Gym Progress', title: 'Week 6 — legs don\'t lie', caption: 'Six weeks into the off-season block. Squat PR today 💪', sport: 'Fitness', trainingType: 'Strength', image: IMG.gym, likes: 54 } });

  // ── A seed booking + payment + report + ticket ──
  const bk = await prisma.booking.create({ data: { userId: U['ngawang927'], squadId: S['thimphustrikers'], venueId: V['Changlimithang Futsal Arena'], sport: 'Futsal', date: 'Today', slotStart: '6:00 PM', bookingType: 'Squad Booking', participants: 5, split: '50/50 Team Split', price: 1200, status: 'Confirmed', paymentStatus: 'Paid' } });
  await prisma.venueTimeSlot.create({ data: { venueId: V['Changlimithang Futsal Arena'], date: 'Today', startTime: '6:00 PM', endTime: '7:00 PM', status: 'Booked', bookingId: bk.id } });
  await prisma.payment.create({ data: { userId: U['ngawang927'], purpose: 'Venue Booking', amount: 1200, status: 'Paid', method: 'mBoB Wallet', bookingId: bk.id } });
  await prisma.payment.create({ data: { userId: U['kencho10'], purpose: 'Gym Membership', amount: 1500, status: 'Pending', method: 'mBoB Wallet' } });
  await prisma.report.create({ data: { reporterId: U['sonamala'], type: 'Post Report', targetType: 'post', targetId: 'seed', reason: 'Spam', priority: 'Medium', status: 'Open' } });
  await prisma.supportTicket.create({ data: { userId: U['kencho10'], subject: 'Refund not received', category: 'Payment', priority: 'High', status: 'Open' } });
  await prisma.gymMembership.create({ data: { userId: U['ngawang927'], venueId: V['Dragon Gym'], plan: 'Monthly', period: 'month', price: 1500, startDate: 'Today', memberName: 'Ngawang', status: 'Active', paymentStatus: 'Paid' } });
  await prisma.adminActivityLog.create({ data: { adminId: superAdmin.id, adminRole: 'Super Admin', action: 'Seeded platform', detail: 'Initial Bhutan data' } });

  console.log('✅ Seed complete:', { users: Object.keys(U).length + 2, squads: Object.keys(S).length, venues: Object.keys(V).length, events: eventsData.length });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
