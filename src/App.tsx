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

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      // Transform Supabase data to React Task format
      const mappedTasks: Task[] = data.map((task: any) => ({
        id: task.id,
        title: task.title,
        project: task.project,
        status: task.status,
        priority: task.priority,
        due: task.due_date, // Map 'due_date' to 'due'
      }));
      setTasks(mappedTasks);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Update completed count when tasks change
  useEffect(() => {
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    // Base count + current done tasks to simulate history if needed, 
    // or just use doneTasks. Let's use doneTasks + 124 to keep the "demo" feel
    // but since we are moving to DB, maybe we should just show actual DB count.
    // Let's just show actual DB count for "done" tasks.
    setCompletedCount(doneTasks);
  }, [tasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // If moving to a different column, update status
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as TaskStatus;
      const taskId = result.draggableId;

      // Optimistic update
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      setTasks(updatedTasks);

      // Supabase update
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task status:', error);
        fetchTasks(); // Revert on error
      }
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
    // Transform React data to Supabase schema
    const supabaseData = {
      title: taskData.title,
      project: taskData.project,
      status: taskData.status,
      priority: taskData.priority,
      due_date: taskData.due, // Map 'due' to 'due_date'
    };

    if (editingTask) {
      // Update existing task
      const { error } = await supabase
        .from('tasks')
        .update(supabaseData)
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error updating task:', error);
      } else {
        fetchTasks();
      }
      setEditingTask(null);
    } else {
      // Create new task
      const { error } = await supabase
        .from('tasks')
        .insert([supabaseData]);

      if (error) {
        console.error('Error creating task:', error);
      } else {
        fetchTasks();
      }
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

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KPICard
            title="Active Projects"
            value="12"
            change="+2"
            trend="up"
            icon={LayoutDashboard}
          />
          <KPICard
            title="Pending Tasks"
            value={tasks.filter(t => t.status !== 'done').length}
            change={tasks.length > 5 ? "+2" : "-1"}
            trend={tasks.length > 5 ? "down" : "up"}
            icon={ListTodo}
          />
          <KPICard
            title="Total Completed"
            value={completedCount}
            change="+12"
            trend="up"
            icon={CheckCircle}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
          <div className="w-full lg:w-1/3 h-[300px] lg:h-full">
            <ProjectChart />
          </div>
          <div className="w-full lg:w-2/3 h-full">
            <KanbanBoard
              tasks={tasks}
              onDragEnd={handleDragEnd}
              onAddClick={() => setIsModalOpen(true)}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          initialTask={editingTask}
        />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
