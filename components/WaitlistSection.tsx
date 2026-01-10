"use client";

import React, { useState } from 'react';
import { landingPage } from '../config/texts/index';

const WaitlistSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { waitlist } = landingPage;

  const validateEmail = (email: string) => {
    const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      const sanitizedEmail = email.trim();
      console.log('Email submitted:', sanitizedEmail);
      setMessage('Cảm ơn bạn! Chúng tôi sẽ liên hệ sớm.');
      setEmail('');
    } else {
      setMessage('Vui lòng nhập email hợp lệ');
    }
  };

  return (
    <section id="waitlist" className="flex flex-col justify-center items-center px-4 md:px-[120px] py-[40px] gap-6 w-full min-h-[240px] bg-[#F9FAFB]">
      {/* Content Container */}
      <div className="flex flex-col justify-center items-center gap-4 w-full max-w-[500px]">
        {/* Waitlist Title - De-emphasized */}
        <h3 className="font-inter font-semibold text-xl md:text-2xl leading-tight md:leading-[30px] text-center text-[#374151] w-full">
          {waitlist.title}
        </h3>

        {/* Waitlist Description - De-emphasized */}
        <p className="font-inter font-normal text-base leading-[20px] text-center text-[#6B7280] w-full">
          {waitlist.description}
        </p>

        {/* Email Form - De-emphasized */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full max-w-[450px] h-12">
          {/* Email Input */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            placeholder={waitlist.emailPlaceholder}
            className="flex flex-row items-center px-3 w-full sm:w-[300px] h-12 bg-white border border-[#D1D5DB] rounded-md font-inter font-normal text-sm leading-[17px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#6B7280] focus:ring-1 focus:ring-[#6B7280]"
              required
            />

          {/* Submit Button - De-emphasized */}
            <button 
              type="submit" 
            className="flex flex-row justify-center items-center w-full sm:w-[100px] h-12 bg-[#6B7280] rounded-md hover:bg-[#4B5563] transition-colors"
            >
            <span className="font-inter font-medium text-sm leading-[17px] text-white">
              {waitlist.cta}
            </span>
            </button>
        </form>

        {/* Message */}
          {message && (
          <p className={`font-inter text-sm leading-[17px] text-center ${
            message.includes('Cảm ơn') ? 'text-[#10B981]' : 'text-[#EF4444]'
          }`}>
              {message}
            </p>
          )}
      </div>
    </section>
  );
};

export default WaitlistSection; 