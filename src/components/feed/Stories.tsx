import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Stories = () => {
  // Placeholder data
  const stories = Array.from({ length: 15 }).map((_, i) => ({
    id: i + 1,
    username: `user_${i + 1}`,
    avatarUrl: `https://picsum.photos/seed/story${i + 1}/64/64`,
    hasNewStory: Math.random() > 0.3, // Simulate some users having new stories
  }));

  return (
    <div className="mb-6">
       <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex space-x-4 p-4">
            {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center w-16 shrink-0">
                <div className={`p-0.5 rounded-full ${story.hasNewStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : ''}`}>
                <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={story.avatarUrl} alt={`${story.username}'s story`} data-ai-hint="person story"/>
                    <AvatarFallback>{story.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                </div>
                <p className="text-xs mt-1 truncate w-full text-center">{story.username}</p>
            </div>
            ))}
        </div>
        <ScrollBar orientation="horizontal" />
       </ScrollArea>
    </div>
  );
};

export default Stories;
