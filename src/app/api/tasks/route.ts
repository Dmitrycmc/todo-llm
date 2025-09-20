import { NextResponse } from 'next/server';
import { createTask, deleteTask, getTasks, completeTask, updateTaskStatus, renameTask } from '../../../lib/taskStore';

export async function GET() {
  const tasks = getTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const { description, dueDate, dueTime } = await request.json();
  if (!description) {
    return NextResponse.json({ message: 'Description is required' }, { status: 400 });
  }
  const newTask = createTask(description, dueDate, dueTime);
  return NextResponse.json(newTask, { status: 201 });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ message: 'Task ID is required' }, { status: 400 });
  }
  const tasksBeforeDelete = getTasks();
  // В in-memory хранилище deleteTask удаляет по описанию, но для классического API лучше по ID
  // Временно адаптируем: найдем описание по ID, затем удалим по описанию
  const taskToDelete = tasksBeforeDelete.find(task => task.id === id);
  if (taskToDelete) {
    const deleted = deleteTask(taskToDelete.description);
    if (deleted) {
      return NextResponse.json({ message: 'Task deleted successfully' });
    }
  }
  return NextResponse.json({ message: 'Task not found' }, { status: 404 });
}

// Также добавим PUT для обновления, например, статуса задачи
export async function PUT(request: Request) {
  const { id, status, newDescription } = await request.json(); // Добавляем newDescription

  if (!id) {
    return NextResponse.json({ message: 'ID is required' }, { status: 400 });
  }

  if (status) {
    // Логика обновления статуса (уже есть)
    if (status !== 'pending' && status !== 'completed') {
      return NextResponse.json({ message: 'Invalid status provided' }, { status: 400 });
    }
    const updatedTask = updateTaskStatus(id, status);
    if (updatedTask) {
      return NextResponse.json(updatedTask);
    }
  }

  if (newDescription) {
    // Логика переименования задачи
    const renamedTask = renameTask(id, newDescription);
    if (renamedTask) {
      return NextResponse.json(renamedTask);
    }
  }

  return NextResponse.json({ message: 'Task not found or no valid update provided' }, { status: 404 });
}
