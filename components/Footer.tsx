import React from 'react';
import { landingPage } from '../config/texts/index';

const Footer: React.FC = () => {
  const { footer } = landingPage;

  return (
    <footer className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-10 gap-10 w-full min-h-[285px] bg-[#B2EBF2]">
      {/* Footer Content */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 w-full max-w-[1200px]">
        {/* Logo and Description */}
        <div className="flex flex-col items-start gap-4 w-full lg:w-[320px]">
          <h3 className="font-inter font-bold text-2xl leading-[29px] text-[#111827]">
            {footer.logo}
          </h3>
          <p className="font-inter font-normal text-sm leading-[17px] text-[#374151] w-full">
            {footer.description}
            </p>
          </div>
          
        {/* Footer Links */}
        <div className="flex flex-col md:flex-row items-start gap-10 w-full lg:w-auto">
          {/* Product Links */}
          <div className="flex flex-col items-start gap-3 w-full md:w-auto">
            <h4 className="font-inter font-semibold text-base leading-[19px] text-[#111827]">
              {footer.links.product.title}
            </h4>
            {footer.links.product.items.map((item, index) => (
              <a key={index} href="#" className="font-inter font-normal text-sm leading-[17px] text-[#374151] hover:text-[#0277BD] transition-colors">
                {item}
              </a>
            ))}
          </div>
          
          {/* Company Links */}
          <div className="flex flex-col items-start gap-3 w-full md:w-auto">
            <h4 className="font-inter font-semibold text-base leading-[19px] text-[#111827]">
              {footer.links.company.title}
            </h4>
            {footer.links.company.items.map((item, index) => (
              <a key={index} href="#" className="font-inter font-normal text-sm leading-[17px] text-[#374151] hover:text-[#0277BD] transition-colors">
                {item}
              </a>
            ))}
          </div>
          
          {/* Legal Links */}
          <div className="flex flex-col items-start gap-3 w-full md:w-auto">
            <h4 className="font-inter font-semibold text-base leading-[19px] text-[#111827]">
              {footer.links.legal.title}
            </h4>
            {footer.links.legal.items.map((item, index) => (
              <a key={index} href="#" className="font-inter font-normal text-sm leading-[17px] text-[#374151] hover:text-[#0277BD] transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-[1200px] h-px bg-[#80DEEA]"></div>

      {/* Copyright */}
      <p className="font-inter font-normal text-sm leading-[17px] text-center text-[#374151] w-full max-w-[1200px]">
        {footer.copyright}
      </p>
    </footer>
  );
};

export default Footer; 