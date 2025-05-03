
// socket-backend/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Get allowed origins from environment variable, split by comma, or default
// Ensure the Vercel URL and localhost are included.
const defaultOrigins = "http://localhost:9005,https://instagram-clone-ug7f.vercel.app"; // Add your Vercel URL here and localhost
const allowedOrigins = (defaultOrigins).split(',');
console.log("Allowed CORS Origins:", allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the array of allowed origins
    methods: ["GET", "POST"],
  },
  transports: ['websocket'] // Allow ONLY WebSocket transport
});

// In-memory store for room data (replace with Redis/DB in production)
const rooms = {}; // { roomId: { participants: { socketId: { username: '...', ... } }, messages: [] } }

io.on("connection", (socket) => {
  console.log(`User connected via WebSocket: ${socket.id}`);

  // **Live Streaming Events (from /live page) - Basic handling**
   socket.on('start_live', (data) => {
      console.log(`User ${socket.id} started live stream:`, data);
      // TODO: Handle live stream setup (WebRTC signaling etc.)
      // For now, just log
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
    if (!roomId || !user || !user.username) {
       console.warn("Invalid join_voice_room request:", { roomId, user });
       return;
    }
    socket.join(roomId);
    console.log(`User ${socket.id} (${user.username}) joined room ${roomId}`);

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: {}, messages: [] };
    }
    // Add participant
    rooms[roomId].participants[socket.id] = {
       username: user.username,
       avatarUrl: user.avatarUrl || `https://picsum.photos/seed/${socket.id}/40/40`,
       isMuted: false,
       isSpeaking: false,
    };

    // Send current room state to the joining user
    socket.emit('room_state', {
      participants: Object.entries(rooms[roomId].participants).map(([id, data]) => ({ id, ...data })),
      messages: rooms[roomId].messages // Send existing messages
    });

    // Notify others in the room
    socket.to(roomId).emit('participant_joined', {
       id: socket.id,
       ...rooms[roomId].participants[socket.id]
    });
  });

  socket.on("send_message", ({ roomId, message }) => {
    if (!roomId || !message || !rooms[roomId]?.participants[socket.id]) {
        console.warn("Invalid send_message request:", {roomId, message, participantExists: !!rooms[roomId]?.participants[socket.id]});
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

    // Store message history (simple in-memory, limited)
    rooms[roomId].messages.push(newMessage);
    if (rooms[roomId].messages.length > 50) rooms[roomId].messages.shift();

    // Broadcast message to everyone in the room
    io.to(roomId).emit("new_message", newMessage);
    console.log(`Message in room ${roomId} from ${sender.username}: ${message}`);
  });

  socket.on("update_participant", ({ roomId, updates }) => {
      if (!roomId || !updates || !rooms[roomId]?.participants[socket.id]) {
           console.warn("Invalid update_participant request:", {roomId, updates, participantExists: !!rooms[roomId]?.participants[socket.id]});
           return;
      }
      // Update participant data in memory
      Object.assign(rooms[roomId].participants[socket.id], updates);

      // Broadcast the update to others in the room
      socket.to(roomId).emit('participant_update', { id: socket.id, ...updates });
       console.log(`Participant update in room ${roomId} for ${socket.id}:`, updates);
  });

  socket.on("leave_voice_room", ({ roomId }) => {
        handleLeave(roomId, socket);
  });

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
    // Find which room the user was in and notify others
    for (const roomId in rooms) {
        if (rooms[roomId].participants[socket.id]) {
             handleLeave(roomId, socket, true); // Pass true to indicate disconnect cleanup
             break; // Assuming user can only be in one room
        }
    }
  });

  socket.on('error', (error) => {
    console.error(`Socket Error (${socket.id}):`, error);
  });

});

function handleLeave(roomId, socket, isDisconnect = false) {
    if (!roomId || !rooms[roomId]?.participants[socket.id]) {
        if (!isDisconnect) { // Don't warn on disconnect if participant already removed
            console.warn(`Invalid leave_voice_room / disconnect handling:`, {roomId, participantExists: !!rooms[roomId]?.participants[socket.id]});
        }
        return;
    }
    console.log(`User ${socket.id} (${rooms[roomId].participants[socket.id].username}) left room ${roomId}`);
    socket.leave(roomId); // Socket leaves the room channel
    const leftUser = rooms[roomId].participants[socket.id];
    delete rooms[roomId].participants[socket.id];

    // Notify others in the room
    socket.to(roomId).emit('participant_left', socket.id);

   // Clean up room if empty
   if (Object.keys(rooms[roomId].participants).length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} is now empty and removed.`);
   }
}


// Basic HTTP route for health checks or info
app.get('/', (req, res) => {
  res.send('Socket.IO Server is running');
});

// Railway provides the PORT environment variable
const port = process.env.PORT || 3001; // Fallback for local dev

server.listen(port, () => {
  console.log(`Socket.IO server listening on *:${port} (WebSockets only)`);
});
