import React, { useState, useEffect } from "react";
import {
  getFriendsData,
  getSuggestedFriends,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../api/friendsAPI";

export default function Friends({ user, setView, onMessageFriend }) {
  const [activeTab, setActiveTab] = useState("All Friends");
  const [searchQuery, setSearchQuery] = useState("");

  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [friendsData, suggestedData] = await Promise.all([
        getFriendsData(),
        getSuggestedFriends(),
      ]);
      setFriends(friendsData.friends || []);
      setFriendRequests(friendsData.friendRequests || []);
      setSentRequests(friendsData.sentRequests || []);
      setSuggestedFriends(suggestedData || []);
    } catch (error) {
      console.error("Error fetching friends data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const results = await searchUsers(searchQuery.trim());
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching users:", error);
        }
      } else {
        setSearchResults([]);
      }
    };
    const delayDebounceFn = setTimeout(() => { fetchSearch(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      fetchData();
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert(error.response?.data?.message || "Error sending request");
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await acceptFriendRequest(userId);
      fetchData();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert(error.response?.data?.message || "Error accepting request");
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await rejectFriendRequest(userId);
      fetchData();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert(error.response?.data?.message || "Error rejecting request");
    }
  };

  const isNewUser = (u) => {
    if (u.isNewUser === true) return true;
    if (u.createdAt) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(u.createdAt).getTime() > sevenDaysAgo;
    }
    return false;
  };

  const renderUserCard = (friend, type) => {
    const avatar =
      friend.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random`;
    const showNewBadge = type === "suggested" && isNewUser(friend);

    return (
      <div
        key={friend._id}
        className="flex items-center gap-3 p-3 sm:p-4 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-100 last:border-0"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt={friend.name}
            className={`w-10 h-10 rounded-full object-cover ${
              showNewBadge ? "ring-2 ring-emerald-400 ring-offset-1" : ""
            }`}
          />
          {showNewBadge && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <p className="font-extrabold text-sm text-slate-800 truncate">{friend.name}</p>
            {showNewBadge && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-600 border border-emerald-200 shrink-0 animate-pulse">
                ✦ NEW
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 capitalize truncate">
            {friend.role}{friend.company ? ` · ${friend.company}` : ""}
          </p>
          {friend.uniqueId && (
            <p className="text-[10px] text-slate-400 font-mono truncate">ID: {friend.uniqueId}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {type === "friend" && (
            <button
              onClick={() => onMessageFriend && onMessageFriend(friend._id)}
              className="px-3 py-1.5 text-xs font-bold text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Message</span>
            </button>
          )}
          {type === "request" && (
            <>
              <button
                onClick={() => handleAcceptRequest(friend._id)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectRequest(friend._id)}
                className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/20 hover:border-red-500/40 hover:bg-red-50 rounded-lg transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {type === "sent" && (
            <button
              disabled
              className="px-3 py-1.5 text-xs font-bold text-slate-400 border border-slate-200 bg-slate-50 rounded-lg cursor-not-allowed"
            >
              Pending
            </button>
          )}
          {type === "suggested" && (
            <button
              onClick={() => handleSendRequest(friend._id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                showNewBadge
                  ? "text-white bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 shadow-sm"
                  : "text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {showNewBadge ? "👋 Connect" : "Add"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const getDisplayedList = () => {
    if (activeTab === "Search User ID" && searchQuery.trim().length > 0) {
      return { list: searchResults, type: "suggested", emptyText: "No users found matching your search." };
    }
    switch (activeTab) {
      case `Friend Requests (${friendRequests.length})`:
      case "Friend Requests":
        return { list: friendRequests, type: "request", emptyText: "No pending friend requests." };
      case `Sent Requests (${sentRequests.length})`:
      case "Sent Requests":
        return { list: sentRequests, type: "sent", emptyText: "No sent requests." };
      case "People You May Know":
        return { list: suggestedFriends, type: "suggested", emptyText: "No suggestions at the moment." };
      case "Search User ID":
        return { list: [], type: "suggested", emptyText: "Enter a User ID or name above to search for users." };
      case "All Friends":
      default:
        return { list: friends, type: "friend", emptyText: "You have no friends yet." };
    }
  };

  const { list: displayedList, type: listType, emptyText } = getDisplayedList();

  const newUsersCount = suggestedFriends.filter((u) => {
    if (u.isNewUser === true) return true;
    if (u.createdAt) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(u.createdAt).getTime() > sevenDaysAgo;
    }
    return false;
  }).length;

  const tabs = [
    "All Friends",
    `Friend Requests (${friendRequests.length})`,
    `Sent Requests (${sentRequests.length})`,
    "People You May Know",
    "Search User ID",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="flex flex-col mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-1">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight font-outfit">Friends</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 pl-10 sm:pl-11">Connect, manage and grow your network</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            {
              label: "Total Friends",
              value: friends.length,
              icon: (
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              ),
              bg: "bg-blue-50",
              color: "text-blue-500",
            },
            {
              label: "Requests",
              value: friendRequests.length,
              icon: (
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              ),
              bg: "bg-pink-50",
              color: "text-pink-500",
            },
            {
              label: "Sent",
              value: sentRequests.length,
              icon: (
                <>
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  <path fillRule="evenodd" d="M13.586 7.586a2 2 0 112.828 2.828l-2 2a2 2 0 01-2.828 0l-2-2a2 2 0 112.828-2.828l.586.586V4a1 1 0 112 0v4.172l.586-.586z" clipRule="evenodd" />
                </>
              ),
              bg: "bg-orange-50",
              color: "text-orange-500",
            },
            {
              label: "Suggestions",
              value: suggestedFriends.length,
              icon: (
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              ),
              bg: "bg-purple-50",
              color: "text-purple-500",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex items-center gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 ${stat.color}`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  {stat.icon}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-800 font-outfit">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="border-b border-slate-100 mb-5 sm:mb-6 flex space-x-4 sm:space-x-8 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar pb-0">
          {tabs.map((tab) => {
            const isTabActive = activeTab.startsWith(tab.split(" (")[0]);
            const isPeopleTab = tab === "People You May Know";
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery("");
                }}
                className={`pb-3 whitespace-nowrap border-b-2 transition-colors relative shrink-0 ${
                  isTabActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
                {isPeopleTab && newUsersCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        {activeTab === "Search User ID" && (
          <div className="relative mb-5 sm:mb-6">
            <svg className="absolute left-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Enter User ID or name to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-9 sm:pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-slate-400 text-slate-700"
            />
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-0">
          {/* New members banner */}
          {activeTab === "People You May Know" && newUsersCount > 0 && (
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-semibold text-emerald-700">
                🎉 {newUsersCount} new member{newUsersCount > 1 ? "s" : ""} just joined InternArea! Say hello and connect.
              </p>
            </div>
          )}

          {displayedList.map((item) => renderUserCard(item, listType))}

          {displayedList.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              {emptyText}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
