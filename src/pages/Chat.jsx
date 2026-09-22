import { useEffect, useState } from "react";

import api from "../services/api";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const [user, setUser] = useState(null);

  const [chats, setChats] = useState([]);

  const [users, setUsers] = useState([]);

  const [activeChat, setActiveChat] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Get currently logged-in user
        const userResponse =
          await api.get("/api/auth/me");

        // Get existing chats
        const chatResponse =
          await api.get("/api/chats");

        // Get all registered users
        const usersResponse =
          await api.get("/api/auth/users");

        setUser(userResponse.data.user);

        setChats(chatResponse.data.chats);

        setUsers(usersResponse.data.users);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
          "Could not load chat data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const startChat = async (selectedUser) => {
    try {
      setError("");

      const response = await api.post(
        "/api/chats",
        {
          userId: selectedUser.id
        }
      );

      const newChat = response.data.chat;

      setChats((previousChats) => {
        const alreadyExists =
          previousChats.some(
            (chat) => chat.id === newChat.id
          );

        if (alreadyExists) {
          return previousChats;
        }

        return [newChat, ...previousChats];
      });

      setActiveChat(newChat.id);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Could not start chat"
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please login first.</div>;
  }

  return (
    <div className="whatsapp">

      {/* LEFT SIDEBAR */}
      <aside className="chat-list">

        {/* Current User */}
        <div className="profile">
          <strong>{user.email}</strong>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* Registered Users */}
        <div className="users-section">

          <h3>Start a new chat</h3>

          {users.length === 0 ? (
            <p>No other users registered.</p>
          ) : (
            users.map((registeredUser) => (
              <button
                key={registeredUser.id}
                onClick={() =>
                  startChat(registeredUser)
                }
                className="user-button"
              >
                <div className="user-avatar">
                  {registeredUser.email
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="user-info">
                  <strong>
                    {registeredUser.email}
                  </strong>
                </div>
              </button>
            ))
          )}

        </div>

        {/* Existing Chats */}
        <div className="chats-section">

          <h3>Your Chats</h3>

          {chats.length === 0 ? (
            <p>No chats yet.</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() =>
                  setActiveChat(chat.id)
                }
                className={
                  activeChat === chat.id
                    ? "chat-button active"
                    : "chat-button"
                }
              >
                Chat
              </button>
            ))
          )}

        </div>

      </aside>

      {/* CHAT WINDOW */}
      <main className="chat-main">

        {activeChat ? (
          <ChatWindow
            chatId={activeChat}
            currentUser={user}
          />
        ) : (
          <div className="empty-chat">
            <h2>Welcome to Chat</h2>

            <p>
              Select a registered user to
              start a conversation.
            </p>
          </div>
        )}

      </main>

    </div>
  );
}