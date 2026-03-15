export const Icon = ({ d, size = 16, className = "", fill = "none", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

export const Tip = ({ label, children, side = "bottom", disabled = false }) => {
  if (disabled || !label) return children;
  return (
    <div className="group/tip relative inline-flex">
      {children}
      <div className={`pointer-events-none absolute z-[9999] whitespace-nowrap
                      bg-zinc-800 text-zinc-100 text-[10px] font-medium px-2 py-1 rounded-md
                      border border-zinc-700 shadow-xl
                      opacity-0 group-hover/tip:opacity-100 transition-opacity delay-300
                      ${side === "bottom" ? "top-full mt-2 left-1/2 -translate-x-1/2"
                        : side === "top"   ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
                        : side === "right" ? "left-full ml-2 top-1/2 -translate-y-1/2"
                        :                   "right-full mr-2 top-1/2 -translate-y-1/2"}`}>
        {label}
      </div>
    </div>
  );
};

export const KBD = ({ k }) => (
  <span className="ml-auto text-[9px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded font-mono border border-zinc-700/50">{k}</span>
);

/* divider used in context menus / toolbars */
export const Sep = ({ vertical = false }) =>
  vertical
    ? <div className="w-px h-5 bg-zinc-700/60 mx-1 shrink-0" />
    : <div className="h-px bg-zinc-700/50 my-1 mx-1.5" />;
