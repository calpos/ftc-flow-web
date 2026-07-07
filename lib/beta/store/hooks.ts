"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/beta/store/appStore";
import { useToastStore } from "@/lib/beta/store/toastStore";

/**
 * Convenience hook mirroring the app's useApp(): exposes all store state and
 * actions plus the computed currentUser. Each field is selected individually
 * so references stay stable (no Zustand re-render loops). For fine-grained
 * subscriptions, select directly from useAppStore instead.
 */
export function useApp() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const members = useAppStore((s) => s.members);
  const tasks = useAppStore((s) => s.tasks);
  const taskItems = useAppStore((s) => s.taskItems);
  const polls = useAppStore((s) => s.polls);
  const events = useAppStore((s) => s.events);
  const isLoading = useAppStore((s) => s.isLoading);

  const setUser = useAppStore((s) => s.setUser);
  const updateMemberRaw = useAppStore((s) => s.updateMember);
  const addTaskRaw = useAppStore((s) => s.addTask);
  const updateTaskRaw = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const updateProjectWithCascadeRaw = useAppStore((s) => s.updateProjectWithCascade);
  const addTaskItemRaw = useAppStore((s) => s.addTaskItem);
  const updateTaskItemRaw = useAppStore((s) => s.updateTaskItem);
  const deleteTaskItem = useAppStore((s) => s.deleteTaskItem);
  const addPollRaw = useAppStore((s) => s.addPoll);
  const updatePollRaw = useAppStore((s) => s.updatePoll);
  const deletePoll = useAppStore((s) => s.deletePoll);
  const votePollRaw = useAppStore((s) => s.votePoll);
  const setPollOpenRaw = useAppStore((s) => s.setPollOpen);
  const addEventRaw = useAppStore((s) => s.addEvent);
  const updateEventRaw = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);

  const pushToast = useToastStore((s) => s.push);

  const currentUser = useMemo(
    () => members.find((m) => m.id === currentUserId) ?? null,
    [members, currentUserId],
  );

  function updateMember(...args: Parameters<typeof updateMemberRaw>) { updateMemberRaw(...args); pushToast("Profile updated"); }
  function addTask(...args: Parameters<typeof addTaskRaw>) { addTaskRaw(...args); pushToast("Project created"); }
  function updateTask(...args: Parameters<typeof updateTaskRaw>) { updateTaskRaw(...args); pushToast("Changes saved"); }
  function updateProjectWithCascade(...args: Parameters<typeof updateProjectWithCascadeRaw>) { updateProjectWithCascadeRaw(...args); pushToast("Changes saved"); }
  function addTaskItem(...args: Parameters<typeof addTaskItemRaw>) { addTaskItemRaw(...args); pushToast("Task created"); }
  function updateTaskItem(...args: Parameters<typeof updateTaskItemRaw>) { updateTaskItemRaw(...args); pushToast("Changes saved"); }
  function addPoll(...args: Parameters<typeof addPollRaw>) { addPollRaw(...args); pushToast("Poll created"); }
  function updatePoll(...args: Parameters<typeof updatePollRaw>) { updatePollRaw(...args); pushToast("Changes saved"); }
  function votePoll(...args: Parameters<typeof votePollRaw>) { votePollRaw(...args); pushToast("Vote recorded"); }
  function setPollOpen(...args: Parameters<typeof setPollOpenRaw>) { setPollOpenRaw(...args); pushToast("Poll updated"); }
  function addEvent(...args: Parameters<typeof addEventRaw>) { addEventRaw(...args); pushToast("Event created"); }
  function updateEvent(...args: Parameters<typeof updateEventRaw>) { updateEventRaw(...args); pushToast("Changes saved"); }

  return {
    currentUserId,
    currentUser,
    members,
    tasks,
    taskItems,
    polls,
    events,
    isLoading,
    setUser,
    updateMember,
    addTask,
    updateTask,
    deleteTask,
    updateProjectWithCascade,
    addTaskItem,
    updateTaskItem,
    deleteTaskItem,
    addPoll,
    updatePoll,
    deletePoll,
    votePoll,
    setPollOpen,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
