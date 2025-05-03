

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

// Log if the variable is missing during build or server-side, but don't throw error immediately.
// The error will be thrown by functions that need it if it's still missing at runtime.
if (typeof window === 'undefined' && !API_BASE_URL) {
  console.warn("Warning: NEXT_PUBLIC_SOCKET_URL environment variable is not set. API calls will fail.");
}


/**
 * Asynchronously creates a voice room by calling the backend API.
 *
 * @param name The name of the voice room.
 * @param password The password for the voice room (optional). If provided, sets passwordProtected to true.
 * @returns A promise that resolves to the created VoiceRoom object.
 * @throws Error if the API URL is not configured or if room creation fails (e.g., duplicate name, server error, network error).
 */
export async function createVoiceRoom(name: string, password?: string): Promise<VoiceRoom> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured. Please set the NEXT_PUBLIC_SOCKET_URL environment variable.");
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
 * @throws Error if the API URL is not configured.
 */
export async function getVoiceRoom(id: string): Promise<VoiceRoom | null> {
     if (!API_BASE_URL) {
        // Changed from console.error to throw an error
        throw new Error("Backend API URL is not configured. Please set the NEXT_PUBLIC_SOCKET_URL environment variable.");
    }
   console.log(`[Service] Fetching room details via API for ID: ${id}`);
   // Simulate API call delay - REMOVE IN PRODUCTION
   // await new Promise(resolve => setTimeout(resolve, 200));

   // NOTE: The backend currently doesn't have a specific endpoint for GET /api/rooms/:id
   // Usually, you'd fetch the list and find the room, or the backend would provide this endpoint.
   // For now, we'll simulate by fetching all and filtering, which is inefficient.
   try {
        const allRooms = await getAllVoiceRooms(); // This function also checks API_BASE_URL
        const room = allRooms.find(r => r.id === id);
        return room || null;
   } catch (error) {
        // Catch errors from getAllVoiceRooms (like missing URL or fetch failure)
        console.error(`[Service] Error fetching room ${id}:`, error);
        // Re-throw or return null based on desired behavior
        if (error instanceof Error && error.message.includes("Backend API URL is not configured")) {
            throw error; // Propagate the configuration error
        }
        return null; // Return null for other fetch errors specific to getting the room list
   }
}

/**
 * Asynchronously retrieves all available voice rooms from the backend API.
 *
 * @returns A promise that resolves to an array of VoiceRoom objects.
 * @throws Error if the API URL is not configured or if fetching fails.
 */
export async function getAllVoiceRooms(): Promise<VoiceRoom[]> {
   if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured. Please set the NEXT_PUBLIC_SOCKET_URL environment variable.");
    }
   console.log(`[Service] Fetching all voice rooms from API: ${API_BASE_URL}/api/rooms`);
   try {
        const response = await fetch(`${API_BASE_URL}/api/rooms`);
        if (!response.ok) {
            // Try to get a more specific error message from the response body
            let errorMessage = `Failed to fetch rooms: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
            } catch (e) { /* ignore JSON parsing error */ }
            console.error('[Service] Failed to fetch rooms:', errorMessage);
            throw new Error(errorMessage); // Throw the potentially more specific error
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
 * @throws Error if the API URL is not configured or if the verification request fails fundamentally.
 */
export async function verifyRoomPassword(roomId: string, passwordAttempt: string): Promise<boolean> {
    if (!API_BASE_URL) {
        throw new Error("Backend API URL is not configured. Please set the NEXT_PUBLIC_SOCKET_URL environment variable.");
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
            let errorMessage = `Password verification failed: ${response.status} ${response.statusText}`;
             try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
            } catch (e) { /* ignore JSON parsing error */ }
            console.error(`[Service] Password verification failed with status ${response.status}: ${errorMessage}`);
            // Throw an error for unexpected issues, return false only for wrong password
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("[Service] Error verifying password:", error);
        // Re-throw network/server errors
        throw error;
    }
}
