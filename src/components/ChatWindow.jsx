import { useEffect, useState } from "react";

import api from "../services/api";
import socket from "../services/socket";

export default function ChatWindow({
  chatId,
  currentUser
}) {
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!chatId) return;

    let mounted = true;

    const loadMessages = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          `/api/chats/${chatId}/messages`
        );

        if (mounted) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error(
          "Could not load messages:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    // Join this chat room
    socket.emit("join_chat", chatId);

    const handleNewMessage = (message) => {
      console.log(
        "New message received:",
        message
      );

      /*
        Prevent duplicate messages.
      */
      setMessages((previousMessages) => {
        const alreadyExists =
          previousMessages.some(
            (existingMessage) =>
              existingMessage.id === message.id
          );

        if (alreadyExists) {
          return previousMessages;
        }

        return [
          ...previousMessages,
          message
        ];
      });

      setSending(false);
    };

    socket.on(
      "new_message",
      handleNewMessage
    );

    const handleSocketError = (message) => {
      console.error(
        "Socket error:",
        message
      );

      setSending(false);
    };

    socket.on(
      "error_message",
      handleSocketError
    );

    return () => {
      socket.off(
        "new_message",
        handleNewMessage
      );

      socket.off(
        "error_message",
        handleSocketError
      );
    };
  }, [chatId]);

  const sendMessage = (e) => {
    e.preventDefault();

    const cleanText = text.trim();

    if (!cleanText) {
      return;
    }

    if (!socket.connected) {
      console.error(
        "Socket is not connected"
      );

      return;
    }

    setSending(true);

    socket.emit("send_message", {
      chatId,
      text: cleanText
    });

    setText("");
  };

  return (
    <div className="chat-window">

      {/* Header */}
      <div className="chat-header">
        <h2>Chat</h2>
      </div>

      {/* Messages */}
      <div className="messages">

        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => {
            const isMine =
              message.sender_id ===
              currentUser.id;

            return (
              <div
                key={message.id}
                className={
                  isMine
                    ? "message mine"
                    : "message"
                }
              >
                <div className="message-text">
                  {message.text_content}
                </div>

                <div className="message-time">
                  {new Date(
                    message.created_at
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* Message Input */}
      <form
        onSubmit={sendMessage}
        className="message-form"
      >
        <input
          type="text"
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Type a message..."
          disabled={sending}
        />

        <button
          type="submit"
          disabled={
            sending || !text.trim()
          }
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

    </div>
  );
}