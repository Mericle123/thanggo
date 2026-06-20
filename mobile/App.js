// ThangGo — Premium Bhutan Sports App v3.0
// Single-file Expo React Native app: Instagram feed + FIFA/Valorant lobby +
// Airbnb booking + interactive multi-sport 3D tactics planner.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, FlatList, Image, ImageBackground,
  KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api, connectSocket, disconnectSocket, onSocket, loadSession } from './src/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F4FF',
  card: '#FFFFFF',
  navy: '#0B1F4D',
  navyDark: '#060D26',
  navyCard: '#0D2256',
  navyLine: '#1C336E',
  blue: '#1A5FFF',
  blueLight: '#4B8DFF',
  bluePale: '#EAF0FF',
  blueDeep: '#0D3DBF',
  green: '#00C96A',
  greenDeep: '#00A557',
  greenPale: '#E5FFF3',
  lime: '#B7F542',
  limePale: '#F3FFD7',
  text: '#0B1F4D',
  textMid: '#2D4480',
  muted: '#6B7DB3',
  mutedLight: '#A0B0D0',
  white: '#FFFFFF',
  success: '#00C96A',
  warning: '#FFB020',
  danger: '#FF4553',
  border: '#DDE6FF',
  borderLight: '#EEF2FF',
  wood: '#C8743A',
  woodDark: '#A85A28',
  clay: '#D98248',
};
const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;
const IS_WIDE = Platform.OS === 'web' && W > 520;
const CW = IS_WIDE ? 460 : W; // content width

// ─── Image assets ───────────────────────────────────────────────────────────--
const IMG = {
  stadium: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  futsal:  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
  court:   'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
  badminton:'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80',
  volley:  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1000&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=80',
  event:   'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=80',
  feed:    'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1000&q=80',
  gym:     'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80',
  hero:    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
  pool:    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
  yoga:    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
  complex: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=1000&q=80',
};

// ─── Seed users ───────────────────────────────────────────────────────────────
const currentUser = {
  id: 'u-ngawang', name: 'Ngawang', username: 'ngawang927',
  location: 'Thimphu', mainSport: 'Futsal', skillLevel: 'Competitive',
  rating: 4.8, followers: 1200, following: 214, availability: 'Evenings',
};

// Populated from the backend after login. Mutated IN PLACE so every existing reference to
// `currentUser` (and the `users` array entry below, which shares this object) reflects the
// signed-in account without touching the ~40 call sites.
function applyBackendUser(u) {
  if (!u) return currentUser;
  const p = u.profile || {};
  Object.assign(currentUser, {
    id: u.id || currentUser.id, email: u.email, role: u.role,
    name: p.name || currentUser.name,
    username: p.username || currentUser.username,
    location: p.location || currentUser.location,
    mainSport: p.mainSport || currentUser.mainSport,
    skillLevel: p.skillLevel || currentUser.skillLevel,
    availability: p.availability || currentUser.availability,
    rating: p.rating != null ? p.rating : currentUser.rating,
    followers: p.followers != null ? p.followers : currentUser.followers,
    following: p.following != null ? p.following : currentUser.following,
    photo: p.photo || currentUser.photo,
    bio: p.bio != null ? p.bio : currentUser.bio,
    playingStyle: p.playingStyle != null ? p.playingStyle : currentUser.playingStyle,
    completed: p.completed,
  });
  return currentUser;
}

// Relative-time for backend ISO timestamps → "just now / 5m ago / 2h ago / 3d ago".
function relTime(iso) {
  if (!iso) return 'just now';
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  if (!t) return 'just now';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
  return new Date(t).toLocaleDateString();
}

const users = [
  currentUser,
  { id:'u-kencho', name:'Kencho P.', username:'kencho10', location:'Thimphu', mainSport:'Futsal', skillLevel:'Competitive', rating:4.9, followers:540, following:120, availability:'Available' },
  { id:'u-sonam', name:'Sonam T.', username:'sonamala', location:'Thimphu', mainSport:'Futsal', skillLevel:'Competitive', rating:4.7, followers:430, following:98, availability:'Available' },
  { id:'u-tashi', name:'Tashi D.', username:'tashipivot', location:'Thimphu', mainSport:'Futsal', skillLevel:'Competitive', rating:4.6, followers:610, following:201, availability:'Available' },
  { id:'u-jigme', name:'Jigme L.', username:'jigmegk', location:'Thimphu', mainSport:'Futsal', skillLevel:'Intermediate', rating:4.5, followers:280, following:150, availability:'Maybe' },
  { id:'u-pema', name:'Pema W.', username:'pema17', location:'Paro', mainSport:'Badminton', skillLevel:'Pro', rating:4.9, followers:920, following:60, availability:'Available' },
  { id:'u-dorji', name:'Dorji N.', username:'dorjidunks', location:'Thimphu', mainSport:'Basketball', skillLevel:'Competitive', rating:4.8, followers:710, following:88, availability:'Available' },
  { id:'u-karma', name:'Karma Y.', username:'karmaspike', location:'Thimphu', mainSport:'Volleyball', skillLevel:'Competitive', rating:4.7, followers:330, following:140, availability:'Evenings' },
  { id:'u-ugyen', name:'Ugyen D.', username:'ugyenbat', location:'Paro', mainSport:'Cricket', skillLevel:'Intermediate', rating:4.6, followers:260, following:175, availability:'Weekends' },
  { id:'u-deki', name:'Deki C.', username:'dekismash', location:'Thimphu', mainSport:'Badminton', skillLevel:'Intermediate', rating:4.5, followers:190, following:210, availability:'Available' },
];

// ─── Seed squads ──────────────────────────────────────────────────────────────
const initialSquads = [
  {
    id:'s-strikers', name:'Thimphu Strikers', handle:'thimphustrikers', sport:'Futsal', location:'Thimphu',
    skillLevel:'Competitive', captainId:'u-kencho', viceCaptainId:'u-ngawang',
    wins:12, losses:4, draws:2, rating:4.8, followers:860,
    description:'High-press futsal squad based around Changlimithang. We compete hard, we play fair.',
    members:[
      { userId:'u-kencho', role:'Fixo', availability:'Available', isCaptain:true },
      { userId:'u-ngawang', role:'Ala', availability:'Available', isViceCaptain:true },
      { userId:'u-sonam', role:'Ala', availability:'Available' },
      { userId:'u-tashi', role:'Pivot', availability:'Available' },
      { userId:'u-jigme', role:'Goalkeeper', availability:'Maybe' },
      { userId:'u-dorji', role:'Substitute', availability:'Available' },
    ],
  },
  {
    id:'s-dragon', name:'Dragon FC', handle:'dragonfc', sport:'Futsal', location:'Thimphu',
    skillLevel:'Competitive', captainId:'u-tashi', wins:10, losses:5, draws:1,
    rating:4.7, followers:690, description:'Fast counter-attack team looking for serious opponents every weekend.',
    members:[
      { userId:'u-tashi', role:'Pivot', availability:'Available', isCaptain:true },
      { userId:'u-kencho', role:'Fixo', availability:'Available' },
      { userId:'u-sonam', role:'Ala', availability:'Available' },
      { userId:'u-jigme', role:'Goalkeeper', availability:'Available' },
      { userId:'u-ngawang', role:'Ala', availability:'Available' },
      { userId:'u-deki', role:'Substitute', availability:'Maybe' },
    ],
  },
  {
    id:'s-paro', name:'Paro Warriors', handle:'parowarriors', sport:'Football', location:'Paro',
    skillLevel:'Intermediate', captainId:'u-pema', wins:7, losses:3, draws:3,
    rating:4.6, followers:420, description:'Weekend football group around Paro community ground. All levels welcome.',
    members:[
      { userId:'u-pema', role:'ST', availability:'Available', isCaptain:true },
      { userId:'u-ugyen', role:'CM', availability:'Weekends' },
      { userId:'u-dorji', role:'CB', availability:'Available' },
    ],
  },
  {
    id:'s-hoopers', name:'Thunder Hoopers', handle:'thunderhoopers', sport:'Basketball', location:'Thimphu',
    skillLevel:'Competitive', captainId:'u-dorji', wins:15, losses:6, draws:0,
    rating:4.8, followers:580, description:'Babesa basketball crew. Run-and-gun, full-court press. 3v3 and 5v5.',
    members:[
      { userId:'u-dorji', role:'PG', availability:'Available', isCaptain:true },
      { userId:'u-kencho', role:'SG', availability:'Available' },
      { userId:'u-sonam', role:'SF', availability:'Available' },
      { userId:'u-tashi', role:'PF', availability:'Maybe' },
      { userId:'u-jigme', role:'C', availability:'Available' },
    ],
  },
  {
    id:'s-spikers', name:'Druk Spikers', handle:'drukspikers', sport:'Volleyball', location:'Thimphu',
    skillLevel:'Competitive', captainId:'u-karma', wins:9, losses:4, draws:0,
    rating:4.7, followers:360, description:'Olakha volleyball squad. 6-a-side, serious rotations, friendly vibes.',
    members:[
      { userId:'u-karma', role:'Setter', availability:'Available', isCaptain:true },
      { userId:'u-sonam', role:'Outside Hitter', availability:'Available' },
      { userId:'u-deki', role:'Libero', availability:'Available' },
      { userId:'u-dorji', role:'Middle Blocker', availability:'Available' },
      { userId:'u-pema', role:'Opposite', availability:'Maybe' },
      { userId:'u-ugyen', role:'Outside Hitter', availability:'Available' },
    ],
  },
  {
    id:'s-cricketxi', name:'Thimphu Cricket XI', handle:'thimphucricket', sport:'Cricket', location:'Thimphu',
    skillLevel:'Intermediate', captainId:'u-ugyen', wins:6, losses:5, draws:2,
    rating:4.5, followers:240, description:'GCIT ground cricket side. Tape-ball and leather. Always recruiting.',
    members:[
      { userId:'u-ugyen', role:'All-rounder', availability:'Weekends', isCaptain:true },
      { userId:'u-pema', role:'Batter', availability:'Available' },
      { userId:'u-dorji', role:'Bowler', availability:'Available' },
    ],
  },
  {
    id:'s-smashers', name:'Weekend Smashers', handle:'weekendsmashers', sport:'Badminton', location:'Thimphu',
    skillLevel:'Casual', captainId:'u-pema', wins:18, losses:6, draws:0,
    rating:4.9, followers:350, description:'Badminton doubles and open play squad. Olakha hall most evenings.',
    members:[
      { userId:'u-pema', role:'Front', availability:'Available', isCaptain:true },
      { userId:'u-deki', role:'Back', availability:'Available' },
    ],
  },
];

// ─── Venues ───────────────────────────────────────────────────────────────────
// Default slot start times (each slot is 1 hour). Status overlaid from bookings + preset.
const EVE_SLOTS = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
const DAY_SLOTS = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];
const venues = [
  {
    id:'v-chang', name:'Changlimithang Futsal Arena', location:'Changlimithang, Thimphu', area:'Thimphu',
    sports:['Futsal','Football'], venueType:'Court', indoor:'Indoor', pricePerHour:1200, priceUnit:'court',
    slotTimes:['5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'], preset:{ '7:00 PM':'Booked', '8:00 PM':'Almost Full' },
    rating:4.9, reviews:128, image:IMG.futsal, images:[IMG.futsal, IMG.stadium, IMG.hero], followers:540,
    hours:'6:00 AM – 10:00 PM', managerId:'u-kencho',
    facilities:['Indoor court','Changing room','Parking','Flood lights','Drinking water'],
    rules:'Non-marking shoes required. Confirm payment before match lock. No metal studs.',
  },
  {
    id:'v-complex', name:'Thimphu Sports Complex', location:'Chubachu, Thimphu', area:'Thimphu',
    sports:['Basketball','Volleyball','Badminton','Futsal'], venueType:'Sports Club', indoor:'Indoor', pricePerHour:900, priceUnit:'court',
    slotTimes:DAY_SLOTS, preset:{ '8:00 AM':'Booked', '6:00 PM':'Almost Full', '7:00 PM':'Booked' },
    rating:4.8, reviews:156, image:IMG.complex, images:[IMG.complex, IMG.court, IMG.volley], followers:720,
    hours:'6:00 AM – 9:00 PM', managerId:'u-dorji', hasClasses:true, hasMembership:true,
    facilities:['Multi-court','Changing rooms','Parking','Cafe','Pro shop','Showers'],
    rules:'Members get priority booking. Indoor shoes only.',
    membership:[{ plan:'Day Pass', price:150, period:'day' },{ plan:'Monthly', price:1500, period:'month' },{ plan:'Quarterly', price:4000, period:'3 months' },{ plan:'Yearly', price:14000, period:'year' }],
    benefits:['All courts access','2 guest passes/month','10% pro-shop discount','Priority slot booking'],
    classes:[{ name:'Zumba', sport:'Zumba', time:'6:00 AM', days:'Mon/Wed/Fri', seats:6, cap:15, fee:300 },{ name:'Open Volleyball', sport:'Volleyball', time:'7:00 PM', days:'Tue/Thu', seats:9, cap:12, fee:200 }],
    trainers:[{ name:'Karma Y.', focus:'Strength & Conditioning', rate:500 },{ name:'Deki C.', focus:'Agility & Speed', rate:450 }],
  },
  {
    id:'v-paro', name:'Paro Community Court', location:'Paro Town', area:'Paro',
    sports:['Football','Futsal','Basketball'], venueType:'Court', indoor:'Outdoor', pricePerHour:600, priceUnit:'court',
    slotTimes:DAY_SLOTS, preset:{ '9:00 AM':'Closed', '5:00 PM':'Almost Full' },
    rating:4.6, reviews:48, image:IMG.court, images:[IMG.court, IMG.feed], followers:210,
    hours:'7:00 AM – 8:00 PM', managerId:'u-pema',
    facilities:['Outdoor court','Lighting','Parking','Water'],
    rules:'Community ground. Book ahead on weekends.',
  },
  {
    id:'v-pling', name:'Phuentsholing Indoor Hall', location:'Phuentsholing', area:'Phuentsholing',
    sports:['Badminton','Table Tennis','Volleyball'], venueType:'Indoor Hall', indoor:'Indoor', pricePerHour:450, priceUnit:'hour',
    slotTimes:EVE_SLOTS, preset:{ '6:00 PM':'Almost Full', '8:00 PM':'Booked' },
    rating:4.7, reviews:73, image:IMG.badminton, images:[IMG.badminton, IMG.volley], followers:260,
    hours:'2:00 PM – 10:00 PM', managerId:'u-deki', hasClasses:true,
    facilities:['Indoor hall','Rackets rental','Showers','Seating','AC'],
    rules:'Court shoes required. Max 4 per badminton court.',
    classes:[{ name:'Badminton Coaching', sport:'Badminton', time:'5:00 PM', days:'Mon–Fri', seats:4, cap:8, fee:300 }],
  },
  {
    id:'v-gcit', name:'GCIT Sports Ground', location:'Kuensel Phodrang, Thimphu', area:'Thimphu',
    sports:['Cricket','Football'], venueType:'Ground', indoor:'Outdoor', pricePerHour:600, priceUnit:'ground',
    slotTimes:['7:00 AM','9:00 AM','11:00 AM','3:00 PM','5:00 PM'], preset:{ '11:00 AM':'Closed', '5:00 PM':'Almost Full' },
    rating:4.6, reviews:42, image:IMG.cricket, images:[IMG.cricket, IMG.hero], followers:180,
    hours:'6:00 AM – 7:00 PM', managerId:'u-ugyen',
    facilities:['Full ground','Cricket nets','Parking','Pavilion'],
    rules:'Leather ball with pads only. Book full ground for matches.',
  },
  {
    id:'v-fitclub', name:'Thimphu Fitness Club', location:'Norzin Lam, Thimphu', area:'Thimphu',
    sports:['Gym','Fitness Class','Yoga','Zumba'], venueType:'Gym', indoor:'Indoor', pricePerHour:150, priceUnit:'day pass',
    slotTimes:DAY_SLOTS, preset:{ '6:00 AM':'Almost Full' },
    rating:4.8, reviews:201, image:IMG.gym, images:[IMG.gym, IMG.yoga], followers:880,
    hours:'5:00 AM – 10:00 PM', managerId:'u-karma', hasMembership:true, hasClasses:true,
    facilities:['Free weights','Cardio zone','Functional area','Sauna','Showers','Lockers'],
    rules:'Carry a towel. Re-rack your weights. Day pass valid for one visit.',
    membership:[{ plan:'Day Pass', price:150, period:'day' },{ plan:'Monthly', price:1500, period:'month' },{ plan:'Quarterly', price:4000, period:'3 months' },{ plan:'Yearly', price:14000, period:'year' }],
    benefits:['Full gym access','Free fitness assessment','1 PT session/month','Group classes included'],
    classes:[{ name:'Morning Yoga', sport:'Yoga', time:'6:00 AM', days:'Mon–Sat', seats:5, cap:15, fee:300 },{ name:'Zumba Burn', sport:'Zumba', time:'6:00 PM', days:'Mon/Wed/Fri', seats:8, cap:20, fee:300 },{ name:'HIIT Fitness', sport:'Fitness Class', time:'7:00 AM', days:'Tue/Thu/Sat', seats:10, cap:18, fee:250 }],
    trainers:[{ name:'Karma Y.', focus:'Hypertrophy & Strength', rate:600 },{ name:'Dorji N.', focus:'Weight Loss & Conditioning', rate:550 }],
  },
  {
    id:'v-dragon', name:'Dragon Gym', location:'Babesa, Thimphu', area:'Thimphu',
    sports:['Gym','Taekwondo','Fitness Class'], venueType:'Gym', indoor:'Indoor', pricePerHour:150, priceUnit:'day pass',
    slotTimes:DAY_SLOTS, preset:{ '7:00 PM':'Almost Full' },
    rating:4.7, reviews:134, image:IMG.gym, images:[IMG.gym], followers:560,
    hours:'5:30 AM – 9:30 PM', managerId:'u-dorji', hasMembership:true, hasClasses:true,
    facilities:['Free weights','Machines','Boxing area','Taekwondo mat','Showers'],
    rules:'Members only after 8 PM. Day passes welcome 6 AM–8 PM.',
    membership:[{ plan:'Day Pass', price:150, period:'day' },{ plan:'Monthly', price:1500, period:'month' },{ plan:'Quarterly', price:3800, period:'3 months' },{ plan:'Yearly', price:13000, period:'year' }],
    benefits:['Full gym access','Taekwondo classes','Locker included','Free trial PT'],
    classes:[{ name:'Taekwondo Basics', sport:'Taekwondo', time:'5:00 PM', days:'Mon/Wed/Fri', seats:6, cap:16, fee:350 },{ name:'Power Fitness', sport:'Fitness Class', time:'6:00 AM', days:'Daily', seats:12, cap:20, fee:200 }],
    trainers:[{ name:'Tashi D.', focus:'Boxing & Conditioning', rate:550 }],
  },
  {
    id:'v-aqua', name:'Thimphu Aqua Center', location:'Changzamtog, Thimphu', area:'Thimphu',
    sports:['Swimming'], venueType:'Pool', indoor:'Indoor', pricePerHour:200, priceUnit:'lane',
    slotTimes:DAY_SLOTS, preset:{ '8:00 AM':'Booked', '6:00 PM':'Almost Full' },
    rating:4.5, reviews:58, image:IMG.pool, images:[IMG.pool], followers:240,
    hours:'6:00 AM – 8:00 PM', managerId:'u-sonam', hasClasses:true,
    facilities:['25m pool','Lane ropes','Changing rooms','Lifeguard','Hot showers'],
    rules:'Swim caps required. Lane booking is per swimmer.',
    classes:[{ name:'Learn to Swim', sport:'Swimming', time:'4:00 PM', days:'Mon/Wed/Fri', seats:3, cap:6, fee:400 }],
  },
  {
    id:'v-badhall', name:'Weekend Badminton Hall', location:'Motithang, Thimphu', area:'Thimphu',
    sports:['Badminton'], venueType:'Indoor Hall', indoor:'Indoor', pricePerHour:450, priceUnit:'court',
    slotTimes:EVE_SLOTS, preset:{ '7:00 PM':'Booked' },
    rating:4.9, reviews:88, image:IMG.badminton, images:[IMG.badminton], followers:350,
    hours:'3:00 PM – 10:00 PM', managerId:'u-pema',
    facilities:['4 courts','Rackets rental','Seating','Water'],
    rules:'Court shoes only. Doubles preferred during peak hours.',
  },
];
const VENUE_TYPES = ['Court', 'Ground', 'Gym', 'Pool', 'Indoor Hall', 'Training Class', 'Event Space', 'Sports Club'];
const SLOT_TONE = { Available: 'green', Selected: 'blue', Pending: 'orange', 'Almost Full': 'orange', Booked: 'red', Closed: 'navy' };

// ─── Events ───────────────────────────────────────────────────────────────────
const eventSeed = [
  {
    id:'e-futsal', title:'Bhutan Futsal League 2025', sport:'Futsal',
    location:'Changlimithang, Thimphu', date:'Saturday, 7:00 PM',
    fee:'Nu. 1,500/team', slots:'12/16 teams', prize:'Nu. 20,000 + trophy',
    status:'Registration Open', image:IMG.event, followers:1240,
    about:'The biggest futsal tournament in Thimphu returns. Group stage Saturday, knockouts Sunday.',
  },
  {
    id:'e-fitness', title:'Thimphu Fitness Sprint', sport:'Fitness',
    location:'Clock Tower Square', date:'Sunday, 6:00 AM',
    fee:'Free', slots:'80 runners', prize:'Community ranking badge',
    status:'Upcoming', image:IMG.gym, followers:430,
    about:'5K community run + open-air HIIT session. Free entry, all fitness levels.',
  },
  {
    id:'e-hoops', title:'Babesa 3x3 Hoops Jam', sport:'Basketball',
    location:'Royal Basketball Hub', date:'Friday, 5:30 PM',
    fee:'Nu. 800/team', slots:'8/12 teams', prize:'Nu. 10,000',
    status:'Registration Open', image:IMG.court, followers:560,
    about:'Fast 3x3 streetball jam under the lights. First to 21 or 10 minutes.',
  },
];

// ─── Posts (7 types) ─────────────────────────────────────────────────────────-
const initialPosts = [
  {
    id:'mp-1', createdBy:'s-strikers', authorType:'squad', postType:'Match Challenge', sport:'Futsal',
    title:'Strikers want a 5v5 tonight 🔥',
    caption:'We have a full 5v5 futsal team ready tonight. Looking for a competitive opponent at Changlimithang. 50/50 split, serious teams only.',
    location:'Thimphu', preferredTime:'Tonight, 7:00 PM', venueId:'v-chang',
    venueName:'Changlimithang Futsal Arena', teamSize:'5v5', skillLevel:'Competitive',
    paymentSplit:'50/50 Team Split', status:'Looking for Opponent', expiry:'2h 40m',
    requests:['mr-1'], likes:42, createdAt:'12 min ago',
  },
  {
    id:'mp-2', createdBy:'s-hoopers', authorType:'squad', postType:'Match Challenge', sport:'Basketball',
    title:'Thunder Hoopers — full court 5v5',
    caption:'Babesa court booked 7:30 PM. Need a 5v5 opponent that can run. Loser pays the court 👀',
    location:'Thimphu', preferredTime:'Today, 7:30 PM', venueId:'v-complex',
    venueName:'Thimphu Sports Complex', teamSize:'5v5', skillLevel:'Competitive',
    paymentSplit:'Loser Pays', status:'Looking for Opponent', expiry:'4h 10m',
    requests:[], likes:31, createdAt:'25 min ago',
  },
  {
    id:'mp-3', createdBy:'s-smashers', authorType:'squad', postType:'Squad Recruitment', sport:'Badminton',
    title:'Need 2 for doubles tonight',
    caption:'Need 2 players for badminton doubles this evening at Olakha. Casual to intermediate welcome. Rackets can be rented.',
    location:'Thimphu', preferredTime:'Today, 6:00 PM', venueId:'v-badhall',
    venueName:'Weekend Badminton Hall', teamSize:'2v2', skillLevel:'Intermediate',
    paymentSplit:'Per Player Split', status:'Open', expiry:'1h 20m',
    requests:[], likes:18, createdAt:'28 min ago',
  },
  {
    id:'feed-1', authorType:'squad', createdBy:'s-dragon', postType:'Match Result', sport:'Futsal',
    title:'Dragon FC 5 – 3 Phoenix',
    caption:'Dragon FC won 5-3 last night. Great game, great spirit. Thimphu Strikers — rematch this weekend? 🐉',
    location:'Thimphu', image:IMG.feed, likes:96, createdAt:'1 day ago', result:'5 - 3',
  },
  {
    id:'feed-2', authorType:'user', createdBy:'u-ngawang', postType:'Gym Progress', sport:'Fitness',
    title:'Week 6 — legs don\'t lie',
    caption:'Six weeks into the off-season block. Squat PR today 💪 Building base for futsal season. Who else is grinding?',
    location:'Thimphu', image:IMG.gym, likes:54, createdAt:'3 hours ago',
  },
  {
    id:'feed-3', authorType:'user', createdBy:'u-pema', postType:'Venue Review', sport:'Badminton',
    title:'Weekend Badminton Hall — 5★',
    caption:'Floor is grippy, lighting is excellent, and the rental rackets are actually decent now. Best badminton value in Thimphu at Nu. 450/hr.',
    location:'Thimphu', venueId:'v-badhall', venueName:'Weekend Badminton Hall',
    image:IMG.badminton, likes:40, createdAt:'5 hours ago', rating:5,
  },
];

const initialRequests = [
  {
    id:'mr-1', postId:'mp-1', requestingSquadId:'s-dragon', hostSquadId:'s-strikers',
    message:'Dragon FC has 5 ready. Competitive game, 50/50 split accepted. We can be there by 6:45.',
    status:'Pending', createdAt:'8 min ago',
  },
];

// ─── Comments seed ────────────────────────────────────────────────────────────
const initialComments = {
  'mp-1': [
    { id:'c1', userId:'u-tashi', text:'We\'re in. Dragon FC can field a full 5.', likes:4, liked:false, at:'10 min ago', replies:[
      { id:'c1r1', userId:'u-kencho', text:'Let\'s gooo. Request sent through the lobby.', at:'8 min ago' },
    ]},
    { id:'c2', userId:'u-dorji', text:'Good luck both teams 🔥', likes:2, liked:false, at:'6 min ago', replies:[] },
  ],
  'feed-1': [
    { id:'c3', userId:'u-ngawang', text:'Great game! Rematch Saturday for sure.', likes:7, liked:false, at:'20 hours ago', replies:[] },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getUser  = id => users.find(u => u.id === id) || users[0];
const getSquad = (squads, id) => squads.find(s => s.id === id) || squads[0];
const getVenue = id => venues.find(v => v.id === id) || venues[0];
const money    = v => `Nu. ${Number(v).toLocaleString('en-US')}`;
const clamp    = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
let _uid = 100;
const uid = p => `${p || 'id'}-${++_uid}`;
const initials = name => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function statusTone(status) {
  if (!status) return 'blue';
  if (['Open','Registration Open','Paid','Ready to Lock','Match Locked','Completed','Accepted','Available','Opponent Accepted'].includes(status)) return 'green';
  if (['Pending','Looking for Opponent','Waiting for Payment','Waiting for Lineup','Maybe','Upcoming','Partially Paid'].includes(status)) return 'orange';
  if (['Rejected','Cancelled','Failed','Not available','Disputed'].includes(status)) return 'red';
  return 'blue';
}

// ─── Sport board configs (tactics) ────────────────────────────────────────────
// Each formation is an array of {r:role, x:%, y:%, cap?:bool}. y near 100 = own end.
const BOARDS = {
  Futsal: {
    surface:'pitch', accent:C.green, players:5, teamSize:'5v5',
    formations:{
      '1-2-1':[{r:'GK',x:50,y:91},{r:'Fixo',x:50,y:70},{r:'L Ala',x:24,y:48},{r:'R Ala',x:76,y:48},{r:'Pivot',x:50,y:26}],
      '2-2':[{r:'GK',x:50,y:91},{r:'Fixo',x:30,y:68},{r:'Fixo',x:70,y:68},{r:'L Ala',x:30,y:36},{r:'R Ala',x:70,y:36}],
      '3-1':[{r:'GK',x:50,y:91},{r:'L Ala',x:24,y:66},{r:'Fixo',x:50,y:71},{r:'R Ala',x:76,y:66},{r:'Pivot',x:50,y:30}],
      '1-1-2':[{r:'GK',x:50,y:91},{r:'Fixo',x:50,y:72},{r:'Pivot',x:50,y:50},{r:'L Ala',x:34,y:26},{r:'R Ala',x:66,y:26}],
      'Press High':[{r:'GK',x:50,y:88},{r:'Fixo',x:50,y:60},{r:'L Ala',x:20,y:38},{r:'R Ala',x:80,y:38},{r:'Pivot',x:50,y:18}],
      'Balanced':[{r:'GK',x:50,y:90},{r:'Fixo',x:50,y:68},{r:'L Ala',x:26,y:46},{r:'R Ala',x:74,y:46},{r:'Pivot',x:50,y:26}],
      'Defensive':[{r:'GK',x:50,y:92},{r:'Fixo',x:30,y:74},{r:'Fixo',x:70,y:74},{r:'Pivot',x:50,y:56},{r:'Pivot',x:50,y:40}],
      'Counter Attack':[{r:'GK',x:50,y:90},{r:'Fixo',x:50,y:74},{r:'L Ala',x:28,y:54},{r:'Pivot',x:40,y:28},{r:'R Ala',x:62,y:26}],
    },
    tactics:['High Press','Low Block','Wing Overload','Quick Restart','Man Mark','Pivot Play'],
  },
  Football: {
    surface:'pitch', accent:C.green, players:11, teamSize:'11v11',
    formations:{
      '4-4-2':[{r:'GK',x:50,y:93},{r:'LB',x:16,y:76},{r:'CB',x:38,y:80},{r:'CB',x:62,y:80},{r:'RB',x:84,y:76},{r:'LM',x:18,y:50},{r:'CM',x:40,y:54},{r:'CM',x:60,y:54},{r:'RM',x:82,y:50},{r:'ST',x:40,y:24},{r:'ST',x:60,y:24}],
      '4-3-3':[{r:'GK',x:50,y:93},{r:'LB',x:16,y:76},{r:'CB',x:38,y:80},{r:'CB',x:62,y:80},{r:'RB',x:84,y:76},{r:'CM',x:30,y:54},{r:'CM',x:50,y:58},{r:'CM',x:70,y:54},{r:'LW',x:22,y:26},{r:'ST',x:50,y:20},{r:'RW',x:78,y:26}],
      '3-5-2':[{r:'GK',x:50,y:93},{r:'CB',x:30,y:80},{r:'CB',x:50,y:82},{r:'CB',x:70,y:80},{r:'LWB',x:13,y:54},{r:'CM',x:38,y:56},{r:'CM',x:50,y:60},{r:'CM',x:62,y:56},{r:'RWB',x:87,y:54},{r:'ST',x:40,y:24},{r:'ST',x:60,y:24}],
      '4-2-3-1':[{r:'GK',x:50,y:93},{r:'LB',x:16,y:76},{r:'CB',x:38,y:80},{r:'CB',x:62,y:80},{r:'RB',x:84,y:76},{r:'DM',x:38,y:60},{r:'DM',x:62,y:60},{r:'AM',x:22,y:40},{r:'AM',x:50,y:42},{r:'AM',x:78,y:40},{r:'ST',x:50,y:20}],
      '5-3-2':[{r:'GK',x:50,y:93},{r:'LWB',x:14,y:70},{r:'CB',x:30,y:82},{r:'CB',x:50,y:84},{r:'CB',x:70,y:82},{r:'RWB',x:86,y:70},{r:'CM',x:32,y:52},{r:'CM',x:50,y:56},{r:'CM',x:68,y:52},{r:'ST',x:40,y:24},{r:'ST',x:60,y:24}],
    },
    tactics:['Tiki-Taka','Gegenpress','Park the Bus','Counter','Wing Play','Offside Trap'],
  },
  Basketball: {
    surface:'court-wood', accent:C.wood, players:5, teamSize:'5v5',
    formations:{
      'Man-to-Man':[{r:'PG',x:50,y:82},{r:'SG',x:22,y:64},{r:'SF',x:78,y:64},{r:'PF',x:34,y:40},{r:'C',x:62,y:34}],
      'Zone Defense':[{r:'PG',x:50,y:78},{r:'SG',x:26,y:60},{r:'SF',x:74,y:60},{r:'PF',x:38,y:42},{r:'C',x:62,y:42}],
      'Fast Break':[{r:'PG',x:50,y:86},{r:'SG',x:18,y:52},{r:'SF',x:82,y:52},{r:'PF',x:40,y:28},{r:'C',x:60,y:24}],
      'Pick and Roll':[{r:'PG',x:46,y:70},{r:'SG',x:80,y:58},{r:'SF',x:18,y:50},{r:'PF',x:56,y:54},{r:'C',x:50,y:36}],
      'Full Court Press':[{r:'PG',x:50,y:60},{r:'SG',x:24,y:44},{r:'SF',x:76,y:44},{r:'PF',x:34,y:24},{r:'C',x:66,y:22}],
      'Half Court Setup':[{r:'PG',x:50,y:80},{r:'SG',x:20,y:62},{r:'SF',x:80,y:62},{r:'PF',x:32,y:44},{r:'C',x:68,y:44}],
    },
    tactics:['Iso Ball','Motion Offense','Press Break','Switch All','Double Team','Crash Boards'],
  },
  Volleyball: {
    surface:'court-net', accent:C.blue, players:6, teamSize:'6v6',
    formations:{
      'Rotation 1':[{r:'S',x:74,y:64},{r:'OPP',x:74,y:30},{r:'OH',x:26,y:30},{r:'MB',x:50,y:26},{r:'OH',x:26,y:64},{r:'L',x:50,y:66}],
      'Rotation 2':[{r:'S',x:50,y:66},{r:'OPP',x:26,y:30},{r:'OH',x:74,y:30},{r:'MB',x:50,y:26},{r:'OH',x:74,y:64},{r:'L',x:26,y:64}],
      '5-1 System':[{r:'S',x:72,y:60},{r:'OPP',x:28,y:32},{r:'OH',x:24,y:60},{r:'MB',x:50,y:28},{r:'OH',x:74,y:34},{r:'L',x:50,y:64}],
      '6-2 System':[{r:'S',x:74,y:62},{r:'OPP',x:50,y:30},{r:'OH',x:26,y:34},{r:'MB',x:50,y:64},{r:'OH',x:74,y:34},{r:'L',x:28,y:62}],
    },
    tactics:['Quick Set','Back Row Attack','Float Serve','Double Block','Tip & Roll','Serve Receive'],
  },
  Badminton: {
    surface:'court-net', accent:C.green, players:2, teamSize:'2v2',
    formations:{
      'Front-Back Attack':[{r:'Front',x:50,y:56},{r:'Back',x:50,y:82}],
      'Side-by-Side Defense':[{r:'Left',x:30,y:70},{r:'Right',x:70,y:70}],
      'Net Pressure':[{r:'Net',x:50,y:46},{r:'Rear',x:50,y:84}],
      'Smash-Cover':[{r:'Smash',x:42,y:62},{r:'Cover',x:62,y:82}],
    },
    tactics:['Attack Clear','Drop Shot','Net Kill','Defensive Lift','Drive Rally','Deception'],
  },
  Cricket: {
    surface:'oval', accent:C.greenDeep, players:11, teamSize:'11v11',
    formations:{
      'Standard Field':[{r:'Bowl',x:50,y:30},{r:'WK',x:50,y:84},{r:'Slip',x:60,y:78},{r:'Slip',x:66,y:74},{r:'Point',x:80,y:56},{r:'Cover',x:72,y:44},{r:'Mid-off',x:58,y:40},{r:'Mid-on',x:42,y:40},{r:'Sq Leg',x:24,y:56},{r:'F.Leg',x:30,y:74},{r:'Long-on',x:40,y:14}],
      'Attacking Field':[{r:'Bowl',x:50,y:32},{r:'WK',x:50,y:84},{r:'Slip',x:58,y:78},{r:'Slip',x:64,y:75},{r:'Slip',x:70,y:72},{r:'Gully',x:76,y:64},{r:'Point',x:82,y:54},{r:'Cover',x:70,y:42},{r:'Mid-off',x:56,y:38},{r:'Mid-on',x:44,y:38},{r:'Sq Leg',x:26,y:58}],
      'Defensive Field':[{r:'Bowl',x:50,y:30},{r:'WK',x:50,y:84},{r:'Slip',x:60,y:78},{r:'Point',x:84,y:52},{r:'Cover',x:74,y:40},{r:'Mid-off',x:58,y:30},{r:'Long-off',x:54,y:12},{r:'Long-on',x:44,y:12},{r:'Mid-on',x:42,y:32},{r:'Mid-wkt',x:26,y:44},{r:'F.Leg',x:30,y:74}],
      'Death Overs':[{r:'Bowl',x:50,y:32},{r:'WK',x:50,y:84},{r:'Slip',x:60,y:78},{r:'Point',x:82,y:56},{r:'Cover',x:72,y:46},{r:'Long-off',x:56,y:12},{r:'Long-on',x:44,y:12},{r:'D.Mid',x:24,y:30},{r:'D.Sq',x:18,y:54},{r:'F.Leg',x:30,y:76},{r:'3rd Man',x:74,y:74}],
    },
    tactics:['Yorker Length','Bouncer','Spin Choke','Powerplay','Slip Cordon','Defend Boundary'],
  },
  'Table Tennis': {
    surface:'court-net', accent:C.navy, players:2, teamSize:'2v2',
    formations:{
      'Serve Setup':[{r:'Server',x:36,y:78},{r:'Partner',x:64,y:86}],
      'Receive Setup':[{r:'Receiver',x:60,y:64},{r:'Partner',x:36,y:82}],
      'Rotation Drill':[{r:'Attack',x:42,y:70},{r:'Cover',x:58,y:84}],
    },
    tactics:['Topspin','Backspin','Flick','Block','Loop Drive','Short Push'],
  },
};

// Session-style sports (gym / yoga / swimming / archery / fitness) use a generic
// station/lane planner.
const SESSION_BOARD = {
  surface:'session', accent:C.blue, players:6, teamSize:'Session',
  formations:{
    'Stations':[{r:'St 1',x:26,y:24},{r:'St 2',x:50,y:24},{r:'St 3',x:74,y:24},{r:'St 4',x:26,y:64},{r:'St 5',x:50,y:64},{r:'St 6',x:74,y:64}],
    'Lane Assignment':[{r:'Ln 1',x:17,y:50},{r:'Ln 2',x:33,y:50},{r:'Ln 3',x:50,y:50},{r:'Ln 4',x:67,y:50},{r:'Ln 5',x:83,y:50},{r:'Coach',x:50,y:14}],
    'Class Grouping':[{r:'Grp A',x:30,y:32},{r:'Grp A',x:46,y:32},{r:'Grp B',x:62,y:60},{r:'Grp B',x:78,y:60},{r:'Lead',x:50,y:16},{r:'Sub',x:20,y:78}],
    'Circuit':[{r:'Warm',x:24,y:22},{r:'Push',x:50,y:22},{r:'Pull',x:76,y:22},{r:'Legs',x:24,y:66},{r:'Core',x:50,y:66},{r:'Cool',x:76,y:66}],
  },
  tactics:['Warm Up','Strength','Cardio','Cooldown','Mobility','Core'],
};

const getBoard = sport => BOARDS[sport] || SESSION_BOARD;
const formationsOf = sport => Object.keys(getBoard(sport).formations);
const formationsList = sport => [...formationsOf(sport), 'Custom'];

// Full sport catalogue (used by Create Post, Search filters, Tactics, Challengers).
const ALL_SPORTS = [
  'Football', 'Futsal', 'Basketball', 'Volleyball', 'Badminton', 'Table Tennis', 'Cricket',
  'Archery', 'Swimming', 'Gym', 'Yoga', 'Zumba', 'Fitness Class', 'Taekwondo', 'Running', 'Cycling', 'Golf',
];
const SPORT_ICON = {
  Football: 'football', Futsal: 'football', Basketball: 'basketball', Volleyball: 'tennisball',
  Badminton: 'tennisball', 'Table Tennis': 'tennisball', Cricket: 'baseball', Archery: 'locate',
  Swimming: 'water', Gym: 'barbell', Yoga: 'body', Zumba: 'musical-notes', 'Fitness Class': 'fitness',
  Taekwondo: 'hand-left', Running: 'walk', Cycling: 'bicycle', Golf: 'golf', Fitness: 'fitness',
};
const sportIcon = s => SPORT_ICON[s] || 'ellipse';
const teamSizeFor = sport => { const b = getBoard(sport); return b.teamSize && /v/.test(b.teamSize) ? b.teamSize : 'Open'; };

// Media gallery (in-app picker — simulates camera roll / upload with curated stock).
const MEDIA_GALLERY = [
  { id: 'm-futsal', url: IMG.futsal, tag: 'Futsal' },
  { id: 'm-court', url: IMG.court, tag: 'Basketball' },
  { id: 'm-bad', url: IMG.badminton, tag: 'Badminton' },
  { id: 'm-volley', url: IMG.volley, tag: 'Volleyball' },
  { id: 'm-cricket', url: IMG.cricket, tag: 'Cricket' },
  { id: 'm-gym', url: IMG.gym, tag: 'Gym' },
  { id: 'm-feed', url: IMG.feed, tag: 'Action' },
  { id: 'm-stadium', url: IMG.stadium, tag: 'Stadium' },
  { id: 'm-event', url: IMG.event, tag: 'Event' },
  { id: 'm-hero', url: IMG.hero, tag: 'Pitch' },
];

// Full position dropdown options per sport (Edit Role sheet). Captain = cap flag.
const ROLE_OPTIONS = {
  Futsal: ['GK', 'Fixo', 'L Ala', 'R Ala', 'Pivot', 'Sub'],
  Football: ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'DM', 'CM', 'AM', 'LM', 'RM', 'LW', 'RW', 'ST', 'Sub'],
  Basketball: ['PG', 'SG', 'SF', 'PF', 'C', 'Sub'],
  Volleyball: ['S', 'OPP', 'OH', 'MB', 'L', 'Sub'],
  Badminton: ['Front', 'Back', 'Left', 'Right', 'Net', 'Rear', 'Sub'],
  Cricket: ['Batter', 'Bowl', 'WK', 'Slip', 'Gully', 'Point', 'Cover', 'Mid-off', 'Mid-on', 'Sq Leg', 'Boundary', 'Sub'],
  'Table Tennis': ['Server', 'Receiver', 'Partner', 'Attack', 'Cover', 'Sub'],
};
const rolesForSport = sport => ROLE_OPTIONS[sport] || (() => {
  const s = new Set();
  Object.values(getBoard(sport).formations).forEach(f => f.forEach(p => s.add(p.r)));
  s.add('Sub'); return [...s];
})();
const nameOfPid = pid => (typeof pid === 'string' && pid.startsWith('sub-')) ? 'Sub' : getUser(pid).name;

// ─── Tactics plan model (roster-driven, used by lobby + squad) ─────────────────
// plan = { sport, formation, roster:[pid], roles:{pid:role}, positions:{pid:{x,y}},
//          nums:{pid:n}, captainId, notes, tactics:[], locked }
function buildPlan(squad, sport, formationName) {
  const board = getBoard(sport);
  const formation = formationName || formationsOf(sport)[0];
  const slots = board.formations[formation] || Object.values(board.formations)[0];
  const count = board.players;
  const members = (squad && squad.members) ? squad.members : [];
  const roster = [], roles = {}, positions = {}, nums = {};
  for (let i = 0; i < count; i++) {
    const slot = slots[i] || { r: 'Sub', x: 12 + (i % 5) * 18, y: 96 };
    let pid;
    if (members[i]) pid = members[i].userId;
    else { const f = users.find(u => !roster.includes(u.id)); pid = f ? f.id : 'sub-' + (i + 1); }
    roster.push(pid); roles[pid] = slot.r; positions[pid] = { x: slot.x, y: slot.y }; nums[pid] = i + 1;
  }
  const captainId = members.find(m => m.isCaptain)?.userId || roster[0];
  return { sport, formation, roster, roles, positions, nums, captainId, notes: '', tactics: [], locked: false };
}
function applyFormation(plan, formationName) {
  if (formationName === 'Custom') return { ...plan, formation: 'Custom' };
  const board = getBoard(plan.sport);
  const slots = board.formations[formationName] || Object.values(board.formations)[0];
  const positions = { ...plan.positions }, roles = { ...plan.roles };
  plan.roster.forEach((pid, i) => { const slot = slots[i]; if (slot) { positions[pid] = { x: slot.x, y: slot.y }; roles[pid] = slot.r; } });
  return { ...plan, formation: formationName, positions, roles };
}
function addPlayerToPlan(plan, pid) {
  if (plan.roster.includes(pid)) return plan;
  const board = getBoard(plan.sport);
  const idx = plan.roster.length;
  const slots = board.formations[plan.formation] || Object.values(board.formations)[0];
  const slot = slots[idx];
  const pos = slot ? { x: slot.x, y: slot.y } : { x: 12 + (idx % 6) * 14, y: 96 };
  return { ...plan, roster: [...plan.roster, pid], positions: { ...plan.positions, [pid]: pos }, roles: { ...plan.roles, [pid]: slot ? slot.r : 'Sub' }, nums: { ...plan.nums, [pid]: idx + 1 } };
}
function removePlayerFromPlan(plan, pid) {
  const roster = plan.roster.filter(x => x !== pid);
  const positions = { ...plan.positions }; delete positions[pid];
  const roles = { ...plan.roles }; delete roles[pid];
  const nums = { ...plan.nums }; delete nums[pid];
  return { ...plan, roster, positions, roles, nums, captainId: plan.captainId === pid ? (roster[0] || null) : plan.captainId };
}
function swapPlayerInPlan(plan, oldPid, newPid) {
  if (plan.roster.includes(newPid)) return plan;
  const pos = plan.positions[oldPid], role = plan.roles[oldPid], num = plan.nums[oldPid], wasCap = plan.captainId === oldPid;
  const roster = plan.roster.map(x => x === oldPid ? newPid : x);
  const positions = { ...plan.positions }; delete positions[oldPid]; positions[newPid] = pos;
  const roles = { ...plan.roles }; delete roles[oldPid]; roles[newPid] = role;
  const nums = { ...plan.nums }; delete nums[oldPid]; nums[newPid] = num;
  return { ...plan, roster, positions, roles, nums, captainId: wasCap ? newPid : plan.captainId };
}
function planPlayers(plan) {
  return plan.roster.map((pid, i) => ({ pid, name: nameOfPid(pid), num: plan.nums[pid] || i + 1, role: plan.roles[pid] || '', cap: plan.captainId === pid }));
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Badge({ label, tone = 'blue', dot = false, dark = false }) {
  const map = {
    blue:   { bg: C.bluePale,  color: C.blue },
    green:  { bg: C.greenPale, color: '#007A42' },
    orange: { bg: '#FFF3DC',   color: '#A05F00' },
    red:    { bg: '#FFE8EA',   color: C.danger },
    navy:   { bg: '#EEF2FF',   color: C.navy },
  };
  const t = map[tone] || map.blue;
  return (
    <View style={[S.badge, { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : t.bg }]}>
      {dot ? <View style={[S.badgeDot, { backgroundColor: t.color }]} /> : null}
      <Text style={[S.badgeText, { color: dark ? C.white : t.color }]}>{label}</Text>
    </View>
  );
}

function AppButton({ title, onPress, variant = 'primary', icon, iconRight, disabled = false, fill = false, small = false, loading = false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const isSec = variant === 'secondary';
  const isAcc = variant === 'accent';
  const isGreen = variant === 'green';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const animate = v => { if (!disabled && !loading) Animated.spring(scale, { toValue: v, friction: 6, tension: 180, useNativeDriver: true }).start(); };
  const bg = isSec ? C.white : isAcc ? C.lime : isGreen ? C.green : isDanger ? C.danger : isGhost ? 'transparent' : C.blue;
  const textCol = isSec ? C.text : isAcc ? C.navy : isGhost ? C.blue : C.white;
  return (
    <Animated.View style={[fill && S.fillBtn, { transform: [{ scale }] }]}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={() => animate(0.96)} onPressOut={() => animate(1)}
        style={[
          S.btn, small && S.btnSmall, isSec && S.btnSec, isGhost && S.btnGhost,
          disabled && S.btnDisabled, { backgroundColor: bg },
        ]}
      >
        {loading ? <Animated.View style={S.spinner}><Ionicons name="sync" size={small ? 15 : 17} color={textCol} /></Animated.View> : (
          <>
            {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={textCol} /> : null}
            <Text style={[S.btnText, small && S.btnTextSmall, { color: textCol }]}>{title}</Text>
            {iconRight ? <Ionicons name={iconRight} size={small ? 15 : 17} color={textCol} /> : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

function Avatar({ label = '?', size = 42, accent = false, online = false, img, ring }) {
  const cols = accent ? [C.lime, '#78D600'] : ring === 'green' ? [C.green, C.greenDeep] : ring === 'wood' ? [C.wood, C.woodDark] : [C.navy, C.blue];
  return (
    <View style={{ width: size, height: size }}>
      {img ? (
        <Image source={{ uri: img }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <LinearGradient colors={cols} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: accent ? C.navy : C.white, fontWeight: '900', fontSize: size * 0.36 }}>{initials(label)}</Text>
        </LinearGradient>
      )}
      {online ? <View style={[S.onlineDot, { right: size * 0.02, bottom: size * 0.02, width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13 }]} /> : null}
    </View>
  );
}

function Chip({ label, active, onPress, icon, dark = false }) {
  return (
    <Pressable onPress={onPress} style={[S.chip, dark && S.chipDark, active && (dark ? S.chipDarkActive : S.chipActive)]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? (dark ? C.navy : C.navy) : (dark ? C.mutedLight : C.muted)} /> : null}
      <Text style={[dark ? S.chipDarkText : S.chipText, active && (dark ? S.chipDarkTextActive : S.chipTextActive)]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, action, onPress }) {
  return (
    <View style={S.secHead}>
      <Text style={S.secTitle}>{title}</Text>
      {action ? <Pressable onPress={onPress} hitSlop={12}><Text style={S.secAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

function Meta({ label, value, icon }) {
  return (
    <View style={S.metaBox}>
      <View style={S.metaLabelRow}>
        {icon ? <Ionicons name={icon} size={12} color={C.muted} /> : null}
        <Text style={S.metaLabel}>{label}</Text>
      </View>
      <Text style={S.metaValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <View style={S.emptyState}>
      <View style={S.emptyIcon}><Ionicons name={icon} size={34} color={C.blue} /></View>
      <Text style={S.emptyTitle}>{title}</Text>
      <Text style={S.emptyText}>{text}</Text>
    </View>
  );
}

function Screen({ children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[S.screen, { opacity, transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

function TopBar({ title, onBack, right, dark = false }) {
  return (
    <View style={[S.topBar, dark && S.topBarDark]}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={[S.backBtn, dark && S.backBtnDark]}>
          <Ionicons name="chevron-back" size={22} color={dark ? C.white : C.navy} />
        </Pressable>
      ) : <View style={{ width: 38 }} />}
      <Text style={[S.topBarTitle, dark && { color: C.white }]} numberOfLines={1}>{title}</Text>
      <View style={{ minWidth: 38, alignItems: 'flex-end' }}>{right || null}</View>
    </View>
  );
}

// ─── Animated interaction buttons ─────────────────────────────────────────────
// Controlled like button (state lives in MainApp so it stays in sync everywhere).
function LikeButton({ liked, count, onToggle, size = 22 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    onToggle();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.45, friction: 3, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };
  return (
    <Pressable onPress={press} style={S.iconBtn} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={size} color={liked ? C.danger : C.muted} />
      </Animated.View>
      <Text style={[S.iconBtnCount, liked && { color: C.danger }]}>{count}</Text>
    </Pressable>
  );
}

function SaveButton({ saved, onToggle }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    onToggle();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, friction: 3, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };
  return (
    <Pressable onPress={press} style={S.iconBtn} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? C.blue : C.muted} />
      </Animated.View>
    </Pressable>
  );
}

function PulseDot({ color = C.green, size = 10 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 2.4, duration: 1300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity, transform: [{ scale }] }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ─── Donut split (payment 50/50 etc) ──────────────────────────────────────────
function DonutSplit({ left = 50, right = 50, size = 116, labelA = 'Team A', labelB = 'Team B' }) {
  // Half-and-half conic effect via two rotated halves + overlay arc.
  const r = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', flexDirection: 'row' }}>
        <View style={{ width: size * (left / 100), height: size, backgroundColor: C.blue }} />
        <View style={{ flex: 1, height: size, backgroundColor: C.green }} />
      </View>
      <View style={[S.donutHole, { width: size * 0.56, height: size * 0.56, borderRadius: size * 0.28, left: size * 0.22, top: size * 0.22 }]}>
        <Text style={S.donutPct}>{left}/{right}</Text>
        <Text style={S.donutSub}>split</Text>
      </View>
    </View>
  );
}

// ─── Toast overlay ────────────────────────────────────────────────────────────
function Toast({ toast }) {
  const y = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!toast) return;
    Animated.parallel([
      Animated.spring(y, { toValue: 0, friction: 7, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(y, { toValue: -80, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 2200);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const tone = toast.type === 'error' ? C.danger : toast.type === 'info' ? C.blue : C.green;
  const icon = toast.type === 'error' ? 'alert-circle' : toast.type === 'info' ? 'information-circle' : 'checkmark-circle';
  return (
    <Animated.View pointerEvents="none" style={[S.toast, { opacity, transform: [{ translateY: y }] }]}>
      <View style={[S.toastIcon, { backgroundColor: tone }]}><Ionicons name={icon} size={18} color={C.white} /></View>
      <Text style={S.toastText} numberOfLines={2}>{toast.msg}</Text>
    </Animated.View>
  );
}

// ─── Tactics board: court backgrounds ─────────────────────────────────────────
function CourtBackground({ surface }) {
  if (surface === 'court-wood') {
    return (
      <LinearGradient colors={['#D98248', '#C8743A', '#A85A28']} style={S.courtFill}>
        <View style={[S.line, { left: '8%', right: '8%', top: '50%', height: 2 }]} />
        <View style={[S.circle, { width: '34%', aspectRatio: 1, borderRadius: 999, top: '38%', left: '33%' }]} />
        {/* keys */}
        <View style={[S.box, { left: '30%', width: '40%', top: 0, height: '22%' }]} />
        <View style={[S.box, { left: '30%', width: '40%', bottom: 0, height: '22%' }]} />
        <View style={[S.hoop, { top: 6, left: '47%' }]} />
        <View style={[S.hoop, { bottom: 6, left: '47%' }]} />
        <View style={[S.arc, { top: -40, left: '18%', width: '64%', height: 120 }]} />
        <View style={[S.arc, { bottom: -40, left: '18%', width: '64%', height: 120 }]} />
      </LinearGradient>
    );
  }
  if (surface === 'court-net') {
    return (
      <LinearGradient colors={['#2B6FB8', '#1F5FA8', '#184E8C']} style={S.courtFill}>
        <View style={[S.netLine, { top: '50%' }]} />
        <View style={[S.line, { left: '8%', right: '8%', top: '34%', height: 2 }]} />
        <View style={[S.line, { left: '8%', right: '8%', top: '66%', height: 2 }]} />
        <View style={[S.line, { top: '6%', bottom: '6%', left: '50%', width: 2 }]} />
      </LinearGradient>
    );
  }
  if (surface === 'oval') {
    return (
      <View style={S.courtFill}>
        <LinearGradient colors={['#1E9E5A', '#15823F', '#0F6E33']} style={[S.courtFill, { borderRadius: 999 }]}>
          <View style={[S.pitchRect, { left: '42%', width: '16%', top: '20%', bottom: '20%' }]} />
          <View style={[S.line, { left: '46%', width: 2, top: '24%', height: 8 }]} />
          <View style={[S.circle, { width: '60%', aspectRatio: 1, borderRadius: 999, top: '20%', left: '20%', borderStyle: 'dashed' }]} />
        </LinearGradient>
      </View>
    );
  }
  if (surface === 'session') {
    return (
      <LinearGradient colors={['#14224D', '#0E1A3D', '#0A142E']} style={S.courtFill}>
        {[20, 50, 80].map(t => <View key={'h' + t} style={[S.lineDim, { left: '6%', right: '6%', top: `${t}%`, height: 1 }]} />)}
        {[33, 66].map(l => <View key={'v' + l} style={[S.lineDim, { top: '6%', bottom: '6%', left: `${l}%`, width: 1 }]} />)}
      </LinearGradient>
    );
  }
  // pitch (futsal / football)
  return (
    <LinearGradient colors={['#1FA85A', '#168A45', '#0F7338']} style={S.courtFill}>
      {[18, 38, 58, 78].map((t, i) => (
        <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${t}%`, height: '10%', backgroundColor: i % 2 ? 'rgba(255,255,255,0.04)' : 'transparent' }} />
      ))}
      <View style={[S.line, { left: '6%', right: '6%', top: '50%', height: 2 }]} />
      <View style={[S.circle, { width: '30%', aspectRatio: 1, borderRadius: 999, top: '40%', left: '35%' }]} />
      <View style={[S.box, { left: '28%', width: '44%', top: 0, height: '14%' }]} />
      <View style={[S.box, { left: '28%', width: '44%', bottom: 0, height: '14%' }]} />
      <View style={[S.box, { left: '40%', width: '20%', top: 0, height: '6%' }]} />
      <View style={[S.box, { left: '40%', width: '20%', bottom: 0, height: '6%' }]} />
    </LinearGradient>
  );
}

// ─── Draggable player marker ──────────────────────────────────────────────────
function PlayerMarker({ player, x, y, board, locked, onCommit, onEdit, accent }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const xRef = useRef(x); xRef.current = x;
  const yRef = useRef(y); yRef.current = y;
  const bRef = useRef(board); bRef.current = board;
  const lRef = useRef(locked); lRef.current = locked;
  const draggingRef = useRef(false);
  const [, force] = useState(0);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !lRef.current,
    onMoveShouldSetPanResponder: (_, g) => !lRef.current && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
    onPanResponderGrant: () => { draggingRef.current = true; pan.setValue({ x: 0, y: 0 }); force(v => v + 1); },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      const b = bRef.current;
      if (b.w && b.h) {
        // snap to a subtle 1% grid so markers settle cleanly without jumping
        const nx = Math.round(clamp(xRef.current + (g.dx / b.w) * 100, 5, 95));
        const ny = Math.round(clamp(yRef.current + (g.dy / b.h) * 100, 5, 95));
        onCommit(player.pid, nx, ny);
      }
      pan.setValue({ x: 0, y: 0 });
      draggingRef.current = false; force(v => v + 1);
    },
    onPanResponderTerminate: () => { pan.setValue({ x: 0, y: 0 }); draggingRef.current = false; force(v => v + 1); },
  })).current;

  const size = board.players > 8 ? 30 : 42;
  const dragging = draggingRef.current;
  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        S.marker,
        { left: `${x}%`, top: `${y}%`, width: size, marginLeft: -size / 2, marginTop: -(size / 2) - 4,
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: dragging ? 1.12 : 1 }], zIndex: dragging ? 50 : 5 },
      ]}
    >
      <Pressable onPress={() => !locked && onEdit(player)} disabled={locked}>
        <View style={[S.markerRole, board.players > 8 && { paddingHorizontal: 4, paddingVertical: 1 }]}>
          <Text style={[S.markerRoleText, board.players > 8 && { fontSize: 7 }]}>{player.role}</Text>
        </View>
        <LinearGradient
          colors={player.cap ? [C.lime, '#86CC00'] : accent ? [accent, C.navy] : [C.blue, C.blueDeep]}
          style={[S.markerCircle, { width: size, height: size, borderRadius: size / 2 }, dragging && S.markerDragging]}
        >
          <Text style={[S.markerNum, { fontSize: size * 0.4, color: player.cap ? C.navy : C.white }]}>{player.num}</Text>
        </LinearGradient>
        {player.cap ? <View style={S.capBadge}><Text style={S.capBadgeText}>C</Text></View> : null}
        {board.players <= 8 ? <Text style={S.markerName} numberOfLines={1}>{player.name}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

// ─── Tactics board surface (interactive) ──────────────────────────────────────
function TacticsBoard({ sport, players, positions, locked, onCommit, onEditPlayer }) {
  const board = getBoard(sport);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const measured = { ...board, w: size.w, h: size.h };
  return (
    <View style={S.boardWrap} onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <CourtBackground surface={board.surface} />
      <View style={S.boardEndTop}><Text style={S.boardEndText}>OPPONENT HALF</Text></View>
      <View style={S.boardEndBottom}><Text style={S.boardEndText}>OUR HALF</Text></View>
      {players.map(p => {
        const pos = positions[p.pid] || { x: 50, y: 50 };
        return (
          <PlayerMarker key={p.pid} player={p} x={pos.x} y={pos.y} board={measured}
            accent={board.accent} locked={locked} onCommit={onCommit} onEdit={onEditPlayer} />
        );
      })}
      {locked ? (
        <View style={S.boardLockBadge}><Ionicons name="lock-closed" size={12} color={C.white} /><Text style={S.boardLockText}>LOCKED</Text></View>
      ) : (
        <View style={S.boardHint}><Ionicons name="move" size={12} color={C.white} /><Text style={S.boardHintText}>Drag players to reposition</Text></View>
      )}
    </View>
  );
}

// ─── Role edit sheet ──────────────────────────────────────────────────────────
function RoleEditSheet({ player, sport, onSave, onRemove, onReplace, onClose }) {
  const allRoles = rolesForSport(sport);
  const [role, setRole] = useState(player.role);
  const [num, setNum] = useState(String(player.num));
  const [cap, setCap] = useState(!!player.cap);
  return (
    <Pressable style={S.sheetOverlay} onPress={onClose}>
      <Pressable style={S.sheet} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <View style={S.sheetHead}>
          <Avatar label={player.name} size={44} accent={cap} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={S.sheetTitle}>{player.name}{cap ? '  ©' : ''}</Text>
            <Text style={S.sheetSub}>Edit position, jersey & role</Text>
          </View>
        </View>
        <Text style={S.inputLabel}>Jersey number</Text>
        <TextInput value={num} onChangeText={setNum} keyboardType="number-pad" maxLength={2} style={S.input} placeholder="No." placeholderTextColor={C.mutedLight} />
        <Text style={S.inputLabel}>Role / position</Text>
        <View style={S.chipWrap}>
          {allRoles.map(r => <Chip key={r} label={r} active={role === r} onPress={() => setRole(r)} />)}
        </View>
        <Pressable style={S.capToggle} onPress={() => setCap(c => !c)}>
          <View style={[S.checkBox, cap && S.checkBoxOn]}>{cap ? <Ionicons name="checkmark" size={13} color={C.white} /> : null}</View>
          <Text style={S.capToggleText}>Make squad captain (C)</Text>
        </Pressable>
        <View style={{ height: 12 }} />
        <AppButton title="Save player" icon="checkmark" fill onPress={() => onSave({ role, num: num || player.num, cap })} />
        <View style={{ height: 8 }} />
        <View style={S.rowGap}>
          {onReplace ? <AppButton title="Replace" variant="secondary" icon="swap-horizontal" small fill onPress={onReplace} /> : null}
          <AppButton title="Remove" variant="danger" icon="person-remove" small fill onPress={onRemove} />
        </View>
      </Pressable>
    </Pressable>
  );
}

// ─── Add player sheet ─────────────────────────────────────────────────────────
function AddPlayerSheet({ plan, squad, lobby, replaceName, onAdd, onClose }) {
  const board = getBoard(plan.sport);
  const req = lobby ? Math.min(board.players, 5) : board.players;
  const onBoard = new Set(plan.roster);
  const memberIds = (squad.members || []).map(m => m.userId);
  const groups = [
    { title: 'Squad members', ids: memberIds.filter(id => !onBoard.has(id)) },
    { title: 'Substitutes', ids: (squad.members || []).filter(m => /sub/i.test(m.role || '') || m.availability === 'Maybe').map(m => m.userId).filter(id => !onBoard.has(id)) },
    { title: 'Available players', ids: users.filter(u => u.availability === 'Available' && !memberIds.includes(u.id) && !onBoard.has(u.id)).map(u => u.id) },
    { title: 'Invited players', ids: users.filter(u => !memberIds.includes(u.id) && u.availability !== 'Available' && !onBoard.has(u.id)).slice(0, 3).map(u => u.id) },
  ].filter(g => g.ids.length);
  return (
    <Pressable style={S.sheetOverlay} onPress={onClose}>
      <Pressable style={[S.sheet, { maxHeight: '82%' }]} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <View style={S.rowCenter}>
          <View style={{ flex: 1 }}>
            <Text style={S.sheetTitle}>{replaceName ? 'Replace ' + replaceName : 'Add Player'}</Text>
            <Text style={S.sheetSub}>{replaceName ? 'Pick a player to take their spot' : `${plan.roster.length} on board · ${plan.sport} (${board.teamSize})`}</Text>
          </View>
          <Pressable onPress={onClose} style={S.sheetDone}><Text style={S.sheetDoneText}>Done</Text></Pressable>
        </View>
        <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
          {groups.map(g => (
            <View key={g.title}>
              <Text style={S.addGroupLabel}>{g.title}</Text>
              {g.ids.map(id => {
                const u = getUser(id);
                const m = (squad.members || []).find(x => x.userId === id);
                const ready = lobby ? lobby.readyA >= req : null;
                return (
                  <Pressable key={id} style={S.addRow} onPress={() => onAdd(id)}>
                    <Avatar label={u.name} size={42} online={u.availability === 'Available'} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={S.listTitle}>{u.name}</Text>
                      <Text style={S.listSub}>{m ? m.role : u.mainSport} · {u.availability}</Text>
                      {lobby ? (
                        <View style={[S.rowCenter, { marginTop: 4, gap: 6 }]}>
                          <Badge label={ready ? 'Ready' : 'Not ready'} tone={ready ? 'green' : 'orange'} />
                          <Badge label={`Pay: ${lobby.paymentStatus}`} tone={statusTone(lobby.paymentStatus)} />
                        </View>
                      ) : null}
                    </View>
                    <View style={S.addBtn}><Ionicons name="add" size={20} color={C.white} /></View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {!groups.length ? <EmptyState icon="people-outline" title="Everyone's on the board" text="All available players are already in this formation." /> : null}
          <View style={{ height: 8 }} />
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

// ─── Sport picker sheet (new squad formation) ─────────────────────────────────
function SportPickerSheet({ onPick, onClose }) {
  const sports = ['Football', 'Futsal', 'Basketball', 'Volleyball', 'Badminton', 'Cricket', 'Table Tennis', 'Gym Session'];
  const icon = { Football: 'football', Futsal: 'football', Basketball: 'basketball', Volleyball: 'tennisball', Badminton: 'tennisball', Cricket: 'baseball', 'Table Tennis': 'tennisball', 'Gym Session': 'barbell' };
  return (
    <Pressable style={S.sheetOverlay} onPress={onClose}>
      <Pressable style={S.sheet} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>Choose a sport</Text>
        <Text style={S.sheetSub}>The board, player count & formations adapt to your sport.</Text>
        <View style={[S.chipWrap, { marginTop: 14 }]}>
          {sports.map(s => (
            <Pressable key={s} style={S.sportPick} onPress={() => onPick(s === 'Gym Session' ? 'Fitness' : s)}>
              <Ionicons name={icon[s] || 'football'} size={18} color={C.blue} />
              <Text style={S.sportPickText}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 8 }} />
      </Pressable>
    </Pressable>
  );
}

// ─── Unsaved changes sheet ────────────────────────────────────────────────────
function UnsavedSheet({ onSave, onDiscard, onCancel }) {
  return (
    <Pressable style={S.sheetOverlay} onPress={onCancel}>
      <Pressable style={S.sheet} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <View style={S.rowCenter}>
          <View style={S.warnIcon}><Ionicons name="warning" size={20} color={C.warning} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={S.sheetTitle}>Unsaved formation changes</Text>
            <Text style={S.sheetSub}>Save your tactics before leaving, or discard them.</Text>
          </View>
        </View>
        <View style={{ height: 16 }} />
        <AppButton title="Save & leave" icon="save-outline" fill onPress={onSave} />
        <View style={{ height: 8 }} />
        <AppButton title="Discard changes" variant="danger" icon="trash-outline" fill onPress={onDiscard} />
        <View style={{ height: 8 }} />
        <AppButton title="Keep editing" variant="secondary" fill onPress={onCancel} />
      </Pressable>
    </Pressable>
  );
}

// ─── Player stories (available players strip) ─────────────────────────────────
function PlayerStories({ onOpen }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.storiesRow}>
      <Pressable style={S.storyItem} onPress={() => onOpen(currentUser.id)}>
        <View style={[S.storyRing, { borderColor: C.lime }]}><Avatar label={currentUser.name} size={52} accent /></View>
        <Text style={S.storyName}>You</Text>
      </Pressable>
      {users.slice(1).map(u => {
        const on = u.availability === 'Available';
        return (
          <Pressable key={u.id} style={S.storyItem} onPress={() => onOpen(u.id)}>
            <View style={[S.storyRing, { borderColor: on ? C.green : C.border }]}><Avatar label={u.name} size={52} online={on} /></View>
            <Text style={S.storyName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Post card (all 7 types) ──────────────────────────────────────────────────
const POST_ICON = {
  'Match Challenge': 'flame', 'Match Result': 'trophy', 'Squad Recruitment': 'people',
  'General': 'chatbubble-ellipses', 'Venue Review': 'star', 'Event': 'calendar', 'Gym Progress': 'barbell',
};

function PostCard({ app, post, squads, comments, isFollowing, onFollow, onOpen, onOpenAuthor, onComment, onRequest, onShare }) {
  const isSquad = post.authorType === 'squad';
  const author = isSquad ? getSquad(squads, post.createdBy) : getUser(post.createdBy);
  const name = author.name;
  const handle = isSquad ? author.handle : author.username;
  const scale = useRef(new Animated.Value(1)).current;
  const cCount = (comments[post.id] || []).length;
  const isChallenge = post.postType === 'Match Challenge';
  const tone = statusTone(post.status);
  return (
    <Animated.View style={[S.postCard, { transform: [{ scale }] }]}>
      {/* header */}
      <View style={S.postHead}>
        <Pressable style={S.postAuthor} onPress={() => onOpenAuthor(author, isSquad)}>
          <Avatar label={name} size={44} ring={isSquad ? 'green' : undefined} accent={post.createdBy === currentUser.id} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <View style={S.rowCenter}>
              <Text style={S.postName} numberOfLines={1}>{name}</Text>
              {isSquad ? <Ionicons name="shield-checkmark" size={13} color={C.blue} style={{ marginLeft: 4 }} /> : null}
            </View>
            <Text style={S.postMeta}>@{handle} · {post.location} · {post.createdAt}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => onFollow(isSquad ? 'squad' : 'user', post.createdBy, name)}
          style={[S.followMini, isFollowing && S.followMiniActive]}
        >
          <Text style={[S.followMiniText, isFollowing && S.followMiniTextActive]}>{isFollowing ? 'Following' : 'Follow'}</Text>
        </Pressable>
      </View>

      {/* type tag */}
      <View style={S.postTypeRow}>
        <View style={S.postTypeTag}>
          <Ionicons name={POST_ICON[post.postType] || 'pricetag'} size={12} color={C.blue} />
          <Text style={S.postTypeText}>{post.postType}</Text>
        </View>
        {post.sport ? <Badge label={post.sport} tone="navy" /> : null}
        {post.status ? <Badge label={post.status} tone={tone} dot /> : null}
        {post.tactics ? <View style={S.tacticsTag}><MaterialCommunityIcons name="strategy" size={11} color={C.white} /><Text style={S.tacticsTagText}>Tactics</Text></View> : null}
      </View>

      <Pressable onPress={() => onOpen(post)}>
        {post.title ? <Text style={S.postTitle}>{post.title}</Text> : null}
        <Text style={S.postCaption}>{post.caption}</Text>
        {post.image ? (
          <View>
            <Image source={{ uri: post.image }} style={S.postImage} />
            {post.media && post.media.video ? <View style={S.videoBadge}><Ionicons name="play" size={14} color={C.white} /><Text style={S.videoBadgeText}>Video</Text></View> : null}
          </View>
        ) : null}

        {/* match meta chips for challenge posts */}
        {isChallenge || post.postType === 'Squad Recruitment' ? (
          <View style={S.postMetaGrid}>
            <Meta label="Team size" value={post.teamSize} icon="people-outline" />
            <Meta label="When" value={post.preferredTime} icon="time-outline" />
            <Meta label="Venue" value={post.venueName} icon="location-outline" />
            <Meta label="Split" value={post.paymentSplit} icon="cash-outline" />
          </View>
        ) : null}
        {isChallenge && post.expiry ? (
          <View style={S.expiryRow}>
            <PulseDot color={C.warning} size={8} />
            <Text style={S.expiryText}>Expires in {post.expiry}</Text>
          </View>
        ) : null}
      </Pressable>

      {/* actions */}
      <View style={S.postActions}>
        <LikeButton liked={app.isLiked(post.id)} count={app.likeCount(post.id, post.likes)} onToggle={() => app.toggleLike(post.id, post.likes)} />
        <Pressable style={S.iconBtn} onPress={() => onComment(post)} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={20} color={C.muted} />
          <Text style={S.iconBtnCount}>{cCount}</Text>
        </Pressable>
        <Pressable style={S.iconBtn} onPress={() => app.openShare(post)} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={20} color={C.muted} />
          <Text style={S.iconBtnCount}>{app.shareCount(post.id, post.shares || 0)}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <SaveButton saved={app.isSaved(post.id)} onToggle={() => app.toggleSave(post.id)} />
      </View>

      {isChallenge && post.status === 'Looking for Opponent' ? (
        <AppButton title="Request to Compete" icon="flash" fill onPress={() => onRequest(post)} />
      ) : null}
      {post.postType === 'Match Result' ? (
        <AppButton title="View match & comments" variant="secondary" icon="chatbubbles-outline" fill onPress={() => onOpen(post)} />
      ) : null}
    </Animated.View>
  );
}

// ─── Comment list + composer ──────────────────────────────────────────────────
function CommentRow({ c, onLike, onReply }) {
  const u = getUser(c.userId);
  return (
    <View style={S.commentRow}>
      <Avatar label={u.name} size={36} accent={c.userId === currentUser.id} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={S.commentBubble}>
          <Text style={S.commentName}>{u.name} <Text style={S.commentHandle}>@{u.username}</Text></Text>
          <Text style={S.commentText}>{c.text}</Text>
        </View>
        <View style={S.commentMetaRow}>
          <Text style={S.commentTime}>{c.at}</Text>
          <Pressable onPress={() => onLike(c.id)} hitSlop={8}><Text style={[S.commentAction, c.liked && { color: C.danger }]}>{c.liked ? 'Liked' : 'Like'} · {c.likes}</Text></Pressable>
          <Pressable onPress={() => onReply(c)} hitSlop={8}><Text style={S.commentAction}>Reply</Text></Pressable>
        </View>
        {(c.replies || []).map(r => {
          const ru = getUser(r.userId);
          return (
            <View key={r.id} style={S.replyRow}>
              <Avatar label={ru.name} size={28} accent={r.userId === currentUser.id} />
              <View style={[S.commentBubble, { marginLeft: 8, flex: 1 }]}>
                <Text style={S.commentName}>{ru.name}</Text>
                <Text style={S.commentText}>{r.text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Floating bottom nav ──────────────────────────────────────────────────────
function BottomNav({ active, onNav, onCreate, lobbyActive }) {
  const items = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'search', icon: 'search', label: 'Search' },
    { key: 'create', icon: 'add', label: 'Create' },
    { key: 'lobby', icon: 'game-controller', label: 'Lobby' },
    { key: 'profile', icon: 'person', label: 'Profile' },
  ];
  return (
    <View style={S.navWrap} pointerEvents="box-none">
      <View style={S.nav}>
        {items.map(it => {
          if (it.key === 'create') {
            return (
              <Pressable key="create" onPress={onCreate} style={S.navCenter}>
                <LinearGradient colors={[C.blue, C.blueDeep]} style={S.navCenterBtn}>
                  <Ionicons name="add" size={28} color={C.white} />
                </LinearGradient>
              </Pressable>
            );
          }
          const on = active === it.key;
          return (
            <Pressable key={it.key} onPress={() => onNav(it.key)} style={S.navItem} hitSlop={6}>
              <View>
                <Ionicons name={on ? it.icon : `${it.icon}-outline`} size={23} color={on ? C.blue : C.mutedLight} />
                {it.key === 'lobby' && lobbyActive ? <View style={S.navLobbyDot} /> : null}
              </View>
              <Text style={[S.navLabel, on && S.navLabelActive]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SCREENS
// ════════════════════════════════════════════════════════════════════════════

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomeScreen({ app }) {
  const unread = app.notifications.filter(n => !n.read).length;
  const chatUnread = app.totalUnread();
  const quick = [
    { icon: 'add-circle', label: 'Match Post', tone: C.blue, go: () => app.go('create', { type: 'Match Challenge' }) },
    { icon: 'flash', label: 'Find Challenger', tone: C.danger, go: () => app.go('challengers') },
    { icon: 'calendar', label: 'Book Venue', tone: C.green, go: () => app.go('search', { tab: 'Venues' }) },
    { icon: 'people', label: 'Create Squad', tone: C.warning, go: () => app.go('createSquad') },
  ];
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollPad}>
        {/* greeting header */}
        <View style={S.homeHead}>
          <View>
            <Text style={S.greetSmall}>Kuzuzangpo! 👋</Text>
            <Text style={S.greetBig}>{app.profile.name}</Text>
          </View>
          <View style={S.rowCenter}>
            <Pressable style={S.bell} onPress={() => app.openChatList()} hitSlop={8}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.navy} />
              {chatUnread > 0 ? <View style={S.bellBadge}><Text style={S.bellBadgeText}>{chatUnread}</Text></View> : null}
            </Pressable>
            <Pressable style={[S.bell, { marginLeft: 10 }]} onPress={() => app.go('notifications')} hitSlop={8}>
              <Ionicons name="notifications-outline" size={23} color={C.navy} />
              {unread > 0 ? <View style={S.bellBadge}><Text style={S.bellBadgeText}>{unread}</Text></View> : null}
            </Pressable>
            <Pressable onPress={() => app.go('profile')} style={{ marginLeft: 10 }}>
              <Avatar label={app.profile.name} img={app.profile.photo} size={42} accent />
            </Pressable>
          </View>
        </View>

        {/* hero */}
        <Pressable onPress={() => app.go('eventDetail', { id: 'e-futsal' })} style={S.hero}>
          <ImageBackground source={{ uri: IMG.hero }} style={S.heroBg} imageStyle={{ borderRadius: 22 }}>
            <LinearGradient colors={['rgba(11,31,77,0.15)', 'rgba(11,31,77,0.9)']} style={S.heroOverlay}>
              <Badge label="Registration Open" tone="green" dot />
              <Text style={S.heroTitle}>BHUTAN FUTSAL{'\n'}LEAGUE 2025</Text>
              <Text style={S.heroSub}>Changlimithang · Sat 7:00 PM · Nu. 20,000 prize</Text>
              <View style={S.heroBtn}><Text style={S.heroBtnText}>Register squad</Text><Ionicons name="arrow-forward" size={15} color={C.navy} /></View>
            </LinearGradient>
          </ImageBackground>
        </Pressable>

        {/* quick actions */}
        <View style={S.quickGrid}>
          {quick.map(q => (
            <Pressable key={q.label} style={S.quickItem} onPress={q.go}>
              <View style={[S.quickIcon, { backgroundColor: q.tone }]}><Ionicons name={q.icon} size={20} color={C.white} /></View>
              <Text style={S.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Players online" action="See all" onPress={() => app.go('search', { tab: 'Players' })} />
        <PlayerStories onOpen={id => app.go('userProfile', { id })} />

        <SectionHeader title="Matchmaking feed" action="Find opponents" onPress={() => app.go('challengers')} />
        {app.posts.map(p => (
          <PostCard key={p.id} app={app} post={p} squads={app.squads} comments={app.comments}
            isFollowing={app.isFollowing(p.authorType === 'squad' ? 'squad' : 'user', p.createdBy)}
            onFollow={app.toggleFollow}
            onOpen={post => app.go('postDetail', { id: post.id })}
            onOpenAuthor={(a, isSquad) => isSquad ? app.go('squadDetail', { id: a.id }) : app.go('userProfile', { id: a.id })}
            onComment={post => app.go('postDetail', { id: post.id, focus: 'comments' })}
            onRequest={post => app.openRequest(post)}
            onShare={post => app.toast('Post link copied to share', 'info')}
          />
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────
function SearchScreen({ app }) {
  const [tab, setTab] = useState(app.params.tab || 'Players');
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('All');
  const [vType, setVType] = useState('All');
  const [vIndoor, setVIndoor] = useState('All');
  const sports = ['All', ...ALL_SPORTS];
  const ql = q.toLowerCase();
  const matchSport = x => sport === 'All' || x.sport === sport || x.mainSport === sport || (x.sports || []).includes(sport);

  const players = users.filter(u => matchSport(u) && (u.name.toLowerCase().includes(ql) || u.username.includes(ql)));
  const sq = app.squads.filter(s => matchSport(s) && s.name.toLowerCase().includes(ql));
  const vn = venues.filter(v => (sport === 'All' || v.sports.includes(sport)) && (vType === 'All' || v.venueType === vType) && (vIndoor === 'All' || v.indoor === vIndoor) && v.name.toLowerCase().includes(ql));
  const ev = app.events.filter(e => matchSport(e) && e.title.toLowerCase().includes(ql));

  return (
    <Screen>
      <View style={S.searchHead}>
        <Text style={S.h1}>Discover</Text>
        <View style={S.searchBar}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder={`Search ${tab.toLowerCase()}…`} placeholderTextColor={C.mutedLight} style={S.searchInput} />
          {q ? <Pressable onPress={() => setQ('')}><Ionicons name="close-circle" size={18} color={C.mutedLight} /></Pressable> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[S.segment, { flexGrow: 1 }]}>
          {['Players', 'Squads', 'Venues', 'Events', 'Challengers'].map(t => (
            <Pressable key={t} onPress={() => setTab(t)} style={[S.segItemFlex, tab === t && S.segItemActive]}>
              <Text style={[S.segText, tab === t && S.segTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow}>
          {sports.map(s => <Chip key={s} label={s} active={sport === s} onPress={() => setSport(s)} />)}
        </ScrollView>
        {tab === 'Venues' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[S.filterRow, { paddingTop: 0 }]}>
              {['All', ...VENUE_TYPES].map(t => <Chip key={t} label={t} active={vType === t} onPress={() => setVType(t)} />)}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[S.filterRow, { paddingTop: 0 }]}>
              {['All', 'Indoor', 'Outdoor'].map(t => <Chip key={t} label={t} active={vIndoor === t} onPress={() => setVIndoor(t)} />)}
            </ScrollView>
          </>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollPad}>
        {tab === 'Players' && players.map(u => (
          <Pressable key={u.id} style={S.listRow} onPress={() => app.go('userProfile', { id: u.id })}>
            <Avatar label={u.name} size={48} accent={u.id === currentUser.id} online={u.availability === 'Available'} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={S.listTitle}>{u.name}</Text>
              <Text style={S.listSub}>{u.mainSport} · {u.skillLevel} · ⭐ {u.rating}</Text>
            </View>
            <Pressable onPress={() => app.toggleFollow('user', u.id, u.name)} style={[S.followMini, app.isFollowing('user', u.id) && S.followMiniActive]}>
              <Text style={[S.followMiniText, app.isFollowing('user', u.id) && S.followMiniTextActive]}>{app.isFollowing('user', u.id) ? 'Following' : 'Follow'}</Text>
            </Pressable>
          </Pressable>
        ))}

        {tab === 'Squads' && sq.map(s => (
          <Pressable key={s.id} style={S.listRow} onPress={() => app.go('squadDetail', { id: s.id })}>
            <Avatar label={s.name} size={48} ring="green" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={S.listTitle}>{s.name}</Text>
              <Text style={S.listSub}>{s.sport} · {s.members.length} players · {app.followerCount('squad', s.id, s.followers)} followers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.mutedLight} />
          </Pressable>
        ))}

        {tab === 'Venues' && vn.map(v => (
          <Pressable key={v.id} style={S.venueCard} onPress={() => app.go('venueDetail', { id: v.id })}>
            <Image source={{ uri: v.image }} style={S.venueImg} />
            <View style={S.venueBody}>
              <Text style={S.listTitle}>{v.name}</Text>
              <Text style={S.listSub}>{v.location}</Text>
              <View style={[S.rowCenter, { flexWrap: 'wrap', gap: 6, marginTop: 6 }]}>
                <Badge label={`⭐ ${v.rating}`} tone="green" />
                <Badge label={v.venueType} tone="navy" />
                <Badge label={v.indoor} tone="blue" />
                <View style={{ flex: 1 }} />
                <Text style={S.venuePrice}>{money(v.pricePerHour)}<Text style={S.venuePriceUnit}>/{v.priceUnit}</Text></Text>
              </View>
              <View style={S.rowGap}>
                {v.venueType === 'Gym' && v.membership ? (
                  <AppButton title="Membership" variant="secondary" icon="card-outline" small fill onPress={() => app.go('membership', { venueId: v.id })} />
                ) : null}
                <AppButton title="Book Now" icon="calendar" small fill onPress={() => app.go(v.venueType === 'Gym' ? 'venueDetail' : 'booking', v.venueType === 'Gym' ? { id: v.id } : { venueId: v.id })} />
              </View>
            </View>
          </Pressable>
        ))}

        {tab === 'Events' && ev.map(e => (
          <Pressable key={e.id} style={S.venueCard} onPress={() => app.go('eventDetail', { id: e.id })}>
            <Image source={{ uri: e.image }} style={S.venueImg} />
            <View style={S.venueBody}>
              <View style={S.rowCenter}><Badge label={e.status} tone={statusTone(e.status)} dot /><View style={{ width: 6 }} /><Badge label={e.sport} tone="navy" /></View>
              <Text style={[S.listTitle, { marginTop: 6 }]}>{e.title}</Text>
              <Text style={S.listSub}>{e.location} · {e.date}</Text>
              <Text style={[S.listSub, { color: C.blue, fontWeight: '700' }]}>{e.fee} · {e.slots}</Text>
            </View>
          </Pressable>
        ))}

        {tab === 'Challengers' && (
          <>
            <Pressable style={S.discoverCta} onPress={() => app.go('challengers')}>
              <View style={S.discoverIcon}><Ionicons name="options" size={18} color={C.white} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}><Text style={S.listTitle}>Open Challenger Finder</Text><Text style={S.listSub}>Filter by skill, time, venue, split & more</Text></View>
              <Ionicons name="chevron-forward" size={18} color={C.mutedLight} />
            </Pressable>
            <ChallengerResults app={app} sport={sport === 'All' ? null : sport} query={ql} />
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Media upload (in-app gallery / video picker) ─────────────────────────────
function MediaUpload({ media, onChange }) {
  const [pick, setPick] = useState(false);
  return (
    <View>
      {media ? (
        <View style={S.mediaPreview}>
          <Image source={{ uri: media.url }} style={S.mediaPreviewImg} />
          {media.video ? <View style={S.videoBadge}><Ionicons name="play" size={14} color={C.white} /><Text style={S.videoBadgeText}>Video</Text></View> : null}
          <View style={S.mediaActions}>
            <Pressable style={S.mediaActionBtn} onPress={() => setPick(true)}><Ionicons name="swap-horizontal" size={15} color={C.white} /><Text style={S.mediaActionText}>Replace</Text></Pressable>
            <Pressable style={S.mediaActionBtn} onPress={() => onChange(null)}><Ionicons name="trash" size={15} color={C.white} /><Text style={S.mediaActionText}>Remove</Text></Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={S.mediaAdd} onPress={() => setPick(true)}>
          <View style={S.mediaAddIcon}><Ionicons name="image" size={24} color={C.blue} /></View>
          <Text style={S.mediaAddText}>Add photo or video</Text>
          <Text style={S.mediaAddSub}>Upload from gallery, camera, or pick a clip</Text>
        </Pressable>
      )}
      {pick ? (
        <View style={S.mediaGalleryPanel}>
          <View style={S.rowCenter}>
            <Text style={[S.miniLabel, { marginTop: 0 }]}>Choose media</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => setPick(false)} hitSlop={8}><Text style={S.secAction}>Close</Text></Pressable>
          </View>
          <View style={S.mediaGrid}>
            <Pressable style={S.mediaVideoTile} onPress={() => { onChange({ url: IMG.feed, video: true }); setPick(false); }}>
              <Ionicons name="videocam" size={20} color={C.blue} /><Text style={S.mediaTileText}>Video</Text>
            </Pressable>
            {MEDIA_GALLERY.map(m => (
              <Pressable key={m.id} onPress={() => { onChange({ url: m.url }); setPick(false); }}>
                <Image source={{ uri: m.url }} style={S.mediaThumb} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ─── Create post ──────────────────────────────────────────────────────────────
const POST_TYPES = [
  { key: 'Match Challenge', icon: 'flame', desc: 'We have a team — come compete' },
  { key: 'Match Result', icon: 'trophy', desc: 'Share a score & rematch call' },
  { key: 'Squad Recruitment', icon: 'people', desc: 'Recruit players for your squad' },
  { key: 'General', icon: 'chatbubble-ellipses', desc: 'A general post to the community' },
  { key: 'Venue Review', icon: 'star', desc: 'Rate a venue you played at' },
  { key: 'Event', icon: 'calendar', desc: 'Announce a tournament or meetup' },
  { key: 'Gym Progress', icon: 'barbell', desc: 'Share training & progress' },
];

function CreatePostScreen({ app }) {
  const mySquads = app.squads.filter(s => s.members.some(m => m.userId === currentUser.id));
  const [type, setType] = useState(app.params.type || null);
  const [squadId, setSquadId] = useState(mySquads[0] ? mySquads[0].id : (app.squads[0] && app.squads[0].id));
  const [sport, setSport] = useState('Futsal');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [teamSize, setTeamSize] = useState('5v5');
  const [time, setTime] = useState('Tonight, 7:00 PM');
  const [venueId, setVenueId] = useState('v-chang');
  const [split, setSplit] = useState('50/50 Team Split');
  const [skill, setSkill] = useState('Competitive');
  const [media, setMedia] = useState(null);
  const [opponentName, setOpponentName] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [rating, setRating] = useState(5);
  const [roles, setRoles] = useState([]);
  const [trainingType, setTrainingType] = useState('Strength');
  const [eventFee, setEventFee] = useState('Nu. 1,000/team');
  const [preview, setPreview] = useState(false);
  const [posting, setPosting] = useState(false);

  const splits = ['50/50 Team Split', 'Per Player Split', 'Host Pays', 'Custom Split', 'Loser Pays'];
  const isChallenge = type === 'Match Challenge';
  const isRecruit = type === 'Squad Recruitment';
  const isMatch = isChallenge || isRecruit;
  const draftAttached = isChallenge && app.draftPlan;
  const squad = getSquad(app.squads, squadId);

  const pickType = t => { app.clearDraftTactics(); setType(t); if (t === 'Squad Recruitment') setTeamSize('+1 player'); };
  const changeSport = s => { setSport(s); setTeamSize(teamSizeFor(s)); if (app.draftPlan) app.clearDraftTactics(); };

  const valid = () => {
    if (!caption.trim() && type !== 'Match Result') return 'Add a caption first';
    if (type === 'Match Result' && (!scoreA || !scoreB)) return 'Add the final score';
    if (type === 'Event' && !title.trim()) return 'Add an event title';
    return null;
  };
  const publish = () => {
    const err = valid(); if (err) { app.toast(err, 'error'); return; }
    setPosting(true);
    setTimeout(() => {
      const v = venueId === 'none' ? null : getVenue(venueId);
      app.createPost({
        postType: type, sport, title: title.trim() || type, caption: caption.trim(),
        teamSize, preferredTime: time, venueId: isMatch && v ? venueId : null,
        venueName: isMatch ? (v ? v.name : 'Venue not booked yet') : (type === 'Venue Review' ? getVenue(venueId).name : null),
        paymentSplit: split, skillLevel: skill,
        image: media ? media.url : null, media: media || null,
        tactics: draftAttached ? JSON.parse(JSON.stringify(app.draftPlan)) : null,
        result: type === 'Match Result' ? `${scoreA} - ${scoreB}` : undefined,
        opponentName: type === 'Match Result' ? (opponentName || 'Opponent') : undefined,
        rating: type === 'Venue Review' ? rating : undefined,
        roles: isRecruit ? roles : undefined,
        trainingType: type === 'Gym Progress' ? trainingType : undefined,
        fee: type === 'Event' ? eventFee : undefined,
        status: isChallenge ? 'Looking for Opponent' : isRecruit ? 'Open' : undefined,
        expiry: isMatch ? '3h 00m' : undefined,
        createdBy: isMatch || type === 'Match Result' ? squadId : currentUser.id,
        authorType: isMatch || type === 'Match Result' ? 'squad' : 'user',
      });
      app.clearDraftTactics();
      setPosting(false); setPreview(false); app.back();
    }, 700);
  };

  if (!type) {
    return (
      <Screen>
        <TopBar title="Create post" onBack={app.back} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={S.h2}>What do you want to post?</Text>
          {POST_TYPES.map(t => (
            <Pressable key={t.key} style={S.typeRow} onPress={() => pickType(t.key)}>
              <View style={S.typeIcon}><Ionicons name={t.icon} size={20} color={C.blue} /></View>
              <View style={{ flex: 1 }}>
                <Text style={S.listTitle}>{t.key}</Text>
                <Text style={S.listSub}>{t.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.mutedLight} />
            </Pressable>
          ))}
        </ScrollView>
      </Screen>
    );
  }

  const SquadPicker = () => (
    <>
      <Text style={S.inputLabel}>Select squad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
        {(mySquads.length ? mySquads : app.squads).map(s => <Chip key={s.id} label={s.name} active={squadId === s.id} onPress={() => { setSquadId(s.id); setSport(s.sport); }} />)}
      </ScrollView>
    </>
  );
  const SportPicker = () => (
    <>
      <Text style={S.inputLabel}>Choose sport</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
        {ALL_SPORTS.map(s => <Chip key={s} label={s} icon={sportIcon(s)} active={sport === s} onPress={() => changeSport(s)} />)}
      </ScrollView>
    </>
  );

  return (
    <Screen>
      <TopBar title={type} onBack={() => setType(null)} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {(isMatch || type === 'Match Result') ? <SquadPicker /> : null}
        {type !== 'Venue Review' && type !== 'General' ? <SportPicker /> : null}

        {type === 'Event' ? (<><Text style={S.inputLabel}>Event title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Thimphu Futsal Cup" placeholderTextColor={C.mutedLight} style={S.input} /></>) : null}
        {type !== 'Event' && type !== 'Match Result' ? (<><Text style={S.inputLabel}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Give your post a title" placeholderTextColor={C.mutedLight} style={S.input} /></>) : null}

        {/* Match Result fields */}
        {type === 'Match Result' ? (
          <>
            <Text style={S.inputLabel}>Opponent</Text>
            <TextInput value={opponentName} onChangeText={setOpponentName} placeholder="Opponent squad name" placeholderTextColor={C.mutedLight} style={S.input} />
            <Text style={S.inputLabel}>Final score</Text>
            <View style={S.scoreRow}>
              <TextInput value={scoreA} onChangeText={setScoreA} keyboardType="number-pad" maxLength={2} placeholder="0" placeholderTextColor={C.mutedLight} style={[S.input, S.scoreInput]} />
              <Text style={S.scoreDash}>–</Text>
              <TextInput value={scoreB} onChangeText={setScoreB} keyboardType="number-pad" maxLength={2} placeholder="0" placeholderTextColor={C.mutedLight} style={[S.input, S.scoreInput]} />
            </View>
          </>
        ) : null}

        {/* Venue Review fields */}
        {type === 'Venue Review' ? (
          <>
            <Text style={S.inputLabel}>Venue</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              {venues.map(v => <Chip key={v.id} label={v.name.split(' ')[0]} active={venueId === v.id} onPress={() => setVenueId(v.id)} />)}
            </ScrollView>
            <Text style={S.inputLabel}>Rating</Text>
            <View style={S.rowCenter}>
              {[1, 2, 3, 4, 5].map(n => <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}><Ionicons name={n <= rating ? 'star' : 'star-outline'} size={30} color={C.warning} style={{ marginRight: 4 }} /></Pressable>)}
            </View>
          </>
        ) : null}

        {/* Squad Recruitment roles */}
        {isRecruit ? (
          <>
            <Text style={S.inputLabel}>Roles needed</Text>
            <View style={S.chipWrap}>
              {rolesForSport(sport).map(r => <Chip key={r} label={r} active={roles.includes(r)} onPress={() => setRoles(rs => rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r])} />)}
            </View>
          </>
        ) : null}

        {/* Gym Progress training type */}
        {type === 'Gym Progress' ? (
          <>
            <Text style={S.inputLabel}>Training type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              {['Strength', 'Cardio', 'Mobility', 'Endurance', 'Skills', 'Recovery'].map(t => <Chip key={t} label={t} active={trainingType === t} onPress={() => setTrainingType(t)} />)}
            </ScrollView>
          </>
        ) : null}

        <Text style={S.inputLabel}>{type === 'Venue Review' ? 'Review' : 'Caption'}</Text>
        <TextInput value={caption} onChangeText={setCaption} placeholder={type === 'Venue Review' ? 'How was the venue?' : 'Write something…'} placeholderTextColor={C.mutedLight} style={[S.input, S.inputArea]} multiline />

        {/* Media — all post types */}
        <Text style={S.inputLabel}>{type === 'Event' ? 'Banner image' : 'Photo / video'}</Text>
        <MediaUpload media={media} onChange={setMedia} />

        {/* Match-specific details */}
        {isMatch ? (
          <>
            <Text style={S.inputLabel}>Team size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              {['1v1', '2v2', '3v3', '5v5', '6v6', '7v7', '11v11', '+1 player'].map(s => <Chip key={s} label={s} active={teamSize === s} onPress={() => setTeamSize(s)} />)}
            </ScrollView>
            <Text style={S.inputLabel}>Skill level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              {['Casual', 'Intermediate', 'Competitive', 'Pro'].map(s => <Chip key={s} label={s} active={skill === s} onPress={() => setSkill(s)} />)}
            </ScrollView>
            <Text style={S.inputLabel}>When</Text>
            <TextInput value={time} onChangeText={setTime} placeholder="e.g. Tonight, 7:00 PM" placeholderTextColor={C.mutedLight} style={S.input} />
            <Text style={S.inputLabel}>Venue</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              <Chip label="No venue yet" active={venueId === 'none'} onPress={() => setVenueId('none')} />
              {venues.map(v => <Chip key={v.id} label={v.name.split(' ')[0]} active={venueId === v.id} onPress={() => setVenueId(v.id)} />)}
            </ScrollView>
            <Text style={S.inputLabel}>Payment split</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              {splits.map(s => <Chip key={s} label={s} active={split === s} onPress={() => setSplit(s)} />)}
            </ScrollView>
          </>
        ) : null}

        {type === 'Event' ? (<><Text style={S.inputLabel}>Entry fee</Text>
          <TextInput value={eventFee} onChangeText={setEventFee} placeholder="e.g. Nu. 1,000/team" placeholderTextColor={C.mutedLight} style={S.input} /></>) : null}

        {/* Tactics attach — Match Challenge */}
        {isChallenge ? (
          <>
            <Text style={S.inputLabel}>Tactics plan (optional)</Text>
            {draftAttached ? (
              <View style={S.attachedCard}>
                <View style={S.attachedIcon}><MaterialCommunityIcons name="strategy" size={20} color={C.white} /></View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={S.listTitle}>Tactics attached ✓</Text>
                  <Text style={S.listSub}>{app.draftPlan.sport} · {app.draftPlan.formation} · {app.draftPlan.roster.length} players</Text>
                </View>
                <Pressable hitSlop={8} onPress={() => app.go('tacticsRoom', { draft: true })}><Text style={S.secAction}>Edit</Text></Pressable>
                <Pressable hitSlop={8} style={{ marginLeft: 12 }} onPress={() => app.clearDraftTactics()}><Ionicons name="close-circle" size={20} color={C.mutedLight} /></Pressable>
              </View>
            ) : (
              <AppButton title="Create / Attach Tactics" variant="secondary" icon="grid-outline" fill onPress={() => app.startDraftTactics(squadId, sport)} />
            )}
          </>
        ) : null}

        <View style={{ height: 18 }} />
        <View style={S.rowGap}>
          <AppButton title="Preview" variant="secondary" icon="eye-outline" small fill onPress={() => { const e = valid(); if (e) { app.toast(e, 'error'); return; } setPreview(true); }} />
          <AppButton title={posting ? 'Publishing…' : 'Publish'} icon={posting ? undefined : 'send'} loading={posting} small fill onPress={publish} />
        </View>
        {isChallenge ? <Text style={S.createHint}>After publishing, your challenge appears in the Matchmaking feed & Challengers tab so other squads can request to compete.</Text> : null}
        <View style={{ height: 20 }} />
      </ScrollView>

      {preview ? (
        <Pressable style={S.sheetOverlay} onPress={() => setPreview(false)}>
          <Pressable style={[S.sheet, { maxHeight: '86%' }]} onPress={() => {}}>
            <View style={S.sheetHandle} />
            <Text style={S.sheetTitle}>Preview post</Text>
            <Text style={S.sheetSub}>This is how your post will look in the feed.</Text>
            <ScrollView style={{ maxHeight: 480, marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <View style={S.previewCard}>
                <View style={S.rowCenter}>
                  <Avatar label={(isMatch || type === 'Match Result') ? squad.name : currentUser.name} size={40} ring={(isMatch || type === 'Match Result') ? 'green' : undefined} accent={!(isMatch || type === 'Match Result')} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={S.postName}>{(isMatch || type === 'Match Result') ? squad.name : currentUser.name}</Text>
                    <Text style={S.postMeta}>{type} · {sport}</Text>
                  </View>
                  {draftAttached ? <Badge label="Tactics ✓" tone="blue" /> : null}
                </View>
                {title ? <Text style={S.postTitle}>{title}</Text> : null}
                {type === 'Match Result' ? <Text style={S.postTitle}>{squad.name} {scoreA || 0} – {scoreB || 0} {opponentName || 'Opponent'}</Text> : null}
                {caption ? <Text style={S.postCaption}>{caption}</Text> : null}
                {media ? <View><Image source={{ uri: media.url }} style={S.postImage} />{media.video ? <View style={[S.videoBadge, { top: 22, left: 10 }]}><Ionicons name="play" size={14} color={C.white} /><Text style={S.videoBadgeText}>Video</Text></View> : null}</View> : null}
                {isMatch ? <View style={S.postMetaGrid}><Meta label="Team size" value={teamSize} /><Meta label="When" value={time} /><Meta label="Venue" value={venueId === 'none' ? 'Not booked yet' : getVenue(venueId).name} /><Meta label="Split" value={split} /></View> : null}
                {type === 'Venue Review' ? <Text style={S.postCaption}>{'⭐'.repeat(rating)} · {getVenue(venueId).name}</Text> : null}
                {isRecruit && roles.length ? <View style={[S.chipWrap, { marginTop: 10 }]}>{roles.map(r => <Badge key={r} label={r} tone="blue" />)}</View> : null}
              </View>
            </ScrollView>
            <View style={{ height: 12 }} />
            <AppButton title={posting ? 'Publishing…' : 'Publish now'} icon={posting ? undefined : 'send'} loading={posting} fill onPress={publish} />
            <View style={{ height: 8 }} />
          </Pressable>
        </Pressable>
      ) : null}
    </Screen>
  );
}

// ─── Post detail (with comments + interested) ─────────────────────────────────
function PostDetailScreen({ app }) {
  const post = app.posts.find(p => p.id === app.params.id);
  const [tab, setTab] = useState(app.params.focus === 'interested' ? 'Interested' : 'Comments');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  if (!post) return <Screen><TopBar title="Post" onBack={app.back} /><EmptyState icon="alert-circle-outline" title="Post not found" text="This post may have been removed." /></Screen>;
  const isSquad = post.authorType === 'squad';
  const author = isSquad ? getSquad(app.squads, post.createdBy) : getUser(post.createdBy);
  const squad = isSquad ? author : null;
  const list = app.comments[post.id] || [];
  const reqs = app.requests.filter(r => r.postId === post.id);
  const isChallenge = post.postType === 'Match Challenge';
  const following = app.isFollowing(isSquad ? 'squad' : 'user', post.createdBy);

  const send = () => {
    if (!text.trim()) return;
    if (replyTo) app.addReply(post.id, replyTo.id, text.trim());
    else app.addComment(post.id, text.trim());
    setText(''); setReplyTo(null);
  };

  return (
    <Screen>
      <TopBar title={isChallenge ? 'Match Challenge' : post.postType} onBack={app.back}
        right={<Pressable hitSlop={8} onPress={() => app.toast('Post link copied', 'info')}><Ionicons name="share-outline" size={20} color={C.navy} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* author */}
        <View style={S.detailHead}>
          <Pressable onPress={() => isSquad ? app.go('squadDetail', { id: author.id }) : app.go('userProfile', { id: author.id })}>
            <Avatar label={author.name} size={60} ring={isSquad ? 'green' : undefined} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={S.detailName}>{author.name}</Text>
            <Text style={S.postMeta}>@{isSquad ? author.handle : author.username} · {app.followerCount(isSquad ? 'squad' : 'user', author.id, author.followers || 0)} followers</Text>
          </View>
          <Pressable onPress={() => app.toggleFollow(isSquad ? 'squad' : 'user', author.id, author.name)} style={[S.followBtn, following && S.followBtnActive]}>
            <Text style={[S.followBtnText, following && S.followBtnTextActive]}>{following ? 'Following' : 'Follow'}</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {post.title ? <Text style={S.detailTitle}>{post.title}</Text> : null}
          <View style={S.postTypeRow}>
            {post.sport ? <Badge label={post.sport} tone="navy" /> : null}
            {post.skillLevel ? <Badge label={post.skillLevel} tone="blue" /> : null}
            {post.teamSize ? <Badge label={post.teamSize} tone="blue" /> : null}
          </View>
          <Text style={S.detailCaption}>{post.caption}</Text>
          {post.image ? <Image source={{ uri: post.image }} style={S.detailImage} /> : null}

          {/* social actions */}
          <View style={S.postActions}>
            <LikeButton liked={app.isLiked(post.id)} count={app.likeCount(post.id, post.likes)} onToggle={() => app.toggleLike(post.id, post.likes)} />
            <Pressable style={S.iconBtn} onPress={() => setTab('Comments')} hitSlop={8}>
              <Ionicons name="chatbubble-outline" size={20} color={C.muted} /><Text style={S.iconBtnCount}>{list.length}</Text>
            </Pressable>
            <Pressable style={S.iconBtn} onPress={() => app.openShare(post)} hitSlop={8}>
              <Ionicons name="paper-plane-outline" size={20} color={C.muted} /><Text style={S.iconBtnCount}>{app.shareCount(post.id, post.shares || 0)}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <SaveButton saved={app.isSaved(post.id)} onToggle={() => app.toggleSave(post.id)} />
          </View>

          {isChallenge ? (
            <>
              <View style={S.statusRow}>
                <Badge label={post.status} tone={statusTone(post.status)} dot />
                {post.expiry ? <View style={S.expiryRow}><PulseDot color={C.warning} size={8} /><Text style={S.expiryText}>Expires in {post.expiry}</Text></View> : null}
              </View>
              <View style={S.postMetaGrid}>
                <Meta label="When" value={post.preferredTime} icon="time-outline" />
                <Meta label="Venue" value={post.venueName} icon="location-outline" />
                <Meta label="Team size" value={post.teamSize} icon="people-outline" />
                <Meta label="Split" value={post.paymentSplit} icon="cash-outline" />
              </View>
              {squad ? (
                <>
                  <Text style={S.miniLabel}>Squad lineup</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6 }}>
                    {squad.members.map(m => {
                      const u = getUser(m.userId);
                      return (
                        <Pressable key={m.userId} style={{ alignItems: 'center', width: 56 }} onPress={() => app.go('userProfile', { id: m.userId })}>
                          <Avatar label={u.name} size={48} accent={m.isCaptain} online={m.availability === 'Available'} />
                          <Text style={S.storyName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                          <Text style={S.lineupRole} numberOfLines={1}>{m.role}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}
              {post.tactics ? (
                <Pressable style={S.viewTacticsRow} onPress={() => app.go('tacticsRoom', { postId: post.id })}>
                  <View style={S.attachedIcon}><MaterialCommunityIcons name="strategy" size={18} color={C.white} /></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={S.listTitle}>Tactics attached</Text>
                    <Text style={S.listSub}>{post.tactics.sport} · {post.tactics.formation} · {post.tactics.roster.length} players</Text>
                  </View>
                  <Text style={S.secAction}>View</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {/* tabs */}
          <View style={S.tabRow}>
            <Pressable onPress={() => setTab('Comments')} style={[S.tabItem, tab === 'Comments' && S.tabItemActive]}>
              <Text style={[S.tabText, tab === 'Comments' && S.tabTextActive]}>Comments ({list.length})</Text>
            </Pressable>
            {isChallenge ? (
              <Pressable onPress={() => setTab('Interested')} style={[S.tabItem, tab === 'Interested' && S.tabItemActive]}>
                <Text style={[S.tabText, tab === 'Interested' && S.tabTextActive]}>Interested ({reqs.length})</Text>
              </Pressable>
            ) : null}
          </View>

          {tab === 'Comments' ? (
            list.length ? list.map(c => (
              <CommentRow key={c.id} c={c} onLike={id => app.likeComment(post.id, id)} onReply={cc => setReplyTo(cc)} />
            )) : <EmptyState icon="chatbubble-ellipses-outline" title="No comments yet" text="Be the first to comment on this post." />
          ) : (
            reqs.length ? reqs.map(r => {
              const rs = getSquad(app.squads, r.requestingSquadId);
              return (
                <View key={r.id} style={S.requestCard}>
                  <Pressable style={S.rowCenter} onPress={() => app.go('squadDetail', { id: rs.id })}>
                    <Avatar label={rs.name} size={40} ring="green" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={S.listTitle}>{rs.name}</Text>
                      <Text style={S.listSub}>{rs.members.length} players · {r.createdAt}</Text>
                    </View>
                    <Badge label={r.status} tone={statusTone(r.status)} />
                  </Pressable>
                  <Text style={S.requestMsg}>{r.message}</Text>
                  {r.status === 'Pending' && squad && squad.members.some(m => m.userId === currentUser.id && (m.isCaptain || m.isViceCaptain)) ? (
                    <View style={S.rowGap}>
                      <AppButton title="Accept" icon="checkmark" variant="green" small fill onPress={() => app.acceptRequest(r.id)} />
                      <AppButton title="Reject" icon="close" variant="danger" small fill onPress={() => app.rejectRequest(r.id)} />
                    </View>
                  ) : null}
                </View>
              );
            }) : <EmptyState icon="people-outline" title="No requests yet" text="No squads have requested to compete." />
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* bottom: comment composer OR action buttons */}
      {tab === 'Comments' ? (
        <View style={S.composer}>
          {replyTo ? (
            <View style={S.replyChip}><Text style={S.replyChipText}>Replying to {getUser(replyTo.userId).name}</Text><Pressable onPress={() => setReplyTo(null)}><Ionicons name="close" size={14} color={C.muted} /></Pressable></View>
          ) : null}
          <View style={S.composerRow}>
            <TextInput value={text} onChangeText={setText} placeholder="Add a comment…" placeholderTextColor={C.mutedLight} style={S.composerInput} multiline />
            <Pressable onPress={send} style={[S.sendBtn, !text.trim() && { opacity: 0.4 }]} disabled={!text.trim()}>
              <Ionicons name="arrow-up" size={20} color={C.white} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={S.detailActions}>
          <AppButton title="Message Captain" variant="secondary" icon="chatbubble-outline" fill onPress={() => app.openCaptainChat(post)} />
          {isChallenge && post.status === 'Looking for Opponent' ? (
            <AppButton title="Request to Compete" icon="flash" fill onPress={() => app.openRequest(post)} />
          ) : isChallenge ? (
            <AppButton title="View Lobby" icon="game-controller" fill onPress={() => app.openLobbyForPost(post)} />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

// ─── Request-to-compete sheet ─────────────────────────────────────────────────
function RequestSheet({ app }) {
  const post = app.posts.find(p => p.id === app.requestPostId);
  const mySquads = app.squads.filter(s => s.members.some(m => m.userId === currentUser.id) && s.sport === (post ? post.sport : s.sport));
  const [squadId, setSquadId] = useState(mySquads[0] ? mySquads[0].id : app.squads[0].id);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  if (!post) return null;
  const send = () => {
    setSending(true);
    setTimeout(() => {
      app.sendRequest(post.id, squadId, msg.trim() || 'We are ready to compete. Let\'s play!');
      setSending(false); app.closeRequest();
    }, 600);
  };
  return (
    <Pressable style={S.sheetOverlay} onPress={app.closeRequest}>
      <Pressable style={S.sheet} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>Request to Compete</Text>
        <Text style={S.sheetSub}>Against {getSquad(app.squads, post.createdBy).name} · {post.teamSize} · {post.preferredTime}</Text>
        <Text style={S.inputLabel}>Select your squad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
          {(mySquads.length ? mySquads : app.squads.slice(0, 3)).map(s => <Chip key={s.id} label={s.name} active={squadId === s.id} onPress={() => setSquadId(s.id)} />)}
        </ScrollView>
        <Text style={S.inputLabel}>Message to captain</Text>
        <TextInput value={msg} onChangeText={setMsg} placeholder="We have a full squad and accept the split…" placeholderTextColor={C.mutedLight} style={[S.input, S.inputArea]} multiline />
        <View style={{ height: 12 }} />
        <AppButton title={sending ? 'Sending request…' : 'Send request'} icon={sending ? undefined : 'flash'} loading={sending} fill onPress={send} />
        <View style={{ height: 8 }} />
      </Pressable>
    </Pressable>
  );
}

// ─── Lineup builders (shared by lobby + tactics) ──────────────────────────────
function buildLineup(squad, sport) {
  const board = getBoard(sport);
  const count = board.players;
  const form = board.formations[Object.keys(board.formations)[0]];
  const out = [];
  const used = new Set();
  (squad.members || []).forEach(m => {
    if (out.length < count) {
      const u = getUser(m.userId);
      out.push({ pid: m.userId, num: out.length + 1, name: u.name, role: (form[out.length] || {}).r || m.role, cap: !!m.isCaptain });
      used.add(m.userId);
    }
  });
  let fi = 1;
  while (out.length < count) {
    const filler = users.find(u => !used.has(u.id));
    if (filler) { used.add(filler.id); out.push({ pid: filler.id, num: out.length + 1, name: filler.name, role: (form[out.length] || {}).r || 'Sub', cap: false }); }
    else { out.push({ pid: 'sub-' + fi++, num: out.length + 1, name: 'Sub ' + out.length, role: (form[out.length] || {}).r || 'Sub', cap: false }); }
  }
  return out;
}
function formationPositions(sport, lineup, formationName) {
  const board = getBoard(sport);
  const form = board.formations[formationName] || Object.values(board.formations)[0];
  const pos = {};
  lineup.forEach((p, i) => { const f = form[i] || { x: 50, y: 50 }; pos[p.pid] = { x: f.x, y: f.y }; });
  return pos;
}

// ─── Lobby list ───────────────────────────────────────────────────────────────
function LobbyListScreen({ app }) {
  return (
    <Screen>
      <View style={S.searchHead}>
        <Text style={S.h1}>Lobbies</Text>
        <Text style={S.subtle}>Active matches & squad rooms</Text>
      </View>
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Match lobbies" />
        {app.lobbies.length ? app.lobbies.map(l => {
          const a = getSquad(app.squads, l.teamAId), b = getSquad(app.squads, l.teamBId);
          return (
            <Pressable key={l.id} style={S.lobbyCard} onPress={() => app.go('matchLobby', { id: l.id })}>
              <LinearGradient colors={[C.navy, C.blueDeep]} style={S.lobbyCardBg}>
                <View style={S.rowCenter}>
                  <Badge label={l.status} tone={statusTone(l.status)} dot dark />
                  <View style={{ flex: 1 }} />
                  <Text style={S.lobbyId}>#{l.id.toUpperCase()}</Text>
                </View>
                <View style={S.vsRow}>
                  <View style={S.vsTeam}><Avatar label={a.name} size={46} ring="green" /><Text style={S.vsName} numberOfLines={1}>{a.name}</Text></View>
                  <Text style={S.vsText}>VS</Text>
                  <View style={S.vsTeam}><Avatar label={b.name} size={46} ring="wood" /><Text style={S.vsName} numberOfLines={1}>{b.name}</Text></View>
                </View>
                <View style={S.rowCenter}>
                  <Ionicons name="location-outline" size={13} color={C.mutedLight} />
                  <Text style={S.lobbyMeta}>{getVenue(l.venueId).name} · {l.date}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        }) : <EmptyState icon="game-controller-outline" title="No active lobbies" text="Accept a challenge or get your request accepted to create a match lobby." />}

        <SectionHeader title="My squads" action="View all" onPress={() => app.go('profile', { tab: 'Squads' })} />
        {app.squads.filter(s => s.members.some(m => m.userId === currentUser.id)).map(s => (
          <Pressable key={s.id} style={S.listRow} onPress={() => app.go('squadDetail', { id: s.id })}>
            <Avatar label={s.name} size={46} ring="green" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={S.listTitle}>{s.name}</Text>
              <Text style={S.listSub}>{s.sport} · {s.wins}W {s.losses}L · ⭐ {s.rating}</Text>
            </View>
            <Pressable style={S.chatMini} onPress={() => app.openSquadChat(s.id)}><Ionicons name="chatbubble-ellipses" size={18} color={C.blue} /></Pressable>
          </Pressable>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Match lobby ──────────────────────────────────────────────────────────────
function MatchLobbyScreen({ app }) {
  const l = app.lobbies.find(x => x.id === app.params.id);
  if (!l) return <Screen><TopBar title="Lobby" onBack={app.back} /><EmptyState icon="game-controller-outline" title="Lobby not found" text="This lobby may have been cancelled." /></Screen>;
  const a = getSquad(app.squads, l.teamAId), b = getSquad(app.squads, l.teamBId);
  const board = getBoard(l.sport);
  const req = Math.min(board.players, 5);
  const venueBooking = l.bookingId ? app.getBooking(l.bookingId) : null;
  const venueConfirmed = !l.bookingId || (venueBooking && venueBooking.status === 'Confirmed');
  const cond = {
    accepted: true,
    ready: l.readyA >= req && l.readyB >= req,
    lineup: l.lineupAConfirmed && l.lineupBConfirmed,
    payment: l.paymentTermsAccepted,
    venue: !!l.venueId && venueConfirmed,
    payStatus: ['Paid', 'Pending', 'Partially Paid'].includes(l.paymentStatus),
  };
  const canLock = Object.values(cond).every(Boolean) && l.status !== 'Match Locked' && l.status !== 'Completed' && l.status !== 'Cancelled';
  const locked = l.status === 'Match Locked' || l.status === 'Completed';
  const thread = app.getThread(l.threadId);
  const lastMsg = thread && thread.messages.length ? thread.messages[thread.messages.length - 1] : null;
  const splitLeft = l.paymentSplit.includes('Host') ? 100 : l.paymentSplit.includes('Loser') ? 50 : 50;

  const Check = ({ ok, label, hint, onPress }) => (
    <Pressable style={S.checkRow} onPress={onPress} disabled={!onPress}>
      <View style={[S.checkBox, ok && S.checkBoxOn]}>{ok ? <Ionicons name="checkmark" size={13} color={C.white} /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={[S.checkLabel, ok && { color: C.text }]}>{label}</Text>
        {hint ? <Text style={S.checkHint}>{hint}</Text> : null}
      </View>
      {onPress && !ok ? <Text style={S.checkAction}>Tap</Text> : null}
    </Pressable>
  );

  return (
    <Screen>
      <TopBar title="Match Lobby" onBack={app.back}
        right={<Pressable hitSlop={8} onPress={() => app.cancelLobby(l.id)}><Ionicons name="ellipsis-horizontal" size={20} color={C.navy} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* VS hero */}
        <LinearGradient colors={[C.navy, C.blueDeep]} style={S.lobbyHero}>
          <View style={S.rowCenter}>
            <Badge label={l.status} tone={statusTone(l.status)} dot dark />
            <View style={{ flex: 1 }} />
            <Text style={S.lobbyId}>MATCH #{l.id.toUpperCase()}</Text>
          </View>
          <View style={S.vsRowBig}>
            <View style={S.vsTeam}>
              <Avatar label={a.name} size={64} ring="green" />
              <Text style={S.vsNameBig} numberOfLines={1}>{a.name}</Text>
              <Text style={S.vsReady}>{l.readyA}/{req} ready</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={S.vsTextBig}>VS</Text>
              <Text style={S.vsSport}>{l.sport}</Text>
            </View>
            <View style={S.vsTeam}>
              <Avatar label={b.name} size={64} ring="wood" />
              <Text style={S.vsNameBig} numberOfLines={1}>{b.name}</Text>
              <Text style={S.vsReady}>{l.readyB}/{req} ready</Text>
            </View>
          </View>
          <View style={S.lobbyVenueRow}>
            <Ionicons name="location-outline" size={14} color={C.lime} />
            <Text style={S.lobbyVenueText}>{getVenue(l.venueId).name} · {l.date}</Text>
          </View>
        </LinearGradient>

        <View style={{ padding: 16 }}>
          {/* lineups */}
          <Text style={S.miniLabel}>Lineups</Text>
          {[{ s: a, key: 'A', ready: l.readyA, conf: l.lineupAConfirmed }, { s: b, key: 'B', ready: l.readyB, conf: l.lineupBConfirmed }].map(t => (
            <View key={t.key} style={S.lineupCard}>
              <View style={S.rowCenter}>
                <Text style={S.lineupTeam}>{t.s.name}</Text>
                {t.conf ? <Badge label="Confirmed" tone="green" /> : <Badge label="Pending" tone="orange" />}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
                {buildLineup(t.s, l.sport).slice(0, req).map(p => (
                  <View key={p.pid} style={{ alignItems: 'center', width: 50 }}>
                    <Avatar label={p.name} size={42} accent={p.cap} />
                    <Text style={S.lineupRole} numberOfLines={1}>{p.role}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}

          {/* payment split donut */}
          <Text style={S.miniLabel}>Payment split</Text>
          <View style={S.payCard}>
            <DonutSplit left={splitLeft} right={100 - splitLeft} labelA={a.name} labelB={b.name} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={S.payMode}>{l.paymentSplit}</Text>
              <Text style={S.payAmount}>{money(getVenue(l.venueId).pricePerHour)} total</Text>
              <View style={S.rowCenter}><View style={[S.legendDot, { backgroundColor: C.blue }]} /><Text style={S.legendText}>{a.name}</Text></View>
              <View style={S.rowCenter}><View style={[S.legendDot, { backgroundColor: C.green }]} /><Text style={S.legendText}>{b.name}</Text></View>
              <View style={{ height: 8 }} />
              <Badge label={`Payment: ${l.paymentStatus}`} tone={statusTone(l.paymentStatus)} />
            </View>
          </View>
          <View style={S.rowGap}>
            <AppButton title={l.paymentStatus === 'Paid' ? 'Paid ✓' : 'Pay now'} variant={l.paymentStatus === 'Paid' ? 'green' : 'primary'} icon={l.paymentStatus === 'Paid' ? 'checkmark' : 'card'} small fill
              disabled={l.paymentStatus === 'Paid'} onPress={() => app.payLobby(l.id)} />
            <AppButton title={l.paymentTermsAccepted ? 'Terms accepted' : 'Accept terms'} variant="secondary" small fill icon={l.paymentTermsAccepted ? 'checkmark' : 'document-text-outline'} onPress={() => app.acceptPaymentTerms(l.id)} />
          </View>

          {/* chat preview */}
          <Text style={S.miniLabel}>Lobby chat</Text>
          <Pressable style={S.chatPreview} onPress={() => app.go('chat', { threadId: l.threadId })}>
            <View style={S.chatPreviewIcon}><Ionicons name="chatbubbles" size={18} color={C.white} /></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={S.listTitle}>Match lobby chat</Text>
              <Text style={S.listSub} numberOfLines={1}>{lastMsg ? `${getUser(lastMsg.userId).name.split(' ')[0]}: ${lastMsg.text}` : 'Say hello to your opponent…'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.mutedLight} />
          </Pressable>

          {/* tactics CTA */}
          <Pressable style={S.tacticsCta} onPress={() => app.go('tacticsRoom', { lobbyId: l.id })}>
            <LinearGradient colors={[C.blue, C.blueDeep]} style={S.tacticsCtaBg}>
              <MaterialCommunityIcons name="strategy" size={26} color={C.white} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.tacticsCtaTitle}>Open Tactics Room</Text>
                <Text style={S.tacticsCtaSub}>{l.tactics.formation} · {l.tactics.locked ? 'Locked' : 'Editable'} · {l.sport} board</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={C.white} />
            </LinearGradient>
          </Pressable>

          {/* readiness toggles */}
          <Text style={S.miniLabel}>Match readiness</Text>
          <View style={S.payCard2}>
            <Check ok={cond.ready} label="Both teams ready" hint={`${l.readyA}/${req} · ${l.readyB}/${req}`} onPress={() => app.toggleReady(l.id)} />
            <Check ok={cond.lineup} label="Lineups confirmed" hint="Captains confirm starting players" onPress={() => app.confirmLineups(l.id)} />
            <Check ok={cond.payment} label="Payment terms accepted" hint={l.paymentSplit} onPress={() => app.acceptPaymentTerms(l.id)} />
            <Check ok={cond.venue} label="Venue booking confirmed" hint={l.bookingId ? `${getVenue(l.venueId).name} · ${venueBooking ? venueBooking.status : 'Pending'}` : getVenue(l.venueId).name}
              onPress={l.bookingId && !venueConfirmed ? () => app.payBooking(l.bookingId) : undefined} />
            <Check ok={cond.payStatus} label="Payment valid" hint={`Status: ${l.paymentStatus}`} />
          </View>

          {/* lock */}
          <View style={{ marginTop: 8 }}>
            {locked ? (
              <>
                <View style={S.lockedBanner}><Ionicons name="lock-closed" size={18} color={C.white} /><Text style={S.lockedBannerText}>Match locked & confirmed</Text></View>
                {l.status !== 'Completed' ? <View style={{ height: 10 }} /> : null}
                {l.status !== 'Completed' ? <AppButton title="Mark match completed" variant="green" icon="flag" fill onPress={() => app.completeMatch(l.id)} /> : null}
              </>
            ) : (
              <AppButton title={canLock ? 'Lock Match' : 'Complete all conditions to lock'} icon={canLock ? 'lock-closed' : 'lock-open'} fill disabled={!canLock} onPress={() => app.lockMatch(l.id)} />
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ─── Tactics Room ─────────────────────────────────────────────────────────────
const TACTICS_SPORTS = ['Football', 'Futsal', 'Basketball', 'Volleyball', 'Badminton', 'Cricket', 'Table Tennis'];
function TacticsRoomScreen({ app }) {
  const pr = app.params;
  const ctx = pr.lobbyId ? { kind: 'lobby', id: pr.lobbyId }
    : pr.draft ? { kind: 'draft' }
    : pr.postId ? { kind: 'post', id: pr.postId }
    : { kind: 'squad', id: pr.squadId, planId: pr.planId };
  const lobby = ctx.kind === 'lobby' ? app.lobbies.find(x => x.id === ctx.id) : null;
  const plan = app.readPlan(ctx);
  const squadId = ctx.kind === 'lobby' ? (lobby && lobby.teamAId)
    : ctx.kind === 'draft' ? (app.draftPlan && app.draftPlan.squadId)
    : ctx.kind === 'post' ? ((app.posts.find(p => p.id === ctx.id) || {}).createdBy)
    : ctx.id;
  const squad = getSquad(app.squads, squadId);
  const opponent = lobby ? getSquad(app.squads, lobby.teamBId) : null;
  const canEdit = app.canEditTactics(ctx);
  const sportFixed = ctx.kind !== 'squad'; // lobby/draft/post keep one sport
  const canManage = ctx.kind === 'draft' || (squad && (squad.captainId === currentUser.id || (squad.members || []).some(m => m.userId === currentUser.id && m.isCaptain)));

  const [editPlayer, setEditPlayer] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [replaceFor, setReplaceFor] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showPerms, setShowPerms] = useState(false);
  const snapshot = useRef(null);
  useEffect(() => { if (plan && !snapshot.current) snapshot.current = JSON.parse(JSON.stringify(plan)); }, [plan]);

  if (!plan) return (
    <View style={S.tacticsScreen}><SafeAreaView style={{ flex: 1 }}>
      <TopBar title="" onBack={app.back} dark />
      <EmptyState icon="grid-outline" title="No tactics plan" text="Open tactics from a match lobby or a squad formation." />
    </SafeAreaView></View>
  );

  const locked = plan.locked;
  const editable = canEdit && !locked;
  const board = getBoard(plan.sport);
  const players = planPlayers(plan);
  const thread = ctx.kind === 'lobby' ? app.getThread(lobby.threadId) : app.getThread('sq-' + squad.id);
  const lastMsg = thread && thread.messages.length ? thread.messages[thread.messages.length - 1] : null;

  const edit = fn => { if (!editable) return; app.updatePlan(ctx, fn); setDirty(true); };
  const goBack = () => { if (dirty && canEdit && (ctx.kind === 'lobby' || ctx.kind === 'squad')) setConfirmLeave(true); else app.back(); };
  const doSave = () => { app.saveTacticsPlan(ctx); setDirty(false); };
  const sportNote = ctx.kind === 'lobby' ? 'match sport (fixed)' : ctx.kind === 'draft' ? 'post sport (fixed)' : 'plan sport';

  return (
    <View style={S.tacticsScreen}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="" onBack={goBack} dark right={
          <Pressable hitSlop={8} onPress={() => { if (!canEdit) return; locked ? app.unlockTacticsPlan(ctx) : doSave(); }}>
            <Ionicons name={locked ? 'lock-closed' : 'save-outline'} size={20} color={canEdit ? C.white : C.mutedLight} />
          </Pressable>} />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={S.tacticsHead}>
            <Text style={S.tacticsKicker}>FORMATION ROOM</Text>
            <Text style={S.tacticsTitle}>{opponent ? <>{squad.name} <Text style={{ color: C.mutedLight }}>vs</Text> {opponent.name}</> : `${plan.name || 'Formation'} · ${squad.name}`}</Text>
            <View style={S.rowCenter}>
              <Badge label={plan.sport} tone="blue" dark />
              <View style={{ width: 6 }} />
              <Badge label={locked ? 'Locked' : canEdit ? 'Editing' : 'View only'} tone={locked ? 'green' : canEdit ? 'orange' : 'navy'} dot dark />
              {dirty ? <><View style={{ width: 6 }} /><Badge label="Unsaved" tone="red" dark /></> : null}
            </View>
          </View>

          {/* permission banner */}
          {!canEdit ? (
            <View style={S.permBanner}>
              <Ionicons name="eye-outline" size={16} color={C.lime} />
              <Text style={S.permBannerText}>Only the squad captain can edit tactics. You can view, chat & suggest changes.</Text>
            </View>
          ) : null}

          {/* sport selector */}
          <Text style={S.tacticsLabel}>Choose sport</Text>
          {sportFixed ? (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={S.lockedSport}><Ionicons name="lock-closed" size={13} color={C.mutedLight} /><Text style={S.lockedSportText}>{plan.sport} · {sportNote}</Text></View>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
              {ALL_SPORTS.map(s => <Chip key={s} dark icon={sportIcon(s)} label={s} active={plan.sport === s} onPress={() => edit(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, ...buildPlan(squad, s) }))} />)}
            </ScrollView>
          )}

          {/* board */}
          <TacticsBoard sport={plan.sport} players={players} positions={plan.positions} locked={!editable}
            onCommit={(pid, x, y) => edit(p => ({ ...p, positions: { ...p.positions, [pid]: { x, y } } }))}
            onEditPlayer={p => editable && setEditPlayer(p)} />

          {/* board controls */}
          {editable ? (
            <View style={S.tacticsControls}>
              <AppButton title="Add Player" icon="person-add" small fill onPress={() => setAddOpen(true)} />
              <AppButton title="Reset Formation" variant="secondary" icon="refresh" small fill onPress={() => edit(p => applyFormation(p, p.formation === 'Custom' ? formationsOf(p.sport)[0] : p.formation))} />
            </View>
          ) : (
            <View style={S.lockedControls}>
              <Ionicons name="lock-closed" size={14} color={C.mutedLight} />
              <Text style={S.lockedControlsText}>{locked ? 'Tactics locked — read only' : 'View only — captain can edit'}</Text>
            </View>
          )}

          {/* formation selector */}
          <Text style={S.tacticsLabel}>Formation / system</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow} style={{ opacity: editable ? 1 : 0.5 }}>
            {formationsList(plan.sport).map(f => <Chip key={f} dark label={f} active={plan.formation === f} onPress={() => edit(p => applyFormation(p, f))} />)}
          </ScrollView>

          {/* tactic chips */}
          <Text style={S.tacticsLabel}>Tactics</Text>
          <View style={[S.chipWrap, { paddingHorizontal: 16, opacity: editable ? 1 : 0.5 }]}>
            {board.tactics.map(tc => <Chip key={tc} dark label={tc} active={plan.tactics.includes(tc)} onPress={() => edit(p => ({ ...p, tactics: p.tactics.includes(tc) ? p.tactics.filter(x => x !== tc) : [...p.tactics, tc] }))} />)}
          </View>

          {/* strategy notes */}
          <Text style={S.tacticsLabel}>Strategy notes</Text>
          <TextInput value={plan.notes} editable={editable}
            onChangeText={txt => edit(p => ({ ...p, notes: txt }))}
            placeholder="Press high first 5 minutes. Pivot holds the line, wings overlap…"
            placeholderTextColor={C.mutedLight} style={[S.notesInput, !editable && { opacity: 0.6 }]} multiline />

          {/* squad grid */}
          <Text style={S.tacticsLabel}>Squad ({players.length})</Text>
          <View style={S.squadGrid}>
            {players.map(p => (
              <Pressable key={p.pid} style={S.squadGridItem} onPress={() => editable && setEditPlayer(p)}>
                <Avatar label={p.name} size={40} accent={p.cap} />
                <Text style={S.squadGridName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                <View style={S.squadGridRole}><Text style={S.squadGridRoleText}>{p.role} · {p.num}</Text></View>
              </Pressable>
            ))}
          </View>

          {/* permissions manager (captain only) */}
          {canManage ? (
            <>
              <Pressable style={S.permRow} onPress={() => setShowPerms(s => !s)}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.lime} />
                <Text style={S.permRowText}>Edit permissions</Text>
                <Ionicons name={showPerms ? 'chevron-up' : 'chevron-down'} size={16} color={C.mutedLight} />
              </Pressable>
              {showPerms ? (
                <View style={S.permPanel}>
                  {(squad.members || []).map(m => {
                    const u = getUser(m.userId);
                    const ed = app.isEditor(squad.id, m.userId);
                    const fixed = m.isCaptain;
                    return (
                      <View key={m.userId} style={S.permMember}>
                        <Avatar label={u.name} size={32} accent={m.isCaptain} />
                        <Text style={S.permMemberName} numberOfLines={1}>{u.name}{m.isCaptain ? ' ©' : m.isViceCaptain ? ' (VC)' : ''}</Text>
                        <Pressable disabled={fixed} onPress={() => app.toggleEditor(squad.id, m.userId)} style={[S.permPill, ed && S.permPillOn, fixed && { opacity: 0.6 }]}>
                          <Text style={[S.permPillText, ed && { color: C.navy }]}>{ed ? 'Editor' : 'View'}</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : null}

          {/* squad chat preview */}
          <Pressable style={S.tacticsChat} onPress={() => ctx.kind === 'lobby' ? app.go('chat', { threadId: lobby.threadId }) : app.openSquadChat(squad.id)}>
            <Ionicons name="chatbubbles" size={18} color={C.lime} />
            <Text style={S.tacticsChatText} numberOfLines={1}>{lastMsg ? `${getUser(lastMsg.userId).name.split(' ')[0]}: ${lastMsg.text}` : 'Open squad chat — discuss the plan'}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.mutedLight} />
          </Pressable>

          {/* CTA */}
          <View style={{ padding: 16 }}>
            {ctx.kind === 'post' ? (
              <AppButton title="Back to post" variant="secondary" icon="arrow-back" fill onPress={app.back} />
            ) : ctx.kind === 'draft' ? (
              <AppButton title="Attach Tactics to Post" icon="checkmark-circle" fill onPress={() => { app.toast('Tactics attached to post ✓'); app.back(); }} />
            ) : !canEdit ? (
              <AppButton title="Suggest a change in chat" variant="secondary" icon="bulb-outline" fill onPress={() => ctx.kind === 'lobby' ? app.go('chat', { threadId: lobby.threadId }) : app.openSquadChat(squad.id)} />
            ) : locked ? (
              <AppButton title="Unlock & edit tactics" variant="secondary" icon="lock-open" fill onPress={() => app.unlockTacticsPlan(ctx)} />
            ) : (
              <>
                <AppButton title="Save Tactics" variant="secondary" icon="save-outline" fill onPress={doSave} />
                <View style={{ height: 10 }} />
                <AppButton title="Lock Tactics" icon="lock-closed" fill onPress={() => { app.lockTacticsPlan(ctx); setDirty(false); }} />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {editPlayer ? (
        <RoleEditSheet player={editPlayer} sport={plan.sport}
          onSave={vals => { edit(p => ({ ...p, roles: { ...p.roles, [editPlayer.pid]: vals.role }, nums: { ...p.nums, [editPlayer.pid]: vals.num }, captainId: vals.cap ? editPlayer.pid : (p.captainId === editPlayer.pid ? null : p.captainId) })); setEditPlayer(null); }}
          onRemove={() => { edit(p => removePlayerFromPlan(p, editPlayer.pid)); setEditPlayer(null); }}
          onReplace={() => { setReplaceFor(editPlayer); setEditPlayer(null); }}
          onClose={() => setEditPlayer(null)} />
      ) : null}
      {(addOpen || replaceFor) ? (
        <AddPlayerSheet plan={plan} squad={squad} lobby={lobby} replaceName={replaceFor ? replaceFor.name : null}
          onAdd={pid => { if (replaceFor) { edit(p => swapPlayerInPlan(p, replaceFor.pid, pid)); setReplaceFor(null); } else { edit(p => addPlayerToPlan(p, pid)); } }}
          onClose={() => { setAddOpen(false); setReplaceFor(null); }} />
      ) : null}
      {confirmLeave ? (
        <UnsavedSheet
          onSave={() => { doSave(); setConfirmLeave(false); app.back(); }}
          onDiscard={() => { if (snapshot.current) app.updatePlan(ctx, () => snapshot.current); setConfirmLeave(false); app.back(); }}
          onCancel={() => setConfirmLeave(false)} />
      ) : null}
    </View>
  );
}

// ─── Squad tactics list (saved formations per sport) ──────────────────────────
function SquadTacticsScreen({ app }) {
  const s = getSquad(app.squads, app.params.id);
  const plans = app.squadPlans[s.id] || [];
  const [pickSport, setPickSport] = useState(false);
  const canManage = s.captainId === currentUser.id || (s.members || []).some(m => m.userId === currentUser.id && (m.isCaptain || m.isViceCaptain));
  return (
    <Screen>
      <TopBar title="Tactics & Formations" onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={S.squadTacticsHead}>
          <Avatar label={s.name} size={44} ring="green" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={S.listTitle}>{s.name}</Text>
            <Text style={S.listSub}>{plans.length} saved formation{plans.length === 1 ? '' : 's'} · {s.sport}</Text>
          </View>
        </View>

        {canManage ? <AppButton title="New formation" icon="add-circle" fill onPress={() => setPickSport(true)} /> : (
          <View style={S.permBannerLight}><Ionicons name="eye-outline" size={15} color={C.blue} /><Text style={S.permBannerLightText}>Only captains & vice-captains can create formations.</Text></View>
        )}

        <View style={{ height: 8 }} />
        {plans.length ? plans.map(p => (
          <View key={p.id} style={S.planCard}>
            <Pressable style={S.rowCenter} onPress={() => app.go('tacticsRoom', { squadId: s.id, planId: p.id })}>
              <View style={[S.planIcon, { backgroundColor: getBoard(p.sport).accent }]}><MaterialCommunityIcons name="strategy" size={20} color={C.white} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.listTitle}>{p.name}</Text>
                <Text style={S.listSub}>{p.sport} · {p.formation} · {p.roster.length} players · {p.updatedAt}</Text>
              </View>
              {p.locked ? <Badge label="Locked" tone="green" dot /> : null}
            </Pressable>
            {canManage ? (
              <View style={S.planActions}>
                <Pressable style={S.planAction} onPress={() => app.go('tacticsRoom', { squadId: s.id, planId: p.id })}><Ionicons name="create-outline" size={16} color={C.blue} /><Text style={S.planActionText}>Edit</Text></Pressable>
                <Pressable style={S.planAction} onPress={() => app.duplicateSquadPlan(s.id, p.id)}><Ionicons name="copy-outline" size={16} color={C.blue} /><Text style={S.planActionText}>Duplicate</Text></Pressable>
                <Pressable style={S.planAction} onPress={() => app.deleteSquadPlan(s.id, p.id)}><Ionicons name="trash-outline" size={16} color={C.danger} /><Text style={[S.planActionText, { color: C.danger }]}>Delete</Text></Pressable>
              </View>
            ) : null}
          </View>
        )) : <EmptyState icon="grid-outline" title="No saved formations" text={canManage ? 'Tap "New formation" to plan tactics for any sport.' : 'The captain has not created any formations yet.'} />}
        <View style={{ height: 24 }} />
      </ScrollView>
      {pickSport ? (
        <SportPickerSheet onPick={sport => { const id = app.newSquadPlan(s.id, sport); setPickSport(false); app.go('tacticsRoom', { squadId: s.id, planId: id }); }} onClose={() => setPickSport(false)} />
      ) : null}
    </Screen>
  );
}

// ─── Challenge sheet (send challenge to a squad) ──────────────────────────────
function ChallengeSheet({ app, targetId, onClose }) {
  const target = getSquad(app.squads, targetId);
  const mySquads = app.squads.filter(s => s.members.some(m => m.userId === currentUser.id) && s.id !== targetId);
  const [mySquadId, setMySquadId] = useState(mySquads[0] ? mySquads[0].id : null);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  return (
    <Pressable style={S.sheetOverlay} onPress={onClose}>
      <Pressable style={S.sheet} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>Challenge {target.name}</Text>
        <Text style={S.sheetSub}>{target.sport} · {target.location} · {target.skillLevel}</Text>
        <Text style={S.inputLabel}>Your squad</Text>
        {mySquads.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
            {mySquads.map(s => <Chip key={s.id} label={s.name} active={mySquadId === s.id} onPress={() => setMySquadId(s.id)} />)}
          </ScrollView>
        ) : <Text style={S.listSub}>Create a squad first to send challenges.</Text>}
        <Text style={S.inputLabel}>Message (optional)</Text>
        <TextInput value={msg} onChangeText={setMsg} placeholder="We're ready — tonight at 7?" placeholderTextColor={C.mutedLight} style={[S.input, S.inputArea]} multiline />
        <View style={{ height: 12 }} />
        <AppButton title={sending ? 'Sending…' : 'Send challenge'} icon={sending ? undefined : 'flash'} loading={sending} fill disabled={!mySquadId}
          onPress={() => { setSending(true); setTimeout(() => { app.sendChallengeToSquad(targetId, mySquadId, msg.trim()); setSending(false); onClose(); }, 500); }} />
        <View style={{ height: 8 }} />
      </Pressable>
    </Pressable>
  );
}

// ─── Challenger results (shared by Search tab + Discovery) ────────────────────
function ChallengerResults({ app, sport, query, filters }) {
  const [challengeId, setChallengeId] = useState(null);
  const f = filters || {};
  const q = (query || '').toLowerCase();
  const list = app.squads.filter(s => {
    if (s.members.some(m => m.userId === currentUser.id)) return false; // not my own squads
    if (sport && s.sport !== sport) return false;
    if (q && !s.name.toLowerCase().includes(q)) return false;
    if (f.location && f.location !== 'All' && s.location !== f.location) return false;
    if (f.skill && f.skill !== 'All' && s.skillLevel !== f.skill) return false;
    if (f.tone && f.tone !== 'All') { const comp = s.skillLevel === 'Competitive' || s.skillLevel === 'Pro'; if (f.tone === 'Competitive' && !comp) return false; if (f.tone === 'Casual' && comp) return false; }
    return true;
  });
  const openPosts = app.posts.filter(p => p.postType === 'Match Challenge' && p.status === 'Looking for Opponent' && (!sport || p.sport === sport) && (!q || (p.title || '').toLowerCase().includes(q)));

  return (
    <View>
      {openPosts.length ? <Text style={[S.miniLabel, { marginTop: 8 }]}>Open match challenges ({openPosts.length})</Text> : null}
      {openPosts.map(p => {
        const sq = getSquad(app.squads, p.createdBy);
        return (
          <Pressable key={p.id} style={S.listRow} onPress={() => app.go('postDetail', { id: p.id })}>
            <Avatar label={sq.name} size={44} ring="green" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={S.listTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={S.listSub}>{p.sport} · {p.teamSize} · {p.preferredTime}</Text>
            </View>
            <AppButton title="Compete" icon="flash" small onPress={() => app.openRequest(p)} />
          </Pressable>
        );
      })}

      <Text style={[S.miniLabel, { marginTop: 12 }]}>Opponent squads ({list.length})</Text>
      {list.length ? list.map(s => {
        const ready = s.members.filter(m => m.availability === 'Available').length;
        return (
          <View key={s.id} style={S.oppCard}>
            <Pressable style={S.rowCenter} onPress={() => app.go('squadDetail', { id: s.id })}>
              <Avatar label={s.name} size={48} ring="green" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.listTitle}>{s.name}</Text>
                <Text style={S.listSub}>{s.sport} · {s.location} · {s.skillLevel}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={S.oppRating}>⭐ {s.rating}</Text>
                <Text style={S.listSub}>{s.wins}W {s.losses}L</Text>
              </View>
            </Pressable>
            <View style={S.oppMetaRow}>
              <Badge label={`${ready}/${s.members.length} ready`} tone="green" />
              <Badge label="Evenings" tone="orange" />
              <Badge label="50/50 split" tone="navy" />
            </View>
            <View style={S.oppActions}>
              <AppButton title="Challenge" icon="flash" small fill onPress={() => setChallengeId(s.id)} />
              <AppButton title="Captain" variant="secondary" icon="chatbubble-outline" small fill onPress={() => app.openCaptainChatSquad(s.id)} />
              <AppButton title="Squad" variant="secondary" icon="people-outline" small fill onPress={() => app.go('squadDetail', { id: s.id })} />
            </View>
          </View>
        );
      }) : <EmptyState icon="search-outline" title="No squads match" text="Try changing the filters or sport." />}
      {challengeId ? <ChallengeSheet app={app} targetId={challengeId} onClose={() => setChallengeId(null)} /> : null}
    </View>
  );
}

// ─── Challenger discovery (full filters) ──────────────────────────────────────
function ChallengerDiscoveryScreen({ app }) {
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('All');
  const [location, setLocation] = useState('All');
  const [skill, setSkill] = useState('All');
  const [tone, setTone] = useState('All');
  const [openNow, setOpenNow] = useState(false);
  const locations = ['All', 'Thimphu', 'Paro', 'Phuentsholing'];
  const skills = ['All', 'Casual', 'Intermediate', 'Competitive', 'Pro'];
  return (
    <Screen>
      <TopBar title="Find Challengers" onBack={app.back} />
      <View style={S.searchHead}>
        <View style={S.searchBar}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search opponent squads…" placeholderTextColor={C.mutedLight} style={S.searchInput} />
          {q ? <Pressable onPress={() => setQ('')}><Ionicons name="close-circle" size={18} color={C.mutedLight} /></Pressable> : null}
        </View>
        <Text style={S.filterLabel}>Sport</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
          {['All', ...ALL_SPORTS].map(s => <Chip key={s} label={s} active={sport === s} onPress={() => setSport(s)} />)}
        </ScrollView>
        <Text style={S.filterLabel}>Location</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
          {locations.map(l => <Chip key={l} label={l} active={location === l} onPress={() => setLocation(l)} />)}
        </ScrollView>
        <Text style={S.filterLabel}>Skill level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
          {skills.map(s => <Chip key={s} label={s} active={skill === s} onPress={() => setSkill(s)} />)}
        </ScrollView>
        <Text style={S.filterLabel}>Style</Text>
        <View style={S.chipWrap}>
          {['All', 'Casual', 'Competitive'].map(t => <Chip key={t} label={t} active={tone === t} onPress={() => setTone(t)} />)}
          <Chip label="Open now" icon={openNow ? 'checkmark-circle' : 'time-outline'} active={openNow} onPress={() => setOpenNow(o => !o)} />
        </View>
      </View>
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <ChallengerResults app={app} sport={sport === 'All' ? null : sport} query={q.toLowerCase()} filters={{ location, skill, tone }} />
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Create squad ─────────────────────────────────────────────────────────────
function CreateSquadScreen({ app }) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Futsal');
  const [location, setLocation] = useState('Thimphu');
  const [skill, setSkill] = useState('Competitive');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const locations = ['Thimphu', 'Paro', 'Phuentsholing'];
  const create = (openTactics) => {
    if (!name.trim()) { app.toast('Add a squad name', 'error'); return; }
    setBusy(true);
    setTimeout(() => {
      const id = app.addSquad({ name: name.trim(), sport, location, skill, description: desc.trim() });
      setBusy(false);
      if (openTactics) { const planId = app.newSquadPlan(id, sport); app.go('tacticsRoom', { squadId: id, planId }); }
      else app.go('squadDetail', { id });
    }, 600);
  };
  return (
    <Screen>
      <TopBar title="Create squad" onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={S.inputLabel}>Squad name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Thimphu Titans" placeholderTextColor={C.mutedLight} style={S.input} />
        <Text style={S.inputLabel}>Sport</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>
          {ALL_SPORTS.map(s => <Chip key={s} label={s} icon={sportIcon(s)} active={sport === s} onPress={() => setSport(s)} />)}
        </ScrollView>
        <Text style={S.inputLabel}>Location</Text>
        <View style={S.chipWrap}>{locations.map(l => <Chip key={l} label={l} active={location === l} onPress={() => setLocation(l)} />)}</View>
        <Text style={S.inputLabel}>Skill level</Text>
        <View style={S.chipWrap}>{['Casual', 'Intermediate', 'Competitive', 'Pro'].map(s => <Chip key={s} label={s} active={skill === s} onPress={() => setSkill(s)} />)}</View>
        <Text style={S.inputLabel}>Description</Text>
        <TextInput value={desc} onChangeText={setDesc} placeholder="What's your squad about?" placeholderTextColor={C.mutedLight} style={[S.input, S.inputArea]} multiline />
        <View style={S.infoBanner}><Ionicons name="information-circle" size={16} color={C.blue} /><Text style={S.infoBannerText}>You'll be the captain. You can build default formations per sport in the tactics planner.</Text></View>
        <View style={{ height: 16 }} />
        <AppButton title={busy ? 'Creating…' : 'Create squad & plan tactics'} icon={busy ? undefined : 'grid-outline'} loading={busy} fill onPress={() => create(true)} />
        <View style={{ height: 8 }} />
        <AppButton title="Create squad only" variant="secondary" icon="checkmark" fill onPress={() => create(false)} />
        <View style={{ height: 20 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
const QUICK_REPLIES = ['Ready?', 'Need 1 more player', 'Confirm payment', 'On the way', 'Start match', 'Good game', 'Rematch?'];
// ─── Chat inbox ───────────────────────────────────────────────────────────────
const THREAD_ICON = { direct: 'person', squad: 'people', lobby: 'game-controller', captain: 'shield', event: 'calendar' };
function ChatListScreen({ app }) {
  const list = app.threadList();
  return (
    <Screen>
      <TopBar title="Messages" onBack={app.back}
        right={<Pressable hitSlop={8} onPress={() => app.go('search', { tab: 'Players' })}><Ionicons name="create-outline" size={21} color={C.navy} /></Pressable>} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {list.length ? list.map(t => {
          const last = t.messages[t.messages.length - 1];
          const unread = app.threadUnread(t.id);
          const lastName = last ? (last.userId === currentUser.id ? 'You' : getUser(last.userId).name.split(' ')[0]) : '';
          return (
            <Pressable key={t.id} style={S.listRow} onPress={() => app.go('chat', { threadId: t.id })}>
              <View style={{ position: 'relative' }}>
                <Avatar label={t.title} size={48} ring={t.type === 'squad' ? 'green' : t.type === 'lobby' ? 'wood' : undefined} />
                <View style={[S.threadTypeDot, { backgroundColor: t.type === 'squad' ? C.green : t.type === 'lobby' ? C.wood : C.blue }]}><Ionicons name={THREAD_ICON[t.type] || 'chatbubble'} size={10} color={C.white} /></View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[S.listTitle, unread && { fontWeight: '900' }]} numberOfLines={1}>{t.title}</Text>
                <Text style={[S.listSub, unread && { color: C.text, fontWeight: '700' }]} numberOfLines={1}>{last ? `${lastName}: ${last.text}` : 'No messages yet'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={S.threadTime}>{last ? last.at : ''}</Text>
                {unread ? <View style={S.unreadBadge}><Text style={S.unreadBadgeText}>{unread}</Text></View> : null}
              </View>
            </Pressable>
          );
        }) : <EmptyState icon="chatbubbles-outline" title="No conversations yet" text="Message a player, squad captain, or open a match lobby chat." />}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

function ChatScreen({ app }) {
  const thread = app.getThread(app.params.threadId);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  useEffect(() => { if (thread) app.markChatRead(thread.id); }, [thread && thread.messages.length]);
  if (!thread) return <Screen><TopBar title="Chat" onBack={app.back} /><EmptyState icon="chatbubbles-outline" title="No conversation" text="This thread is unavailable." /></Screen>;
  const send = msg => {
    const m = (msg !== undefined ? msg : text).trim();
    if (!m) return;
    app.sendMessage(thread.id, m); setText('');
    setTimeout(() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true }), 60);
  };
  return (
    <Screen>
      <TopBar title={thread.title} onBack={app.back}
        right={<View style={S.rowCenter}><PulseDot color={C.green} size={7} /><Text style={S.chatHeadSub}>{thread.subtitle || 'online'}</Text></View>} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8} style={{ flex: 1 }}>
      <ScrollView ref={scrollRef} contentContainerStyle={S.chatBody} showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: false })}>
        {thread.messages.map(m => {
          const mine = m.userId === currentUser.id;
          const u = getUser(m.userId);
          return (
            <View key={m.id} style={[S.msgRow, mine && { flexDirection: 'row-reverse' }]}>
              {!mine ? <Avatar label={u.name} size={30} /> : null}
              <View style={[S.msgBubble, mine ? S.msgMine : S.msgTheirs]}>
                {!mine && thread.type !== 'direct' ? <Text style={S.msgAuthor}>{u.name}</Text> : null}
                <Text style={[S.msgText, mine && { color: C.white }]}>{m.text}</Text>
                <Text style={[S.msgTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>{m.at}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={S.quickRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          {QUICK_REPLIES.map(q => <Pressable key={q} style={S.quickReply} onPress={() => send(q)}><Text style={S.quickReplyText}>{q}</Text></Pressable>)}
        </ScrollView>
      </View>
      <View style={S.composer}>
        <View style={S.composerRow}>
          <TextInput value={text} onChangeText={setText} placeholder="Message…" placeholderTextColor={C.mutedLight} style={S.composerInput} multiline />
          <Pressable onPress={() => send()} style={[S.sendBtn, !text.trim() && { opacity: 0.4 }]} disabled={!text.trim()}>
            <Ionicons name="arrow-up" size={20} color={C.white} />
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
const NOTIF_META = {
  follow: { icon: 'person-add', tone: C.blue, cat: 'Social' },
  comment: { icon: 'chatbubble', tone: C.blue, cat: 'Social' },
  like: { icon: 'heart', tone: C.danger, cat: 'Social' },
  request: { icon: 'flash', tone: C.warning, cat: 'Matches' },
  accepted: { icon: 'checkmark-circle', tone: C.green, cat: 'Matches' },
  rejected: { icon: 'close-circle', tone: C.danger, cat: 'Matches' },
  lobby: { icon: 'game-controller', tone: C.blue, cat: 'Matches' },
  payPending: { icon: 'time', tone: C.warning, cat: 'Payments' },
  payDone: { icon: 'card', tone: C.green, cat: 'Payments' },
  locked: { icon: 'lock-closed', tone: C.green, cat: 'Matches' },
  squadInvite: { icon: 'people', tone: C.blue, cat: 'Squads' },
  message: { icon: 'chatbubbles', tone: C.blue, cat: 'Social' },
  event: { icon: 'calendar', tone: C.warning, cat: 'Events' },
  tacticsSaved: { icon: 'save', tone: C.blue, cat: 'Matches' },
  tacticsLocked: { icon: 'shield-checkmark', tone: C.green, cat: 'Matches' },
};
function NotificationsScreen({ app }) {
  const [tab, setTab] = useState('All');
  const tabs = ['All', 'Matches', 'Payments', 'Squads', 'Social', 'Events'];
  const list = app.notifications.filter(n => tab === 'All' || (NOTIF_META[n.type] || {}).cat === tab);
  return (
    <Screen>
      <TopBar title="Notifications" onBack={app.back}
        right={<Pressable hitSlop={8} onPress={app.markAllRead}><Text style={S.markAll}>Read all</Text></Pressable>} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow} style={{ flexGrow: 0 }}>
        {tabs.map(t => <Chip key={t} label={t} active={tab === t} onPress={() => setTab(t)} />)}
      </ScrollView>
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {list.length ? list.map(n => {
          const m = NOTIF_META[n.type] || { icon: 'notifications', tone: C.blue };
          return (
            <Pressable key={n.id} style={[S.notifRow, !n.read && S.notifUnread]} onPress={() => app.openNotif(n)}>
              <View style={[S.notifIcon, { backgroundColor: m.tone }]}><Ionicons name={m.icon} size={17} color={C.white} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.notifTitle}>{n.title}</Text>
                <Text style={S.notifBody} numberOfLines={2}>{n.body}</Text>
                <Text style={S.notifTime}>{n.at}</Text>
              </View>
              {!n.read ? <View style={S.unreadDot} /> : null}
            </Pressable>
          );
        }) : <EmptyState icon="notifications-off-outline" title="All caught up" text={`No ${tab.toLowerCase()} notifications.`} />}
        <View style={{ height: 20 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
const STATUS_TONE_PAY = s => statusTone(s);
function ProfileScreen({ app }) {
  const id = app.params.id || currentUser.id;
  const isMe = id === currentUser.id;
  const user = isMe ? app.profile : getUser(id);
  const [tab, setTab] = useState(app.params.tab || 'Posts');
  const tabs = isMe
    ? ['Posts', 'Matches', 'Squads', 'Stats', 'Highlights', 'Saved', 'Likes', 'Bookings', 'Payments', 'Memberships']
    : ['Posts', 'Matches', 'Squads', 'Stats', 'Highlights'];
  const mySquads = app.squads.filter(s => s.members.some(m => m.userId === id));
  const myPosts = app.posts.filter(p => p.createdBy === id || (p.authorType === 'squad' && mySquads.some(s => s.id === p.createdBy)));
  const following = app.isFollowing('user', id);
  const newW = app.results.filter(r => r.lobbyId && r.status === 'Completed' && r.outcome === 'W').length;
  const newL = app.results.filter(r => r.lobbyId && r.status === 'Completed' && r.outcome === 'L').length;
  const wins = mySquads.reduce((s, x) => s + x.wins, 0) + newW, losses = mySquads.reduce((s, x) => s + x.losses, 0) + newL, draws = mySquads.reduce((s, x) => s + x.draws, 0);
  const played = wins + losses + draws;
  const activeLobbies = app.lobbies.filter(l => mySquads.some(s => s.id === l.teamAId || s.id === l.teamBId));

  return (
    <Screen>
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={S.profileTop}>
          {!isMe ? <Pressable style={S.backBtn} onPress={app.back} hitSlop={10}><Ionicons name="chevron-back" size={22} color={C.navy} /></Pressable> : <View style={{ width: 38 }} />}
          <Pressable hitSlop={8} onPress={() => isMe ? app.go('settings') : app.openDirectChat(id)}>
            <Ionicons name={isMe ? 'settings-outline' : 'chatbubble-outline'} size={22} color={C.navy} />
          </Pressable>
        </View>

        <View style={S.profileHead}>
          <Avatar label={user.name} img={user.photo} size={86} accent={isMe} ring="green" online={user.availability === 'Available'} />
          <Text style={S.profileName}>{user.name}</Text>
          <Text style={S.profileHandle}>@{user.username} · {user.location}</Text>
          <View style={S.rowCenter}>
            <Badge label={user.mainSport} tone="blue" /><View style={{ width: 6 }} />
            <Badge label={user.skillLevel} tone="navy" /><View style={{ width: 6 }} />
            <Badge label={`⭐ ${user.rating}`} tone="green" />
          </View>
          {isMe && user.bio ? <Text style={S.profileBio}>{user.bio}</Text> : null}

          <View style={S.statBar}>
            <Pressable style={S.statItem} onPress={() => app.go('connections', { id, mode: 'Followers' })}><Text style={S.statNum}>{app.followerCount('user', id, user.followers)}</Text><Text style={S.statLabel}>Followers</Text></Pressable>
            <View style={S.statDivider} />
            <Pressable style={S.statItem} onPress={() => app.go('connections', { id, mode: 'Following' })}><Text style={S.statNum}>{isMe ? app.followingCount() : user.following}</Text><Text style={S.statLabel}>Following</Text></Pressable>
            <View style={S.statDivider} />
            <View style={S.statItem}><Text style={S.statNum}>{mySquads.length}</Text><Text style={S.statLabel}>Squads</Text></View>
            <View style={S.statDivider} />
            <View style={S.statItem}><Text style={S.statNum}>{wins}</Text><Text style={S.statLabel}>Wins</Text></View>
          </View>

          {isMe ? (
            <>
              <View style={S.rowGap}>
                <AppButton title="Edit Profile" variant="secondary" icon="create-outline" small fill onPress={() => app.go('editProfile')} />
                <AppButton title="Share" variant="secondary" icon="share-social-outline" small fill onPress={() => app.openShare({ id: 'u:' + id, title: `${user.name} on ThangGo`, kind: 'profile' })} />
              </View>
              <AppButton title="Settings" variant="secondary" icon="settings-outline" fill onPress={() => app.go('settings')} />
            </>
          ) : (
            <>
              <View style={S.rowGap}>
                <AppButton title={following ? 'Following' : 'Follow'} variant={following ? 'secondary' : 'primary'} icon={following ? 'checkmark' : 'person-add'} small fill onPress={() => app.toggleFollow('user', id, user.name)} />
                <AppButton title="Message" variant="secondary" icon="chatbubble-outline" small fill onPress={() => app.openDirectChat(id)} />
              </View>
              <View style={S.rowGap}>
                <AppButton title="Challenge" icon="flash" small fill onPress={() => app.go('create', { type: 'Match Challenge' })} />
                <AppButton title="Invite to Squad" variant="secondary" icon="people-outline" small fill onPress={() => app.toast(`${user.name} invited to your squad`, 'success')} />
              </View>
            </>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.profileTabs}>
          {tabs.map(t => (
            <Pressable key={t} onPress={() => setTab(t)} style={[S.profTab, tab === t && S.profTabActive]}>
              <Text style={[S.profTabText, tab === t && S.profTabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {tab === 'Posts' && (myPosts.length ? myPosts.map(p => (
            <Pressable key={p.id} style={S.miniPost} onPress={() => app.go('postDetail', { id: p.id })}>
              {p.image ? <Image source={{ uri: p.image }} style={S.miniPostImg} /> : <View style={[S.miniPostImg, S.miniPostNoImg]}><Ionicons name={POST_ICON[p.postType] || 'document-text'} size={22} color={C.blue} /></View>}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.listTitle} numberOfLines={1}>{p.title || p.postType}</Text>
                <Text style={S.listSub} numberOfLines={2}>{p.caption}</Text>
              </View>
            </Pressable>
          )) : <EmptyState icon="document-text-outline" title="No posts yet" text="Create a post from the + tab." />)}

          {tab === 'Matches' && (
            <>
              {activeLobbies.length ? <Text style={S.miniLabel}>Active & upcoming</Text> : null}
              {activeLobbies.map(l => {
                const a = getSquad(app.squads, l.teamAId), b = getSquad(app.squads, l.teamBId);
                return (
                  <Pressable key={l.id} style={S.matchCard} onPress={() => app.go('matchLobby', { id: l.id })}>
                    <View style={S.rowCenter}>
                      <Badge label={l.status} tone={statusTone(l.status)} dot />
                      <View style={{ flex: 1 }} />
                      <Badge label={`Pay: ${l.paymentStatus}`} tone={statusTone(l.paymentStatus)} />
                    </View>
                    <Text style={[S.listTitle, { marginTop: 6 }]}>{a.name} vs {b.name}</Text>
                    <Text style={S.listSub}>{l.sport} · {getVenue(l.venueId).name} · {l.date}</Text>
                    <View style={S.rowGap}>
                      <AppButton title="View Lobby" variant="secondary" icon="game-controller-outline" small fill onPress={() => app.go('matchLobby', { id: l.id })} />
                      <AppButton title="Settle / Result" icon="trophy-outline" small fill onPress={() => app.go('settlement', { lobbyId: l.id })} />
                    </View>
                  </Pressable>
                );
              })}
              <Text style={S.miniLabel}>Match history</Text>
              {app.results.length ? app.results.map(r => {
                const a = getSquad(app.squads, r.squadId);
                return (
                  <View key={r.id} style={S.matchCard}>
                    <View style={S.rowCenter}>
                      <View style={[S.matchResult, { backgroundColor: r.outcome === 'W' ? C.green : r.outcome === 'L' ? C.danger : C.warning }]}><Text style={S.matchResultText}>{r.outcome}</Text></View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={S.listTitle}>{a.name} {r.scoreA}–{r.scoreB} {r.oppName}</Text>
                        <Text style={S.listSub}>{r.sport} · {r.date}</Text>
                      </View>
                      <Badge label={r.status} tone={statusTone(r.status === 'Completed' ? 'Completed' : r.status === 'Disputed' ? 'Disputed' : 'Pending')} dot />
                    </View>
                    {isMe ? (
                      <View style={S.rowGap}>
                        {r.status === 'Pending Confirmation' ? <><AppButton title="Confirm" variant="green" icon="checkmark" small fill onPress={() => app.confirmResult(r.id)} /><AppButton title="Dispute" variant="danger" icon="alert" small fill onPress={() => app.disputeResult(r.id)} /></> : null}
                        {r.status === 'Completed' && !r.postId ? <AppButton title="Post Result" icon="megaphone-outline" small fill onPress={() => app.postResult(r.id)} /> : null}
                        {r.postId ? <AppButton title="View Post" variant="secondary" icon="open-outline" small fill onPress={() => app.go('postDetail', { id: r.postId })} /> : null}
                        <AppButton title="Rematch" variant="secondary" icon="repeat" small fill onPress={() => app.go('create', { type: 'Match Challenge' })} />
                      </View>
                    ) : null}
                  </View>
                );
              }) : <EmptyState icon="trophy-outline" title="No match history" text="Completed matches will appear here." />}
            </>
          )}

          {tab === 'Squads' && (mySquads.length ? mySquads.map(s => {
            const cap = s.members.find(m => m.userId === id && (m.isCaptain || m.isViceCaptain));
            return (
              <View key={s.id} style={S.matchCard}>
                <Pressable style={S.rowCenter} onPress={() => app.go('squadDetail', { id: s.id })}>
                  <Avatar label={s.name} size={44} ring="green" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={S.listTitle}>{s.name}</Text>
                    <Text style={S.listSub}>{s.sport} · {cap ? (s.members.find(m => m.userId === id).isCaptain ? 'Captain' : 'Vice-captain') : 'Member'} · {s.wins}W {s.losses}L</Text>
                  </View>
                </Pressable>
                {isMe ? (
                  <View style={S.rowGap}>
                    <AppButton title="View Squad" variant="secondary" icon="eye-outline" small fill onPress={() => app.go('squadDetail', { id: s.id })} />
                    {cap ? <AppButton title="Tactics" icon="grid-outline" small fill onPress={() => app.go('squadTactics', { id: s.id })} /> : <AppButton title="Leave" variant="danger" icon="exit-outline" small fill onPress={() => app.toast('Left ' + s.name, 'info')} />}
                    <AppButton title="Chat" variant="secondary" icon="chatbubble-outline" small fill onPress={() => app.openSquadChat(s.id)} />
                  </View>
                ) : null}
              </View>
            );
          }) : <EmptyState icon="people-outline" title="No squads" text="Create or join a squad." />)}

          {tab === 'Stats' && (
            <View style={S.statsGrid}>
              {[
                { l: 'Played', v: played, t: C.blue }, { l: 'Wins', v: wins, t: C.green }, { l: 'Losses', v: losses, t: C.danger },
                { l: 'Win rate', v: `${Math.round((wins / Math.max(1, played)) * 100)}%`, t: C.blue }, { l: 'Rating', v: user.rating, t: C.blue }, { l: 'Fav sport', v: user.mainSport, t: C.green },
                { l: 'Top venue', v: 'Changlimithang', t: C.navy }, { l: 'MVPs', v: 5, t: C.warning }, { l: 'Attendance', v: '92%', t: C.green },
                { l: 'Pay rate', v: '100%', t: C.green },
              ].map(s => (
                <View key={s.l} style={S.statCard}><Text style={[S.statCardNum, { color: s.t }]} numberOfLines={1}>{s.v}</Text><Text style={S.statCardLabel}>{s.l}</Text></View>
              ))}
            </View>
          )}

          {tab === 'Highlights' && (
            <View style={S.highlightGrid}>
              {[IMG.futsal, IMG.court, IMG.gym, IMG.feed].map((im, i) => (
                <Pressable key={i} onPress={() => app.go('postDetail', { id: myPosts[0] ? myPosts[0].id : 'feed-1' })}><Image source={{ uri: im }} style={S.highlightImg} /></Pressable>
              ))}
            </View>
          )}

          {tab === 'Likes' && (() => {
            const liked = app.posts.filter(p => app.isLiked(p.id));
            return liked.length ? liked.map(p => (
              <Pressable key={p.id} style={S.miniPost} onPress={() => app.go('postDetail', { id: p.id })}>
                {p.image ? <Image source={{ uri: p.image }} style={S.miniPostImg} /> : <View style={[S.miniPostImg, S.miniPostNoImg]}><Ionicons name={POST_ICON[p.postType] || 'document-text'} size={22} color={C.blue} /></View>}
                <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle} numberOfLines={1}>{p.title || p.postType}</Text><Text style={S.listSub} numberOfLines={2}>{p.caption}</Text></View>
                <LikeButton liked count={app.likeCount(p.id, p.likes)} onToggle={() => app.toggleLike(p.id, p.likes)} />
              </Pressable>
            )) : <EmptyState icon="heart-outline" title="No liked posts" text="Tap the heart on any post to like it." />;
          })()}

          {tab === 'Bookings' && (app.bookings.length ? app.bookings.map(bk => {
            const bv = getVenue(bk.venueId);
            return (
              <Pressable key={bk.id} style={S.bookingRow} onPress={() => app.go('bookingConfirm', { id: bk.id })}>
                <Image source={{ uri: bv.image }} style={S.bookingThumb} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={S.listTitle} numberOfLines={1}>{bv.name}</Text>
                  <Text style={S.listSub}>{bk.bookingType} · {bk.date}{bk.slot ? ' · ' + bk.slot : ''}</Text>
                  <View style={[S.rowCenter, { gap: 6, marginTop: 4 }]}><Badge label={bk.status} tone={statusTone(bk.status)} dot /><Badge label={bk.paymentStatus} tone={statusTone(bk.paymentStatus)} /></View>
                </View>
                {bk.status !== 'Cancelled' && bk.status !== 'Completed' ? <Pressable hitSlop={8} onPress={() => app.cancelBooking(bk.id)}><Ionicons name="close-circle-outline" size={22} color={C.danger} /></Pressable> : null}
              </Pressable>
            );
          }) : <EmptyState icon="calendar-outline" title="No bookings yet" text="Book a court, class or session from the Venues tab." />)}

          {tab === 'Payments' && (app.payments.length ? app.payments.map(p => (
            <View key={p.id} style={S.payRow}>
              <View style={[S.payIcon, { backgroundColor: p.status === 'Paid' ? C.green : p.status === 'Refunded' ? C.warning : p.status === 'Failed' ? C.danger : C.blue }]}><Ionicons name={p.status === 'Refunded' ? 'return-down-back' : p.status === 'Paid' ? 'checkmark' : 'time'} size={18} color={C.white} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.listTitle} numberOfLines={1}>{p.purpose}</Text>
                <Text style={S.listSub}>{p.date} · {p.method}</Text>
                <View style={[S.rowCenter, { gap: 6, marginTop: 4 }]}><Badge label={p.status} tone={statusTone(p.status)} dot /><Pressable onPress={() => app.toast('Receipt downloaded (placeholder)', 'info')}><Text style={S.linkSmall}>Receipt</Text></Pressable></View>
              </View>
              <Text style={[S.venuePrice, p.status === 'Refunded' && { color: C.warning }]}>{money(p.amount)}</Text>
            </View>
          )) : <EmptyState icon="card-outline" title="No payments yet" text="Match & booking payments appear here." />)}

          {tab === 'Memberships' && (app.memberships.length ? app.memberships.map(m => {
            const mv = getVenue(m.venueId);
            return (
              <View key={m.id} style={S.matchCard}>
                <Pressable style={S.rowCenter} onPress={() => app.go('venueDetail', { id: m.venueId })}>
                  <View style={[S.bookingThumb, S.miniPostNoImg]}><Ionicons name="card" size={22} color={C.blue} /></View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={S.listTitle} numberOfLines={1}>{mv.name}</Text>
                    <Text style={S.listSub}>{m.plan} · per {m.period} · {money(m.price)}</Text>
                    <View style={[S.rowCenter, { gap: 6, marginTop: 4 }]}><Badge label={m.status} tone={statusTone(m.status)} dot /><Badge label={`Start ${m.startDate}`} tone="navy" /></View>
                  </View>
                </Pressable>
                <View style={S.rowGap}>
                  <AppButton title="Renew" variant="secondary" icon="refresh" small fill onPress={() => app.toast('Membership renewed ✓', 'success')} />
                  <AppButton title="Cancel" variant="danger" icon="close" small fill onPress={() => app.toast('Membership cancelled', 'info')} />
                </View>
              </View>
            );
          }) : <EmptyState icon="card-outline" title="No memberships" text="Apply from a gym's venue page." />)}

          {tab === 'Saved' && (() => {
            const savedPosts = app.posts.filter(p => app.isSaved(p.id));
            return savedPosts.length ? savedPosts.map(p => (
              <Pressable key={p.id} style={S.miniPost} onPress={() => app.go('postDetail', { id: p.id })}>
                {p.image ? <Image source={{ uri: p.image }} style={S.miniPostImg} /> : <View style={[S.miniPostImg, S.miniPostNoImg]}><Ionicons name={POST_ICON[p.postType] || 'document-text'} size={22} color={C.blue} /></View>}
                <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle} numberOfLines={1}>{p.title || p.postType}</Text><Text style={S.listSub} numberOfLines={2}>{p.caption}</Text></View>
                <SaveButton saved onToggle={() => app.toggleSave(p.id)} />
              </Pressable>
            )) : <EmptyState icon="bookmark-outline" title="No saved posts" text="Tap the bookmark on any post to save it here." />;
          })()}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Connections (Followers / Following) ──────────────────────────────────────
function ConnectionsScreen({ app }) {
  const id = app.params.id || currentUser.id;
  const isMe = id === currentUser.id;
  const [mode, setMode] = useState(app.params.mode || 'Followers');
  const followerUsers = users.filter(u => u.id !== id);
  return (
    <Screen>
      <TopBar title={getUser(id).name} onBack={app.back} />
      <View style={S.searchHead}>
        <View style={S.segment}>
          {['Followers', 'Following'].map(t => (
            <Pressable key={t} onPress={() => setMode(t)} style={[S.segItem, mode === t && S.segItemActive]}>
              <Text style={[S.segText, mode === t && S.segTextActive]}>{t} {t === 'Followers' ? app.followerCount('user', id, getUser(id).followers) : (isMe ? app.followingCount() : getUser(id).following)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {mode === 'Followers' ? (
          followerUsers.length ? followerUsers.map(u => {
            const iFollow = app.isFollowing('user', u.id);
            return (
              <View key={u.id} style={S.listRow}>
                <Pressable style={S.rowCenter} onPress={() => app.go('userProfile', { id: u.id })}>
                  <Avatar label={u.name} size={46} online={u.availability === 'Available'} />
                  <View style={{ marginLeft: 12 }}><Text style={S.listTitle}>{u.name}</Text><Text style={S.listSub}>@{u.username} · {u.mainSport}{iFollow ? ' · Mutual' : ''}</Text></View>
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => app.toggleFollow('user', u.id, u.name)} style={[S.followMini, iFollow && S.followMiniActive]}><Text style={[S.followMiniText, iFollow && S.followMiniTextActive]}>{iFollow ? 'Following' : 'Follow'}</Text></Pressable>
                <Pressable style={[S.chatMini, { marginLeft: 8 }]} onPress={() => app.openDirectChat(u.id)}><Ionicons name="chatbubble-outline" size={16} color={C.blue} /></Pressable>
              </View>
            );
          }) : <EmptyState icon="people-outline" title="No followers yet" text="Followers will appear here." />
        ) : (
          <FollowingList app={app} />
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}
function FollowingList({ app }) {
  const items = [];
  users.forEach(u => app.isFollowing('user', u.id) && items.push({ kind: 'user', id: u.id, name: u.name, sub: '@' + u.username + ' · Player', ring: undefined }));
  app.squads.forEach(s => app.isFollowing('squad', s.id) && items.push({ kind: 'squad', id: s.id, name: s.name, sub: s.sport + ' · Squad', ring: 'green' }));
  venues.forEach(v => app.isFollowing('venue', v.id) && items.push({ kind: 'venue', id: v.id, name: v.name, sub: v.venueType + ' · Venue', ring: 'wood' }));
  app.events.forEach(e => app.isFollowing('event', e.id) && items.push({ kind: 'event', id: e.id, name: e.title, sub: e.sport + ' · Event', ring: undefined }));
  if (!items.length) return <EmptyState icon="person-add-outline" title="Not following anyone yet" text="Follow players, squads, venues & events to see them here." />;
  const open = it => it.kind === 'user' ? app.go('userProfile', { id: it.id }) : it.kind === 'squad' ? app.go('squadDetail', { id: it.id }) : it.kind === 'venue' ? app.go('venueDetail', { id: it.id }) : app.go('eventDetail', { id: it.id });
  return items.map(it => (
    <View key={it.kind + it.id} style={S.listRow}>
      <Pressable style={S.rowCenter} onPress={() => open(it)}>
        <Avatar label={it.name} size={46} ring={it.ring} />
        <View style={{ marginLeft: 12 }}><Text style={S.listTitle} numberOfLines={1}>{it.name}</Text><Text style={S.listSub}>{it.sub}</Text></View>
      </Pressable>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => app.toggleFollow(it.kind, it.id, it.name)} style={[S.followMini, S.followMiniActive]}><Text style={[S.followMiniText, S.followMiniTextActive]}>Following</Text></Pressable>
    </View>
  ));
}

// ─── Toggle atom ──────────────────────────────────────────────────────────────
function Toggle({ value, onToggle }) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => { Animated.timing(x, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start(); }, [value]);
  const left = x.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bg = x.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.green] });
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <Animated.View style={[S.toggle, { backgroundColor: bg }]}><Animated.View style={[S.toggleKnob, { left }]} /></Animated.View>
    </Pressable>
  );
}

// ─── Edit profile ─────────────────────────────────────────────────────────────
function EditProfileScreen({ app }) {
  const p = app.profile;
  const [name, setName] = useState(p.name);
  const [username, setUsername] = useState(p.username);
  const [bio, setBio] = useState(p.bio || '');
  const [location, setLocation] = useState(p.location);
  const [sport, setSport] = useState(p.mainSport);
  const [skill, setSkill] = useState(p.skillLevel);
  const [availability, setAvailability] = useState(p.availability);
  const [style, setStyle] = useState(p.playingStyle || 'Balanced');
  const [contact, setContact] = useState(p.contact || '');
  const [photo, setPhoto] = useState(p.photo || null);
  const [busy, setBusy] = useState(false);
  const save = () => {
    if (!name.trim()) { app.toast('Name cannot be empty', 'error'); return; }
    setBusy(true);
    setTimeout(() => { app.updateProfile({ name: name.trim(), username: username.trim(), bio, location, mainSport: sport, skillLevel: skill, availability, playingStyle: style, contact, photo }); setBusy(false); app.back(); }, 600);
  };
  return (
    <Screen>
      <TopBar title="Edit profile" onBack={app.back} right={<Pressable hitSlop={8} onPress={save}><Text style={S.markAll}>Save</Text></Pressable>} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center' }}>
            <Avatar label={name} img={photo} size={86} accent ring="green" />
            <Pressable onPress={() => setPhoto(null)} style={{ marginTop: 8 }}><Text style={S.linkSmall}>Use initials</Text></Pressable>
          </View>
          <Text style={S.inputLabel}>Profile photo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MEDIA_GALLERY.map(m => <Pressable key={m.id} onPress={() => setPhoto(m.url)}><Image source={{ uri: m.url }} style={[S.photoPick, photo === m.url && S.photoPickOn]} /></Pressable>)}
          </ScrollView>
          <Text style={S.inputLabel}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={S.input} placeholderTextColor={C.mutedLight} />
          <Text style={S.inputLabel}>Username</Text>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={S.input} placeholderTextColor={C.mutedLight} />
          <Text style={S.inputLabel}>Bio</Text>
          <TextInput value={bio} onChangeText={setBio} multiline style={[S.input, S.inputArea]} placeholder="Tell people about your game" placeholderTextColor={C.mutedLight} />
          <Text style={S.inputLabel}>Location</Text>
          <View style={S.chipWrap}>{['Thimphu', 'Paro', 'Phuentsholing'].map(l => <Chip key={l} label={l} active={location === l} onPress={() => setLocation(l)} />)}</View>
          <Text style={S.inputLabel}>Main sport</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>{ALL_SPORTS.map(s => <Chip key={s} label={s} icon={sportIcon(s)} active={sport === s} onPress={() => setSport(s)} />)}</ScrollView>
          <Text style={S.inputLabel}>Skill level</Text>
          <View style={S.chipWrap}>{['Casual', 'Intermediate', 'Competitive', 'Pro'].map(s => <Chip key={s} label={s} active={skill === s} onPress={() => setSkill(s)} />)}</View>
          <Text style={S.inputLabel}>Availability</Text>
          <View style={S.chipWrap}>{['Available', 'Evenings', 'Weekends', 'Maybe'].map(s => <Chip key={s} label={s} active={availability === s} onPress={() => setAvailability(s)} />)}</View>
          <Text style={S.inputLabel}>Preferred playing style</Text>
          <View style={S.chipWrap}>{['High press', 'Balanced', 'Counter attack', 'Possession', 'Defensive'].map(s => <Chip key={s} label={s} active={style === s} onPress={() => setStyle(s)} />)}</View>
          <Text style={S.inputLabel}>Contact / social</Text>
          <TextInput value={contact} onChangeText={setContact} placeholder="@handle or phone" placeholderTextColor={C.mutedLight} style={S.input} />
          <View style={{ height: 16 }} />
          <View style={S.rowGap}>
            <AppButton title="Cancel" variant="secondary" small fill onPress={app.back} />
            <AppButton title={busy ? 'Saving…' : 'Save Changes'} icon={busy ? undefined : 'checkmark'} loading={busy} small fill onPress={save} />
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsScreen({ app }) {
  const items = [
    { icon: 'person-circle-outline', label: 'Account Settings', kind: 'Account' },
    { icon: 'notifications-outline', label: 'Notification Settings', kind: 'Notifications' },
    { icon: 'lock-closed-outline', label: 'Privacy Settings', kind: 'Privacy' },
    { icon: 'card-outline', label: 'Payment Settings', kind: 'Payment' },
    { icon: 'calendar-outline', label: 'Booking Settings', kind: 'Booking' },
    { icon: 'color-palette-outline', label: 'App Theme', kind: 'Theme' },
    { icon: 'help-circle-outline', label: 'Help & Support', kind: 'Help' },
    { icon: 'flag-outline', label: 'Report a Problem', kind: 'Report' },
  ];
  return (
    <Screen>
      <TopBar title="Settings" onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {items.map(it => (
          <Pressable key={it.kind} style={S.settingRow} onPress={() => it.kind === 'Theme' ? app.setTheme(app.theme === 'Light' ? 'Dark' : 'Light') : app.go('settingsSub', { kind: it.kind })}>
            <View style={S.settingIcon}><Ionicons name={it.icon} size={19} color={C.blue} /></View>
            <Text style={S.settingLabel}>{it.label}</Text>
            {it.kind === 'Theme' ? <Text style={S.listSub}>{app.theme}</Text> : <Ionicons name="chevron-forward" size={18} color={C.mutedLight} />}
          </Pressable>
        ))}
        <View style={{ height: 14 }} />
        <AppButton title="Admin Panel" icon="shield-checkmark" fill onPress={() => app.go('adminLogin')} />
        <View style={{ height: 8 }} />
        <AppButton title="Logout" variant="secondary" icon="log-out-outline" fill onPress={app.logout} />
        <View style={{ height: 8 }} />
        <AppButton title="Delete Account" variant="danger" icon="trash-outline" fill onPress={() => app.toast('Account deletion requires email confirmation (placeholder)', 'info')} />
        <Text style={[S.createHint, { marginTop: 16 }]}>ThangGo v3 · Made for Bhutan 🇧🇹</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}
function SettingsSubScreen({ app }) {
  const kind = app.params.kind;
  const Row = ({ label, value, onToggle }) => (
    <View style={S.settingRow}><Text style={S.settingLabel}>{label}</Text><Toggle value={value} onToggle={onToggle} /></View>
  );
  return (
    <Screen>
      <TopBar title={kind + ' settings'} onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {kind === 'Notifications' ? Object.keys(app.notifPrefs).map(k => <Row key={k} label={k} value={app.notifPrefs[k]} onToggle={() => app.setNotifPref(k)} />) : null}
        {kind === 'Privacy' ? (
          <>
            {Object.keys(app.privacyPrefs).map(k => <Row key={k} label={k} value={app.privacyPrefs[k]} onToggle={() => app.setPrivacyPref(k)} />)}
            <Text style={S.inputLabel}>Who can message me</Text>
            <View style={S.chipWrap}>{['Everyone', 'Followers', 'Squad only', 'No one'].map(o => <Chip key={o} label={o} active={app.msgPrivacy === o} onPress={() => app.setMsgPrivacy(o)} />)}</View>
          </>
        ) : null}
        {kind === 'Account' ? (
          <>
            <Text style={S.inputLabel}>Email</Text><TextInput value="ngawang@thanggo.bt" editable={false} style={S.input} />
            <Text style={S.inputLabel}>Phone</Text><TextInput value="+975 17 11 22 33" editable={false} style={S.input} />
            <View style={{ height: 12 }} /><AppButton title="Change password" variant="secondary" icon="key-outline" fill onPress={() => app.toast('Password reset link sent', 'info')} />
          </>
        ) : null}
        {kind === 'Payment' ? (
          <>
            <Text style={S.inputLabel}>Payment methods</Text>
            {['mBoB Wallet · default', 'BNB Pay', 'Cash on arrival'].map(m => <View key={m} style={S.settingRow}><Ionicons name="card-outline" size={18} color={C.blue} /><Text style={[S.settingLabel, { marginLeft: 10 }]}>{m}</Text></View>)}
            <View style={{ height: 12 }} /><AppButton title="Add payment method" variant="secondary" icon="add" fill onPress={() => app.toast('Add payment method (placeholder)', 'info')} />
          </>
        ) : null}
        {kind === 'Booking' ? (
          <>
            <View style={S.settingRow}><Text style={S.settingLabel}>Auto-confirm free bookings</Text><Toggle value onToggle={() => app.toast('Saved', 'info')} /></View>
            <View style={S.settingRow}><Text style={S.settingLabel}>Remind me 1h before</Text><Toggle value onToggle={() => app.toast('Saved', 'info')} /></View>
            <Text style={S.inputLabel}>Default split</Text><View style={S.chipWrap}>{['50/50 Team Split', 'Per Player Split'].map(o => <Chip key={o} label={o} active={o === '50/50 Team Split'} onPress={() => app.toast('Default split saved', 'info')} />)}</View>
          </>
        ) : null}
        {kind === 'Help' || kind === 'Report' ? (
          <>
            <Text style={S.squadAbout2}>{kind === 'Help' ? 'Need a hand? Browse FAQs or message the ThangGo team. We usually reply within a day.' : 'Tell us what went wrong and we will look into it right away.'}</Text>
            <View style={{ height: 12 }} />
            {kind === 'Report' ? <TextInput placeholder="Describe the problem…" placeholderTextColor={C.mutedLight} multiline style={[S.input, S.inputArea]} /> : null}
            <View style={{ height: 12 }} />
            <AppButton title={kind === 'Help' ? 'Contact support' : 'Submit report'} icon={kind === 'Help' ? 'chatbubbles-outline' : 'send'} fill onPress={() => { app.toast(kind === 'Help' ? 'Support chat opened' : 'Report submitted — thank you', 'success'); app.back(); }} />
          </>
        ) : null}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Match settlement + result ────────────────────────────────────────────────
function SettlementScreen({ app }) {
  const l = app.lobbies.find(x => x.id === app.params.lobbyId);
  if (!l) return <Screen><TopBar title="Settlement" onBack={app.back} /><EmptyState icon="trophy-outline" title="No match" text="Open from a match lobby." /></Screen>;
  const a = getSquad(app.squads, l.teamAId), b = getSquad(app.squads, l.teamBId), v = getVenue(l.venueId);
  const result = app.results.find(r => r.lobbyId === l.id);
  const [sa, setSa] = useState(result ? String(result.scoreA) : '');
  const [sb, setSb] = useState(result ? String(result.scoreB) : '');
  const total = v.pricePerHour;
  const paid = l.paymentStatus === 'Paid' ? total : l.paymentStatus === 'Partially Paid' ? Math.round(total / 2) : 0;
  const balance = total - paid;
  const left = l.paymentSplit.includes('Host') ? total : Math.round(total / 2);
  const right = total - left;
  const fullyPaid = balance <= 0;
  const scale = useRef(new Animated.Value(fullyPaid ? 1 : 0.6)).current;
  useEffect(() => { if (fullyPaid) Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start(); }, [fullyPaid]);

  return (
    <Screen>
      <TopBar title="Match settlement" onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {/* result */}
        <View style={S.summaryCard}>
          <Text style={[S.miniLabel, { marginTop: 0 }]}>Match result</Text>
          <Text style={S.detailTitle}>{a.name} {result ? `${result.scoreA} – ${result.scoreB}` : '— : —'} {b.name}</Text>
          <Text style={S.listSub}>{l.sport} · {v.name} · {l.date}</Text>
          {!result ? (
            <>
              <Text style={S.inputLabel}>Submit final score</Text>
              <View style={S.scoreRow}>
                <TextInput value={sa} onChangeText={setSa} keyboardType="number-pad" maxLength={2} placeholder="0" placeholderTextColor={C.mutedLight} style={[S.input, S.scoreInput]} />
                <Text style={S.scoreDash}>–</Text>
                <TextInput value={sb} onChangeText={setSb} keyboardType="number-pad" maxLength={2} placeholder="0" placeholderTextColor={C.mutedLight} style={[S.input, S.scoreInput]} />
              </View>
              <View style={{ height: 10 }} />
              <AppButton title="Submit Result" icon="trophy" fill onPress={() => { if (sa === '' || sb === '') { app.toast('Enter both scores', 'error'); return; } app.submitResult(l.id, Number(sa), Number(sb)); }} />
            </>
          ) : (
            <View style={[S.rowCenter, { marginTop: 8, gap: 8 }]}>
              <Badge label={result.status} tone={statusTone(result.status === 'Completed' ? 'Completed' : result.status === 'Disputed' ? 'Disputed' : 'Pending')} dot />
              {result.status === 'Pending Confirmation' ? (
                <><AppButton title="Confirm Result" variant="green" icon="checkmark" small onPress={() => app.confirmResult(result.id)} /><AppButton title="Dispute" variant="danger" icon="alert" small onPress={() => app.disputeResult(result.id)} /></>
              ) : result.status === 'Completed' && !result.postId ? (
                <AppButton title="Post Result" icon="megaphone-outline" small onPress={() => app.postResult(result.id)} />
              ) : null}
            </View>
          )}
        </View>

        {/* settlement */}
        <Text style={S.miniLabel}>Payment settlement</Text>
        {fullyPaid ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Animated.View style={[S.confirmTick, { transform: [{ scale }], width: 64, height: 64, borderRadius: 32, marginBottom: 8 }]}><Ionicons name="checkmark" size={34} color={C.white} /></Animated.View>
            <Text style={S.confirmTitle}>Payment Completed</Text>
          </View>
        ) : null}
        <View style={S.summaryCard}>
          <View style={S.summaryRow}><Text style={S.summaryK}>Venue fee</Text><Text style={S.summaryV}>{money(total)}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Booking fee</Text><Text style={S.summaryV}>{money(0)}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Split</Text><Text style={S.summaryV}>{l.paymentSplit}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>{a.name}</Text><View style={S.rowCenter}><Text style={[S.summaryV, { marginRight: 6 }]}>{money(left)}</Text><Badge label={l.paymentStatus === 'Paid' ? 'Paid' : 'Pending'} tone={l.paymentStatus === 'Paid' ? 'green' : 'orange'} /></View></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>{b.name}</Text><View style={S.rowCenter}><Text style={[S.summaryV, { marginRight: 6 }]}>{money(right)}</Text><Badge label={l.paymentStatus === 'Paid' ? 'Paid' : 'Pending'} tone={l.paymentStatus === 'Paid' ? 'green' : 'orange'} /></View></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Method</Text><Text style={S.summaryV}>mBoB Wallet</Text></View>
          <View style={[S.summaryRow, { borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 8, marginTop: 4 }]}><Text style={[S.summaryK, { fontWeight: '800', color: C.text }]}>{fullyPaid ? 'Settled' : 'Balance pending'}</Text><Text style={[S.summaryV, { color: fullyPaid ? C.green : C.danger, fontWeight: '900' }]}>{money(balance)}</Text></View>
        </View>
        <View style={{ height: 12 }} />
        {!fullyPaid ? <AppButton title="Pay Now" icon="card" fill onPress={() => app.settleMatch(l.id)} /> : null}
        <View style={{ height: 10 }} />
        <View style={S.rowGap}>
          <AppButton title="Receipt" variant="secondary" icon="receipt-outline" small fill onPress={() => app.toast('Receipt downloaded (placeholder)', 'info')} />
          <AppButton title="Dispute" variant="secondary" icon="alert-circle-outline" small fill onPress={() => app.toast('Payment dispute opened', 'info')} />
          <AppButton title="Share" variant="secondary" icon="share-social-outline" small fill onPress={() => app.openShare({ id: l.id, title: `${a.name} vs ${b.name} settlement`, kind: 'settlement' })} />
        </View>
        <Text style={[S.createHint, { marginTop: 14 }]}>Mark as Paid (venue owner / admin) — placeholder</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Squad detail ─────────────────────────────────────────────────────────────
function SquadDetailScreen({ app }) {
  const s = getSquad(app.squads, app.params.id);
  const cap = getUser(s.captainId);
  const following = app.isFollowing('squad', s.id);
  const squadPosts = app.posts.filter(p => p.createdBy === s.id);
  return (
    <Screen>
      <TopBar title={s.name} onBack={app.back}
        right={<Pressable hitSlop={8} onPress={() => app.openSquadChat(s.id)}><Ionicons name="chatbubble-outline" size={20} color={C.navy} /></Pressable>} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={S.squadHero}>
          <Avatar label={s.name} size={76} ring="green" />
          <Text style={S.profileName}>{s.name}</Text>
          <Text style={S.profileHandle}>@{s.handle} · {s.location}</Text>
          <View style={S.rowCenter}>
            <Badge label={s.sport} tone="blue" /><View style={{ width: 6 }} /><Badge label={s.skillLevel} tone="navy" /><View style={{ width: 6 }} /><Badge label={`⭐ ${s.rating}`} tone="green" />
          </View>
          <View style={S.statBar}>
            <View style={S.statItem}><Text style={S.statNum}>{app.followerCount('squad', s.id, s.followers)}</Text><Text style={S.statLabel}>Followers</Text></View>
            <View style={S.statDivider} />
            <View style={S.statItem}><Text style={S.statNum}>{s.wins}</Text><Text style={S.statLabel}>Wins</Text></View>
            <View style={S.statDivider} />
            <View style={S.statItem}><Text style={S.statNum}>{s.losses}</Text><Text style={S.statLabel}>Losses</Text></View>
            <View style={S.statDivider} />
            <View style={S.statItem}><Text style={S.statNum}>{s.members.length}</Text><Text style={S.statLabel}>Players</Text></View>
          </View>
          <View style={S.rowGap}>
            <AppButton title={following ? 'Following' : 'Follow'} variant={following ? 'secondary' : 'primary'} icon={following ? 'checkmark' : 'person-add'} small fill onPress={() => app.toggleFollow('squad', s.id, s.name)} />
            <AppButton title="Message" variant="secondary" icon="chatbubble-outline" small fill onPress={() => app.openSquadChat(s.id)} />
          </View>
          <AppButton title="Challenge this squad" icon="flash" fill onPress={() => app.go('create')} />
          <View style={{ height: 8 }} />
          <AppButton title="Tactics & Formations" variant="secondary" icon="grid-outline" fill onPress={() => app.go('squadTactics', { id: s.id })} />
        </View>

        <Text style={[S.miniLabel, { paddingHorizontal: 16 }]}>About</Text>
        <Text style={S.squadAbout}>{s.description}</Text>

        <Text style={[S.miniLabel, { paddingHorizontal: 16 }]}>Captain</Text>
        <Pressable style={S.listRow} onPress={() => app.go('userProfile', { id: cap.id })}>
          <Avatar label={cap.name} size={46} accent />
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle}>{cap.name}</Text><Text style={S.listSub}>Captain · {cap.mainSport}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={C.mutedLight} />
        </Pressable>

        <Text style={[S.miniLabel, { paddingHorizontal: 16 }]}>Roster ({s.members.length})</Text>
        {s.members.map(m => {
          const u = getUser(m.userId);
          return (
            <Pressable key={m.userId} style={S.listRow} onPress={() => app.go('userProfile', { id: m.userId })}>
              <Avatar label={u.name} size={42} online={m.availability === 'Available'} accent={m.isCaptain} />
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle}>{u.name}{m.isCaptain ? ' ©' : m.isViceCaptain ? ' (VC)' : ''}</Text><Text style={S.listSub}>{m.role}</Text></View>
              <Badge label={m.availability} tone={statusTone(m.availability)} />
            </Pressable>
          );
        })}

        {squadPosts.length ? <Text style={[S.miniLabel, { paddingHorizontal: 16 }]}>Posts</Text> : null}
        {squadPosts.map(p => (
          <Pressable key={p.id} style={S.miniPost} onPress={() => app.go('postDetail', { id: p.id })}>
            <View style={[S.miniPostImg, S.miniPostNoImg]}><Ionicons name={POST_ICON[p.postType] || 'document-text'} size={22} color={C.blue} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle} numberOfLines={1}>{p.title}</Text><Text style={S.listSub} numberOfLines={2}>{p.caption}</Text></View>
          </Pressable>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Booking primitives ───────────────────────────────────────────────────────
function nextHour(t) {
  const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return t;
  let h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12;
  let total = h * 60 + (+m[2]) + 60;
  let nh = Math.floor(total / 60) % 24, nm = total % 60;
  const ap = nh >= 12 ? 'PM' : 'AM'; let hh = nh % 12; if (hh === 0) hh = 12;
  return `${hh}:${String(nm).padStart(2, '0')} ${ap}`;
}
const slotLabel = t => `${t} - ${nextHour(t)}`;
// Hourly slots from 6:00 AM through 11:00 PM (last slot 11:00 PM – 12:00 AM).
const FULL_DAY = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];
const slotTimesOf = () => FULL_DAY;
function timeToMin(t) { const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + (+m[2]); }
function venueHours(v) { const parts = (v.hours || '6:00 AM – 12:00 AM').split(/–|-/); let open = timeToMin(parts[0].trim()); let close = timeToMin((parts[1] || '').trim()); if (close === 0) close = 24 * 60; return { open, close }; }
function slotStatus(venue, date, t, bookings, selected) {
  if (selected === t) return 'Selected';
  const b = (bookings || []).find(x => x.venueId === venue.id && x.date === date && x.slot === t && x.status !== 'Cancelled');
  if (b) return b.paymentStatus === 'Paid' ? 'Booked' : 'Pending';
  const { open, close } = venueHours(venue);
  const m = timeToMin(t);
  if (m < open || m >= close) return 'Closed';
  if (venue.preset && venue.preset[t]) return venue.preset[t];
  return 'Available';
}
function bookingTypesFor(venue) {
  switch (venue.venueType) {
    case 'Gym': return ['Gym Day Pass', 'Gym Membership', 'Personal Trainer Session', 'Class Booking'];
    case 'Pool': return ['Swimming Lane Booking', 'Class Booking'];
    case 'Sports Club': return ['Solo Booking', 'Squad Booking', 'Open Match', 'Find Opponent', 'Class Booking', 'Gym Membership'];
    case 'Indoor Hall': return ['Solo Booking', 'Squad Booking', 'Open Match', 'Find Opponent', 'Class Booking'];
    case 'Training Class': return ['Class Booking'];
    case 'Event Space': return ['Event Entry'];
    default: return ['Solo Booking', 'Squad Booking', 'Open Match', 'Find Opponent'];
  }
}
const NEEDS_SLOT = bt => !['Gym Membership', 'Gym Day Pass'].includes(bt);

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dateKeyFor(dt, today) { const diff = Math.round((dt - today) / 86400000); if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; return `${DOW[dt.getDay()]} ${dt.getDate()}`; }
// Real month-grid calendar: prev/next months, today + selected highlight, past disabled.
function DateSelector({ value, onChange }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const firstDow = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = []; for (let i = 0; i < firstDow; i++) cells.push(null); for (let d = 1; d <= daysIn; d++) cells.push(d);
  const canPrev = month.getFullYear() > today.getFullYear() || (month.getFullYear() === today.getFullYear() && month.getMonth() > today.getMonth());
  const dateOf = d => new Date(month.getFullYear(), month.getMonth(), d);
  return (
    <View style={S.calendar}>
      <View style={S.calHead}>
        <Pressable disabled={!canPrev} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={[S.calNav, !canPrev && { opacity: 0.3 }]}><Ionicons name="chevron-back" size={18} color={C.navy} /></Pressable>
        <Text style={S.calMonth}>{MON[month.getMonth()]} {month.getFullYear()}</Text>
        <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={S.calNav}><Ionicons name="chevron-forward" size={18} color={C.navy} /></Pressable>
      </View>
      <View style={S.calDowRow}>{DOW.map(d => <Text key={d} style={S.calDow}>{d}</Text>)}</View>
      <View style={S.calGrid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={'e' + i} style={S.calCell} />;
          const dt = dateOf(d); const lbl = dateKeyFor(dt, today); const sel = value === lbl; const past = dt < today; const isToday = dt.getTime() === today.getTime();
          return (
            <Pressable key={d} disabled={past} onPress={() => onChange(lbl)} style={[S.calCell, sel && S.calCellOn, isToday && !sel && S.calCellToday]}>
              <Text style={[S.calCellText, sel && { color: C.white }, past && { color: C.mutedLight }, isToday && !sel && { color: C.blue, fontWeight: '900' }]}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Full-screen swipeable gallery viewer
function GalleryViewer({ images, start = 0, onClose }) {
  const [i, setI] = useState(start);
  return (
    <View style={S.galleryWrap}>
      <FlatList data={images} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        initialScrollIndex={start} getItemLayout={(_, idx) => ({ length: CW, offset: CW * idx, index: idx })}
        onMomentumScrollEnd={e => setI(Math.round(e.nativeEvent.contentOffset.x / CW))}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => <View style={{ width: CW, height: '100%', alignItems: 'center', justifyContent: 'center' }}><Image source={{ uri: item }} style={S.galleryImg} resizeMode="contain" /></View>} />
      <Pressable style={S.galleryClose} onPress={onClose} hitSlop={10}><Ionicons name="close" size={26} color={C.white} /></Pressable>
      <Text style={S.galleryCount}>{i + 1}/{images.length}</Text>
      <View style={S.galleryDots}>{images.map((_, idx) => <View key={idx} style={[S.imgDot, idx === i && S.imgDotOn]} />)}</View>
    </View>
  );
}

function TimeSlotGrid({ venue, date, bookings, selected, onSelect }) {
  return (
    <View style={S.slotGrid}>
      {slotTimesOf(venue).map(t => {
        const st = slotStatus(venue, date, t, bookings, selected);
        const disabled = st === 'Booked' || st === 'Closed';
        const tone = SLOT_TONE[st] || 'green';
        return (
          <Pressable key={t} disabled={disabled} onPress={() => onSelect(t)}
            style={[S.slotCell, st === 'Selected' && S.slotCellOn, disabled && S.slotCellDisabled]}>
            <Text style={[S.slotTime, st === 'Selected' && { color: C.white }, disabled && { color: C.mutedLight }]} numberOfLines={1}>{slotLabel(t)}</Text>
            <View style={[S.slotStatusPill, { backgroundColor: st === 'Selected' ? 'rgba(255,255,255,0.25)' : (tone === 'green' ? C.greenPale : tone === 'red' ? '#FFE8EA' : tone === 'orange' ? '#FFF3DC' : '#EEF2FF') }]}>
              <Text style={[S.slotStatusText, { color: st === 'Selected' ? C.white : (tone === 'green' ? '#007A42' : tone === 'red' ? C.danger : tone === 'orange' ? '#A05F00' : C.muted) }]}>{st}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Venue detail ─────────────────────────────────────────────────────────────
function VenueDetailScreen({ app }) {
  const v = getVenue(app.params.id);
  const [img, setImg] = useState(0);
  const [date, setDate] = useState('Today');
  const [slot, setSlot] = useState(null);
  const following = app.isFollowing('venue', v.id);
  const saved = app.isSaved('v:' + v.id);
  const manager = getUser(v.managerId);
  const [gallery, setGallery] = useState(false);
  const images = v.images || [v.image];
  const book = (extra) => app.go('booking', { venueId: v.id, date, slot, ...extra });
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View>
          <Pressable onPress={() => setGallery(true)}><Image source={{ uri: images[img] }} style={S.venueHeroImg} /></Pressable>
          <Pressable style={S.floatBack} onPress={app.back}><Ionicons name="chevron-back" size={22} color={C.navy} /></Pressable>
          <View style={S.floatRight}>
            <Pressable style={S.floatBtn} onPress={() => app.toggleSave('v:' + v.id)}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? C.blue : C.navy} /></Pressable>
            <Pressable style={S.floatBtn} onPress={() => app.openShare({ id: v.id, title: v.name, kind: 'venue' })}><Ionicons name="share-social-outline" size={19} color={C.navy} /></Pressable>
            <Pressable style={S.floatBtn} onPress={() => app.toggleFollow('venue', v.id, v.name)}><Ionicons name={following ? 'heart' : 'heart-outline'} size={19} color={following ? C.danger : C.navy} /></Pressable>
          </View>
          <Pressable style={S.galleryBtn} onPress={() => setGallery(true)}><Ionicons name="images" size={13} color={C.white} /><Text style={S.galleryBtnText}>{img + 1}/{images.length}</Text></Pressable>
          {images.length > 1 ? (
            <View style={S.imgDots}>{images.map((_, i) => <Pressable key={i} onPress={() => setImg(i)}><View style={[S.imgDot, i === img && S.imgDotOn]} /></Pressable>)}</View>
          ) : null}
        </View>
        {gallery ? <GalleryViewer images={images} start={img} onClose={() => setGallery(false)} /> : null}
        <View style={{ padding: 16 }}>
          <View style={S.rowCenter}><Badge label={`⭐ ${v.rating}`} tone="green" /><View style={{ width: 6 }} /><Badge label={v.venueType} tone="navy" /><View style={{ width: 6 }} /><Badge label={v.indoor} tone="blue" /><View style={{ flex: 1 }} /><Text style={S.venuePrice}>{money(v.pricePerHour)}<Text style={S.venuePriceUnit}>/{v.priceUnit}</Text></Text></View>
          <Text style={S.detailTitle}>{v.name}</Text>
          <Text style={S.postMeta}>{v.location} · {v.reviews} reviews · {app.followerCount('venue', v.id, v.followers)} followers</Text>

          {/* map placeholder */}
          <View style={S.mapBox}>
            <Ionicons name="map" size={22} color={C.blue} />
            <Text style={S.mapText}>{v.location}</Text>
            <View style={S.mapPin}><Ionicons name="location" size={16} color={C.white} /></View>
          </View>

          {/* what you can book */}
          <Text style={S.miniLabel}>What you can book</Text>
          <View style={S.chipWrap}>{bookingTypesFor(v).map(t => <Badge key={t} label={t} tone="blue" />)}</View>

          <Text style={S.miniLabel}>Sports & activities</Text>
          <View style={S.chipWrap}>{v.sports.map(sp => <Badge key={sp} label={sp} tone="navy" />)}</View>

          <View style={S.rowCenter}><Ionicons name="time-outline" size={15} color={C.muted} /><Text style={S.hoursText}>Open {v.hours}</Text></View>

          {/* time slots */}
          {v.venueType !== 'Gym' && v.venueType !== 'Event Space' ? (
            <>
              <Text style={S.miniLabel}>Select date</Text>
              <DateSelector value={date} onChange={setDate} />
              <Text style={S.miniLabel}>Available time slots — {date}</Text>
              <TimeSlotGrid venue={v} date={date} bookings={app.bookings} selected={slot} onSelect={setSlot} />
            </>
          ) : null}

          {/* membership */}
          {v.membership ? (
            <>
              <Text style={S.miniLabel}>Membership options</Text>
              {v.membership.map(m => (
                <View key={m.plan} style={S.planRow}>
                  <View style={{ flex: 1 }}><Text style={S.listTitle}>{m.plan}</Text><Text style={S.listSub}>per {m.period}</Text></View>
                  <Text style={S.venuePrice}>{money(m.price)}</Text>
                </View>
              ))}
              <View style={{ height: 8 }} />
              <AppButton title="Apply for Membership" variant="secondary" icon="card-outline" fill onPress={() => app.go('membership', { venueId: v.id })} />
              {v.benefits ? <><Text style={S.miniLabel}>Membership benefits</Text>{v.benefits.map(b => <View key={b} style={S.facilityRow}><Ionicons name="star" size={14} color={C.warning} /><Text style={S.facilityText}>{b}</Text></View>)}</> : null}
            </>
          ) : null}

          {/* classes */}
          {v.classes ? (
            <>
              <Text style={S.miniLabel}>Class schedule</Text>
              {v.classes.map(c => (
                <View key={c.name} style={S.classRow}>
                  <View style={[S.classIcon, { backgroundColor: getBoard(c.sport).accent || C.blue }]}><Ionicons name={sportIcon(c.sport)} size={18} color={C.white} /></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={S.listTitle}>{c.name}</Text>
                    <Text style={S.listSub}>{c.days} · {c.time} · {money(c.fee)}</Text>
                    <Text style={[S.listSub, { color: c.seats > 0 ? C.green : C.danger, fontWeight: '700' }]}>{c.seats > 0 ? `${c.seats} seats left` : 'Full'} · {c.cap} cap</Text>
                  </View>
                  <AppButton title="Book" icon="add" small disabled={c.seats <= 0} onPress={() => book({ type: 'Class Booking', className: c.name })} />
                </View>
              ))}
            </>
          ) : null}

          {/* trainers */}
          {v.trainers ? (
            <>
              <Text style={S.miniLabel}>Personal trainers</Text>
              {v.trainers.map(t => (
                <View key={t.name} style={S.classRow}>
                  <Avatar label={t.name} size={42} ring="wood" />
                  <View style={{ flex: 1, marginLeft: 10 }}><Text style={S.listTitle}>{t.name}</Text><Text style={S.listSub}>{t.focus} · {money(t.rate)}/session</Text></View>
                  <AppButton title="Book" icon="add" small onPress={() => book({ type: 'Personal Trainer Session', trainer: t.name })} />
                </View>
              ))}
            </>
          ) : null}

          {/* facilities */}
          <Text style={S.miniLabel}>Facilities</Text>
          {v.facilities.map(f => <View key={f} style={S.facilityRow}><Ionicons name="checkmark-circle" size={16} color={C.green} /><Text style={S.facilityText}>{f}</Text></View>)}

          {/* manager */}
          <Text style={S.miniLabel}>Venue manager</Text>
          <Pressable style={S.listRow} onPress={() => app.go('userProfile', { id: manager.id })}>
            <Avatar label={manager.name} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle}>{manager.name}</Text><Text style={S.listSub}>Venue manager · {v.area}</Text></View>
            <Pressable style={S.chatMini} onPress={() => app.openDirectChat(manager.id)}><Ionicons name="call-outline" size={18} color={C.blue} /></Pressable>
          </Pressable>

          {/* rules + reviews */}
          <Text style={S.miniLabel}>Rules</Text>
          <Text style={S.squadAbout2}>{v.rules}</Text>
          <Text style={S.miniLabel}>Reviews ({v.reviews})</Text>
          <View style={S.reviewCard}>
            <View style={S.rowCenter}><Avatar label="Pema W." size={34} /><View style={{ marginLeft: 8 }}><Text style={S.listTitle}>Pema W.</Text><Text style={S.listSub}>⭐⭐⭐⭐⭐</Text></View></View>
            <Text style={S.reviewText}>Great surface and lighting. Best value in Thimphu.</Text>
          </View>
        </View>
      </ScrollView>
      <View style={S.detailActions}>
        {v.venueType === 'Gym' && v.membership ? (
          <AppButton title="Membership" variant="secondary" icon="card-outline" fill onPress={() => app.go('membership', { venueId: v.id })} />
        ) : null}
        <AppButton title="Book Now" icon="calendar" fill onPress={() => book({})} />
      </View>
    </Screen>
  );
}

// ─── Booking ──────────────────────────────────────────────────────────────────
function BookingScreen({ app }) {
  const v = getVenue(app.params.venueId);
  const types = bookingTypesFor(v);
  const [type, setType] = useState(app.params.type && types.includes(app.params.type) ? app.params.type : types[0]);
  const [sport, setSport] = useState(v.sports[0]);
  const [date, setDate] = useState(app.params.date || 'Today');
  const [slot, setSlot] = useState(app.params.slot || null);
  const [participants, setParticipants] = useState(1);
  const [split, setSplit] = useState('50/50 Team Split');
  const [className, setClassName] = useState(app.params.className || (v.classes && v.classes[0] && v.classes[0].name));
  const [trainer, setTrainer] = useState(app.params.trainer || (v.trainers && v.trainers[0] && v.trainers[0].name));
  const [busy, setBusy] = useState(false);
  const splits = ['50/50 Team Split', 'Per Player Split', 'Host Pays', 'Custom Split', 'Loser Pays'];
  const cls = v.classes && v.classes.find(c => c.name === className);
  const matchRelated = ['Squad Booking', 'Open Match', 'Find Opponent'].includes(type);
  const needsSlot = NEEDS_SLOT(type) && type !== 'Class Booking';
  const isMembership = type === 'Gym Membership';

  const price = type === 'Class Booking' ? (cls ? cls.fee : 300)
    : type === 'Personal Trainer Session' ? (v.trainers.find(t => t.name === trainer) || { rate: 500 }).rate
    : type === 'Gym Day Pass' ? 150
    : type === 'Swimming Lane Booking' ? v.pricePerHour * participants
    : v.pricePerHour;

  if (isMembership) {
    return (
      <Screen>
        <TopBar title="Book venue" onBack={app.back} />
        <View style={{ padding: 16 }}>
          <View style={S.infoBanner}><Ionicons name="card" size={16} color={C.blue} /><Text style={S.infoBannerText}>Gym memberships are handled in the membership flow with plans & start date.</Text></View>
          <View style={{ height: 12 }} />
          <AppButton title="Continue to Membership" icon="arrow-forward" fill onPress={() => app.go('membership', { venueId: v.id })} />
        </View>
      </Screen>
    );
  }

  const confirm = () => {
    if (needsSlot && !slot) { app.toast('Select a time slot first', 'error'); return; }
    const st = needsSlot ? slotStatus(v, date, slot, app.bookings, null) : 'Available';
    if (st === 'Booked' || st === 'Closed') { app.toast('That slot is no longer available', 'error'); return; }
    setBusy(true);
    setTimeout(() => {
      const b = app.addBooking({
        venueId: v.id, sport, date, slot: needsSlot ? slot : null,
        bookingType: type, participants, matchMode: matchRelated ? type : null,
        split: matchRelated ? split : null, price, className: type === 'Class Booking' ? className : null,
        trainer: type === 'Personal Trainer Session' ? trainer : null,
        duration: type === 'Class Booking' ? '1 class' : '1 hour',
      });
      setBusy(false);
      app.go('bookingConfirm', { id: b.id });
    }, 800);
  };

  return (
    <Screen>
      <TopBar title="Book venue" onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={S.bookingVenue}>
          <Image source={{ uri: v.image }} style={S.bookingImg} />
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle}>{v.name}</Text><Text style={S.listSub}>{v.location}</Text><Text style={[S.listSub, { color: C.blue, fontWeight: '700' }]}>{money(v.pricePerHour)}/{v.priceUnit}</Text></View>
        </View>

        <Text style={S.inputLabel}>Booking type</Text>
        <View style={S.chipWrap}>{types.map(t => <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />)}</View>

        {type === 'Class Booking' && v.classes ? (
          <>
            <Text style={S.inputLabel}>Class</Text>
            <View style={S.chipWrap}>{v.classes.map(c => <Chip key={c.name} label={c.name} active={className === c.name} onPress={() => setClassName(c.name)} />)}</View>
            {cls ? <Text style={S.helperLine}>{cls.days} · {cls.time} · {cls.seats} seats left</Text> : null}
          </>
        ) : null}
        {type === 'Personal Trainer Session' && v.trainers ? (
          <>
            <Text style={S.inputLabel}>Trainer</Text>
            <View style={S.chipWrap}>{v.trainers.map(t => <Chip key={t.name} label={t.name} active={trainer === t.name} onPress={() => setTrainer(t.name)} />)}</View>
          </>
        ) : null}
        {!['Class Booking', 'Gym Day Pass'].includes(type) ? (
          <>
            <Text style={S.inputLabel}>Sport / activity</Text>
            <View style={S.chipWrap}>{v.sports.map(s => <Chip key={s} label={s} active={sport === s} onPress={() => setSport(s)} />)}</View>
          </>
        ) : null}

        <Text style={S.inputLabel}>Select date</Text>
        <DateSelector value={date} onChange={setDate} />

        {needsSlot ? (
          <>
            <Text style={S.inputLabel}>Select time slot</Text>
            <TimeSlotGrid venue={v} date={date} bookings={app.bookings} selected={slot} onSelect={setSlot} />
          </>
        ) : null}

        <Text style={S.inputLabel}>{type === 'Swimming Lane Booking' ? 'Lanes' : 'Participants'}</Text>
        <View style={S.stepperRow}>
          <Pressable style={S.stepperBtn} onPress={() => setParticipants(n => Math.max(1, n - 1))}><Ionicons name="remove" size={20} color={C.navy} /></Pressable>
          <Text style={S.stepperVal}>{participants}</Text>
          <Pressable style={S.stepperBtn} onPress={() => setParticipants(n => Math.min(22, n + 1))}><Ionicons name="add" size={20} color={C.navy} /></Pressable>
        </View>

        {matchRelated ? (
          <>
            <Text style={S.inputLabel}>Payment split</Text>
            <View style={S.chipWrap}>{splits.map(s => <Chip key={s} label={s} active={split === s} onPress={() => setSplit(s)} />)}</View>
            {type === 'Find Opponent' ? (
              <View style={S.infoBanner}><Ionicons name="information-circle" size={16} color={C.blue} /><Text style={S.infoBannerText}>After booking you can publish a public Match Challenge so other squads can request to compete.</Text></View>
            ) : null}
          </>
        ) : null}

        {/* summary */}
        <View style={S.summaryCard}>
          <Text style={[S.miniLabel, { marginTop: 0 }]}>Booking summary</Text>
          <View style={S.summaryRow}><Text style={S.summaryK}>Venue</Text><Text style={S.summaryV}>{v.name}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Activity</Text><Text style={S.summaryV}>{type === 'Class Booking' ? className : type === 'Personal Trainer Session' ? trainer : sport}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Date</Text><Text style={S.summaryV}>{date}</Text></View>
          {needsSlot ? <View style={S.summaryRow}><Text style={S.summaryK}>Time</Text><Text style={S.summaryV}>{slot ? slotLabel(slot) : '—'}</Text></View> : null}
          <View style={S.summaryRow}><Text style={S.summaryK}>Type</Text><Text style={S.summaryV}>{type}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>{type === 'Swimming Lane Booking' ? 'Lanes' : 'Participants'}</Text><Text style={S.summaryV}>{participants}</Text></View>
          {matchRelated ? <View style={S.summaryRow}><Text style={S.summaryK}>Split</Text><Text style={S.summaryV}>{split}</Text></View> : null}
          <View style={S.summaryRow}><Text style={S.summaryK}>Cancellation</Text><Text style={S.summaryV}>Free up to 2h before</Text></View>
          <View style={[S.summaryRow, { borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 8, marginTop: 4 }]}><Text style={[S.summaryK, { fontWeight: '800', color: C.text }]}>Total</Text><Text style={[S.summaryV, { color: C.blue, fontWeight: '900', fontSize: 16 }]}>{money(price)}</Text></View>
        </View>

        <View style={{ height: 14 }} />
        <AppButton title={busy ? 'Confirming…' : 'Confirm booking'} icon={busy ? undefined : 'checkmark-circle'} loading={busy} fill onPress={confirm} />
        <View style={{ height: 20 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Booking confirmation ─────────────────────────────────────────────────────
function BookingConfirmScreen({ app }) {
  const b = app.bookings.find(x => x.id === app.params.id);
  if (!b) return <Screen><TopBar title="Booking" onBack={app.back} /><EmptyState icon="calendar-outline" title="Booking not found" text="This booking is unavailable." /></Screen>;
  const v = getVenue(b.venueId);
  const matchRelated = ['Squad Booking', 'Open Match', 'Find Opponent'].includes(b.bookingType);
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => { Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start(); }, []);
  return (
    <Screen>
      <TopBar title="Booking confirmed" onBack={() => app.navTo('home')} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: 18 }}>
          <Animated.View style={[S.confirmTick, { transform: [{ scale }] }]}><Ionicons name="checkmark" size={44} color={C.white} /></Animated.View>
          <Text style={S.confirmTitle}>Booking Confirmed</Text>
          <Text style={S.confirmSub}>Booking #{b.id.toUpperCase()}</Text>
        </View>
        <View style={S.summaryCard}>
          <View style={S.summaryRow}><Text style={S.summaryK}>Venue</Text><Text style={S.summaryV}>{v.name}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Activity</Text><Text style={S.summaryV}>{b.className || b.trainer || b.sport}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Date</Text><Text style={S.summaryV}>{b.date}{b.slot ? ' · ' + slotLabel(b.slot) : ''}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Type</Text><Text style={S.summaryV}>{b.bookingType}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Status</Text><Badge label={b.status} tone={statusTone(b.status)} dot /></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Payment</Text><Badge label={b.paymentStatus} tone={statusTone(b.paymentStatus)} /></View>
          <View style={[S.summaryRow, { borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 8, marginTop: 4 }]}><Text style={[S.summaryK, { fontWeight: '800', color: C.text }]}>Total</Text><Text style={[S.summaryV, { color: C.blue, fontWeight: '900' }]}>{money(b.price)}</Text></View>
        </View>

        <View style={{ height: 12 }} />
        {b.paymentStatus !== 'Paid' ? <AppButton title="Pay now" icon="card" fill onPress={() => app.payBooking(b.id)} /> : <View style={S.paidBanner}><Ionicons name="checkmark-circle" size={18} color={C.white} /><Text style={S.lockedBannerText}>Payment complete</Text></View>}

        {b.bookingType === 'Find Opponent' && !b.postId ? (
          <><View style={{ height: 10 }} /><AppButton title="Create Match Challenge" variant="accent" icon="flash" fill onPress={() => app.createPostFromBooking(b.id)} /></>
        ) : null}
        {matchRelated ? (
          <><View style={{ height: 10 }} /><AppButton title={b.lobbyId ? 'Open match lobby' : 'Add to Lobby'} variant="secondary" icon="game-controller-outline" fill onPress={() => app.lobbyFromBooking(b.id)} /></>
        ) : null}
        <View style={{ height: 10 }} />
        <View style={S.rowGap}>
          <AppButton title="View Booking" variant="secondary" icon="receipt-outline" small fill onPress={() => app.go('profile', { tab: 'Bookings' })} />
          <AppButton title="Share" variant="secondary" icon="share-social-outline" small fill onPress={() => app.openShare({ id: b.id, title: `Booked ${v.name}`, kind: 'booking' })} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Membership flow ──────────────────────────────────────────────────────────
function MembershipScreen({ app }) {
  const v = getVenue(app.params.venueId);
  const plans = v.membership || [{ plan: 'Monthly', price: 1500, period: 'month' }];
  const [plan, setPlan] = useState(plans.find(p => p.plan === 'Monthly') ? 'Monthly' : plans[0].plan);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState('');
  const [start, setStart] = useState('Today');
  const [busy, setBusy] = useState(false);
  const sel = plans.find(p => p.plan === plan) || plans[0];
  const apply = (pay) => {
    if (!phone.trim()) { app.toast('Add a contact number', 'error'); return; }
    setBusy(true);
    setTimeout(() => {
      const m = app.addMembership({ venueId: v.id, plan: sel.plan, period: sel.period, price: sel.price, startDate: start, memberName: name, pay });
      setBusy(false);
      app.toast(pay ? 'Membership active 🎉' : 'Membership application submitted', 'success');
      app.go('profile', { tab: 'Memberships' });
    }, 800);
  };
  return (
    <Screen>
      <TopBar title="Membership" onBack={app.back} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={S.bookingVenue}>
          <Image source={{ uri: v.image }} style={S.bookingImg} />
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle}>{v.name}</Text><Text style={S.listSub}>{v.location}</Text></View>
        </View>
        <Text style={S.inputLabel}>Choose plan</Text>
        {plans.map(p => (
          <Pressable key={p.plan} style={[S.planSelect, plan === p.plan && S.planSelectOn]} onPress={() => setPlan(p.plan)}>
            <View style={[S.radio, plan === p.plan && S.radioOn]}>{plan === p.plan ? <View style={S.radioDot} /> : null}</View>
            <View style={{ flex: 1, marginLeft: 10 }}><Text style={S.listTitle}>{p.plan}</Text><Text style={S.listSub}>per {p.period}</Text></View>
            <Text style={S.venuePrice}>{money(p.price)}</Text>
          </Pressable>
        ))}
        <Text style={S.inputLabel}>Member name</Text>
        <TextInput value={name} onChangeText={setName} style={S.input} placeholderTextColor={C.mutedLight} />
        <Text style={S.inputLabel}>Contact number</Text>
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="17xxxxxx" placeholderTextColor={C.mutedLight} style={S.input} />
        <Text style={S.inputLabel}>Start date</Text>
        <DateSelector value={start} onChange={setStart} />
        {v.benefits ? <><Text style={S.miniLabel}>Benefits</Text>{v.benefits.map(b => <View key={b} style={S.facilityRow}><Ionicons name="star" size={14} color={C.warning} /><Text style={S.facilityText}>{b}</Text></View>)}</> : null}
        <View style={S.summaryCard}>
          <View style={S.summaryRow}><Text style={S.summaryK}>Plan</Text><Text style={S.summaryV}>{sel.plan} · per {sel.period}</Text></View>
          <View style={S.summaryRow}><Text style={S.summaryK}>Starts</Text><Text style={S.summaryV}>{start}</Text></View>
          <View style={[S.summaryRow, { borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 8, marginTop: 4 }]}><Text style={[S.summaryK, { fontWeight: '800', color: C.text }]}>Total</Text><Text style={[S.summaryV, { color: C.blue, fontWeight: '900' }]}>{money(sel.price)}</Text></View>
        </View>
        <View style={{ height: 14 }} />
        <View style={S.rowGap}>
          <AppButton title="Apply" variant="secondary" icon="document-text-outline" small fill loading={busy} onPress={() => apply(false)} />
          <AppButton title={busy ? 'Processing…' : 'Pay & Activate'} icon="card" small fill loading={busy} onPress={() => apply(true)} />
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Event detail ─────────────────────────────────────────────────────────────
function EventDetailScreen({ app }) {
  const e = app.events.find(x => x.id === app.params.id) || app.events[0];
  const following = app.isFollowing('event', e.id);
  const [reg, setReg] = useState(false);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View>
          <Image source={{ uri: e.image }} style={S.venueHeroImg} />
          <Pressable style={S.floatBack} onPress={app.back}><Ionicons name="chevron-back" size={22} color={C.navy} /></Pressable>
        </View>
        <View style={{ padding: 16 }}>
          <View style={S.rowCenter}><Badge label={e.status} tone={statusTone(e.status)} dot /><View style={{ width: 6 }} /><Badge label={e.sport} tone="navy" /></View>
          <Text style={S.detailTitle}>{e.title}</Text>
          <Text style={S.postMeta}>{e.location} · {e.date}</Text>
          <View style={S.postMetaGrid}>
            <Meta label="Entry fee" value={e.fee} icon="cash-outline" />
            <Meta label="Slots" value={e.slots} icon="people-outline" />
            <Meta label="Prize" value={e.prize} icon="trophy-outline" />
            <Meta label="Followers" value={`${app.followerCount('event', e.id, e.followers)}`} icon="heart-outline" />
          </View>
          <Text style={S.miniLabel}>About</Text>
          <Text style={S.squadAbout2}>{e.about}</Text>
          <View style={S.rowGap}>
            <AppButton title={following ? 'Following' : 'Follow event'} variant={following ? 'secondary' : 'primary'} icon={following ? 'checkmark' : 'heart-outline'} small fill onPress={() => app.toggleFollow('event', e.id, e.title)} />
            <AppButton title="Event chat" variant="secondary" icon="chatbubbles-outline" small fill onPress={() => app.openEventChat(e)} />
          </View>
          <View style={S.postActions}>
            <LikeButton liked={app.isLiked('e:' + e.id)} count={app.likeCount('e:' + e.id, e.followers)} onToggle={() => app.toggleLike('e:' + e.id, e.followers)} />
            <Pressable style={S.iconBtn} onPress={() => app.openShare({ id: 'e:' + e.id, title: e.title, kind: 'event' })} hitSlop={8}>
              <Ionicons name="paper-plane-outline" size={20} color={C.muted} /><Text style={S.iconBtnCount}>{app.shareCount('e:' + e.id, 0)}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <SaveButton saved={app.isSaved('e:' + e.id)} onToggle={() => app.toggleSave('e:' + e.id)} />
          </View>
        </View>
      </ScrollView>
      <View style={S.detailActions}>
        <AppButton title={reg ? 'Registered ✓' : 'Register squad'} variant={reg ? 'green' : 'primary'} icon={reg ? 'checkmark' : 'add-circle'} fill disabled={reg} onPress={() => { setReg(true); app.toast('Squad registered for ' + e.title, 'success'); }} />
      </View>
    </Screen>
  );
}

// ─── Share sheet ──────────────────────────────────────────────────────────────
function ShareSheet({ app }) {
  const s = app.shareSubject;
  if (!s) return null;
  const opts = [
    { icon: 'link', label: 'Copy Link', sub: 'Copy a shareable link', kind: 'copy' },
    { icon: 'chatbubble-ellipses', label: 'Share to Chat', sub: 'Send to a direct chat', kind: 'chat' },
    { icon: 'people', label: 'Share to Squad', sub: 'Post in your squad chat', kind: 'squad' },
    { icon: 'game-controller', label: 'Share to Lobby', sub: 'Send to an active match lobby', kind: 'lobby' },
    { icon: 'share-social', label: 'External Share', sub: 'Other apps', kind: 'external' },
  ];
  return (
    <Pressable style={S.sheetOverlay} onPress={app.closeShare}>
      <Pressable style={S.sheet} onPress={() => {}}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>Share</Text>
        <Text style={S.sheetSub} numberOfLines={1}>{s.title}</Text>
        <View style={{ height: 10 }} />
        {opts.map(o => (
          <Pressable key={o.kind} style={S.shareRow} onPress={() => app.sharePost(o.kind)}>
            <View style={S.shareIcon}><Ionicons name={o.icon} size={18} color={C.blue} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Text style={S.listTitle}>{o.label}</Text><Text style={S.listSub}>{o.sub}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={C.mutedLight} />
          </Pressable>
        ))}
        <View style={{ height: 8 }} />
      </Pressable>
    </Pressable>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
const ADMIN_WIDE = Platform.OS === 'web' && W >= 900;
const ADMIN_ROLES = {
  'Super Admin': '*',
  'Operations Admin': ['Dashboard', 'Users', 'Squads', 'Venues', 'Bookings', 'Events', 'Registrations', 'Matchmaking', 'Lobbies', 'Reports', 'Analytics', 'Activity Logs'],
  'Venue Manager': ['Dashboard', 'Venues', 'Bookings', 'Analytics'],
  'Event Organizer': ['Dashboard', 'Events', 'Registrations', 'Announcements', 'Analytics'],
  'Finance Admin': ['Dashboard', 'Payments', 'Memberships', 'Analytics', 'Activity Logs'],
  'Moderator': ['Dashboard', 'Posts', 'Comments', 'Reports', 'Users', 'Activity Logs'],
  'Support Staff': ['Dashboard', 'Support', 'Reports'],
};
const ADMIN_SECTIONS = [
  { key: 'Dashboard', icon: 'grid' }, { key: 'Users', icon: 'people' }, { key: 'Squads', icon: 'shield' },
  { key: 'Venues', icon: 'business' }, { key: 'Bookings', icon: 'calendar' }, { key: 'Events', icon: 'trophy' },
  { key: 'Registrations', icon: 'clipboard' }, { key: 'Matchmaking', icon: 'flash' }, { key: 'Lobbies', icon: 'game-controller' },
  { key: 'Posts', icon: 'newspaper' }, { key: 'Comments', icon: 'chatbubbles' }, { key: 'Payments', icon: 'card' },
  { key: 'Memberships', icon: 'ribbon' }, { key: 'Reports', icon: 'flag' }, { key: 'Support', icon: 'help-buoy' },
  { key: 'Announcements', icon: 'megaphone' }, { key: 'Analytics', icon: 'bar-chart' }, { key: 'Settings', icon: 'settings' },
  { key: 'Activity Logs', icon: 'time' },
];
const adminCan = (role, section) => ADMIN_ROLES[role] === '*' || (ADMIN_ROLES[role] || []).includes(section);
const ROLE_LIST = Object.keys(ADMIN_ROLES);
// Backend roles that grant admin-dashboard access (mirrors server middleware ADMIN_ROLES).
const BACKEND_ADMIN_ROLES = ['Admin', 'Super Admin', 'Operations Admin', 'Venue Manager', 'Event Organizer', 'Finance Admin', 'Moderator', 'Support Staff'];
const isAdminRole = (role) => BACKEND_ADMIN_ROLES.includes(role);
// Map a signed-in account's backend role onto a dashboard role that drives section access.
const adminRoleForUser = (role) => (ADMIN_ROLES[role] ? role : 'Super Admin');

// Real admin sign-in — authenticates against /api/auth/login and enters the dashboard
// only if the account carries an admin role (RBAC enforced again on every admin route).
function AdminLoginScreen({ app }) {
  const [email, setEmail] = useState('admin@thanggo.bt');
  const [pw, setPw] = useState('admin123');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const signIn = async (e, p) => {
    const useEmail = e != null ? e : email;
    const usePw = p != null ? p : pw;
    if (e != null) { setEmail(e); setPw(p); }
    if (!useEmail || !usePw) { setErr('Enter your admin email and password'); return; }
    setErr(null); setBusy(true);
    try {
      const r = await api.login(useEmail, usePw);
      applyBackendUser(r.user);
      if (!isAdminRole(r.user.role)) { setErr('This account does not have admin access.'); setBusy(false); return; }
      try { connectSocket(); } catch { /* ignore */ }
      app.enterAdmin(adminRoleForUser(r.user.role));
    } catch (ex) { setErr(ex.message || 'Sign-in failed'); setBusy(false); }
  };
  return (
    <View style={S.adminLogin}>
      <StatusBar style="light" />
      <SafeAreaView style={S.adminLoginInner}>
        <Pressable style={S.adminLoginBack} onPress={app.back}><Ionicons name="chevron-back" size={22} color={C.white} /></Pressable>
        <View style={S.adminLogo}><Ionicons name="shield-checkmark" size={34} color={C.navy} /></View>
        <Text style={S.adminLoginTitle}>ThangGo Admin</Text>
        <Text style={S.adminLoginSub}>Platform control center · secure sign-in</Text>
        <View style={S.adminLoginCard}>
          <Text style={S.inputLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={S.input} placeholderTextColor={C.mutedLight} />
          <Text style={S.inputLabel}>Password</Text>
          <TextInput value={pw} onChangeText={setPw} secureTextEntry style={S.input} placeholderTextColor={C.mutedLight} />
          {err ? <Text style={[authS.err, { color: '#E5484D', marginTop: 8 }]}>{err}</Text> : null}
          <View style={{ height: 14 }} />
          <AppButton title={busy ? 'Authenticating…' : 'Enter Dashboard'} icon={busy ? undefined : 'log-in'} loading={busy} fill onPress={() => signIn()} />
          <Text style={[S.inputLabel, { marginTop: 16 }]}>Quick login (demo)</Text>
          <View style={[S.chipWrap, { gap: 10 }]}>
            <Pressable disabled={busy} style={qkS.adminBtn} onPress={() => signIn('admin@thanggo.bt', 'admin123')}>
              <Ionicons name="flash" size={15} color={C.navy} /><Text style={qkS.adminBtnT}>Super Admin</Text>
            </Pressable>
            <Pressable disabled={busy} style={qkS.adminBtn} onPress={() => signIn('finance@thanggo.bt', 'admin123')}>
              <Ionicons name="cash" size={15} color={C.navy} /><Text style={qkS.adminBtnT}>Finance Admin</Text>
            </Pressable>
          </View>
        </View>
        <Text style={S.adminLoginFine}>Role-based access · all actions are logged</Text>
      </SafeAreaView>
    </View>
  );
}
const qkS = StyleSheet.create({
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.white, borderRadius: 11, paddingVertical: 11, paddingHorizontal: 14 },
  adminBtnT: { color: C.navy, fontWeight: '800', fontSize: 13.5 },
});

// ─── Admin reusable atoms ─────────────────────────────────────────────────────
function AStat({ label, value, icon, tone, onPress }) {
  return (
    <Pressable style={S.aStat} onPress={onPress} disabled={!onPress}>
      <View style={[S.aStatIcon, { backgroundColor: tone || C.blue }]}><Ionicons name={icon} size={16} color={C.white} /></View>
      <Text style={S.aStatValue} numberOfLines={1}>{value}</Text>
      <Text style={S.aStatLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}
function ABars({ title, data, color }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View style={S.aChart}>
      <Text style={S.aChartTitle}>{title}</Text>
      <View style={S.aChartBars}>
        {data.map((d, i) => (
          <View key={i} style={S.aBarCol}>
            <View style={S.aBarTrack}><View style={[S.aBarFill, { height: `${Math.round((d.value / max) * 100)}%`, backgroundColor: color || C.blue }]} /></View>
            <Text style={S.aBarLabel} numberOfLines={1}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
function ADonutRow({ items }) {
  const total = Math.max(1, items.reduce((s, x) => s + x.value, 0));
  return (
    <View style={S.aChart}>
      <Text style={S.aChartTitle}>Payment status</Text>
      <View style={S.aStackBar}>{items.map((it, i) => <View key={i} style={{ flex: it.value || 0.001, backgroundColor: it.color, height: 16 }} />)}</View>
      <View style={[S.rowCenter, { flexWrap: 'wrap', gap: 10, marginTop: 10 }]}>
        {items.map((it, i) => <View key={i} style={S.rowCenter}><View style={[S.legendDot, { backgroundColor: it.color }]} /><Text style={S.aLegend}>{it.label} {it.value}</Text></View>)}
      </View>
    </View>
  );
}

// ─── Generic admin list (search + filter + rows + action sheet + confirm + drawer)
function AdminList({ title, subtitle, items, getText, statusOf, statuses, renderRow, actionsFor, detailFor, onAdd, addLabel }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [menuItem, setMenuItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  let rows = items;
  if (q) rows = rows.filter(it => (getText(it) || '').toLowerCase().includes(q.toLowerCase()));
  if (statuses && f !== 'All') rows = rows.filter(it => statusOf(it) === f);
  return (
    <View>
      <View style={S.aSecHead}>
        <View style={{ flex: 1 }}>
          <Text style={S.aSecTitle}>{title}</Text>
          {subtitle ? <Text style={S.aSecSub}>{subtitle}</Text> : null}
        </View>
        {onAdd ? <AppButton title={addLabel || 'Add'} icon="add" small onPress={onAdd} /> : null}
      </View>
      <View style={S.aSearch}><Ionicons name="search" size={16} color={C.muted} /><TextInput value={q} onChangeText={setQ} placeholder={`Search ${title.toLowerCase()}…`} placeholderTextColor={C.mutedLight} style={S.aSearchInput} />{q ? <Pressable onPress={() => setQ('')}><Ionicons name="close-circle" size={16} color={C.mutedLight} /></Pressable> : null}</View>
      {statuses ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingBottom: 8 }}>
          {['All', ...statuses].map(s => <Chip key={s} label={s} active={f === s} onPress={() => setF(s)} />)}
        </ScrollView>
      ) : null}
      <Text style={S.aCount}>{rows.length} result{rows.length === 1 ? '' : 's'}</Text>
      {rows.length ? rows.map((it, i) => (
        <Pressable key={i} style={S.aRow} onPress={() => detailFor && setDetail(it)}>
          <View style={{ flex: 1 }}>{renderRow(it)}</View>
          {actionsFor ? <Pressable hitSlop={10} style={S.aRowMenu} onPress={() => setMenuItem(it)}><Ionicons name="ellipsis-vertical" size={18} color={C.muted} /></Pressable> : null}
        </Pressable>
      )) : <EmptyState icon="file-tray-outline" title="Nothing here" text="No records match your search or filter." />}

      {menuItem ? (
        <Pressable style={S.sheetOverlay} onPress={() => setMenuItem(null)}>
          <Pressable style={S.sheet} onPress={() => {}}>
            <View style={S.sheetHandle} />
            <Text style={S.sheetTitle}>Actions</Text>
            <View style={{ height: 6 }} />
            {actionsFor(menuItem).map((a, i) => (
              <Pressable key={i} style={S.aAction} onPress={() => { const item = menuItem; setMenuItem(null); if (a.danger) setConfirm({ a, item }); else a.run(item); }}>
                <Ionicons name={a.icon || 'ellipse'} size={18} color={a.danger ? C.danger : C.blue} />
                <Text style={[S.aActionText, a.danger && { color: C.danger }]}>{a.label}</Text>
              </Pressable>
            ))}
            <View style={{ height: 8 }} />
          </Pressable>
        </Pressable>
      ) : null}

      {detail && detailFor ? (
        <Pressable style={S.sheetOverlay} onPress={() => setDetail(null)}>
          <Pressable style={[S.sheet, { maxHeight: '88%' }]} onPress={() => {}}>
            <View style={S.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>{detailFor(detail, () => setDetail(null))}</ScrollView>
          </Pressable>
        </Pressable>
      ) : null}

      {confirm ? (
        <Pressable style={S.sheetOverlay} onPress={() => setConfirm(null)}>
          <Pressable style={S.sheet} onPress={() => {}}>
            <View style={S.sheetHandle} />
            <View style={S.rowCenter}><View style={S.warnIcon}><Ionicons name="warning" size={20} color={C.danger} /></View><View style={{ flex: 1, marginLeft: 12 }}><Text style={S.sheetTitle}>{confirm.a.label}?</Text><Text style={S.sheetSub}>This action is logged. Confirm to proceed.</Text></View></View>
            <View style={{ height: 14 }} />
            <AppButton title={'Yes, ' + confirm.a.label.toLowerCase()} variant="danger" fill onPress={() => { confirm.a.run(confirm.item); setConfirm(null); }} />
            <View style={{ height: 8 }} />
            <AppButton title="Cancel" variant="secondary" fill onPress={() => setConfirm(null)} />
            <View style={{ height: 8 }} />
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}
const ARowMain = ({ label, sub, badge, badgeTone, img, icon, iconBg }) => (
  <View style={S.rowCenter}>
    {img ? <Image source={{ uri: img }} style={S.aThumb} /> : <View style={[S.aThumb, S.miniPostNoImg, iconBg && { backgroundColor: iconBg }]}><Ionicons name={icon || 'cube'} size={18} color={iconBg ? C.white : C.blue} /></View>}
    <View style={{ flex: 1, marginLeft: 10 }}>
      <Text style={S.aRowTitle} numberOfLines={1}>{label}</Text>
      <Text style={S.aRowSub} numberOfLines={1}>{sub}</Text>
    </View>
    {badge ? <Badge label={badge} tone={badgeTone || 'navy'} dot /> : null}
  </View>
);
const ADetailField = ({ k, v }) => <View style={S.summaryRow}><Text style={S.summaryK}>{k}</Text><Text style={S.summaryV} numberOfLines={2}>{v}</Text></View>;

// ─── Admin shell (sidebar + topbar + content) ─────────────────────────────────
function AdminShell({ app }) {
  const [drawer, setDrawer] = useState(false);
  const role = app.adminRole;
  const sections = ADMIN_SECTIONS.filter(s => adminCan(role, s.key));
  const openReports = app.reports.filter(r => r.status === 'Open').length;
  const Sidebar = (
    <View style={[S.aSidebar, !ADMIN_WIDE && S.aSidebarDrawer]}>
      <View style={S.aBrand}><View style={S.aBrandLogo}><Ionicons name="shield-checkmark" size={18} color={C.navy} /></View><Text style={S.aBrandText}>ThangGo Admin</Text></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {sections.map(s => {
          const on = app.adminSection === s.key;
          return (
            <Pressable key={s.key} style={[S.aNavItem, on && S.aNavItemOn]} onPress={() => { app.adminGo(s.key); setDrawer(false); }}>
              <Ionicons name={s.icon + (on ? '' : '-outline')} size={18} color={on ? C.white : C.mutedLight} />
              <Text style={[S.aNavText, on && { color: C.white }]}>{s.key}</Text>
            </Pressable>
          );
        })}
        <View style={{ height: 12 }} />
        <Pressable style={S.aNavItem} onPress={app.exitAdmin}><Ionicons name="exit-outline" size={18} color={C.lime} /><Text style={[S.aNavText, { color: C.lime }]}>Exit to app</Text></Pressable>
      </ScrollView>
    </View>
  );
  return (
    <View style={S.adminRoot}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, flexDirection: ADMIN_WIDE ? 'row' : 'column' }}>
        {ADMIN_WIDE ? Sidebar : null}
        <View style={{ flex: 1 }}>
          <View style={S.aTopbar}>
            {!ADMIN_WIDE ? <Pressable style={S.aHamb} onPress={() => setDrawer(true)} hitSlop={8}><Ionicons name="menu" size={22} color={C.navy} /></Pressable> : null}
            <Text style={S.aTopTitle} numberOfLines={1}>{app.adminSection}</Text>
            <View style={{ flex: 1 }} />
            {ADMIN_WIDE ? <Badge label={role} tone="blue" /> : null}
            <Pressable style={S.aTopBtn} onPress={() => app.adminGo('Reports')} hitSlop={6}>
              <Ionicons name="notifications-outline" size={20} color={C.navy} />
              {openReports ? <View style={S.bellBadge}><Text style={S.bellBadgeText}>{openReports}</Text></View> : null}
            </Pressable>
            <Pressable style={{ marginLeft: 10 }} onPress={app.exitAdmin}><Avatar label="Admin" size={34} accent /></Pressable>
          </View>
          <ScrollView contentContainerStyle={S.aContent} showsVerticalScrollIndicator={false} key={app.adminSection}>
            <AdminSection app={app} />
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
      {!ADMIN_WIDE && drawer ? (
        <Pressable style={S.aDrawerOverlay} onPress={() => setDrawer(false)}>
          <Pressable onPress={() => {}} style={{ flex: 1 }}>{Sidebar}</Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}

function AdminSection({ app }) {
  switch (app.adminSection) {
    case 'Dashboard': return <AdminDashboard app={app} />;
    case 'Users': return <AdminUsers app={app} />;
    case 'Squads': return <AdminSquads app={app} />;
    case 'Venues': return <AdminVenues app={app} />;
    case 'Bookings': return <AdminBookings app={app} />;
    case 'Events': return <AdminEvents app={app} />;
    case 'Registrations': return <AdminRegistrations app={app} />;
    case 'Matchmaking': return <AdminMatchmaking app={app} />;
    case 'Lobbies': return <AdminLobbies app={app} />;
    case 'Posts': return <AdminPosts app={app} />;
    case 'Comments': return <AdminComments app={app} />;
    case 'Payments': return <AdminPayments app={app} />;
    case 'Memberships': return <AdminMemberships app={app} />;
    case 'Reports': return <AdminReports app={app} />;
    case 'Support': return <AdminSupport app={app} />;
    case 'Announcements': return <AdminAnnouncements app={app} />;
    case 'Analytics': return <AdminAnalytics app={app} />;
    case 'Settings': return <AdminSettings app={app} />;
    case 'Activity Logs': return <AdminLogs app={app} />;
    default: return <AdminDashboard app={app} />;
  }
}

function AdminDashboard({ app }) {
  const role = app.adminRole;
  const revenue = app.payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0) + app.bookings.filter(b => b.paymentStatus === 'Paid').reduce((s, b) => s + (b.price || 0), 0);
  const pendingPay = app.payments.filter(p => ['Pending', 'Partially Paid', 'Not Started'].includes(p.status)).length + app.bookings.filter(b => b.paymentStatus === 'Pending').length;
  const stats = [
    { l: 'Total Users', v: users.length, i: 'people', t: C.blue, go: 'Users' },
    { l: 'Active Users', v: users.filter(u => app.userStatusOf(u.id) === 'Active').length, i: 'pulse', t: C.green, go: 'Users' },
    { l: 'Total Squads', v: app.squads.length, i: 'shield', t: C.navy, go: 'Squads' },
    { l: 'Total Venues', v: venues.length, i: 'business', t: C.blue, go: 'Venues' },
    { l: 'Total Bookings', v: app.bookings.length, i: 'calendar', t: C.green, go: 'Bookings' },
    { l: "Today's Bookings", v: app.bookings.filter(b => b.date === 'Today').length, i: 'today', t: C.blue, go: 'Bookings' },
    { l: 'Pending Bookings', v: app.bookings.filter(b => b.status === 'Pending').length, i: 'hourglass', t: C.warning, go: 'Bookings' },
    { l: 'Total Events', v: app.events.length, i: 'trophy', t: C.warning, go: 'Events' },
    { l: 'Total Revenue', v: money(revenue), i: 'cash', t: C.green, go: 'Payments' },
    { l: 'Pending Payments', v: pendingPay, i: 'card', t: C.danger, go: 'Payments' },
    { l: 'Reported Posts', v: app.reports.filter(r => r.type === 'Post Report').length, i: 'flag', t: C.danger, go: 'Reports' },
    { l: 'Open Tickets', v: app.tickets.filter(t => t.status === 'Open').length, i: 'help-buoy', t: C.warning, go: 'Support' },
    { l: 'Venue Applications', v: app.venueApplications.filter(v => v.status === 'Pending').length, i: 'add-circle', t: C.blue, go: 'Venues' },
    { l: 'Membership Apps', v: app.memberships.filter(m => m.status === 'Pending').length, i: 'ribbon', t: C.blue, go: 'Memberships' },
  ];
  const sportCounts = {}; app.bookings.forEach(b => { if (b.sport) sportCounts[b.sport] = (sportCounts[b.sport] || 0) + 1; });
  const sportData = Object.keys(sportCounts).length ? Object.entries(sportCounts).map(([k, v]) => ({ label: k.slice(0, 4), value: v })) : [{ label: 'Fut', value: 5 }, { label: 'BBl', value: 3 }, { label: 'Bad', value: 4 }, { label: 'Cri', value: 2 }, { label: 'Vol', value: 3 }];
  const quick = [
    { l: 'Add Venue', i: 'business', go: 'Venues' }, { l: 'Create Event', i: 'trophy', go: 'Events' }, { l: 'Approve Venue', i: 'checkmark-circle', go: 'Venues' }, { l: 'Review Reports', i: 'flag', go: 'Reports' },
    { l: 'Manage Bookings', i: 'calendar', go: 'Bookings' }, { l: 'Send Announcement', i: 'megaphone', go: 'Announcements' }, { l: 'View Payments', i: 'card', go: 'Payments' }, { l: 'Support Tickets', i: 'help-buoy', go: 'Support' },
  ].filter(q => adminCan(role, q.go));
  return (
    <View>
      <Text style={S.aSecTitle}>Overview</Text>
      <Text style={S.aSecSub}>Live snapshot · signed in as {role}</Text>
      <View style={S.aStatGrid}>{stats.map(s => <AStat key={s.l} label={s.l} value={s.v} icon={s.i} tone={s.t} onPress={adminCan(role, s.go) ? () => app.adminGo(s.go) : undefined} />)}</View>
      <View style={S.aChartRow}>
        <ABars title="Daily bookings" data={[{ label: 'Mon', value: 4 }, { label: 'Tue', value: 7 }, { label: 'Wed', value: 5 }, { label: 'Thu', value: 9 }, { label: 'Fri', value: 12 }, { label: 'Sat', value: 15 }, { label: 'Sun', value: 8 }]} color={C.blue} />
        <ABars title="Revenue (Nu.k)" data={[{ label: 'Mon', value: 6 }, { label: 'Tue', value: 9 }, { label: 'Wed', value: 7 }, { label: 'Thu', value: 11 }, { label: 'Fri', value: 14 }, { label: 'Sat', value: 18 }, { label: 'Sun', value: 10 }]} color={C.green} />
      </View>
      <View style={S.aChartRow}>
        <ABars title="Most booked sports" data={sportData} color={C.warning} />
        <ABars title="User growth" data={[{ label: 'Jan', value: 3 }, { label: 'Feb', value: 5 }, { label: 'Mar', value: 6 }, { label: 'Apr', value: 8 }, { label: 'May', value: 10 }, { label: 'Jun', value: 12 }]} color={C.navy} />
      </View>
      <ADonutRow items={[{ label: 'Paid', value: app.payments.filter(p => p.status === 'Paid').length + 5, color: C.green }, { label: 'Pending', value: 3, color: C.warning }, { label: 'Refunded', value: app.payments.filter(p => p.status === 'Refunded').length, color: C.blue }, { label: 'Failed', value: 1, color: C.danger }]} />
      <Text style={S.aSecTitle2}>Quick actions</Text>
      <View style={S.aQuickGrid}>{quick.map(q => <Pressable key={q.l} style={S.aQuick} onPress={() => app.adminGo(q.go)}><View style={S.aQuickIcon}><Ionicons name={q.i} size={18} color={C.blue} /></View><Text style={S.aQuickText}>{q.l}</Text></Pressable>)}</View>
    </View>
  );
}

function AdminUsers({ app }) {
  return <AdminList title="Users" subtitle={users.length + ' registered'} items={users}
    getText={u => u.name + ' ' + u.username} statusOf={u => app.userStatusOf(u.id)} statuses={['Active', 'Suspended', 'Banned']}
    renderRow={u => <ARowMain icon="person" label={u.name + (app.userVerified(u.id) ? '  ✔︎' : '')} sub={'@' + u.username + ' · ' + u.mainSport + ' · ' + u.location} badge={app.userStatusOf(u.id)} badgeTone={statusTone(app.userStatusOf(u.id))} />}
    actionsFor={u => [
      { label: 'View Profile', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('userProfile', { id: it.id }); } },
      { label: 'Verify / Unverify', icon: 'checkmark-circle', run: it => app.verifyUser(it.id) },
      { label: 'Reactivate', icon: 'play-circle', run: it => app.setUserStatus(it.id, 'Active') },
      { label: 'Send Notification', icon: 'notifications', run: it => app.toast('Notification sent to ' + it.name, 'success') },
      { label: 'Suspend User', icon: 'pause-circle', danger: true, run: it => app.setUserStatus(it.id, 'Suspended') },
      { label: 'Ban User', icon: 'ban', danger: true, run: it => app.setUserStatus(it.id, 'Banned') },
    ]}
    detailFor={(u, close) => (
      <View>
        <View style={S.rowCenter}><Avatar label={u.name} size={56} /><View style={{ marginLeft: 12, flex: 1 }}><Text style={S.sheetTitle}>{u.name}{app.userVerified(u.id) ? '  ✔︎' : ''}</Text><Text style={S.sheetSub}>@{u.username} · {app.userStatusOf(u.id)}</Text></View></View>
        <View style={{ height: 10 }} />
        <ADetailField k="Sport" v={u.mainSport + ' · ' + u.skillLevel} />
        <ADetailField k="Location" v={u.location} />
        <ADetailField k="Rating" v={'⭐ ' + u.rating} />
        <ADetailField k="Followers" v={app.followerCount('user', u.id, u.followers || 0)} />
        <ADetailField k="Squads" v={app.squads.filter(s => s.members.some(m => m.userId === u.id)).length} />
        <ADetailField k="Posts" v={app.posts.filter(p => p.createdBy === u.id).length} />
        <ADetailField k="Verified" v={app.userVerified(u.id) ? 'Yes' : 'No'} />
        <View style={{ height: 12 }} />
        <AppButton title="Open full profile" icon="open-outline" fill onPress={() => { close(); app.exitAdmin(); app.go('userProfile', { id: u.id }); }} />
      </View>
    )} />;
}

function AdminSquads({ app }) {
  return <AdminList title="Squads" subtitle={app.squads.length + ' squads'} items={app.squads}
    getText={s => s.name + ' ' + s.sport} statusOf={s => app.squadStatusOf(s.id)} statuses={['Active', 'Verified', 'Suspended']}
    renderRow={s => <ARowMain icon="shield" iconBg={C.green} label={s.name} sub={s.sport + ' · ' + s.location + ' · ' + s.members.length + ' players · ' + s.wins + 'W ' + s.losses + 'L'} badge={app.squadStatusOf(s.id)} badgeTone={statusTone(app.squadStatusOf(s.id))} />}
    actionsFor={s => [
      { label: 'View Squad', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('squadDetail', { id: it.id }); } },
      { label: 'Verify', icon: 'shield-checkmark', run: it => app.setSquadStatus(it.id, 'Verified') },
      { label: 'Reactivate', icon: 'play-circle', run: it => app.setSquadStatus(it.id, 'Active') },
      { label: 'Suspend Squad', icon: 'pause-circle', danger: true, run: it => app.setSquadStatus(it.id, 'Suspended') },
    ]}
    detailFor={(s, close) => (
      <View>
        <View style={S.rowCenter}><Avatar label={s.name} size={56} ring="green" /><View style={{ marginLeft: 12, flex: 1 }}><Text style={S.sheetTitle}>{s.name}</Text><Text style={S.sheetSub}>@{s.handle} · {app.squadStatusOf(s.id)}</Text></View></View>
        <ADetailField k="Sport" v={s.sport + ' · ' + s.skillLevel} />
        <ADetailField k="Captain" v={getUser(s.captainId).name} />
        <ADetailField k="Members" v={s.members.length} />
        <ADetailField k="Record" v={s.wins + 'W ' + s.losses + 'L ' + s.draws + 'D'} />
        <ADetailField k="Rating" v={'⭐ ' + s.rating} />
        <View style={{ height: 12 }} />
        <AppButton title="Open squad page" icon="open-outline" fill onPress={() => { close(); app.exitAdmin(); app.go('squadDetail', { id: s.id }); }} />
      </View>
    )} />;
}

function AdminVenues({ app }) {
  const apps = app.venueApplications.filter(v => v.status === 'Pending');
  return (
    <View>
      {apps.length ? (
        <View style={S.aPanel}>
          <Text style={S.aPanelTitle}>New venue applications ({apps.length})</Text>
          {apps.map(a => (
            <View key={a.id} style={S.aAppRow}>
              <View style={{ flex: 1 }}><Text style={S.aRowTitle}>{a.name}</Text><Text style={S.aRowSub}>{a.venueType} · {a.area} · {a.owner}</Text></View>
              <AppButton title="Approve" variant="green" small icon="checkmark" onPress={() => app.approveVenueApp(a.id, true)} />
              <View style={{ width: 6 }} />
              <AppButton title="Reject" variant="danger" small icon="close" onPress={() => app.approveVenueApp(a.id, false)} />
            </View>
          ))}
        </View>
      ) : null}
      <AdminList title="Venues" subtitle={venues.length + ' active venues'} items={venues} addLabel="Add Venue" onAdd={() => app.toast('New venue form (placeholder)', 'info')}
        getText={v => v.name + ' ' + v.location + ' ' + v.venueType} statusOf={v => app.venueStatusOf(v.id)} statuses={['Approved', 'Pending', 'Suspended', 'Rejected']}
        renderRow={v => <ARowMain img={v.image} label={v.name} sub={v.venueType + ' · ' + v.location + ' · ' + money(v.pricePerHour) + '/' + v.priceUnit} badge={app.venueStatusOf(v.id)} badgeTone={statusTone(app.venueStatusOf(v.id))} />}
        actionsFor={v => [
          { label: 'View / Book', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('venueDetail', { id: it.id }); } },
          { label: 'Approve / Verify', icon: 'shield-checkmark', run: it => app.setVenueStatus(it.id, 'Approved') },
          { label: 'Manage Gallery', icon: 'images', run: it => app.toast(it.images.length + ' images · gallery manager (placeholder)', 'info') },
          { label: 'Generate Time Slots', icon: 'time', run: it => app.toast('6 AM–midnight slots generated for ' + it.name, 'success') },
          { label: 'Manage Prices', icon: 'pricetag', run: it => app.toast('Pricing editor (placeholder)', 'info') },
          { label: 'Suspend Venue', icon: 'pause-circle', danger: true, run: it => app.setVenueStatus(it.id, 'Suspended') },
          { label: 'Delete Venue', icon: 'trash', danger: true, run: it => app.setVenueStatus(it.id, 'Rejected') },
        ]}
        detailFor={(v, close) => (
          <View>
            <Image source={{ uri: v.image }} style={S.aDetailImg} />
            <Text style={[S.sheetTitle, { marginTop: 10 }]}>{v.name}</Text>
            <Text style={S.sheetSub}>{v.location} · {app.venueStatusOf(v.id)}</Text>
            <ADetailField k="Type" v={v.venueType + ' · ' + v.indoor} />
            <ADetailField k="Sports" v={v.sports.join(', ')} />
            <ADetailField k="Hours" v={v.hours} />
            <ADetailField k="Price" v={money(v.pricePerHour) + '/' + v.priceUnit} />
            <ADetailField k="Rating" v={'⭐ ' + v.rating + ' (' + v.reviews + ' reviews)'} />
            <ADetailField k="Bookings" v={app.bookings.filter(b => b.venueId === v.id).length} />
            <ADetailField k="Manager" v={getUser(v.managerId).name} />
            <View style={{ height: 12 }} />
            <View style={S.rowGap}><AppButton title="Approve" variant="green" small fill icon="checkmark" onPress={() => app.setVenueStatus(v.id, 'Approved')} /><AppButton title="Suspend" variant="danger" small fill icon="pause" onPress={() => app.setVenueStatus(v.id, 'Suspended')} /></View>
            <View style={{ height: 8 }} />
            <AppButton title="Open venue page" variant="secondary" icon="open-outline" fill onPress={() => { close(); app.exitAdmin(); app.go('venueDetail', { id: v.id }); }} />
          </View>
        )} />
    </View>
  );
}

function AdminBookings({ app }) {
  return <AdminList title="Bookings" subtitle={app.bookings.length + ' bookings'} items={app.bookings}
    getText={b => getVenue(b.venueId).name + ' ' + b.bookingType} statusOf={b => b.status} statuses={['Pending', 'Confirmed', 'Completed', 'Cancelled']}
    renderRow={b => <ARowMain img={getVenue(b.venueId).image} label={getVenue(b.venueId).name} sub={b.bookingType + ' · ' + b.date + (b.slot ? ' · ' + b.slot : '') + ' · ' + money(b.price || 0)} badge={b.status} badgeTone={statusTone(b.status)} />}
    actionsFor={b => [
      { label: 'Mark Completed', icon: 'checkmark-done', run: it => app.adminCompleteBooking(it.id) },
      { label: 'Mark Paid', icon: 'card', run: it => app.payBooking(it.id) },
      { label: 'Contact User', icon: 'chatbubble', run: () => app.toast('Message sent to user', 'success') },
      { label: 'Cancel Booking', icon: 'close-circle', danger: true, run: it => app.adminCancelBooking(it.id) },
      { label: 'Refund Booking', icon: 'return-down-back', danger: true, run: it => { app.adminCancelBooking(it.id); app.toast('Booking refunded 💸', 'success'); } },
    ]}
    detailFor={(b) => (
      <View>
        <Text style={S.sheetTitle}>Booking #{b.id.toUpperCase()}</Text>
        <Text style={S.sheetSub}>{b.status} · {b.paymentStatus}</Text>
        <ADetailField k="Venue" v={getVenue(b.venueId).name} />
        <ADetailField k="Activity" v={(b.sport || b.className || b.trainer || '—')} />
        <ADetailField k="Type" v={b.bookingType} />
        <ADetailField k="Date / slot" v={b.date + (b.slot ? ' · ' + slotLabel(b.slot) : '')} />
        <ADetailField k="Participants" v={b.participants} />
        <ADetailField k="Split" v={b.split || '—'} />
        <ADetailField k="Total" v={money(b.price || 0)} />
        <ADetailField k="Linked lobby" v={b.lobbyId || 'none'} />
        <View style={{ height: 12 }} />
        <View style={S.rowGap}><AppButton title="Mark Paid" variant="green" small fill icon="card" onPress={() => app.payBooking(b.id)} /><AppButton title="Cancel" variant="danger" small fill icon="close" onPress={() => app.adminCancelBooking(b.id)} /></View>
      </View>
    )} />;
}

function AdminEvents({ app }) {
  return <AdminList title="Events" subtitle={app.events.length + ' events'} items={app.events} addLabel="Create Event" onAdd={() => app.toast('Event builder (placeholder)', 'info')}
    getText={e => e.title + ' ' + e.sport} statusOf={e => e.status} statuses={['Registration Open', 'Upcoming', 'Completed']}
    renderRow={e => <ARowMain img={e.image} label={e.title} sub={e.sport + ' · ' + e.location + ' · ' + e.date} badge={e.status} badgeTone={statusTone(e.status)} />}
    actionsFor={e => [
      { label: 'View Event', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('eventDetail', { id: it.id }); } },
      { label: 'Manage Registrations', icon: 'clipboard', run: () => app.adminGo('Registrations') },
      { label: 'Generate Fixtures', icon: 'git-network', run: () => app.toast('Fixtures generated (placeholder)', 'success') },
      { label: 'Post Announcement', icon: 'megaphone', run: () => app.adminGo('Announcements') },
      { label: 'Cancel Event', icon: 'close-circle', danger: true, run: it => { app.logAction('Cancelled event', it.title); app.toast(it.title + ' cancelled', 'error'); } },
    ]}
    detailFor={(e, close) => (
      <View>
        <Image source={{ uri: e.image }} style={S.aDetailImg} />
        <Text style={[S.sheetTitle, { marginTop: 10 }]}>{e.title}</Text>
        <Text style={S.sheetSub}>{e.status}</Text>
        <ADetailField k="Sport" v={e.sport} />
        <ADetailField k="Venue" v={e.location} />
        <ADetailField k="When" v={e.date} />
        <ADetailField k="Entry fee" v={e.fee} />
        <ADetailField k="Slots" v={e.slots} />
        <ADetailField k="Prize" v={e.prize} />
        <View style={{ height: 12 }} />
        <AppButton title="Open event page" icon="open-outline" fill onPress={() => { close(); app.exitAdmin(); app.go('eventDetail', { id: e.id }); }} />
      </View>
    )} />;
}

function AdminRegistrations({ app }) {
  const regs = app.squads.slice(0, 6).map((s, i) => ({ id: 'reg-' + i, event: app.events[i % app.events.length].title, squad: s, status: ['Confirmed', 'Pending', 'Submitted', 'Waitlisted', 'Payment Pending', 'Checked In'][i % 6] }));
  return <AdminList title="Registrations" subtitle="Event squad & player registrations" items={regs}
    getText={r => r.squad.name + ' ' + r.event} statusOf={r => r.status} statuses={['Pending', 'Submitted', 'Confirmed', 'Waitlisted', 'Payment Pending', 'Checked In']}
    renderRow={r => <ARowMain icon="clipboard" iconBg={C.warning} label={r.squad.name} sub={r.event + ' · ' + r.squad.members.length + ' players'} badge={r.status} badgeTone={statusTone(r.status === 'Confirmed' || r.status === 'Checked In' ? 'Paid' : 'Pending')} />}
    actionsFor={r => [
      { label: 'Approve', icon: 'checkmark-circle', run: () => app.toast(r.squad.name + ' registration approved', 'success') },
      { label: 'Confirm Payment', icon: 'card', run: () => app.toast('Payment confirmed', 'success') },
      { label: 'Move to Waitlist', icon: 'list', run: () => app.toast('Moved to waitlist', 'info') },
      { label: 'Check In', icon: 'qr-code', run: () => app.toast(r.squad.name + ' checked in', 'success') },
      { label: 'View Squad', icon: 'open-outline', run: () => { app.exitAdmin(); app.go('squadDetail', { id: r.squad.id }); } },
      { label: 'Reject', icon: 'close-circle', danger: true, run: () => app.toast('Registration rejected', 'error') },
    ]} />;
}

function AdminMatchmaking({ app }) {
  const posts = app.posts.filter(p => p.postType === 'Match Challenge');
  return <AdminList title="Matchmaking" subtitle="Public match challenge posts" items={posts}
    getText={p => getSquad(app.squads, p.createdBy).name + ' ' + p.sport} statusOf={p => p.status || 'Open'} statuses={['Looking for Opponent', 'Opponent Accepted']}
    renderRow={p => <ARowMain icon="flash" iconBg={C.danger} label={p.title || getSquad(app.squads, p.createdBy).name} sub={p.sport + ' · ' + (p.venueName || 'No venue') + ' · ' + (p.requests || []).length + ' requests'} badge={p.status} badgeTone={statusTone(p.status)} />}
    actionsFor={p => [
      { label: 'View Post', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('postDetail', { id: it.id }); } },
      { label: 'Feature Post', icon: 'star', run: () => app.toast('Post featured', 'success') },
      { label: 'View Requests', icon: 'people', run: it => { app.exitAdmin(); app.go('postDetail', { id: it.id, focus: 'interested' }); } },
      { label: 'Remove Post', icon: 'trash', danger: true, run: it => app.adminRemovePost(it.id) },
    ]} />;
}

function AdminLobbies({ app }) {
  return <AdminList title="Lobbies" subtitle={app.lobbies.length + ' match lobbies'} items={app.lobbies}
    getText={l => getSquad(app.squads, l.teamAId).name + ' ' + getSquad(app.squads, l.teamBId).name} statusOf={l => l.status} statuses={['Opponent Accepted', 'Waiting for Payment', 'Match Locked', 'Completed', 'Cancelled']}
    renderRow={l => <ARowMain icon="game-controller" iconBg={C.navy} label={getSquad(app.squads, l.teamAId).name + ' vs ' + getSquad(app.squads, l.teamBId).name} sub={l.sport + ' · ' + getVenue(l.venueId).name + ' · ' + l.paymentStatus} badge={l.status} badgeTone={statusTone(l.status)} />}
    actionsFor={l => [
      { label: 'View Lobby', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('matchLobby', { id: it.id }); } },
      { label: 'View Tactics', icon: 'grid', run: it => { app.exitAdmin(); app.go('tacticsRoom', { lobbyId: it.id }); } },
      { label: 'Mark Completed', icon: 'checkmark-done', run: it => app.completeMatch(it.id) },
      { label: 'Resolve Dispute', icon: 'hammer', run: it => app.adminResolveDispute(it.id) },
      { label: 'Force Cancel', icon: 'close-circle', danger: true, run: it => app.adminForceCancelLobby(it.id) },
    ]} />;
}

function AdminPosts({ app }) {
  return <AdminList title="Posts" subtitle={app.posts.length + ' posts'} items={app.posts}
    getText={p => (p.title || '') + ' ' + (p.caption || '')} statusOf={p => app.postModOf(p.id)} statuses={['Active', 'Hidden', 'Removed']}
    renderRow={p => <ARowMain img={p.image} icon={POST_ICON[p.postType]} label={p.title || p.postType} sub={p.postType + ' · ' + (p.authorType === 'squad' ? getSquad(app.squads, p.createdBy).name : getUser(p.createdBy).name) + ' · ❤ ' + app.likeCount(p.id, p.likes)} badge={app.postModOf(p.id)} badgeTone={statusTone(app.postModOf(p.id) === 'Active' ? 'Completed' : 'Cancelled')} />}
    actionsFor={p => [
      { label: 'View Post', icon: 'open-outline', run: it => { app.exitAdmin(); app.go('postDetail', { id: it.id }); } },
      { label: 'Hide Post', icon: 'eye-off', run: it => app.setPostMod(it.id, 'Hidden') },
      { label: 'Restore Post', icon: 'eye', run: it => app.setPostMod(it.id, 'Active') },
      { label: 'Feature Post', icon: 'star', run: () => app.toast('Post featured', 'success') },
      { label: 'Warn Author', icon: 'warning', run: it => app.toast('Warning sent to author', 'info') },
      { label: 'Remove Post', icon: 'trash', danger: true, run: it => app.adminRemovePost(it.id) },
    ]} />;
}

function AdminComments({ app }) {
  const all = [];
  Object.entries(app.comments).forEach(([pid, arr]) => arr.forEach(c => all.push({ ...c, postId: pid })));
  return <AdminList title="Comments" subtitle={all.length + ' comments'} items={all}
    getText={c => c.text + ' ' + getUser(c.userId).name} statusOf={() => 'Active'}
    renderRow={c => <ARowMain icon="chatbubble" label={getUser(c.userId).name} sub={c.text} />}
    actionsFor={c => [
      { label: 'View Thread', icon: 'open-outline', run: () => { app.exitAdmin(); app.go('postDetail', { id: c.postId, focus: 'comments' }); } },
      { label: 'Warn User', icon: 'warning', run: () => app.toast('Warning sent to ' + getUser(c.userId).name, 'info') },
      { label: 'Hide Comment', icon: 'eye-off', run: () => { app.logAction('Hid comment', getUser(c.userId).name, c.text.slice(0, 30)); app.toast('Comment hidden', 'info'); } },
      { label: 'Remove Comment', icon: 'trash', danger: true, run: () => { app.logAction('Removed comment', getUser(c.userId).name, c.text.slice(0, 30)); app.toast('Comment removed', 'error'); } },
    ]} />;
}

function AdminPayments({ app }) {
  const paid = app.payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const refunded = app.payments.filter(p => p.status === 'Refunded').reduce((s, p) => s + p.amount, 0);
  return (
    <View>
      <View style={S.aStatGrid}>
        <AStat label="Total revenue" value={money(paid)} icon="cash" tone={C.green} />
        <AStat label="Refunded" value={money(refunded)} icon="return-down-back" tone={C.warning} />
        <AStat label="Pending" value={app.payments.filter(p => ['Pending', 'Not Started'].includes(p.status)).length} icon="time" tone={C.blue} />
        <AStat label="Failed" value={app.payments.filter(p => p.status === 'Failed').length} icon="close-circle" tone={C.danger} />
      </View>
      <AdminList title="Payments" subtitle="All transactions" items={app.payments}
        getText={p => p.purpose} statusOf={p => p.status} statuses={['Paid', 'Pending', 'Refunded', 'Failed']}
        renderRow={p => <ARowMain icon="card" iconBg={p.status === 'Paid' ? C.green : p.status === 'Refunded' ? C.warning : C.blue} label={p.purpose} sub={p.date + ' · ' + p.method + ' · ' + money(p.amount)} badge={p.status} badgeTone={statusTone(p.status)} />}
        actionsFor={p => [
          { label: 'Mark as Paid', icon: 'checkmark-circle', run: it => app.adminMarkPaid(it.id) },
          { label: 'Download Receipt', icon: 'download', run: () => app.toast('Receipt downloaded (placeholder)', 'info') },
          { label: 'View Related', icon: 'open-outline', run: () => app.toast('Opening related record', 'info') },
          { label: 'Refund Payment', icon: 'return-down-back', danger: true, run: it => app.adminRefund(it.id) },
        ]} />
    </View>
  );
}

function AdminMemberships({ app }) {
  return <AdminList title="Memberships" subtitle={app.memberships.length + ' memberships'} items={app.memberships}
    getText={m => getVenue(m.venueId).name + ' ' + m.plan} statusOf={m => m.status} statuses={['Pending', 'Active', 'Expired', 'Cancelled']}
    renderRow={m => <ARowMain icon="ribbon" iconBg={C.blue} label={getVenue(m.venueId).name} sub={m.plan + ' · per ' + m.period + ' · ' + money(m.price) + ' · ' + (m.memberName || 'Member')} badge={m.status} badgeTone={statusTone(m.status)} />}
    actionsFor={m => [
      { label: 'Approve', icon: 'checkmark-circle', run: it => app.adminSetMembership(it.id, 'Active') },
      { label: 'Renew', icon: 'refresh', run: () => app.toast('Membership renewed', 'success') },
      { label: 'Suspend', icon: 'pause-circle', run: it => app.adminSetMembership(it.id, 'Suspended') },
      { label: 'Cancel', icon: 'close-circle', danger: true, run: it => app.adminSetMembership(it.id, 'Cancelled') },
    ]} />;
}

function AdminReports({ app }) {
  const targetName = r => r.type.includes('User') ? getUser(r.target).name : r.type.includes('Venue') ? getVenue(r.target).name : r.target;
  return <AdminList title="Reports" subtitle={app.reports.filter(r => r.status === 'Open').length + ' open'} items={app.reports}
    getText={r => r.type + ' ' + r.reason} statusOf={r => r.status} statuses={['Open', 'Under Review', 'Resolved', 'Rejected']}
    renderRow={r => <ARowMain icon="flag" iconBg={r.priority === 'High' ? C.danger : r.priority === 'Medium' ? C.warning : C.blue} label={r.type} sub={r.reason + ' · by ' + getUser(r.reporter).name + ' · ' + r.at} badge={r.status} badgeTone={statusTone(r.status === 'Resolved' ? 'Completed' : r.status === 'Rejected' ? 'Cancelled' : 'Pending')} />}
    actionsFor={r => [
      { label: 'Mark Under Review', icon: 'eye', run: it => app.resolveReport(it.id, 'Under Review') },
      { label: 'Resolve', icon: 'checkmark-circle', run: it => app.resolveReport(it.id, 'Resolved') },
      { label: 'Warn User', icon: 'warning', run: () => app.toast('Warning sent', 'info') },
      { label: 'Remove Content', icon: 'trash', run: it => { if (it.type === 'Post Report') app.adminRemovePost(it.target); app.resolveReport(it.id, 'Resolved'); } },
      { label: 'Reject Report', icon: 'close-circle', danger: true, run: it => app.resolveReport(it.id, 'Rejected') },
    ]}
    detailFor={r => (
      <View>
        <Text style={S.sheetTitle}>{r.type}</Text>
        <Text style={S.sheetSub}>{r.status} · {r.priority} priority</Text>
        <ADetailField k="Reporter" v={getUser(r.reporter).name} />
        <ADetailField k="Target" v={targetName(r)} />
        <ADetailField k="Reason" v={r.reason} />
        <ADetailField k="Filed" v={r.at} />
        <View style={{ height: 12 }} />
        <View style={S.rowGap}><AppButton title="Resolve" variant="green" small fill icon="checkmark" onPress={() => app.resolveReport(r.id, 'Resolved')} /><AppButton title="Reject" variant="danger" small fill icon="close" onPress={() => app.resolveReport(r.id, 'Rejected')} /></View>
      </View>
    )} />;
}

function AdminSupport({ app }) {
  return <AdminList title="Support" subtitle={app.tickets.filter(t => t.status === 'Open').length + ' open tickets'} items={app.tickets}
    getText={t => t.subject + ' ' + t.category} statusOf={t => t.status} statuses={['Open', 'Under Review', 'Closed']}
    renderRow={t => <ARowMain icon="help-buoy" iconBg={t.priority === 'High' ? C.danger : C.blue} label={t.subject} sub={t.category + ' · ' + getUser(t.userId).name + ' · ' + (t.staff || 'Unassigned')} badge={t.status} badgeTone={statusTone(t.status === 'Closed' ? 'Completed' : 'Pending')} />}
    actionsFor={t => [
      { label: 'Reply', icon: 'chatbubble', run: () => app.toast('Reply sent to ' + getUser(t.userId).name, 'success') },
      { label: 'Assign to me', icon: 'person-add', run: it => app.updateTicket(it.id, { staff: app.adminRole, status: 'Under Review' }) },
      { label: 'Mark Under Review', icon: 'eye', run: it => app.updateTicket(it.id, { status: 'Under Review' }) },
      { label: 'Close Ticket', icon: 'checkmark-done', run: it => app.updateTicket(it.id, { status: 'Closed' }) },
    ]} />;
}

function AdminAnnouncements({ app }) {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [aud, setAud] = useState('All users');
  const [cat, setCat] = useState('System');
  const auds = ['All users', 'Event participants', 'Venue followers', 'Users with pending payment', 'Users in a match lobby'];
  const cats = ['Match', 'Booking', 'Payment', 'Event', 'Squad', 'Social', 'System', 'Promotion'];
  return (
    <View>
      <View style={S.aPanel}>
        <Text style={S.aPanelTitle}>Send announcement</Text>
        <Text style={S.inputLabel}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Announcement title" placeholderTextColor={C.mutedLight} style={S.input} />
        <Text style={S.inputLabel}>Message</Text>
        <TextInput value={msg} onChangeText={setMsg} placeholder="Write your message…" placeholderTextColor={C.mutedLight} multiline style={[S.input, S.inputArea]} />
        <Text style={S.inputLabel}>Audience</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipWrapRow}>{auds.map(a => <Chip key={a} label={a} active={aud === a} onPress={() => setAud(a)} />)}</ScrollView>
        <Text style={S.inputLabel}>Category</Text>
        <View style={S.chipWrap}>{cats.map(c => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}</View>
        <View style={{ height: 12 }} />
        <AppButton title="Send announcement" icon="megaphone" fill onPress={() => { if (!title.trim()) { app.toast('Add a title', 'error'); return; } app.sendAdminAnnouncement({ title: title.trim(), audience: aud, category: cat }); setTitle(''); setMsg(''); }} />
      </View>
      <AdminList title="Sent announcements" subtitle={app.announcements.length + ' sent'} items={app.announcements}
        getText={a => a.title} renderRow={a => <ARowMain icon="megaphone" iconBg={C.blue} label={a.title} sub={a.audience + ' · ' + a.category + ' · ' + a.at} />} />
    </View>
  );
}

function AdminAnalytics({ app }) {
  const sportCounts = {}; app.bookings.forEach(b => { if (b.sport) sportCounts[b.sport] = (sportCounts[b.sport] || 0) + 1; });
  const sportData = Object.keys(sportCounts).length ? Object.entries(sportCounts).map(([k, v]) => ({ label: k.slice(0, 4), value: v })) : [{ label: 'Fut', value: 5 }, { label: 'BBl', value: 3 }, { label: 'Bad', value: 4 }];
  return (
    <View>
      <Text style={S.aSecTitle}>Analytics</Text>
      <Text style={S.aSecSub}>Platform performance & trends</Text>
      <View style={S.aChartRow}>
        <ABars title="User growth" data={[{ label: 'Jan', value: 3 }, { label: 'Feb', value: 5 }, { label: 'Mar', value: 6 }, { label: 'Apr', value: 8 }, { label: 'May', value: 10 }, { label: 'Jun', value: 12 }]} color={C.blue} />
        <ABars title="Peak hours" data={[{ label: '6a', value: 4 }, { label: '9a', value: 3 }, { label: '12p', value: 5 }, { label: '4p', value: 7 }, { label: '6p', value: 12 }, { label: '8p', value: 10 }]} color={C.warning} />
      </View>
      <View style={S.aChartRow}>
        <ABars title="Active sports" data={sportData} color={C.green} />
        <ABars title="Revenue by cat." data={[{ label: 'Venue', value: 14 }, { label: 'Gym', value: 8 }, { label: 'Event', value: 6 }, { label: 'Class', value: 4 }]} color={C.navy} />
      </View>
      <ADonutRow items={[{ label: 'Success', value: 18, color: C.green }, { label: 'Pending', value: 4, color: C.warning }, { label: 'Failed', value: 2, color: C.danger }]} />
    </View>
  );
}

function AdminSettings({ app }) {
  const Row = ({ label, value, on, onToggle }) => (
    <View style={S.settingRow}><Text style={S.settingLabel}>{label}</Text>{onToggle ? <Toggle value={on} onToggle={onToggle} /> : <Text style={S.listSub}>{value}</Text>}</View>
  );
  const [maint, setMaint] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  return (
    <View>
      <Text style={S.aSecTitle}>Platform settings</Text>
      <Text style={S.aSecSub}>Global configuration · {app.adminRole}</Text>
      <View style={{ height: 8 }} />
      <Row label="Platform commission" value="8%" />
      <Row label="Default cancellation window" value="2 hours" />
      <Row label="Currency" value="Nu. (BTN)" />
      <Row label="Maintenance mode" on={maint} onToggle={() => { setMaint(m => !m); app.logAction('Toggled maintenance mode', 'Platform'); app.toast('Maintenance ' + (!maint ? 'on' : 'off'), 'info'); }} />
      <Row label="Auto-approve free bookings" on={autoApprove} onToggle={() => { setAutoApprove(a => !a); app.toast('Saved', 'info'); }} />
      <Text style={S.aSecTitle2}>Roles & access</Text>
      {ROLE_LIST.map(r => <View key={r} style={S.settingRow}><Text style={S.settingLabel}>{r}</Text><Badge label={ADMIN_ROLES[r] === '*' ? 'Full access' : ADMIN_ROLES[r].length + ' sections'} tone="blue" /></View>)}
      <View style={{ height: 12 }} />
      <AppButton title="Exit admin panel" variant="secondary" icon="exit-outline" fill onPress={app.exitAdmin} />
    </View>
  );
}

function AdminLogs({ app }) {
  return <AdminList title="Activity Logs" subtitle={app.activityLog.length + ' actions logged'} items={app.activityLog}
    getText={l => l.admin + ' ' + l.action + ' ' + l.target}
    renderRow={l => <ARowMain icon="time" iconBg={C.navy} label={l.action + ' · ' + l.target} sub={l.admin + ' · ' + l.at + (l.detail ? ' · ' + l.detail : '')} />} />;
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN APP — state + actions + router
// ════════════════════════════════════════════════════════════════════════════
const TABS = ['home', 'search', 'lobby', 'profile'];
const HIDE_NAV = ['tacticsRoom', 'chat'];
const BOT_REPLIES = ['On the way 👍', 'Sounds good', 'Confirmed ✅', "Let's do it", 'See you there', 'Ready when you are'];

function MainApp({ onLogout, startAdmin }) {
  const [stack, setStack] = useState([{ route: 'home', params: {} }]);
  const [squads, setSquads] = useState(initialSquads);
  const [posts, setPosts] = useState(initialPosts);
  const [events] = useState(eventSeed);
  const [requests, setRequests] = useState(initialRequests);
  const [comments, setComments] = useState(initialComments);
  const [lobbies, setLobbies] = useState([]);
  const [threads, setThreads] = useState({
    'sq-s-strikers': { id: 'sq-s-strikers', type: 'squad', title: 'Thimphu Strikers · Squad', subtitle: '6 members', botId: 'u-kencho',
      messages: [
        { id: 'sm1', userId: 'u-kencho', text: 'Training tonight 6 PM at Changlimithang 💪', at: '4:02 PM' },
        { id: 'sm2', userId: 'u-sonam', text: "I'm in", at: '4:05 PM' },
        { id: 'sm3', userId: 'u-ngawang', text: 'Same. Bringing the bibs.', at: '4:09 PM' },
      ] },
  });
  const [chatReads, setChatReads] = useState({ 'sq-s-strikers': 3 }); // { [threadId]: messages-count-when-last-read }
  const [follows, setFollows] = useState({ user: { 'u-pema': true }, squad: { 's-smashers': true }, venue: {}, event: {} });
  const [notifications, setNotifications] = useState([
    { id: 'n1', type: 'request', title: 'New opponent request', body: 'Dragon FC requested to compete in your futsal challenge.', at: '8 min ago', read: false, route: 'postDetail', params: { id: 'mp-1', focus: 'interested' } },
    { id: 'n2', type: 'like', title: 'Tashi D. liked your post', body: 'Your match result is getting attention.', at: '1 hour ago', read: false, route: 'postDetail', params: { id: 'feed-1' } },
    { id: 'n3', type: 'event', title: 'Bhutan Futsal League 2025', body: 'Registration closes in 2 days. Register your squad.', at: '3 hours ago', read: true, route: 'eventDetail', params: { id: 'e-futsal' } },
  ]);
  const [requestPostId, setRequestPostId] = useState(null);
  const [squadPlans, setSquadPlans] = useState({});   // { [squadId]: [plan,...] } saved formations
  const [editors, setEditors] = useState({});         // { [squadId]: { [userId]: true } } granted editors
  const [draftPlan, setDraftPlan] = useState(null);   // tactics being attached to a new Match Challenge post
  const [bookings, setBookings] = useState([]);       // venue/class/trainer/lane bookings
  const [memberships, setMemberships] = useState([]); // gym memberships
  const [likes, setLikes] = useState({});             // { [postId]: { count, liked } }
  const [savedItems, setSavedItems] = useState({});   // { [id]: true } (posts + 'v:'+venueId)
  const [shares, setShares] = useState({});           // { [postId]: count }
  const [shareSubject, setShareSubject] = useState(null);
  const [profile, setProfile] = useState({ ...currentUser, bio: 'Futsal fixo for Thimphu Strikers. Evenings at Changlimithang. Always up for a game. 🇧🇹', playingStyle: 'High press', contact: '@ngawang927' });
  const [notifPrefs, setNotifPrefs] = useState({ 'Match Requests': true, 'Chat Messages': true, 'Payment Alerts': true, 'Event Alerts': true, 'Followers': true, 'Comments': true, 'Squad Invites': true });
  const [privacyPrefs, setPrivacyPrefs] = useState({ 'Private profile': false, 'Show availability': true, 'Show match history': true });
  const [msgPrivacy, setMsgPrivacy] = useState('Everyone');
  const [theme, setTheme] = useState('Light');
  const [results, setResults] = useState([
    { id: 'res-1', sport: 'Futsal', squadId: 's-strikers', oppName: 'Phoenix', scoreA: 6, scoreB: 4, outcome: 'W', date: '3 days ago', venueId: 'v-chang', status: 'Completed' },
    { id: 'res-2', sport: 'Futsal', squadId: 's-strikers', oppName: 'Dragon FC', scoreA: 2, scoreB: 3, outcome: 'L', date: '1 week ago', venueId: 'v-chang', status: 'Completed' },
    { id: 'res-3', sport: 'Futsal', squadId: 's-strikers', oppName: 'United', scoreA: 5, scoreB: 1, outcome: 'W', date: '2 weeks ago', venueId: 'v-complex', status: 'Completed' },
  ]);
  const [payments, setPayments] = useState([
    { id: 'pay-1', purpose: 'Venue — Changlimithang Futsal', amount: 600, date: '3 days ago', status: 'Paid', method: 'mBoB Wallet' },
    { id: 'pay-2', purpose: 'Gym day pass — Dragon Gym', amount: 150, date: '5 days ago', status: 'Paid', method: 'Cash' },
    { id: 'pay-3', purpose: 'Match settlement — vs Dragon FC', amount: 1000, date: '1 week ago', status: 'Refunded', method: 'mBoB Wallet' },
  ]);
  const [toastState, setToastState] = useState(null);

  // ── admin state ──
  // When the user signed in via the "Admin" quick-login, drop straight into the dashboard
  // with their real backend role; otherwise start in the normal app.
  const [adminMode, setAdminMode] = useState(!!startAdmin && isAdminRole(currentUser.role));
  const [adminRole, setAdminRole] = useState(adminRoleForUser(currentUser.role));
  const [adminSection, setAdminSection] = useState('Dashboard');
  const [userMeta, setUserMeta] = useState({});      // {userId:{status,verified,notes:[]}}
  const [venueMeta, setVenueMeta] = useState({});    // {venueId:{status,verified}}
  const [squadMeta, setSquadMeta] = useState({});    // {squadId:{status,verified}}
  const [postMeta, setPostMeta] = useState({});      // {postId:{mod}}
  const [reports, setReports] = useState([
    { id: 'rep-1', reporter: 'u-sonam', type: 'Post Report', target: 'feed-1', reason: 'Spam / repeated posting', status: 'Open', priority: 'Medium', at: '2h ago' },
    { id: 'rep-2', reporter: 'u-tashi', type: 'Payment Dispute', target: 'pay-3', reason: 'Charged but match cancelled', status: 'Under Review', priority: 'High', at: '5h ago' },
    { id: 'rep-3', reporter: 'u-jigme', type: 'User Report', target: 'u-deki', reason: 'Abusive language in chat', status: 'Open', priority: 'High', at: '1d ago' },
    { id: 'rep-4', reporter: 'u-pema', type: 'Venue Complaint', target: 'v-paro', reason: 'Lights were off during booking', status: 'Open', priority: 'Low', at: '2d ago' },
  ]);
  const [tickets, setTickets] = useState([
    { id: 'tk-1', userId: 'u-kencho', subject: 'Refund not received', category: 'Payment', priority: 'High', status: 'Open', staff: null, at: '3h ago' },
    { id: 'tk-2', userId: 'u-sonam', subject: "Can't book a slot", category: 'Booking', priority: 'Medium', status: 'Open', staff: null, at: '6h ago' },
    { id: 'tk-3', userId: 'u-deki', subject: 'Squad invite bug', category: 'Bug', priority: 'Low', status: 'Under Review', staff: 'Support Staff', at: '1d ago' },
  ]);
  const [announcements, setAnnouncements] = useState([
    { id: 'an-1', title: 'Bhutan Futsal League registration open', audience: 'All users', category: 'Event', at: '1d ago' },
    { id: 'an-2', title: 'Scheduled maintenance Sunday 2 AM', audience: 'All users', category: 'System', at: '3d ago' },
  ]);
  const [venueApplications, setVenueApplications] = useState([
    { id: 'va-1', name: 'Wangdue Turf Park', venueType: 'Ground', area: 'Wangdue', owner: 'Sangay T.', sports: ['Football', 'Futsal'], status: 'Pending', at: '4h ago' },
    { id: 'va-2', name: 'Paro Aqua Lane', venueType: 'Pool', area: 'Paro', owner: 'Choki D.', sports: ['Swimming'], status: 'Pending', at: '1d ago' },
  ]);
  const [activityLog, setActivityLog] = useState([
    { id: 'lg-1', admin: 'Super Admin', action: 'Approved venue', target: 'Thimphu Sports Complex', at: '2d ago' },
    { id: 'lg-2', admin: 'Finance Admin', action: 'Refunded payment', target: 'Nu. 1,000 · pay-3', at: '1 week ago' },
  ]);

  // Maps a local seed venue (by name) → its real backend id, so bookings/memberships
  // persist against the right venue row. Seed names match between app and backend.
  const backendVenueIdRef = useRef({});
  const resolveVenueId = (localVenueId) => { const v = getVenue(localVenueId); const key = v && v.name ? v.name.toLowerCase().trim() : null; return key ? (backendVenueIdRef.current[key] || null) : null; };

  // ── hydrate real data from the backend + wire realtime ──────────────────────
  // Maps a backend notification → the shape the UI renders. Routes only to screens
  // that don't depend on local seed IDs, so taps never dead-end.
  const mapNotif = (n) => {
    let route = null, params = {};
    if (n.entityType === 'booking') { route = 'profile'; params = { tab: 'Bookings' }; }
    else if (n.entityType === 'membership') { route = 'profile'; params = { tab: 'Memberships' }; }
    else if (n.entityType === 'payment' || n.type === 'payDone' || n.type === 'payPending') { route = 'profile'; params = { tab: 'Payments' }; }
    return { id: n.id, type: n.type || 'info', title: n.title, body: n.message || '', at: relTime(n.createdAt), read: !!n.read, route, params, _backend: true };
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      try { const me = await api.me(); if (alive && me && me.user) { applyBackendUser(me.user); setProfile((pr) => ({ ...pr, ...currentUser })); } } catch { /* offline → keep local seed */ }
      try { const r = await api.notifications(); if (alive && r && Array.isArray(r.items) && r.items.length) setNotifications(r.items.map(mapNotif)); } catch { /* keep local */ }
      try { const r = await api.venues({ limit: 100 }); if (alive && r && Array.isArray(r.items)) r.items.forEach((v) => { if (v && v.name) backendVenueIdRef.current[v.name.toLowerCase().trim()] = v.id; }); } catch { /* keep local */ }
      try { const r = await api.payments(); if (alive && r && Array.isArray(r.items) && r.items.length) setPayments(r.items.map((p) => ({ id: p.id, purpose: p.purpose || p.type || 'Payment', amount: p.amount, date: relTime(p.createdAt), status: p.status, method: p.method || 'mBoB Wallet' }))); } catch { /* keep local */ }
    })();
    // realtime
    const offNotif = onSocket('notification', (n) => { if (n) setNotifications((ns) => [mapNotif(n), ...ns]); });
    const offMsg = onSocket('chat:message', (m) => {
      if (!m || !m.roomId) return;
      setThreads((t) => (t[m.roomId] ? { ...t, [m.roomId]: { ...t[m.roomId], messages: [...t[m.roomId].messages, { id: m.id || uid('m'), userId: m.senderId || m.userId, text: m.text, at: 'now' }] } } : t));
    });
    return () => { alive = false; offNotif && offNotif(); offMsg && offMsg(); };
  }, []);

  const current = stack[stack.length - 1];
  const base = stack[0].route;
  const activeTab = TABS.includes(base) ? base : 'home';

  // ── navigation ──
  const go = (route, params = {}) => setStack(s => [...s, { route, params }]);
  const back = () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s));
  const navTo = tab => setStack([{ route: tab, params: {} }]);

  // ── toast ──
  const toast = (msg, type = 'success') => setToastState({ msg, type, k: ++_uid });

  // ── notifications ──
  const addNotif = (type, title, body, route, params) =>
    setNotifications(ns => [{ id: uid('n'), type, title, body, at: 'just now', read: false, route, params }, ...ns]);
  const markAllRead = () => { setNotifications(ns => ns.map(n => ({ ...n, read: true }))); api.markAllNotifsRead().catch(() => {}); };
  const openNotif = n => { setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x)); if (n._backend) api.markNotifRead(n.id).catch(() => {}); if (n.route) go(n.route, n.params); };

  // ── follow ──
  const isFollowing = (kind, id) => !!(follows[kind] && follows[kind][id]);
  const followerCount = (kind, id, base = 0) => base + (isFollowing(kind, id) ? 1 : 0);
  const toggleFollow = (kind, id, name) => {
    setFollows(f => {
      const now = !!(f[kind] && f[kind][id]);
      const next = { ...f, [kind]: { ...f[kind], [id]: !now } };
      if (!now) addNotif('follow', 'You followed ' + name, 'You\'ll get updates from ' + name + '.', kind === 'squad' ? 'squadDetail' : kind === 'user' ? 'userProfile' : kind === 'venue' ? 'venueDetail' : 'eventDetail', { id });
      return next;
    });
    // Persist the follow on the server (the endpoint toggles, mirroring the local flip).
    api.follow(kind, id).catch(() => {});
  };

  // ── comments ──
  const addComment = (postId, text) => {
    setComments(c => ({ ...c, [postId]: [...(c[postId] || []), { id: uid('c'), userId: currentUser.id, text, likes: 0, liked: false, at: 'just now', replies: [] }] }));
    const post = posts.find(p => p.id === postId);
    if (post && post.createdBy !== currentUser.id) addNotif('comment', 'New comment', 'You commented on ' + (post.title || 'a post') + '.', 'postDetail', { id: postId });
    if (post && post.backendId) api.addComment(post.backendId, text).catch(() => {});
  };
  const addReply = (postId, commentId, text) =>
    setComments(c => ({ ...c, [postId]: (c[postId] || []).map(x => x.id === commentId ? { ...x, replies: [...(x.replies || []), { id: uid('r'), userId: currentUser.id, text, at: 'just now' }] } : x) }));
  const likeComment = (postId, commentId) =>
    setComments(c => ({ ...c, [postId]: (c[postId] || []).map(x => x.id === commentId ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 } : x) }));

  // ── posts ──
  const createPost = payload => {
    const isMatch = payload.postType === 'Match Challenge' || payload.postType === 'Squad Recruitment';
    const mySquad = squads.find(s => s.members.some(m => m.userId === currentUser.id) && s.sport === payload.sport) || squads.find(s => s.members.some(m => m.userId === currentUser.id)) || squads[0];
    const img = payload.postType === 'Gym Progress' ? IMG.gym : payload.postType === 'Venue Review' ? IMG.badminton : payload.postType === 'Match Result' ? IMG.feed : null;
    const post = {
      id: uid('post'),
      authorType: isMatch ? 'squad' : 'user',
      createdBy: isMatch ? mySquad.id : currentUser.id,
      location: currentUser.location, likes: 0, requests: [], createdAt: 'just now', image: img,
      ...payload,
    };
    setPosts(p => [post, ...p]);
    toast(isMatch ? 'Challenge posted to the feed 🔥' : 'Posted to the feed ✅');
    // Persist to the backend; attach the real id so likes/comments on it also persist.
    api.createPost({
      postType: payload.postType, title: payload.title || null, caption: payload.caption || null,
      sport: payload.sport || null, location: currentUser.location, image: post.image || null,
      teamSize: payload.teamSize || null, preferredTime: payload.preferredTime || payload.time || null,
      venueName: payload.venueName || null, paymentSplit: payload.paymentSplit || payload.split || null,
      skillLevel: payload.skillLevel || payload.skill || null, opponentName: payload.opponentName || null,
      result: (payload.scoreA != null && payload.scoreB != null) ? `${payload.scoreA}-${payload.scoreB}` : null,
      rating: payload.rating != null ? payload.rating : null, trainingType: payload.trainingType || null, fee: payload.eventFee || null,
    }).then(r => { if (r && r.post) setPosts(ps => ps.map(x => x.id === post.id ? { ...x, backendId: r.post.id } : x)); }).catch(() => {});
    return post.id;
  };

  // ── requests ──
  const openRequest = post => setRequestPostId(post.id);
  const closeRequest = () => setRequestPostId(null);
  const sendRequest = (postId, squadId, message) => {
    const post = posts.find(p => p.id === postId);
    const id = uid('mr');
    setRequests(rs => [...rs, { id, postId, requestingSquadId: squadId, hostSquadId: post.createdBy, message, status: 'Pending', createdAt: 'just now' }]);
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, requests: [...(p.requests || []), id] } : p));
    addNotif('request', 'New opponent request', getSquad(squads, squadId).name + ' requested to compete.', 'postDetail', { id: postId, focus: 'interested' });
    toast('Request sent to ' + getSquad(squads, post.createdBy).name + ' 🤝');
  };

  const makeLobby = ({ teamAId, teamBId, sport, venueId, date, postId, paymentSplit, tactics, bookingId }) => {
    const id = uid('lb').replace('id', 'm');
    const teamA = getSquad(squads, teamAId), teamB = getSquad(squads, teamBId);
    const vId = venueId || (venues.find(v => v.sports.includes(sport)) || venues[0]).id;
    const threadId = 'lob-' + id;
    setThreads(t => ({ ...t, [threadId]: {
      id: threadId, type: 'lobby', title: teamA.name + ' vs ' + teamB.name, subtitle: 'Match lobby', botId: teamB.captainId,
      messages: [
        { id: uid('m'), userId: teamB.captainId, text: 'GG, looking forward to it! 🤝', at: 'just now' },
        { id: uid('m'), userId: teamA.captainId, text: 'Likewise. See you at the venue.', at: 'just now' },
      ] },
    }));
    const lobby = {
      id, postId: postId || null, bookingId: bookingId || null, teamAId, teamBId, sport,
      venueId: vId, date: date || 'Tonight, 7:00 PM', status: 'Opponent Accepted',
      readyA: 0, readyB: 0, lineupAConfirmed: false, lineupBConfirmed: false,
      paymentSplit: paymentSplit || '50/50 Team Split', paymentStatus: 'Not Started', paymentTermsAccepted: false,
      threadId,
      tactics: (tactics && tactics.roster) ? JSON.parse(JSON.stringify({ ...tactics, locked: false })) : buildPlan(teamA, sport),
    };
    setLobbies(ls => [lobby, ...ls]);
    if (bookingId) setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, lobbyId: id } : b));
    return lobby;
  };
  const createLobby = (post, requestingSquadId) => makeLobby({
    teamAId: post.createdBy, teamBId: requestingSquadId, sport: post.sport,
    venueId: post.venueId, date: post.preferredTime, postId: post.id, paymentSplit: post.paymentSplit, tactics: post.tactics, bookingId: post.bookingId,
  });
  const createDirectLobby = (teamAId, teamBId, sport) => makeLobby({ teamAId, teamBId, sport });

  const acceptRequest = reqId => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const post = posts.find(p => p.id === req.postId);
    setRequests(rs => rs.map(r => r.id === reqId ? { ...r, status: 'Accepted' } : r.postId === req.postId ? { ...r, status: 'Rejected' } : r));
    setPosts(ps => ps.map(p => p.id === req.postId ? { ...p, status: 'Opponent Accepted' } : p));
    const lobby = createLobby(post, req.requestingSquadId);
    addNotif('accepted', 'Request accepted', 'Match lobby created vs ' + getSquad(squads, req.requestingSquadId).name + '.', 'matchLobby', { id: lobby.id });
    addNotif('lobby', 'Match lobby ready', 'Your lobby for ' + post.sport + ' is live.', 'matchLobby', { id: lobby.id });
    toast('Opponent accepted — lobby created! ⚡');
    go('matchLobby', { id: lobby.id });
  };
  const rejectRequest = reqId => {
    setRequests(rs => rs.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
    addNotif('rejected', 'Request declined', 'A squad request was declined.', null);
    toast('Request rejected', 'info');
  };
  const openLobbyForPost = post => {
    const l = lobbies.find(x => x.postId === post.id);
    if (l) go('matchLobby', { id: l.id });
    else toast('No lobby yet — accept a request first', 'info');
  };

  // ── lobby actions ──
  const updateLobby = (id, patch) => setLobbies(ls => ls.map(l => l.id === id ? { ...l, ...(typeof patch === 'function' ? patch(l) : patch) } : l));
  const updateTactics = (id, patch) => setLobbies(ls => ls.map(l => l.id === id ? { ...l, tactics: { ...l.tactics, ...(typeof patch === 'function' ? patch(l.tactics) : patch) } } : l));
  const req5 = id => { const l = lobbies.find(x => x.id === id); return Math.min(getBoard(l.sport).players, 5); };

  const toggleReady = id => updateLobby(id, l => { const r = req5(id); const on = l.readyA >= r; return { readyA: on ? 0 : r, readyB: on ? 0 : r, status: on ? 'Opponent Accepted' : 'Waiting for Lineup' }; });
  const confirmLineups = id => { updateLobby(id, { lineupAConfirmed: true, lineupBConfirmed: true, status: 'Waiting for Payment' }); toast('Lineups confirmed ✅'); };
  const acceptPaymentTerms = id => { updateLobby(id, l => ({ paymentTermsAccepted: true, paymentStatus: l.paymentStatus === 'Not Started' ? 'Pending' : l.paymentStatus, status: 'Waiting for Payment' })); toast('Payment terms accepted'); };
  const payLobby = id => { updateLobby(id, { paymentStatus: 'Paid', status: 'Ready to Lock' }); addNotif('payDone', 'Payment completed', 'Your share of the match fee is paid.', 'matchLobby', { id }); toast('Payment successful 💸'); };
  const lockMatch = id => { updateLobby(id, { status: 'Match Locked' }); addNotif('locked', 'Match locked', 'Your match is locked and confirmed. Good luck!', 'matchLobby', { id }); toast('Match locked & confirmed! 🔒'); };
  const completeMatch = id => { updateLobby(id, { status: 'Completed' }); toast('Match marked completed 🏆'); };
  // result submission flow
  const submitResult = (lobbyId, scoreA, scoreB) => {
    const l = lobbies.find(x => x.id === lobbyId); if (!l) return;
    const a = getSquad(squads, l.teamAId), b = getSquad(squads, l.teamBId);
    const rid = uid('res');
    setResults(rs => [{ id: rid, lobbyId, sport: l.sport, squadId: l.teamAId, oppName: b.name, scoreA, scoreB, outcome: scoreA > scoreB ? 'W' : scoreA < scoreB ? 'L' : 'D', date: 'just now', venueId: l.venueId, status: 'Pending Confirmation' }, ...rs]);
    updateLobby(lobbyId, { status: 'Completed', result: `${scoreA} - ${scoreB}`, resultId: rid });
    addNotif('accepted', 'Result submitted', `${a.name} submitted ${scoreA}–${scoreB} vs ${b.name}. Awaiting confirmation.`, 'settlement', { lobbyId });
    toast('Result submitted — awaiting opponent confirmation');
  };
  const confirmResult = rid => {
    setResults(rs => rs.map(r => r.id === rid ? { ...r, status: 'Completed' } : r));
    addNotif('locked', 'Result confirmed', 'The match result is confirmed and counted.', 'profile', { tab: 'Matches' });
    toast('Result confirmed ✅ — stats updated');
  };
  const disputeResult = rid => {
    setResults(rs => rs.map(r => r.id === rid ? { ...r, status: 'Disputed' } : r));
    addNotif('rejected', 'Result disputed', 'The opponent disputed the result. Captains, please re-check.', null);
    toast('Result disputed', 'info');
  };
  const postResult = rid => {
    const r = results.find(x => x.id === rid); if (!r) return;
    const a = getSquad(squads, r.squadId);
    const pid = createPost({ postType: 'Match Result', sport: r.sport, title: `${a.name} ${r.scoreA} – ${r.scoreB} ${r.oppName}`, caption: `${r.outcome === 'W' ? 'Great win' : r.outcome === 'L' ? 'Tough loss' : 'Hard-fought draw'} vs ${r.oppName}. GG! 🤝`, result: `${r.scoreA} - ${r.scoreB}`, opponentName: r.oppName, image: IMG.feed });
    setResults(rs => rs.map(x => x.id === rid ? { ...x, postId: pid } : x));
    toast('Result posted to your feed 🏆');
  };

  // profile + settings
  const updateProfile = patch => { setProfile(p => ({ ...p, ...patch })); Object.assign(currentUser, patch); api.updateMyProfile(patch).catch(() => {}); toast('Profile updated ✓'); };
  const followingCount = () => 212 + Object.values(follows).reduce((sum, m) => sum + Object.values(m).filter(Boolean).length, 0);
  const setNotifPref = k => setNotifPrefs(p => ({ ...p, [k]: !p[k] }));
  const setPrivacyPref = k => setPrivacyPrefs(p => ({ ...p, [k]: !p[k] }));
  const logout = () => { toast('Logged out', 'info'); onLogout && onLogout(); };

  // payments
  const addPayment = p => { const id = uid('pay'); setPayments(ps => [{ id, date: 'just now', ...p }, ...ps]); api.createPayment({ purpose: p.purpose, amount: p.amount, pay: p.status === 'Paid', method: p.method }).catch(() => {}); return id; };
  const settleMatch = lobbyId => {
    const l = lobbies.find(x => x.id === lobbyId); if (!l) return;
    updateLobby(lobbyId, { paymentStatus: 'Paid' });
    if (l.bookingId) setBookings(bs => bs.map(b => b.id === l.bookingId ? { ...b, paymentStatus: 'Paid', status: 'Confirmed' } : b));
    addPayment({ purpose: `Match settlement — ${getSquad(squads, l.teamAId).name} vs ${getSquad(squads, l.teamBId).name}`, amount: getVenue(l.venueId).pricePerHour, status: 'Paid', method: 'mBoB Wallet' });
    addNotif('payDone', 'Payment completed', 'Match settlement paid in full.', 'profile', { tab: 'Payments' });
    toast('Settlement paid in full ✅');
  };
  const cancelLobby = id => { updateLobby(id, { status: 'Cancelled' }); toast('Lobby cancelled', 'info'); };

  // ── tactics: universal plan read/write (lobby OR squad context) ──
  // ctx = { kind:'lobby', id } | { kind:'squad', id:squadId, planId }
  const readPlan = ctx => {
    if (!ctx) return null;
    if (ctx.kind === 'lobby') { const l = lobbies.find(x => x.id === ctx.id); return l ? l.tactics : null; }
    if (ctx.kind === 'draft') return draftPlan;
    if (ctx.kind === 'post') { const p = posts.find(x => x.id === ctx.id); return p ? p.tactics : null; }
    return (squadPlans[ctx.id] || []).find(p => p.id === ctx.planId) || null;
  };
  const updatePlan = (ctx, fn) => {
    if (ctx.kind === 'lobby') updateLobby(ctx.id, l => ({ tactics: fn(l.tactics) }));
    else if (ctx.kind === 'draft') setDraftPlan(p => fn(p));
    else if (ctx.kind === 'post') {} // post tactics are read-only snapshots
    else setSquadPlans(sp => ({ ...sp, [ctx.id]: (sp[ctx.id] || []).map(p => p.id === ctx.planId ? fn(p) : p) }));
  };
  const tacticsSquadId = ctx => {
    if (ctx.kind === 'lobby') return (lobbies.find(l => l.id === ctx.id) || {}).teamAId;
    if (ctx.kind === 'draft') return draftPlan && draftPlan.squadId;
    if (ctx.kind === 'post') { const p = posts.find(x => x.id === ctx.id); return p && p.createdBy; }
    return ctx.id;
  };
  const isEditor = (squadId, userId) => {
    const s = getSquad(squads, squadId); const m = (s.members || []).find(x => x.userId === userId);
    return !!(s.captainId === userId || (m && (m.isCaptain || m.isViceCaptain)) || (editors[squadId] && editors[squadId][userId]));
  };
  const canEditTactics = ctx => ctx.kind === 'draft' ? true : ctx.kind === 'post' ? false : isEditor(tacticsSquadId(ctx), currentUser.id);
  const startDraftTactics = (squadId, sport) => { const s = getSquad(squads, squadId); setDraftPlan({ squadId, ...buildPlan(s, sport) }); go('tacticsRoom', { draft: true }); };
  const clearDraftTactics = () => setDraftPlan(null);
  const toggleEditor = (squadId, userId) => setEditors(e => ({ ...e, [squadId]: { ...e[squadId], [userId]: !(e[squadId] && e[squadId][userId]) } }));
  const saveTacticsPlan = ctx => {
    updatePlan(ctx, p => ({ ...p, updatedAt: 'just now' }));
    addNotif('tacticsSaved', 'Tactics saved', getSquad(squads, tacticsSquadId(ctx)).name + ' formation & notes were saved.', 'tacticsRoom', ctx.kind === 'lobby' ? { lobbyId: ctx.id } : { squadId: ctx.id, planId: ctx.planId });
    toast('Tactics saved 📋');
  };
  const lockTacticsPlan = ctx => {
    updatePlan(ctx, p => ({ ...p, locked: true }));
    addNotif('tacticsLocked', 'Tactics locked', getSquad(squads, tacticsSquadId(ctx)).name + ' tactics are locked. The board is read-only for members.', 'tacticsRoom', ctx.kind === 'lobby' ? { lobbyId: ctx.id } : { squadId: ctx.id, planId: ctx.planId });
    toast('Tactics locked 🔒');
  };
  const unlockTacticsPlan = ctx => { updatePlan(ctx, p => ({ ...p, locked: false })); toast('Tactics unlocked — you can edit', 'info'); };
  // squad saved-formation lifecycle
  const newSquadPlan = (squadId, sport, name) => {
    const s = getSquad(squads, squadId); const id = uid('plan');
    const plan = { id, name: name || (sport + ' formation'), updatedAt: 'just now', ...buildPlan(s, sport) };
    setSquadPlans(sp => ({ ...sp, [squadId]: [plan, ...(sp[squadId] || [])] }));
    toast('New ' + sport + ' formation created');
    return id;
  };
  const duplicateSquadPlan = (squadId, planId) => {
    const src = (squadPlans[squadId] || []).find(p => p.id === planId); if (!src) return;
    const id = uid('plan');
    setSquadPlans(sp => ({ ...sp, [squadId]: [{ ...JSON.parse(JSON.stringify(src)), id, name: src.name + ' copy', locked: false, updatedAt: 'just now' }, ...(sp[squadId] || [])] }));
    toast('Formation duplicated');
  };
  const deleteSquadPlan = (squadId, planId) => { setSquadPlans(sp => ({ ...sp, [squadId]: (sp[squadId] || []).filter(p => p.id !== planId) })); toast('Formation deleted', 'info'); };

  // ── chat ──
  const getThread = id => threads[id];
  const ensureThread = (id, init) => setThreads(t => (t[id] ? t : { ...t, [id]: init }));
  // ── chat inbox / unread tracking ──
  const threadList = () => Object.values(threads).sort((a, b) => (b.messages.length) - (a.messages.length));
  const threadUnread = id => {
    const t = threads[id]; if (!t || !t.messages.length) return 0;
    const last = t.messages[t.messages.length - 1];
    if (last.userId === currentUser.id) return 0;
    return Math.max(0, t.messages.length - (chatReads[id] || 0));
  };
  const totalUnread = () => Object.keys(threads).reduce((n, id) => n + (threadUnread(id) > 0 ? 1 : 0), 0);
  const markChatRead = id => setChatReads(r => ({ ...r, [id]: threads[id] ? threads[id].messages.length : 0 }));
  const openChatList = () => go('chatList');
  const sendMessage = (threadId, text) => {
    setThreads(t => ({ ...t, [threadId]: { ...t[threadId], messages: [...t[threadId].messages, { id: uid('m'), userId: currentUser.id, text, at: 'now' }] } }));
    const th = threads[threadId];
    if (th && th.botId && Math.random() > 0.25) {
      const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
      setTimeout(() => setThreads(t => t[threadId] ? ({ ...t, [threadId]: { ...t[threadId], messages: [...t[threadId].messages, { id: uid('m'), userId: th.botId, text: reply, at: 'now' }] } }) : t), 900);
    }
  };
  const openDirectChat = userId => { const id = 'dm-' + userId; const u = getUser(userId); ensureThread(id, { id, type: 'direct', title: u.name, subtitle: '@' + u.username, botId: userId, messages: [{ id: uid('m'), userId, text: 'Hey! Up for a game this week?', at: '2:14 PM' }] }); go('chat', { threadId: id }); };
  const openSquadChat = squadId => { const id = 'sq-' + squadId; const s = getSquad(squads, squadId); ensureThread(id, { id, type: 'squad', title: s.name + ' · Squad', subtitle: s.members.length + ' members', botId: s.captainId, messages: [{ id: uid('m'), userId: s.captainId, text: 'Welcome to the squad chat 👋', at: '1:00 PM' }] }); go('chat', { threadId: id }); };
  const openCaptainChat = post => { const s = getSquad(squads, post.createdBy); const cap = s.captainId; const id = 'cap-' + cap; ensureThread(id, { id, type: 'captain', title: getUser(cap).name + ' (Captain)', subtitle: s.name, botId: cap, messages: [{ id: uid('m'), userId: cap, text: 'Captain here — what\'s up?', at: '3:20 PM' }] }); go('chat', { threadId: id }); };
  const openEventChat = e => { const id = 'ev-' + e.id; ensureThread(id, { id, type: 'event', title: e.title + ' · Chat', subtitle: e.location, botId: 'u-kencho', messages: [{ id: uid('m'), userId: 'u-kencho', text: 'Who else is registering for this? 🏆', at: '11:00 AM' }] }); go('chat', { threadId: id }); };
  const openCaptainChatSquad = squadId => { const s = getSquad(squads, squadId); const cap = s.captainId; const id = 'cap-' + cap; ensureThread(id, { id, type: 'captain', title: getUser(cap).name + ' · ' + s.name + ' Captain', subtitle: s.sport, botId: cap, messages: [{ id: uid('m'), userId: cap, text: 'Captain of ' + s.name + ' here. Want to set up a match?', at: 'now' }] }); go('chat', { threadId: id }); };

  // ── squads & challenger discovery ──
  const addSquad = ({ name, sport, location, skill, description }) => {
    const id = uid('sq');
    const squad = {
      id, name, handle: name.toLowerCase().replace(/[^a-z0-9]/g, ''), sport, location,
      skillLevel: skill, captainId: currentUser.id, wins: 0, losses: 0, draws: 0, rating: 5.0, followers: 0,
      description: description || 'New squad on ThangGo.',
      members: [{ userId: currentUser.id, role: rolesForSport(sport)[1] || 'Player', availability: 'Available', isCaptain: true }],
    };
    setSquads(ss => [squad, ...ss]);
    toast(name + ' squad created! 🎉');
    api.createSquad({ name, sport, location, skillLevel: skill, description: squad.description })
      .then(r => { if (r && r.squad) setSquads(ss => ss.map(x => x.id === id ? { ...x, backendId: r.squad.id } : x)); }).catch(() => {});
    return id;
  };
  const sendChallengeToSquad = (targetId, mySquadId, message) => {
    const target = getSquad(squads, targetId), mine = getSquad(squads, mySquadId);
    addNotif('request', 'Challenge sent', 'You challenged ' + target.name + ' to a ' + target.sport + ' match.', 'squadDetail', { id: targetId });
    toast('Challenge sent to ' + target.name + ' ⚡');
    setTimeout(() => {
      const lobby = makeLobby({ teamAId: mySquadId, teamBId: targetId, sport: mine.sport || target.sport });
      addNotif('accepted', target.name + ' accepted your challenge!', 'Your match lobby is ready — confirm lineup, split & tactics.', 'matchLobby', { id: lobby.id });
      toast(target.name + ' accepted — lobby created! 🎉');
    }, 1500);
  };

  // ── bookings ──
  const getBooking = id => bookings.find(b => b.id === id);
  const bookingConfirmed = id => { const b = getBooking(id); return b && b.status === 'Confirmed'; };
  const addBooking = payload => {
    const id = uid('bk');
    const b = { id, ...payload, status: 'Pending', paymentStatus: 'Pending', createdAt: 'just now', lobbyId: null, postId: null };
    setBookings(bs => [b, ...bs]);
    toast('Booking created — pay to confirm');
    // Persist server-side (resolves the local venue → real backend venue id) + reserves the slot.
    const venueId = resolveVenueId(payload.venueId);
    if (venueId) api.createBooking({
      venueId, sport: payload.sport, date: payload.date, slotStart: payload.slot || payload.slotStart || null,
      bookingType: payload.bookingType || payload.mode || 'Solo Booking', participants: payload.participants || 1,
      matchMode: payload.matchMode || payload.mode || null, split: payload.split || null,
      price: payload.price, duration: payload.duration || '1 hour', className: payload.className || null,
    }).then(r => { if (r && r.booking) setBookings(bs => bs.map(x => x.id === id ? { ...x, backendId: r.booking.id } : x)); }).catch(() => {});
    return b;
  };
  const payBooking = id => {
    setBookings(bs => bs.map(b => b.id === id ? { ...b, paymentStatus: 'Paid', status: 'Confirmed' } : b));
    const b = getBooking(id);
    if (b && b.lobbyId) updateLobby(b.lobbyId, { paymentStatus: 'Paid' });
    if (b && b.backendId) api.payBooking(b.backendId).catch(() => {});
    addNotif('payDone', 'Payment completed', 'Your booking is paid & confirmed.', 'profile', { tab: 'Bookings' });
    toast('Payment successful — booking confirmed ✅');
  };
  const cancelBooking = id => {
    const b = getBooking(id);
    setBookings(bs => bs.map(x => x.id === id ? { ...x, status: 'Cancelled', paymentStatus: x.paymentStatus === 'Paid' ? 'Refunded' : 'Cancelled' } : x));
    if (b && b.backendId) api.cancelBooking(b.backendId).catch(() => {});
    toast('Booking cancelled — slot released', 'info');
  };
  const createPostFromBooking = id => {
    const b = getBooking(id); if (!b) return;
    const v = getVenue(b.venueId);
    const pid = createPost({
      postType: 'Match Challenge', sport: b.sport, title: `${b.sport} challenge at ${v.name.split(' ')[0]}`,
      caption: `Booked ${v.name} for ${b.date}${b.slot ? ' ' + slotLabel(b.slot) : ''}. Looking for an opponent. ${b.split || '50/50 Team Split'}.`,
      teamSize: '5v5', preferredTime: `${b.date}${b.slot ? ', ' + b.slot : ''}`, venueId: b.venueId, venueName: v.name,
      paymentSplit: b.split || '50/50 Team Split', skillLevel: currentUser.skillLevel, status: 'Looking for Opponent', expiry: '3h 00m', bookingId: id,
    });
    setBookings(bs => bs.map(x => x.id === id ? { ...x, postId: pid } : x));
    toast('Match Challenge posted from your booking 🔥');
  };
  const lobbyFromBooking = id => {
    const b = getBooking(id); if (!b) return;
    if (b.lobbyId) { go('matchLobby', { id: b.lobbyId }); return; }
    if (b.postId) { toast('A lobby opens automatically when an opponent accepts your challenge', 'info'); go('postDetail', { id: b.postId, focus: 'interested' }); return; }
    createPostFromBooking(id);
  };
  const addMembership = ({ venueId, plan, period, price, startDate, memberName, pay }) => {
    const id = uid('mem');
    const m = { id, venueId, plan, period, price, startDate, memberName, status: pay ? 'Active' : 'Pending', paymentStatus: pay ? 'Paid' : 'Not Started', createdAt: 'just now' };
    setMemberships(ms => [m, ...ms]);
    addNotif(pay ? 'payDone' : 'payPending', pay ? 'Membership active' : 'Membership pending', `${plan} membership at ${getVenue(venueId).name}.`, 'profile', { tab: 'Memberships' });
    const bvid = resolveVenueId(venueId);
    if (bvid) api.applyMembership({ venueId: bvid, plan, period, price, startDate, memberName, pay: !!pay })
      .then(r => { if (r && r.membership) setMemberships(ms => ms.map(x => x.id === id ? { ...x, backendId: r.membership.id } : x)); }).catch(() => {});
    return m;
  };

  // ── social: likes / saves / shares ──
  const likeCount = (id, base) => (likes[id] ? likes[id].count : (base || 0));
  const isLiked = id => !!(likes[id] && likes[id].liked);
  const toggleLike = (id, base) => { setLikes(l => { const cur = l[id] || { count: base || 0, liked: false }; const liked = !cur.liked; return { ...l, [id]: { count: liked ? cur.count + 1 : cur.count - 1, liked } }; }); const bp = posts.find(p => p.id === id); if (bp && bp.backendId) api.likePost(bp.backendId).catch(() => {}); };
  const isSaved = id => !!savedItems[id];
  const toggleSave = id => setSavedItems(s => { const now = !s[id]; toast(now ? 'Saved ✓' : 'Removed from saved', 'info'); return { ...s, [id]: now }; });
  const shareCount = (id, base) => (base || 0) + (shares[id] || 0);
  const openShare = subject => setShareSubject(subject);
  const closeShare = () => setShareSubject(null);
  const sharePost = kind => {
    const s = shareSubject; if (!s) return;
    if (s.id) setShares(sh => ({ ...sh, [s.id]: (sh[s.id] || 0) + 1 }));
    if (kind === 'copy') toast('Link copied ✓');
    else if (kind === 'external') toast('Opening share…', 'info');
    else if (kind === 'squad') { const sq = squads.find(x => x.members.some(m => m.userId === currentUser.id)) || squads[0]; const tid = 'sq-' + sq.id; ensureThread(tid, { id: tid, type: 'squad', title: sq.name + ' · Squad', subtitle: sq.members.length + ' members', botId: sq.captainId, messages: [] }); sendMessage(tid, '🔗 Shared: ' + s.title); toast('Shared to ' + sq.name + ' chat ✓'); }
    else if (kind === 'lobby') { const l = lobbies[0]; if (l) { sendMessage(l.threadId, '🔗 Shared: ' + s.title); toast('Shared to match lobby ✓'); } else toast('No active lobby to share to', 'error'); }
    else if (kind === 'chat') { const tid = 'dm-u-kencho'; ensureThread(tid, { id: tid, type: 'direct', title: 'Kencho P.', subtitle: '@kencho10', botId: 'u-kencho', messages: [] }); sendMessage(tid, '🔗 Shared: ' + s.title); toast('Shared to chat ✓'); }
    closeShare();
  };

  // ── booking (legacy entry kept for compatibility) ──
  const confirmBooking = ({ venueId, sport, date, slot, mode, split }) => {
    const b = addBooking({ venueId, sport, date, slot, bookingType: mode || 'Solo Booking', participants: 1, matchMode: mode, split, price: getVenue(venueId).pricePerHour, duration: '1 hour' });
    go('bookingConfirm', { id: b.id });
  };

  // ── admin actions ──
  const logAction = (action, target, detail) => setActivityLog(l => [{ id: uid('lg'), admin: adminRole, action, target, detail: detail || '', at: 'just now' }, ...l]);
  const enterAdmin = role => { setAdminRole(role); setAdminMode(true); setAdminSection('Dashboard'); };
  const exitAdmin = () => setAdminMode(false);
  const adminGo = s => setAdminSection(s);
  const userStatusOf = id => (userMeta[id] && userMeta[id].status) || 'Active';
  const userVerified = id => !!(userMeta[id] && userMeta[id].verified);
  const setUserStatus = (id, status) => { setUserMeta(m => ({ ...m, [id]: { ...(m[id] || {}), status } })); logAction(status === 'Active' ? 'Reactivated user' : status + ' user', getUser(id).name); toast(getUser(id).name + ' → ' + status, status === 'Banned' || status === 'Suspended' ? 'error' : 'success'); };
  const verifyUser = id => { setUserMeta(m => ({ ...m, [id]: { ...(m[id] || {}), verified: !(m[id] && m[id].verified) } })); logAction('Toggled verification', getUser(id).name); toast('Verification updated', 'info'); };
  const venueStatusOf = id => (venueMeta[id] && venueMeta[id].status) || 'Approved';
  const setVenueStatus = (id, status) => { setVenueMeta(m => ({ ...m, [id]: { ...(m[id] || {}), status } })); logAction(status + ' venue', getVenue(id).name); toast(getVenue(id).name + ' → ' + status, status === 'Suspended' || status === 'Rejected' ? 'error' : 'success'); };
  const squadStatusOf = id => (squadMeta[id] && squadMeta[id].status) || 'Active';
  const setSquadStatus = (id, status) => { setSquadMeta(m => ({ ...m, [id]: { ...(m[id] || {}), status } })); logAction(status + ' squad', getSquad(squads, id).name); toast('Squad → ' + status, status === 'Suspended' ? 'error' : 'success'); };
  const postModOf = id => (postMeta[id] && postMeta[id].mod) || 'Active';
  const setPostMod = (id, mod) => { setPostMeta(m => ({ ...m, [id]: { ...(m[id] || {}), mod } })); logAction(mod + ' post', id); toast('Post → ' + mod, mod === 'Removed' || mod === 'Hidden' ? 'error' : 'success'); };
  const approveVenueApp = (appId, accept) => { const a = venueApplications.find(x => x.id === appId); setVenueApplications(vs => vs.map(x => x.id === appId ? { ...x, status: accept ? 'Approved' : 'Rejected' } : x)); logAction(accept ? 'Approved venue application' : 'Rejected venue application', a ? a.name : appId); toast(a ? a.name + ' ' + (accept ? 'approved ✅' : 'rejected') : 'Done', accept ? 'success' : 'error'); };
  const resolveReport = (id, status) => { setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r)); logAction('Report ' + status.toLowerCase(), id); toast('Report ' + status, status === 'Resolved' ? 'success' : 'info'); };
  const updateTicket = (id, patch) => { setTickets(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t)); logAction('Updated ticket', id, JSON.stringify(patch)); toast('Ticket updated', 'info'); };
  const adminRefund = id => { setPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'Refunded' } : p)); logAction('Refunded payment', id); toast('Payment refunded 💸', 'success'); };
  const adminMarkPaid = id => { setPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'Paid' } : p)); logAction('Marked payment paid', id); toast('Marked as paid ✅', 'success'); };
  const adminCancelBooking = id => { setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'Cancelled', paymentStatus: b.paymentStatus === 'Paid' ? 'Refunded' : 'Cancelled' } : b)); logAction('Cancelled booking', id); toast('Booking cancelled', 'info'); };
  const adminCompleteBooking = id => { setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'Completed' } : b)); logAction('Completed booking', id); toast('Booking completed', 'success'); };
  const adminSetMembership = (id, status) => { setMemberships(ms => ms.map(m => m.id === id ? { ...m, status } : m)); logAction('Membership ' + status.toLowerCase(), id); toast('Membership → ' + status, 'info'); };
  const adminForceCancelLobby = id => { updateLobby(id, { status: 'Cancelled' }); logAction('Force-cancelled lobby', id); toast('Lobby force-cancelled', 'error'); };
  const adminResolveDispute = id => { updateLobby(id, { status: 'Completed' }); logAction('Resolved lobby dispute', id); toast('Dispute resolved', 'success'); };
  const sendAdminAnnouncement = a => { setAnnouncements(list => [{ id: uid('an'), at: 'just now', ...a }, ...list]); logAction('Sent announcement', a.title, 'to ' + a.audience); toast('Announcement sent 📣', 'success'); };
  const adminRemovePost = id => { setPosts(ps => ps.filter(p => p.id !== id)); setPostMeta(m => ({ ...m, [id]: { mod: 'Removed' } })); logAction('Removed post', id); toast('Post removed', 'error'); };

  const app = {
    go, back, params: current.params, route: current.route,
    squads, posts, events, requests, comments, lobbies, notifications,
    isFollowing, followerCount, toggleFollow,
    addComment, addReply, likeComment,
    createPost, openRequest, closeRequest, requestPostId, sendRequest, acceptRequest, rejectRequest, openLobbyForPost,
    toggleReady, confirmLineups, acceptPaymentTerms, payLobby, lockMatch, completeMatch, cancelLobby,
    squadPlans, readPlan, updatePlan, canEditTactics, isEditor, toggleEditor,
    saveTacticsPlan, lockTacticsPlan, unlockTacticsPlan, newSquadPlan, duplicateSquadPlan, deleteSquadPlan,
    draftPlan, startDraftTactics, clearDraftTactics,
    addSquad, sendChallengeToSquad, openCaptainChatSquad,
    getThread, sendMessage, openDirectChat, openSquadChat, openCaptainChat, openEventChat,
    threads, threadList, threadUnread, totalUnread, markChatRead, openChatList,
    addNotif, markAllRead, openNotif,
    bookings, memberships, getBooking, addBooking, payBooking, cancelBooking, createPostFromBooking, lobbyFromBooking, addMembership,
    likeCount, isLiked, toggleLike, isSaved, toggleSave, shareCount, openShare, closeShare, sharePost, shareSubject,
    profile, updateProfile, followingCount, notifPrefs, setNotifPref, privacyPrefs, setPrivacyPref, msgPrivacy, setMsgPrivacy, theme, setTheme, logout,
    results, submitResult, confirmResult, disputeResult, postResult, payments, addPayment, settleMatch,
    navTo, confirmBooking, toast,
    // admin
    adminMode, adminRole, adminSection, enterAdmin, exitAdmin, adminGo, logAction, activityLog,
    userMeta, userStatusOf, userVerified, setUserStatus, verifyUser,
    venueMeta, venueStatusOf, setVenueStatus, squadStatusOf, setSquadStatus, postModOf, setPostMod, adminRemovePost,
    venueApplications, approveVenueApp, reports, resolveReport, tickets, updateTicket,
    adminRefund, adminMarkPaid, adminCancelBooking, adminCompleteBooking, adminSetMembership,
    adminForceCancelLobby, adminResolveDispute, announcements, sendAdminAnnouncement,
  };

  const renderScreen = () => {
    switch (current.route) {
      case 'home': return <HomeScreen app={app} />;
      case 'search': return <SearchScreen app={app} />;
      case 'create': return <CreatePostScreen app={app} />;
      case 'lobby': return <LobbyListScreen app={app} />;
      case 'profile': return <ProfileScreen app={app} />;
      case 'userProfile': return <ProfileScreen app={app} />;
      case 'connections': return <ConnectionsScreen app={app} />;
      case 'editProfile': return <EditProfileScreen app={app} />;
      case 'settings': return <SettingsScreen app={app} />;
      case 'settingsSub': return <SettingsSubScreen app={app} />;
      case 'settlement': return <SettlementScreen app={app} />;
      case 'postDetail': return <PostDetailScreen app={app} />;
      case 'squadDetail': return <SquadDetailScreen app={app} />;
      case 'squadTactics': return <SquadTacticsScreen app={app} />;
      case 'challengers': return <ChallengerDiscoveryScreen app={app} />;
      case 'createSquad': return <CreateSquadScreen app={app} />;
      case 'venueDetail': return <VenueDetailScreen app={app} />;
      case 'eventDetail': return <EventDetailScreen app={app} />;
      case 'booking': return <BookingScreen app={app} />;
      case 'bookingConfirm': return <BookingConfirmScreen app={app} />;
      case 'membership': return <MembershipScreen app={app} />;
      case 'matchLobby': return <MatchLobbyScreen app={app} />;
      case 'tacticsRoom': return <TacticsRoomScreen app={app} />;
      case 'chat': return <ChatScreen app={app} />;
      case 'chatList': return <ChatListScreen app={app} />;
      case 'notifications': return <NotificationsScreen app={app} />;
      case 'adminLogin': return <AdminLoginScreen app={app} />;
      default: return <HomeScreen app={app} />;
    }
  };

  // Admin mode takes over the full screen (web dashboard layout)
  if (adminMode) return <AdminShell app={app} />;

  return (
    <View style={S.appRoot}>
      <View style={S.appFrame}>
        {renderScreen()}
        {!HIDE_NAV.includes(current.route) ? (
          <BottomNav active={activeTab} onNav={navTo} onCreate={() => go('create')} lobbyActive={lobbies.some(l => !['Completed', 'Cancelled'].includes(l.status))} />
        ) : null}
        {requestPostId ? <RequestSheet app={app} /> : null}
        {shareSubject ? <ShareSheet app={app} /> : null}
        <Toast toast={toastState} />
      </View>
    </View>
  );
}

// ─── Splash + Login + App shell ───────────────────────────────────────────────
function Splash({ onDone }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(ring, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 1700);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={S.splash}>
      <LinearGradient colors={[C.navy, C.blueDeep, C.blue]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ scale }] }}>
        <View style={S.splashLogo}>
          <MaterialCommunityIcons name="soccer" size={44} color={C.navy} />
        </View>
        <Text style={S.splashName}>ThangGo</Text>
        <Text style={S.splashTag}>Bhutan's sports lobby · Kuzuzangpo!</Text>
      </Animated.View>
    </View>
  );
}

const authS = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 4, marginTop: 18, width: '100%' },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabOn: { backgroundColor: C.white },
  tabT: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  tabTOn: { color: C.navy },
  card: { width: '100%', gap: 10, marginTop: 14, marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10 },
  input: { flex: 1, fontSize: 15, color: C.white, fontWeight: '600', paddingVertical: 0 },
  err: { color: '#FFD2D2', fontSize: 13, fontWeight: '700', marginTop: 2 },
  guest: { marginTop: 14, paddingVertical: 8 },
  guestT: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 14.5, textDecorationLine: 'underline' },
  quickLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 9, alignSelf: 'center' },
  quickRow: { flexDirection: 'row', gap: 10, width: '100%' },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 13, paddingVertical: 12 },
  quickBtnT: { color: C.white, fontWeight: '800', fontSize: 13.5 },
  label: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

function AuthInput({ icon, ...props }) {
  return (
    <View style={authS.inputRow}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.7)" />
      <TextInput placeholderTextColor="rgba(255,255,255,0.5)" style={authS.input} {...props} />
    </View>
  );
}

// Real auth — talks to /api/auth (login / register / guest).
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login');           // 'login' | 'register'
  const [email, setEmail] = useState('ngawang@thanggo.bt');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const y = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(y, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);
  const run = async (fn, admin = false) => {
    setErr(null); setLoading(true);
    try { const r = await fn(); applyBackendUser(r.user); onAuthed(r.user, { admin }); }
    catch (e) { setErr(e.message || 'Something went wrong'); setLoading(false); }
  };
  const submit = () => {
    if (!email || !password) { setErr('Enter your email and password'); return; }
    if (mode === 'register' && !name) { setErr('Enter your name'); return; }
    run(() => (mode === 'register' ? api.register({ email, password, name }) : api.login(email, password)));
  };
  return (
    <View style={S.login}>
      <ImageBackground source={{ uri: IMG.hero }} style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['rgba(11,31,77,0.5)', 'rgba(11,31,77,0.96)']} style={StyleSheet.absoluteFill} />
      </ImageBackground>
      <SafeAreaView style={S.loginInner}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
          <Animated.View style={{ opacity, transform: [{ translateY: y }], width: '100%', alignItems: 'center' }}>
            <View style={S.loginLogo}><MaterialCommunityIcons name="soccer" size={30} color={C.navy} /></View>
            <Text style={S.loginTitle}>Kuzuzangpo! 👋</Text>
            <Text style={S.loginSub}>Book venues, build squads, challenge opponents and plan tactics — Bhutan's premium sports lobby.</Text>

            <View style={authS.tabs}>
              <Pressable onPress={() => { setMode('login'); setErr(null); }} style={[authS.tab, mode === 'login' && authS.tabOn]}><Text style={[authS.tabT, mode === 'login' && authS.tabTOn]}>Sign in</Text></Pressable>
              <Pressable onPress={() => { setMode('register'); setErr(null); }} style={[authS.tab, mode === 'register' && authS.tabOn]}><Text style={[authS.tabT, mode === 'register' && authS.tabTOn]}>Register</Text></Pressable>
            </View>

            <View style={authS.card}>
              {mode === 'register' ? <AuthInput icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" /> : null}
              <AuthInput icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <AuthInput icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              {err ? <Text style={authS.err}>{err}</Text> : null}
            </View>

            <AppButton title={loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'} icon={loading ? undefined : 'arrow-forward'} loading={loading} fill onPress={submit} />

            <Text style={authS.quickLabel}>Quick login</Text>
            <View style={authS.quickRow}>
              <Pressable disabled={loading} style={authS.quickBtn} onPress={() => run(() => api.login('ngawang@thanggo.bt', 'password'))}>
                <Ionicons name="person" size={15} color={C.white} /><Text style={authS.quickBtnT}>Player demo</Text>
              </Pressable>
              <Pressable disabled={loading} style={authS.quickBtn} onPress={() => run(() => api.login('admin@thanggo.bt', 'admin123'), true)}>
                <Ionicons name="shield-checkmark" size={15} color={C.white} /><Text style={authS.quickBtnT}>Admin demo</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => run(() => api.guest())} style={authS.guest}><Text style={authS.guestT}>Continue as guest</Text></Pressable>
            <Text style={S.loginFine}>Demo · ngawang@thanggo.bt / password   ·   admin@thanggo.bt / admin123</Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Profile completion — required after register / guest (POST /api/auth/complete-profile).
function ProfileSetupScreen({ user, onDone }) {
  const p = (user && user.profile) || {};
  const [name, setName] = useState(p.name || currentUser.name || '');
  const [location, setLocation] = useState(p.location || 'Thimphu');
  const [mainSport, setMainSport] = useState(p.mainSport || 'Futsal');
  const [skillLevel, setSkillLevel] = useState(p.skillLevel || 'Competitive');
  const [availability, setAvailability] = useState(p.availability || 'Evenings');
  const [playingStyle, setPlayingStyle] = useState(p.playingStyle || '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const SPORTS = ['Futsal', 'Football', 'Basketball', 'Volleyball', 'Cricket', 'Badminton', 'Tennis', 'Swimming', 'Fitness'];
  const SKILLS = ['Beginner', 'Intermediate', 'Competitive', 'Pro'];
  const AVAIL = ['Mornings', 'Evenings', 'Weekends', 'Available', 'Flexible'];
  const save = async () => {
    if (!name) { setErr('Please enter your name'); return; }
    setErr(null); setLoading(true);
    try {
      const r = await api.completeProfile({ name, location, mainSport, skillLevel, availability, playingStyle });
      applyBackendUser({ ...(user || {}), profile: { ...p, ...(r.profile || {}) } });
      onDone();
    } catch (e) { setErr(e.message || 'Could not save your profile'); setLoading(false); }
  };
  return (
    <View style={S.login}>
      <LinearGradient colors={[C.navy, C.blueDeep, C.blue]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 22 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 44, paddingTop: 8 }}>
          <View style={[S.loginLogo, { marginBottom: 14 }]}><MaterialCommunityIcons name="account-check" size={28} color={C.navy} /></View>
          <Text style={S.loginTitle}>Complete your profile</Text>
          <Text style={S.loginSub}>This is how other players, squads and venues will find you on ThangGo.</Text>
          <Text style={authS.label}>Name</Text>
          <AuthInput icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Text style={authS.label}>Location</Text>
          <AuthInput icon="location-outline" placeholder="e.g. Thimphu" value={location} onChangeText={setLocation} />
          <Text style={authS.label}>Main sport</Text>
          <View style={authS.chips}>{SPORTS.map((s) => <Chip key={s} label={s} active={mainSport === s} onPress={() => setMainSport(s)} dark />)}</View>
          <Text style={authS.label}>Skill level</Text>
          <View style={authS.chips}>{SKILLS.map((s) => <Chip key={s} label={s} active={skillLevel === s} onPress={() => setSkillLevel(s)} dark />)}</View>
          <Text style={authS.label}>Availability</Text>
          <View style={authS.chips}>{AVAIL.map((s) => <Chip key={s} label={s} active={availability === s} onPress={() => setAvailability(s)} dark />)}</View>
          <Text style={authS.label}>Preferred playing style</Text>
          <AuthInput icon="football-outline" placeholder="e.g. High press, Counter-attack" value={playingStyle} onChangeText={setPlayingStyle} />
          {err ? <Text style={[authS.err, { marginTop: 10 }]}>{err}</Text> : null}
          <View style={{ height: 20 }} />
          <AppButton title={loading ? 'Saving…' : 'Finish & enter ThangGo'} icon={loading ? undefined : 'checkmark'} loading={loading} fill onPress={save} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [stage, setStage] = useState('splash');        // splash | auth | setup | app
  const [authedUser, setAuthedUser] = useState(null);
  const [adminIntent, setAdminIntent] = useState(false); // set when signed in via the Admin quick-login

  const afterAuth = (user) => {
    try { connectSocket(); } catch { /* ignore */ }
    return user && user.profile && user.profile.completed ? 'app' : 'setup';
  };

  // On launch, restore any saved session and verify it's still valid.
  const restore = async () => {
    try {
      const saved = await loadSession();
      if (saved) {
        try { const me = await api.me(); applyBackendUser(me.user); setAuthedUser(me.user); return afterAuth(me.user); }
        catch { await api.clearSession(); }
      }
    } catch { /* ignore */ }
    return 'auth';
  };

  const onSplashDone = () => { restore().then(setStage); };
  const onAuthed = (user, opts = {}) => { setAuthedUser(user); setAdminIntent(!!opts.admin); setStage(afterAuth(user)); };
  const onSetupDone = () => setStage('app');
  const onLogout = async () => { try { disconnectSocket(); await api.logout(); } catch { /* ignore */ } setAuthedUser(null); setAdminIntent(false); setStage('auth'); };

  return (
    <SafeAreaView style={S.root}>
      <StatusBar style={stage === 'app' ? 'dark' : 'light'} />
      {stage === 'splash' ? <Splash onDone={onSplashDone} /> : null}
      {stage === 'auth' ? <AuthScreen onAuthed={onAuthed} /> : null}
      {stage === 'setup' ? <ProfileSetupScreen user={authedUser} onDone={onSetupDone} /> : null}
      {stage === 'app' ? <MainApp onLogout={onLogout} startAdmin={adminIntent} /> : null}
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════════
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  appRoot: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  appFrame: { flex: 1, width: '100%', maxWidth: IS_WIDE ? 460 : undefined, backgroundColor: C.bg },
  screen: { flex: 1, backgroundColor: C.bg },
  scrollPad: { paddingBottom: 110 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowGap: { flexDirection: 'row', gap: 10, marginTop: 10 },
  h1: { fontSize: 26, fontWeight: '900', color: C.navy, letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: '800', color: C.navy, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  subtle: { fontSize: 13, color: C.muted, marginTop: 2 },
  miniLabel: { fontSize: 12, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },

  // atoms
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 50, borderRadius: 15, paddingHorizontal: 18 },
  btnSmall: { height: 40, borderRadius: 12, paddingHorizontal: 12 },
  btnSec: { borderWidth: 1.5, borderColor: C.border },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { backgroundColor: '#C3CEEA' },
  btnText: { fontSize: 15, fontWeight: '800' },
  btnTextSmall: { fontSize: 13.5 },
  fillBtn: { alignSelf: 'stretch', marginTop: 4 },
  spinner: { },
  onlineDot: { position: 'absolute', backgroundColor: C.green, borderWidth: 2, borderColor: C.white },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 11, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, marginRight: 8 },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontSize: 13, fontWeight: '700', color: C.muted },
  chipTextActive: { color: C.white },
  chipDark: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: C.navyLine },
  chipDarkActive: { backgroundColor: C.lime, borderColor: C.lime },
  chipDarkText: { fontSize: 13, fontWeight: '700', color: C.mutedLight },
  chipDarkTextActive: { color: C.navy },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 22, marginBottom: 10 },
  secTitle: { fontSize: 17, fontWeight: '800', color: C.navy },
  secAction: { fontSize: 13, fontWeight: '700', color: C.blue },
  metaBox: { width: '47%', backgroundColor: C.bluePale, borderRadius: 12, padding: 10, marginBottom: 8 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  metaLabel: { fontSize: 10.5, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  metaValue: { fontSize: 13, fontWeight: '700', color: C.navy },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.navy },
  emptyText: { fontSize: 13.5, color: C.muted, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 54, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: C.card },
  topBarDark: { backgroundColor: 'transparent', borderBottomColor: 'transparent' },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bluePale },
  backBtnDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: C.navy },

  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingRight: 6 },
  iconBtnCount: { fontSize: 13, fontWeight: '700', color: C.muted },

  // input
  inputLabel: { fontSize: 13, fontWeight: '800', color: C.navy, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: C.card, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text },
  inputArea: { height: 96, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipWrapRow: { paddingVertical: 2, paddingRight: 16 },

  // donut
  donutHole: { position: 'absolute', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  donutPct: { fontSize: 17, fontWeight: '900', color: C.navy },
  donutSub: { fontSize: 10, color: C.muted, fontWeight: '700' },

  // toast
  toast: { position: 'absolute', top: 8, left: 14, right: 14, backgroundColor: C.navy, borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, zIndex: 999, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  toastIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  toastText: { flex: 1, color: C.white, fontSize: 13.5, fontWeight: '700' },

  // court / board
  boardWrap: { marginHorizontal: 16, height: 420, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0F7338', borderWidth: 1, borderColor: C.navyLine },
  courtFill: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  line: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.55)' },
  lineDim: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
  circle: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  box: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  hoop: { position: 'absolute', width: 26, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FF8A3D', backgroundColor: 'rgba(255,138,61,0.3)' },
  arc: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 999 },
  netLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#FFFFFF' },
  pitchRect: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(210,180,140,0.45)' },
  boardEndTop: { position: 'absolute', top: 8, alignSelf: 'center' },
  boardEndBottom: { position: 'absolute', bottom: 8, alignSelf: 'center' },
  boardEndText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  boardLockBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  boardLockText: { color: C.white, fontSize: 10, fontWeight: '800' },
  boardHint: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  boardHintText: { color: C.white, fontSize: 10, fontWeight: '700' },

  // marker
  marker: { position: 'absolute', alignItems: 'center' },
  markerRole: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, marginBottom: 3 },
  markerRoleText: { color: C.white, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 },
  markerCircle: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  markerDragging: { borderColor: C.lime, shadowOpacity: 0.5, shadowRadius: 10 },
  markerNum: { fontWeight: '900' },
  capBadge: { position: 'absolute', top: 14, right: -4, backgroundColor: C.lime, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.navy },
  capBadgeText: { fontSize: 9, fontWeight: '900', color: C.navy },
  markerName: { color: C.white, fontSize: 9, fontWeight: '700', marginTop: 2, maxWidth: 56, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },

  // sheet
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,13,38,0.5)', justifyContent: 'flex-end', zIndex: 200 },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30 },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: C.border, alignSelf: 'center', marginBottom: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 19, fontWeight: '900', color: C.navy },
  sheetSub: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 4 },

  // stories
  storiesRow: { paddingHorizontal: 16, gap: 16, paddingVertical: 4 },
  storyItem: { alignItems: 'center', width: 62 },
  storyRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontSize: 11.5, fontWeight: '700', color: C.navy, marginTop: 5 },

  // post card
  postCard: { backgroundColor: C.card, borderRadius: 20, padding: 14, marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: C.borderLight, shadowColor: C.navy, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  postHead: { flexDirection: 'row', alignItems: 'center' },
  postAuthor: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  postName: { fontSize: 14.5, fontWeight: '800', color: C.navy },
  postMeta: { fontSize: 12, color: C.muted, marginTop: 1 },
  followMini: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: C.blue },
  followMiniActive: { backgroundColor: C.bluePale },
  followMiniText: { fontSize: 12.5, fontWeight: '800', color: C.white },
  followMiniTextActive: { color: C.blue },
  postTypeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  postTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bluePale, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  postTypeText: { fontSize: 11.5, fontWeight: '800', color: C.blue },
  postTitle: { fontSize: 17, fontWeight: '900', color: C.navy, marginTop: 10, letterSpacing: -0.3 },
  postCaption: { fontSize: 14, color: C.textMid, lineHeight: 20, marginTop: 6 },
  postImage: { width: '100%', height: 200, borderRadius: 14, marginTop: 12, backgroundColor: C.bluePale },
  postMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  expiryText: { fontSize: 12.5, fontWeight: '700', color: '#A05F00' },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight },
  lineupRole: { fontSize: 10, fontWeight: '700', color: C.muted, marginTop: 1 },

  // comments
  commentRow: { flexDirection: 'row', marginTop: 16 },
  commentBubble: { backgroundColor: C.bluePale, borderRadius: 14, borderTopLeftRadius: 4, padding: 11 },
  commentName: { fontSize: 13, fontWeight: '800', color: C.navy },
  commentHandle: { fontSize: 12, fontWeight: '600', color: C.muted },
  commentText: { fontSize: 13.5, color: C.textMid, lineHeight: 19, marginTop: 2 },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6, paddingLeft: 4 },
  commentTime: { fontSize: 11.5, color: C.mutedLight, fontWeight: '600' },
  commentAction: { fontSize: 12, fontWeight: '800', color: C.muted },
  replyRow: { flexDirection: 'row', marginTop: 10, marginLeft: 4 },

  // nav
  navWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 24 : 14 },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 26, paddingHorizontal: 10, height: 66, width: CW - 32, maxWidth: 428, justifyContent: 'space-between', shadowColor: C.navy, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12, borderWidth: 1, borderColor: C.borderLight },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2 },
  navLabel: { fontSize: 10.5, fontWeight: '700', color: C.mutedLight },
  navLabelActive: { color: C.blue },
  navCenter: { marginHorizontal: 4 },
  navCenterBtn: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: C.blue, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  navLobbyDot: { position: 'absolute', top: -2, right: -3, width: 9, height: 9, borderRadius: 5, backgroundColor: C.green, borderWidth: 1.5, borderColor: C.white },

  // home
  homeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  greetSmall: { fontSize: 14, color: C.muted, fontWeight: '600' },
  greetBig: { fontSize: 24, fontWeight: '900', color: C.navy, letterSpacing: -0.5 },
  bell: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.borderLight },
  bellBadge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.bg },
  bellBadgeText: { color: C.white, fontSize: 10.5, fontWeight: '900' },
  hero: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden' },
  heroBg: { height: 196, justifyContent: 'flex-end' },
  heroOverlay: { padding: 18, borderRadius: 22 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: C.white, marginTop: 8, letterSpacing: -0.5, lineHeight: 28 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontWeight: '600' },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.lime, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, marginTop: 12 },
  heroBtnText: { fontSize: 13.5, fontWeight: '900', color: C.navy },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 18 },
  quickItem: { alignItems: 'center', width: '23%' },
  quickIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: C.navy, shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: C.navy, marginTop: 7, textAlign: 'center' },

  // search
  searchHead: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: C.bg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, height: 48, marginTop: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  segment: { flexDirection: 'row', backgroundColor: C.bluePale, borderRadius: 13, padding: 4, marginTop: 12 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  segItemActive: { backgroundColor: C.card, shadowColor: C.navy, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  segText: { fontSize: 13, fontWeight: '700', color: C.muted },
  segTextActive: { color: C.navy },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 0 },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  listTitle: { fontSize: 15, fontWeight: '800', color: C.navy },
  listSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  venueCard: { backgroundColor: C.card, borderRadius: 18, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.borderLight },
  venueImg: { width: '100%', height: 150, backgroundColor: C.bluePale },
  venueBody: { padding: 13 },
  venuePrice: { fontSize: 17, fontWeight: '900', color: C.blue },
  venuePriceUnit: { fontSize: 12, fontWeight: '700', color: C.muted },

  // create
  typeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 14, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  typeIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  // media upload
  mediaPreview: { borderRadius: 16, overflow: 'hidden', backgroundColor: C.bluePale },
  mediaPreviewImg: { width: '100%', height: 190 },
  videoBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(11,31,77,0.8)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  videoBadgeText: { color: C.white, fontSize: 11, fontWeight: '800' },
  mediaActions: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 8 },
  mediaActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(11,31,77,0.82)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10 },
  mediaActionText: { color: C.white, fontSize: 12, fontWeight: '800' },
  mediaAdd: { borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 22, alignItems: 'center', backgroundColor: C.card },
  mediaAddIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  mediaAddText: { fontSize: 14.5, fontWeight: '800', color: C.text },
  mediaAddSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  mediaGalleryPanel: { backgroundColor: C.card, borderRadius: 16, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.borderLight },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  mediaVideoTile: { width: (CW - 32 - 24 - 24) / 4, height: (CW - 32 - 24 - 24) / 4, borderRadius: 12, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center', gap: 3 },
  mediaTileText: { fontSize: 10, fontWeight: '700', color: C.blue },
  mediaThumb: { width: (CW - 32 - 24 - 24) / 4, height: (CW - 32 - 24 - 24) / 4, borderRadius: 12, backgroundColor: C.bluePale },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreInput: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' },
  scoreDash: { fontSize: 22, fontWeight: '900', color: C.muted },
  attachedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bluePale, borderRadius: 14, padding: 12 },
  attachedIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  createHint: { fontSize: 12, color: C.muted, lineHeight: 17, marginTop: 12, textAlign: 'center' },
  previewCard: { backgroundColor: C.card, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: C.borderLight },
  tacticsTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.blue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tacticsTagText: { color: C.white, fontSize: 10.5, fontWeight: '800' },
  viewTacticsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bluePale, borderRadius: 14, padding: 12, marginTop: 14 },
  // search / challenger
  segItemFlex: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  filterLabel: { fontSize: 12, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12, marginBottom: 6 },
  discoverCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bluePale, borderRadius: 16, padding: 13, marginBottom: 12 },
  discoverIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  oppCard: { backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.borderLight },
  oppRating: { fontSize: 14, fontWeight: '900', color: C.green },
  oppMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  oppActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },

  // detail
  detailHead: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  detailName: { fontSize: 18, fontWeight: '900', color: C.navy },
  followBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, backgroundColor: C.blue },
  followBtnActive: { backgroundColor: C.bluePale },
  followBtnText: { fontSize: 13.5, fontWeight: '800', color: C.white },
  followBtnTextActive: { color: C.blue },
  detailTitle: { fontSize: 22, fontWeight: '900', color: C.navy, marginTop: 8, letterSpacing: -0.5, lineHeight: 26 },
  detailCaption: { fontSize: 15, color: C.textMid, lineHeight: 22, marginTop: 10 },
  detailImage: { width: '100%', height: 220, borderRadius: 16, marginTop: 12, backgroundColor: C.bluePale },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  tabRow: { flexDirection: 'row', gap: 10, marginTop: 20, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  tabItem: { paddingBottom: 10, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: C.blue },
  tabText: { fontSize: 14.5, fontWeight: '800', color: C.muted },
  tabTextActive: { color: C.navy },
  requestCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: C.borderLight },
  requestMsg: { fontSize: 13.5, color: C.textMid, lineHeight: 20, marginTop: 10, backgroundColor: C.bluePale, padding: 11, borderRadius: 12 },
  composer: { borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: C.card, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 12 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerInput: { flex: 1, backgroundColor: C.bg, borderRadius: 18, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14.5, color: C.text, maxHeight: 100, borderWidth: 1, borderColor: C.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  replyChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bluePale, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 8 },
  replyChipText: { fontSize: 12.5, fontWeight: '700', color: C.blue },
  detailActions: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 16, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: C.card },

  // lobby
  lobbyCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, overflow: 'hidden' },
  lobbyCardBg: { padding: 16 },
  lobbyId: { fontSize: 11, fontWeight: '800', color: C.mutedLight, letterSpacing: 0.5 },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 14 },
  vsTeam: { alignItems: 'center', width: 110 },
  vsName: { fontSize: 13, fontWeight: '800', color: C.white, marginTop: 6, textAlign: 'center' },
  vsText: { fontSize: 16, fontWeight: '900', color: C.lime },
  lobbyMeta: { fontSize: 12, color: C.mutedLight, marginLeft: 5, fontWeight: '600' },
  chatMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },
  lobbyHero: { padding: 18, paddingTop: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  vsRowBig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 18 },
  vsNameBig: { fontSize: 14.5, fontWeight: '900', color: C.white, marginTop: 8, textAlign: 'center' },
  vsReady: { fontSize: 11.5, fontWeight: '700', color: C.lime, marginTop: 3 },
  vsTextBig: { fontSize: 24, fontWeight: '900', color: C.lime },
  vsSport: { fontSize: 11, fontWeight: '700', color: C.mutedLight, marginTop: 2 },
  lobbyVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  lobbyVenueText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  lineupCard: { backgroundColor: C.card, borderRadius: 16, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  lineupTeam: { flex: 1, fontSize: 14.5, fontWeight: '800', color: C.navy },
  payCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.borderLight },
  payCard2: { backgroundColor: C.card, borderRadius: 16, padding: 6, borderWidth: 1, borderColor: C.borderLight },
  payMode: { fontSize: 15, fontWeight: '800', color: C.navy },
  payAmount: { fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: '600' },
  legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12.5, color: C.textMid, fontWeight: '600', marginVertical: 1 },
  chatPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: C.borderLight },
  chatPreviewIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  tacticsCta: { marginTop: 14, borderRadius: 18, overflow: 'hidden' },
  tacticsCtaBg: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  tacticsCtaTitle: { fontSize: 16, fontWeight: '900', color: C.white },
  tacticsCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  checkBox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { backgroundColor: C.green, borderColor: C.green },
  checkLabel: { fontSize: 14, fontWeight: '700', color: C.muted },
  checkHint: { fontSize: 12, color: C.mutedLight, marginTop: 1 },
  checkAction: { fontSize: 12, fontWeight: '800', color: C.blue, backgroundColor: C.bluePale, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  lockedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, borderRadius: 14, padding: 14 },
  lockedBannerText: { fontSize: 15, fontWeight: '800', color: C.white },

  // tactics room
  tacticsScreen: { flex: 1, backgroundColor: C.navyDark },
  tacticsHead: { paddingHorizontal: 16, paddingBottom: 14 },
  tacticsKicker: { fontSize: 12, fontWeight: '900', color: C.lime, letterSpacing: 2 },
  tacticsTitle: { fontSize: 21, fontWeight: '900', color: C.white, marginTop: 4, marginBottom: 8 },
  tacticsLabel: { fontSize: 12, fontWeight: '800', color: C.mutedLight, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 10, paddingHorizontal: 16 },
  notesInput: { marginHorizontal: 16, backgroundColor: C.navyCard, borderRadius: 14, padding: 14, fontSize: 14, color: C.white, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: C.navyLine },
  squadGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 0 },
  squadGridItem: { width: '25%', alignItems: 'center', paddingVertical: 10 },
  squadGridName: { fontSize: 11.5, fontWeight: '700', color: C.white, marginTop: 5 },
  squadGridRole: { backgroundColor: C.navyCard, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  squadGridRoleText: { fontSize: 9.5, fontWeight: '800', color: C.lime },
  tacticsChat: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 18, backgroundColor: C.navyCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.navyLine },
  tacticsChatText: { flex: 1, fontSize: 13, color: C.mutedLight, fontWeight: '600' },
  tacticsControls: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 },
  lockedControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: C.navyCard, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.navyLine },
  lockedControlsText: { fontSize: 13, fontWeight: '700', color: C.mutedLight },
  permBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, backgroundColor: 'rgba(183,245,66,0.12)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(183,245,66,0.3)' },
  permBannerText: { flex: 1, fontSize: 12.5, color: C.lime, fontWeight: '700', lineHeight: 17 },
  lockedSport: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.navyCard, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.navyLine },
  lockedSportText: { fontSize: 13, fontWeight: '700', color: C.mutedLight },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 18, backgroundColor: C.navyCard, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: C.navyLine },
  permRowText: { flex: 1, fontSize: 13.5, fontWeight: '800', color: C.white },
  permPanel: { marginHorizontal: 16, marginTop: 8, backgroundColor: C.navyCard, borderRadius: 12, padding: 6, borderWidth: 1, borderColor: C.navyLine },
  permMember: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 8 },
  permMemberName: { flex: 1, fontSize: 13.5, fontWeight: '700', color: C.white },
  permPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.1)' },
  permPillOn: { backgroundColor: C.lime },
  permPillText: { fontSize: 12, fontWeight: '800', color: C.mutedLight },
  capToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  capToggleText: { fontSize: 14, fontWeight: '700', color: C.text },
  sheetDone: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: C.bluePale },
  sheetDoneText: { fontSize: 13, fontWeight: '800', color: C.blue },
  addGroupLabel: { fontSize: 12, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  addRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.borderLight },
  addBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  sportPick: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bluePale, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 4 },
  sportPickText: { fontSize: 14, fontWeight: '700', color: C.navy },
  warnIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFF3DC', alignItems: 'center', justifyContent: 'center' },
  squadTacticsHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.borderLight },
  permBannerLight: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bluePale, borderRadius: 12, padding: 12 },
  permBannerLightText: { flex: 1, fontSize: 12.5, color: C.blueDeep, fontWeight: '600', lineHeight: 17 },
  planCard: { backgroundColor: C.card, borderRadius: 16, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  planIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  planActions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight, paddingTop: 10 },
  planAction: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center', paddingVertical: 4 },
  planActionText: { fontSize: 12.5, fontWeight: '700', color: C.blue },

  // chat
  chatHeadSub: { fontSize: 12, color: C.muted, fontWeight: '600', marginLeft: 5 },
  chatBody: { padding: 14, paddingBottom: 8, flexGrow: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  msgBubble: { maxWidth: '76%', borderRadius: 16, padding: 11 },
  msgMine: { backgroundColor: C.blue, borderBottomRightRadius: 4 },
  msgTheirs: { backgroundColor: C.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.borderLight },
  msgAuthor: { fontSize: 12, fontWeight: '800', color: C.blue, marginBottom: 2 },
  msgText: { fontSize: 14.5, color: C.text, lineHeight: 20 },
  msgTime: { fontSize: 10, color: C.mutedLight, marginTop: 4, alignSelf: 'flex-end', fontWeight: '600' },
  quickRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: C.bg },
  quickReply: { backgroundColor: C.bluePale, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  quickReplyText: { fontSize: 13, fontWeight: '700', color: C.blue },

  // notifications
  markAll: { fontSize: 13, fontWeight: '800', color: C.blue },
  notifRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 13, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  notifUnread: { backgroundColor: '#F5F9FF', borderColor: C.border },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '800', color: C.navy },
  notifBody: { fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 17 },
  notifTime: { fontSize: 11, color: C.mutedLight, marginTop: 4, fontWeight: '600' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.blue, marginLeft: 8 },

  // profile
  profileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  profileHead: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  profileName: { fontSize: 22, fontWeight: '900', color: C.navy, marginTop: 12, letterSpacing: -0.5 },
  profileHandle: { fontSize: 13.5, color: C.muted, marginTop: 3, marginBottom: 12 },
  statBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, paddingVertical: 14, marginTop: 16, width: '100%', borderWidth: 1, borderColor: C.borderLight },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '900', color: C.navy },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '700' },
  statDivider: { width: 1, height: 28, backgroundColor: C.borderLight },
  profileTabs: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  profTab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  profTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  profTabText: { fontSize: 13.5, fontWeight: '800', color: C.muted },
  profTabTextActive: { color: C.white },
  miniPost: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  miniPostImg: { width: 60, height: 60, borderRadius: 12, backgroundColor: C.bluePale },
  miniPostNoImg: { alignItems: 'center', justifyContent: 'center' },
  matchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  matchResult: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  matchResultText: { fontSize: 17, fontWeight: '900', color: C.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  statCard: { width: '47%', backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.borderLight },
  statCardNum: { fontSize: 22, fontWeight: '900' },
  statCardLabel: { fontSize: 12.5, color: C.muted, marginTop: 3, fontWeight: '700' },
  highlightGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  highlightImg: { width: '47.5%', height: 130, borderRadius: 14, backgroundColor: C.bluePale },

  // squad / venue
  squadHero: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  squadAbout: { fontSize: 14, color: C.textMid, lineHeight: 21, paddingHorizontal: 16 },
  squadAbout2: { fontSize: 14, color: C.textMid, lineHeight: 21, paddingHorizontal: 16 },
  venueHeroImg: { width: '100%', height: 260, backgroundColor: C.bluePale },
  floatBack: { position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  floatFollow: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  facilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  facilityText: { fontSize: 14, color: C.textMid, fontWeight: '600' },
  reviewCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.borderLight },
  reviewText: { fontSize: 13.5, color: C.textMid, lineHeight: 20, marginTop: 8 },

  // booking
  bookingVenue: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: C.borderLight },
  bookingImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: C.bluePale },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bluePale, borderRadius: 12, padding: 12, marginTop: 16 },
  infoBannerText: { flex: 1, fontSize: 12.5, color: C.blueDeep, fontWeight: '600', lineHeight: 17 },
  summaryCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.borderLight },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  summaryK: { fontSize: 13.5, color: C.muted, fontWeight: '600' },
  summaryV: { fontSize: 13.5, color: C.navy, fontWeight: '700' },

  // booking — date + slots
  dateCell: { width: 54, paddingVertical: 10, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  dateCellOn: { backgroundColor: C.blue, borderColor: C.blue },
  dateDow: { fontSize: 11, fontWeight: '700', color: C.muted },
  dateNum: { fontSize: 18, fontWeight: '900', color: C.text, marginTop: 2 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  slotCell: { width: (CW - 32 - 8) / 2, backgroundColor: C.card, borderRadius: 13, padding: 11, borderWidth: 1, borderColor: C.border },
  slotCellOn: { backgroundColor: C.blue, borderColor: C.blue },
  slotCellDisabled: { backgroundColor: C.bg, borderColor: C.borderLight, opacity: 0.7 },
  slotTime: { fontSize: 13.5, fontWeight: '800', color: C.text },
  slotStatusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, marginTop: 6 },
  slotStatusText: { fontSize: 10.5, fontWeight: '800' },
  helperLine: { fontSize: 12.5, color: C.muted, marginTop: 6, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 4 },
  stepperBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },
  stepperVal: { fontSize: 19, fontWeight: '900', color: C.text, minWidth: 28, textAlign: 'center' },
  // calendar
  calendar: { backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.borderLight, marginTop: 4 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calNav: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },
  calMonth: { fontSize: 15, fontWeight: '800', color: C.text },
  calDowRow: { flexDirection: 'row' },
  calDow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '700', color: C.muted, marginBottom: 4 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  calCellOn: { backgroundColor: C.blue },
  calCellToday: { backgroundColor: C.bluePale },
  calCellText: { fontSize: 14, fontWeight: '700', color: C.text },
  // gallery
  galleryBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(11,31,77,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  galleryBtnText: { color: C.white, fontSize: 11.5, fontWeight: '800' },
  galleryWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 400 },
  galleryImg: { width: CW, height: '100%' },
  galleryClose: { position: 'absolute', top: Platform.OS === 'web' ? 16 : 54, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  galleryCount: { position: 'absolute', top: Platform.OS === 'web' ? 24 : 62, alignSelf: 'center', color: C.white, fontSize: 14, fontWeight: '800' },
  galleryDots: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  // profile extras
  profileBio: { fontSize: 13.5, color: C.textMid, textAlign: 'center', lineHeight: 19, marginTop: 12, paddingHorizontal: 8 },
  matchCard: { backgroundColor: C.card, borderRadius: 16, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  payIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  linkSmall: { fontSize: 12, fontWeight: '800', color: C.blue },
  photoPick: { width: 56, height: 56, borderRadius: 28, marginRight: 4, borderWidth: 2, borderColor: 'transparent' },
  photoPickOn: { borderColor: C.blue },
  // settings + toggle
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.borderLight },
  settingIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingLabel: { flex: 1, fontSize: 14.5, fontWeight: '700', color: C.text },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleKnob: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  threadTypeDot: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.card },
  threadTime: { fontSize: 11, color: C.mutedLight, fontWeight: '600' },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginTop: 5 },
  unreadBadgeText: { color: C.white, fontSize: 11, fontWeight: '800' },

  // ── admin ──
  adminLogin: { flex: 1, backgroundColor: C.navy },
  adminLoginInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  adminLoginBack: { position: 'absolute', top: Platform.OS === 'web' ? 16 : 50, left: 16, width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  adminLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  adminLoginTitle: { fontSize: 26, fontWeight: '900', color: C.white },
  adminLoginSub: { fontSize: 13.5, color: C.mutedLight, marginTop: 4, marginBottom: 18 },
  adminLoginCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, width: '100%', maxWidth: 460 },
  adminLoginFine: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 16 },
  adminRoot: { flex: 1, backgroundColor: C.bg },
  aSidebar: { width: 230, backgroundColor: C.navy, paddingTop: Platform.OS === 'web' ? 14 : 8, paddingHorizontal: 10 },
  aSidebarDrawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 250, zIndex: 60, paddingTop: 50 },
  aBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 14 },
  aBrandLogo: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  aBrandText: { color: C.white, fontSize: 15, fontWeight: '900' },
  aNavItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, marginBottom: 2 },
  aNavItemOn: { backgroundColor: C.blue },
  aNavText: { fontSize: 13.5, fontWeight: '700', color: C.mutedLight },
  aTopbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'web' ? 12 : 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  aHamb: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },
  aTopTitle: { fontSize: 18, fontWeight: '900', color: C.text },
  aTopBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },
  aContent: { padding: 16 },
  aDrawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,13,38,0.5)', zIndex: 55, flexDirection: 'row' },
  aStatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  aStat: { width: ADMIN_WIDE ? 180 : (CW - 32 - 10) / 2, backgroundColor: C.card, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: C.borderLight },
  aStatIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  aStatValue: { fontSize: 21, fontWeight: '900', color: C.text },
  aStatLabel: { fontSize: 11.5, color: C.muted, fontWeight: '600', marginTop: 2 },
  aChartRow: { flexDirection: ADMIN_WIDE ? 'row' : 'column', gap: 10, marginTop: 12 },
  aChart: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.borderLight, marginBottom: ADMIN_WIDE ? 0 : 10 },
  aChartTitle: { fontSize: 13.5, fontWeight: '800', color: C.text, marginBottom: 12 },
  aChartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6 },
  aBarCol: { flex: 1, alignItems: 'center' },
  aBarTrack: { width: '70%', height: 90, backgroundColor: C.bg, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  aBarFill: { width: '100%', borderRadius: 6 },
  aBarLabel: { fontSize: 9.5, color: C.muted, fontWeight: '700', marginTop: 4 },
  aStackBar: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden' },
  aLegend: { fontSize: 11.5, color: C.textMid, fontWeight: '600' },
  aSecHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aSecTitle: { fontSize: 20, fontWeight: '900', color: C.text },
  aSecTitle2: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: 20, marginBottom: 8 },
  aSecSub: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 8 },
  aSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: Platform.OS === 'web' ? 9 : 11, marginTop: 8 },
  aSearchInput: { flex: 1, fontSize: 14.5, color: C.text },
  aCount: { fontSize: 12, color: C.muted, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  aRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 11, marginBottom: 8, borderWidth: 1, borderColor: C.borderLight },
  aRowMenu: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aThumb: { width: 42, height: 42, borderRadius: 11, backgroundColor: C.bluePale },
  aRowTitle: { fontSize: 14.5, fontWeight: '800', color: C.text },
  aRowSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  aAction: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  aActionText: { fontSize: 14.5, fontWeight: '700', color: C.text },
  aQuickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  aQuick: { width: ADMIN_WIDE ? 150 : (CW - 32 - 10) / 2, backgroundColor: C.card, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: C.borderLight, flexDirection: 'row', alignItems: 'center', gap: 10 },
  aQuickIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },
  aQuickText: { fontSize: 12.5, fontWeight: '700', color: C.text, flex: 1 },
  aPanel: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.borderLight, marginBottom: 12 },
  aPanelTitle: { fontSize: 14.5, fontWeight: '800', color: C.text, marginBottom: 10 },
  aAppRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.borderLight },
  aDetailImg: { width: '100%', height: 170, borderRadius: 14, backgroundColor: C.bluePale },
  // venue detail extras
  floatRight: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  floatBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  imgDots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  imgDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  imgDotOn: { backgroundColor: C.white, width: 18 },
  mapBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bluePale, borderRadius: 14, padding: 14, marginTop: 14, overflow: 'hidden' },
  mapText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: C.navy },
  mapPin: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  hoursText: { fontSize: 13.5, color: C.textMid, fontWeight: '600', marginLeft: 6, marginTop: 10 },
  planRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: C.borderLight },
  classRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.borderLight },
  classIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planSelect: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: C.border },
  planSelectOn: { borderColor: C.blue, backgroundColor: C.bluePale },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.blue },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.blue },
  // booking confirm
  confirmTick: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmTitle: { fontSize: 23, fontWeight: '900', color: C.text },
  confirmSub: { fontSize: 13.5, color: C.muted, marginTop: 4 },
  paidBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, borderRadius: 15, paddingVertical: 14 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: C.borderLight },
  bookingThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: C.bluePale },
  // share sheet
  shareRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.borderLight },
  shareIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bluePale, alignItems: 'center', justifyContent: 'center' },

  // splash / login
  splash: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 92, height: 92, borderRadius: 28, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', shadowColor: C.lime, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  splashName: { fontSize: 34, fontWeight: '900', color: C.white, marginTop: 18, letterSpacing: -1 },
  splashTag: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '600' },
  login: { ...StyleSheet.absoluteFillObject },
  loginInner: { flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 40 },
  loginLogo: { width: 60, height: 60, borderRadius: 18, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  loginTitle: { fontSize: 30, fontWeight: '900', color: C.white, letterSpacing: -0.5, alignSelf: 'flex-start' },
  loginSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 10, lineHeight: 22, alignSelf: 'flex-start' },
  loginCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, marginVertical: 20, width: '100%', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginField: { fontSize: 14.5, color: C.white, fontWeight: '600' },
  loginFine: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 16, textAlign: 'center' },
});

