'use client';

import { landingPage } from '../config/texts/vi/landingPage';
import { handleSecondaryCTA } from '../utils/navigation';

export default function Header() {
  const { header } = landingPage;

  const handleLoginClick = () => {
    handleSecondaryCTA(); // Routes to /login
  };

  const handleSignupClick = () => {
    window.location.href = '/register'; // Routes to /register
  };

  return (
    <header className="flex flex-row justify-between items-center px-4 md:px-[120px] w-full h-20 bg-white border border-[#E2E8F0]">
      {/* Logo */}
      <button 
        onClick={() => {
          // Marketing site behavior - reload page or scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="font-inter font-bold text-2xl leading-[29px] text-[#0277bd] hover:text-[#0288D1] active:text-[#0277BD] transition-colors duration-200 bg-none border-none cursor-pointer px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0288D1] focus:ring-opacity-50"
        title="OkBuddy - Trang chủ"
        aria-label="OkBuddy - Trang chủ"
      >
        {header.logo}
      </button>

      {/* Navigation Links - Hidden as per task requirements */}
      <nav className="hidden">
        <a href="#features" className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0288D1] transition-colors">
          {header.nav.features}
        </a>
        <a href="#pricing" className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0288D1] transition-colors">
          {header.nav.pricing}
        </a>
        <a href="#about" className="font-inter font-medium text-base leading-[19px] text-[#374151] hover:text-[#0288D1] transition-colors">
          {header.nav.about}
        </a>
      </nav>

      {/* Auth Buttons */}
      <div className="flex flex-row justify-center items-center gap-4 w-[236px] h-10">
        {/* Login Button */}
        <button 
          onClick={handleLoginClick}
          className="flex flex-row justify-center items-center w-[100px] h-10 bg-white border border-[#0288D1] rounded-lg hover:bg-[#E1F5FE] transition-colors"
        >
          <span className="font-inter font-medium text-sm leading-[17px] text-[#0288D1]">
            {header.auth.login}
          </span>
        </button>

        {/* Signup Button */}
        <button 
          onClick={handleSignupClick}
          className="flex flex-row justify-center items-center w-[120px] h-10 bg-[#0288D1] rounded-lg hover:bg-[#0277BD] transition-colors"
        >
          <span className="font-inter font-medium text-sm leading-[17px] text-white">
            {header.auth.signup}
          </span>
        </button>
      </div>
    </header>
  );
}