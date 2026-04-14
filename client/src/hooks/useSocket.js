import { useEffect } from "react";
import { getSocketClient } from "../services/socketClient";

function useSocket(isEnabled = true) {
  useEffect(() => {
    const socket = getSocketClient();

    if (isEnabled && !socket.connected) {
      socket.connect();
    }

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [isEnabled]);
}

export default useSocket;
