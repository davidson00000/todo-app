import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { DropResult } from '@hello-pangea/dnd';
import type { Session } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { SideNav } from './components/SideNav';
import { SettingsModal } from './components/SettingsModal';
import { Login } from './components/Login';
import { ThemeProvider } from './components/ThemeProvider';
import { Dashboard } from './pages/Dashboard';
import { IdeaCanvas } from './pages/IdeaCanvas';
import { IdeaMap } from './pages/IdeaMap';
import { Menu } from 'lucide-react';
import { Roadmap } from './pages/Roadmap';
import { cn } from './lib/utils';
import type { Task, TaskStatus, Project, TaskPriority, UserProfile, Milestone } from './types';
import { supabase } from './lib/supabase';
import { formatDate } from './lib/dateUtils';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isManageProjectsModalOpen, setIsManageProjectsModalOpen] = useState(false);
  const [isProjectDetailsModalOpen, setIsProjectDetailsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [view, setView] = useState<'board' | 'gantt'>('board');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ---------- Data fetching ----------
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*), attachments(*), milestones(id, title), task_dependencies!dependent_task_id(blocking_task_id)')
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
        attachments: t.attachments || [],
        milestone_id: t.milestone_id, // Ensure this is mapped
        dependencies: t.task_dependencies?.map((d: any) => d.blocking_task_id) || [],
        created_at: t.created_at,
        updated_at: t.updated_at
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

  const fetchUserProfile = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: session.user.id }]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          fetchUserProfile();
        }
      }
    } else if (data) {
      setUserProfile(data);
    }
  };

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*, tasks(*)')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
    } else if (data) {
      setMilestones(data);
    }
  };

  // ---------- Auth state listener ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchProjects();
      fetchMilestones();
      fetchUserProfile();
    }
  }, [session]);

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

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as TaskStatus;
      const taskId = result.draggableId;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) {
        console.error('Error updating task status:', error);
        fetchTasks();
      }
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id'> | { title: string; project: string; due_date: string; start_date?: string; description?: string; priority: TaskPriority; status: TaskStatus; milestone_id?: string | null; subtasks?: any[]; dependencies?: string[] }) => {
    const { subtasks, dependencies, ...taskFields } = taskData as any;

    if (editingTask) {
      const formattedFields = {
        ...taskFields,
        due_date: formatDate(taskFields.due_date),
        start_date: formatDate(taskFields.start_date),
      } as any;

      const { error } = await supabase.from('tasks').update(formattedFields).eq('id', editingTask.id);

      if (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
      } else {
        // Handle dependencies
        if (dependencies) {
          await supabase.from('task_dependencies').delete().eq('dependent_task_id', editingTask.id);
          if (dependencies.length > 0) {
            const depRows = dependencies.map((blockingId: string) => ({
              blocking_task_id: blockingId,
              dependent_task_id: editingTask.id
            }));
            await supabase.from('task_dependencies').insert(depRows);
          }
        }

        // Handle subtasks
        if (subtasks) {
          await supabase.from('subtasks').delete().eq('task_id', editingTask.id);
          if (subtasks.length > 0) {
            const subtasksToInsert = subtasks.map((s: any) => ({
              task_id: editingTask.id,
              title: s.title,
              is_completed: s.is_completed,
              due_date: s.due_date || null,
            }));
            await supabase.from('subtasks').insert(subtasksToInsert);
          }
        }
        fetchTasks();
        setEditingTask(null);
      }
    } else {
      const formattedFields = {
        ...taskFields,
        user_id: session?.user.id,
        due_date: formatDate(taskFields.due_date),
        start_date: formatDate(taskFields.start_date),
      } as any;

      const { data: newTask, error } = await supabase.from('tasks').insert([formattedFields]).select().single();

      if (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task. Please try again.');
      } else if (newTask) {
        // Handle dependencies
        if (dependencies && dependencies.length > 0) {
          const depRows = dependencies.map((blockingId: string) => ({
            blocking_task_id: blockingId,
            dependent_task_id: newTask.id
          }));
          await supabase.from('task_dependencies').insert(depRows);
        }

        // Handle subtasks
        if (subtasks && subtasks.length > 0) {
          const subtasksToInsert = subtasks.map((s: any) => ({
            task_id: newTask.id,
            title: s.title,
            is_completed: s.is_completed,
            due_date: s.due_date || null,
          }));
          await supabase.from('subtasks').insert(subtasksToInsert);
        }
        fetchTasks();
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


  const handleEditProject = (project: Project) => {
    setSelectedProject(null);
    setIsProjectDetailsModalOpen(false);
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Delete project "${project.name}" and all its tasks?`)) return;

    await supabase.from('tasks').delete().eq('project', project.name);
    const { error } = await supabase.from('projects').delete().eq('id', project.id);

    if (error) console.error('Error deleting project:', error);
    else {
      fetchProjects();
      fetchTasks();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };


  // ---------- Render ----------
  if (!session) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Login />
      </ThemeProvider>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <div className="flex h-screen w-screen overflow-hidden relative">
          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden absolute top-4 left-4 z-50 p-2 bg-slate-900 text-cyan-500 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar with mobile visibility logic */}
          <div className={cn("md:block", isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 block" : "hidden")}>
            <SideNav onOpenSettings={() => setIsSettingsModalOpen(true)} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col w-full">
            <Layout
              userProfile={userProfile}
              userEmail={session.user?.email || ''}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      tasks={tasks}
                      projects={projects}
                      milestones={milestones}
                      completedCount={completedCount}
                      view={view}
                      setView={setView}
                      handleDragEnd={handleDragEnd}
                      handleTaskClick={handleTaskClick}
                      handleDeleteTask={handleDeleteTask}
                      handleSaveTask={handleSaveTask}
                      handleSaveProject={handleSaveProject}
                      handleEditProject={handleEditProject}
                      handleDeleteProject={handleDeleteProject}
                      handleSignOut={handleSignOut}
                      fetchTasks={fetchTasks}
                      isModalOpen={isModalOpen}
                      setIsModalOpen={setIsModalOpen}
                      isProjectModalOpen={isProjectModalOpen}
                      setIsProjectModalOpen={setIsProjectModalOpen}
                      isManageProjectsModalOpen={isManageProjectsModalOpen}
                      setIsManageProjectsModalOpen={setIsManageProjectsModalOpen}
                      isProjectDetailsModalOpen={isProjectDetailsModalOpen}
                      setIsProjectDetailsModalOpen={setIsProjectDetailsModalOpen}
                      editingTask={editingTask}
                      editingProject={editingProject}
                      setEditingProject={setEditingProject}
                      selectedProject={selectedProject}
                    />
                  }
                />
                <Route
                  path="/roadmap"
                  element={
                    <Roadmap
                      projects={projects}
                      milestones={milestones}
                      tasks={tasks}
                      onAddMilestone={async (m: Omit<Milestone, 'id' | 'created_at'>) => {
                        const { error } = await supabase.from('milestones').insert([m]);
                        if (error) console.error(error);
                        else fetchMilestones();
                      }}
                      onDeleteMilestone={async (id: string) => {
                        const { error } = await supabase.from('milestones').delete().eq('id', id);
                        if (error) console.error(error);
                        else fetchMilestones();
                      }}
                      onSaveTask={handleSaveTask}
                      onRefreshTasks={async () => {
                        await Promise.all([fetchTasks(), fetchMilestones()]);
                      }}
                    />
                  }
                />
                <Route path="/canvas" element={<IdeaCanvas />} />
                <Route path="/map" element={<IdeaMap />} />
              </Routes>
            </Layout>

            <SettingsModal
              isOpen={isSettingsModalOpen}
              onClose={() => setIsSettingsModalOpen(false)}
              userProfile={userProfile}
              userEmail={session.user?.email || ''}
              onProfileUpdate={fetchUserProfile}
            />
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
