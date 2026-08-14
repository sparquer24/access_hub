import React, { useEffect, useState } from "react";

/**
 * Full-bleed hero background — images stretch to cover 100% width x 100%
 * height of the hero section (like a laptop wallpaper). A layered overlay
 * keeps the text and illustration readable on top.
 */

const SLIDES = [
  { src: "/images/skyline_access_gate.png",      alt: "Office skyline access gate" },
  { src: "/images/camera_surveillance_grid.png",  alt: "Security camera sensor grid" },
  { src: "/images/access_badge_network.png",      alt: "Access badge network" },
  { src: "/images/global_network_map.png",        alt: "Global network map" },
  { src: "/images/office_lobby_turnstile.png",    alt: "Office lobby turnstile" },
];

const SLIDE_INTERVAL_MS = 5000;

const smokeCSS = `
  @keyframes smokeRise1 {
    0%,100% { transform: translate(0,0)     scale(1);    opacity:0.20; }
    45%     { transform: translate(40px,-30px) scale(1.12); opacity:0.32; }
  }
  @keyframes smokeRise2 {
    0%,100% { transform: translate(0,0)      scale(1.1);  opacity:0.16; }
    55%     { transform: translate(-30px,-20px) scale(1.22); opacity:0.26; }
  }
  @keyframes smokeRise3 {
    0%,100% { transform: translate(0,0)    scale(1);    opacity:0.14; }
    60%     { transform: translate(50px,15px) scale(1.18); opacity:0.22; }
  }
  @keyframes smokeRise4 {
    0%,100% { transform: translate(0,0)      scale(1.05); opacity:0.12; }
    50%     { transform: translate(-40px,-25px) scale(1.2);  opacity:0.20; }
  }
  .sp1 { animation: smokeRise1  9s ease-in-out infinite; }
  .sp2 { animation: smokeRise2 13s ease-in-out infinite 2s; }
  .sp3 { animation: smokeRise3 11s ease-in-out infinite 4s; }
  .sp4 { animation: smokeRise4 15s ease-in-out infinite 7s; }
`;

const HeroBackgroundSlides = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % SLIDES.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{smokeCSS}</style>

      {/* ── 1. Full-bleed image slides ── cover 100% width × 100% height */}
      {SLIDES.map((slide, i) => (
        <img
          key={i}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1800ms] ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          style={{ minWidth: "100%", minHeight: "100%" }}
        />
      ))}

      {/* ── 2. Animated smoke / mist puffs on top of image ── */}
      <div className="sp1 absolute" style={{ top:"8%",  left:"8%",  width:"40%", height:"45%",
        background:"radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, rgba(204,251,241,0.10) 50%, transparent 75%)",
        borderRadius:"50%", filter:"blur(32px)" }} />
      <div className="sp2 absolute" style={{ top:"35%", left:"25%", width:"35%", height:"40%",
        background:"radial-gradient(ellipse, rgba(240,253,250,0.18) 0%, rgba(153,246,228,0.08) 55%, transparent 75%)",
        borderRadius:"50%", filter:"blur(38px)" }} />
      <div className="sp3 absolute" style={{ bottom:"10%", right:"15%", width:"38%", height:"40%",
        background:"radial-gradient(ellipse, rgba(255,255,255,0.16) 0%, rgba(204,251,241,0.07) 60%, transparent 80%)",
        borderRadius:"50%", filter:"blur(30px)" }} />
      <div className="sp4 absolute" style={{ top:"5%",  right:"8%",  width:"30%", height:"35%",
        background:"radial-gradient(ellipse, rgba(240,253,250,0.14) 0%, rgba(20,184,166,0.06) 60%, transparent 80%)",
        borderRadius:"50%", filter:"blur(40px)" }} />

      {/* ── 3. Overlay layers ── keep text + illustration readable ── */}
      {/* Dark teal base tint so image isnt too bright */}
      <div className="absolute inset-0" style={{
        background: "rgba(15, 23, 42, 0.42)"
      }} />
      {/* Left column: lighter so heading text pops on dark bg */}
      <div className="absolute inset-y-0 left-0 w-1/2" style={{
        background: "linear-gradient(to right, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.25) 100%)"
      }} />
      {/* Bottom fade for stats row */}
      <div className="absolute inset-x-0 bottom-0 h-28" style={{
        background: "linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 100%)"
      }} />

      {/* ── 4. Dot indicators ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-teal-400" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBackgroundSlides;
