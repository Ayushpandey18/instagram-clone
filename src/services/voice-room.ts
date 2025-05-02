
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
   * Optional: Password hash or verification token (server-side concept, might not be exposed directly)
   */
   // passwordHash?: string;
}

// --- Mock Data Store (Replace with actual database/API calls) ---
const mockVoiceRooms: Map<string, VoiceRoom> = new Map([

]);
// --- End Mock Data Store ---


/**
 * Asynchronously creates a voice room.
 * In a real app, this would interact with a backend API or database.
 *
 * @param name The name of the voice room.
 * @param password The password for the voice room (optional). If provided, sets passwordProtected to true.
 * @returns A promise that resolves to the created VoiceRoom object.
 * @throws Error if room creation fails (e.g., duplicate name, server error).
 */
export async function createVoiceRoom(name: string, password?: string): Promise<VoiceRoom> {
  console.log(`Attempting to create room: ${name}, Password protected: ${!!password}`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Basic validation (more robust validation should be on the server)
  if (!name || name.length > 50) {
     throw new Error("Invalid room name.");
  }
   // Example: Check for duplicate names (simple mock implementation)
  // for (const room of mockVoiceRooms.values()) {
  //   if (room.name.toLowerCase() === name.toLowerCase()) {
  //     throw new Error(`Room name "${name}" is already taken.`);
  //   }
  // }

  const newRoom: VoiceRoom = {
    id: `room-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`, // Generate a somewhat unique ID
    name: name,
    passwordProtected: !!password,
    // In a real backend, you'd store a hash of the password, not the password itself.
    // passwordHash: password ? await hashPassword(password) : undefined,
  };

  // Add to our mock store
  mockVoiceRooms.set(newRoom.id, newRoom);
  console.log('Room created:', newRoom);

  // Return only the client-safe data
  return {
     id: newRoom.id,
     name: newRoom.name,
     passwordProtected: newRoom.passwordProtected,
  };
}

/**
 * Asynchronously retrieves a voice room by its ID.
 *
 * @param id The ID of the voice room to retrieve.
 * @returns A promise that resolves to the VoiceRoom object or null if not found.
 */
export async function getVoiceRoom(id: string): Promise<VoiceRoom | null> {
   console.log(`Fetching room details for ID: ${id}`);
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 200));

   const room = mockVoiceRooms.get(id);

   if (room) {
     // Return client-safe data (omit sensitive fields like password hashes)
     return {
       id: room.id,
       name: room.name,
       passwordProtected: room.passwordProtected,
     };
   } else {
     console.log(`Room with ID ${id} not found.`);
     return null;
   }
}

/**
 * Asynchronously retrieves all available voice rooms.
 * In a real app, this might include pagination or filtering.
 *
 * @returns A promise that resolves to an array of VoiceRoom objects.
 */
export async function getAllVoiceRooms(): Promise<VoiceRoom[]> {
   console.log('Fetching all voice rooms...');
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 400));

   // Convert map values to array and return client-safe data
   const rooms = Array.from(mockVoiceRooms.values()).map(room => ({
     id: room.id,
     name: room.name,
     passwordProtected: room.passwordProtected,
   }));

   console.log(`Found ${rooms.length} rooms.`);
   // Sort rooms, e.g., by name or creation date (using name for simplicity)
   return rooms.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Placeholder for password verification logic.
 * In a real app, this should happen on the server.
 *
 * @param roomId The ID of the room.
 * @param password The password attempt.
 * @returns A promise resolving to true if the password is correct, false otherwise.
 */
export async function verifyRoomPassword(roomId: string, passwordAttempt: string): Promise<boolean> {
     console.log(`Verifying password for room ${roomId}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const room = mockVoiceRooms.get(roomId);

    // Basic mock verification (DO NOT USE IN PRODUCTION)
    // In a real app, compare the hash of passwordAttempt with the stored passwordHash.
    if (room && room.passwordProtected) {
        // This is highly insecure, just for mocking!
        return passwordAttempt === "password";
    }

    // If room doesn't exist or isn't password protected, verification fails or is irrelevant.
    return false;
}


// Note: Deleting rooms, updating room settings, etc., would require additional functions.
