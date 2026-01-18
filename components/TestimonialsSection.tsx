import React from 'react';
import Image from 'next/image';
import { landingPage } from '../config/texts/index';

const TestimonialsSection: React.FC = () => {
  const { testimonials } = landingPage;

  return (
    <section className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-[60px] gap-12 w-full min-h-[440px] bg-[#E0F7FA]">
      {/* Testimonials Title */}
      <h2 className="font-inter font-bold text-3xl md:text-4xl leading-tight md:leading-[43px] text-center text-[#111827] w-full max-w-[600px]">
        {testimonials.title}
      </h2>

      {/* Testimonials Container */}
      <div className="flex flex-col lg:flex-row justify-center items-start gap-6 w-full max-w-[1000px]">
        {testimonials.items.map((testimonial, index) => (
          <div key={index} className="flex flex-col items-start p-6 gap-4 w-full lg:w-[320px] min-h-[228px] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.063)] rounded-lg">
            {/* User Info */}
            <div className="flex flex-row items-center gap-3 w-full h-12">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#B2EBF2] flex items-center justify-center">
                <Image 
                  src={testimonial.avatar} 
                  alt={`${testimonial.name} avatar`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initial-based avatar on image load error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement;
                    if (fallback) {
                      fallback.innerHTML = `<span class="font-inter font-semibold text-lg text-[#0277BD]">${testimonial.name.charAt(0)}</span>`;
                    }
                  }}
                />
              </div>

              {/* User Details */}
              <div className="flex flex-col items-start gap-1 flex-1">
                <span className="font-inter font-semibold text-base leading-[19px] text-[#111827]">
                  {testimonial.name}
                </span>
                <span className="font-inter font-normal text-sm leading-[17px] text-[#374151]">
                  {testimonial.role}
                </span>
              </div>
            </div>

            {/* Testimonial Content */}
            <p className="font-inter font-normal text-base leading-[19px] text-[#374151] flex-1">
              &ldquo;{testimonial.content}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection; 