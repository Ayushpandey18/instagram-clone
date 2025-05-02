'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Clapperboard, Bookmark, UserSquare2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Mock function to get user data - replace with actual API call
const fetchUserProfile = async (username: string) => {
  console.log(`Fetching profile for: ${username}`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data based on username
  if (username === 'current_user') {
    return {
      username: 'current_user',
      fullName: 'Current User Name',
      avatarUrl: 'https://picsum.photos/seed/currentuser/150/150',
      bio: 'This is the bio of the current user. Exploring the world!',
      postsCount: 15,
      followersCount: 250,
      followingCount: 180,
      isCurrentUser: true, // Flag to indicate this is the logged-in user's profile
      posts: Array.from({ length: 15 }).map((_, i) => ({ id: `p${i}`, imageUrl: `https://picsum.photos/seed/currentpost${i}/300/300`, imageHint: 'user post' })),
    };
  } else {
     // Generic mock data for other users
     return {
       username: username,
       fullName: username.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
       avatarUrl: `https://picsum.photos/seed/${username}/150/150`,
       bio: `Hello! I'm ${username}. Welcome to my profile.`,
       postsCount: Math.floor(Math.random() * 50) + 5,
       followersCount: Math.floor(Math.random() * 1000) + 50,
       followingCount: Math.floor(Math.random() * 500) + 20,
       isCurrentUser: false,
       posts: Array.from({ length: Math.floor(Math.random() * 20) + 3 }).map((_, i) => ({ id: `p${i}`, imageUrl: `https://picsum.photos/seed/${username}post${i}/300/300`, imageHint: 'user post' })),
     };
  }
};


export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (username) {
      const loadProfile = async () => {
        setIsLoading(true);
        try {
          const data = await fetchUserProfile(username);
          setProfile(data);
        } catch (error) {
          console.error("Failed to load profile", error);
          // Handle error state, maybe show a message
        } finally {
          setIsLoading(false);
        }
      };
      loadProfile();
    }
  }, [username]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header Skeleton */}
        <div className="flex items-center mb-8">
           <Skeleton className="h-36 w-36 rounded-full mr-10" />
           <div className="flex-grow space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <div className="flex space-x-6">
                 <Skeleton className="h-4 w-20" />
                 <Skeleton className="h-4 w-20" />
                 <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-24" />
           </div>
        </div>
         {/* Tabs Skeleton */}
         <Skeleton className="h-10 w-full mb-4" />
         {/* Grid Skeleton */}
         <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
            ))}
         </div>

      </div>
    );
  }

  if (!profile) {
    return <div className="container mx-auto p-8 text-center">Profile not found.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center mb-8">
        <Avatar className="h-24 w-24 md:h-36 md:w-36 mr-0 md:mr-10 mb-4 md:mb-0 flex-shrink-0">
          <AvatarImage src={profile.avatarUrl} alt={`${profile.username}'s avatar`} data-ai-hint="person profile" />
          <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-4 space-x-4">
            <h1 className="text-2xl font-light">{profile.username}</h1>
            {profile.isCurrentUser ? (
              <Button variant="secondary" size="sm">Edit Profile</Button>
            ) : (
              <>
                <Button size="sm">Follow</Button>
                <Button variant="secondary" size="sm">Message</Button>
              </>
            )}
             {/* More options could go here */}
          </div>
          <div className="flex justify-center md:justify-start space-x-6 mb-4 text-sm md:text-base">
            <p><span className="font-semibold">{profile.postsCount}</span> posts</p>
            <p><span className="font-semibold">{profile.followersCount}</span> followers</p>
            <p><span className="font-semibold">{profile.followingCount}</span> following</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{profile.fullName}</p>
            <p className="whitespace-pre-line">{profile.bio}</p>
            {/* Link could go here */}
          </div>
        </div>
      </div>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 border-t pt-2 justify-items-center">
          <TabsTrigger value="posts" className="flex items-center gap-2 text-xs uppercase tracking-widest"><Grid3x3 className="h-4 w-4"/> <span className="hidden md:inline">Posts</span></TabsTrigger>
          <TabsTrigger value="reels" className="flex items-center gap-2 text-xs uppercase tracking-widest"><Clapperboard className="h-4 w-4"/> <span className="hidden md:inline">Reels</span></TabsTrigger>
          {profile.isCurrentUser && (
            <TabsTrigger value="saved" className="flex items-center gap-2 text-xs uppercase tracking-widest"><Bookmark className="h-4 w-4"/> <span className="hidden md:inline">Saved</span></TabsTrigger>
          )}
          <TabsTrigger value="tagged" className="flex items-center gap-2 text-xs uppercase tracking-widest"><UserSquare2 className="h-4 w-4"/> <span className="hidden md:inline">Tagged</span></TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <div className="grid grid-cols-3 gap-1">
            {profile.posts.map((post: any) => (
              <div key={post.id} className="relative aspect-square bg-secondary">
                <Image
                    src={post.imageUrl}
                    alt={`Post by ${profile.username}`}
                    layout="fill"
                    objectFit="cover"
                    className="hover:opacity-80 transition-opacity"
                    data-ai-hint={post.imageHint || "user content"}
                 />
                 {/* Overlay for likes/comments on hover could go here */}
              </div>
            ))}
            {profile.posts.length === 0 && <p className="col-span-3 text-center text-muted-foreground py-10">No posts yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="reels">
             <div className="text-center py-10 text-muted-foreground">Reels coming soon!</div>
        </TabsContent>
         {profile.isCurrentUser && (
            <TabsContent value="saved">
                 <div className="text-center py-10 text-muted-foreground">Saved posts coming soon!</div>
            </TabsContent>
          )}
        <TabsContent value="tagged">
             <div className="text-center py-10 text-muted-foreground">Tagged posts coming soon!</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
