
// socket-backend/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors'); // Import the cors middleware

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const server = http.createServer(app);

// Get allowed origins from environment variable, split by comma, or default
// Use NEXT_PUBLIC_APP_URL for the frontend URL and ensure localhost is included
const defaultOrigins = "http://localhost:9005,https://instagram-clone-ug7f.vercel.app"; // Add your Vercel URL here and localhost
const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins).split(',').map(origin => origin.trim());
console.log("Allowed CORS Origins:", allowedOrigins);

// Use the cors middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
}));


const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the array of allowed origins
    methods: ["GET", "POST"],
  },
  transports: ['websocket'] // Explicitly use ONLY WebSocket transport
});

// In-memory store for room data (replace with Redis/DB in production)
const rooms = {}; // { roomId: { id: 'roomId', name: 'Room Name', passwordProtected: false, participants: { socketId: { username: '...', ... } }, messages: [] } }

// --- REST API Endpoints ---

// GET /api/rooms - List active rooms (basic info)
app.get('/api/rooms', (req, res) => {
  console.log('GET /api/rooms requested');
  const roomList = Object.values(rooms).map(room => ({
    id: room.id,
    name: room.name,
    passwordProtected: room.passwordProtected,
    participantCount: Object.keys(room.participants || {}).length, // Add participant count
  }));
  console.log('Returning room list:', roomList);
  res.json(roomList);
});

