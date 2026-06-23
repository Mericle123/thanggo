// ThangGo landing — cinematic sport story + full marketing site that sells the app.
import SmoothScroll from '@/components/SmoothScroll';
import Nav from '@/components/Nav';
import SportStory from '@/components/SportStory';
import Marketing from '@/components/Marketing';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <SmoothScroll>
      {/* Force the dark base regardless of the global light theme tokens. */}
      <style>{'html,body{background:#08090C;color:#fff;}'}</style>
      <Nav />
      <main className="relative bg-[#08090C]">
        <SportStory />
        <Marketing />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
