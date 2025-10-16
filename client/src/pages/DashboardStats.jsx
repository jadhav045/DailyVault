import React from "react";
import { CheckCircle2, Circle, Tag, TrendingUp, Calendar, ArrowRight, BarChart3 } from "lucide-react";

export default function DashboardStats({
    loading,
    stats,
    recent,
    completionRate,
    navigate
}) {
    return (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl">
                            <BarChart3 className="text-white" size={24} />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                            Total
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {loading ? "..." : stats.total}
                    </div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
                {/* Completed Tasks */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl">
                            <CheckCircle2 className="text-white" size={24} />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                            Done
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {loading ? "..." : stats.completed}
                    </div>
                    <p className="text-sm text-gray-600">Completed</p>
                </div>
                {/* Categories */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl">
                            <Tag className="text-white" size={24} />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-purple-50 px-3 py-1 rounded-full">
                            Groups
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {loading ? "..." : stats.categories}
                    </div>
                    <p className="text-sm text-gray-600">Categories</p>
                </div>
                {/* Completion Rate */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-2xl">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div className="text-xs font-semibold text-gray-500 bg-orange-50 px-3 py-1 rounded-full">
                            Rate
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {loading ? "..." : `${completionRate}%`}
                    </div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
            </div>

            {/* Progress Bar */}
            {stats.total > 0 && (
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Overall Progress</h3>
                        <span className="text-sm font-bold text-purple-600">{completionRate}%</span>
                    </div>
                    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${completionRate}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>{stats.completed} completed</span>
                        <span>{stats.total - stats.completed} remaining</span>
                    </div>
                </div>
            )}

            {/* Recent Tasks */}
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-purple-500" size={20} />
                        Recent Tasks
                    </h2>
                    <button
                        onClick={() => navigate("/app/tasks")}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                        View All
                        <ArrowRight size={14} />
                    </button>
                </div>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : recent.length === 0 ? (
                    <div className="text-center py-12">
                        <Circle className="mx-auto mb-3 text-gray-300" size={48} />
                        <p className="text-gray-500">No tasks yet</p>
                        <button
                            onClick={() => navigate("/app/tasks")}
                            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition text-sm font-medium"
                        >
                            Create Your First Task
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recent.map((r) => (
                            <div
                                key={r.task_id}
                                className="group bg-white/50 hover:bg-white/80 backdrop-blur rounded-2xl p-4 border border-white/50 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => navigate("/app/tasks")}
                            >
                                <div className="flex items-center gap-3">
                                    {r.status === "Completed" ? (
                                        <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                                    ) : (
                                        <Circle className="text-gray-400 flex-shrink-0" size={20} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-medium text-gray-800 truncate ${r.status === "Completed" ? "line-through text-gray-500" : ""}`}>
                                            {r.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar size={12} />
                                                <span>
                                                    {r.due_date ? new Date(r.due_date).toLocaleDateString() : "No due date"}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                r.status === "Completed" 
                                                    ? "bg-green-100 text-green-700" 
                                                    : "bg-orange-100 text-orange-700"
                                            }`}>
                                                {r.status}
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0" size={18} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
