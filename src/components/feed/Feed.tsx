import React from 'react';
import Post from './Post';

const Feed = () => {
  // Placeholder data - replace with actual data fetching
  const posts = [
    {
      id: '1',
      username: 'naturelover',
      userAvatar: 'https://picsum.photos/seed/user1/32/32',
      imageUrl: 'https://picsum.photos/seed/post1/600/600',
      caption: 'Beautiful sunset view! #nature #sunset',
      likes: 152,
      comments: 12,
      timestamp: '2 hours ago',
      imageHint: 'nature sunset',
    },
    {
      id: '2',
      username: 'foodiegal',
      userAvatar: 'https://picsum.photos/seed/user2/32/32',
      imageUrl: 'https://picsum.photos/seed/post2/600/750',
      caption: 'Delicious pasta dish I made tonight. 🍝 #food #homemade',
      likes: 210,
      comments: 35,
      timestamp: '5 hours ago',
      imageHint: 'food pasta',
    },
     {
      id: '3',
      username: 'cityexplorer',
      userAvatar: 'https://picsum.photos/seed/user3/32/32',
      imageUrl: 'https://picsum.photos/seed/post3/600/600',
      caption: 'Exploring the city streets. #urban #citylife',
      likes: 98,
      comments: 5,
      timestamp: '1 day ago',
      imageHint: 'city street',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      {posts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
};

export default Feed;
