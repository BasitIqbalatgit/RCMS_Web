'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ReferenceImagesProps {
  className: string;
  selectedImage: string | null;
  onImageSelect: (imagePath: string) => void;
}

const ReferenceImages: React.FC<ReferenceImagesProps> = ({
  className,
  selectedImage,
  onImageSelect,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Static image paths for headlights
  const leftHeadlightImages = [
    '/Headlight - -L-/1.png',
    '/Headlight - -L-/2.png',
    '/Headlight - -L-/3.png'
  ];

  const rightHeadlightImages = [
    '/Headlight - -R-/1.png',
    '/Headlight - -R-/2.png',
    '/Headlight - -R-/3.png'
  ];

  const frontBumper =[
    '/Front bumper/1.png',
    '/Front bumper/2.png',
    '/Front bumper/3.png'
  ]
  const carHood =[
    '/Car hood/1.jpeg',
    '/Car hood/2.jpeg',
    '/Car hood/3.jpeg'
  ]
  const leftSideMirror =[
    '/Side mirror - -L-/1.png',
    '/Side mirror - -L-/2.png',
    '/Side mirror - -L-/3.png'
  ]


  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Check if the images exist
    const checkImages = async () => {
      try {
        if (className === "Headlight - -L-" || className === "Headlight - -R-" || className === "Front bumper"|| className==="Car hood" || className==="Side mirror - -L-") {
          const imagesToCheck = className === "Headlight - -L-" ? leftHeadlightImages : (className === "Front bumper"?  frontBumper : (className==="Car hood"? carHood: (className === "Side mirror - -L-" ? leftSideMirror : rightHeadlightImages)));
          for (const imagePath of imagesToCheck) {
            const response = await fetch(imagePath, { method: 'HEAD' });
            if (!response.ok) {
              throw new Error(`Image not found: ${imagePath}`);
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
        setIsLoading(false);
      }
    };

    checkImages();
  }, [className]);

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    );
  }

  // Handle headlight images
  if (className === "Headlight - -L-" || className === "Headlight - -R-" || className === "Front bumper" || className==="Car hood" || className === "Side mirror - -L-") {
    const images = className === "Headlight - -L-" ? leftHeadlightImages : 
                   className === "Headlight - -R-" ? rightHeadlightImages : 
                   className ===  "Car hood" ? carHood : className === "Side mirror - -L-" ? leftSideMirror : frontBumper;
    const partType = className === "Headlight - -L-" ? "Left Headlight" : 
                     className === "Headlight - -R-" ? "Right Headlight" : 
                     className === "Car hood" ? "Car Hood": className === "Side mirror - -L-" ? "Left Side Mirror" :"Front Bumper";

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">{partType} Reference Images</h3>
        <div className="grid grid-cols-3 gap-4">
          {images.map((imagePath, index) => (
            <div
              key={imagePath}
              className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${
                selectedImage === imagePath ? 'border-blue-500' : 'border-gray-200'
              }`}
              onClick={() => onImageSelect(imagePath)}
            >
              <Image
                src={imagePath}
                alt={`${partType} Reference ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {selectedImage === imagePath && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white rounded-full p-1">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For other parts, show a message that reference images are not available
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-500 text-sm">No reference images available for this part.</p>
    </div>
  );
};

export default ReferenceImages; 