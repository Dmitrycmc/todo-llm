import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createTask, completeTask, deleteTask, getTasks, renameTask } from '../../../lib/taskStore'; // Импортируем функции из taskStore

export async function POST(request: Request) {
  const { command } = await request.json();

  const { object: toolCall } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      action: z.discriminatedUnion('tool', [
        z.object({
          tool: z.literal('createTask'),
          description: z.string().describe('Описание задачи, например: "Купить молоко".'),
          dueDate: z.string().optional().describe('Дата выполнения задачи в формате YYYY-MM-DD.'),
          dueTime: z.string().optional().describe('Время выполнения задачи в формате HH:MM.'),
        }),
        z.object({
          tool: z.literal('completeTask'),
          description: z.string().describe('Описание задачи, которую нужно отметить как выполненную.'),
        }),
        z.object({
          tool: z.literal('deleteTask'),
          description: z.string().describe('Описание задачи, которую нужно удалить.'),
        }),
        z.object({
          tool: z.literal('listTasks'),
          status: z.enum(['pending', 'completed']).optional().describe('Статус задач для отображения: "pending" или "completed".'),
        }),
        z.object({
          tool: z.literal('renameTask'),
          description: z.string().describe('Текущее описание задачи для переименования.'),
          newDescription: z.string().describe('Новое описание задачи.'),
        }),
      ]),
    }),
    prompt: `Преобразуй следующую команду в вызов инструмента для To-Do приложения. Если дата или время не указаны, не включай их. Если невозможно определить намерение, верни ошибку. \n\nКоманда: ${command}`,
  });

  let result: any;

  switch (toolCall.action.tool) {
    case 'createTask':
      result = createTask(toolCall.action.description, toolCall.action.dueDate, toolCall.action.dueTime);
      return NextResponse.json({ action: 'createTask', status: 'success', data: result });
    case 'completeTask':
      result = completeTask(toolCall.action.description);
      if (result) {
        return NextResponse.json({ action: 'completeTask', status: 'success', data: result });
      } else {
        return NextResponse.json({ action: 'completeTask', status: 'failed', message: 'Задача не найдена или уже выполнена.' }, { status: 404 });
      }
    case 'deleteTask':
      const deleted = deleteTask(toolCall.action.description);
      if (deleted) {
        return NextResponse.json({ action: 'deleteTask', status: 'success', message: 'Задача удалена.' });
      } else {
        return NextResponse.json({ action: 'deleteTask', status: 'failed', message: 'Задача не найдена.' }, { status: 404 });
      }
    case 'listTasks':
      result = getTasks(toolCall.action.status);
      return NextResponse.json({ action: 'listTasks', status: 'success', data: result });
    case 'renameTask':
      // Для LLM-команды переименования, LLM будет предоставлять старое и новое описание.
      // Нужно найти задачу по старому описанию, получить ее ID, а затем переименовать по ID.
      const taskToRename = getTasks().find(t => t.description.toLowerCase() === toolCall.action.description.toLowerCase());
      if (taskToRename) {
        const renamed = renameTask(taskToRename.id, toolCall.action.newDescription);
        if (renamed) {
          return NextResponse.json({ action: 'renameTask', status: 'success', data: renamed, message: 'Задача переименована.' });
        } else {
          return NextResponse.json({ action: 'renameTask', status: 'failed', message: 'Не удалось переименовать задачу.' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ action: 'renameTask', status: 'failed', message: 'Задача для переименования не найдена.' }, { status: 404 });
      }
    default:
      return NextResponse.json({ action: 'unknown', status: 'failed', message: 'Неизвестное действие LLM.' }, { status: 400 });
  }
}