// POST /api/rooms - Create a new room
app.post('/api/rooms', (req, res) => {
  const { name, password } = req.body;
  console.log(`POST /api/rooms request received: name=${name}, passwordProtected=${!!password}`);

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    console.log('Room creation failed: Invalid name');
    return res.status(400).json({ message: 'Room name is required.' });
  }
  if (name.length > 50) {
     console.log('Room creation failed: Name too long');
     return res.status(400).json({ message: 'Room name cannot exceed 50 characters.' });
  }
   // Basic duplicate name check (case-insensitive) - consider more robust checks
  const existingRoom = Object.values(rooms).find(r => r.name.toLowerCase() === name.toLowerCase());
  if (existingRoom) {
      console.log(`Room creation failed: Name "${name}" already exists`);
      return res.status(409).json({ message: `Room name "${name}" is already taken.` });
  }


  const newRoomId = `room-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
  const newRoom = {
    id: newRoomId,
    name: name.trim(),
    passwordProtected: !!password,
    participants: {}, // Initialize participants
    messages: [], // Initialize messages
    // NOTE: Do NOT store the actual password here in a real app.
    // Store a hash or implement proper auth. This is just for the mock.
    _password: password || null, // Store password for simple mock verification
  };

  rooms[newRoomId] = newRoom;
  console.log('Room created successfully:', { id: newRoom.id, name: newRoom.name, passwordProtected: newRoom.passwordProtected });

  // Return only client-safe data
  res.status(201).json({
    id: newRoom.id,
    name: newRoom.name,
    passwordProtected: newRoom.passwordProtected,
    participantCount: 0, // Initial participant count is 0
  });
});

// POST /api/rooms/:roomId/verify - Verify password (simple mock)
app.post('/api/rooms/:roomId/verify', (req, res) => {
   const { roomId } = req.params;
   const { password } = req.body;
   const room = rooms[roomId];

   console.log(`POST /api/rooms/${roomId}/verify attempt`);

   if (!room) {
       console.log(`Verification failed: Room ${roomId} not found`);
       return res.status(404).json({ message: 'Room not found' });
   }
   if (!room.passwordProtected) {
       console.log(`Verification not needed: Room ${roomId} is not password protected`);
       return res.status(400).json({ message: 'Room is not password protected' });
   }
   if (room._password === password) { // **INSECURE MOCK COMPARISON**
       console.log(`Verification successful for room ${roomId}`);
       return res.json({ success: true });
   } else {
        console.log(`Verification failed for room ${roomId}: Incorrect password`);
       return res.status(401).json({ success: false, message: 'Incorrect password' });
   }
});


// --- Socket.IO Logic ---
io.on("connection", (socket) => {
  console.log(`User connected via WebSocket: ${socket.id}`);
  let currentRoomId = null; // Keep track of the room the socket is in

  // **Live Streaming Events (from /live page) - Basic handling**
   socket.on('start_live', (data) => {
      console.log(`User ${socket.id} started live stream:`, data);
      // TODO: Handle live stream setup (WebRTC signaling etc.)
  });

  socket.on('stop_live', (data) => {
      console.log(`User ${socket.id} stopped live stream`);
      // TODO: Handle live stream teardown
  });

   socket.on('mute_status', (data) => {
        console.log(`User ${socket.id} mute status changed:`, data);
        // TODO: Broadcast mute status to viewers of this stream if needed
   });

   socket.on('video_status', (data) => {
       console.log(`User ${socket.id} video status changed:`, data);
       // TODO: Broadcast video status to viewers if needed
   });


  // **Voice Room Events (from /voice-rooms/[roomId] page)**
  socket.on("join_voice_room", ({ roomId, user }) => {
    if (!roomId || !rooms[roomId] || !user || !user.username) {
       console.warn("Invalid join_voice_room request:", { roomId, roomExists: !!rooms[roomId], user });
       socket.emit('join_error', { message: 'Invalid room or user details provided.' });
       return;
    }
    // Leave previous room if any
    if (currentRoomId) {
       handleLeave(currentRoomId, socket);
    }

    currentRoomId = roomId; // Set current room ID
    socket.join(roomId);
    console.log(`User ${socket.id} (${user.username}) joined room ${roomId}`);

    // Add participant (ensure participants object exists)
    rooms[roomId].participants = rooms[roomId].participants || {};
    rooms[roomId].participants[socket.id] = {
       username: user.username,
       avatarUrl: user.avatarUrl || `https://picsum.photos/seed/${socket.id}/40/40`,
       isMuted: false,
       isSpeaking: false,
    };

     // Send current room state (participants and messages) to the joining user
     // Also send IDs of existing users for WebRTC initiation
     const existingParticipants = Object.entries(rooms[roomId].participants)
        .map(([id, data]) => ({ id, ...data }));
    const existingParticipantIds = existingParticipants
        .filter(p => p.id !== socket.id) // Exclude self
        .map(p => p.id);

    socket.emit('room_state', {
      participants: existingParticipants,
      messages: rooms[roomId].messages || [], // Send existing messages or empty array
      existingParticipantIds: existingParticipantIds, // Send IDs for WebRTC
    });


    // Notify others in the room about the new participant
    socket.to(roomId).emit('participant_joined', {
       id: socket.id,
       ...rooms[roomId].participants[socket.id]
    });

     // Broadcast updated participant count *after* adding the participant
    broadcastParticipantCount(roomId);

  });

  socket.on("send_message", ({ roomId, message }) => {
    if (!roomId || !message || !rooms[roomId]?.participants?.[socket.id]) {
        console.warn("Invalid send_message request:", {roomId, message, roomExists: !!rooms[roomId], participantExists: !!rooms[roomId]?.participants?.[socket.id]});
        return;
    };

    const sender = rooms[roomId].participants[socket.id];
    const newMessage = {
      id: `msg-${Date.now()}-${socket.id.substring(0, 4)}`,
      username: sender.username,
      userAvatar: sender.avatarUrl,
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Ensure messages array exists
    rooms[roomId].messages = rooms[roomId].messages || [];

    // Store message history (simple in-memory, limited)
    rooms[roomId].messages.push(newMessage);
    // Limit message history size
    if (rooms[roomId].messages.length > 50) rooms[roomId].messages.shift();

    // Broadcast message to everyone in the room
    io.to(roomId).emit("new_message", newMessage);
    console.log(`Message in room ${roomId} from ${sender.username}: ${message}`);
  });

  socket.on("update_participant", ({ roomId, updates }) => {
      if (!roomId || !updates || !rooms[roomId]?.participants?.[socket.id]) {
           console.warn("Invalid update_participant request:", {roomId, updates, roomExists: !!rooms[roomId], participantExists: !!rooms[roomId]?.participants?.[socket.id]});
           return;
      }
      // Update participant data in memory
      Object.assign(rooms[roomId].participants[socket.id], updates);

      // Broadcast the update to others in the room
      socket.to(roomId).emit('participant_update', { id: socket.id, ...updates });
       console.log(`Participant update in room ${roomId} for ${socket.id}:`, updates);
  });

  // --- WebRTC Signaling ---
  socket.on('webrtc_offer', ({ targetSocketId, offer }) => {
    console.log(`Relaying WebRTC offer from ${socket.id} to ${targetSocketId}`);
    // Only relay if sender is in a room
    if (currentRoomId && rooms[currentRoomId]?.participants?.[socket.id]) {
      socket.to(targetSocketId).emit('webrtc_offer', {
        senderSocketId: socket.id,
        offer: offer
      });
    } else {
      console.warn(`Offer relay rejected: Sender ${socket.id} not in a valid room.`);
    }
  });

  socket.on('webrtc_answer', ({ targetSocketId, answer }) => {
    console.log(`Relaying WebRTC answer from ${socket.id} to ${targetSocketId}`);
    // Only relay if sender is in a room
    if (currentRoomId && rooms[currentRoomId]?.participants?.[socket.id]) {
        socket.to(targetSocketId).emit('webrtc_answer', {
            senderSocketId: socket.id,
            answer: answer
        });
    } else {
        console.warn(`Answer relay rejected: Sender ${socket.id} not in a valid room.`);
    }
  });

  socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
    // console.log(`Relaying ICE candidate from ${socket.id} to ${targetSocketId}`); // Can be very noisy
    // Only relay if sender is in a room
     if (currentRoomId && rooms[currentRoomId]?.participants?.[socket.id]) {
        socket.to(targetSocketId).emit('webrtc_ice_candidate', {
            senderSocketId: socket.id,
            candidate: candidate
        });
     } else {
        // console.warn(`ICE candidate relay rejected: Sender ${socket.id} not in a valid room.`);
     }
  });


  socket.on("leave_voice_room", () => { // No need for roomId here, use currentRoomId
        if (currentRoomId) {
             handleLeave(currentRoomId, socket);
             currentRoomId = null; // Reset current room
        }
  });

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
    // Find which room the user was in (using stored currentRoomId is simpler)
    if (currentRoomId) {
         handleLeave(currentRoomId, socket, true); // Pass true for disconnect cleanup
         currentRoomId = null; // Reset current room
    } else {
        // If currentRoomId is null, check all rooms (fallback, less efficient)
        for (const roomId in rooms) {
            if (rooms[roomId]?.participants?.[socket.id]) {
                handleLeave(roomId, socket, true);
                break; // Assuming user can only be in one room
            }
        }
    }
  });

  // General error handler for the socket
  socket.on('error', (error) => {
    console.error(`Socket Error (${socket.id}):`, error);
    // Maybe notify the client?
    socket.emit('socket_error', { message: 'An internal socket error occurred.' });
  });

});

