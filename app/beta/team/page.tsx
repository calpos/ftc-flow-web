"use client";

import { useState } from "react";
import { useApp } from "@/lib/beta/store/hooks";
import { MOCK_TEAM_NAME, MOCK_TEAM_NUMBER } from "@/lib/beta/mocks";
import { SegmentedTabs, TabOption } from "../_components/ui";
import { TeamMembers } from "../_components/TeamMembers";
import { TeamProjects } from "../_components/TeamProjects";
import { TeamTasks } from "../_components/TeamTasks";
import { TeamPolls } from "../_components/TeamPolls";

type Tab = "members" | "projects" | "tasks" | "polls";
const VALID: Tab[] = ["members", "projects", "tasks", "polls"];

export default function TeamPage() {
  const { members, tasks, taskItems, polls } = useApp();
  // Beta pages only render after client-side hydration (StoreProvider gates on
  // it), so reading window here is safe and avoids a setState-in-effect.
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "members";
    const param = new URLSearchParams(window.location.search).get("tab");
    return param && VALID.includes(param as Tab) ? (param as Tab) : "members";
  });

  const options: TabOption<Tab>[] = [
    { label: "Members", value: "members", count: members.length },
    { label: "Projects", value: "projects", count: tasks.length },
    { label: "Tasks", value: "tasks", count: taskItems.length },
    { label: "Polls", value: "polls", count: polls.length },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Team {MOCK_TEAM_NUMBER} <span className="text-signal">{MOCK_TEAM_NAME}</span>
        </h1>
        <p className="mt-1 text-fg-mid">Members, projects, tasks, and polls in one place.</p>
      </header>

      <SegmentedTabs options={options} value={tab} onChange={setTab} />

      {tab === "members" ? <TeamMembers /> : null}
      {tab === "projects" ? <TeamProjects /> : null}
      {tab === "tasks" ? <TeamTasks /> : null}
      {tab === "polls" ? <TeamPolls /> : null}
    </div>
  );
}
