
'use client'; // Required for useState and useEffect

import React, { useState, useEffect } from 'react';
import Post from './Post';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Post as PostType } from '@/services/post'; // Import type only
import { getFeedPosts } from '@/services/post';

const Feed = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Add state for pagination (e.g., lastVisiblePostId)

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPosts = await getFeedPosts(10); // Fetch initial 10 posts
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Failed to fetch feed posts:", err);
        setError("Could not load feed. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []); // Empty dependency array means this runs once on mount

  // TODO: Implement loadMorePosts function for infinite scrolling

  return (
    <div className="w-full">
        {error && (
            <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {isLoading ? (
            <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skel-${i}`} className="bg-background border border-border rounded-lg overflow-hidden">
                        {/* Header Skeleton */}
                        <div className="flex items-center p-3">
                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 ml-auto rounded-md" />
                        </div>
                         {/* Image Skeleton */}
                         <Skeleton className="w-full aspect-square" />
                         {/* Actions Skeleton */}
                        <div className="flex items-center p-3 space-x-4">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                             <Skeleton className="h-6 w-6 ml-auto" />
                        </div>
                         {/* Likes Skeleton */}
                        <div className="px-3 pb-1">
                            <Skeleton className="h-4 w-16" />
                        </div>
                        {/* Caption Skeleton */}
                        <div className="px-3 pb-2 space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                         {/* Timestamp Skeleton */}
                        <div className="px-3 pb-3">
                             <Skeleton className="h-3 w-20" />
                        </div>
                        {/* Comment Input Skeleton */}
                        <div className="border-t border-border p-3">
                             <Skeleton className="h-6 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        ) : posts.length === 0 && !error ? (
             <div className="text-center py-20 text-muted-foreground">
                <p className="font-semibold">No posts to show</p>
                <p className="text-sm">Follow people to see their posts here.</p>
            </div>
        ) : (
            posts.map((post) => (
                <Post
                    key={post.id}
                    id={post.id}
                    username={post.username}
                    userAvatar={post.userAvatar}
                    imageUrl={post.imageUrl}
                    caption={post.caption}
                    likes={post.likes}
                    commentsCount={post.commentsCount} // Pass commentsCount
                    timestamp={post.timestamp}
                    imageHint={post.imageHint}
                />
            ))
        )}
        {/* TODO: Add loading indicator for infinite scroll */}
        {/* TODO: Add "Load More" button or trigger */}
    </div>
  );
};

export default Feed;
