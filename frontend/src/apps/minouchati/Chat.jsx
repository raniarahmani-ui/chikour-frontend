import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Chat.css";

const API_BASE = "/api/messages";

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("conversations");
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const getToken = () => {
    return localStorage.getItem("userToken") || localStorage.getItem("token");
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.user_id || payload.id);
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    console.log(
      "Token retrieved:",
      token ? "Yes (length: " + token.length + ")" : "No token found",
    );
    if (!token) {
      setError("Please log in to view messages");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching from:", `${API_BASE}/conversations`);
      console.log(
        "With Authorization header:",
        `Bearer ${token.substring(0, 20)}...`,
      );

      const response = await fetch(`${API_BASE}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const formattedConversations = data.data.conversations.map((conv) => ({
          id: conv.partner_id,
          name: conv.partner_name || conv.partner_username,
          username: conv.partner_username,
          avatar: conv.partner_avatar,
          status: conv.partner_status == 1 ? "active" : "inactive",
          lastMessage: conv.last_message,
          lastMessageTime: conv.last_message_time,
          unreadCount: parseInt(conv.unread_count) || 0,
          active: false,
        }));
        setConversations(formattedConversations);
        setUnreadTotal(data.data.unread_total);

        const userId = searchParams.get("user");
        if (userId) {
          const conv = formattedConversations.find((c) => c.id == userId);
          if (conv) {
            handleConversationClick(conv);
          }
        }
      } else {
        setError(data.message || "Failed to load conversations");
        console.error("API response:", data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchAllUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setUsersLoading(true);
    try {
      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const response = await fetch(`/api/users?per_page=50${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        const users = (data.data || []).filter(u => u.id != currentUserId);
        setAllUsers(users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, [searchTerm, currentUserId]);

  useEffect(() => {
    if (sidebarTab === "users") {
      const timer = setTimeout(() => fetchAllUsers(), 300);
      return () => clearTimeout(timer);
    }
  }, [sidebarTab, fetchAllUsers]);

  const handleUserClick = (user) => {
    const chatTarget = {
      id: user.id,
      name: user.full_name || user.username,
      username: user.username,
      avatar: user.profile_image,
      status: user.is_active ? "active" : "inactive",
      lastMessage: "",
      lastMessageTime: null,
      unreadCount: 0,
      active: true,
    };
    setConversations((prev) =>
      prev.map((conv) => ({ ...conv, active: false }))
    );
    setCurrentChat(chatTarget);
    fetchMessages(user.id);
  };

  const fetchMessages = async (partnerId) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/conversation/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const formattedMessages = data.data.messages.map((msg) => ({
          id: msg.id,
          text: msg.message,
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date(msg.created_at).toLocaleDateString(),
          isMe: msg.sender_id == currentUserId,
          senderName: msg.sender_name || msg.sender_username,
          attachments: msg.attachments ? JSON.parse(msg.attachments) : null,
        }));
        setMessages(formattedMessages);

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === partnerId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchConversations();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentChat) {
        fetchMessages(currentChat.id);
      }
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentChat, fetchConversations]);

  const handleBackToProfile = () => {
    navigate("/webbis/profile");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredConversations = conversations.filter(
    (conversation) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (conversation.name || "").toLowerCase().includes(q) ||
        (conversation.username || "").toLowerCase().includes(q) ||
        (conversation.lastMessage || "").toLowerCase().includes(q)
      );
    }
  );

  const handleConversationClick = async (conversation) => {
    setConversations((prev) =>
      prev.map((conv) => ({
        ...conv,
        active: conv.id === conversation.id,
      })),
    );

    setCurrentChat(conversation);
    await fetchMessages(conversation.id);
  };

  const handleSendMessage = async (e) => {
    if (
      (e.key === "Enter" || e.type === "click") &&
      messageInput.trim() &&
      currentChat
    ) {
      const token = getToken();
      if (!token) {
        setError("Please log in to send messages");
        return;
      }

      setSendingMessage(true);

      try {
        const response = await fetch(`${API_BASE}/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiver_id: currentChat.id,
            message: messageInput.trim(),
          }),
        });

        const data = await response.json();

        if (data.success) {
          const newMessage = {
            id: data.data.data.id,
            text: messageInput.trim(),
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date().toLocaleDateString(),
            isMe: true,
          };

          setMessages((prev) => [...prev, newMessage]);
          setMessageInput("");

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentChat.id
                ? { ...conv, lastMessage: messageInput.trim() }
                : conv,
            ),
          );
        } else {
          setError(data.message || "Failed to send message");
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message");
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => navigate("/swapie/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-subtitle">
            <h2>Messages</h2>
            <p>
              Your conversations{" "}
              {unreadTotal > 0 && (
                <span className="unread-badge">{unreadTotal}</span>
              )}
            </p>
          </div>

          <button
            className="back-to-Profile-btn"
            onClick={handleBackToProfile}
            title="Back to Profile"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Profile</span>
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder={sidebarTab === "users" ? "Search all users..." : "Search conversations..."}
            className="search-input"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="chat-tabs">
          <button
            className={`chat-tab ${sidebarTab === "conversations" ? "active" : ""}`}
            onClick={() => { setSidebarTab("conversations"); setSearchTerm(""); }}
          >
            Chats
          </button>
          <button
            className={`chat-tab ${sidebarTab === "users" ? "active" : ""}`}
            onClick={() => { setSidebarTab("users"); setSearchTerm(""); }}
          >
            All Users
          </button>
        </div>

        {sidebarTab === "conversations" && (
        <div className="conversations-list">
          {filteredConversations.length === 0 && !searchTerm && (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <span>Browse All Users to start chatting!</span>
            </div>
          )}

          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${conversation.active ? "active" : ""} ${conversation.unreadCount > 0 ? "unread" : ""}`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="conversation-avatar">
                {conversation.avatar ? (
                  <img src={conversation.avatar} alt={conversation.name} />
                ) : (
                  getInitials(conversation.name)
                )}
                <span
                  className={`status-indicator ${conversation.status === "active" ? "online" : "offline"}`}
                ></span>
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <h3 className="conversation-name">
                    {conversation.name || conversation.username}
                  </h3>
                  <span className="conversation-time">
                    {formatTimeAgo(conversation.lastMessageTime)}
                  </span>
                </div>
                <div className="conversation-preview">
                  <p className="conversation-last-message">
                    {conversation.lastMessage || "Start a conversation"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-count">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && searchTerm && (
            <div className="no-results">
              <p>No conversations found for "{searchTerm}"</p>
            </div>
          )}
        </div>
        )}

        {sidebarTab === "users" && (
          <div className="conversations-list">
            {usersLoading && (
              <div className="no-conversations"><p>Loading users...</p></div>
            )}
            {!usersLoading && allUsers.length === 0 && (
              <div className="no-conversations"><p>No users found</p></div>
            )}
            {!usersLoading && allUsers.filter((u) => {
              if (!searchTerm) return true;
              const q = searchTerm.toLowerCase();
              return (u.full_name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
            }).map((u) => (
              <div
                key={u.id}
                className={`conversation-item ${currentChat?.id === u.id ? "active" : ""}`}
                onClick={() => handleUserClick(u)}
              >
                <div className="conversation-avatar">
                  {u.profile_image ? (
                    <img src={u.profile_image} alt={u.full_name || u.username} />
                  ) : (
                    getInitials(u.full_name || u.username)
                  )}
                  <span className={`status-indicator ${u.is_active ? "online" : "offline"}`}></span>
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{u.full_name || u.username}</h3>
                  </div>
                  <div className="conversation-preview">
                    <p className="conversation-last-message">{u.email || "Tap to start chatting"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-main">
        {!currentChat ? (
          <div className="no-chat-selected">
            <div className="no-chat-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-user-avatar">
                  {currentChat.avatar ? (
                    <img src={currentChat.avatar} alt={currentChat.name} />
                  ) : (
                    getInitials(currentChat.name)
                  )}
                </div>
                <div className="chat-user-details">
                  <h2>{currentChat.name || currentChat.username}</h2>
                  <span
                    className={`user-status ${currentChat.status === "active" ? "online" : ""}`}
                  >
                    {currentChat.status === "active" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <div className="chat-actions">
                <button className="chat-action-btn" title="View Profile">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <span>Send a message to start the conversation!</span>
                </div>
              ) : (
                messages.map((message, index) => {
                  const showDate =
                    index === 0 || messages[index - 1]?.date !== message.date;
                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="message-date-divider">
                          <span>{message.date}</span>
                        </div>
                      )}
                      <div
                        className={`message ${message.isMe ? "message-sent" : "message-received"}`}
                      >
                        <div className="message-bubble">
                          <p className="message-text">{message.text}</p>
                          <span className="message-time">{message.time}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <button className="attach-btn" title="Attach file">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                className="message-input"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleSendMessage}
                disabled={sendingMessage}
              />
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <div className="send-spinner"></div>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
