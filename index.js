const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios"); // Import axios here

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Store socket references by userId (you could also use a more persistent solution)
const userSockets = {}; // Example of in-memory storage

// Middleware to parse JSON bodies
app.use(express.json());

// ✅ POST endpoint to receive notification from Laravel
app.post("/notify", (req, res) => {
  const { userId, message, title, category } = req.body;

  console.log(`POST /notify received for user.${userId}: ${message}`);

  // Emit notification to the specific user
  if (userSockets[userId]) {
    userSockets[userId].emit("notification", {
      message,
      title: title || "Notification",
      category,
    });
  }

  // Also notify all admins
  io.to("admins").emit("notification", {
    message,
    title: title || "Notification (Admin Copy)",
    category,
  });

  // Fetch and send the unread notification count
  axios.get(`http://localhost/api/notifications/counts?userId=${userId}`)
    .then(response => {
      const notificationCounts = response.data;
      if (userSockets[userId]) {
        userSockets[userId].emit("notification-counts", notificationCounts);
      }
      console.log(notificationCounts);
    })
    .catch(error => {
      console.error("Error fetching notification counts:", error);
    });

   axios.get(`http://localhost/api/notifications/list?userId=${userId}`)
  .then(response => {
    const notificationList = response.data;
    if (userSockets[userId]) {
      userSockets[userId].emit("notification-list", notificationList);
    }

    // Send to all admins
    io.to("admins").emit("notification-list", notificationList);
  })
  .catch(error => {
    console.error("Error fetching notification list:", error);
  });

  return res.status(200).json({ success: true });
});

// ✅ WebSocket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join room and track userId + role
  socket.on("join-room", ({ userId, role }) => {
    console.log(`User ${userId} joined as ${role}`);
    socket.userId = userId;
    socket.role = role;

    socket.join(`user.${userId}`);

    if (role === "admin") {
      socket.join("admins");
    }

    // Store socket reference by userId
    userSockets[userId] = socket;

    // Fetch and send the unread notification count
    axios.get(`http://localhost/api/notifications/counts?userId=${userId}`)
      .then(response => {
        const notificationCounts = response.data;
        socket.emit("notification-counts", notificationCounts);
      })
      .catch(error => {
        console.error("Error fetching notification counts:", error);
      });


      axios.get(`http://localhost/api/notifications/list?userId=${userId}`)
  .then(response => {
    const notificationList = response.data;
    if (userSockets[userId]) {
      userSockets[userId].emit("notification-list", notificationList);
    }

    // Send to all admins
    io.to("admins").emit("notification-list", notificationList);
  })
  .catch(error => {
    console.error("Error fetching notification list:", error);
  });
  });

  socket.on("send-message", (data) => {
    console.log("Received message:", data);
    io.emit("receive-message", data);
  });

  socket.on("typing", (data) => {
    console.log(`Typing: ${data.sender_name}`);
    socket.broadcast.emit("typing", data);
  });

  socket.on("stop-typing", (data) => {
    console.log(`Stopped typing: ${data.sender_name}`);
    socket.broadcast.emit("stop-typing", data);
  });

  socket.on("send-notification", (data) => {
    console.log("Sending notification to user:", data.userId);

    // Notify targeted user
    io.to(`user.${data.userId}`).emit("notification", {
      message: data.message,
      title: data.title || "New Notification",
      category: data.category || "general",
    });

    // Notify all admins
    io.to("admins").emit("notification", {
      message: data.message,
      title: data.title || "New Notification (Admin Copy)",
      category: data.category || "general",
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Remove socket reference when disconnected
    if (socket.userId) {
      delete userSockets[socket.userId];
    }
  });
});

// Start the server
server.listen(3000, "0.0.0.0", () => {
  console.log("Socket.IO server running at port:3000");
});
