"use client"

import React, { useState } from "react";
import Button from "./ui/button";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-transparent absolute top-0 left-0 right-0 z-10">
      <Link href="/" aria-label="Home">
        <div className="flex items-center">
          <Button>
            <Image src="/logo.svg" alt="logo" width={24} height={24} />
          </Button>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center">
        <ul className="flex space-x-6 mr-6">
          <li>
            <Button className="text-white hover:text-gray-200">
              <Link href="/login">Log in</Link>
            </Button>
          </li>
          <li>
            <Button className="text-white hover:text-gray-200">
              <Link href="/register">Sign up</Link>
            </Button>
          </li>
        </ul>
      </nav>

      {/* Mobile Menu Button */}
      <Button
        className="md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        <Image src="/mi.png" alt="Menu" width={24} height={24} />
      </Button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute bg-black top-full right-12 shadow-md rounded-3xl md:hidden transition-transform duration-300 w-64">
          <nav className="flex flex-col items-center py-4 px-4">
            <ul className="flex flex-col items-center space-y-4">
              <li>
                <Button className="text-white hover:text-gray-600">
                  <Link href="/login">Log in</Link>
                </Button>
              </li>
              <li>
                <Button className="text-white hover:text-gray-600">
                  <Link href="/register">Sign up</Link>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;