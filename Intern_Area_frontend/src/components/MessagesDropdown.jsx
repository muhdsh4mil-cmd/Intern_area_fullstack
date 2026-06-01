import React, { useState, useEffect, useRef, useCallback } from "react";
import { getConversations, getUnreadCount } from "../api/messagesAPI";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getAvatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&bold=true`;
}

export default function MessagesDropdown({ user, setView, onOpenConversation }) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getConversations();
      setConversations((data.conversations || []).slice(0, 6));
      setUnreadCount(data.totalUnread || 0);
    } catch (err) {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }
    fetchData();
    pollRef.current = setInterval(fetchData, 15000);
    return () => clearInterval(pollRef.current);
  }, [user, fetchData]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) fetchData();
  };

  const handleConvClick = (conv) => {
    setOpen(false);
    if (onOpenConversation) {
      onOpenConversation(conv);
    } else {
      setView("messages");
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv?.participants) return null;
    return conv.participants.find((p) => p._id !== user._id) || conv.participants[0];
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Messages Button */}
      <button
        onClick={handleOpen}
        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative"
        title="Messages"
        aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[320px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-800 font-outfit">Messages</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => { setView("messages"); setOpen(false); }}
              className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors"
            >
              Open all →
            </button>
          </div>

          {/* Conversation previews */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-500">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1">Go to Friends and click "Message" to start a chat</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const unread = conv.myUnreadCount || 0;

                return (
                  <button
                    key={conv._id}
                    onClick={() => handleConvClick(conv)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={other?.avatar || getAvatarUrl(other?.name)}
                        alt={other?.name || "User"}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      {other?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${unread > 0 ? "font-extrabold text-slate-800" : "font-semibold text-slate-600"}`}>
                          {other?.name || "Unknown"}
                        </p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                          {timeAgo(conv.lastMessageAt || conv.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${unread > 0 ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                        {unread > 0 && (
                          <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center text-[9px] font-extrabold text-white">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
            <button
              onClick={() => { setView("messages"); setOpen(false); }}
              className="w-full text-center text-[11px] font-bold text-primary hover:text-primary/70 transition-colors"
            >
              View all conversations →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
