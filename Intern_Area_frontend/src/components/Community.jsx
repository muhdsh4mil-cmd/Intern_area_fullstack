import React, { useState, useEffect } from "react";
import {
  getPosts,
  getPostQuota,
  createPost,
  toggleLikePost,
  commentPost,
  sharePost,
  deletePost,
} from "../api/postsAPI";
import { SUPERHERO_AVATARS } from "../data/avatars";

export default function Community({ user, setView, addToast }) {
  const [posts, setPosts] = useState([]);
  const [quota, setQuota] = useState({
    friendCount: 0,
    todayPostsCount: 0,
    quotaLimit: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [mediaData, setMediaData] = useState(null);
  const [resetCountdown, setResetCountdown] = useState("");

  const showToast = (message, type = "success") => {
    if (addToast) {
      addToast(message, type);
    } else {
      console.log(`[Toast ${type}]: ${message}`);
    }
  };

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const [postsData, quotaData] = await Promise.all([
        getPosts(),
        getPostQuota(),
      ]);
      setPosts(postsData || []);
      setQuota(quotaData || {
        friendCount: 0,
        todayPostsCount: 0,
        quotaLimit: 0,
        remaining: 0,
      });
    } catch (error) {
      console.error("Error fetching community data:", error);
      showToast("Error loading community posts. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  useEffect(() => {
    if (!quota.resetTimeAt || quota.quotaLimit === "Unlimited" || quota.quotaLimit === 0) {
      setResetCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const resetDate = new Date(quota.resetTimeAt);
      const diffMs = resetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setResetCountdown("");
        getPostQuota().then(setQuota);
        return false;
      }

      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      const hoursStr = hours > 0 ? `${hours}h ` : "";
      const minsStr = minutes > 0 || hours > 0 ? `${minutes}m ` : "";
      const secsStr = `${seconds}s`;

      setResetCountdown(`${hoursStr}${minsStr}${secsStr}`);
      return true;
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [quota.resetTimeAt, quota.quotaLimit]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast("Post deleted successfully.", "info");
      const quotaData = await getPostQuota();
      setQuota(quotaData);
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("Failed to delete post.", "error");
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      showToast("Media file size is too large (max 4MB).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaData({ url: reader.result, type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !mediaData) return;

    if (quota.quotaLimit === 0) {
      showToast("Post Creation Locked - Add Friends to Unlock Posting", "error");
      return;
    }
    if (quota.quotaLimit !== "Unlimited" && quota.todayPostsCount >= quota.quotaLimit) {
      showToast("Daily posting limit reached!", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createPost(
        newPostContent.trim(),
        mediaData ? mediaData.url : "",
        mediaData ? mediaData.type : ""
      );
      setPosts((prev) => [created, ...prev]);
      setNewPostContent("");
      setMediaData(null);
      showToast("Post shared with the community!", "success");
      const quotaData = await getPostQuota();
      setQuota(quotaData);
    } catch (error) {
      console.error("Error creating post:", error);
      showToast(error.response?.data?.message || "Failed to create post.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const updatedPost = await toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: updatedPost.likes } : p))
      );
    } catch (error) {
      console.error("Error liking post:", error);
      showToast("Failed to update like status.", "error");
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;
    try {
      const updatedPost = await commentPost(postId, commentText.trim());
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: updatedPost.comments } : p))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      showToast("Comment added!", "success");
    } catch (error) {
      console.error("Error adding comment:", error);
      showToast("Failed to add comment.", "error");
    }
  };

  const handleShare = async (postId) => {
    try {
      const result = await sharePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, sharesCount: result.sharesCount } : p))
      );
      const shareUrl = `${window.location.origin}/community/post/${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Copied post share link to clipboard!", "success");
    } catch (error) {
      console.error("Error sharing post:", error);
      showToast("Failed to log share.", "error");
    }
  };

  const toggleCommentsExpansion = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderAvatar = (author, sizeClass = "w-10 h-10") => {
    if (!author) return null;
    const avatarKey = author.avatar;
    if (avatarKey && SUPERHERO_AVATARS[avatarKey]) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200 shadow-inner shrink-0`}>
          {SUPERHERO_AVATARS[avatarKey].svg}
        </div>
      );
    }
    if (avatarKey && avatarKey.startsWith("http")) {
      return (
        <img
          src={avatarKey}
          alt={author.name}
          className={`${sizeClass} rounded-full object-cover border border-slate-200 shrink-0`}
        />
      );
    }
    const initial = author.name ? author.name.charAt(0).toUpperCase() : "?";
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0 border border-slate-200`}>
        {initial}
      </div>
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin": return "bg-rose-100 text-rose-700 border-rose-200";
      case "employer": return "bg-violet-100 text-violet-700 border-violet-200";
      default: return "bg-sky-100 text-sky-700 border-sky-200";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const isPostCreationLocked = quota.quotaLimit === 0;
  const isQuotaExceeded = quota.quotaLimit !== "Unlimited" && quota.todayPostsCount >= quota.quotaLimit;
  const showLockWarning = isPostCreationLocked;
  const showLimitWarning = !isPostCreationLocked && isQuotaExceeded;

  const quotaUsedPercent =
    quota.quotaLimit === "Unlimited" || quota.quotaLimit === 0
      ? 0
      : Math.min(100, (quota.todayPostsCount / quota.quotaLimit) * 100);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

      {/* Hero Header */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden hero-gradient text-white p-5 sm:p-8 md:p-10 mb-5 sm:mb-8 shadow-xl border border-slate-900 animate-fade-in">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-blue-200 border border-white/10 mb-3 tracking-wide uppercase">
            🌐 Public Space
          </span>
          <h1 className="font-outfit font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight glow-text mb-2">
            Community Hub
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md">
            Welcome to the public feed! Connect with other interns and professionals, share your journey, and build meaningful networks.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-primary/10 to-transparent pointer-events-none" />
      </div>

      {/* Quota Stats Dashboard */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-6 mb-5 sm:mb-8 shadow-md">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Friends</p>
            <p className="font-outfit font-extrabold text-xl sm:text-2xl text-slate-800">{quota.friendCount}</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Daily Limit</p>
            <p className="font-outfit font-extrabold text-xl sm:text-2xl text-slate-800">
              {quota.quotaLimit === "Unlimited" ? (
                <span className="text-emerald-500 text-base sm:text-2xl">∞</span>
              ) : (
                quota.quotaLimit
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Posted</p>
            <p className="font-outfit font-extrabold text-xl sm:text-2xl text-primary">{quota.todayPostsCount}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {!isPostCreationLocked && quota.quotaLimit !== "Unlimited" && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Quota Usage</span>
              <span>{Math.round(quotaUsedPercent)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaUsedPercent >= 100
                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                    : quotaUsedPercent >= 70
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-primary-light to-primary"
                }`}
                style={{ width: `${quotaUsedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        {showLockWarning && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl p-3">
            <span className="text-lg shrink-0">🔒</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-rose-600">Post Creation Locked</p>
              <p className="text-[10px] text-slate-500 font-semibold">Add friends to unlock posting</p>
            </div>
            <button
              onClick={() => setView("friends")}
              className="shrink-0 px-3 py-1.5 text-[10px] font-extrabold text-white bg-primary hover:bg-primary-dark rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Add Friends
            </button>
          </div>
        )}

        {showLimitWarning && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <span className="text-lg shrink-0">⏱️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-600">Daily Limit Reached</p>
              <p className="text-[10px] text-slate-500 font-semibold">
                Next post in <span className="font-mono font-bold text-slate-700">{resetCountdown || "--:--:--"}</span>
              </p>
            </div>
            <button
              onClick={() => setView("friends")}
              className="shrink-0 px-3 py-1.5 text-[10px] font-extrabold text-primary border border-primary/20 hover:bg-primary/5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              More Friends
            </button>
          </div>
        )}

        {quota.quotaLimit === "Unlimited" && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <span className="text-lg shrink-0">🚀</span>
            <div>
              <p className="text-xs font-bold text-emerald-600">Unlimited Access</p>
              <p className="text-[10px] text-slate-500 font-semibold">Create infinite daily posts!</p>
            </div>
          </div>
        )}

        {!showLockWarning && !showLimitWarning && quota.quotaLimit !== "Unlimited" && quota.quotaLimit !== 0 && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <span className="text-lg shrink-0">✍️</span>
            <div>
              <p className="text-xs font-bold text-primary">Postings Available</p>
              <p className="text-[10px] text-slate-500 font-semibold">
                {quota.remaining} post {quota.remaining === 1 ? "slot" : "slots"} left today
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Post Creator Box */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-6 mb-5 sm:mb-8 shadow-sm relative overflow-hidden">
        {/* Lock overlays */}
        {isPostCreationLocked && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-4 sm:p-6">
            <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl max-w-sm w-full shadow-md space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto text-lg">
                🔒
              </div>
              <p className="font-outfit font-extrabold text-sm text-slate-800">
                Post Creation Locked
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Add at least 1 friend to start posting in the community.
              </p>
              <button
                onClick={() => setView("friends")}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Go to Friends Section
              </button>
            </div>
          </div>
        )}

        {showLimitWarning && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-4 sm:p-6">
            <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl max-w-sm w-full shadow-md space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center mx-auto text-lg">
                ⏱️
              </div>
              <p className="font-outfit font-extrabold text-sm text-slate-800">
                Today's Post Quota Complete
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                You've reached your limit of {quota.quotaLimit} {quota.quotaLimit === 1 ? "post" : "posts"} per day.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Next post unlocks in</p>
                <p className="font-mono text-sm font-extrabold text-slate-800 mt-0.5">{resetCountdown || "--:--:--"}</p>
              </div>
              <button
                onClick={() => setView("friends")}
                className="w-full px-4 py-2 text-xs font-bold text-primary border border-primary/20 hover:bg-primary/5 rounded-xl transition-all cursor-pointer"
              >
                Add Friends to Increase Limit
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-3 sm:space-y-4">
          <div className="flex gap-3">
            {renderAvatar(user, "w-9 h-9 sm:w-10 sm:h-10")}
            <div className="flex-1 min-w-0">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? Share an update, tip, or question..."
                className="w-full min-h-[80px] sm:min-h-[100px] bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-xl sm:rounded-2xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-y"
                maxLength={500}
                disabled={isPostCreationLocked || isQuotaExceeded}
              />
            </div>
          </div>

          {mediaData && (
            <div className="relative animate-fade-in ml-12">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-sm bg-slate-50">
                {mediaData.type === "image" ? (
                  <img src={mediaData.url} alt="Preview" className="w-full max-h-40 sm:max-h-48 object-contain" />
                ) : (
                  <video src={mediaData.url} controls className="w-full max-h-40 sm:max-h-48" />
                )}
                <button
                  type="button"
                  onClick={() => setMediaData(null)}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 text-xs font-bold cursor-pointer shadow-md"
                  title="Remove media"
                >
                  ✕
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[10px] px-3 py-1 font-mono truncate">
                  {mediaData.name}
                </div>
              </div>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between ml-12 gap-2">
            <div className="flex items-center gap-2">
              {/* Image upload */}
              <label
                htmlFor="photo-upload"
                className="flex items-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 text-slate-600 hover:text-primary transition-all text-xs font-bold cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Photo</span>
              </label>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "image")}
                className="hidden"
                disabled={isPostCreationLocked || isQuotaExceeded}
              />

              {/* Video upload */}
              <label
                htmlFor="video-upload"
                className="flex items-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 text-slate-600 hover:text-primary transition-all text-xs font-bold cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Video</span>
              </label>
              <input
                type="file"
                id="video-upload"
                accept="video/*"
                onChange={(e) => handleFileChange(e, "video")}
                className="hidden"
                disabled={isPostCreationLocked || isQuotaExceeded}
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 hidden sm:block">
                {newPostContent.length}/500
              </span>
              <button
                type="submit"
                disabled={isSubmitting || (!newPostContent.trim() && !mediaData) || isPostCreationLocked || isQuotaExceeded}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all ${
                  (!newPostContent.trim() && !mediaData)
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark cursor-pointer active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">Posting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Feed Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="font-outfit font-extrabold text-base sm:text-lg text-slate-800 flex items-center gap-2">
          <span>📣</span> Community Feed
        </h2>
        <button
          onClick={fetchCommunityData}
          className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 border border-slate-100 rounded-xl transition-all shadow-sm"
          title="Refresh Feed"
        >
          <svg className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
          </svg>
        </button>
      </div>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Loading feed updates...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel border border-slate-100 rounded-2xl sm:rounded-3xl p-10 sm:p-12 text-center shadow-sm space-y-4">
          <div className="text-4xl">🌱</div>
          <h3 className="font-outfit font-bold text-slate-800 text-sm">Quiet in the community space</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
            No posts have been shared yet. Be the first to share an update once you connect with friends!
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user?._id);
            const isCommentsOpen = !!expandedComments[post._id];

            return (
              <div
                key={post._id}
                className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {renderAvatar(post.user, "w-9 h-9 sm:w-10 sm:h-10")}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-outfit font-extrabold text-sm text-slate-800 truncate">
                          {post.user?.name || "Unknown User"}
                        </p>
                        {post.user?.role && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getRoleBadgeColor(post.user.role)}`}
                          >
                            {post.user.role}
                          </span>
                        )}
                      </div>
                      {post.user?.uniqueId && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          @{post.user.uniqueId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {formatTime(post.createdAt)}
                    </span>
                    {(post.user?._id === user?._id || post.user === user?._id || user?.role === "admin") && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Post"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                {post.content && (
                  <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed mb-3 sm:mb-4">
                    {post.content}
                  </div>
                )}

                {/* Media */}
                {post.mediaUrl && (
                  <div className="mb-4 animate-fade-in">
                    <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-h-[350px] sm:max-h-[450px] flex items-center justify-center bg-slate-50">
                      {post.mediaType === "image" ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post Attachment"
                          className="w-full max-h-[350px] sm:max-h-[450px] object-contain hover:scale-[1.01] transition-transform duration-300"
                        />
                      ) : (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="w-full max-h-[350px] sm:max-h-[450px]"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-b border-slate-100 py-2 flex items-center justify-around text-xs font-bold text-slate-500">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1 sm:gap-1.5 py-1.5 px-2 sm:px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                      hasLiked ? "text-rose-500 bg-rose-50/50 hover:bg-rose-50" : ""
                    }`}
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill={hasLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleCommentsExpansion(post._id)}
                    className={`flex items-center gap-1 sm:gap-1.5 py-1.5 px-2 sm:px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                      isCommentsOpen ? "text-primary bg-primary/5 hover:bg-primary/10" : ""
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{post.comments?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post._id)}
                    className="flex items-center gap-1 sm:gap-1.5 py-1.5 px-2 sm:px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 hover:text-slate-700"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.632-2.316a3 3 0 11.894 1.789l-4.632 2.316a3 3 0 11-.894-1.789zm0 2.516l4.632 2.316a3 3 0 11-.894 1.789l-4.632-2.316a3 3 0 11.894-1.789z" />
                    </svg>
                    <span>{post.sharesCount || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 space-y-3 animate-fade-in">
                    {/* Comment Input */}
                    <div className="flex gap-2 items-center">
                      {renderAvatar(user, "w-7 h-7 sm:w-8 sm:h-8")}
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post._id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post._id);
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-all placeholder-slate-400 text-slate-800"
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          disabled={!commentInputs[post._id] || !commentInputs[post._id].trim()}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shrink-0 ${
                            !commentInputs[post._id] || !commentInputs[post._id].trim()
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-primary hover:bg-primary-dark cursor-pointer"
                          }`}
                        >
                          Send
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-3 mt-2 max-h-[250px] overflow-y-auto pr-1">
                        {post.comments.map((comment) => (
                          <div key={comment._id} className="flex gap-2 items-start">
                            {renderAvatar(comment.user, "w-6 h-6 sm:w-7 sm:h-7")}
                            <div className="flex-1 bg-slate-50/70 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-2.5">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-outfit font-extrabold text-[11px] text-slate-800">
                                  {comment.user?.name || "Anonymous"}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                  {formatTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-semibold italic text-center py-2">
                        No comments yet. Write the first one!
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
