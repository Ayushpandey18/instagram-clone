
'use client'; // Need client component for state and effects

import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard, Play, Volume2, VolumeX, Heart, MessageCircle, Send, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Reel } from '@/services/reel'; // Import type only
import { getReelsFeed } from '@/services/reel';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Basic Reel Player Component (Simplified)
const ReelPlayer = ({ reel, isVisible }: { reel: Reel; isVisible: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Start muted

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (isVisible) {
            // Attempt to play when visible
            videoElement.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.warn("Video autoplay failed:", error);
                 setIsPlaying(false); // Ensure state reflects reality
            });
        } else {
            // Pause when not visible
            videoElement.pause();
             setIsPlaying(false);
        }
    }, [isVisible]);

     // Handle video ending - could loop or load next
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handleEnded = () => {
            setIsPlaying(false);
            // TODO: Add logic to advance to the next reel
            console.log("Reel ended:", reel.id);
            // Example: Scroll to next reel? depends on parent implementation
        };

        videoElement.addEventListener('ended', handleEnded);
        return () => videoElement.removeEventListener('ended', handleEnded);
    }, [reel.id]);


    const togglePlay = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;
        if (videoElement.paused || videoElement.ended) {
            videoElement.play().then(() => setIsPlaying(true)).catch(e => console.error("Play error:", e));
        } else {
            videoElement.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;
        videoElement.muted = !videoElement.muted;
        setIsMuted(videoElement.muted);
    };

    return (
        <div className="relative h-full w-full snap-start bg-black rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                src={reel.videoUrl}
                loop // Optional: loop the video
                playsInline // Important for mobile playback
                muted={isMuted}
                className="h-full w-full object-cover"
                // poster={reel.thumbnailUrl} // Optional poster image
                 onClick={togglePlay} // Play/pause on click
                 data-ai-hint="reel video"
            />

            {/* Play/Pause Overlay Icon */}
             {!isPlaying && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <Play className="h-16 w-16 text-white/70" fill="currentColor" />
                 </div>
             )}

            {/* Mute/Unmute Button */}
             <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-28 right-4 text-white bg-black/30 hover:bg-black/50 h-10 w-10"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
             >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
             </Button>

            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent text-white pointer-events-none">
                <div className="flex items-center mb-2">
                    <Avatar className="h-8 w-8 mr-2 border border-white/50">
                        <AvatarImage src={reel.userAvatar} alt={reel.username} data-ai-hint="person avatar"/>
                        <AvatarFallback>{reel.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${reel.username}`} className="font-semibold text-sm hover:underline pointer-events-auto">
                        {reel.username}
                    </Link>
                     {/* Follow Button - needs state */}
                     {/* <Button variant="outline" size="sm" className="ml-3 text-xs h-6 px-2 bg-white text-black hover:bg-gray-200 pointer-events-auto">Follow</Button> */}
                </div>
                <p className="text-sm mb-1 line-clamp-2">{reel.caption}</p>
                {reel.audioName && <p className="text-xs truncate">🎵 {reel.audioName}</p>}
            </div>

             {/* Action Buttons (Right Side) */}
             <div className="absolute bottom-24 right-2 flex flex-col items-center space-y-4 text-white pointer-events-auto">
                 {/* Like Button - needs state & onClick */}
                 <Button variant="ghost" className="flex flex-col items-center h-auto p-0 hover:bg-transparent">
                    <Heart className="h-7 w-7" />
                    <span className="text-xs font-semibold">{reel.likes.toLocaleString()}</span>
                </Button>
                 {/* Comment Button - needs onClick to open comments */}
                 <Button variant="ghost" className="flex flex-col items-center h-auto p-0 hover:bg-transparent">
                    <MessageCircle className="h-7 w-7" />
                    <span className="text-xs font-semibold">{reel.commentsCount.toLocaleString()}</span>
                </Button>
                 {/* Share Button - needs onClick */}
                 <Button variant="ghost" className="flex flex-col items-center h-auto p-0 hover:bg-transparent">
                     <Send className="h-7 w-7" />
                      {/* <span className="text-xs font-semibold">{reel.shares?.toLocaleString() ?? 0}</span> */}
                </Button>
                 {/* More Options Button - needs onClick */}
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/50">
                    <MoreHorizontal className="h-5 w-5" />
                 </Button>
                  {/* Audio Avatar (Optional) */}
                  {/* <Avatar className="h-8 w-8 border border-white/50 mt-2">
                        <AvatarImage src={reel.userAvatar} alt={reel.username} />
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar> */}
             </div>
        </div>
    );
};


export default function ReelsPage() {
    const [reels, setReels] = useState<Reel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleReelIndex, setVisibleReelIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchReelsData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedReels = await getReelsFeed(10); // Fetch initial batch
                setReels(fetchedReels);
            } catch (err) {
                console.error("Failed to fetch reels:", err);
                setError("Could not load Reels. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReelsData();
    }, []);

    // Intersection Observer to detect which reel is visible
     useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
                        setVisibleReelIndex(index);
                    }
                });
            },
            {
                root: containerRef.current, // Observe within the container
                threshold: 0.5, // Trigger when 50% of the reel is visible
            }
        );

        const reelElements = containerRef.current?.querySelectorAll('[data-reel-id]');
        reelElements?.forEach(el => observer.observe(el));

        return () => {
            reelElements?.forEach(el => observer.unobserve(el));
        };
     }, [reels, isLoading]); // Re-run when reels data changes


    if (isLoading) {
        return (
            <div className="container mx-auto max-w-lg h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center py-8 px-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading Reels...</p>
            </div>
        );
    }

    if (error) {
        return (
             <div className="container mx-auto max-w-lg h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center py-8 px-4">
                 <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                 <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                    Retry
                 </Button>
            </div>
        );
    }

     if (reels.length === 0) {
        return (
            <div className="container mx-auto max-w-lg h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center py-8 px-4">
                <Clapperboard className="h-24 w-24 text-muted-foreground mb-6" />
                <h1 className="text-3xl font-bold mb-4">No Reels Found</h1>
                <p className="text-muted-foreground">There are no Reels to show right now. Check back later!</p>
            </div>
        );
    }


    return (
        // Container for vertical scrolling and snapping
         <div ref={containerRef} className="h-[calc(100vh-0px)] w-full flex overflow-y-auto snap-y snap-mandatory no-scrollbar bg-black">
             {/* Center the reel content */}
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
                {reels.map((reel, index) => (
                    <div
                        key={reel.id}
                        data-reel-id={reel.id}
                        data-index={index}
                        className="h-full w-full flex-shrink-0 snap-start flex items-center justify-center py-2 md:py-4" // Added padding
                        style={{ minHeight: 'calc(100vh - 0px)' }} // Ensure it takes full viewport height minus potential nav
                    >
                        <ReelPlayer reel={reel} isVisible={index === visibleReelIndex} />
                    </div>
                ))}
                 {/* TODO: Add Load More indicator/trigger */}
             </div>
         </div>
    );
}

// Helper to hide scrollbar (add to globals.css if needed, or use here)
// .no-scrollbar::-webkit-scrollbar {
//   display: none;
// }
// .no-scrollbar {
//   -ms-overflow-style: none;  /* IE and Edge */
//   scrollbar-width: none;  /* Firefox */
// }
