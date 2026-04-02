import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 text-white mt-auto">
        <div className="border-t border-teal-500/30 pt-1 pb-1 flex justify-center items-center min-h-6">
          <p className="text-teal-100 text-xs font-bold text-center w-full">
            © {new Date().getFullYear()} AccessHub. All rights reserved.
          </p>
        </div>
    </footer>
  );
};

export default Footer;
