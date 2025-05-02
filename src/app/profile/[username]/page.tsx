
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Clapperboard, Bookmark, UserSquare2, Settings } from 'lucide-react'; // Added Settings
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UserProfile } from '@/services/user'; // Import type only
import type { Post } from '@/services/post'; // Import type only
import { getUserProfile } from '@/services/user';
import { getUserPosts } from '@/services/post';
// Assuming getUserReels exists in a reel service
// import { getUserReels } from '@/services/reel';
import Link from 'next/link'; // Import Link

// Mock getUserReels for now
const getUserReels = async (username: string): Promise<any[]> => {
    console.log(`Fetching reels for ${username}... (mock)`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return []; // Return empty array for now
}
// Mock getSavedPosts for now
const getSavedPosts = async (): Promise<Post[]> => {
    console.log(`Fetching saved posts... (mock)`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return []; // Return empty array for now
}
// Mock getTaggedPosts for now
const getTaggedPosts = async (username: string): Promise<Post[]> => {
    console.log(`Fetching tagged posts for ${username}... (mock)`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return []; // Return empty array for now
}


export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<(UserProfile & { isCurrentUser: boolean }) | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<any[]>([]); // Using any for mock reel type
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingReels, setIsLoadingReels] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isLoadingTagged, setIsLoadingTagged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');


  // Fetch Profile Data
  useEffect(() => {
    if (username) {
      const loadProfile = async () => {
        setIsLoadingProfile(true);
        setError(null);
        try {
          const data = await getUserProfile(username);
          if (data) {
            setProfile(data);
          } else {
             setError(`Profile for "${username}" not found.`);
          }
        } catch (err) {
          console.error("Failed to load profile", err);
          setError("Failed to load profile. Please try again.");
        } finally {
          setIsLoadingProfile(false);
        }
      };
      loadProfile();
    }
  }, [username]);

  // Fetch Content based on Active Tab
  useEffect(() => {
      if (!username || !profile) return; // Don't fetch content until profile is loaded

      const loadContent = async () => {
          setError(null); // Clear previous errors
          try {
              if (activeTab === 'posts') {
                  setIsLoadingPosts(true);
                  const postData = await getUserPosts(username);
                  setPosts(postData);
                  setIsLoadingPosts(false);
              } else if (activeTab === 'reels') {
                  setIsLoadingReels(true);
                  const reelData = await getUserReels(username); // Assuming this service exists
                  setReels(reelData);
                  setIsLoadingReels(false);
              } else if (activeTab === 'saved' && profile.isCurrentUser) {
                  setIsLoadingSaved(true);
                  const savedData = await getSavedPosts(); // Assuming this service exists
                  setSavedPosts(savedData);
                  setIsLoadingSaved(false);
              } else if (activeTab === 'tagged') {
                  setIsLoadingTagged(true);
                   const taggedData = await getTaggedPosts(username); // Assuming this service exists
                  setTaggedPosts(taggedData);
                  setIsLoadingTagged(false);
              }
          } catch (err) {
               console.error(`Failed to load ${activeTab}:`, err);
               setError(`Failed to load ${activeTab}. Please try again.`);
               // Reset loading states for the failed tab
                if (activeTab === 'posts') setIsLoadingPosts(false);
                else if (activeTab === 'reels') setIsLoadingReels(false);
                else if (activeTab === 'saved') setIsLoadingSaved(false);
                else if (activeTab === 'tagged') setIsLoadingTagged(false);
          }
      };

      loadContent();
  }, [username, activeTab, profile]); // Rerun when username, activeTab, or profile changes


  // --- Rendering Logic ---

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-center mb-8">
           <Skeleton className="h-24 w-24 md:h-36 md:w-36 rounded-full mr-0 md:mr-10 mb-4 md:mb-0 flex-shrink-0" />
           <div className="flex-grow space-y-4 w-full md:w-auto text-center md:text-left">
              <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" /> {/* Username */}
               <div className="flex space-x-6 justify-center md:justify-start">
                 <Skeleton className="h-4 w-20" /> {/* Posts */}
                 <Skeleton className="h-4 w-24" /> {/* Followers */}
                 <Skeleton className="h-4 w-24" /> {/* Following */}
              </div>
               <Skeleton className="h-4 w-1/3 mx-auto md:mx-0" /> {/* Full name */}
               <Skeleton className="h-4 w-3/4 mx-auto md:mx-0" /> {/* Bio line 1 */}
              <Skeleton className="h-4 w-1/2 mx-auto md:mx-0" /> {/* Bio line 2 */}
              <div className="flex justify-center md:justify-start">
                <Skeleton className="h-9 w-24" /> {/* Button */}
              </div>
           </div>
        </div>
         {/* Tabs Skeleton */}
         <div className="border-t border-border">
            <div className="grid grid-cols-4 justify-items-center h-12 items-center mb-4">
                 <Skeleton className="h-5 w-16" />
                 <Skeleton className="h-5 w-16" />
                 <Skeleton className="h-5 w-16" />
                 <Skeleton className="h-5 w-16" />
            </div>
         </div>
         {/* Grid Skeleton */}
         <div className="grid grid-cols-3 gap-1 md:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={`post-skel-${i}`} className="aspect-square" />
            ))}
         </div>
      </div>
    );
  }

  if (error && !profile) { // Only show full error page if profile failed entirely
     return (
         <div className="container mx-auto max-w-4xl py-8 px-4 flex flex-col items-center justify-center h-[calc(100vh-200px)]">
             <Alert variant="destructive" className="w-full max-w-md">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
             <Button variant="link" asChild className="mt-4">
                 <Link href="/">Go Home</Link>
             </Button>
         </div>
     );
  }

  if (!profile) {
     // Should theoretically be covered by the error case above, but as a fallback
     return <div className="container mx-auto p-8 text-center">Profile not found.</div>;
   }


  const renderContent = () => {
      if (error && activeTab) { // Show error specific to the tab if content loading failed
          return (
              <div className="text-center py-10 text-destructive">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>{error}</p>
              </div>
          );
      }

       switch (activeTab) {
           case 'posts':
                if (isLoadingPosts) return <GridSkeleton />;
                if (posts.length === 0) return <EmptyState message="No posts yet." icon={Grid3x3} />;
                return <PostGrid posts={posts} username={profile.username} />;
           case 'reels':
                if (isLoadingReels) return <GridSkeleton />;
                if (reels.length === 0) return <EmptyState message="No Reels yet." icon={Clapperboard} />;
                // Replace with ReelGrid component when available
                return <EmptyState message="Reels display coming soon!" icon={Clapperboard} />;
            case 'saved':
                if (!profile.isCurrentUser) return null; // Should not be reachable via UI
                if (isLoadingSaved) return <GridSkeleton />;
                if (savedPosts.length === 0) return <EmptyState message="No saved posts yet." details="Only you can see what you've saved." icon={Bookmark} />;
                 // Replace with PostGrid or similar for saved posts
                return <EmptyState message="Saved posts display coming soon!" icon={Bookmark} />;
            case 'tagged':
                 if (isLoadingTagged) return <GridSkeleton />;
                if (taggedPosts.length === 0) return <EmptyState message="No tagged posts yet." icon={UserSquare2} />;
                 // Replace with PostGrid or similar for tagged posts
                return <EmptyState message="Tagged posts display coming soon!" icon={UserSquare2} />;
           default:
               return null;
       }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4"> {/* Increased max-width */}
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center mb-8">
        <Avatar className="h-24 w-24 md:h-36 md:w-36 mr-0 md:mr-16 mb-4 md:mb-0 flex-shrink-0"> {/* Increased margin */}
          <AvatarImage src={profile.avatarUrl} alt={`${profile.username}'s avatar`} data-ai-hint="person profile" />
          <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-4 space-x-4">
            <h1 className="text-2xl font-light">{profile.username}</h1>
            {profile.isCurrentUser ? (
             <>
                <Button variant="secondary" size="sm" asChild>
                    <Link href="/settings/edit-profile">Edit Profile</Link>
                </Button>
                {/* Add Archive button or similar */}
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/settings" aria-label="Settings">
                        <Settings className="h-5 w-5"/>
                    </Link>
                </Button>
             </>
            ) : (
              <>
                 {/* TODO: Add follow/unfollow state and onClick handlers */}
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
            {profile.website && (
                 <a href={profile.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-900 dark:text-blue-400 hover:underline">
                    {profile.website.replace(/^https?:\/\//, '')} {/* Remove protocol for display */}
                 </a>
             )}
          </div>
        </div>
      </div>

       {/* Separator and Tabs */}
       <Separator className="mb-0" /> {/* Use Shadcn Separator */}
      <Tabs defaultValue="posts" className="w-full" value={activeTab} onValueChange={setActiveTab}>
         {/* Centered Tab List */}
        <div className="flex justify-center border-b border-border">
            <TabsList className="grid w-full max-w-md grid-cols-3 md:grid-cols-4 justify-items-center bg-transparent p-0 rounded-none h-12">
            <TabsTrigger value="posts" className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none bg-transparent text-muted-foreground h-full px-4">
                <Grid3x3 className="h-4 w-4"/> <span className="hidden md:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="reels" className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none bg-transparent text-muted-foreground h-full px-4">
                <Clapperboard className="h-4 w-4"/> <span className="hidden md:inline">Reels</span>
            </TabsTrigger>
            {profile.isCurrentUser && (
                <TabsTrigger value="saved" className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none bg-transparent text-muted-foreground h-full px-4">
                <Bookmark className="h-4 w-4"/> <span className="hidden md:inline">Saved</span>
                </TabsTrigger>
            )}
            <TabsTrigger value="tagged" className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest data-[state=active]:border-t-2 data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none bg-transparent text-muted-foreground h-full px-4">
                <UserSquare2 className="h-4 w-4"/> <span className="hidden md:inline">Tagged</span>
            </TabsTrigger>
            </TabsList>
        </div>

         {/* Tab Content Area */}
         <div className="pt-4">
            {renderContent()}
         </div>
      </Tabs>
    </div>
  );
}

// --- Helper Components ---

const GridSkeleton = () => (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={`content-skel-${i}`} className="aspect-square" />
        ))}
    </div>
);

const PostGrid = ({ posts, username }: { posts: Post[], username: string }) => (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
        {posts.map((post: Post) => (
            <Link key={post.id} href={`/p/${post.id}`} legacyBehavior>
                <a className="relative aspect-square bg-secondary group">
                    <Image
                        src={post.imageUrl}
                        alt={`Post by ${username}`}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:opacity-80 transition-opacity"
                        data-ai-hint={post.imageHint || "user content"}
                    />
                     {/* Overlay for likes/comments on hover */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <span className="font-semibold flex items-center">
                             <svg aria-label="Likes" className="mr-1" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.227-3.04 2.688-3.303 2.782-.37.142-.79.142-1.16 0-.263-.094-.79- .555-3.303-2.782C6.152 14.08 3.5 12.194 3.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.656 1.469c.197.21.44.396.716.543A4.21 4.21 0 0 1 12 5.375a4.21 4.21 0 0 1 3.656-1.471z"></path></svg>
                             {post.likes.toLocaleString()}
                         </span>
                         <span className="font-semibold flex items-center">
                             <svg aria-label="Comments" className="mr-1" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
                             {post.commentsCount.toLocaleString()}
                         </span>
                    </div>
                </a>
            </Link>
        ))}
    </div>
);


const EmptyState = ({ message, details, icon: Icon }: { message: string, details?: string, icon: React.ElementType }) => (
     <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
        <div className="border-2 border-foreground rounded-full p-4 mb-4">
             <Icon className="h-8 w-8 text-foreground" strokeWidth={1.5}/>
        </div>
        <p className="text-xl font-semibold text-foreground mb-1">{message}</p>
        {details && <p className="text-sm">{details}</p>}
    </div>
);

// Need to import Separator
import { Separator } from "@/components/ui/separator";
