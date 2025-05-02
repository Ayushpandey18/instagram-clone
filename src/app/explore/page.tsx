
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ExploreItem } from '@/services/explore'; // Import type only
import { getExploreContent } from '@/services/explore';

export default function ExplorePage() {
  const [exploreItems, setExploreItems] = useState<ExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExploreData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const items = await getExploreContent(21); // Fetch initial 21 items
        setExploreItems(items);
      } catch (err) {
        console.error("Failed to fetch explore content:", err);
        setError("Could not load explore content. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreData();
  }, []);


  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Explore</h1>

       {error && (
         <Alert variant="destructive" className="mb-6">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={`explore-skel-${i}`} className="aspect-square" />
            ))
          : exploreItems.map((item) => (
              <div key={item.id} className="relative aspect-square bg-secondary group">
                <Image
                  src={item.thumbnailUrl}
                  alt="Explore content"
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:opacity-80 transition-opacity"
                  data-ai-hint={item.imageHint || 'explore content'}
                />
                {/* Optional: Overlay for likes/comments on hover */}
                 {item.likes !== undefined && item.commentsCount !== undefined && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="font-semibold flex items-center">
                        <svg aria-label="Likes" className="mr-1" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.227-3.04 2.688-3.303 2.782-.37.142-.79.142-1.16 0-.263-.094-.79- .555-3.303-2.782C6.152 14.08 3.5 12.194 3.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.656 1.469c.197.21.44.396.716.543A4.21 4.21 0 0 1 12 5.375a4.21 4.21 0 0 1 3.656-1.471z"></path></svg>
                        {item.likes.toLocaleString()}
                      </span>
                      <span className="font-semibold flex items-center">
                        <svg aria-label="Comments" className="mr-1" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        {item.commentsCount.toLocaleString()}
                      </span>
                    </div>
                 )}
              </div>
            ))}
         {!isLoading && exploreItems.length === 0 && !error && (
             <p className="col-span-3 text-center text-muted-foreground py-10">No content to explore right now.</p>
         )}
      </div>
       {/* TODO: Add infinite scroll or load more button */}
    </div>
  );
}
