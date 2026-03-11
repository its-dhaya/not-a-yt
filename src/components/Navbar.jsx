import { useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/not-a-yt.png";

function Navbar({ user }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  return (
    <nav className="navbar">
      <img
        src={logo}
        alt="NOT A YT"
        className="navbar-logo"
        style={{ height: "28px" }}
      />
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontSize: "13px",
              color: "var(--muted-md)",
              fontFamily: "var(--font-body)",
            }}
          >
            {user.email}
          </span>
          <button
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "7px 16px" }}
            onClick={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
