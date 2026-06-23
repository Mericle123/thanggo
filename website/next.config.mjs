/** @type {import('next').NextConfig} */
const nextConfig = {
  // StrictMode double-invokes effects in dev, which can register GSAP ScrollTriggers
  // twice. We rely on gsap.context cleanup, but disabling it keeps dev scroll behaviour
  // identical to production and avoids duplicate pins.
  reactStrictMode: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;
