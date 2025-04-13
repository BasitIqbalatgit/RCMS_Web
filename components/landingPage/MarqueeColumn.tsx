'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import Image from "next/image";

export const MarqueeColumn = ({ reverse, duration, className, images }: { 
  reverse: boolean; 
  duration: number; 
  className?: string;
  images: Array<{ src: any; alt: string }>;
}) => {  // Use a consistent image order by tripling the array without random sorting
  const columnImages = useMemo(() => {
    return [...images, ...images, ...images];
  }, [images]);

  return (
    <div className={cn("w-full h-screen relative overflow-hidden", className)}>
      <motion.div
        className="w-full absolute top-0 left-0 flex flex-col gap-4"
        initial={{ y: reverse ? "-33.33%" : "0%" }}
        animate={{ 
          y: reverse ? ["0%", "-33.33%"] : ["-33.33%", "0%"] 
        }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: duration,
          ease: "linear",
        }}
      >
        {columnImages.map((image, index) => (
          <div 
            key={`${index}`}
            className="w-full aspect-[2/3] flex-shrink-0 relative group cursor-pointer"
          >
            <Image
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover opacity-25 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:z-60 group-hover:scale-105 group-hover:shadow-xl rounded-lg"
              width={400}
              height={600}
              priority={index < 6}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};