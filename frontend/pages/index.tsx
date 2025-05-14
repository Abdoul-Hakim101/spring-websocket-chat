import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const [username, setUsername] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            router.push(`/chat?username=${encodeURIComponent(username.trim())}`);
        }
    };

    return (
        <div id="username-page">
            <div className="username-page-container">
                <h1 className="title">Type your username to enter the Chatroom</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-control"
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-group">
                        <button type="submit" className="accent username-submit">Start Chatting</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
