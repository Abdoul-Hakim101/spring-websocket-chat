import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

interface ChatMessage {
    sender: string;
    content: string;
    type: 'CHAT' | 'JOIN' | 'LEAVE';
}

const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

export default function ChatPage() {
    const router = useRouter();
    const username = (router.query.username as string) || '';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connectedRef = useRef(false);

    const getAvatarColor = (sender: string) => {
        let hash = 0;
        for (let i = 0; i < sender.length; i++) {
            hash = 31 * hash + sender.charCodeAt(i);
        }
        return colors[Math.abs(hash % colors.length)];
    };

    useEffect(() => {
        if (!username || connectedRef.current) return;
        connectedRef.current = true;
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            onConnect: () => {
                stompClient.subscribe('/topic/public', (message: IMessage) => {
                    const msg: ChatMessage = JSON.parse(message.body);
                    setMessages((prev) => [...prev, msg]);
                });

                stompClient.publish({
                    destination: '/app/chat.addUser',
                    body: JSON.stringify({
                        sender: username,
                        type: 'JOIN',
                    }),
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        stompClient.activate();
        stompClientRef.current = stompClient;

        return () => {
            if (stompClient.connected) {
                stompClient.publish({
                    destination: '/app/chat.leave',
                    body: JSON.stringify({
                        sender: username,
                        type: 'LEAVE',
                    }),
                });
                stompClient.deactivate();
            }
        };
    }, [username]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const client = stompClientRef.current;

        if (!client?.connected || !message.trim()) return;

        client.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify({
                sender: username,
                content: message,
                type: 'CHAT',
            }),
        });
        setMessage('');
    };

    const handleExitChat = () => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination: '/app/chat.leave',
                body: JSON.stringify({
                    sender: username,
                    type: 'LEAVE',
                }),
            });
        }
        router.push("/");
    };

    return (
        <div id="chat-page">
            <div className="chat-container">
                <div className="chat-header">
                    <h2>Spring WebSocket Chat Demo</h2>
                    <button
                        onClick={handleExitChat}
                        className="exit-button"
                    >
                        Exit Chat
                    </button>
                </div>
                <ul id="messageArea">
                    {messages.map((msg, index) => (
                        <li
                            key={index}
                            className={`${msg.type === 'JOIN' || msg.type === 'LEAVE' ?
                                'event-message' :
                                'chat-message'} ${msg.sender === username ? 'message-self' : ''}`}
                        >
                            {msg.type === 'JOIN' || msg.type === 'LEAVE' ? (
                                `${msg.sender} ${msg.type === 'JOIN' ? 'joined' : 'left'}!`
                            ) : (
                                <>
                                    <div
                                        className="avatar"
                                        style={{ backgroundColor: getAvatarColor(msg.sender) }}
                                    >
                                        {msg.sender.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="message-content">
                                        <div className="username">{msg.sender}</div>
                                        <p>{msg.content}</p>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                    <div ref={messagesEndRef} />
                </ul>
                <form onSubmit={handleSend} className="message-form">
                    <div className="input-group">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button type="submit" className="primary">Send</button>
                    </div>
                </form>
            </div>
        </div>
    );
}