import React from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default React.memo(function TaskCard({
  task,
  category,
  priorityStyle,
  isExpanded,
  onToggleStatus,
  onExpand,
  onEdit,
  onDelete,
  subtasks = [],
  onToggleSubtask,
  onDeleteSubtask,
  subtaskInput,
  onSubtaskInputChange,
  onCreateSubtask,
}) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow border border-white/50 hover:shadow-xl transition-all">
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleStatus(task)} className="mt-1">
          {task?.status === "completed" ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : (
            <Circle className="text-gray-400" size={20} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={`font-semibold text-gray-800 ${
                task?.status === "completed" ? "line-through text-gray-500" : ""
              }`}
            >
              {task?.title}
            </h3>
            <span
              className={`${priorityStyle?.color} text-xs px-2 py-0.5 rounded-lg font-medium`}
            >
              {task.priority}
            </span>
            {category && (
              <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded-lg">
                <div
                  style={{ background: category.color, width: 12, height: 12 }}
                  className="rounded-full"
                />
                <span>{category.name}</span>
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}

          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <Calendar size={12} />
              <span>Due: {new Date(task.due_date).toLocaleString()}</span>
            </div>
          )}

          {isExpanded && (
            <div className="mt-3 space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Subtasks
              </p>
              {subtasks.map((s) => (
                <div
                  key={s.subtask_id}
                  className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={s.status === "completed"}
                      onChange={() => onToggleSubtask(s)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span
                      className={`text-sm ${
                        s.status === "completed"
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteSubtask(s.subtask_id, task.task_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  value={subtaskInput || ""}
                  onChange={(e) =>
                    onSubtaskInputChange(task.task_id, e.target.value)
                  }
                  placeholder="Add subtask..."
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  onClick={() => onCreateSubtask(task.task_id)}
                  className="bg-purple-600 text-white px-3 py-2 rounded-xl hover:bg-purple-700 text-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => onExpand(task.task_id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 hover:bg-yellow-100 rounded-lg transition text-yellow-600"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.task_id)}
            className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});
