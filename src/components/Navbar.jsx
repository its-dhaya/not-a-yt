import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Navbar({ user }) {
  const [signingOut, setSigningOut] = useState(false);
  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-8 py-4
                    bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800"
    >
      <span className="font-museo text-emerald-400 text-2xl font-bold tracking-wide">
        NOT A YT
      </span>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-zinc-500 hidden sm:block">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="text-[12px] font-medium border border-zinc-700 text-zinc-300 px-4 py-2 rounded-xl
                       hover:border-emerald-400 hover:text-emerald-400 transition-colors disabled:opacity-40"
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}
    </nav>
  );
}
