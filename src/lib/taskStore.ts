type Task = {
  id: string;
  description: string;
  status: 'pending' | 'completed';
  dueDate?: string;
  dueTime?: string;
};

// Используем globalThis для обеспечения глобального состояния в режиме разработки
declare global {
  var tasks: Task[];
}

if (!globalThis.tasks) {
  globalThis.tasks = [];
}

let tasks = globalThis.tasks;

export const getTasks = (status?: 'pending' | 'completed') => {
  if (status) {
    return tasks.filter(task => task.status === status);
  }
  return tasks;
};

export const createTask = (description: string, dueDate?: string, dueTime?: string): Task => {
  const newTask = {
    id: Date.now().toString(), // Простой ID на основе timestamp
    description,
    status: 'pending' as const,
    dueDate,
    dueTime,
  };
  tasks.push(newTask);
  return newTask;
};

export const completeTask = (description: string): Task | undefined => {
  const task = tasks.find(t => t.description.toLowerCase() === description.toLowerCase() && t.status === 'pending');
  if (task) {
    task.status = 'completed';
    return task;
  }
  return undefined;
};

export const updateTaskStatus = (id: string, status: 'pending' | 'completed'): Task | undefined => {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    return task;
  }
  return undefined;
};

export const renameTask = (id: string, newDescription: string): Task | undefined => {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.description = newDescription;
    return task;
  }
  return undefined;
};

export const deleteTask = (description: string): boolean => {
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.description.toLowerCase() !== description.toLowerCase());
  return tasks.length < initialLength;
};

export const clearTasks = () => {
  tasks = [];
};
