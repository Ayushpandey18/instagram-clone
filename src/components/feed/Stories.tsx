
'use client'; // Required for state and effects

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';
import type { UserStory } from '@/services/story'; // Import type only
import { getActiveStories } from '@/services/story';
import { cn } from '@/lib/utils';

const Stories = () => {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const activeStories = await getActiveStories();
        setStories(activeStories);
      } catch (err) {
        console.error("Failed to fetch stories:", err);
        setError("Could not load stories."); // Simple error message
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  // TODO: Implement onClick handler to open story viewer modal/page

  return (
    <div className="mb-4 py-3 bg-background border border-border rounded-lg overflow-hidden"> {/* Adjusted padding */}
       <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 px-4 pb-2"> {/* Added horizontal and bottom padding */}
            {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                    <div key={`skel-${i}`} className="flex flex-col items-center w-16 shrink-0">
                        <Skeleton className="h-14 w-14 rounded-full mb-1.5" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                ))
            ) : error ? (
                 <p className="text-xs text-destructive px-4">{error}</p>
            ) : stories.length === 0 ? (
                <p className="text-xs text-muted-foreground px-4">No stories available right now.</p>
            ) : (
                stories.map((story) => (
                    <div key={story.username} className="flex flex-col items-center w-16 shrink-0 cursor-pointer group"> {/* Made clickable */}
                        <div className={cn(
                            "p-0.5 rounded-full",
                            story.viewedByCurrentUser
                                ? 'bg-gray-300 dark:bg-gray-600' // Viewed state ring
                                : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' // Unviewed state ring
                        )}>
                        <Avatar className="h-14 w-14 border-2 border-background bg-background group-hover:scale-105 transform transition"> {/* Ensure avatar BG matches page BG, add hover effect */}
                            <AvatarImage src={story.userAvatar} alt={`${story.username}'s story`} data-ai-hint="person story"/>
                            <AvatarFallback>{story.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        </div>
                        <p className={cn(
                            "text-xs mt-1 truncate w-full text-center",
                            story.viewedByCurrentUser ? 'text-muted-foreground' : 'text-foreground' // Dim viewed usernames
                         )}
                        >
                            {story.username}
                        </p>
                    </div>
                ))
            )}
        </div>
        {!isLoading && !error && stories.length > 0 && <ScrollBar orientation="horizontal" className="h-1.5" />} {/* Show scrollbar only if needed */}
       </ScrollArea>
    </div>
  );
};

export default Stories;
