export const handleConnection = (ws, wss) => {
    console.log('User connected:', ws.user.username);
  
    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        routeMessage(parsedMessage, ws, wss);
      } catch (error) {
        console.error('Error parsing message:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
  
    ws.on('close', () => {
      console.log('User disconnected:', ws.user.username);
    });
  
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  };
  
 export const routeMessage = (message, ws, wss) => {
    switch (message.type) {
      case 'CHAT':
        handleChatMessage(message, ws, wss);
        break;
      case 'NOTIFICATION':
        handleNotificationMessage(message, ws, wss);
        break;
      default:
        console.error('Unknown message type:', message.type);
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  };
  
 export  const handleChatMessage = (message, ws, wss) => {
    console.log('Chat message:', message);
    // Broadcast chat message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ user: ws.user.username, text: message.text }));
      }
    });
  };
  
 export  const handleNotificationMessage = (message, ws, wss) => {
    console.log('Notification message:', message);
    // Handle notification message
    // For example, send it to specific users or log it
  };