
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UserStory, StoryItem } from '@/services/story'; // Import types
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';

interface StoryViewerProps {
  stories: UserStory[];
  startIndex: number;
  onClose: () => void;
  onNextUser: () => void;
  onPrevUser: () => void;
}

const STORY_DURATION_SECONDS = 5; // Default duration for image stories

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  startIndex,
  onClose,
  onNextUser,
  onPrevUser,
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(startIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for videos

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentUserStory = stories[currentUserIndex];
  const currentItem = currentUserStory?.items[currentItemIndex];

  const totalItems = currentUserStory?.items.length || 0;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(0);
    setIsPaused(false); // Always resume on new story/item
  }, []);

  const goToNextItem = useCallback(() => {
    resetTimer();
    if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(prev => prev + 1);
    } else {
      // Move to next user's story
      onNextUser();
      setCurrentItemIndex(0); // Reset item index for the new user
    }
  }, [currentItemIndex, totalItems, onNextUser, resetTimer]);

  const goToPrevItem = useCallback(() => {
    resetTimer();
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    } else {
        // Move to prev user's story, starting at their *last* item
        onPrevUser();
        // Need to wait for currentUserIndex to update, so set item index in useEffect
    }
  }, [currentItemIndex, onPrevUser, resetTimer]);

   // Effect to handle setting item index when moving to previous user
   useEffect(() => {
        // This check ensures we only set the item index *after* the user index has updated
        // and we are moving backwards (currentItemIndex was 0).
        if (currentUserIndex !== startIndex && currentItemIndex === 0) {
             const prevUserStory = stories[currentUserIndex];
             if (prevUserStory) {
                 setCurrentItemIndex(prevUserStory.items.length - 1);
             }
        }
        // Reset item index if user changes via the main selection (startIndex)
        if (currentUserIndex === startIndex) {
            setCurrentItemIndex(0);
            resetTimer();
        }
   }, [currentUserIndex, startIndex, stories, resetTimer]); // currentItemIndex is intentionally omitted


  useEffect(() => {
    if (!currentItem || isPaused) return;

    const duration = (currentItem.type === 'video' ? (videoRef.current?.duration || STORY_DURATION_SECONDS) : STORY_DURATION_SECONDS) * 1000;
    const updateInterval = 50; // Update progress bar roughly 20 times per second

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const increment = (updateInterval / duration) * 100;
        return Math.min(prev + increment, 100);
      });
    }, updateInterval);

    // Set timeout to advance to the next story/item
    timerRef.current = setTimeout(goToNextItem, duration);

    // Play video if it's a video item
    if (currentItem.type === 'video' && videoRef.current) {
       videoRef.current.currentTime = 0; // Reset video
       videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }

    return () => {
        resetTimer();
        // Pause video if it exists when cleaning up
        if (videoRef.current) videoRef.current.pause();
    };
  }, [currentItem, currentUserIndex, currentItemIndex, isPaused, goToNextItem, resetTimer]);

  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
    if (currentItem?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.play().catch(e => console.error("Video resume failed:", e));
      } else {
        videoRef.current.pause();
      }
    }
  };

    const handleLeftAreaClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering pause/resume
        goToPrevItem();
    };

    const handleRightAreaClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering pause/resume
        goToNextItem();
    };

     const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering pause/resume
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

   const timeAgo = currentItem ? formatDistanceToNowStrict(new Date(currentItem.timestamp), { addSuffix: true }) : '';


  if (!currentUserStory || !currentItem) {
    return null; // Or a loading/error state
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={handlePauseResume} // Pause/resume on background click
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-viewer-title"
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white z-50 bg-black/30 hover:bg-black/50 h-10 w-10"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close story viewer"
      >
        <X className="h-6 w-6" />
      </Button>

       {/* Previous User Button */}
       {stories.length > 1 && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white z-50 bg-black/30 hover:bg-black/50 h-10 w-10 rounded-full"
                onClick={(e) => { e.stopPropagation(); onPrevUser(); setCurrentItemIndex(0); resetTimer(); }}
                aria-label="Previous user's stories"
            >
                <ChevronLeft className="h-7 w-7" />
            </Button>
       )}

       {/* Next User Button */}
       {stories.length > 1 && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white z-50 bg-black/30 hover:bg-black/50 h-10 w-10 rounded-full"
                onClick={(e) => { e.stopPropagation(); onNextUser(); setCurrentItemIndex(0); resetTimer(); }}
                aria-label="Next user's stories"
            >
                <ChevronRight className="h-7 w-7" />
            </Button>
        )}


      {/* Story Content Area */}
      <div className="relative w-full max-w-[400px] aspect-[9/16] bg-secondary overflow-hidden rounded-lg shadow-xl flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 z-40 flex space-x-1">
          {currentUserStory.items.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
               <div
                className="h-full bg-white transition-all duration-100 linear" // Faster transition for smoother progress
                style={{ width: `${index < currentItemIndex ? 100 : index === currentItemIndex ? progress : 0}%` }}
               />
              {/* <Progress
                value={index < currentItemIndex ? 100 : index === currentItemIndex ? progress : 0}
                className="h-1 w-full bg-white/30 [&>div]:bg-white transition-all duration-100 linear"
              /> */}
            </div>
          ))}
        </div>

        {/* Header Info */}
        <div className="absolute top-5 left-4 right-4 z-40 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Link href={`/profile/${currentUserStory.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUserStory.userAvatar} alt={currentUserStory.username} data-ai-hint="person avatar"/>
                <AvatarFallback>{currentUserStory.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
             <div>
                <Link href={`/profile/${currentUserStory.username}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-sm hover:underline">
                    {currentUserStory.username}
                </Link>
                <span className="text-xs ml-2 opacity-80">{timeAgo}</span>
             </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button
                variant="ghost"
                size="icon"
                className="text-white h-8 w-8"
                onClick={(e)=>{ e.stopPropagation(); handlePauseResume(); }}
                aria-label={isPaused ? 'Play' : 'Pause'}
             >
                {isPaused ? <Play className="h-5 w-5" fill="currentColor"/> : <Pause className="h-5 w-5" fill="currentColor"/>}
             </Button>
             {currentItem.type === 'video' && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white h-8 w-8"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                 >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
             )}
             {/* Add More Options Button if needed */}
          </div>
        </div>

        {/* Media Display */}
        <div className="flex-grow flex items-center justify-center relative">
            {/* Click areas for Prev/Next Item */}
             <div className="absolute left-0 top-0 bottom-0 w-1/3 z-30 cursor-pointer" onClick={handleLeftAreaClick} aria-label="Previous story item"></div>
             <div className="absolute right-0 top-0 bottom-0 w-1/3 z-30 cursor-pointer" onClick={handleRightAreaClick} aria-label="Next story item"></div>

            {currentItem.type === 'image' && (
                <Image
                src={currentItem.url}
                alt={`Story by ${currentUserStory.username}`}
                layout="fill"
                objectFit="cover"
                priority // Load current story image faster
                className="animate-zoom-in" // Optional subtle zoom
                 data-ai-hint="story image"
                />
            )}
            {currentItem.type === 'video' && (
                <video
                    ref={videoRef}
                    src={currentItem.url}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                    onEnded={goToNextItem} // Go to next when video finishes naturally
                     data-ai-hint="story video"
                     // Consider adding poster={currentItem.thumbnailUrl}
                />
            )}
        </div>

        {/* Input/Actions Footer (Optional) */}
         {/*
         <div className="absolute bottom-4 left-4 right-4 z-40">
             <Input placeholder="Send message..." className="bg-black/50 border-white/30 text-white placeholder-white/70" />
         </div>
         */}
      </div>
    </div>
  );
};

export default StoryViewer;
