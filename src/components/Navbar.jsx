import logo from "../assets/not-a-yt.png";

function Navbar() {
  return (
    <nav className="navbar">
      <img
        src={logo}
        alt="NOT A YT"
        className="navbar-logo"
        style={{ height: "28px" }}
      />
    </nav>
  );
}

export default Navbar;
