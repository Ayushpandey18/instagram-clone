

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card'; // Import Card
import { Separator } from '@/components/ui/separator';
import type { Post as PostType, Comment } from '@/services/post'; // Import types
import { getPostById, getPostComments, likePost, unlikePost, addComment } from '@/services/post'; // Import service functions
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { toast } = useToast();

  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for interactions
  const [isLiked, setIsLiked] = useState(false); // TODO: Fetch initial state based on current user
  const [likes, setLikes] = useState(0); // Initialize with 0, update from postData
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch Post Data
  useEffect(() => {
    if (!postId) return;
    const loadPost = async () => {
      setIsLoadingPost(true);
      setError(null);
      try {
        console.log("Fetching post with ID:", postId); // Debug log
        // Ensure getPostById is called correctly
        const postData = await getPostById(postId);
        console.log("Fetched post data:", postData); // Debug log
        if (postData) {
          setPost(postData);
          setLikes(postData.likes);
          // TODO: Fetch current user's like status for this post
          // setIsLiked(await checkUserLikeStatus(postId, 'current_user')); // Example
        } else {
          setError(`Post with ID "${postId}" not found.`);
        }
      } catch (err: any) { // Catch specific error
        console.error("Failed to load post", err);
        // Log the actual error to see if it provides more clues
        setError(`Failed to load post details: ${err.message || 'Please try again.'}`);
      } finally {
        setIsLoadingPost(false);
      }
    };
    loadPost();
  }, [postId]); // Dependency array includes postId

  // Fetch Comments Data
  useEffect(() => {
    if (!postId) return;
    const loadComments = async () => {
      setIsLoadingComments(true);
      // Don't clear main error if post loading succeeded
      // setError(null);
      try {
        const commentsData = await getPostComments(postId, 50); // Fetch up to 50 comments initially
        setComments(commentsData);
      } catch (err) {
        console.error("Failed to load comments", err);
        // Set a specific comment error or append to main error?
        setError(prev => prev ? `${prev}\nFailed to load comments.` : "Failed to load comments.");
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
  }, [postId]);

  const timeAgo = useMemo(() => {
    if (!post?.timestamp) return '';
    try {
      const date = new Date(post.timestamp);
      if (!isNaN(date.getTime())) {
        return formatDistanceToNowStrict(date, { addSuffix: true });
      }
    } catch (error) {
      console.error("Error parsing post timestamp:", post.timestamp, error);
    }
    return post.timestamp; // Fallback
  }, [post?.timestamp]);


    const handleLikeToggle = async () => {
        if (!post) return;
        const wasLiked = isLiked;
        const initialLikes = likes; // Store initial likes for potential revert

        // Optimistic update
        setIsLiked(!wasLiked);
        setLikes(prev => wasLiked ? prev - 1 : prev + 1);
        // Also update the local post state optimistically (optional but good for consistency)
        setPost(prevPost => prevPost ? { ...prevPost, likes: wasLiked ? prevPost.likes - 1 : prevPost.likes + 1 } : null);


        try {
            if (wasLiked) {
                await unlikePost(post.id, 'current_user'); // Replace 'current_user' with actual user logic
            } else {
                await likePost(post.id, 'current_user'); // Replace 'current_user' with actual user logic
            }
             // Optional: Refetch post data to confirm server state, or trust optimistic update
        } catch (error) {
            console.error("Failed to update like status:", error);
             // Revert optimistic update on error
            setIsLiked(wasLiked);
            setLikes(initialLikes);
             if (post) { // Revert local post state too
                 setPost(prevPost => prevPost ? { ...prevPost, likes: initialLikes } : null);
             }
            toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!commentInput.trim() || !post) return;

        setIsSubmittingComment(true);
        const originalCommentsCount = post.commentsCount; // Store for revert
        try {
            // Optimistic UI update for comment count
            setPost(prevPost => prevPost ? { ...prevPost, commentsCount: prevPost.commentsCount + 1 } : null);

            const newComment = await addComment(post.id, 'current_user', commentInput); // Replace 'current_user'
            setComments(prev => [...prev, newComment]); // Add new comment to the end
            setCommentInput('');
            toast({ title: "Comment Posted" });
        } catch (error) {
            console.error("Failed to post comment:", error);
             // Revert optimistic update
             if (post) {
                 setPost(prevPost => prevPost ? { ...prevPost, commentsCount: originalCommentsCount } : null);
             }
            toast({ title: "Error Posting Comment", description: "Could not post your comment.", variant: "destructive" });
        } finally {
            setIsSubmittingComment(false);
        }
    };

  // --- Render Logic ---

  if (isLoadingPost) {
    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-0 h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (error && !post) { // Show full error page if post loading failed entirely
     return (
         <div className="container mx-auto max-w-4xl py-8 px-4 flex flex-col items-center justify-center h-[calc(100vh-200px)]">
             <Alert variant="destructive" className="w-full max-w-md">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
             <Button variant="link" asChild className="mt-4" onClick={() => router.back()}>
                 <a><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</a>
             </Button>
         </div>
     );
  }

  if (!post) {
     return <div className="container mx-auto p-8 text-center">Post not found.</div>;
   }

  return (
    // Center the modal-like structure on the page
    <div className="container mx-auto max-w-5xl min-h-[calc(100vh-80px)] flex items-center justify-center p-0 md:p-4">
       {/* Back button (optional, good for UX) */}
       {/* <Button variant="ghost" onClick={() => router.back()} className="absolute top-4 left-4 z-10">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
       </Button> */}

      {/* Modal-like Card */}
      <Card className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-lg my-auto">
        {/* Image Section */}
        <div className="w-full md:w-1/2 lg:w-3/5 bg-black flex items-center justify-center aspect-square md:aspect-auto">
          <Image
            src={post.imageUrl}
            alt={`Post by ${post.username}`}
            width={600}
            height={600}
            className="object-contain max-h-[80vh] md:max-h-full w-full" // Constrain height on mobile
            priority
            data-ai-hint={post.imageHint || "post image"}
          />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-border">
            <Link href={`/profile/${post.username}`}>
                <Avatar className="h-8 w-8 mr-3 cursor-pointer">
                <AvatarImage src={post.userAvatar} alt={`${post.username}'s avatar`} data-ai-hint="person profile"/>
                <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            </Link>
            <Link href={`/profile/${post.username}`} className="font-semibold text-sm hover:underline">
                {post.username}
            </Link>
            {/* Add Follow button? */}
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Comments and Caption Scroll Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[50vh] md:max-h-none">
            {/* Caption */}
            {post.caption && (
              <div className="flex items-start space-x-3 mb-4">
                 <Link href={`/profile/${post.username}`} className="flex-shrink-0">
                    <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src={post.userAvatar} alt={`${post.username}'s avatar`} data-ai-hint="person profile"/>
                        <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                 </Link>
                <div>
                    <p className="text-sm">
                        <Link href={`/profile/${post.username}`} className="font-semibold mr-1 hover:underline">
                            {post.username}
                        </Link>
                        {' '} {/* Add space */}
                        {post.caption}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p> {/* Timestamp for caption */}
                </div>
              </div>
            )}

            {/* Separator before comments if caption exists */}
            {post.caption && <Separator className="my-2"/>}


            {/* Comments List */}
            {isLoadingComments ? (
                 Array.from({ length: 3 }).map((_, i) => (
                    <div key={`comment-skel-${i}`} className="flex items-start space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="flex-grow space-y-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                 ))
            ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
            ) : (
                comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                    <Link href={`/profile/${comment.username}`} className="flex-shrink-0">
                         <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage src={comment.userAvatar} alt={`${comment.username}'s avatar`} data-ai-hint="person profile"/>
                            <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <p className="text-sm">
                            <Link href={`/profile/${comment.username}`} className="font-semibold mr-1 hover:underline">
                                {comment.username}
                            </Link>
                            {' '} {/* Add space */}
                            {comment.text}
                        </p>
                         <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNowStrict(new Date(comment.timestamp), { addSuffix: true })}
                         </p>
                    </div>
                    {/* TODO: Add like button for comments? */}
                </div>
                ))
            )}
             {error && error.includes('comments') && !isLoadingComments && <p className="text-xs text-destructive text-center">Failed to load comments.</p>}
          </div>

           {/* Actions Footer */}
           <div className="border-t border-border p-3 mt-auto">
                <div className="flex items-center space-x-4 mb-2">
                     <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70" onClick={handleLikeToggle}>
                        <Heart
                            className={cn("h-6 w-6", isLiked ? "text-red-500" : "text-foreground")}
                            fill={isLiked ? "currentColor" : "none"}
                        />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70" onClick={() => document.getElementById(`detail-comment-input-${post.id}`)?.focus()}>
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-0 h-auto hover:opacity-70">
                        <Send className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="ml-auto p-0 h-auto hover:opacity-70">
                        <Bookmark className="h-6 w-6" />
                    </Button>
                </div>
                {/* Likes Count */}
                {likes > 0 && (
                    <p className="font-semibold text-sm mb-2">{likes.toLocaleString()} like{likes !== 1 ? 's' : ''}</p>
                )}
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground uppercase mb-3">{timeAgo}</p>

               {/* Add Comment Form */}
                <form className="flex items-center border-t border-border pt-3" onSubmit={handleCommentSubmit}>
                    <Input
                        id={`detail-comment-input-${post.id}`}
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-0 h-auto bg-transparent"
                        aria-label="Add a comment"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
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
      </Card>
    </div>
  );
}

    