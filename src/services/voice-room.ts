

/**
 * Represents a voice room.
 */
export interface VoiceRoom {
  /**
   * The ID of the voice room. Should be unique.
   */
  id: string;
  /**
   * The name of the voice room.
   */
  name: string;
  /**
   * Whether the voice room is password protected.
   */
  passwordProtected: boolean;
   /**
    * Optional: Number of participants (added for listing)
    */
   participantCount?: number;
}

// Get the backend API base URL from environment variable
// IMPORTANT: Ensure NEXT_PUBLIC_SOCKET_URL points to the BASE URL of your backend server (e.g., https://your-railway-app.up.railway.app)
// It should NOT include /socket.io
const API_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

if (!API_BASE_URL) {
  console.error("FATAL ERROR: NEXT_PUBLIC_SOCKET_URL environment variable is not set!");
  // You might want to throw an error here or handle it appropriately
  // depending on whether this code runs server-side or client-side during build.
}


/**
 * Asynchronously creates a voice room by calling the backend API.
 *
 * @param name The name of the voice room.
 * @param password The password for the voice room (optional). If provided, sets passwordProtected to true.
 * @returns A promise that resolves to the created VoiceRoom object.
 * @throws Error if room creation fails (e.g., duplicate name, server error, network error).
 */
export async function createVoiceRoom(name: string, password?: string): Promise<VoiceRoom> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured.");
    }
    console.log(`[Service] Creating room via API: ${name}, Password protected: ${!!password}`);

    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }), // Send password only if provided
    });

    if (!response.ok) {
        let errorMessage = `Failed to create room: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorMessage; // Use server message if available
        } catch (e) {
            // Ignore if response body is not JSON
        }
        console.error('[Service] Room creation failed:', errorMessage);
        throw new Error(errorMessage);
    }

    const newRoom: VoiceRoom = await response.json();
    console.log('[Service] Room created successfully via API:', newRoom);
    return newRoom;
}

/**
 * Asynchronously retrieves a voice room by its ID from the backend API.
 * NOTE: This function is less common now that listing provides basic info.
 * Keep it if you need detailed info for a specific room not available in the list.
 *
 * @param id The ID of the voice room to retrieve.
 * @returns A promise that resolves to the VoiceRoom object or null if not found.
 */
export async function getVoiceRoom(id: string): Promise<VoiceRoom | null> {
     if (!API_BASE_URL) {
        console.error("[Service] Backend API URL is not configured for getVoiceRoom.");
        return null; // Or throw error
    }
   console.log(`[Service] Fetching room details via API for ID: ${id}`);
   // Simulate API call delay - REMOVE IN PRODUCTION
   // await new Promise(resolve => setTimeout(resolve, 200));

   // NOTE: The backend currently doesn't have a specific endpoint for GET /api/rooms/:id
   // Usually, you'd fetch the list and find the room, or the backend would provide this endpoint.
   // For now, we'll simulate by fetching all and filtering, which is inefficient.
   try {
        const allRooms = await getAllVoiceRooms();
        const room = allRooms.find(r => r.id === id);
        return room || null;
   } catch (error) {
        console.error(`[Service] Error fetching room ${id}:`, error);
        return null;
   }
}

/**
 * Asynchronously retrieves all available voice rooms from the backend API.
 *
 * @returns A promise that resolves to an array of VoiceRoom objects.
 */
export async function getAllVoiceRooms(): Promise<VoiceRoom[]> {
   if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured.");
    }
   console.log(`[Service] Fetching all voice rooms from API: ${API_BASE_URL}/api/rooms`);
   try {
        const response = await fetch(`${API_BASE_URL}/api/rooms`);
        if (!response.ok) {
            throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
        }
        const rooms: VoiceRoom[] = await response.json();
        console.log(`[Service] Found ${rooms.length} rooms via API.`);
        // Sort rooms locally if needed (backend might also sort)
        return rooms.sort((a, b) => a.name.localeCompare(b.name));
   } catch (error) {
        console.error("[Service] Error fetching all rooms:", error);
        // Depending on the context, you might return [] or re-throw
        throw error; // Re-throw to let the calling component handle the error state
        // return [];
   }
}

/**
 * Verifies the password for a room by calling the backend API.
 *
 * @param roomId The ID of the room.
 * @param passwordAttempt The password attempt.
 * @returns A promise resolving to true if the password is correct, false otherwise.
 */
export async function verifyRoomPassword(roomId: string, passwordAttempt: string): Promise<boolean> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured.");
    }
     console.log(`[Service] Verifying password via API for room ${roomId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: passwordAttempt }),
        });

        if (response.ok) {
            const result = await response.json();
            return result.success === true;
        } else if (response.status === 401) { // Unauthorized (incorrect password)
            return false;
        } else {
            // Handle other errors (404 Not Found, 400 Bad Request, 500 Server Error)
            console.error(`[Service] Password verification failed with status ${response.status}`);
            return false; // Or throw an error to indicate a problem beyond just wrong password
        }
    } catch (error) {
        console.error("[Service] Error verifying password:", error);
        // Depending on how you want to handle network errors vs incorrect passwords
        // throw error; // Could re-throw to indicate a network/server issue
        return false; // Treat network/server errors as verification failure for simplicity here
    }
}
