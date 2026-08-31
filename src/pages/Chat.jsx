import { useEffect, useState } from "react";

import api from "../services/api";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] =
    useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userResponse =
          await api.get("/api/auth/me");

        const chatResponse =
          await api.get("/api/chats");

        setUser(userResponse.data.user);
        setChats(chatResponse.data.chats);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="whatsapp">
      <aside className="chat-list">
        <div className="profile">
          {user.email}
        </div>

        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() =>
              setActiveChat(chat.id)
            }
          >
            Chat
          </button>
        ))}
      </aside>

      <main>
        {activeChat ? (
          <ChatWindow
            chatId={activeChat}
            currentUser={user}
          />
        ) : (
          <div>
            Select a conversation
          </div>
        )}
      </main>
    </div>
  );
}