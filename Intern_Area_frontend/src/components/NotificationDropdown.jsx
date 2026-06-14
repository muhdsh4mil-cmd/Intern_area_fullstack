import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../api/notificationsAPI";

// Icons
const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const typeConfig = {
  friend_request: {
    icon: "👥",
    color: "bg-blue-100 text-blue-600",
    label: "Friend Request",
    action: "View",
  },
  friend_accepted: {
    icon: "🤝",
    color: "bg-emerald-100 text-emerald-600",
    label: "Request Accepted",
    action: "View",
  },
  new_suggestion: {
    icon: "✨",
    color: "bg-purple-100 text-purple-600",
    label: "People You May Know",
    action: "Connect",
  },
  new_message: {
    icon: "💬",
    color: "bg-indigo-100 text-indigo-600",
    label: "New Message",
    action: "Chat",
  },
};

function timeAgo(dateStr) {
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

export default function NotificationDropdown({ user, setView }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Silently fail — user may not be logged in
    }
  }, [user]);

  // Initial fetch + poll every 30 seconds
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollRef.current);
  }, [user, fetchNotifications]);

  // Close on outside click
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
    if (!open) {
      fetchNotifications(); // refresh on open
    }
  };

  const handleMarkRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {}
    }
    // Navigate to relevant view
    if (notif.type === "friend_request" || notif.type === "friend_accepted" || notif.type === "new_suggestion") {
      setView("friends");
      setOpen(false);
    } else if (notif.type === "new_message") {
      setView("messages");
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <BellIcon />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute -right-16 sm:right-0 mt-2 w-[85vw] max-w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-800 font-outfit">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
              >
                {loading ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <BellIcon />
                </div>
                <p className="text-sm font-semibold text-slate-500">You're all caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = typeConfig[notif.type] || typeConfig.new_suggestion;
                const senderAvatar = notif.sender?.avatar
                  ? `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.sender.name || "User")}&background=random`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.sender?.name || "User")}&background=random`;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkRead(notif)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                      !notif.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {/* Avatar or icon */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      {notif.sender ? (
                        <>
                          <img
                            src={senderAvatar}
                            alt={notif.sender.name || "User"}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 text-[10px] flex items-center justify-center rounded-full border border-white ${cfg.color}`}>
                            {cfg.icon}
                          </span>
                        </>
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${cfg.color}`}>
                          {cfg.icon}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs leading-snug ${notif.isRead ? "text-slate-600" : "text-slate-800 font-semibold"}`}>
                          {notif.message}
                        </p>
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, notif._id)}
                          className="flex-shrink-0 p-0.5 text-slate-300 hover:text-slate-500 transition-colors rounded"
                          title="Dismiss"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{timeAgo(notif.createdAt)}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
              <button
                onClick={() => { setView("friends"); setOpen(false); }}
                className="w-full text-center text-[11px] font-bold text-primary hover:text-primary/70 transition-colors"
              >
                View Friends & Connections →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
