"use client";

import Link from "next/link";
import { account } from "../../config/texts/vi/account";

export default function Header() {
  return (
    <header className="w-full h-16 sm:h-20 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-10">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
          {account.logo}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-3 sm:gap-6">
        {/* Feedback link - Hidden on mobile */}
        <Link 
          href="#" 
          className="hidden sm:block text-sm sm:text-base font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          {account.nav.feedback}
        </Link>

        {/* Hidden nav links (as per design) */}
        <div className="hidden">
          <Link href="#" className="text-base font-medium text-gray-500">
            {account.nav.features}
          </Link>
          <Link href="#" className="text-base font-medium text-gray-500">
            {account.nav.pricing}
          </Link>
          <Link href="#" className="text-base font-medium text-gray-500">
            {account.nav.about}
          </Link>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/dang-nhap"
            className="flex items-center justify-center min-w-[70px] sm:min-w-[100px] h-8 sm:h-10 px-2 sm:px-4 bg-white border border-primary text-primary text-xs sm:text-sm font-medium rounded-md sm:rounded-lg hover:bg-primary-50 transition-colors whitespace-nowrap"
          >
            {account.nav.login}
          </Link>
          <Link 
            href="/dang-ky"
            className="flex items-center justify-center min-w-[70px] sm:min-w-[120px] h-8 sm:h-10 px-2 sm:px-4 bg-primary text-white text-xs sm:text-sm font-medium rounded-md sm:rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
          >
            {account.nav.signup}
          </Link>
        </div>
      </nav>
    </header>
  );
} 