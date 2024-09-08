import React from 'react';
import Button from './ui/button';
import Link from 'next/link';

const Hero = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/Harry2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-end p-4">
        <div className="text-gray-700 max-w-md mr-8 md:mr-44 lg:mr-72 space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sans mt-20">
          Talk To Code
          </h1><br></br>
          <p className="text-lg sm:text-xl md:text-2xl font-sans">
          AI-Powered Senior Developer Assistant to Help You Understand, Document, and Build on Codebases Effortlessly.
          </p><br></br>
          <Link href="/pages/dashboard" passHref>
              <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
