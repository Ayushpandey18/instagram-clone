
'use client'; // Required for state/event handlers if added later

import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns'; // For relative timestamps


interface PostProps {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  commentsCount: number; // Changed from 'comments' to 'commentsCount'
  timestamp: string; // Expecting ISO string or parsable date string
  imageHint?: string;
}

const Post: React.FC<PostProps> = ({
  id, // Added id prop
  username,
  userAvatar,
  imageUrl,
  caption,
  likes,
  commentsCount, // Use commentsCount
  timestamp,
  imageHint,
}) => {

    // TODO: Add state for liked status, saved status
    // TODO: Add handlers for like, save, comment submission, view comments

    const timeAgo = React.useMemo(() => {
        try {
            // Attempt to parse the timestamp
             const date = new Date(timestamp);
             // Check if the date is valid before formatting
             if (!isNaN(date.getTime())) {
                return formatDistanceToNowStrict(date, { addSuffix: true });
             }
        } catch (error) {
             console.error("Error parsing timestamp:", timestamp, error);
        }
        // Fallback if parsing fails or timestamp is invalid/not provided in expected format
        return timestamp; // Return original string as fallback
    }, [timestamp]);


  return (
    <div className="bg-background border border-border rounded-lg mb-6 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center p-3">
        <Link href={`/profile/${username}`}>
          <Avatar className="h-8 w-8 mr-3 cursor-pointer">
            <AvatarImage src={userAvatar} alt={`${username}'s avatar`} data-ai-hint="person profile" />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <Link href={`/profile/${username}`} className="font-semibold text-sm hover:underline">
          {username}
        </Link>
        {/* TODO: Implement More Options Dropdown */}
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Post Image */}
       {/* TODO: Add double-click to like */}
      <div className="relative w-full aspect-square bg-secondary">
        <Image
          src={imageUrl}
          alt={`Post by ${username}`}
          layout="fill"
          objectFit="cover"
          priority={true} // Consider adding priority for above-the-fold images
          data-ai-hint={imageHint || "placeholder image"}
        />
      </div>

      {/* Post Actions */}
      <div className="flex items-center p-3 space-x-4">
        {/* TODO: Add like state and onClick handler */}
        <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70">
          <Heart className="h-6 w-6" />
        </Button>
         {/* TODO: Add onClick handler to focus comment input or open comments modal */}
        <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70">
          <MessageCircle className="h-6 w-6" />
        </Button>
         {/* TODO: Add onClick handler for share action */}
        <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70">
          <Send className="h-6 w-6" />
        </Button>
        {/* TODO: Add save state and onClick handler */}
        <Button variant="ghost" size="icon" className="ml-auto p-0 h-auto hover:opacity-70">
          <Bookmark className="h-6 w-6" />
        </Button>
      </div>

      {/* Likes Count */}
      {likes > 0 && (
        <div className="px-3 pb-1">
            {/* TODO: Add link to list of likers */}
            <p className="font-semibold text-sm">{likes.toLocaleString()} like{likes !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="px-3 pb-2">
            <p className="text-sm">
            <Link href={`/profile/${username}`} className="font-semibold mr-1 hover:underline">
                {username}
            </Link>
            {/* TODO: Add hashtag/mention parsing and linking */}
            {caption}
            </p>
        </div>
      )}

      {/* View Comments */}
      {commentsCount > 0 && (
        <div className="px-3 pb-2">
           {/* TODO: Update link/handler to open comments modal/view */}
          <Link href={`/p/${id}`} legacyBehavior>
            <a className="text-sm text-muted-foreground cursor-pointer hover:underline">
                View all {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
            </a>
          </Link>
        </div>
      )}

       {/* Timestamp */}
      <div className="px-3 pb-3">
        <p className="text-xs text-muted-foreground uppercase">{timeAgo}</p>
      </div>


      {/* Add Comment */}
       {/* TODO: Implement comment submission logic */}
      <div className="border-t border-border p-3">
        <form className="flex items-center" onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
          <Input
            type="text"
            placeholder="Add a comment..."
            className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-0 h-auto bg-transparent"
            aria-label="Add a comment"
          />
          <Button type="submit" variant="ghost" size="sm" className="text-primary hover:text-primary font-semibold px-0" disabled={true}> {/* Disable post until input has value */}
            Post
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Post;
