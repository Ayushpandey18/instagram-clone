import React from 'react';
import Image from 'next/image';

export default function ExplorePage() {
    // Placeholder for explore content
    const exploreItems = Array.from({ length: 21 }).map((_, i) => ({
        id: `explore-${i}`,
        imageUrl: `https://picsum.photos/seed/explore${i}/300/300`,
        imageHint: "explore content"
    }));

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Explore</h1>
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {exploreItems.map((item) => (
           <div key={item.id} className="relative aspect-square bg-secondary">
                 <Image
                    src={item.imageUrl}
                    alt="Explore content"
                    layout="fill"
                    objectFit="cover"
                    className="hover:opacity-80 transition-opacity"
                    data-ai-hint={item.imageHint}
                 />
                 {/* Overlay for likes/comments on hover could go here */}
              </div>
        ))}
      </div>
    </div>
  );
}
