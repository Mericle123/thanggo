export default function SectionDivider({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <div className={`h-12 overflow-hidden ${flip ? 'rotate-180' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="h-full w-full">
        <path fill={color} d="M0,64 C240,16 480,16 720,56 C960,96 1200,96 1440,40 L1440,96 L0,96 Z" />
      </svg>
    </div>
  );
}
