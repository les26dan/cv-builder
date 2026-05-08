"use client";

import Link from "next/link";
import { account } from "../../config/texts/index";

export default function Header() {
  return (
    <header className="w-full h-16 sm:h-20 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-10 border-b border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="flex items-center">
        <Link 
          href="/" 
          className="text-xl sm:text-2xl font-bold text-primary hover:text-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
          title="CV Builder - Trang chủ"
          aria-label="CV Builder - Trang chủ"
        >
          {account.logo}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-3 sm:gap-6">
        {/* Auth buttons with enhanced styling */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/login"
            className="flex items-center justify-center min-w-[70px] sm:min-w-[100px] h-9 sm:h-11 px-3 sm:px-5 bg-white border border-primary text-primary text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary-50 hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 whitespace-nowrap"
          >
            {account.nav.login}
          </Link>
          <Link 
            href="/register"
            className="flex items-center justify-center min-w-[80px] sm:min-w-[120px] h-9 sm:h-11 px-3 sm:px-5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:ring-offset-2 transition-all duration-200 whitespace-nowrap"
          >
            {account.nav.signup}
          </Link>
        </div>
      </nav>
    </header>
  );
} 