function handleLeave(roomId, socket, isDisconnect = false) {
    // Check if room and participant exist before proceeding
    if (!roomId || !rooms[roomId]?.participants?.[socket.id]) {
        if (!isDisconnect || (rooms[roomId] && rooms[roomId].participants && rooms[roomId].participants[socket.id])) { // Don't warn on disconnect if participant already gone
            console.warn(`Invalid leave/disconnect handling: Room or participant not found.`, { roomId, socketId: socket.id, roomExists: !!rooms[roomId], participantExists: !!rooms[roomId]?.participants?.[socket.id] });
        }
        return;
    }
    const username = rooms[roomId].participants[socket.id].username; // Get username before deleting
    console.log(`User ${socket.id} (${username}) left room ${roomId}`);
    socket.leave(roomId); // Socket leaves the room channel

    // Notify others in the room that the participant left
    socket.to(roomId).emit('participant_left', socket.id);

    // Remove participant from room data *after* notifying others
    delete rooms[roomId].participants[socket.id];

    // Broadcast updated participant count *after* removing the participant
    broadcastParticipantCount(roomId);


   // Clean up room if empty and no persistent storage is used
   if (Object.keys(rooms[roomId].participants).length === 0) {
        // **Important:** If using a persistent DB, you might not delete the room here.
        // For in-memory, we delete it.
        console.log(`Room ${roomId} is now empty but keeping it available.`);
        // delete rooms[roomId]; // Keep the room available even if empty
        // console.log(`Room ${roomId} is now empty and removed.`);
        // TODO: Potentially notify listing clients that room was removed
        // io.emit('room_removed', roomId); // Example
   }
}

// Helper function to broadcast participant count changes
function broadcastParticipantCount(roomId) {
    if (rooms[roomId]) {
        const count = Object.keys(rooms[roomId].participants).length;
        // Emit a specific event for count updates *to the room*
        io.to(roomId).emit('participant_count_update', { roomId, count });
        console.log(`Broadcasted participant count for room ${roomId}: ${count}`);
        // TODO: Update the general room listing API data if needed (more complex, involves updating API state)
    }
}


// Basic HTTP route for health checks or info
app.get('/', (req, res) => {
  res.send('Socket.IO Server with API is running');
});

// Railway provides the PORT environment variable
const port = process.env.PORT || 3001; // Fallback for local dev

server.listen(port, () => {
  console.log(`Server listening on *:${port} (HTTP API & WebSockets)`);
});

