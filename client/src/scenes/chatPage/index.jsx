import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const location = useLocation();
    const socket = location.state?.socket;  // Retrieve the socket from the location state

    useEffect(() => {
        if (socket) {
            socket.on('chat message', (msg) => {
                setMessages((prevMessages) => [...prevMessages, msg]);
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [socket]);

    const sendMessage = () => {
        const message = { receiver: 'receiver_id', message: input }; // Replace 'receiver_id' with actual receiver id
        socket.emit('chat message', message);
        setInput('');
    };

    return (
        <div>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index}>{msg.message}</div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatPage;
