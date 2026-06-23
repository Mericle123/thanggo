'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const SPORTS = [
  {
    title: 'Basketball',
    text: 'Hit the court. Feel the rhythm. Make every shot count.',
    emoji: '🏀',
    image: '/sports/basketball.jpg',
    accent: '#fb923c',
  },
  {
    title: 'Tennis',
    text: 'Focus. Swing. Win. Every point matters.',
    emoji: '🎾',
    image: '/sports/tennis.jpg',
    accent: '#befa18',
  },
  {
    title: 'Cricket',
    text: 'Strategy. Skill. Sixes. Play like a champion.',
    emoji: '🏏',
    image: '/sports/cricket.jpg',
    accent: '#fb4d56',
  },
  {
    title: 'Volleyball',
    text: 'Set it. Spike it. Teamwork makes it unstoppable.',
    emoji: '🏐',
    image: '/sports/volleyball.jpg',
    accent: '#5b8cff',
  },
  {
    title: 'Taekwondo',
    text: 'Discipline. Focus. Power. Train hard. Stay stronger.',
    emoji: '🥋',
    image: '/sports/taekwondo.jpg',
    accent: '#b866ff',
  },
  {
    title: 'Boxing',
    text: 'Punch with purpose. Train like a warrior.',
    emoji: '🥊',
    image: '/sports/boxing.jpg',
    accent: '#ff3d4f',
  },
  {
    title: 'Swimming',
    text: 'Dive in. Push limits. Strength flows within.',
    emoji: '🏊',
    image: '/sports/swimming.jpg',
    accent: '#22d3ee',
  },
  {
    title: 'Gym & Fitness',
    text: 'Stronger every day. Better than yesterday.',
    emoji: '🏋️',
    image: '/sports/gym.jpg',
    accent: '#fbbf24',
  },
  {
    title: 'Run Club',
    text: 'Run together. Grow together. Every step counts.',
    emoji: '🏃',
    image: '/sports/running.jpg',
    accent: '#a3e635',
  },
];

function SportRow({ sport, index }: { sport: (typeof SPORTS)[number]; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.02, 1.12]);
  const contentX = useTransform(scrollYProgress, [0, 0.45, 1], [-28, 0, 18]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.82, 1], [0.55, 1, 1, 0.65]);

  return (
    <motion.article
      ref={ref}
      style={{ opacity }}
      className="group relative min-h-[128px] overflow-hidden border-t border-white/10 bg-ink text-white sm:min-h-[146px] lg:min-h-[160px]"
    >
      <motion.img
        src={sport.image}
        alt=""
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-y-[-16%] right-0 h-[132%] w-full object-cover opacity-[0.68] sm:w-[72%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#020403_0%,rgba(2,4,3,0.95)_25%,rgba(2,4,3,0.56)_58%,rgba(2,4,3,0.88)_100%)]" />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, ${sport.accent}22, transparent 42%)` }} />

      <div className="relative z-10 mx-auto grid h-full max-w-wide grid-cols-[4.5rem_1fr_auto] items-center gap-4 px-6 py-6 sm:grid-cols-[5rem_1fr_auto]">
        <motion.div
          style={{ x: contentX, backgroundColor: `${sport.accent}22`, color: sport.accent }}
          className="grid h-16 w-16 place-items-center rounded-full text-3xl sm:h-20 sm:w-20"
        >
          {sport.emoji}
        </motion.div>
        <motion.div style={{ x: contentX }}>
          <h3 className="font-display text-2xl font-extrabold sm:text-3xl">{sport.title}</h3>
          <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/82">{sport.text}</p>
        </motion.div>
        <span className="font-display text-2xl font-bold sm:text-3xl" style={{ color: sport.accent }}>
          {String(index + 2).padStart(2, '0')}
        </span>
      </div>
    </motion.article>
  );
}

export default function SportMorph() {
  return (
    <section id="sports" className="relative overflow-hidden bg-ink text-white">
      <div className="sticky top-0 z-20 border-y border-white/10 bg-ink/88 px-6 py-7 backdrop-blur-xl">
        <div className="mx-auto flex max-w-wide flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-extrabold uppercase text-lime">Scroll the game list</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">
              One App. <span className="text-lime">Every Sport.</span>
            </h2>
          </div>
          <a href="#download" className="btn-grad !bg-none !bg-lime !px-6 !py-3 !text-ink">
            Join ThangGo Today
          </a>
        </div>
      </div>

      <div>
        {SPORTS.map((sport, index) => (
          <SportRow key={sport.title} sport={sport} index={index} />
        ))}
      </div>
    </section>
  );
}
