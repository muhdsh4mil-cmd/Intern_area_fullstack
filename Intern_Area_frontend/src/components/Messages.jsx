import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  deleteConversation,
  deleteMessage,
} from "../api/messagesAPI";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&bold=true`;
}

export default function Messages({ user, initialFriendId = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirmActive, setDeleteConfirmActive] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // Load conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // If a friend ID was passed (from Friends page "Message" button), open their conversation
  useEffect(() => {
    if (initialFriendId && user) {
      openConversationWithUser(initialFriendId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFriendId]);

  const openConversationWithUser = async (userId) => {
    setConvLoading(true);
    try {
      const conv = await getOrCreateConversation(userId);
      // Add to conversations if not already there
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conv._id);
        return exists ? prev : [conv, ...prev];
      });
      openConversation(conv);
    } catch (err) {
      console.error("Error opening conversation:", err);
    } finally {
      setConvLoading(false);
    }
  };

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const msgs = await getMessages(convId);
      setMessages(msgs || []);
      // Reset unread in local state
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, myUnreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, []);

  const openConversation = (conv) => {
    setActiveConvId(conv._id);
    setActiveConv(conv);
    fetchMessages(conv._id);
    setDeleteConfirmActive(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteConversation = async () => {
    if (!activeConvId) return;
    try {
      await deleteConversation(activeConvId);
      setConversations((prev) => prev.filter((c) => c._id !== activeConvId));
      setActiveConvId(null);
      setActiveConv(null);
      setMessages([]);
      setDeleteConfirmActive(false);
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleDeleteConversationById = async (convId) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setActiveConv(null);
        setMessages([]);
        setDeleteConfirmActive(false);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const originalMessages = [...messages];
    setMessages((prev) => prev.filter((m) => m._id !== messageId));

    try {
      await deleteMessage(messageId);
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === activeConvId) {
            const remaining = originalMessages.filter((m) => m._id !== messageId && !m.isTemp);
            const lastMsg = remaining[remaining.length - 1];
            return {
              ...c,
              lastMessage: lastMsg ? lastMsg.content : "",
              lastMessageAt: lastMsg ? lastMsg.createdAt : null,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Failed to delete message:", err);
      setMessages(originalMessages);
    }
  };

  // Poll for new messages every 5 seconds when a conversation is open
  useEffect(() => {
    clearInterval(pollRef.current);
    if (activeConvId) {
      pollRef.current = setInterval(async () => {
        try {
          const msgs = await getMessages(activeConvId);
          setMessages(msgs || []);
        } catch (err) {}
      }, 5000);

      // Also refresh conversation list every 10s for new conv previews
      const convPoll = setInterval(fetchConversations, 10000);
      return () => {
        clearInterval(pollRef.current);
        clearInterval(convPoll);
      };
    }
    return () => clearInterval(pollRef.current);
  }, [activeConvId, fetchConversations]);

  // Scroll to bottom when messages change or active conversation changes,
  // without scrolling the whole page/screen
  const lastMessagesLengthRef = useRef(0);
  const lastActiveConvIdRef = useRef(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;

    const isNewConv = activeConvId !== lastActiveConvIdRef.current;
    lastActiveConvIdRef.current = activeConvId;

    const hasNewMessage = messages.length > lastMessagesLengthRef.current;
    lastMessagesLengthRef.current = messages.length;

    if (isNewConv) {
      // Immediate scroll to bottom on new conversation
      container.scrollTop = container.scrollHeight;
    } else if (hasNewMessage) {
      // Check if user is near bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      // Check if the last message is from current user
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = lastMsg && (lastMsg.sender?._id === user._id || lastMsg.sender === user._id);

      if (isNearBottom || isMyMessage) {
        // Scroll to bottom smoothly within the container
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages, activeConvId, user._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // Optimistic update
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      content: text,
      createdAt: new Date().toISOString(),
      isRead: false,
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const sent = await sendMessage(activeConvId, text);
      // Replace temp with real
      setMessages((prev) => prev.map((m) => (m._id === tempMsg._id ? sent : m)));
      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvId
            ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Get the other participant in a conversation
  const getOtherParticipant = (conv) => {
    if (!conv?.participants) return null;
    return conv.participants.find((p) => p._id !== user._id) || conv.participants[0];
  };

  const activeOther = activeConv ? getOtherParticipant(activeConv) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: "calc(100vh - 160px)", minHeight: "500px" }}>
        <div className="flex h-full">

          {/* ─── Sidebar: Conversation List ─── */}
          <div className={`${sidebarOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 border-r border-slate-100 flex-shrink-0`}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-extrabold text-lg text-slate-800 font-outfit">Messages</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Chat with your connections</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No conversations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Go to Friends and click "Message" to start chatting</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isActive = activeConvId === conv._id;
                  const unread = conv.myUnreadCount || 0;

                  return (
                    <div
                      key={conv._id}
                      onClick={() => openConversation(conv)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""} group/item relative`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={other?.avatar || getAvatarUrl(other?.name)}
                            alt={other?.name || "User"}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200"
                          />
                          {other?.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${unread > 0 ? "font-extrabold text-slate-800" : "font-semibold text-slate-700"}`}>
                              {other?.name || "Unknown"}
                            </p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                              {timeAgo(conv.lastMessageAt || conv.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className={`text-xs truncate ${unread > 0 ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                              {conv.lastMessage || "No messages yet"}
                            </p>
                            {unread > 0 && (
                              <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center text-[10px] font-extrabold text-white">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete conversation with ${other?.name || "Unknown"}?`)) {
                            handleDeleteConversationById(conv._id);
                          }
                        }}
                        className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl flex-shrink-0"
                        title="Delete chat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ─── Chat Panel ─── */}
          <div className={`${!sidebarOpen || activeConvId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
            {!activeConvId ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-cyan-400/20 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="font-extrabold text-xl text-slate-700 font-outfit">Your Messages</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-xs">
                  Select a conversation or go to <strong>Friends</strong> and click <strong>Message</strong> to start chatting with a connection.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-white">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-1.5 text-slate-500 hover:text-primary rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {activeOther && (
                    <>
                      <div className="relative">
                        <img
                          src={activeOther?.avatar || getAvatarUrl(activeOther?.name)}
                          alt={activeOther?.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        {activeOther?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm text-slate-800">{activeOther?.name}</p>
                        <p className="text-[11px] text-slate-400 capitalize">
                          {activeOther?.isOnline ? (
                            <span className="text-emerald-500 font-semibold">● Online</span>
                          ) : (
                            `Last seen ${timeAgo(activeOther?.lastLogin)}`
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  {convLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  )}

                  {/* Delete Conversation action in Header */}
                  <div className="flex items-center gap-2">
                    {deleteConfirmActive ? (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-2.5 py-1 animate-fade-in">
                        <span className="text-xs text-rose-600 font-bold">Delete entire chat?</span>
                        <button
                          type="button"
                          onClick={handleDeleteConversation}
                          className="text-[11px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-0.5 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmActive(false)}
                          className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmActive(true)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete entire chat"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages area */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/30"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-sm text-slate-400 font-medium">No messages yet</p>
                      <p className="text-xs text-slate-300 mt-1">Say hello! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                      const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id);

                      return (
                        <div key={msg._id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar for other person */}
                          {!isMine && (
                            <div className="flex-shrink-0 w-7">
                              {showAvatar && (
                                <img
                                  src={msg.sender?.avatar || getAvatarUrl(msg.sender?.name)}
                                  alt={msg.sender?.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                              )}
                            </div>
                          )}

                          {/* Bubble and Delete Button Group */}
                          <div className="max-w-[70%] group">
                            <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                  isMine
                                    ? "bg-primary text-white rounded-br-md shadow-sm"
                                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-md shadow-sm"
                                } ${msg.isTemp ? "opacity-70" : ""}`}
                              >
                                {msg.content}
                              </div>

                              {isMine && !msg.isTemp && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm("Delete this message?")) {
                                      handleDeleteMessage(msg._id);
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full flex-shrink-0"
                                  title="Delete message"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <p className={`text-[10px] text-slate-400 mt-1 ${isMine ? "text-right" : "text-left"}`}>
                              {timeAgo(msg.createdAt)}
                              {isMine && (
                                <span className="ml-1">{msg.isRead ? "✓✓" : msg.isTemp ? "⏳" : "✓"}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input box */}
                <form
                  onSubmit={handleSend}
                  className="flex items-end gap-3 px-5 py-4 border-t border-slate-100 bg-white"
                >
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder-slate-400 max-h-32 overflow-y-auto"
                    style={{ lineHeight: "1.5" }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm active:scale-95"
                    title="Send message"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
