import React, { useEffect, useState } from "react";
import { Plus, Search, Calendar, Filter, X, Heart, Sun, Cloud, Zap, Flame } from "lucide-react";
import api from "../api/axios";
import { getCurrentUser } from "../utils/auth";
import { encryptData, decryptData } from "../utils/crypto";
import { toast } from "react-toastify";
import ReactQuill from "react-quill-new";

export default function Diary() {
  const current = getCurrentUser();
  const identity = current?.id ?? null;
  const token = localStorage.getItem("authToken");

  const [entries, setEntries] = useState([]);
  const [moodStats, setMoodStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("Private");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [missingDates, setMissingDates] = useState([]);
  const [filterMood, setFilterMood] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("");

  // New: view modal state
  const [viewModal, setViewModal] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);

  // New: edit modal state
  const [editModal, setEditModal] = useState(false);

  // Handler to open view modal
  const handleViewEntry = (entry) => {
      setViewEntry(entry);
      setViewModal(true);
  };

  // Handler to open edit modal with entry data
  const handleEditEntry = (entry) => {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setTags(entry.tags || "");
      setVisibility(entry.visibility);
      setEntryDate(entry.entry_date.slice(0, 10));
      setEditModal(true);
      setViewModal(false);
      setShowModal(false);
      // store entry id for update
      setEditingId(entry.entry_id);
  };

  // Track editing id for update
  const [editingId, setEditingId] = useState(null);

  const moodConfig = {
    neutral: { emoji: "😐", color: "bg-gray-100 text-gray-700", icon: Cloud, gradient: "from-gray-400 to-gray-500" },
    happy: { emoji: "😊", color: "bg-yellow-100 text-yellow-700", icon: Sun, gradient: "from-yellow-400 to-orange-500" },
    sad: { emoji: "😢", color: "bg-blue-100 text-blue-700", icon: Cloud, gradient: "from-blue-400 to-blue-600" },
    excited: { emoji: "🤩", color: "bg-purple-100 text-purple-700", icon: Zap, gradient: "from-purple-400 to-pink-500" },
    angry: { emoji: "😠", color: "bg-red-100 text-red-700", icon: Flame, gradient: "from-red-400 to-red-600" }
  };

  const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

  useEffect(() => {
    if (identity) {
      loadEntries();
      loadMoodStats();
      loadMissingDates();
    }
  }, [identity]);

  // Pagination state
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;

  // Update loadEntries to handle update
  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMood) params.mood = filterMood;
      if (filterVisibility) params.visibility = filterVisibility;
      if (dateFilter) params.entry_date = dateFilter;
      params.limit = PAGE_SIZE;
      params.offset = page * PAGE_SIZE;
      const res = await api.get("/diary", { params, headers: authHeaders() });
      const dec = await Promise.all(
        (res.data.entries || []).map(async (r) => {
          let t = r.title_encrypted, c = r.content_encrypted;
          try { t = t ? await decryptData(identity, t) : ""; } catch { t = "[decrypt failed]"; }
          try { c = c ? await decryptData(identity, c) : "[decrypt failed]"; } catch { c = "[decrypt failed]"; }
          return { ...r, title: t, content: c };
        })
      );
      setEntries(dec);
    } catch {
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identity) loadEntries();
  }, [filterMood, filterVisibility, dateFilter]);

  const loadMoodStats = async () => {
    try {
      const res = await api.get("/diary/moods/stats", { headers: authHeaders() });
      setMoodStats(res.data.stats || []);
    } catch {}
  };

  const loadMissingDates = async () => {
    try {
      const res = await api.get("/diary/missing", { headers: authHeaders() });
      setMissingDates(res.data.missing || []);
    } catch {
      setMissingDates([]);
    }
  };

  // Update saveEntry to handle update
  const saveEntry = async () => {
    if (!identity) return toast.error("Login required");
    if (!title.trim()) return toast.error("Title cannot be empty");
    if (!content.trim()) return toast.error("Content cannot be empty");

    try {
      const encContent = await encryptData(identity, content);
      const encTitle = title ? await encryptData(identity, title) : null;
      const encTags = tags ? await encryptData(identity, tags) : null;
      const entry_date = `${entryDate} 23:59:59`;

      const payload = {
        title_encrypted: encTitle,
        content_encrypted: encContent,
        mood,
        tags_encrypted: encTags,
        visibility,
        entry_date,
      };

      if (editingId) {
        await api.put(`/diary/${editingId}`, payload, { headers: authHeaders() });
        toast.success("Entry updated!");
        setEditModal(false);
        setEditingId(null);
      } else {
        await api.post("/diary", payload, { headers: authHeaders() });
        toast.success("Entry added!");
        setShowModal(false);
      }
      resetModal();
      loadEntries();
      loadMoodStats();
    } catch {
      toast.error("Failed to save entry");
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await api.delete(`/diary/${entryId}`, { headers: authHeaders() });
      toast.success("Entry deleted!");
      setViewModal(false);
      setEditModal(false);
      setEditingId(null);
      loadEntries();
      loadMoodStats();
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const resetModal = () => {
    setTitle("");
    setContent("");
    setMood("neutral");
    setTags("");
    setVisibility("Private");
    setEntryDate(new Date().toISOString().slice(0, 10));
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const formats = ["header", "bold", "italic", "underline", "color", "background", "list"];

  const openModalForDate = (date) => {
    setShowModal(true);
    setEntryDate(date);
    resetModal();
  };

  const filteredEntries = entries.filter(e => {
    return e.title.toLowerCase().includes(q.toLowerCase()) || 
           e.content.toLowerCase().includes(q.toLowerCase());
  });

  // Pagination controls
  const handleNextPage = () => setPage((p) => p + 1);
  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));

  // Reset page when filters/search change
  useEffect(() => {
    setPage(0);
  }, [filterMood, filterVisibility, dateFilter, q]);

  // Fetch entries when page changes
  useEffect(() => {
    if (identity) loadEntries();
    // eslint-disable-next-line
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Compact Header */}
        <header className="text-center pt-6 pb-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            My Diary
          </h1>
          <p className="text-gray-600 text-sm">Reflect, Write, Grow 🌱</p>
        </header>

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow border border-white/50">
            <Heart className="text-purple-500 mb-1" size={18} />
            <p className="text-xl font-bold text-gray-800">{entries.length}</p>
            <p className="text-xs text-gray-500">Entries</p>
          </div>
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow border border-white/50">
            <Calendar className="text-orange-500 mb-1" size={18} />
            <p className="text-xl font-bold text-gray-800">7</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-3 shadow border border-white/50">
            <Zap className="text-blue-500 mb-1" size={18} />
            <p className="text-xl font-bold text-gray-800">15</p>
            <p className="text-xs text-gray-500">This Month</p>
          </div>
        </div>

        {/* Mood Stats */}
        {moodStats.length > 0 && (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50">
            <p className="text-sm font-semibold mb-3 text-gray-700">Mood Insights</p>
            <div className="flex gap-2 flex-wrap">
              {moodStats.map(stat => {
                const config = moodConfig[stat.mood];
                return (
                  <div key={stat.mood} className={`${config.color} rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-sm`}>
                    <span>{config.emoji}</span>
                    <span className="font-medium">{stat.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missed Days */}
        {missingDates.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow">
            <p className="text-sm font-semibold text-amber-900 mb-2">Missed Days</p>
            <div className="flex gap-2 flex-wrap">
              {missingDates.map((d) => (
                <button
                  key={d}
                  onClick={() => openModalForDate(d)}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-xs px-3 py-1.5 rounded-xl transition font-medium"
                >
                  {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search memories..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl border-2 transition flex items-center gap-1 text-sm font-medium ${
                showFilters ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <Filter size={16} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-gray-200">
              <select
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">All moods</option>
                <option value="neutral">😐 Neutral</option>
                <option value="happy">😊 Happy</option>
                <option value="sad">😢 Sad</option>
                <option value="excited">🤩 Excited</option>
                <option value="angry">😠 Angry</option>
              </select>
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">All visibility</option>
                <option value="Private">🔒 Private</option>
                <option value="Public">🌐 Public</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Entries */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow border border-white/50 p-12 text-center">
            <p className="text-gray-500">No entries yet — start journaling today ✨</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((e) => {
                const config = moodConfig[e.mood];
                const Icon = config.icon;
                return (
                  <div
                    key={e.entry_id}
                    className="group bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleViewEntry(e)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate text-sm">{e.title || "Untitled"}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(e.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className={`${config.color} rounded-lg px-2 py-1 flex items-center gap-1`}>
                        <Icon size={12} />
                        <span className="text-xs">{config.emoji}</span>
                      </div>
                    </div>
                    <div 
                      className="text-xs text-gray-600 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: e.content }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handlePrevPage}
                disabled={page === 0}
                className={`px-4 py-2 rounded-lg border ${page === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={entries.length < PAGE_SIZE}
                className={`px-4 py-2 rounded-lg border ${entries.length < PAGE_SIZE ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-40"
        >
          <Plus size={24} />
        </button>

        {/* View Entry Modal */}
        {viewModal && viewEntry && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 relative">
              <h2 className="text-xl font-semibold text-center mb-2">
                {viewEntry.title || "Untitled"}
              </h2>
              <div className="text-xs text-gray-500 text-center mb-2">
                {new Date(viewEntry.entry_date).toLocaleString()} · {viewEntry.mood} · {viewEntry.visibility}
              </div>
              <div
                  className="text-base text-gray-700"
                  dangerouslySetInnerHTML={{ __html: viewEntry.content }}
              />
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setViewModal(false)}
                  className="border px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleEditEntry(viewEntry)}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEntry(viewEntry.entry_id)}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal (same as Add, but prefilled and updates) */}
        {editModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 relative">
              <h2 className="text-xl font-semibold text-center mb-2">
                Edit Reflection
              </h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Write your thoughts... express your emotions 💭"
                className="h-48 mb-4"
              />
              <div className="flex gap-2">
                <div className="flex flex-col flex-1">
                  <label htmlFor="edit-mood-select" className="text-xs mb-1">Mood</label>
                  <select
                    id="edit-mood-select"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="border rounded-lg px-3 py-2 cursor-pointer bg-white"
                  >
                    <option value="neutral">😐 Neutral</option>
                    <option value="happy">😊 Happy</option>
                    <option value="sad">😢 Sad</option>
                    <option value="excited">🤩 Excited</option>
                    <option value="angry">😠 Angry</option>
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label htmlFor="edit-visibility-select" className="text-xs mb-1">Visibility</label>
                  <select
                    id="edit-visibility-select"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="border rounded-lg px-3 py-2 cursor-pointer bg-white"
                  >
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label htmlFor="edit-tags-input" className="text-xs mb-1">Tags</label>
                  <input
                    id="edit-tags-input"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags"
                    className="border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditModal(false);
                    setEditingId(null);
                    resetModal();
                  }}
                  className="border px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  {loading ? "Saving..." : "Update Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal (Add New) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-scaleIn relative">
              <h2 className="text-xl font-semibold text-center mb-2">
                Add Reflection
              </h2>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Write your thoughts... express your emotions 💭"
                className="h-48 mb-4"
              />
              <div className="flex gap-2">
                <div className="flex flex-col flex-1">
                  <label htmlFor="mood-select" className="text-xs mb-1">Mood</label>
                  <select
                    id="mood-select"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="border rounded-lg px-3 py-2 cursor-pointer bg-white"
                  >
                    <option value="neutral">😐 Neutral</option>
                    <option value="happy">😊 Happy</option>
                    <option value="sad">😢 Sad</option>
                    <option value="excited">🤩 Excited</option>
                    <option value="angry">😠 Angry</option>
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label htmlFor="visibility-select" className="text-xs mb-1">Visibility</label>
                  <select
                    id="visibility-select"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="border rounded-lg px-3 py-2 cursor-pointer bg-white"
                  >
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label htmlFor="tags-input" className="text-xs mb-1">Tags</label>
                  <input
                    id="tags-input"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags"
                    className="border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetModal();
                  }}
                  className="border px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  {loading ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/*
        Why does it take time to get data?

        1. Each diary entry is decrypted on the client using `decryptData(identity, ...)` for both title and content.
           - If you have 10 entries, that's 20 async decrypt operations per page.
           - Web Crypto API (used in decryptData) is async and can be slow for large/complex data.

        2. The backend returns encrypted blobs; the client must wait for all decryptions before rendering.
           - This is necessary for privacy, but adds latency.

        3. If your device/browser is slow, or entries are large, decryption is slower.

        4. If your backend is slow (large DB, network latency), the initial fetch is slower.

        **How to speed up:**
        - Decrypt only visible entries (e.g., for previews, decrypt only title, decrypt content on click/view).
        - Show a spinner/loading indicator while decrypting.
        - Paginate (already done: only 10 entries per page).
        - Optimize backend query (add indexes, avoid unnecessary joins).
        - Use Web Workers for decryption (offload from main UI thread).
        - Avoid double decryption (don’t decrypt same entry twice per render).

        If you want, I can update the code to:
        - Decrypt only title for list view, decrypt full content only when viewing an entry.
        - Add a loading spinner for decryption.
        - Profile and optimize the backend query.
        */}
      </div>
    </div>
  );
}