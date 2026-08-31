import { useEffect, useState } from "react";
import socket from "../services/socket";
import api from "../services/api";

export default function ChatWindow({
  chatId,
  currentUser
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!chatId) return;

    socket.connect();

    socket.emit("join_chat", chatId);

    const handleNewMessage = (message) => {
      setMessages((previous) => [
        ...previous,
        message
      ]);
    };

    socket.on(
      "new_message",
      handleNewMessage
    );

    return () => {
      socket.off(
        "new_message",
        handleNewMessage
      );

      socket.disconnect();
    };
  }, [chatId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;

      try {
        const response = await api.get(
          `/api/chats/${chatId}/messages`
        );

        setMessages(response.data.messages);
      } catch (error) {
        console.error(error);
      }
    };

    loadMessages();
  }, [chatId]);

  const sendMessage = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    socket.emit("send_message", {
      chatId,
      text
    });

    setText("");
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender_id ===
              currentUser.id
                ? "message mine"
                : "message"
            }
          >
            {message.text_content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Type a message..."
        />

        <button type="submit">
          Send
        </button>
      </form>
    </div>
  );
}