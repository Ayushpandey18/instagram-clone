
import type { Post } from './post'; // Assuming Post type exists

/**
 * Represents a user profile.
 */
export interface UserProfile {
  /**
   * Unique username. Acts as the ID in this context.
   */
  username: string;
  /**
   * User's full name.
   */
  fullName: string;
  /**
   * URL of the user's avatar image.
   */
  avatarUrl: string;
  /**
   * User's biography.
   */
  bio: string;
  /**
   * Number of posts the user has made.
   */
  postsCount: number;
  /**
   * Number of followers the user has.
   */
  followersCount: number;
  /**
   * Number of users the user is following.
   */
  followingCount: number;
   /**
    * Optional user website link
    */
   website?: string;
   /**
    * Optional user email (usually kept private)
    */
   email?: string; // Example private field
   /**
    * Optional user phone number (usually kept private)
    */
   phone?: string; // Example private field
}

/**
 * Represents a suggested user for following.
 */
export interface SuggestedUser {
  id: string; // Typically the username or a unique ID
  username: string;
  fullName: string;
  avatarUrl: string;
  reason: string; // e.g., "Suggested for you", "Followed by..."
  mutualFriends?: number; // Optional: Number of mutual friends
}


// --- Mock Data Simulation (Replace with actual Firestore calls) ---

const mockUsers: Map<string, UserProfile> = new Map([
  ['current_user', {
    username: 'current_user',
    fullName: 'Current User Name',
    avatarUrl: 'https://picsum.photos/seed/currentuser/150/150',
    bio: 'This is the bio of the current user. Exploring the world!',
    postsCount: 15,
    followersCount: 250,
    followingCount: 180,
    website: "https://example.com",
    email: "user@example.com",
    phone: "123-456-7890"
  }],
  ['naturelover', {
    username: 'naturelover',
    fullName: 'Nature Lover',
    avatarUrl: 'https://picsum.photos/seed/user1/150/150',
    bio: 'Capturing the beauty of the outdoors.',
    postsCount: 25,
    followersCount: 500,
    followingCount: 120,
  }],
    ['foodiegal', {
    username: 'foodiegal',
    fullName: 'Foodie Gal',
    avatarUrl: 'https://picsum.photos/seed/user2/150/150',
    bio: 'Sharing delicious recipes and food adventures!',
    postsCount: 50,
    followersCount: 1200,
    followingCount: 300,
  }],
    ['cityexplorer', {
    username: 'cityexplorer',
    fullName: 'City Explorer',
    avatarUrl: 'https://picsum.photos/seed/user3/150/150',
    bio: 'Finding hidden gems in urban landscapes.',
    postsCount: 30,
    followersCount: 800,
    followingCount: 250,
  }],
  // Add more mock users as needed, including suggested users
   ...Array.from({ length: 18 }, (_, i) => [`suggested_user_${i + 1}`, {
        username: `suggested_user_${i + 1}`,
        fullName: `Suggested User ${i + 1}`,
        avatarUrl: `https://picsum.photos/seed/suggest_exp${i + 1}/150/150`,
        bio: `Hello from suggested user ${i+1}!`,
        postsCount: Math.floor(Math.random() * 50) + 5,
        followersCount: Math.floor(Math.random() * 1000) + 50,
        followingCount: Math.floor(Math.random() * 500) + 20,
    }] as [string, UserProfile]),
]);

// --- End Mock Data Simulation ---


/**
 * Asynchronously retrieves a user's profile information.
 * Simulates fetching data from Firestore based on username.
 *
 * @param username The username of the profile to retrieve.
 * @returns A promise that resolves to the UserProfile object or null if not found.
 */
export async function getUserProfile(username: string): Promise<(UserProfile & { isCurrentUser: boolean }) | null> {
  console.log(`Simulating Firestore fetch for user profile: ${username}`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400));

  // In real Firestore:
  // const userDocRef = doc(db, 'users', username);
  // const userSnap = await getDoc(userDocRef);
  // if (userSnap.exists()) {
  //   return { ...userSnap.data() as UserProfile, isCurrentUser: username === 'current_user' }; // Check against authenticated user
  // } else {
  //   return null;
  // }

  const profile = mockUsers.get(username);
  if (profile) {
      // Determine if this is the 'logged-in' user (based on mock data convention)
      const isCurrentUser = username === 'current_user';
      return { ...profile, isCurrentUser };
  } else {
      // Simulate creating profile data on the fly for non-predefined users if needed for testing
      if (username !== 'current_user' && username.includes('_user_')) {
         const genericProfile: UserProfile = {
           username: username,
           fullName: username.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
           avatarUrl: `https://picsum.photos/seed/${username}/150/150`,
           bio: `Hello! I'm ${username}. Welcome to my profile.`,
           postsCount: Math.floor(Math.random() * 50) + 5,
           followersCount: Math.floor(Math.random() * 1000) + 50,
           followingCount: Math.floor(Math.random() * 500) + 20,
         };
         mockUsers.set(username, genericProfile); // Add to mock store
         return { ...genericProfile, isCurrentUser: false };
      }
      console.log(`User profile not found for: ${username}`);
      return null;
  }
}

