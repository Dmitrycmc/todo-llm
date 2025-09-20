'use client';

import { useState, useEffect } from 'react';
import ChatBot from '../components/ChatBot'; // Импортируем новый компонент ChatBot

export default function Home() {
  const [classicTaskDescription, setClassicTaskDescription] = useState('');
  const [classicLoading, setClassicLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskDescription, setEditingTaskDescription] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { method: 'GET' });
      const data = await res.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClassicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classicTaskDescription.trim()) return;
    setClassicLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: classicTaskDescription }),
      });
      setClassicTaskDescription('');
      fetchTasks();
    } catch (error) {
      console.error('Error creating classic task:', error);
    } finally {
      setClassicLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    setClassicLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setClassicLoading(false);
    }
  };

  const handleToggleCompletion = async (id: string, newStatus: string) => {
    if (!confirm(`Вы уверены, что хотите изменить статус задачи на "${newStatus}"?`)) return;
    setClassicLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    } finally {
      setClassicLoading(false);
    }
  };

  const handleStartEdit = (task: any) => {
    setEditingTaskId(task.id);
    setEditingTaskDescription(task.description);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskDescription('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingTaskDescription.trim()) return;
    setClassicLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, newDescription: editingTaskDescription }),
      });
      setEditingTaskId(null);
      setEditingTaskDescription('');
      fetchTasks();
    } catch (error) {
      console.error('Error renaming task:', error);
    } finally {
      setClassicLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 text-gray-900">
      <div className="max-w-xl w-full space-y-8">
        <h1 className="text-5xl font-extrabold text-center text-blue-700 mb-12">To-Do LLM App</h1>
      
        {/* Task List Section */}
        <section className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Ваши задачи</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Список задач пуст. Добавьте новые задачи!</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md">
                  {
                    editingTaskId === task.id ? (
                      <div className="flex items-center flex-grow space-x-2">
                        <input
                          type="text"
                          value={editingTaskDescription}
                          onChange={(e) => setEditingTaskDescription(e.target.value)}
                          className="flex-grow border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          disabled={classicLoading}
                        />
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 disabled:opacity-50"
                          disabled={classicLoading}
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 disabled:opacity-50"
                          disabled={classicLoading}
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <span className={`flex-1 text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => handleToggleCompletion(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                          className="mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={classicLoading}
                        />
                        {task.description}
                        {task.dueDate && <span className="text-sm text-gray-500 ml-2">({task.dueDate}{task.dueTime && ` в ${task.dueTime}`})</span>}
                        {task.status === 'completed' && <span className="text-sm text-green-600 ml-2 font-semibold"> [Выполнено]</span>}
                      </span>
                    )
                  }
                  {
                    editingTaskId !== task.id && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:shadow-outline disabled:opacity-50"
                          disabled={classicLoading}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:shadow-outline disabled:opacity-50"
                          disabled={classicLoading}
                        >
                          Удалить
                        </button>
                      </div>
                    )
                  }
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Classic Task Creation Section */}
        <section className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Добавить задачу</h2>
          <form onSubmit={handleClassicSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={classicTaskDescription}
              onChange={(e) => setClassicTaskDescription(e.target.value)}
              className="flex-grow border border-gray-300 rounded-md py-3 px-4 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="Например: Купить продукты"
              disabled={classicLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50"
              disabled={classicLoading}
            >
              {classicLoading ? 'Добавление...' : 'Добавить задачу'}
            </button>
          </form>
        </section>

        {/* LLM Result Display (moved to ChatBot) */}

        {/* Raw API Response (moved to ChatBot) */}

      </div>
      {/* ChatBot component for LLM interaction */}
      <ChatBot onCommandExecuted={fetchTasks} />

    </main>
  );
}
