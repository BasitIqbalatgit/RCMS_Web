"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { Button } from "../ui/button";
import { MarqueeColumn } from "./MarqueeColumn";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

// Import your images...
import img1 from "@/public/hero-images/Confident Businesswoman on Turquoise Backdrop.jpeg";
import img2 from "@/public/hero-images/Charismatic Young Man with a Warm Smile and Stylish Tousled Hair.jpeg";
import img3 from "@/public/hero-images/Confident Woman in Red Outfit.jpeg";
import img4 from "@/public/hero-images/Confident Woman in Urban Setting.jpeg";
import img5 from "@/public/hero-images/Futuristic Helmet Portrait.jpeg";
import img6 from "@/public/hero-images/Futuristic Woman in Armor.jpeg";
import img7 from "@/public/hero-images/Man in Brown Suit.jpeg";
import img8 from "@/public/hero-images/Poised Elegance of a Young Professional.jpeg";
import img9 from "@/public/hero-images/Professional Business Portrait.jpeg";
import img10 from "@/public/hero-images/Professional Woman in Navy Blue Suit.jpeg";
import img11 from "@/public/hero-images/Sophisticated Businessman Portrait.jpeg";

// Define Images array here in HomeScreen
const Images = [
  { src: img1, alt: "AI generated image" },
  { src: img2, alt: "AI generated image" },
  { src: img3, alt: "AI generated image" },
  { src: img4, alt: "AI generated image" },
  { src: img5, alt: "AI generated image" },
  { src: img6, alt: "AI generated image" },
  { src: img7, alt: "AI generated image" },
  { src: img8, alt: "AI generated image" },
  { src: img9, alt: "AI generated image" },
  { src: img10, alt: "AI generated image" },
  { src: img11, alt: "AI generated image" },
];

const avatars = [
  { src: "/avatars/AutumnTechFocus.jpeg", fallback: "CN" },
  { src: "/avatars/Casual Creative Professional.jpeg", fallback: "AB" },
  { src: "/avatars/Golden Hour Contemplation.jpeg", fallback: "FG" },
  {
    src: "/avatars/Portrait of a Woman in Rust-Colored Top.jpeg",
    fallback: "PW",
  },
  { src: "/avatars/Radiant Comfort.jpeg", fallback: "RC" },
  {
    src: "/avatars/Relaxed Bearded Man with Tattoo at Cozy Cafe.jpeg",
    fallback: "RB",
  },
];

const HomeScreen: React.FC = () => {
  return (
    <section className="w-full relative overflow-hidden min-h-screen flex flex-col items-center justify-center">
      {/* Background Marquee - increased gap to gap-4 */}
      <div className="absolute top-0 left-0 w-full h-full grid grid-cols-6 gap-4 p-4 z-10">
        {[...Array(6)].map((_, index) => (
          <MarqueeColumn
            key={index}
            reverse={index % 2 === 0}
            duration={30 + index * 5} // Varied speeds for more natural effect
            className="overflow-hidden"
            images={Images} // Pass the Images array as a prop
          />
        ))}
      </div>

      {/* Content Overlay */}
      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center space-y-4 text-center rounded-xl p-8 z-30">
        {/* Announcement Banner */}
        <div className="group bg-background backdrop-blur-0 relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">
          <span
            className={cn(
              "absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
            )}
            style={{
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              maskComposite: "exclude",
            }}
          />
          🎉
          <hr className="mx-2 h-4 w-px shrink-0 bg-gray-400" />
          <AnimatedGradientText className="text-sm font-medium  ">
            Introducing RCMS AI
          </AnimatedGradientText>
          <ChevronRight className="ml-1 size-4 stroke-black-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
        </div>

        {/* Main Content */}
        <h1 className="text-4xl font-extrabold tracking-tighter max-w-5xl mx-auto text-black">
          Preview Car Modifications Before Making Final Decisions
        </h1>
        <p className="max-w-2xl mx-auto text-black">
          Empower your shop with AI-driven previews of car modifications. Show
          customers exactly how their cars will look before making any changes.
        </p>

        {/* Customer Avatars */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex -space-x-2">
            {avatars.map((avatar, index) => (
              <Avatar
                key={index}
                className="inline-block border-2 border-white"
              >
                <AvatarImage src={avatar.src} />
                <AvatarFallback>{avatar.fallback}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-sm font-medium text-black">
            Loved by 1k+ customers
          </span>
        </div>

        {/* CTA Button */}
        <Link href="/login">
          <Button className="rounded-md text-base h-12">
            ✨ Start Visualizing with RCMS ✨
          </Button>
        </Link>
      </div>

      {/* Add extra CSS to handle the z-index for hover */}
      <style jsx global>{`
        .group:hover img {
          z-index: 40;
          filter: none;
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
};

export default HomeScreen;
