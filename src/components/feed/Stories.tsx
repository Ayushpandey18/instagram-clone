'use client'; // Required for state and effects

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton';
import type { UserStory } from '@/services/story'; // Import type only
import { getActiveStories, markStoriesAsViewed } from '@/services/story'; // Import service functions
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import useToast

const Stories = () => {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Placeholder function to handle clicking a story
  const handleStoryClick = async (username: string) => {
     console.log(`Opening stories for ${username}`);
     toast({
       title: "Story Viewer",
       description: `Viewing stories for ${username}. (Viewer UI not implemented yet)`,
     });

    // Mark stories as viewed (optimistic UI update + backend call)
    const updatedStories = stories.map(story =>
      story.username === username ? { ...story, viewedByCurrentUser: true } : story
    );
    setStories(updatedStories);

    try {
       await markStoriesAsViewed(username); // Call the service function
    } catch (err) {
       console.error("Failed to mark stories as viewed:", err);
       // Optionally revert the optimistic update or show an error toast
       toast({
         title: "Error",
         description: "Could not update viewed status.",
         variant: "destructive",
       });
       // Revert UI change if backend fails
       setStories(stories); // Set back to original state before optimistic update
    }

    // TODO: Implement the actual story viewer modal/component here
    // This component would display story.items with navigation (prev/next story, prev/next user)
  };

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
                    <button
                        key={story.username}
                        onClick={() => handleStoryClick(story.username)}
                        className="flex flex-col items-center w-16 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                        aria-label={`View ${story.username}'s story`}
                    >
                        <div className={cn(
                            "p-0.5 rounded-full transition-all", // Added transition
                            story.viewedByCurrentUser
                                ? 'bg-gray-300 dark:bg-gray-600' // Viewed state ring
                                : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 group-hover:scale-105 group-focus:scale-105' // Unviewed state ring + hover/focus scale
                        )}>
                            <Avatar className="h-14 w-14 border-2 border-background bg-background transition-transform duration-200 group-hover:scale-105 group-focus:scale-105"> {/* Ensure avatar BG matches page BG, add transform */}
                                <AvatarImage src={story.userAvatar} alt={`${story.username}'s story`} data-ai-hint="person story"/>
                                <AvatarFallback>{story.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <p className={cn(
                            "text-xs mt-1 truncate w-full text-center transition-colors", // Added transition
                            story.viewedByCurrentUser ? 'text-muted-foreground' : 'text-foreground group-hover:text-foreground group-focus:text-foreground' // Dim viewed usernames
                         )}
                        >
                            {story.username}
                        </p>
                    </button>
                ))
            )}
        </div>
        {!isLoading && !error && stories.length > 0 && <ScrollBar orientation="horizontal" className="h-1.5" />} {/* Show scrollbar only if needed */}
       </ScrollArea>
    </div>
  );
};

export default Stories;
