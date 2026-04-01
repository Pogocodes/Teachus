import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";

// Create a singleton instance so we don't open multiple connections
// across different components re-rendering.
let socketInstance: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const [isConnected, setIsConnected] = useState(
    socketInstance ? socketInstance.connected : false
  );
  const { user } = useAuth();

  useEffect(() => {
    if (!socketInstance) {
      // Connect to the Socket.io server (with Vite it proxies /api/socket properly)
      // Since it's on the same domain in production and proxied in dev:
      socketInstance = io("/", {
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });
      
      setSocket(socketInstance);
    }

    const onConnect = () => {
      setIsConnected(true);
      if (user?.id) {
        socketInstance?.emit("identify", user.id);
      }
    };

    const onDisconnect = () => setIsConnected(false);

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    // Initial check
    if (socketInstance.connected) {
      onConnect();
    }

    return () => {
      if (socketInstance) {
        socketInstance.off("connect", onConnect);
        socketInstance.off("disconnect", onDisconnect);
      }
    };
  }, [user]);

  return { socket, isConnected };
}
