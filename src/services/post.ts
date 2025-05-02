
/**
 * Represents a single post in the feed or on a profile.
 */
export interface Post {
  /**
   * Unique ID of the post.
   */
  id: string;
  /**
   * Username of the user who created the post.
   */
  username: string;
  /**
   * URL of the user's avatar at the time of posting.
   */
  userAvatar: string;
  /**
   * URL of the main image/video content of the post.
   */
  imageUrl: string;
  /**
   * Text caption for the post.
   */
  caption: string;
  /**
   * Number of likes the post has received.
   */
  likes: number;
  /**
   * Number of comments on the post.
   */
  commentsCount: number; // Renamed for clarity vs. actual comment objects
  /**
   * Timestamp indicating when the post was created (human-readable or ISO string).
   */
  timestamp: string; // Could be Date object or ISO string
  /**
   * Optional hint for AI-based image search or description generation.
   */
  imageHint?: string;
}

/**
 * Represents a single comment on a post.
 */
export interface Comment {
    id: string;
    postId: string;
    username: string;
    userAvatar: string;
    text: string;
    timestamp: string; // Could be Date object or ISO string
}


// --- Mock Data Simulation (Replace with actual Firestore calls) ---

const mockPosts: Map<string, Post> = new Map([
  ['post-1', {
      id: 'post-1',
      username: 'naturelover',
      userAvatar: 'https://picsum.photos/seed/user1/32/32',
      imageUrl: 'https://picsum.photos/seed/post1/600/600',
      caption: 'Beautiful sunset view! #nature #sunset',
      likes: 152,
      commentsCount: 12,
      timestamp: '2 hours ago',
      imageHint: 'nature sunset',
  }],
  ['post-2', {
      id: 'post-2',
      username: 'foodiegal',
      userAvatar: 'https://picsum.photos/seed/user2/32/32',
      imageUrl: 'https://picsum.photos/seed/post2/600/750',
      caption: 'Delicious pasta dish I made tonight. 🍝 #food #homemade',
      likes: 210,
      commentsCount: 35,
      timestamp: '5 hours ago',
      imageHint: 'food pasta',
  }],
   ['post-3', {
      id: 'post-3',
      username: 'cityexplorer',
      userAvatar: 'https://picsum.photos/seed/user3/32/32',
      imageUrl: 'https://picsum.photos/seed/post3/600/600',
      caption: 'Exploring the city streets. #urban #citylife',
      likes: 98,
      commentsCount: 5,
      timestamp: '1 day ago',
      imageHint: 'city street',
  }],
  // Add more posts, including posts for 'current_user' and suggested users
  ...Array.from({ length: 15 }).map((_, i) => [`current_post_${i}`, {
      id: `current_post_${i}`,
      username: 'current_user',
      userAvatar: 'https://picsum.photos/seed/currentuser/32/32',
      imageUrl: `https://picsum.photos/seed/currentpost${i}/600/${Math.random() > 0.5 ? 600 : 750}`,
      caption: `My post number ${i + 1}! Enjoying the day. #random`,
      likes: Math.floor(Math.random() * 200),
      commentsCount: Math.floor(Math.random() * 30),
      timestamp: `${i + 1} day${i > 0 ? 's' : ''} ago`,
      imageHint: 'user lifestyle photo',
  }] as [string, Post]),
   ...Array.from({ length: 5 }).flatMap((_, userIndex) =>
       Array.from({ length: Math.floor(Math.random() * 10) + 2 }).map((_, postIndex) => {
           const username = `suggested_user_${userIndex + 1}`;
           const postId = `${username}_post_${postIndex}`;
           return [postId, {
                id: postId,
                username: username,
                userAvatar: `https://picsum.photos/seed/suggest_${username}/32/32`,
                imageUrl: `https://picsum.photos/seed/${postId}/${Math.random() > 0.5 ? 600 : 500}/${Math.random() > 0.5 ? 600 : 700}`,
                caption: `A random post from ${username}. Check it out! #${username}`,
                likes: Math.floor(Math.random() * 100),
                commentsCount: Math.floor(Math.random() * 15),
                timestamp: `${postIndex + 1} hour${postIndex > 0 ? 's' : ''} ago`,
                imageHint: 'suggested user content',
           }] as [string, Post];
       })
   ),
]);

const mockComments: Map<string, Comment[]> = new Map([
  ['post-1', [
    { id: 'c1-1', postId: 'post-1', username: 'commenter1', userAvatar: 'https://picsum.photos/seed/commenter1/32/32', text: 'Amazing shot!', timestamp: '1 hour ago' },
    { id: 'c1-2', postId: 'post-1', username: 'foodiegal', userAvatar: 'https://picsum.photos/seed/user2/32/32', text: 'So pretty!', timestamp: '30 mins ago' },
  ]],
  ['post-2', [
    { id: 'c2-1', postId: 'post-2', username: 'naturelover', userAvatar: 'https://picsum.photos/seed/user1/32/32', text: 'Looks delicious!', timestamp: '4 hours ago' },
    { id: 'c2-2', postId: 'post-2', username: 'commenter2', userAvatar: 'https://picsum.photos/seed/commenter2/32/32', text: 'Recipe please?', timestamp: '3 hours ago' },
    { id: 'c2-3', postId: 'post-2', username: 'commenter3', userAvatar: 'https://picsum.photos/seed/commenter3/32/32', text: 'Yummy!', timestamp: '1 hour ago' },
  ]],
    // Add more comments for other posts if needed
]);

