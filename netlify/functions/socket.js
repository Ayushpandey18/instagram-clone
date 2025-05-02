// netlify/functions/socket.js

// IMPORTANT: This code is designed to run as a *Netlify Function*.
// It will NOT run correctly if you try to execute it directly with `node socket.js`.
// You need to use `netlify dev` to run it locally or deploy it to Netlify.

const { Server } = require("socket.io");

// Store connected users and room details in memory (will reset on function cold start)
// In a real application, use a persistent store like Redis or a database
const rooms = {}; // { roomId: { participants: { socketId: { username: '...', ... }, ... } } }

// Note: This is a simplified HTTP server setup suitable for Netlify Functions.
// It doesn't involve creating an explicit HTTP server instance like in a standalone Node app.
// Netlify handles the HTTP request triggering this function. We attach Socket.IO later.

let io; // Keep io instance accessible

// Main handler for Netlify Function requests
exports.handler = async (event, context) => {
  // --- Initialize Socket.IO Server (if not already initialized) ---
  // Netlify functions can be stateful within a single execution context (warm instance).
  // We only want ONE Socket.IO server instance per warm function instance.
  // A common way is to attach it to a global or context object, but for simplicity,
  // we'll use a module-level variable `io`.

  if (!io) {
    console.log("Initializing Socket.IO Server for Netlify Function...");

    // **Crucially, Socket.IO v3+ needs an ACTIVE HTTP server to attach to.**
    // Netlify Functions don't expose the raw Node HTTP server directly in the handler.
    // A workaround is needed. One common pattern is to temporarily start a minimal
    // HTTP server *just* to initialize Socket.IO, then potentially close it.
    // However, a more robust Netlify pattern involves specific adapters or configurations
    // if you need long-running WebSocket connections (which are limited on free tiers).

    // **FOR POLLING (Recommended for Vercel/Netlify free tiers):**
    // We don't need a persistent server instance if we ONLY use polling.
    // However, the `Server` constructor *still* needs an argument.
    // We can pass a dummy port or a configuration object.

    io = new Server({
      // No http server needed explicitly when only polling is expected/forced client-side
      cors: {
        origin: "*", // IMPORTANT: Restrict this to your Vercel frontend URL in production!
        methods: ["GET", "POST"],
      },
      transports: ['polling'], // Primarily use polling
      // Optional: Allow upgrade to websockets if the environment supports it (might not work reliably on free serverless)
      // allowEIO3: true, // For compatibility if needed
    });

    // --- Socket Event Listeners ---
    io.on("connection", (socket) => {
      console.log(`User connected via ${socket.conn.transport.name}: ${socket.id}`);

      // **Live Streaming Events (from /live page)**
       socket.on('start_live', (data) => {
          console.log(`User ${socket.id} started live stream:`, data);
          // TODO: Handle live stream setup (WebRTC signaling etc.)
          // For now, just broadcast that someone is live in their 'room' (e.g., username)
          // socket.join(data.userId); // User joins their own 'live' room
          // io.to(data.userId).emit('live_started', { userId: data.userId });
      });

      socket.on('stop_live', (data) => {
          console.log(`User ${socket.id} stopped live stream`);
          // TODO: Handle live stream teardown
          // io.to(data.userId).emit('live_stopped', { userId: data.userId });
      });

       socket.on('mute_status', (data) => {
            console.log(`User ${socket.id} mute status changed:`, data);
            // TODO: Broadcast mute status to viewers of this stream
            // io.to(data.userId).emit('viewer_mute_status', { userId: socket.id, muted: data.muted });
       });

       socket.on('video_status', (data) => {
           console.log(`User ${socket.id} video status changed:`, data);
           // TODO: Broadcast video status to viewers
           // io.to(data.userId).emit('viewer_video_status', { userId: socket.id, videoOff: data.videoOff });
       });


      // **Voice Room Events (from /voice-rooms/[roomId] page)**
      socket.on("join_voice_room", ({ roomId, user }) => { // Assuming user details are sent
        if (!roomId) return;
        socket.join(roomId);
        console.log(`User ${socket.id} (${user?.username || 'unknown'}) joined room ${roomId}`);

        // Initialize room if it doesn't exist
        if (!rooms[roomId]) {
          rooms[roomId] = { participants: {} };
        }
        // Add participant
        rooms[roomId].participants[socket.id] = {
           username: user?.username || `guest_${socket.id.substring(0, 4)}`,
           avatarUrl: user?.avatarUrl || `https://picsum.photos/seed/${socket.id}/40/40`,
           isMuted: false,
           isSpeaking: false,
        };

        // Send current room state to the joining user
        socket.emit('room_state', {
          participants: Object.entries(rooms[roomId].participants).map(([id, data]) => ({ id, ...data })),
          messages: rooms[roomId].messages || [] // Send existing messages if stored
        });

        // Notify others in the room
        socket.to(roomId).emit('participant_joined', {
           id: socket.id,
           ...rooms[roomId].participants[socket.id]
        });
      });

      socket.on("send_message", ({ roomId, message }) => {
        if (!roomId || !message || !rooms[roomId]?.participants[socket.id]) return;

        const sender = rooms[roomId].participants[socket.id];
        const newMessage = {
          id: `msg-${Date.now()}-${socket.id.substring(0, 4)}`,
          username: sender.username,
          userAvatar: sender.avatarUrl, // Add avatar to message data
          message: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        // Store message history (optional, in-memory only for this example)
        if (!rooms[roomId].messages) rooms[roomId].messages = [];
        rooms[roomId].messages.push(newMessage);
        if (rooms[roomId].messages.length > 50) rooms[roomId].messages.shift(); // Limit history

        // Broadcast message to everyone in the room (including sender)
        io.to(roomId).emit("new_message", newMessage);
        console.log(`Message in room ${roomId} from ${sender.username}: ${message}`);
      });

      socket.on("update_participant", ({ roomId, updates }) => {
          if (!roomId || !updates || !rooms[roomId]?.participants[socket.id]) return;

          // Update participant data
          Object.assign(rooms[roomId].participants[socket.id], updates);

          // Broadcast the update to others in the room
          socket.to(roomId).emit('participant_update', { id: socket.id, ...updates });
           console.log(`Participant update in room ${roomId} for ${socket.id}:`, updates);
      });

      socket.on("leave_voice_room", ({ roomId }) => {
           if (!roomId || !rooms[roomId]?.participants[socket.id]) return;
           console.log(`User ${socket.id} left room ${roomId}`);
            socket.leave(roomId);
            const leftUser = rooms[roomId].participants[socket.id];
            delete rooms[roomId].participants[socket.id];
             // Notify others in the room
            socket.to(roomId).emit('participant_left', socket.id);

           // Clean up room if empty (optional)
           if (Object.keys(rooms[roomId].participants).length === 0) {
                delete rooms[roomId];
                console.log(`Room ${roomId} is now empty and removed.`);
           }
      });

      socket.on("disconnect", (reason) => {
        console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
        // Find which rooms the user was in and notify others
        for (const roomId in rooms) {
            if (rooms[roomId].participants[socket.id]) {
                 console.log(`Removing ${socket.id} from room ${roomId} due to disconnect`);
                 const leftUser = rooms[roomId].participants[socket.id];
                 delete rooms[roomId].participants[socket.id];
                 socket.to(roomId).emit('participant_left', socket.id);

                 // Clean up room if empty
                 if (Object.keys(rooms[roomId].participants).length === 0) {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} is now empty and removed.`);
                 }
                 break; // Assuming user can only be in one room in this simple model
            }
        }
      });

      socket.on('error', (error) => {
        console.error(`Socket Error (${socket.id}):`, error);
      });

    });

    console.log("Socket.IO Server Initialized for Netlify Function.");
  } else {
    // console.log("Using existing Socket.IO Server instance.");
  }

  // --- Netlify Function Response ---
  // We MUST return a response for the HTTP request that triggered the function.
  // For Socket.IO, the main communication happens over the established socket,
  // not through this HTTP response. Returning a simple 200 OK is standard.
  // Crucially, DO NOT try to use `io` directly within this return block for emitting.
  // Emitting should happen within the event listeners attached above (`io.on('connection', ...)`).

  // If you need to handle specific HTTP routes (like GET /status), you can check event.path
  // if (event.path === '/.netlify/functions/socket/status') {
  //    return { statusCode: 200, body: JSON.stringify({ status: 'running', connections: io?.engine.clientsCount || 0 }) };
  // }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Netlify function invoked. Socket.IO server should be running if initialized." }),
  };
};
