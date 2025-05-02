import React from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

interface PostProps {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  imageHint?: string;
}

const Post: React.FC<PostProps> = ({
  username,
  userAvatar,
  imageUrl,
  caption,
  likes,
  comments,
  timestamp,
  imageHint,
}) => {
  return (
    <div className="bg-background border border-border rounded-lg mb-6 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center p-3">
        <Avatar className="h-8 w-8 mr-3">
          <AvatarImage src={userAvatar} alt={`${username}'s avatar`} data-ai-hint="person profile" />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <Link href={`/profile/${username}`} className="font-semibold text-sm hover:underline">
          {username}
        </Link>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Post Image */}
      <div className="relative w-full aspect-square bg-secondary">
        <Image
          src={imageUrl}
          alt={`Post by ${username}`}
          layout="fill"
          objectFit="cover"
          data-ai-hint={imageHint || "placeholder image"}
        />
      </div>

      {/* Post Actions */}
      <div className="flex items-center p-3 space-x-4">
        <Button variant="ghost" size="icon" className="p-0 h-auto">
          <Heart className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="p-0 h-auto">
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="p-0 h-auto">
          <Send className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="ml-auto p-0 h-auto">
          <Bookmark className="h-6 w-6" />
        </Button>
      </div>

      {/* Likes Count */}
      <div className="px-3 pb-1">
        <p className="font-semibold text-sm">{likes.toLocaleString()} likes</p>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm">
          <Link href={`/profile/${username}`} className="font-semibold mr-1 hover:underline">
            {username}
          </Link>
          {caption}
        </p>
      </div>

      {/* View Comments */}
      {comments > 0 && (
        <div className="px-3 pb-2">
          <Link href={`/p/${username}`} legacyBehavior>
            <a className="text-sm text-muted-foreground">
                View all {comments} comments
            </a>
          </Link>
        </div>
      )}

       {/* Timestamp */}
      <div className="px-3 pb-3">
        <p className="text-xs text-muted-foreground uppercase">{timestamp}</p>
      </div>


      {/* Add Comment */}
      <div className="border-t border-border p-3">
        <form className="flex items-center">
          <Input
            type="text"
            placeholder="Add a comment..."
            className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm p-0 h-auto bg-transparent"
          />
          <Button type="submit" variant="ghost" size="sm" className="text-primary hover:text-primary font-semibold px-0">
            Post
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Post;
