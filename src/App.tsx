import { useState, useEffect } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { Layout } from './components/Layout';
import { KPICard } from './components/KPICard';
import { ProjectChart } from './components/ProjectChart';
import { KanbanBoard } from './components/KanbanBoard';
import { AddTaskModal } from './components/AddTaskModal';
import { AddProjectModal } from './components/AddProjectModal';
import { ManageProjectsModal } from './components/ManageProjectsModal';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { ThemeProvider } from './components/ThemeProvider';
import { ListTodo, CheckCircle, Plus, Grid } from 'lucide-react';
import type { Task, TaskStatus, Project, TaskPriority } from './types';
import { supabase } from './lib/supabase';
import { formatDate } from './lib/dateUtils';

import { AttentionWidget } from './components/AttentionWidget';
import { TodayActionWidget } from './components/TodayActionWidget';
import { GanttView } from './components/GanttView';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isManageProjectsModalOpen, setIsManageProjectsModalOpen] = useState(false);
  const [isProjectDetailsModalOpen, setIsProjectDetailsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [view, setView] = useState<'board' | 'gantt'>('board');

  // ---------- Data fetching ----------
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*)')
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
        due_date: t.due_date,
        start_date: t.start_date,
        description: t.description,
        subtasks: t.subtasks || [],
      }));
      setTasks(mappedTasks);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
    } else if (data) {
      setProjects(data);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
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

  const handleSaveTask = async (taskData: Omit<Task, 'id'> | { title: string; project: string; due_date: string; start_date?: string; description?: string; priority: TaskPriority; status: TaskStatus; subtasks?: any[] }) => {
    // Extract subtasks to avoid sending them to tasks table
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subtasks, ...taskFields } = taskData as any;

    if (editingTask) {
      const formattedFields = {
        ...taskFields,
        due_date: formatDate(taskFields.due_date),
        start_date: formatDate(taskFields.start_date),
      } as any;

      const { error } = await supabase
        .from('tasks')
        .update(formattedFields)
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task');
      } else {
        fetchTasks();
        setIsModalOpen(false); // Changed from setIsAddTaskModalOpen to setIsModalOpen
        setEditingTask(null);
      }
    } else {
      const formattedFields = {
        ...taskFields,
        due_date: formatDate(taskFields.due_date),
        start_date: formatDate(taskFields.start_date),
      } as any;

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([formattedFields])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task');
      } else if (newTask) {
        // Insert subtasks if any (for new task)
        if (subtasks && subtasks.length > 0) {
          const subtasksToInsert = subtasks.map((s: any) => ({
            task_id: newTask.id,
            title: s.title,
            is_completed: s.is_completed || false
          }));

          const { error: subtaskError } = await supabase
            .from('subtasks')
            .insert(subtasksToInsert);

          if (subtaskError) {
            console.error('Error adding subtasks:', subtaskError);
          }
        }

        fetchTasks();
        setIsModalOpen(false); // Changed from setIsAddTaskModalOpen to setIsModalOpen
      }
    }
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id'>) => {
    if (editingProject) {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id);

      if (error) {
        console.error('Error updating project:', error);
        alert('Failed to update project. Please try again.');
      } else {
        fetchProjects();
        setEditingProject(null);
      }
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (error) {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
      } else {
        fetchProjects();
      }
    }
  };

  const handleProjectClick = (projectName: string) => {
    const project = projects.find((p) => p.name === projectName);
    if (project) {
      setSelectedProject(project);
      setIsProjectDetailsModalOpen(true);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(null);
    setIsProjectDetailsModalOpen(false);
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? All associated tasks will also be deleted.`)) return;

    try {
      // 1. Delete associated tasks
      const { error: taskError } = await supabase.from('tasks').delete().eq('project', project.name);
      if (taskError) {
        throw new Error('Failed to delete project tasks: ' + taskError.message);
      }

      // 2. Delete project
      const { error: projectError } = await supabase.from('projects').delete().eq('id', project.id);
      if (projectError) {
        throw new Error('Failed to delete project: ' + projectError.message);
      }

      // Success
      alert('Project deleted successfully');
      setIsManageProjectsModalOpen(false); // Close modal
      fetchProjects();
      fetchTasks();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(error.message || 'An error occurred while deleting the project.');
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm('Delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) console.error('Error deleting task:', error);
    else fetchTasks();
  };

  // ---------- Chart Data Calculation ----------
  const chartData = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.project === project.name);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === 'done').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      name: project.name,
      progress,
      color: project.color,
    };
  });

  // ---------- Render ----------
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Layout>
        {/* Header with New Project Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* 4-Tier Grid Layout */}
        <div className="grid grid-cols-12 gap-6">

          {/* Tier 1: KPI Cards (Overview) */}
          <div className="col-span-12 md:col-span-4">
            <KPICard
              title="Active Projects"
              value={projects.length.toString()}
              change="+2"
              trend="up"
              icon={Grid}
              onIconClick={() => setIsManageProjectsModalOpen(true)}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <KPICard
              title="Pending Tasks"
              value={tasks.filter((t) => t.status !== 'done').length}
              change={tasks.length > 5 ? '+2' : '-1'}
              trend={tasks.length > 5 ? 'down' : 'up'}
              icon={ListTodo}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <KPICard
              title="Total Completed"
              value={completedCount}
              change="+12"
              trend="up"
              icon={CheckCircle}
            />
          </div>

          {/* Tier 2: Action & Alerts (Priority) */}
          <div className="col-span-12 md:col-span-6 h-full">
            <div className="h-full">
              <TodayActionWidget tasks={tasks} onRefresh={fetchTasks} onTaskClick={handleTaskClick} />
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 h-full">
            <div className="h-full">
              <AttentionWidget tasks={tasks} onTaskClick={handleTaskClick} />
            </div>
          </div>

          {/* Tier 3: Main Workspace (Timeline) - Full Width */}
          <div className="col-span-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              {/* View Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {view === 'board' ? 'Task Board' : 'Gantt Chart'}
                </h2>
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    onClick={() => setView('board')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'board'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    Board
                  </button>
                  <button
                    onClick={() => setView('gantt')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'gantt'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    Gantt
                  </button>
                </div>
              </div>

              {/* Workspace Content with horizontal scroll for Gantt */}
              <div className="overflow-x-auto min-h-[500px]">
                {view === 'board' ? (
                  <KanbanBoard
                    tasks={tasks}
                    onDragEnd={handleDragEnd}
                    onAddClick={() => setIsModalOpen(true)}
                    onTaskClick={handleTaskClick}
                    onDeleteTask={handleDeleteTask}
                  />
                ) : (
                  <GanttView tasks={tasks} onTaskClick={handleTaskClick} />
                )}
              </div>
            </div>
          </div>

          {/* Tier 4: Analytics (Analysis) - Full Width */}
          <div className="col-span-12">
            <div className="h-[300px]">
              <ProjectChart data={chartData} onBarClick={handleProjectClick} />
            </div>
          </div>

        </div>

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            fetchTasks();
          }}
          onSave={handleSaveTask}
          initialTask={editingTask}
          projects={projects}
          onRefresh={fetchTasks}
        />

        <AddProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
          initialProject={editingProject}
        />

        <ProjectDetailsModal
          isOpen={isProjectDetailsModalOpen}
          onClose={() => setIsProjectDetailsModalOpen(false)}
          project={selectedProject}
          onEdit={handleEditProject}
        />

        <ManageProjectsModal
          isOpen={isManageProjectsModalOpen}
          onClose={() => setIsManageProjectsModalOpen(false)}
          projects={projects}
          onDeleteProject={handleDeleteProject}
        />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
