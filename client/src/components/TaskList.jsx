import React from "react";
import { CheckCircle, Circle, Trash2 } from "lucide-react";
import SubtaskInput from "./SubTaskInput";

const TaskList = ({
  tasks = [],
  loading,
  handleUpdate,
  handleDelete,
  handleSubtaskToggle,
  handleSubtaskDelete,
  handleAddSubtask,
  onEditTask,
}) => {
  if (loading) return <p className="text-gray-500 italic">Loading tasks...</p>;

  if (tasks.length === 0)
    return (
      <p className="text-gray-500 italic text-center py-4">
        No tasks found. Try adding one!
      </p>
    );

  return (
    <ul className="divide-y divide-gray-200">
      {tasks.map((task) => {
        const isCompleted = task.status?.toLowerCase() === "completed";

        return (
          <li
            key={task.task_id}
            className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 my-2"
          >
            {/* ---- Task Header ---- */}
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <button onClick={() => handleUpdate(task)} className="mt-1">
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Circle size={20} className="text-gray-400" />
                  )}
                </button>

                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      isCompleted ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Priority: {task.priority} • Status:{" "}
                    <span
                      className={`font-medium ${
                        isCompleted ? "text-green-600" : "text-orange-500"
                      }`}
                    >
                      {task.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(task.task_id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 size={18} />
                </button>

                <button
                  onClick={() => onEditTask(task)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* ---- Subtasks ---- */}
            {task.subtasks?.length > 0 && (
              <ul className="ml-8 mt-3 border-l border-gray-200 pl-3 space-y-1">
                {task.subtasks.map((sub) => {
                  const subCompleted = sub.is_completed;
                  return (
                    <li
                      key={sub.subtask_id}
                      className="flex justify-between items-center group"
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() =>
                          handleSubtaskToggle(
                            task.task_id,
                            sub.subtask_id,
                            subCompleted
                          )
                        }
                      >
                        {subCompleted ? (
                          <CheckCircle
                            size={14}
                            className="text-green-600 flex-shrink-0"
                          />
                        ) : (
                          <Circle
                            size={14}
                            className="text-gray-400 flex-shrink-0"
                          />
                        )}
                        <span
                          className={`text-sm ${
                            subCompleted ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleSubtaskDelete(task.task_id, sub.subtask_id)
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                        title="Delete Subtask"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* ---- Add Subtask Input ---- */}
            <div className="ml-8">
              <SubtaskInput
                onAdd={(title) => handleAddSubtask(task.task_id, title)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TaskList;
