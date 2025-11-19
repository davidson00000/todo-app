import { useState, useEffect } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { Layout } from './components/Layout';
import { KPICard } from './components/KPICard';
import { ProjectChart } from './components/ProjectChart';
import { KanbanBoard } from './components/KanbanBoard';
import { AddTaskModal } from './components/AddTaskModal';
import { ThemeProvider } from './components/ThemeProvider';
import { LayoutDashboard, ListTodo, CheckCircle } from 'lucide-react';
import type { Task, TaskStatus } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // ---------- Data fetching ----------
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      const mappedTasks: Task[] = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        project: t.project,
        status: t.status,
        priority: t.priority,
        due: t.due_date,
      }));
      setTasks(mappedTasks);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ---------- KPI count ----------
  useEffect(() => {
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    setCompletedCount(doneTasks);
  }, [tasks]);

  // ---------- Handlers ----------
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Moving between columns → update status
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as TaskStatus;
      const taskId = result.draggableId;

      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) {
        console.error('Error updating task status:', error);
        fetchTasks(); // revert on error
      }
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
    const supabaseData = {
      title: taskData.title,
      project: taskData.project,
      status: taskData.status,
      priority: taskData.priority,
      due_date: taskData.due,
    };

    if (editingTask) {
      const { error } = await supabase.from('tasks').update(supabaseData).eq('id', editingTask.id);
      if (error) console.error('Error updating task:', error);
      else fetchTasks();
      setEditingTask(null);
    } else {
      const { error } = await supabase.from('tasks').insert([supabaseData]);
      if (error) console.error('Error creating task:', error);
      else fetchTasks();
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm('Delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) console.error('Error deleting task:', error);
    else fetchTasks();
  };

  // ---------- Render ----------
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Layout>
        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KPICard title="Active Projects" value="12" change="+2" trend="up" icon={LayoutDashboard} />
          <KPICard
            title="Pending Tasks"
            value={tasks.filter((t) => t.status !== 'done').length}
            change={tasks.length > 5 ? '+2' : '-1'}
            trend={tasks.length > 5 ? 'down' : 'up'}
            icon={ListTodo}
          />
          <KPICard title="Total Completed" value={completedCount} change="+12" trend="up" icon={CheckCircle} />
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px] px-4 md:px-0 mt-4">
          <div className="w-full lg:w-1/3 h-[300px] lg:h-full mb-4 lg:mb-0 hidden md:block">
            <ProjectChart />
          </div>
          <div className="w-full lg:w-2/3 h-full">
            <KanbanBoard
              tasks={tasks}
              onDragEnd={handleDragEnd}
              onAddClick={() => setIsModalOpen(true)}
              onTaskClick={handleTaskClick}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>

        <AddTaskModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveTask} initialTask={editingTask} />
      </Layout>
    </ThemeProvider>
  );
}

export default App;

