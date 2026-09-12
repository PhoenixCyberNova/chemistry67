export function ChemLab() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hex-grid absolute inset-x-0 top-0 h-[720px] opacity-90" />
      <div className="grain absolute inset-0 opacity-40" />
      <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_70%_60%_at_60%_-10%,rgba(47,212,192,0.14),transparent_65%)]" />
      <div className="lab-glow absolute -right-16 top-10 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute -left-20 top-72 h-52 w-52 rounded-full bg-gold/8 blur-3xl" />
      <svg
        className="float-slow absolute right-[-14%] top-4 h-[300px] w-[300px] opacity-[0.55] sm:right-[2%] sm:h-[380px] sm:w-[380px]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="19" fill="#2fd4c0" fillOpacity="0.3" />
        <circle cx="100" cy="100" r="6.5" fill="#e2c284" />
        <g className="orbit-ring">
          <ellipse cx="100" cy="100" rx="74" ry="28" stroke="#2fd4c0" strokeOpacity="0.4" />
          <circle cx="174" cy="100" r="5" fill="#e2c284" />
        </g>
        <g className="orbit-ring-rev">
          <ellipse cx="100" cy="100" rx="52" ry="80" stroke="#7dd3fc" strokeOpacity="0.26" />
          <circle cx="100" cy="20" r="4" fill="#2fd4c0" />
        </g>
      </svg>
    </div>
  );
}
