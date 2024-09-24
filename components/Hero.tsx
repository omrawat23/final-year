import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-end p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="text-gray-700 max-w-md mr-4 sm:mr-8 md:mr-16 lg:mr-24 xl:mr-44 2xl:mr-64 space-y-6 mt-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans tracking-tight">
            Talk To Code
          </h1><br></br>
          <p className="text-lg sm:text-xl md:text-2xl font-sans leading-relaxed">
            AI-Powered Senior Developer Assistant to Help You Understand, Document, and Build on Codebases Effortlessly.
          </p><br></br>
          <Link href="/pages/dashboard" passHref>
            <Button size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Hero