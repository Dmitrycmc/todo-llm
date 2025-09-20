'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isLLMResponse?: boolean; // Флаг для LLM-ответов
}

interface ChatBotProps {
  onCommandExecuted?: () => void; // Callback для обновления задач после выполнения команды LLM
}

export default function ChatBot({ onCommandExecuted }: ChatBotProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Прокрутка до последнего сообщения
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString() + '-user', text: message, sender: 'user' };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: userMessage.text }),
      });
      const data = await res.json();

      let botResponseText = 'Произошла ошибка при обработке команды.';
      if (data && data.action) {
        switch (data.action) {
          case 'createTask':
            if (data.status === 'success') {
              botResponseText = `Задача \"${data.data.description}\" успешно создана.` +
                (data.data.dueDate ? ` на ${data.data.dueDate}` : '') +
                (data.data.dueTime ? ` в ${data.data.dueTime}` : '') + ` (id: ${data.data.id})`;
              onCommandExecuted?.();
            } else {
              botResponseText = `Не удалось создать задачу: ${data.message || 'Неизвестная ошибка.'}`; 
            }
            break;
          case 'completeTask':
            if (data.status === 'success') {
              botResponseText = `Задача \"${data.data.description}\" успешно отмечена как выполненная.`;
              onCommandExecuted?.();
            } else {
              botResponseText = `Не удалось отметить задачу как выполненную: ${data.message || 'Неизвестная ошибка.'}`; 
            }
            break;
          case 'deleteTask':
            if (data.status === 'success') {
              botResponseText = `Задача успешно удалена.`;
              onCommandExecuted?.();
            } else {
              botResponseText = `Не удалось удалить задачу: ${data.message || 'Неизвестная ошибка.'}`; 
            }
            break;
          case 'listTasks':
            if (data.status === 'success') {
              if (data.data && data.data.length > 0) {
                const taskList = data.data.map((task: any) => 
                  `  - ${task.description} (${task.status})` +
                  (task.dueDate ? ` на ${task.dueDate}` : '') +
                  (task.dueTime ? ` в ${task.dueTime}` : '')
                ).join('\n');
                botResponseText = `Список задач:\n${taskList}`; 
              } else {
                botResponseText = `Список задач пуст.` + (userMessage.text.includes("выполненные") ? " Выполненных задач нет." : "");
              }
            } else {
              botResponseText = `Не удалось получить список задач: ${data.message || 'Неизвестная ошибка.'}`; 
            }
            break;
          case 'renameTask':
            if (data.status === 'success') {
              botResponseText = `Задача \"${data.data.description}\" успешно переименована в \"${data.data.newDescription || data.data.description}\".`;
              onCommandExecuted?.();
            } else {
              botResponseText = `Не удалось переименовать задачу: ${data.message || 'Неизвестная ошибка.'}`; 
            }
            break;
          default:
            botResponseText = 'Бот предложил неизвестное действие.';
        }
      } else {
        botResponseText = 'Бот не смог определить действие из вашей команды.';
      }

      const botMessage: ChatMessage = { id: Date.now().toString() + '-bot', text: botResponseText, sender: 'bot', isLLMResponse: true };
      setChatHistory((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message to LLM:', error);
      const errorMessage: ChatMessage = { id: Date.now().toString() + '-error', text: 'Ошибка подключения к боту.', sender: 'bot' };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col h-[550px] z-50 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold">To-Do Бот</h2>
        {/* Optional: Add a close button or minimize button here */}
      </div>
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-xl shadow-md ${msg.sender === 'user'
                ? 'bg-blue-500 text-white'
                : msg.isLLMResponse ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-xl bg-gray-100 text-gray-800 shadow-md border border-gray-200">
              <p className="text-sm italic">Бот печатает...</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex bg-white">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900"
          placeholder="Спросите бота..."
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
          disabled={loading}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
