import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { IStorage } from "./storage";

let ioInstance: SocketIOServer | null = null;

interface RoomParticipant {
  socketId: string;
  userId: number;
  fullName: string;
  role: string;
  avatar?: string | null;
}

// Memory store for room participants
const roomParticipants = new Map<string, RoomParticipant[]>();

export function setupSocketServer(httpServer: HttpServer, storage: IStorage) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
    },
  });
  
  ioInstance = io;

  io.on("connection", (socket) => {
    // Basic User identification for dashboard notifications
    socket.on("identify", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} securely identified as user-${userId}`);
    });

    // Subscribing to live sessions
    socket.on("join-room", async (data) => {
      // Support legacy string or new object format
      const roomId = typeof data === "string" ? data : data.roomId;
      const user = typeof data === "string" ? null : data.user;

      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      
      // Track participant
      if (user) {
        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, []);
        }
        const participants = roomParticipants.get(roomId)!;
        const newParticipant: RoomParticipant = {
          socketId: socket.id,
          userId: user.id,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        };
        
        const existingIdx = participants.findIndex(p => p.socketId === socket.id);
        if (existingIdx !== -1) {
          participants[existingIdx] = newParticipant;
        } else {
          participants.push(newParticipant);
        }
        
        io.to(roomId).emit("participants-updated", participants);
      }

      socket.to(roomId).emit("user-connected", socket.id);
      
      socket.on("disconnect", () => {
        socket.to(roomId).emit("user-disconnected", socket.id);
        
        // Remove from memory store
        const participants = roomParticipants.get(roomId);
        if (participants) {
          const updated = participants.filter(p => p.socketId !== socket.id);
          if (updated.length > 0) {
            roomParticipants.set(roomId, updated);
            io.to(roomId).emit("participants-updated", updated);
          } else {
            roomParticipants.delete(roomId);
          }
        }
      });
    });

    // Signaling for WebRTC
    socket.on("signal", (data) => {
      const { to, signal } = data;
      io.to(to).emit("signal", {
        from: socket.id,
        signal,
      });
    });

    // Chat in room
    socket.on("send-message", (data) => {
      const { roomId, message, senderName, timestamp } = data;
      io.to(roomId).emit("receive-message", { message, senderName, timestamp });
    });

    // Whiteboard Sync
    socket.on("draw", (data) => {
      const { roomId, drawData } = data;
      socket.to(roomId).emit("draw", drawData);
    });

    socket.on("clear-board", (roomId) => {
      socket.to(roomId).emit("clear-board");
    });

    // Reactions
    socket.on("reaction", (data) => {
      const { roomId, reaction, senderName } = data;
      socket.to(roomId).emit("reaction", { reaction, senderName });
    });
  });

  return io;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return ioInstance;
}
