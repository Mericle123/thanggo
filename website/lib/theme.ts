// ─────────────────────────────────────────────────────────────────────────────
//  CENTRAL CONTENT / THEME CONFIG  — edit everything the site shows from here.
//  Real sport photos live in /public/sports (swap any file to rebrand).
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'ThangGo',
  tagline: 'Bhutan plays here.',
  sub: 'Book venues, build squads, draw up tactics and challenge anyone — every sport, one electric lobby.',
  appStoreUrl: 'https://apps.apple.com/app/thanggo',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.thanggo.mobile',
  location: 'Thimphu, Bhutan',
};

// ── Dark reference design content ───────────────────────────────────────────
export const ACCENT = '#A3E635'; // signature lime

export const NAV_MAIN = [
  { label: 'Home', href: '#home' },
  { label: 'Sports', href: '#sports' },
  { label: 'Venues', href: '#venues' },
  { label: 'Events', href: '#events' },
  { label: 'Community', href: '#community' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const HERO = {
  eyebrow: 'ALL SPORTS. ONE COMMUNITY.',
  lines: ['Play.', 'Compete.', 'Connect.'], // last line is accented
  sub: "Join Bhutan's most active sports platform. Find players, book venues, join events, and level up your game.",
  // right-side carousel images (top-right of the hero)
  slides: ['/sports/football.jpg', '/sports/boxing.jpg', '/sports/swimming.jpg', '/sports/volleyball.jpg'],
};

// The numbered sport bands (football is the hero = 01, so the list runs 02–10).
export const BANDS = [
  { no: '02', name: 'Basketball', l1: 'Hit the court. Feel the rhythm.', l2: 'Make every shot count.', img: '/sports/basketball.jpg', accent: '#F97316', emoji: '🏀' },
  { no: '03', name: 'Tennis', l1: 'Focus. Swing. Win.', l2: 'Every point matters.', img: '/sports/tennis.jpg', accent: '#C6F24E', emoji: '🎾' },
  { no: '04', name: 'Cricket', l1: 'Strategy. Skill. Sixes.', l2: 'Play like a champion.', img: '/sports/cricket.jpg', accent: '#EF4444', emoji: '🏏' },
  { no: '05', name: 'Volleyball', l1: 'Set it. Spike it.', l2: 'Teamwork makes it unstoppable.', img: '/sports/volleyball.jpg', accent: '#3B82F6', emoji: '🏐' },
  { no: '06', name: 'Taekwondo', l1: 'Discipline. Focus. Power.', l2: 'Train hard. Stay stronger.', img: '/sports/taekwondo.jpg', accent: '#A855F7', emoji: '🥋' },
  { no: '07', name: 'Boxing', l1: 'Punch with purpose.', l2: 'Train like a warrior.', img: '/sports/boxing.jpg', accent: '#F43F5E', emoji: '🥊' },
  { no: '08', name: 'Swimming', l1: 'Dive in. Push limits.', l2: 'Strength flows within.', img: '/sports/swimming.jpg', accent: '#22D3EE', emoji: '🏊' },
  { no: '09', name: 'Gym & Fitness', l1: 'Stronger every day.', l2: 'Better than yesterday.', img: '/sports/gym.jpg', accent: '#F59E0B', emoji: '🏋️' },
  { no: '10', name: 'Run Club', l1: 'Run together. Grow together.', l2: 'Every step counts.', img: '/sports/running.jpg', accent: '#A3E635', emoji: '🏃' },
];

export const CTA_FEATURES = [
  { icon: 'calendar', title: 'Book Venues', sub: 'Easy & fast' },
  { icon: 'users', title: 'Find Players', sub: 'Near you' },
  { icon: 'trophy', title: 'Join Events', sub: 'Compete & win' },
  { icon: 'shield', title: 'Manage Squads', sub: 'All in one place' },
];

export const SOCIALS = ['facebook', 'instagram', 'tiktok', 'x', 'youtube'] as const;

export const NAV_LINKS = [
  { label: 'Sports', href: '#sports' },
  { label: 'Venues', href: '#venues' },
  { label: 'Squads', href: '#squads' },
  { label: 'Events', href: '#events' },
  { label: 'App', href: '#app' },
  { label: 'FAQ', href: '#faq' },
];

// The scroll cinematic — football → basketball → tennis → ... each cross-fades to the
// next as you scroll the pinned section. Images are in /public/sports.
export const SEQUENCE = [
  { key: 'football',   emoji: '⚽️', label: 'Football',   line: 'Curl it top corner.',      accent: '#22C55E' },
  { key: 'basketball', emoji: '🏀', label: 'Basketball', line: 'Nothing but net.',         accent: '#FB923C' },
  { key: 'tennis',     emoji: '🎾', label: 'Tennis',     line: 'Ace down the T.',          accent: '#84CC16' },
  { key: 'cricket',    emoji: '🏏', label: 'Cricket',    line: 'Six over long-on.',        accent: '#06B6D4' },
  { key: 'volleyball', emoji: '🏐', label: 'Volleyball', line: 'Spike it home.',           accent: '#6366F1' },
  { key: 'taekwondo',  emoji: '🥋', label: 'Taekwondo',  line: 'Pin. Point. Win.',         accent: '#8B5CF6' },
  { key: 'boxing',     emoji: '🥊', label: 'Boxing',     line: 'Slip and counter.',        accent: '#F43F5E' },
  { key: 'swimming',   emoji: '🏊', label: 'Swimming',   line: 'Touch the wall first.',    accent: '#3B82F6' },
  { key: 'gym',        emoji: '🏋️', label: 'Gym',        line: 'One more rep.',             accent: '#EC4899' },
  { key: 'running',    emoji: '🏃', label: 'Run Club',   line: 'Chase the sunrise.',       accent: '#F59E0B' },
] as const;

// Sports category grid.
export const SPORTS = [
  { name: 'Football', img: '/sports/football.jpg', emoji: '⚽️', accent: '#22C55E' },
  { name: 'Futsal', img: '/sports/futsal.jpg', emoji: '🥅', accent: '#10B981' },
  { name: 'Basketball', img: '/sports/basketball.jpg', emoji: '🏀', accent: '#FB923C' },
  { name: 'Volleyball', img: '/sports/volleyball.jpg', emoji: '🏐', accent: '#6366F1' },
  { name: 'Badminton', img: '/sports/badminton.jpg', emoji: '🏸', accent: '#06B6D4' },
  { name: 'Tennis', img: '/sports/tennis.jpg', emoji: '🎾', accent: '#84CC16' },
  { name: 'Cricket', img: '/sports/cricket.jpg', emoji: '🏏', accent: '#0EA5E9' },
  { name: 'Table Tennis', img: '/sports/tabletennis.jpg', emoji: '🏓', accent: '#F43F5E' },
  { name: 'Taekwondo', img: '/sports/taekwondo.jpg', emoji: '🥋', accent: '#8B5CF6' },
  { name: 'Boxing', img: '/sports/boxing.jpg', emoji: '🥊', accent: '#EF4444' },
  { name: 'Swimming', img: '/sports/swimming.jpg', emoji: '🏊', accent: '#3B82F6' },
  { name: 'Archery', img: '/sports/archery.jpg', emoji: '🏹', accent: '#F59E0B' },
];

export const VENUES = [
  { name: 'Changlimithang Arena', area: 'Thimphu', sports: ['Football', 'Futsal'], price: 600, rating: 4.9, img: '/sports/stadium.jpg' },
  { name: 'Dragon Indoor Court', area: 'Thimphu', sports: ['Basketball', 'Badminton'], price: 450, rating: 4.8, img: '/sports/basketball.jpg' },
  { name: 'Paro Sports Complex', area: 'Paro', sports: ['Volleyball', 'Tennis'], price: 500, rating: 4.7, img: '/sports/volleyball.jpg' },
  { name: 'Olympic Aquatics', area: 'Thimphu', sports: ['Swimming'], price: 300, rating: 4.9, img: '/sports/swimming.jpg' },
];

export const OPPONENTS = [
  { squad: 'Thimphu Strikers', sport: 'Futsal', level: 'Competitive', when: 'Tonight · 7 PM', venue: 'Changlimithang', accent: '#22C55E' },
  { squad: 'Phoenix Ballers', sport: 'Basketball', level: 'Intermediate', when: 'Sat · 5 PM', venue: 'Dragon Court', accent: '#FB923C' },
  { squad: 'Paro Spikers', sport: 'Volleyball', level: 'Pro', when: 'Sun · 4 PM', venue: 'Paro Complex', accent: '#6366F1' },
];

export const FORMATIONS: Record<string, { x: number; y: number; role: string }[]> = {
  '4-3-3': [
    { x: 50, y: 90, role: 'GK' },
    { x: 18, y: 70, role: 'LB' }, { x: 40, y: 73, role: 'CB' }, { x: 60, y: 73, role: 'CB' }, { x: 82, y: 70, role: 'RB' },
    { x: 30, y: 48, role: 'CM' }, { x: 50, y: 52, role: 'CM' }, { x: 70, y: 48, role: 'CM' },
    { x: 22, y: 24, role: 'LW' }, { x: 50, y: 20, role: 'ST' }, { x: 78, y: 24, role: 'RW' },
  ],
  '4-4-2': [
    { x: 50, y: 90, role: 'GK' },
    { x: 18, y: 72, role: 'LB' }, { x: 40, y: 74, role: 'CB' }, { x: 60, y: 74, role: 'CB' }, { x: 82, y: 72, role: 'RB' },
    { x: 18, y: 48, role: 'LM' }, { x: 40, y: 50, role: 'CM' }, { x: 60, y: 50, role: 'CM' }, { x: 82, y: 48, role: 'RM' },
    { x: 38, y: 22, role: 'ST' }, { x: 62, y: 22, role: 'ST' },
  ],
  '3-5-2': [
    { x: 50, y: 90, role: 'GK' },
    { x: 30, y: 73, role: 'CB' }, { x: 50, y: 75, role: 'CB' }, { x: 70, y: 73, role: 'CB' },
    { x: 14, y: 50, role: 'LWB' }, { x: 36, y: 52, role: 'CM' }, { x: 50, y: 48, role: 'CM' }, { x: 64, y: 52, role: 'CM' }, { x: 86, y: 50, role: 'RWB' },
    { x: 38, y: 22, role: 'ST' }, { x: 62, y: 22, role: 'ST' },
  ],
};

export const FEED = [
  { user: 'Sonam D.', handle: '@sonam', sport: '⚽️', text: 'We just qualified for the Futsal League quarters! 🔥', likes: 248, img: '/sports/football.jpg' },
  { user: 'Tashi W.', handle: '@tashi', sport: '🏀', text: 'New PB on the court tonight. Who’s next? 🏆', likes: 132, img: '/sports/basketball.jpg' },
  { user: 'Deki P.', handle: '@deki', sport: '🏊', text: '6 AM laps before work. Run club at 6 PM. Let’s move.', likes: 96, img: '/sports/swimming.jpg' },
];

export const EVENTS = [
  { title: 'Bhutan Futsal League 2026', date: 'Jul 12', tag: 'Tournament', spots: '24 squads', img: '/sports/futsal.jpg', accent: '#22C55E' },
  { title: 'Thimphu Open Basketball', date: 'Aug 03', tag: 'Open Play', spots: '16 teams', img: '/sports/basketball.jpg', accent: '#FB923C' },
  { title: 'Paro Volleyball Cup', date: 'Aug 20', tag: 'Cup', spots: '12 teams', img: '/sports/volleyball.jpg', accent: '#6366F1' },
];

export const GYM_PLANS = [
  { name: 'Day Pass', price: 150, period: 'day', perks: ['Full gym access', 'Locker & towel', 'No commitment'], featured: false },
  { name: 'Monthly', price: 1800, period: 'month', perks: ['Unlimited access', '2 trainer sessions', 'Group classes', 'Pause anytime'], featured: true },
  { name: 'Annual', price: 16000, period: 'year', perks: ['Everything monthly', '12 trainer sessions', 'Nutrition plan', 'Guest passes'], featured: false },
];

export const APP_FEATURES = [
  { icon: '📅', title: 'Book in seconds', body: 'Pick a venue, date and exact slot. Live availability, 6 AM–midnight.' },
  { icon: '🛡️', title: 'Run your squad', body: 'Invite players, set roles and chat in real time.' },
  { icon: '⚡️', title: 'Challenge anyone', body: 'Post a challenge, fill the lobby, settle the split.' },
  { icon: '🏆', title: 'Join events', body: 'Tournaments, leagues and open-play in one feed.' },
];

export const TESTIMONIALS = [
  { name: 'Karma T.', role: 'Squad Captain', quote: 'Booked a pitch, found rivals and settled the split — all before dinner. ThangGo is how Bhutan plays now.', emoji: '⚽️' },
  { name: 'Pema L.', role: 'Venue Owner', quote: 'My court is full every evening. The booking flow just works and payments land instantly.', emoji: '🏀' },
  { name: 'Jigme N.', role: 'Runner', quote: 'Joined a run club through the feed and never looked back. The community is unreal.', emoji: '🏃' },
  { name: 'Choki W.', role: 'Volleyball Pro', quote: 'Tactics board on the phone, lineup locked, opponents lining up. It feels premium.', emoji: '🏐' },
];

export const STATS = [
  { value: 12000, suffix: '+', label: 'Players' },
  { value: 80, suffix: '+', label: 'Venues' },
  { value: 5400, suffix: '+', label: 'Matches' },
  { value: 12, suffix: '', label: 'Sports' },
];

export const FAQ = [
  { q: 'Is ThangGo free to download?', a: 'Yes — the app is free. You only pay for the venues, sessions or memberships you book.' },
  { q: 'Which sports are supported?', a: 'Football, futsal, basketball, volleyball, badminton, tennis, table tennis, cricket, taekwondo, boxing, swimming, archery and more.' },
  { q: 'Can I book a venue without a squad?', a: 'Absolutely. Solo bookings, gym slots and classes are one tap. Build a squad whenever you’re ready.' },
  { q: 'How do payments work?', a: 'Pay in-app with mBoB and other local methods. Match costs can be split 50/50, per-player or host-pays.' },
  { q: 'Is ThangGo only in Thimphu?', a: 'It started in Thimphu and Paro and is rolling out across Bhutan. New venues are added every week.' },
];
