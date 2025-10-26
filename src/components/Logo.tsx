export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-2xl font-bold tracking-wide" style={{ 
        fontFamily: "'Arial Black', 'Arial', 'Helvetica', sans-serif",
        letterSpacing: "0.08em",
        fontWeight: 900
      }}>
        <span className="text-[#A8A8A8]">SVENSKA </span>
        <span className="text-[#F58241]">BRO</span>
      </span>
      <span className="text-[9px] text-gray-600 tracking-wider mt-0.5" style={{
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        letterSpacing: "0.15em",
        textTransform: "uppercase"
      }}>
        Aktiebolag
      </span>
    </div>
  );
}