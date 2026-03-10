import React from "react";
import logo from "../assets/not-a-yt.png";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="logo" className="logo" />
      </div>

      <div className="navbar-right"></div>
    </nav>
  );
}

export default Navbar;
