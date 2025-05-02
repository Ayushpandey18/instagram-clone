
/**
 * Represents a single Reel video.
 */
export interface Reel {
  /**
   * Unique ID of the Reel.
   */
  id: string;
  /**
   * Username of the user who posted the Reel.
   */
  username: string;
  /**
   * URL of the user's avatar.
   */
  userAvatar: string;
  /**
   * URL of the Reel video file.
   */
  videoUrl: string;
  /**
   * Optional: URL of the video thumbnail/cover image.
   */
  thumbnailUrl?: string;
  /**
   * Text caption or description for the Reel.
   */
  caption: string;
  /**
   * Name or ID of the audio track used (if any).
   */
  audioName?: string;
  /**
   * Number of likes the Reel has received.
   */
  likes: number;
  /**
   * Number of comments on the Reel.
   */
  commentsCount: number;
   /**
   * Number of shares (optional).
   */
  shares?: number;
   /**
   * Number of views (optional).
   */
  views?: number;
  /**
   * Timestamp indicating when the Reel was posted.
   */
  timestamp: string; // Could be Date object or ISO string
}


// --- Mock Data Simulation (Replace with actual Firestore calls) ---

const mockReels: Map<string, Reel> = new Map();

// Function to generate mock reels for various users
const generateMockReels = (count: number) => {
    const users = ['naturelover', 'foodiegal', 'cityexplorer', 'current_user', 'suggested_user_1', 'suggested_user_5', 'suggested_user_9']; // Example users
    for (let i = 0; i < count; i++) {
        const userIndex = Math.floor(Math.random() * users.length);
        const username = users[userIndex];
        const reelId = `reel_${username}_${i}_${Date.now()}`;
        mockReels.set(reelId, {
            id: reelId,
            username: username,
            userAvatar: `https://picsum.photos/seed/${username}_reel/32/32`,
            // Placeholder video URL - in reality, these would point to actual video files
            videoUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4?${reelId}`, // Use a sample video, add ID to vary
             thumbnailUrl: `https://picsum.photos/seed/reel_thumb_${reelId}/360/640`, // Portrait thumbnail
            caption: `Check out this cool Reel! #${username} #reel #fun ${i}`,
            audioName: `Original Audio - ${username}`, // Mock audio name
            likes: Math.floor(Math.random() * 5000),
            commentsCount: Math.floor(Math.random() * 500),
            shares: Math.floor(Math.random() * 100),
            views: Math.floor(Math.random() * 100000),
            timestamp: `${Math.floor(Math.random() * 24) + 1} hours ago`, // Mock timestamp
        });
    }
};

generateMockReels(25); // Generate 25 mock reels


// --- End Mock Data Simulation ---


/**
 * Asynchronously retrieves Reels for the Reels feed.
 * Simulates fetching Reels from Firestore, possibly ordered by engagement or recommendation algorithm.
 *
 * @param limit The maximum number of Reels to retrieve per batch.
 * @param startAfter // TODO: Add pagination logic
 * @returns A promise that resolves to an array of Reel objects.
 */
export async function getReelsFeed(limit: number = 5 /*, startAfter?: any */): Promise<Reel[]> {
    console.log(`Simulating Firestore query for Reels feed (limit: ${limit})`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));

    // In real Firestore:
    // Query 'reels' collection.
    // Order by a recommendation score, engagement rate, or timestamp.
    // Implement proper pagination.
    // const reelsRef = collection(db, 'reels');
    // const q = query(reelsRef, orderBy('timestamp', 'desc'), limit(limit)); // Simple example: order by time
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ ...doc.data() as Reel, id: doc.id }));

    // Mock implementation: Return a shuffled slice of mock reels.
    const allReels = Array.from(mockReels.values());
    const shuffledReels = allReels.sort(() => 0.5 - Math.random());

    // TODO: Implement actual pagination based on startAfter
    return shuffledReels.slice(0, limit);
}


/**
 * Asynchronously retrieves Reels posted by a specific user.
 * Simulates querying Firestore for Reels filtered by username.
 *
 * @param username The username whose Reels are to be retrieved.
 * @param limit The maximum number of Reels to retrieve.
 * @param startAfter // TODO: Add pagination logic
 * @returns A promise that resolves to an array of Reel objects.
 */
export async function getUserReels(username: string, limit: number = 12 /*, startAfter?: any */): Promise<Reel[]> {
    console.log(`Simulating Firestore query for Reels by user: ${username} (limit: ${limit})`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // In real Firestore:
    // Query 'reels' collection, filter by username, order by timestamp.
    // Implement pagination.
    // const reelsRef = collection(db, 'reels');
    // const q = query(reelsRef, where('username', '==', username), orderBy('timestamp', 'desc'), limit(limit));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ ...doc.data() as Reel, id: doc.id }));

    const userReels = Array.from(mockReels.values())
        .filter(reel => reel.username === username)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort newest first

    // TODO: Implement pagination
    return userReels.slice(0, limit);
}


/**
 * Asynchronously creates a new Reel post.
 * Simulates uploading video and adding data to Firestore.
 *
 * @param reelData Data for the new Reel (excluding ID, timestamp, initial counts).
 * @returns A promise that resolves to the newly created Reel object.
 */
export async function createReel(reelData: Omit<Reel, 'id' | 'likes' | 'commentsCount' | 'shares' | 'views' | 'timestamp'>): Promise<Reel> {
    console.log(`Simulating creating Reel for user: ${reelData.username}`);
    // Simulate video upload and API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real application:
    // 1. Upload video to Firebase Storage or similar. Get the URL.
    // 2. Optionally generate thumbnail URL.
    // 3. Create the full Reel object with server timestamp and initial counts (0).
    // 4. Add the new Reel document to the 'reels' collection in Firestore.

    const newReel: Reel = {
        ...reelData,
        id: `reel_${reelData.username}_${Date.now()}`,
        likes: 0,
        commentsCount: 0,
        shares: 0,
        views: 0,
        timestamp: new Date().toISOString(), // Use ISO string timestamp
    };

    mockReels.set(newReel.id, newReel);
    console.log('Reel created (simulation):', newReel);
    return newReel;
}


// --- Placeholder functions for Reel actions (like, comment) ---

export async function likeReel(reelId: string, username: string): Promise<void> {
    console.log(`Simulating like by ${username} on reel ${reelId}`);
    await new Promise(resolve => setTimeout(resolve, 150));
    const reel = mockReels.get(reelId);
    if (reel) {
        reel.likes += 1;
        mockReels.set(reelId, reel);
    }
}

export async function unlikeReel(reelId: string, username: string): Promise<void> {
    console.log(`Simulating unlike by ${username} on reel ${reelId}`);
     await new Promise(resolve => setTimeout(resolve, 150));
    const reel = mockReels.get(reelId);
    if (reel && reel.likes > 0) {
        reel.likes -= 1;
        mockReels.set(reelId, reel);
    }
}

export async function addReelComment(reelId: string, username: string, text: string): Promise<void> {
     console.log(`Simulating comment by ${username} on reel ${reelId}: "${text}"`);
     await new Promise(resolve => setTimeout(resolve, 250));
    const reel = mockReels.get(reelId);
    if (reel) {
        reel.commentsCount += 1;
        mockReels.set(reelId, reel);
        // In real app, also add the comment to a subcollection: db.collection('reels').doc(reelId).collection('comments').add(...)
    }
}