// --- End Mock Data Simulation ---


/**
 * Asynchronously retrieves posts for the main feed.
 * Simulates fetching posts from Firestore, ordered by timestamp.
 *
 * @param limit The maximum number of posts to retrieve per batch (for pagination).
 * @param startAfter // TODO: Add pagination logic (e.g., using the timestamp or ID of the last fetched post)
 * @returns A promise that resolves to an array of Post objects.
 */
export async function getFeedPosts(limit: number = 10 /*, startAfter?: any */): Promise<Post[]> {
  console.log(`Simulating Firestore query for feed posts (limit: ${limit})`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In real Firestore:
  // Query the 'posts' collection, order by timestamp descending.
  // Implement pagination using startAfter(lastVisibleDoc).
  // const postsRef = collection(db, 'posts');
  // const q = query(postsRef, orderBy('timestamp', 'desc'), limit(limit)); // Add startAfter(startAfter) if provided
  // const querySnapshot = await getDocs(q);
  // return querySnapshot.docs.map(doc => ({ ...doc.data() as Post, id: doc.id }));

  // Mock implementation: Return a slice of all mock posts, sorted roughly by time (using array order as proxy)
  const allPosts = Array.from(mockPosts.values()).sort((a, b) => {
     // Crude sort based on mock timestamps - replace with real date sorting
     const timeA = parseInt(a.timestamp.split(' ')[0]);
     const timeB = parseInt(b.timestamp.split(' ')[0]);
     const unitA = a.timestamp.split(' ')[1];
     const unitB = b.timestamp.split(' ')[1];

     const factorA = unitA.startsWith('hour') ? 1 : unitA.startsWith('day') ? 24 : 0;
     const factorB = unitB.startsWith('hour') ? 1 : unitB.startsWith('day') ? 24 : 0;

     return (timeA * factorA) - (timeB * factorB); // Sorts oldest first - reverse for newest
  }).reverse();

  // TODO: Implement actual pagination based on startAfter
  return allPosts.slice(0, limit);
}

/**
 * Asynchronously retrieves posts created by a specific user.
 * Simulates querying Firestore for posts where the username matches.
 *
 * @param username The username whose posts are to be retrieved.
 * @param limit The maximum number of posts to retrieve.
 * @param startAfter // TODO: Add pagination logic
 * @returns A promise that resolves to an array of Post objects.
 */
export async function getUserPosts(username: string, limit: number = 12 /*, startAfter?: any */): Promise<Post[]> {
  console.log(`Simulating Firestore query for posts by user: ${username} (limit: ${limit})`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 450));

  // In real Firestore:
  // Query the 'posts' collection, filter by username, order by timestamp descending.
  // Implement pagination.
  // const postsRef = collection(db, 'posts');
  // const q = query(postsRef, where('username', '==', username), orderBy('timestamp', 'desc'), limit(limit));
  // const querySnapshot = await getDocs(q);
  // return querySnapshot.docs.map(doc => ({ ...doc.data() as Post, id: doc.id }));

  const userPosts = Array.from(mockPosts.values())
      .filter(post => post.username === username)
      .sort((a, b) => { /* similar crude sort as getFeedPosts */
            const timeA = parseInt(a.timestamp.split(' ')[0]);
            const timeB = parseInt(b.timestamp.split(' ')[0]);
            const unitA = a.timestamp.split(' ')[1];
            const unitB = b.timestamp.split(' ')[1];
            const factorA = unitA.startsWith('hour') ? 1 : unitA.startsWith('day') ? 24 : 0;
            const factorB = unitB.startsWith('hour') ? 1 : unitB.startsWith('day') ? 24 : 0;
            return (timeA * factorA) - (timeB * factorB);
      }).reverse();

  return userPosts.slice(0, limit);
}


/**
 * Asynchronously retrieves comments for a specific post.
 * Simulates querying Firestore subcollection for comments.
 *
 * @param postId The ID of the post for which to retrieve comments.
 * @param limit The maximum number of comments to retrieve.
 * @param startAfter // TODO: Add pagination logic
 * @returns A promise that resolves to an array of Comment objects.
 */
