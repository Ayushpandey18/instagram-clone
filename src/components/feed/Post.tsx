'use client'; // Required for state/event handlers

import React, { useState, useMemo, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns'; // For relative timestamps
import type { Post as PostType } from '@/services/post'; // Import type only
import { likePost, unlikePost, addComment } from '@/services/post'; // Import service functions
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { cn } from '@/lib/utils';

interface PostProps extends PostType {} // Use PostType directly


const Post: React.FC<PostProps> = ({
  id,
  username,
  userAvatar,
  imageUrl,
  caption,
  likes: initialLikes,
  commentsCount: initialCommentsCount,
  timestamp,
  imageHint,
}) => {
    const { toast } = useToast();
    // TODO: Add state for saved status
    const [isLiked, setIsLiked] = useState(false); // Assume initial state is not liked (fetch this in real app)
    const [likes, setLikes] = useState(initialLikes);
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
    const [commentInput, setCommentInput] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // TODO: Fetch initial like status for the current user

    const handleLikeToggle = async () => {
        const wasLiked = isLiked;
        // Optimistic update
        setIsLiked(!wasLiked);
        setLikes(prev => wasLiked ? prev - 1 : prev + 1);

        try {
            if (wasLiked) {
                await unlikePost(id, 'current_user'); // Replace 'current_user' with actual user
            } else {
                await likePost(id, 'current_user'); // Replace 'current_user' with actual user
            }
        } catch (error) {
            console.error("Failed to update like status:", error);
            // Revert optimistic update on error
            setIsLiked(wasLiked);
            setLikes(prev => wasLiked ? prev + 1 : prev - 1);
            toast({
                title: "Error",
                description: "Could not update like status.",
                variant: "destructive",
            });
        }
    };

    const handleCommentChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCommentInput(e.target.value);
    };

    const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!commentInput.trim()) return;

        setIsSubmittingComment(true);
        try {
            const newComment = await addComment(id, 'current_user', commentInput); // Replace 'current_user'
            setCommentsCount(prev => prev + 1); // Optimistic update
            setCommentInput('');
            toast({
                title: "Comment Posted",
                // description: `Your comment: ${newComment.text}`, // Optional: Show comment text
            });
             // TODO: Potentially add the new comment to a local state to display immediately
        } catch (error) {
            console.error("Failed to post comment:", error);
            toast({
                title: "Error Posting Comment",
                description: "Could not post your comment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingComment(false);
        }
    };


    const timeAgo = useMemo(() => {
        try {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return formatDistanceToNowStrict(date, { addSuffix: true });
            }
        } catch (error) {
             console.error("Error parsing timestamp:", timestamp, error);
        }
        return timestamp; // Fallback
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
        <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70" onClick={handleLikeToggle}>
          <Heart
             className={cn("h-6 w-6", isLiked ? "text-red-500" : "text-foreground")}
             fill={isLiked ? "currentColor" : "none"}
          />
        </Button>
         {/* Focus comment input or open comments modal */}
        <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70" onClick={() => document.getElementById(`comment-input-${id}`)?.focus()}>
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
           {/* Link to the dedicated post page */}
          <Link href={`/p/${id}`} legacyBehavior>
            <a className="text-sm text-muted-foreground cursor-pointer hover:underline">
                View all {commentsCount.toLocaleString()} comment{commentsCount !== 1 ? 's' : ''}
            </a>
          </Link>
        </div>
      )}

       {/* Timestamp */}
      <div className="px-3 pb-3">
        <p className="text-xs text-muted-foreground uppercase">{timeAgo}</p>
      </div>


      {/* Add Comment */}
      <div className="border-t border-border p-3">
        <form className="flex items-center" onSubmit={handleCommentSubmit}>
          <Input
            id={`comment-input-${id}`} // Add unique ID for focusing
            type="text"
            placeholder="Add a comment..."
            className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-0 h-auto bg-transparent"
            aria-label="Add a comment"
            value={commentInput}
            onChange={handleCommentChange}
            disabled={isSubmittingComment}
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary font-semibold px-0"
            disabled={!commentInput.trim() || isSubmittingComment}
          >
            {isSubmittingComment ? 'Posting...' : 'Post'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Post;
