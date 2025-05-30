"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Logo3D from "@/components/Logo3D";
import HeroLogo3D from "@/components/HeroLogo3D";

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  // Coupon-related texts to display in orbit
  const couponTexts = [
    { text: "10% OFF", color: "green" },
    { text: "BOGO Deal", color: "yellow" },
    { text: "Gift Card", color: "blue" },
    { text: "XP Boost", color: "purple" },
    { text: "Free Shipping", color: "pink" },
    { text: "Flash Sale", color: "orange" },
    { text: "50% OFF", color: "emerald" },
    { text: "Limited Time", color: "red" },
    { text: "Member Deal", color: "cyan" },
    { text: "Loyalty Points", color: "indigo" },
    { text: "Weekend Special", color: "amber" },
    { text: "Birthday Gift", color: "rose" },
    { text: "First Order", color: "lime" },
    { text: "Free Trial", color: "teal" },
    { text: "Early Access", color: "violet" },
    { text: "Holiday Deal", color: "fuchsia" },
    { text: "Exclusive Offer", color: "sky" },
    { text: "Bundle Discount", color: "stone" },
    { text: "Cashback", color: "emerald" },
    { text: "Referral Reward", color: "amber" },
    { text: "Season Pass", color: "blue" },
    { text: "VIP Discount", color: "purple" },
    { text: "Premium Access", color: "teal" },
    { text: "Free Gift", color: "rose" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            {/* 3D Logo in navbar - much larger container with overflow visible */}
            <div className="w-14 h-14 relative overflow-visible flex items-center justify-center">
              <Logo3D />
            </div>
            <span className="text-xl font-bold">CouponPerfect</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="#features" className="hover:text-blue-400 transition">Features</Link>
            <Link href="#pricing" className="hover:text-blue-400 transition">Pricing</Link>
            <Link href="#faq" className="hover:text-blue-400 transition">FAQ</Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/login" className="text-white hover:text-blue-400 px-3 py-2">Log in</Link>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition">Try for free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Expanded Layout */}
      <div className="flex-1 flex items-center bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 overflow-hidden">
        <div className="container mx-auto px-6 py-16 flex flex-col md:flex-row">
          {/* Left Column - Text and CTA */}
          <div className="md:w-1/2 md:pr-8 mb-12 md:mb-0 flex flex-col justify-center z-10">
            <h1 className="text-5xl font-bold mb-6">Coupon Generator</h1>
            <p className="text-gray-300 text-xl mb-8">
              Create, manage, and redeem coupons with ease. Perfect for businesses of all sizes looking to boost sales and customer engagement.
            </p>
            <button 
              onClick={handleGetStarted} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md text-lg w-fit transition-colors"
            >
              Get started for free
            </button>
          </div>
          
          {/* Right Column - Logo with Orbiting Elements */}
          <div className="md:w-1/2 relative flex items-center justify-center min-h-[700px]">
            {/* Expanded orbit container - Making it larger to prevent clipping */}
            <div className="relative w-[1000px] h-[1000px] flex items-center justify-center">
              {/* Centered 3D model - significantly larger container with overflow visible */}
              <div className="absolute w-96 h-96 flex items-center justify-center z-30 overflow-visible">
                <HeroLogo3D />
              </div>
              
              {/* All 24 Orbiting Elements */}
              {couponTexts.map((coupon, index) => (
                <div key={`orbit-${index + 1}`} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div 
                    className={`absolute animate-orbit${index + 1} bg-gray-800 px-3 py-1.5 rounded-lg shadow-lg transform hover:scale-110 transition-transform border border-${coupon.color}-500/30`} 
                    style={{ zIndex: 10 }}
                  >
                    <span className={`font-medium text-${coupon.color}-400 text-xs sm:text-sm whitespace-nowrap`}>{coupon.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