export async function getPostComments(postId: string, limit: number = 20 /*, startAfter?: any */): Promise<Comment[]> {
    console.log(`Simulating Firestore query for comments on post: ${postId} (limit: ${limit})`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 350));

    // In real Firestore:
    // Query the 'comments' subcollection within the specific post document.
    // const commentsRef = collection(db, 'posts', postId, 'comments');
    // const q = query(commentsRef, orderBy('timestamp', 'asc'), limit(limit)); // Order by oldest first
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ ...doc.data() as Comment, id: doc.id }));

    const comments = mockComments.get(postId) || [];
    // Sort comments by timestamp (assuming mock timestamps allow basic comparison)
    const sortedComments = comments.sort((a, b) => {
        // Crude sort - replace with actual date parsing and comparison
         const timeA = parseInt(a.timestamp.split(' ')[0]);
         const timeB = parseInt(b.timestamp.split(' ')[0]);
         const unitA = a.timestamp.split(' ')[1];
         const unitB = b.timestamp.split(' ')[1];
         const factorA = unitA.startsWith('min') ? 1 : unitA.startsWith('hour') ? 60 : 0;
         const factorB = unitB.startsWith('min') ? 1 : unitB.startsWith('hour') ? 60 : 0;
         return (timeB * factorB) - (timeA * factorA); // Newest first for display? Or oldest? Adjust as needed.
    });

    return sortedComments.slice(0, limit);
}


/**
 * Asynchronously adds a comment to a post.
 * Simulates writing to a Firestore subcollection.
 *
 * @param postId The ID of the post to add the comment to.
 * @param username The username of the commenter.
 * @param text The text content of the comment.
 * @returns A promise that resolves to the newly created Comment object.
 */
export async function addComment(postId: string, username: string, text: string): Promise<Comment> {
    console.log(`Simulating adding comment by ${username} to post ${postId}: "${text}"`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!mockPosts.has(postId)) {
        throw new Error("Post not found");
    }

    const newComment: Comment = {
        id: `c-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`,
        postId: postId,
        username: username,
        userAvatar: `https://picsum.photos/seed/${username}/32/32`, // Fetch or use current user's avatar
        text: text,
        timestamp: 'Just now', // Or new Date().toISOString()
    };

    // In real Firestore:
    // const commentsRef = collection(db, 'posts', postId, 'comments');
    // const docRef = await addDoc(commentsRef, {
    //     username: newComment.username,
    //     userAvatar: newComment.userAvatar,
    //     text: newComment.text,
    //     timestamp: serverTimestamp() // Use server timestamp
    // });
    // Update the commentsCount on the post document using a transaction or FieldValue.increment(1).
    // const postRef = doc(db, 'posts', postId);
    // await updateDoc(postRef, { commentsCount: increment(1) });
    // return { ...newComment, id: docRef.id }; // Return with the actual ID

    // Mock implementation:
    if (!mockComments.has(postId)) {
        mockComments.set(postId, []);
    }
    mockComments.get(postId)?.push(newComment);

    // Update mock post's comment count
    const post = mockPosts.get(postId);
    if (post) {
        post.commentsCount += 1;
        mockPosts.set(postId, post);
    }


    return newComment;
}

/**
 * Asynchronously likes a post.
 * Simulates updating like count and potentially adding user ID to a 'likes' subcollection/array.
 *
 * @param postId The ID of the post to like.
 * @param username The username of the user liking the post.
 * @returns A promise that resolves when the action is complete (simulation).
 */
export async function likePost(postId: string, username: string): Promise<void> {
    console.log(`Simulating like by ${username} on post ${postId}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const post = mockPosts.get(postId);
    if (post) {
        // In real Firestore:
        // Use a transaction:
        // 1. Check if user already liked (e.g., in a 'likes/{userId}' subcollection).
        // 2. If not liked:
        //    - Add user ID to 'likes' subcollection/array.
        //    - Increment 'likes' count on the post document.
        post.likes += 1; // Simple increment for mock
        mockPosts.set(postId, post);
        console.log(`Post ${postId} like count updated to ${post.likes} (simulation).`);
    } else {
        console.warn(`Post ${postId} not found for liking.`);
    }
}

/**
 * Asynchronously unlikes a post.
 * Simulates updating like count and removing user ID from 'likes'.
 *
 * @param postId The ID of the post to unlike.
 * @param username The username of the user unliking the post.
 * @returns A promise that resolves when the action is complete (simulation).
 */
export async function unlikePost(postId: string, username: string): Promise<void> {
    console.log(`Simulating unlike by ${username} on post ${postId}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const post = mockPosts.get(postId);
    if (post && post.likes > 0) {
        // In real Firestore:
        // Use a transaction:
        // 1. Check if user actually liked the post.
        // 2. If liked:
        //    - Remove user ID from 'likes' subcollection/array.
        //    - Decrement 'likes' count on the post document.
        post.likes -= 1; // Simple decrement for mock
        mockPosts.set(postId, post);
        console.log(`Post ${postId} like count updated to ${post.likes} (simulation).`);
    } else if (post) {
        console.warn(`Post ${postId} already has 0 likes or user didn't like it (simulation).`);
    } else {
        console.warn(`Post ${postId} not found for unliking.`);
    }
}

// --- Other Potential Post Service Functions ---
// - createPost(...)
// - deletePost(...)
// - getExplorePosts(...) // Posts for the explore grid, maybe based on popularity or trends
// - getSavedPosts(...) // Fetch posts saved by the current user
// - savePost(...)
// - unsavePost(...)
