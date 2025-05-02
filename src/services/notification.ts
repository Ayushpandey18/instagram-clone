
/**
 * Represents different types of notifications.
 */
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';

/**
 * Represents a single notification item.
 */
export interface Notification {
  /**
   * Unique ID of the notification.
   */
  id: string;
  /**
   * Type of the notification.
   */
  type: NotificationType;
  /**
   * Username of the user who triggered the notification (e.g., who liked, commented, followed).
   */
  actorUsername: string;
  /**
   * URL of the actor's avatar.
   */
  actorAvatarUrl: string;
  /**
   * Timestamp indicating when the notification occurred.
   */
  timestamp: string; // Could be Date object or ISO string
  /**
   * Optional: ID of the related post or reel (for likes, comments, mentions).
   */
  contentId?: string;
  /**
   * Optional: URL of the thumbnail for the related content.
   */
  contentThumbnailUrl?: string;
   /**
   * Optional: Text snippet (e.g., the comment text).
   */
  snippet?: string;
  /**
   * Indicates if the notification has been read by the user.
   */
  isRead: boolean;
}


// --- Mock Data Simulation (Replace with actual Firestore calls) ---

const mockNotifications: Map<string, Notification> = new Map();

// Function to generate mock notifications for the 'current_user'
const generateMockNotifications = (count: number) => {
  const users = ['naturelover', 'foodiegal', 'cityexplorer', 'suggested_user_1', 'suggested_user_5']; // Example actors
  const types: NotificationType[] = ['like', 'comment', 'follow', 'mention'];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const actorIndex = Math.floor(Math.random() * users.length);
    const actorUsername = users[actorIndex];
    const typeIndex = Math.floor(Math.random() * types.length);
    const type = types[typeIndex];
    const notificationId = `notif_${i}_${Date.now()}`;
    const timestamp = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(); // Within last week

    const notification: Notification = {
      id: notificationId,
      type: type,
      actorUsername: actorUsername,
      actorAvatarUrl: `https://picsum.photos/seed/${actorUsername}_notif/40/40`,
      timestamp: timestamp,
      isRead: Math.random() > 0.4, // ~60% unread
    };

    if (type === 'like' || type === 'comment' || type === 'mention') {
      // Link to a random post of the current_user (assuming they exist)
      const userPostIndex = Math.floor(Math.random() * 15); // Assuming 15 posts for current_user
      notification.contentId = `current_post_${userPostIndex}`;
      notification.contentThumbnailUrl = `https://picsum.photos/seed/currentpost${userPostIndex}/40/40`;
      if (type === 'comment') {
         notification.snippet = `commented: "This looks great! ${i}"`;
      } else if (type === 'mention') {
          notification.snippet = `mentioned you in a comment: "Hey @current_user check this out! ${i}"`;
      }
    }

    mockNotifications.set(notificationId, notification);
  }
};

generateMockNotifications(30); // Generate 30 mock notifications


// --- End Mock Data Simulation ---


/**
 * Asynchronously retrieves notifications for the currently authenticated user.
 * Simulates fetching from a user-specific 'notifications' subcollection in Firestore.
 *
 * @param limit The maximum number of notifications to retrieve.
 * @param startAfter // TODO: Add pagination logic
 * @returns A promise that resolves to an array of Notification objects.
 */
export async function getUserNotifications(limit: number = 20 /*, startAfter?: any */): Promise<Notification[]> {
    console.log(`Simulating Firestore query for user notifications (limit: ${limit})`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // In real Firestore:
    // Assume current user is authenticated (e.g., const userId = auth.currentUser.uid;)
    // Query the 'notifications' subcollection under the user's document.
    // Order by timestamp descending. Implement pagination.
    // const notificationsRef = collection(db, 'users', userId, 'notifications');
    // const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(limit));
    // const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ ...doc.data() as Notification, id: doc.id }));

    // Mock implementation: Return all mock notifications, sorted by timestamp
    const allNotifications = Array.from(mockNotifications.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // TODO: Implement pagination
    return allNotifications.slice(0, limit);
}

/**
 * Asynchronously marks specific notifications as read.
 * Simulates updating the 'isRead' field in Firestore documents.
 *
 * @param notificationIds An array of notification IDs to mark as read.
 * @returns A promise that resolves when the update is complete.
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    console.log(`Simulating marking notifications as read:`, notificationIds);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // In real Firestore:
    // Use batched writes for efficiency.
    // const batch = writeBatch(db);
    // const userId = auth.currentUser.uid; // Get current user ID
    // notificationIds.forEach(id => {
    //     const notifRef = doc(db, 'users', userId, 'notifications', id);
    //     batch.update(notifRef, { isRead: true });
    // });
    // await batch.commit();

    // Mock implementation:
    notificationIds.forEach(id => {
        const notification = mockNotifications.get(id);
        if (notification) {
            notification.isRead = true;
            mockNotifications.set(id, notification);
        }
    });
    console.log('Notifications marked as read (simulation).');
}

/**
 * Asynchronously marks ALL notifications for the user as read.
 * Simulates querying unread notifications and updating them.
 *
 * @returns A promise that resolves when the update is complete.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
     console.log(`Simulating marking ALL notifications as read`);
     // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

     // In real Firestore:
     // 1. Query for all unread notifications for the user.
     // 2. Use batched writes to update their 'isRead' status to true.
     // const userId = auth.currentUser.uid;
     // const notificationsRef = collection(db, 'users', userId, 'notifications');
     // const q = query(notificationsRef, where('isRead', '==', false));
     // const querySnapshot = await getDocs(q);
     // const batch = writeBatch(db);
     // querySnapshot.forEach((doc) => {
     //    batch.update(doc.ref, { isRead: true });
     // });
     // await batch.commit();

     // Mock implementation:
     mockNotifications.forEach(notification => {
         notification.isRead = true;
     });
     console.log('All notifications marked as read (simulation).');
}
