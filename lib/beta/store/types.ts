import { StateCreator } from "zustand";

import { Poll, Task, TeamEvent, TeamMember, TeamTask } from "@/lib/beta/types";
import { AppData } from "@/lib/beta/storage";

export interface SessionSlice {
  currentUserId: string;
  isLoading: boolean;
  hasHydrated: boolean;
  hydrate: (data: AppData) => void;
  setIsLoading: (isLoading: boolean) => void;
  setUser: (id: string) => void;
}

export interface MembersSlice {
  members: TeamMember[];
  updateMember: (updated: TeamMember) => void;
}

export interface ProjectsSlice {
  tasks: TeamTask[];
  addTask: (task: TeamTask) => void;
  updateTask: (task: TeamTask) => void;
  deleteTask: (taskId: string) => void;
  updateProjectWithCascade: (project: TeamTask) => void;
}

export interface TaskItemsSlice {
  taskItems: Task[];
  addTaskItem: (task: Task) => void;
  updateTaskItem: (task: Task) => void;
  deleteTaskItem: (id: string) => void;
}

export interface PollsSlice {
  polls: Poll[];
  addPoll: (poll: Poll) => void;
  updatePoll: (poll: Poll) => void;
  deletePoll: (pollId: string) => void;
  votePoll: (pollId: string, userId: string, optionId: string) => void;
  setPollOpen: (pollId: string, isOpen: boolean) => void;
}

export interface EventsSlice {
  events: TeamEvent[];
  addEvent: (event: TeamEvent) => void;
  updateEvent: (event: TeamEvent) => void;
  deleteEvent: (eventId: string) => void;
}

export type AppStore = SessionSlice &
  MembersSlice &
  ProjectsSlice &
  TaskItemsSlice &
  PollsSlice &
  EventsSlice;

export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
