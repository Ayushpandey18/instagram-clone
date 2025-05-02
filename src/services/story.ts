
/**
 * Represents a single story item (usually an image or short video).
 */
export interface StoryItem {
  id: string; // Unique ID for the story item
  type: 'image' | 'video'; // Type of media
  url: string; // URL of the media content
  duration?: number; // Duration in seconds (relevant for video)
  timestamp: string; // When the story item was created (ISO string or Date)
}

/**
 * Represents a user's collection of stories.
 */
export interface UserStory {
  /**
   * Username of the user who posted the stories.
   */
  username: string;
  /**
   * URL of the user's avatar.
   */
  userAvatar: string;
  /**
   * Array of story items posted by the user within the last 24 hours.
   */
  items: StoryItem[];
  /**
   * Timestamp of the latest story item in the collection.
   */
  latestTimestamp: string; // Used for sorting users in the story tray
  /**
   * Indicates if the current logged-in user has already viewed all stories in this collection.
   */
  viewedByCurrentUser?: boolean; // Needs logic based on current user state
}

// --- Mock Data Simulation (Replace with actual Firestore calls) ---

const mockUserStories: Map<string, UserStory> = new Map();

// Function to generate mock stories for a user
const generateMockStories = (username: string, avatarUrl: string, count: number): UserStory => {
    const items: StoryItem[] = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        // Simulate stories posted within the last few hours
        const timestamp = new Date(now - Math.random() * 12 * 60 * 60 * 1000).toISOString();
        items.push({
            id: `story_${username}_${i}_${Date.now()}`,
            type: 'image', // Keep it simple with images for mock
            url: `https://picsum.photos/seed/story_${username}_${i}/540/960`, // Portrait aspect ratio
            timestamp: timestamp,
        });
    }
    // Sort items by timestamp, oldest first
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
        username: username,
        userAvatar: avatarUrl,
        items: items,
        latestTimestamp: items[items.length - 1]?.timestamp || new Date(now).toISOString(),
        // Simulate some stories being viewed (needs current user context in real app)
        viewedByCurrentUser: Math.random() > 0.7,
    };
};

// Populate mock stories for some users from the user service (ensure user service data is available or mock here too)
const usersForStories = ['naturelover', 'foodiegal', 'cityexplorer', 'current_user', 'suggested_user_1', 'suggested_user_2', 'suggested_user_3', 'suggested_user_4', 'suggested_user_5', 'suggested_user_6','suggested_user_7','suggested_user_8','suggested_user_9','suggested_user_10','suggested_user_11'];
usersForStories.forEach((username, index) => {
    const avatarSeed = username === 'current_user' ? 'currentuser' : `user${index + 1}`;
    const avatarUrl = `https://picsum.photos/seed/${avatarSeed}/64/64`; // Avatar size for story tray
    const storyCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 story items per user
    if (Math.random() > 0.2) { // 80% chance a user has stories
       mockUserStories.set(username, generateMockStories(username, avatarUrl, storyCount));
    }
});


// --- End Mock Data Simulation ---


/**
 * Asynchronously retrieves active stories for the story tray.
 * Simulates fetching stories from Firestore posted within the last 24 hours,
 * ordered by latest story timestamp (or viewed status).
 *
 * @returns A promise that resolves to an array of UserStory objects.
 */
export async function getActiveStories(): Promise<UserStory[]> {
    console.log('Simulating Firestore query for active stories');
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In real Firestore:
    // 1. Query a 'stories' collection or user documents for active story metadata.
    // 2. Filter stories created within the last 24 hours.
    // 3. Potentially filter based on following status (only show stories from followed users + own stories).
    // 4. Order results (e.g., unviewed first, then by latest timestamp).
    // const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // const storiesRef = collection(db, 'stories'); // Or query user docs
    // const q = query(storiesRef, where('latestTimestamp', '>', twentyFourHoursAgo.toISOString()), orderBy('latestTimestamp', 'desc')); // Simplified query
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ ...doc.data() as UserStory, username: doc.id })); // Adapt structure

    // Mock implementation: Return all mock stories, sorted
    const activeStories = Array.from(mockUserStories.values());

    // Sort logic: Unviewed first, then by latest timestamp descending
    activeStories.sort((a, b) => {
        if (a.viewedByCurrentUser !== b.viewedByCurrentUser) {
            return a.viewedByCurrentUser ? 1 : -1; // Unviewed (false) come first
        }
        // If viewed status is the same, sort by latest timestamp (newest first)
        return new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime();
    });

    return activeStories;
}

/**
 * Asynchronously adds a new story item for a user.
 * Simulates uploading media and updating Firestore.
 *
 * @param username The username of the user adding the story.
 * @param item The StoryItem data (url should ideally be obtained after upload).
 * @returns A promise that resolves when the story is added.
 */
export async function addStoryItem(username: string, item: Omit<StoryItem, 'id' | 'timestamp'>): Promise<void> {
    console.log(`Simulating adding story item for user ${username}`);
    // Simulate media upload and API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // In a real application:
    // 1. Upload media (image/video) to Firebase Storage or another provider. Get the URL.
    // 2. Create the full StoryItem object with the URL, ID, and server timestamp.
    // 3. Update the user's story data in Firestore:
    //    - Add the new item to the 'items' array.
    //    - Update 'latestTimestamp'.
    //    - Reset 'viewedBy' status for followers (or handle viewing logic differently).
    //    - Potentially use a separate 'stories' collection for better querying.

    const newItem: StoryItem = {
        ...item,
        id: `story_${username}_new_${Date.now()}`,
        timestamp: new Date().toISOString(),
    };

    let userStory = mockUserStories.get(username);

    if (userStory) {
        userStory.items.push(newItem);
        userStory.latestTimestamp = newItem.timestamp;
        userStory.viewedByCurrentUser = false; // New story means it's unviewed by default
    } else {
        // Create a new story collection if it's the user's first story
        const avatarUrl = `https://picsum.photos/seed/${username}/64/64`; // Get actual avatar
        userStory = {
            username: username,
            userAvatar: avatarUrl,
            items: [newItem],
            latestTimestamp: newItem.timestamp,
            viewedByCurrentUser: false,
        };
    }
    mockUserStories.set(username, userStory);
    console.log(`Story item added for ${username}.`);
}

/**
 * Marks a user's story collection as viewed by the current user.
 * Simulates updating the viewed status in Firestore.
 *
 * @param username The username whose stories were viewed.
 * @returns A promise that resolves when the status is updated.
 */
export async function markStoriesAsViewed(username: string): Promise<void> {
    console.log(`Simulating marking stories as viewed for user: ${username}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In real Firestore:
    // Update the user's story document or metadata to indicate that the current authenticated user has viewed it.
    // This might involve adding the current user's ID to a 'viewedBy' array associated with the story collection.

    const userStory = mockUserStories.get(username);
    if (userStory) {
        userStory.viewedByCurrentUser = true;
        mockUserStories.set(username, userStory);
        console.log(`Stories marked as viewed for ${username} (simulation).`);
    } else {
        console.warn(`Stories not found for user ${username} to mark as viewed.`);
    }
}


// --- Other Potential Story Service Functions ---
// - deleteStoryItem(...)
// - getStoryViewers(...) // Fetch list of users who viewed a specific story item
