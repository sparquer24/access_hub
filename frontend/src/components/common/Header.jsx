import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import sparquerLogo from "../../images/logo.svg";
import "../../styles/Header.css";
import { profileAPI } from "../../services/api";

function Header() {

  const [showLogout, setShowLogout] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchUser() {
      try {
        const resp = await profileAPI.me();
        const name = resp.data?.full_name || "";
        setUserName(name);
        setUserInitials(
          name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase()
            : ""
        );
      } catch {
        setUserName("");
        setUserInitials("");
      }
    }
    fetchUser();
  }, []);

  const handleNavigation = (section) => {
    console.log(`Navigate to ${section}`);
  };

  const handleLogoutClick = () => {
    setShowLogout((prev) => !prev);
  };

  const handleLogoutConfirm = () => {
    setShowLogout(false);
    navigate("/");
  };

  const hideLogout = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-2xl border-b border-purple-400/30 backdrop-blur-sm z-1000">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer hover:scale-110 transition-transform duration-300"
          onClick={() => navigate("/")}
        >
          <img src={sparquerLogo} alt="Sparquer" className="h-10 w-auto drop-shadow-lg" />
        </div>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            className="relative text-gray-50 text-sm font-semibold px-4 py-2 transition-all duration-300 hover:text-white group"
            onClick={() => handleNavigation("feature")}
          >
            Feature
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
          </button>
          <button 
            className="relative text-gray-50 text-sm font-semibold px-4 py-2 transition-all duration-300 hover:text-white group"
            onClick={() => handleNavigation("security")}
          >
            Security
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
          </button>
          <button 
            className="relative text-gray-50 text-sm font-semibold px-4 py-2 transition-all duration-300 hover:text-white group"
            onClick={() => handleNavigation("support")}
          >
            Support
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
          </button>

          {!hideLogout && (
            <div className="relative flex items-center ml-4 pl-4 border-l border-white/30">
              <div 
                className="flex items-center gap-3 cursor-pointer px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                onClick={handleLogoutClick}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:shadow-xl transition-all">
                  {userInitials}
                </div>
                <span className="text-sm font-semibold text-white whitespace-nowrap hidden lg:inline">
                  {userName}
                </span>
              </div>

              {showLogout && (
                <div className="absolute top-16 right-0 bg-gradient-to-br from-violet-600 to-teal-700 border border-white/20 rounded-2xl shadow-2xl p-5 min-w-max z-2000 flex items-center gap-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-lg font-bold border border-white/30 shadow-lg">
                    {userInitials}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-sm font-bold text-white">
                      {userName}
                    </div>
                    <button 
                      className="text-xs text-white/90 font-semibold px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 border border-white/20"
                      onClick={handleLogoutConfirm}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          {!hideLogout && (
            <div className="relative">
              <div 
                className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                onClick={handleLogoutClick}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  {userInitials}
                </div>
              </div>
              {showLogout && (
                <div className="absolute top-12 right-0 bg-gradient-to-br from-violet-600 to-teal-700 border border-white/20 rounded-xl shadow-xl p-3 min-w-max z-2000 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                    {userInitials}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold text-white">{userName}</div>
                    <button 
                      className="text-xs text-white/90 font-semibold px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-all"
                      onClick={handleLogoutConfirm}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
