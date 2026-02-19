'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type ModuleCard = {
  key: string;
  title: string;
  icon: string;
  href: string;
  priority: 'high' | 'normal' | 'low';
  metrics: { label: string; value: number | string }[];
  alert?: string;
  note?: string;
  items?: { label: string; href: string }[];
};

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string | null;
  action_label?: string | null;
  metadata?: any;
  is_read: boolean;
  created_at: string;
};

type StaffOption = {
  id: number;
  name: string;
  email: string;
  role?: string | null;
};

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

type TaskStats = {
  total: number;
  open: number;
  in_progress: number;
  review: number;
  blocked: number;
  postponed: number;
  done: number;
  due_soon: number;
  overdue: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showInbox, setShowInbox] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastCount, setToastCount] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showTaskPreviewModal, setShowTaskPreviewModal] = useState(false);
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [activeTask, setActiveTask] = useState<AdminTaskItem | null>(null);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<number[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [tasks, setTasks] = useState<AdminTaskItem[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    review: 0,
    blocked: 0,
    postponed: 0,
    done: 0,
    due_soon: 0,
    overdue: 0,
  });
  const [messageForm, setMessageForm] = useState({
    subject: '',
    body: '',
    priority: 'normal' as NotificationItem['priority'],
    targetType: 'all',
    targetRole: 'staff',
    targetEmail: '',
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as NotificationItem['priority'],
    status: 'open',
    dueDate: '',
    targetType: 'all',
    targetRole: 'staff',
    targetEmail: '',
    checklistText: '',
  });

  const recomputeTaskStats = (nextTasks: AdminTaskItem[]) => {
    const now = new Date();
    const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return {
      total: nextTasks.length,
      open: nextTasks.filter((t) => t.status === 'open').length,
      in_progress: nextTasks.filter((t) => t.status === 'in_progress').length,
      review: nextTasks.filter((t) => t.status === 'review').length,
      blocked: nextTasks.filter((t) => t.status === 'blocked').length,
      postponed: nextTasks.filter((t) => t.status === 'postponed').length,
      done: nextTasks.filter((t) => t.status === 'done').length,
      due_soon: nextTasks.filter((t) => t.due_date && new Date(t.due_date) <= soon && t.status !== 'done').length,
      overdue: nextTasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length,
    };
  };

  const truncateText = (value: string, maxLength: number) => {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trimEnd()}…`;
  };

  const messageNotifications = notifications.filter((item) => item.type !== 'staff_task');
  const taskNotifications = notifications.filter((item) => item.type === 'staff_task');
  const unreadMessages = messageNotifications.filter((item) => !item.is_read).length;
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    pendingListings: 0,
    totalHangars: 0,
    activeBookings: 0,
    bookingsToday: 0,
    totalUsers: 0,
    newUsersToday: 0,
    totalRevenue: 0,
    pendingTraslados: 0,
    pendingTrasladosPilots: 0,
    moderationOpen: 0,
    moderationEscalations: 0,
    pendingInvoices: 0,
    compliancePending: 0,
    complianceAudits: 0,
    marketingActive: 0,
    marketingTotal: 0,
    marketingLeads: 0,
    marketingLeadsToday: 0,
    totalVisits: 0,
    visitsToday: 0,
    totalMessages: 0,
    unreadMessages: 0,
    pendingReports: 0,
    messagesToday: 0,
    inviteCodesGenerated: 0,
    promoCodesGenerated: 0,
    pixPendingPayments: 0,
    pixCompletedToday: 0,
    pixRevenueToday: '0.00'
  });

  useEffect(() => {
    // Require authentication first; non-authenticated users go to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Authenticated but without admin/staff privileges: send to landing
    if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'staff' && user.email !== 'lovetofly.ed@gmail.com') {
      router.push('/');
      return;
    }

    const fetchStats = () => {
      if (!token) {
        console.log('[Admin Stats] No token available yet');
        return;
      }

      // Fetch main stats
      const mainStatsPromise = fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            console.error('[Admin Stats] API returned status:', res.status);
            return null;
          }
          return res.json();
        })
        .catch((err) => {
          console.error('[Admin Stats] Failed to fetch:', err);
          return null;
        });

      // Fetch PIX stats
      const pixStatsPromise = fetch('/api/admin/pix/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            console.error('[PIX Stats] API returned status:', res.status);
            return null;
          }
          return res.json();
        })
        .catch((err) => {
          console.error('[PIX Stats] Failed to fetch:', err);
          return null;
        });

      // Merge results
      Promise.all([mainStatsPromise, pixStatsPromise]).then(([mainData, pixData]) => {
        if (mainData) {
          const mergedStats = {
            ...mainData,
            pixPendingPayments: pixData?.stats?.pendingPayments ?? 0,
            pixCompletedToday: pixData?.stats?.completedToday ?? 0,
            pixRevenueToday: pixData?.stats?.revenueToday ?? '0.00'
          };
          console.log('[Admin Stats] Merged stats:', mergedStats);
          setStats(mergedStats);
        }
      });
    };

    // Initial fetch when token is available
    if (token) {
      fetchStats();
    }

    return () => { };
  }, [user, token, router]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;

    const fetchNotifications = async (previousUnread?: number) => {
      try {
        const res = await fetch('/api/notifications/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const unread = Number(data.unread_count || 0);
        setNotifications(data.notifications || []);
        setUnreadCount(unread);

        if (typeof previousUnread === 'number' && unread > previousUnread) {
          setToastCount(unread - previousUnread);
          setToastOpen(true);
          window.setTimeout(() => setToastOpen(false), 5000);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    pollTimer = setInterval(() => {
      fetchNotifications(unreadCount);
    }, 30000);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [token, unreadCount]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;

    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/admin/tasks?scope=assigned', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setTaskStats(data.stats || taskStats);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };

    fetchTasks();
    pollTimer = setInterval(fetchTasks, 30000);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [token]);

  useEffect(() => {
    if (!activeTask) return;
    const updatedTask = tasks.find((task) => task.id === activeTask.id);
    if (updatedTask && updatedTask !== activeTask) {
      setActiveTask(updatedTask);
    }
  }, [tasks, activeTask]);

  const fetchTasksList = async () => {
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
      setTaskStats(data.stats || taskStats);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  useEffect(() => {
    const shouldLoadStaff = showMessageModal || showTaskModal;
    if (!shouldLoadStaff || staffOptions.length > 0) return;

    const fetchStaff = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) return;
        const data = await res.json();
        const raw = Array.isArray(data.users) ? data.users : [];
        const staffRoles = new Set([
          'admin',
          'staff',
          'master',
          'super_admin',
          'moderator',
          'operations_lead',
          'support_lead',
          'content_manager',
          'business_manager',
          'finance_manager',
          'marketing',
          'compliance',
        ]);
        const mapped = raw
          .filter((user: StaffOption) => staffRoles.has(String(user.role || '').toLowerCase()))
          .map((user: any) => ({
            id: user.id,
            name: user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
            email: user.email,
            role: user.role,
          }));
        setStaffOptions(mapped);
      } catch (error) {
        console.error('Failed to fetch staff list:', error);
      }
    };

    fetchStaff();
  }, [showMessageModal, showTaskModal, staffOptions.length]);

  const handleNotificationAction = async (notificationId: number, action: 'read' | 'dismiss') => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_id: notificationId, action }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, is_read: action === 'read' ? true : item.is_read }
              : item
          )
        );
        if (action === 'dismiss') {
          setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
        }
        if (action === 'read') {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }
      }
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const toggleNotificationSelection = (notificationId: number) => {
    setSelectedNotificationIds((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId]
    );
  };

  const toggleAllMessageSelections = (checked: boolean) => {
    if (checked) {
      setSelectedNotificationIds(messageNotifications.map((item) => item.id));
    } else {
      setSelectedNotificationIds([]);
    }
  };

  const bulkUpdateMessages = async (action: 'read' | 'dismiss') => {
    if (selectedNotificationIds.length === 0) return;
    await Promise.all(selectedNotificationIds.map((id) => handleNotificationAction(id, action)));
    setSelectedNotificationIds([]);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/admin/team-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: messageForm.subject,
          message: messageForm.body,
          priority: messageForm.priority,
          targetType: messageForm.targetType,
          targetRole: messageForm.targetRole,
          targetEmail: messageForm.targetEmail,
        }),
      });
      if (res.ok) {
        setMessageForm({
          subject: '',
          body: '',
          priority: 'normal',
          targetType: 'all',
          targetRole: 'staff',
          targetEmail: '',
        });
        setShowMessageModal(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const saveTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSavingTask(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          status: taskForm.status,
          dueDate: taskForm.dueDate || null,
          targetType: taskForm.targetType,
          targetRole: taskForm.targetRole,
          targetEmail: taskForm.targetEmail,
          checklistItems: taskForm.checklistText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setTaskForm({
          title: '',
          description: '',
          priority: 'normal',
          status: 'open',
          dueDate: '',
          targetType: 'all',
          targetRole: 'staff',
          targetEmail: '',
          checklistText: '',
        });
        setShowTaskModal(false);
        fetchTasksList();
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao criar tarefa');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Erro ao criar tarefa');
    } finally {
      setSavingTask(false);
    }
  };

  const updateTaskStatus = async (notificationId: number, status: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId, status }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, metadata: { ...item.metadata, taskStatus: status } }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

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
        setTasks((prev) => {
          const nextTasks = prev.map((task) =>
            task.id === taskId ? { ...task, status } : task
          );
          setTaskStats(recomputeTaskStats(nextTasks));
          return nextTasks;
        });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
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
        setTasks((prev) => {
          const nextTasks = prev.map((task) => {
            if (task.id !== taskId) return task;
            const checklistItems = task.checklist_items.map((item) =>
              item.id === itemId ? { ...item, is_done: isDone } : item
            );
            const doneCount = checklistItems.filter((item) => item.is_done).length;
            const totalCount = checklistItems.length;
            const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : task.progress_percent;
            return {
              ...task,
              checklist_items: checklistItems,
              checklist_done: doneCount,
              checklist_total: totalCount,
              progress_percent: progress,
            };
          });
          setTaskStats(recomputeTaskStats(nextTasks));
          return nextTasks;
        });
      }
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  const modules: ModuleCard[] = [
    {
      key: 'hangarshare',
      title: 'HangarShare',
      icon: '🛫',
      href: '/admin/hangarshare',
      priority: 'high',
      metrics: [
        { label: 'Solicitações Pendentes', value: stats.pendingVerifications },
        { label: 'Hangares Pendentes', value: stats.pendingListings }
      ],
      alert: stats.pendingVerifications > 0 ? 'Novos documentos aguardam revisão.' : 'Nenhuma solicitação pendente.',
      note: 'Mantenha aprovações em dia para ativar anúncios.',
      items: [
        { label: 'HangarShare V1', href: '/admin/hangarshare' },
      ]
    },
    {
      key: 'bookings',
      title: 'Reservas',
      icon: '📅',
      href: '/admin/bookings',
      priority: 'high',
      metrics: [
        { label: 'Ativas', value: stats.activeBookings },
        { label: 'Hoje', value: stats.bookingsToday }
      ],
      alert: 'Atenção a conflitos ou SLAs nas reservas ativas.',
      note: 'Mantenha a agenda atualizada.',
      items: [
        { label: 'Visão Geral', href: '/admin/bookings' }
      ]
    },
    {
      key: 'listings',
      title: 'Anúncios',
      icon: '🏠',
      href: '/admin/listings',
      priority: 'normal',
      metrics: [
        { label: 'Pendentes', value: stats.pendingListings },
        { label: 'Total', value: stats.totalHangars }
      ],
      alert: 'Monitore anúncios pendentes para ativação.',
      note: 'Mantenha atualizações de status consistentes.',
      items: [
        { label: 'Todos os Anúncios', href: '/admin/listings' },
        { label: 'Aguardando Aprovação', href: '/admin/listings?status=pending' },
        { label: 'Rejeitados', href: '/admin/listings?status=rejected' }
      ]
    },
    {
      key: 'users',
      title: 'Usuários',
      icon: '👥',
      href: '/admin/users',
      priority: 'normal',
      metrics: [
        { label: 'Total de Usuários', value: stats.totalUsers },
        { label: 'Novos Hoje', value: stats.newUsersToday }
      ],
      alert: stats.newUsersToday > 0 ? `${stats.newUsersToday} novos usuários hoje!` : 'Monitore crescimento de usuários.',
      note: 'Dados atualizados em tempo real.',
      items: [
        { label: 'Diretório', href: '/admin/users' }
      ]
    },
    {
      key: 'moderation',
      title: 'Moderação',
      icon: '🛡️',
      href: '/admin/moderation',
      priority: 'normal',
      metrics: [
        { label: 'Casos Abertos', value: stats.moderationOpen },
        { label: 'Escalações', value: stats.moderationEscalations }
      ],
      alert: 'Revise novos relatórios com agilidade.',
      note: 'Mantenha o tratamento de violações consistente.',
      items: [
        { label: 'Fila', href: '/admin/moderation' }
      ]
    },
    {
      key: 'communications',
      title: 'Comunicações',
      icon: '💬',
      href: '/admin/communications',
      priority: 'high',
      metrics: [
        { label: 'Não Lidas', value: stats.unreadMessages },
        { label: 'Denúncias Pendentes', value: stats.pendingReports }
      ],
      alert: stats.pendingReports > 0 ? `${stats.pendingReports} denúncias aguardam análise.` : 'Sistema de mensagens operacional.',
      note: 'Dashboard completo: envio, broadcast, relatórios e estatísticas.',
      items: [
        { label: 'Dashboard', href: '/admin/communications' },
        { label: 'Caixa de Entrada', href: '/admin/communications?tab=inbox' },
        { label: 'Enviar Mensagem', href: '/admin/communications?tab=send' },
        { label: 'Broadcast', href: '/admin/communications?tab=broadcast' },
        { label: 'Denúncias', href: '/admin/communications?tab=reports' },
        { label: 'Estatísticas', href: '/admin/communications?tab=stats' }
      ]
    },
    {
      key: 'pix',
      title: 'PIX',
      icon: '💳',
      href: '/admin/pix',
      priority: 'high',
      metrics: [
        { label: 'Pagamentos Pendentes', value: stats.pixPendingPayments },
        { label: 'Concluídos Hoje', value: stats.pixCompletedToday },
        { label: 'Receita Hoje', value: `R$ ${Number(stats.pixRevenueToday).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
      ],
      alert: 'Gerencie chaves PIX e monitore pagamentos em tempo real.',
      note: 'Pagamentos instantâneos via Banco Central do Brasil com webhook automático.',
      items: [
        { label: 'Painel PIX Completo', href: '/admin/pix' },
        { label: 'Gerenciador de Chaves', href: '/admin/pix?tab=keys' }
      ]
    },
    {
      key: 'finance',
      title: 'Finanças',
      icon: '💰',
      href: '/admin/finance',
      priority: 'low',
      metrics: [
        { label: 'Receita Total', value: `R$ ${(stats.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { label: 'Faturas Pendentes', value: stats.pendingInvoices }
      ],
      alert: (stats.totalRevenue ?? 0) > 0 ? `Receita acumulada: R$ ${(stats.totalRevenue ?? 0).toLocaleString('pt-BR')}` : 'Revise o cronograma de pagamentos.',
      note: 'Garança conciliação sempre atualizada.',
      items: [
        { label: 'Visão Geral', href: '/admin/finance' }
      ]
    },
    {
      key: 'compliance',
      title: 'Conformidade',
      icon: '⚖️',
      href: '/admin/compliance',
      priority: 'low',
      metrics: [
        { label: 'Pendências', value: stats.compliancePending },
        { label: 'Auditorias', value: stats.complianceAudits }
      ],
      alert: 'Acompanhe documentos com vencimento próximo.',
      note: 'Mantenha registros auditáveis.',
      items: [
        { label: 'KYC/KYB', href: '/admin/compliance' }
      ]
    },
    {
      key: 'marketing',
      title: 'Marketing',
      icon: '📣',
      href: '/admin/marketing',
      priority: 'low',
      metrics: [
        { label: 'Campanhas Ativas', value: stats.marketingActive },
        { label: 'Leads Hoje', value: stats.marketingLeadsToday }
      ],
      alert: 'Destaque o desempenho das campanhas ativas.',
      note: 'Alinhe promoções com capacidade.',
      items: [
        { label: 'Campanhas', href: '/admin/marketing' }
      ]
    },
    {
      key: 'codes',
      title: 'Codes',
      icon: '🎟️',
      href: '/admin/codes',
      priority: 'normal',
      metrics: [
        { label: 'Invites', value: stats.inviteCodesGenerated },
        { label: 'Promos', value: stats.promoCodesGenerated }
      ],
      alert: 'Manage invitation and promotional codes.',
      note: 'Generate, monitor, and revoke access codes.',
      items: [
        { label: 'Generator', href: '/admin/codes' }
      ]
    },
    {
      key: 'traslados',
      title: 'Traslados',
      icon: '🧭',
      href: '/admin/traslados',
      priority: 'high',
      metrics: [
        { label: 'Solicitações', value: stats.pendingTraslados },
        { label: 'Pilotos pendentes', value: stats.pendingTrasladosPilots }
      ],
      alert: stats.pendingTraslados > 0 ? 'Há solicitações novas aguardando análise.' : 'Nenhuma solicitação nova.',
      note: 'Acompanhe SLAs e distribuição de pilotos.',
      items: [
        { label: 'Solicitações', href: '/admin/traslados' },
        { label: 'Pilotos', href: '/admin/traslados/pilots' }
      ]
    }
  ];

  const priorityLabel = (p: 'high' | 'normal' | 'low') => (p === 'high' ? 'Alta' : p === 'normal' ? 'Normal' : 'Baixa');

  // Color coding for metric values:
  // Yellow: Pending items awaiting action
  // Red: Late, overdue, urgent, escalations, disputes, errors
  // Green: Expected metrics, active positive numbers, KPIs
  // Blue: Regular standard data, totals, general info
  const getMetricColorClass = (label: string, value: number | string): string => {
    const labelLower = label.toLowerCase();
    const valueStr = String(value).toLowerCase();

    // Red: Late, overdue, urgent, escalations, disputes, errors, conflicts
    if (labelLower.includes('late') || labelLower.includes('overdue') ||
      labelLower.includes('urgent') || labelLower.includes('escalações') ||
      labelLower.includes('escalations') || labelLower.includes('disputa') ||
      labelLower.includes('disputes') || labelLower.includes('erros') ||
      labelLower.includes('errors') || labelLower.includes('conflito') ||
      labelLower.includes('conflicts')) {
      return 'text-red-600 font-black';
    }

    // Yellow: Pending, awaiting, queue items
    if (labelLower.includes('pendente') || labelLower.includes('pending') ||
      labelLower.includes('aguardando') || labelLower.includes('awaiting') ||
      labelLower.includes('solicitações') || labelLower.includes('casos abertos')) {
      return 'text-yellow-600 font-black';
    }

    // Green: Active, positive metrics, KPIs, availability
    if (labelLower.includes('ativa') || labelLower.includes('active') ||
      labelLower.includes('kpi') || labelLower.includes('disponibilidade') ||
      labelLower.includes('availability') || labelLower.includes('campanhas') ||
      labelLower.includes('campaigns') || labelLower.includes('leads')) {
      return 'text-green-600 font-black';
    }

    // Blue: Standard data, totals, general metrics
    return 'text-blue-600 font-bold';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-slate-200 min-h-screen px-4 py-6 gap-3 shadow-sm">
          <div className="px-2 pb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Módulos</p>
          </div>
          {modules.map((module) => (
            <div key={module.key} className="rounded-lg border border-slate-200 bg-white">
              <Link href={module.href} className="px-3 py-2 flex items-center justify-between text-slate-800 hover:bg-blue-50 hover:text-blue-800 rounded-t-lg transition">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-lg" aria-hidden>{module.icon}</span>
                  {module.title}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{priorityLabel(module.priority)}</span>
              </Link>
              {module.items && (
                <div className="px-2 py-2 border-t border-slate-100 space-y-1">
                  {module.items.map((item) => (
                    <Link
                      key={`${module.key}-${item.href}`}
                      href={item.href}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-600 rounded-md hover:bg-slate-50 hover:text-blue-700 transition"
                    >
                      <span className="text-[10px] text-slate-400" aria-hidden>•</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        <main className="flex-1 px-4 md:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-blue-900">Painel do Admin Master</h1>
              <p className="text-slate-600 mt-1 text-sm">Acesso completo; sinais críticos visíveis com navegação na barra lateral.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm text-slate-600">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
              >
                ← Voltar ao Portal
              </Link>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">Ao vivo</span>
              <span>Informações-chave fixas no topo.</span>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Alertas e Mensagens da Equipe</h2>
                  <p className="text-sm text-slate-600 mt-1">Notificações ativas para a equipe administrativa.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50"
                  >
                    Enviar mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                  >
                    Nova tarefa
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInbox((prev) => !prev)}
                    className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700"
                  >
                    Caixa de Entrada
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-blue-950 text-[10px] font-black">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500 font-semibold">Novas</p>
                  <p className="text-2xl text-blue-600 font-black">{unreadMessages}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500 font-semibold">Total visível</p>
                  <p className="text-2xl text-blue-600 font-black">{messageNotifications.length}</p>
                </div>
              </div>

              {showInbox && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Mensagens recentes</p>
                      <Link href="/admin/inbox" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                        Abrir inbox completo →
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        <input
                          type="checkbox"
                          checked={selectedNotificationIds.length > 0 && selectedNotificationIds.length === messageNotifications.length}
                          onChange={(event) => toggleAllMessageSelections(event.target.checked)}
                          className="h-4 w-4"
                        />
                        Selecionar tudo
                      </label>
                      <button
                        type="button"
                        onClick={() => bulkUpdateMessages('read')}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                      >
                        Marcar lidas
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkUpdateMessages('dismiss')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Remover
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInbox(false);
                          setSelectedNotificationIds([]);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {messageNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-600">Sem alertas no momento.</div>
                    ) : (
                      messageNotifications.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-3 hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <label className="pt-1">
                                <input
                                  type="checkbox"
                                  checked={selectedNotificationIds.includes(item.id)}
                                  onChange={() => toggleNotificationSelection(item.id)}
                                  className="h-4 w-4"
                                  title="Selecionar notificação"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveNotification(item);
                                  setShowNotificationModal(true);
                                }}
                                className="text-left flex-1"
                              >
                                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className={`rounded-full px-2 py-0.5 font-semibold ${item.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.is_read ? 'Lida' : 'Nova'}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                                    Prioridade: {item.priority}
                                  </span>
                                  {item.type === 'staff_task' && item.metadata?.taskStatus && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                                      Status: {item.metadata.taskStatus}
                                    </span>
                                  )}
                                  {item.type === 'staff_task' && item.metadata?.dueDate && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                      Prazo: {new Date(item.metadata.dueDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{truncateText(item.message, 140)}</p>
                              </button>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {!item.is_read && (
                                <button
                                  type="button"
                                  onClick={() => handleNotificationAction(item.id, 'read')}
                                  className="text-xs text-blue-700 font-semibold hover:text-blue-900"
                                >
                                  Marcar lida
                                </button>
                              )}
                              {item.type === 'staff_task' && item.metadata?.taskStatus !== 'done' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    item.metadata?.taskId
                                      ? updateTaskStatusById(Number(item.metadata.taskId), 'done')
                                      : updateTaskStatus(item.id, 'done');
                                  }}
                                  className="text-xs text-emerald-700 font-semibold hover:text-emerald-900"
                                >
                                  Marcar concluída
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleNotificationAction(item.id, 'dismiss')}
                                className="text-xs text-slate-500 hover:text-slate-700"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tarefas em andamento</h2>
                  <p className="text-sm text-slate-600 mt-1">Resumo por status e progresso por etapa.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  + Nova tarefa
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-600">Abertas: <b className="text-slate-900">{taskStats.open}</b></div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-600">Em andamento: <b className="text-slate-900">{taskStats.in_progress}</b></div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-600">Revisão: <b className="text-slate-900">{taskStats.review}</b></div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-600">Bloqueadas: <b className="text-slate-900">{taskStats.blocked}</b></div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-600">Adiadas: <b className="text-slate-900">{taskStats.postponed}</b></div>
                <div className="rounded-lg bg-slate-50 px-2 py-2 text-slate-600">Concluídas: <b className="text-slate-900">{taskStats.done}</b></div>
                <div className="rounded-lg bg-amber-50 px-2 py-2 text-amber-800">Prazo curto: <b>{taskStats.due_soon}</b></div>
                <div className="rounded-lg bg-red-50 px-2 py-2 text-red-700">Atrasadas: <b>{taskStats.overdue}</b></div>
              </div>

              <div className="mt-4 space-y-3">
                {tasks.filter((task) => task.status !== 'done').slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="w-full text-left rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm hover:border-blue-200 hover:bg-blue-50/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800">{task.title}</p>
                          <span className="text-[10px] uppercase tracking-wide text-slate-400">{task.status.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                            Prioridade: {task.priority}
                          </span>
                          {task.due_date && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                              Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{truncateText(task.description, 110)}</p>
                        <div className="mt-2">
                          <progress
                            value={task.progress_percent}
                            max={100}
                            className="w-full h-2 rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500"
                            aria-label={`Progresso da tarefa: ${task.progress_percent}%`}
                          />
                          <div className="mt-1 text-[11px] text-slate-500">Progresso: {task.progress_percent}%</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
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
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTask(task);
                            setShowTaskPreviewModal(true);
                          }}
                          className="text-xs text-blue-700 hover:text-blue-900"
                        >
                          Abrir detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {tasks.filter((task) => task.status !== 'done').length === 0 && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    Nenhuma tarefa pendente no momento.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowTaskListModal(true)}
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Ver todas as tarefas →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {modules
              .sort((a, b) => (a.priority === 'high' && b.priority !== 'high' ? -1 : 0))
              .map((module) => (
                <div key={module.key} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden>{module.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{module.title}</p>
                        <p className="text-xs text-slate-500">Prioridade: {priorityLabel(module.priority)}</p>
                      </div>
                    </div>
                    <Link href={module.href} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Abrir →</Link>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {module.metrics.map((metric) => (
                      <div key={`${module.key}-${metric.label}`} className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500 font-semibold">{metric.label}</p>
                        <p className={`text-2xl ${getMetricColorClass(metric.label, metric.value)}`}>
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-sm space-y-2">
                    {module.alert && (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <span aria-hidden>⚠️</span>
                        <p className="leading-snug">{module.alert}</p>
                      </div>
                    )}
                    {module.note && (
                      <div className="flex items-start gap-2 text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <span aria-hidden>🗒️</span>
                        <p className="leading-snug">{module.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {toastOpen && (
            <button
              type="button"
              onClick={() => setShowInbox(true)}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-blue-900 px-4 py-3 text-white shadow-lg hover:bg-blue-800"
            >
              <span className="text-sm font-semibold">Novos alertas</span>
              <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-amber-400 px-2 py-1 text-xs font-black text-blue-950">
                {toastCount}
              </span>
            </button>
          )}

          {showTaskListModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Todas as tarefas</h3>
                    <p className="text-xs text-slate-500">Total: {tasks.length} tarefas atribuídas</p>
                    <Link href="/admin/tasks" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                      Abrir agenda completa →
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTaskListModal(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Fechar
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma tarefa atribuída no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm hover:border-blue-200 hover:bg-blue-50/40 transition"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                                <span className="text-[10px] uppercase tracking-wide text-slate-400">{task.status.replace('_', ' ')}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">{truncateText(task.description, 160)}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                                  Prioridade: {task.priority}
                                </span>
                                {task.due_date && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                    Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                                  Progresso: {task.progress_percent}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTask(task);
                                  setShowTaskPreviewModal(true);
                                }}
                                className="text-xs text-blue-700 hover:text-blue-900"
                              >
                                Abrir detalhes
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTaskStatusById(task.id, 'done')}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                              >
                                Concluir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showNotificationModal && activeNotification && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">Detalhes da mensagem</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationModal(false);
                      setActiveNotification(null);
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Fechar
                  </button>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 font-semibold ${activeNotification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                      {activeNotification.is_read ? 'Lida' : 'Nova'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500">
                      Prioridade: {activeNotification.priority}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500">
                      {new Date(activeNotification.created_at).toLocaleString('pt-BR')}
                    </span>
                    {activeNotification.type === 'staff_task' && activeNotification.metadata?.taskStatus && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                        Status: {activeNotification.metadata.taskStatus}
                      </span>
                    )}
                    {activeNotification.type === 'staff_task' && activeNotification.metadata?.dueDate && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                        Prazo: {new Date(activeNotification.metadata.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{activeNotification.title}</p>
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{activeNotification.message}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                  {!activeNotification.is_read && (
                    <button
                      type="button"
                      onClick={() => {
                        handleNotificationAction(activeNotification.id, 'read');
                        setActiveNotification((prev) => (prev ? { ...prev, is_read: true } : prev));
                      }}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Marcar lida
                    </button>
                  )}
                  {activeNotification.type === 'staff_task' && activeNotification.metadata?.taskStatus !== 'done' && (
                    <button
                      type="button"
                      onClick={() =>
                        activeNotification.metadata?.taskId
                          ? updateTaskStatusById(Number(activeNotification.metadata.taskId), 'done')
                          : updateTaskStatus(activeNotification.id, 'done')
                      }
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Marcar concluída
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleNotificationAction(activeNotification.id, 'dismiss');
                      setShowNotificationModal(false);
                      setActiveNotification(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTaskPreviewModal && activeTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">Detalhes da tarefa</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskPreviewModal(false);
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
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500">
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
                              onChange={(event) => {
                                toggleChecklistItem(activeTask.id, item.id, event.target.checked);
                                fetchTasksList();
                              }}
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

          {showMessageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">Enviar mensagem para a equipe</h3>
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Fechar
                  </button>
                </div>
                <form onSubmit={sendMessage} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Assunto</label>
                    <input
                      value={messageForm.subject}
                      onChange={(event) => setMessageForm((prev) => ({ ...prev, subject: event.target.value }))}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Assunto da mensagem"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Mensagem</label>
                    <textarea
                      value={messageForm.body}
                      onChange={(event) => setMessageForm((prev) => ({ ...prev, body: event.target.value }))}
                      required
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Descreva o recado ou instrução"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Prioridade</label>
                      <select
                        value={messageForm.priority}
                        onChange={(event) => setMessageForm((prev) => ({ ...prev, priority: event.target.value as NotificationItem['priority'] }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Prioridade da mensagem"
                      >
                        <option value="low">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Destino</label>
                      <select
                        value={messageForm.targetType}
                        onChange={(event) => setMessageForm((prev) => ({ ...prev, targetType: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Destino da mensagem"
                      >
                        <option value="all">Toda a equipe</option>
                        <option value="role">Função específica</option>
                        <option value="email">Membro específico</option>
                      </select>
                    </div>
                  </div>
                  {messageForm.targetType === 'role' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Função</label>
                      <select
                        value={messageForm.targetRole}
                        onChange={(event) => setMessageForm((prev) => ({ ...prev, targetRole: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Função destino"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="master">Master</option>
                      </select>
                    </div>
                  )}
                  {messageForm.targetType === 'email' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Membro da equipe</label>
                        <select
                          value={messageForm.targetEmail}
                          onChange={(event) => setMessageForm((prev) => ({ ...prev, targetEmail: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          title="Membro da equipe"
                        >
                          <option value="">Selecione um membro</option>
                          {staffOptions.map((staff) => (
                            <option key={staff.id} value={staff.email}>
                              {staff.name || staff.email} ({String(staff.role || 'staff').toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Email manual (opcional)</label>
                        <input
                          type="email"
                          value={messageForm.targetEmail}
                          onChange={(event) => setMessageForm((prev) => ({ ...prev, targetEmail: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="ex: equipe@lovetofly.com.br"
                          title="Email manual"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                      {sendingMessage ? 'Enviando...' : 'Enviar mensagem'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showTaskModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-slate-900">Nova tarefa para a equipe</h3>
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Fechar
                  </button>
                </div>
                <form onSubmit={saveTask} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Título</label>
                    <input
                      value={taskForm.title}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Resumo da tarefa"
                      title="Titulo da tarefa"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Descrição</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                      required
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Detalhes e instruções"
                      title="Descricao da tarefa"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Prioridade</label>
                      <select
                        value={taskForm.priority}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value as NotificationItem['priority'] }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Prioridade da tarefa"
                      >
                        <option value="low">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Status</label>
                      <select
                        value={taskForm.status}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Status da tarefa"
                      >
                        <option value="open">Aberta</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="review">Revisão</option>
                        <option value="blocked">Bloqueada</option>
                        <option value="postponed">Adiada</option>
                        <option value="done">Concluída</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Prazo</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Prazo da tarefa"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Destino</label>
                      <select
                        value={taskForm.targetType}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, targetType: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Destino da tarefa"
                      >
                        <option value="all">Toda a equipe</option>
                        <option value="role">Função específica</option>
                        <option value="email">Membro específico</option>
                      </select>
                    </div>
                  </div>
                  {taskForm.targetType === 'role' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Função</label>
                      <select
                        value={taskForm.targetRole}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, targetRole: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        title="Funcao destino"
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        <option value="master">Master</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Checklist (uma etapa por linha)</label>
                    <textarea
                      value={taskForm.checklistText}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, checklistText: event.target.value }))}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Ex: Revisar documento\nValidar dados\nEnviar confirmação"
                      title="Checklist da tarefa"
                    />
                  </div>
                  {taskForm.targetType === 'email' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Membro da equipe</label>
                        <select
                          value={taskForm.targetEmail}
                          onChange={(event) => setTaskForm((prev) => ({ ...prev, targetEmail: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          title="Membro da equipe"
                        >
                          <option value="">Selecione um membro</option>
                          {staffOptions.map((staff) => (
                            <option key={staff.id} value={staff.email}>
                              {staff.name || staff.email} ({String(staff.role || 'staff').toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Email manual (opcional)</label>
                        <input
                          type="email"
                          value={taskForm.targetEmail}
                          onChange={(event) => setTaskForm((prev) => ({ ...prev, targetEmail: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="ex: equipe@lovetofly.com.br"
                          title="Email manual"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingTask}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {savingTask ? 'Salvando...' : 'Criar tarefa'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
