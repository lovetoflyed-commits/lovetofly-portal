'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

const VIEW_OPTIONS = ['list', 'day', 'week', 'month', 'year'] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number];

type AdminTaskItem = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  progress_percent: number;
  checklist_total: number;
  checklist_done: number;
  checklist_items: Array<{ id: number; label: string; is_done: boolean }>;
};

const truncateText = (value: string, maxLength: number) => {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
};

const priorityClass = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700';
    case 'high':
      return 'bg-amber-100 text-amber-700';
    case 'normal':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

export default function AdminTasksPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<AdminTaskItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [focusDate, setFocusDate] = useState<Date>(new Date());
  const [activeTask, setActiveTask] = useState<AdminTaskItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'staff' && user.email !== 'lovetofly.ed@gmail.com') {
      router.push('/');
    }
  }, [user, router]);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/tasks?scope=assigned', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const updateTaskStatusById = async (taskId: number, status: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId, status }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const toggleChecklistItem = async (taskId: number, itemId: number, isDone: boolean) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/tasks/checklist', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, isDone }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  };

  const tasksWithDueDate = useMemo(
    () => tasks.filter((task) => task.due_date).map((task) => ({
      ...task,
      dueDate: task.due_date ? new Date(task.due_date) : null,
    })),
    [tasks]
  );

  const tasksWithoutDueDate = useMemo(
    () => tasks.filter((task) => !task.due_date),
    [tasks]
  );

  const dayTasks = tasksWithDueDate.filter((task) => task.dueDate && isSameDay(task.dueDate, focusDate));

  const weekDays = useMemo(() => {
    const start = startOfWeek(focusDate, { weekStartsOn: 1 });
    const end = endOfWeek(focusDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [focusDate]);

  const yearMonths = useMemo(() => {
    const start = startOfYear(focusDate);
    return Array.from({ length: 12 }).map((_, index) => addMonths(start, index));
  }, [focusDate]);

  const tasksByDate = (date: Date) =>
    tasksWithDueDate.filter((task) => task.dueDate && isSameDay(task.dueDate, date));

  const shiftFocusDate = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1;
    if (viewMode === 'day') setFocusDate(addDays(focusDate, delta));
    if (viewMode === 'week') setFocusDate(addWeeks(focusDate, delta));
    if (viewMode === 'month') setFocusDate(addMonths(focusDate, delta));
    if (viewMode === 'year') setFocusDate(addYears(focusDate, delta));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-900">Agenda de Tarefas</h1>
            <p className="text-sm text-slate-600 mt-1">Visualização por lista e calendário (diário, semanal, mensal, anual).</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
              ← Voltar ao Painel
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setViewMode(option)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold ${viewMode === option ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {option === 'list' && 'Lista'}
              {option === 'day' && 'Diário'}
              {option === 'week' && 'Semanal'}
              {option === 'month' && 'Mensal'}
              {option === 'year' && 'Anual'}
            </button>
          ))}
          {viewMode !== 'list' && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => shiftFocusDate('prev')}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white"
              >
                ←
              </button>
              <span className="font-semibold">{format(focusDate, viewMode === 'year' ? 'yyyy' : 'MMMM yyyy')}</span>
              <button
                type="button"
                onClick={() => shiftFocusDate('next')}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white"
              >
                →
              </button>
            </div>
          )}
        </div>

        {viewMode === 'list' && (
          <div className="mt-6 space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma tarefa atribuída.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveTask(task);
                      setShowModal(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setActiveTask(task);
                        setShowModal(true);
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.due_date && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{truncateText(task.description, 160)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateTaskStatusById(task.id, 'done');
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'day' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">{format(focusDate, 'PPP')}</h2>
            <div className="mt-4 space-y-3">
              {dayTasks.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma tarefa para este dia.</p>
              ) : (
                dayTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{truncateText(task.description, 120)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateTaskStatusById(task.id, 'done')}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{format(day, 'EEE dd')}</p>
                <div className="mt-2 space-y-2">
                  {tasksByDate(day).length === 0 ? (
                    <p className="text-xs text-slate-400">Sem tarefas</p>
                  ) : (
                    tasksByDate(day).map((task) => (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setActiveTask(task);
                          setShowModal(true);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            setActiveTask(task);
                            setShowModal(true);
                          }
                        }}
                        className="rounded-lg bg-slate-50 px-2 py-2 text-xs cursor-pointer hover:bg-blue-50"
                      >
                        <p className="font-semibold text-slate-700">{truncateText(task.title, 40)}</p>
                        <p className="text-[10px] text-slate-500">{task.status.replace('_', ' ')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'month' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-7 gap-2 text-xs text-slate-500 mb-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((label) => (
                <div key={label} className="text-center font-semibold">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day) => {
                const dayTasksList = tasksByDate(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[110px] rounded-lg border border-slate-100 p-2 ${
                      isSameMonth(day, focusDate) ? 'bg-white' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500">{format(day, 'dd')}</p>
                    <div className="mt-1 space-y-1">
                      {dayTasksList.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setActiveTask(task);
                            setShowModal(true);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setActiveTask(task);
                              setShowModal(true);
                            }
                          }}
                          className="rounded bg-blue-50 px-1 py-1 text-[10px] text-blue-700 cursor-pointer"
                        >
                          {truncateText(task.title, 22)}
                        </div>
                      ))}
                      {dayTasksList.length > 3 && (
                        <p className="text-[10px] text-slate-400">+{dayTasksList.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'year' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {yearMonths.map((monthDate) => {
              const monthTasks = tasksWithDueDate.filter((task) => task.dueDate && isSameMonth(task.dueDate, monthDate));
              return (
                <div key={monthDate.toISOString()} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{format(monthDate, 'MMMM')}</p>
                    <span className="text-xs text-slate-500">{monthTasks.length} tarefas</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {monthTasks.length === 0 ? (
                      <p className="text-xs text-slate-400">Sem tarefas</p>
                    ) : (
                      monthTasks.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setActiveTask(task);
                            setShowModal(true);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              setActiveTask(task);
                              setShowModal(true);
                            }
                          }}
                          className="rounded-lg bg-slate-50 px-2 py-2 text-xs cursor-pointer hover:bg-blue-50"
                        >
                          <p className="font-semibold text-slate-700">{truncateText(task.title, 40)}</p>
                          <p className="text-[10px] text-slate-500">{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : ''}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tasksWithoutDueDate.length > 0 && viewMode !== 'year' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Tarefas sem prazo definido</h2>
            <div className="mt-3 space-y-2">
              {tasksWithoutDueDate.map((task) => (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTask(task);
                    setShowModal(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setActiveTask(task);
                      setShowModal(true);
                    }
                  }}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                >
                  <p className="font-semibold text-slate-800">{task.title}</p>
                  <p className="text-xs text-slate-500">{truncateText(task.description, 120)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Detalhes da tarefa</h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setActiveTask(null);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-base font-semibold text-slate-900">{activeTask.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500">
                    Status: {activeTask.status.replace('_', ' ')}
                  </span>
                  <span className={`rounded-full px-2 py-1 font-semibold ${priorityClass(activeTask.priority)}`}>
                    Prioridade: {activeTask.priority}
                  </span>
                  {activeTask.due_date && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                      Prazo: {new Date(activeTask.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                    Progresso: {activeTask.progress_percent}%
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{activeTask.description}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Checklist</p>
                {activeTask.checklist_items.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Sem etapas cadastradas.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {activeTask.checklist_items.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={item.is_done}
                          onChange={(event) => toggleChecklistItem(activeTask.id, item.id, event.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className={item.is_done ? 'line-through text-slate-400' : ''}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              {activeTask.status !== 'done' && (
                <button
                  type="button"
                  onClick={() => updateTaskStatusById(activeTask.id, 'done')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Marcar concluída
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