/**
 * Asynchronously retrieves the profile of the currently authenticated user.
 * Simulates fetching based on a known current user identifier.
 *
 * @returns A promise that resolves to the UserProfile object of the current user, or null if not logged in/found.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
   console.log('Simulating Firestore fetch for current user');
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 150));

   // In real app: Use Firebase Auth to get current user ID/username
   // const authUser = auth.currentUser;
   // if (!authUser) return null;
   // return getUserProfile(authUser.uid); // Or fetch by UID

   const currentUser = mockUsers.get('current_user');
   return currentUser || null;
}


/**
 * Asynchronously retrieves a list of suggested users to follow.
 * Simulates querying Firestore for suggestions.
 *
 * @param limit The maximum number of suggestions to retrieve. Defaults to 5.
 * @returns A promise that resolves to an array of SuggestedUser objects.
 */
export async function getSuggestedUsers(limit: number = 5): Promise<SuggestedUser[]> {
  console.log(`Simulating Firestore query for ${limit} suggested users`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // In real Firestore:
  // Query users collection, excluding the current user and users already followed.
  // Apply suggestion logic (e.g., mutual friends, common interests).
  // const usersRef = collection(db, 'users');
  // const q = query(usersRef, where('username', '!=', 'current_user'), limit(limit)); // Simplified query
  // const querySnapshot = await getDocs(q);
  // return querySnapshot.docs.map(doc => ({ ...doc.data() as UserProfile, id: doc.id, reason: "Suggested for you" })); // Adapt structure

  const allUsernames = Array.from(mockUsers.keys());
  const suggested: SuggestedUser[] = [];
  let attempts = 0;

  while (suggested.length < limit && attempts < allUsernames.length * 2) {
     const randomIndex = Math.floor(Math.random() * allUsernames.length);
     const username = allUsernames[randomIndex];
     // Ensure it's not the current user and not already added
     if (username !== 'current_user' && !suggested.some(u => u.username === username)) {
       const userProfile = mockUsers.get(username);
       if (userProfile) {
          suggested.push({
              id: userProfile.username, // Use username as ID for simplicity
              username: userProfile.username,
              fullName: userProfile.fullName,
              avatarUrl: `https://picsum.photos/seed/suggest_${userProfile.username}/32/32`, // Different size for suggestion list
              reason: "Suggested for you",
              mutualFriends: Math.floor(Math.random() * 5), // Add random mutual friends
          });
       }
     }
     attempts++;
  }

  return suggested;
}


/**
 * Asynchronously retrieves a list of users for the 'Explore People' page.
 * Simulates querying Firestore for a larger set of discoverable users.
 *
 * @param limit The maximum number of users to retrieve. Defaults to 18.
 * @returns A promise that resolves to an array of SuggestedUser objects.
 */
export async function getExplorePeople(limit: number = 18): Promise<SuggestedUser[]> {
  console.log(`Simulating Firestore query for ${limit} explore people`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Similar logic to getSuggestedUsers, but potentially fetching more diverse users
  const allUsernames = Array.from(mockUsers.keys());
  const exploreUsers: SuggestedUser[] = [];
  let attempts = 0;

  while (exploreUsers.length < limit && attempts < allUsernames.length * 2) {
     const randomIndex = Math.floor(Math.random() * allUsernames.length);
     const username = allUsernames[randomIndex];
     // Ensure it's not the current user and not already added
     if (username !== 'current_user' && !exploreUsers.some(u => u.username === username)) {
       const userProfile = mockUsers.get(username);
       if (userProfile) {
          exploreUsers.push({
              id: userProfile.username,
              username: userProfile.username,
              fullName: userProfile.fullName,
              avatarUrl: `https://picsum.photos/seed/explore_p_${userProfile.username}/90/90`, // Different seed/size
              reason: "Suggested for you",
              mutualFriends: Math.floor(Math.random() * 5),
          });
       }
     }
     attempts++;
  }

  return exploreUsers;
}

// --- Placeholder functions for actions (would typically involve backend calls) ---

export async function followUser(usernameToFollow: string): Promise<void> {
    console.log(`Simulating following user: ${usernameToFollow}`);
    // In real app: Send API request to follow `usernameToFollow`.
    // Update follower/following counts on both user profiles in Firestore.
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Successfully followed ${usernameToFollow} (simulation).`);
    // You might want to return updated user data or just success/failure.
}

export async function unfollowUser(usernameToUnfollow: string): Promise<void> {
    console.log(`Simulating unfollowing user: ${usernameToUnfollow}`);
    // In real app: Send API request to unfollow `usernameToUnfollow`.
    // Update follower/following counts on both user profiles in Firestore.
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Successfully unfollowed ${usernameToUnfollow} (simulation).`);
}

export async function updateUserProfile(username: string, updates: Partial<UserProfile>): Promise<void> {
    console.log(`Simulating update for user: ${username}`, updates);
     // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In real Firestore:
    // const userDocRef = doc(db, 'users', username);
    // await updateDoc(userDocRef, updates);

    const user = mockUsers.get(username);
    if (user) {
        // Filter out fields that shouldn't be directly updatable this way (like counts)
        const allowedUpdates = { ...updates };
        delete allowedUpdates.postsCount;
        delete allowedUpdates.followersCount;
        delete allowedUpdates.followingCount;
        delete allowedUpdates.email; // Usually handled via account settings
        delete allowedUpdates.phone; // Usually handled via account settings

        mockUsers.set(username, { ...user, ...allowedUpdates });
        console.log(`User profile updated for ${username} (simulation).`);
    } else {
        throw new Error(`User ${username} not found for update.`);
    }
}
