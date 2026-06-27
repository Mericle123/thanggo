// ThangGo landing — cinematic sport story + full marketing site that sells the app.
import SmoothScroll from '@/components/SmoothScroll';
import Nav from '@/components/Nav';
import SportStory from '@/components/SportStory';
import Marketing from '@/components/Marketing';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <SmoothScroll>
      <Nav />
      <main className="relative bg-[color:var(--bg)]">
        <SportStory />
        <Marketing />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
