"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useApp } from "@/lib/beta/store/hooks";
import { MOCK_TEAM_NAME, MOCK_TEAM_NUMBER } from "@/lib/beta/mocks";
import { SegmentedTabs, TabOption } from "../_components/ui";
import { TeamMembers } from "../_components/TeamMembers";
import { TeamProjects } from "../_components/TeamProjects";
import { TeamTasks } from "../_components/TeamTasks";
import { TeamPolls } from "../_components/TeamPolls";

type Tab = "members" | "projects" | "tasks" | "polls";
const VALID: Tab[] = ["members", "projects", "tasks", "polls"];

function TeamPageContent() {
  const { members, tasks, taskItems, polls } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Detail params (?project= / ?task=) force their tab so URL-addressable
  // detail views open on the right surface; otherwise ?tab= wins.
  const param = searchParams.get("tab");
  const tab: Tab = searchParams.get("project")
    ? "projects"
    : searchParams.get("task")
      ? "tasks"
      : param && VALID.includes(param as Tab)
        ? (param as Tab)
        : "members";

  function handleTabChange(next: Tab) {
    router.push(pathname + "?tab=" + next, { scroll: false });
  }

  const options: TabOption<Tab>[] = [
    { label: "Members", value: "members", count: members.length },
    { label: "Projects", value: "projects", count: tasks.length },
    { label: "Tasks", value: "tasks", count: taskItems.length },
    { label: "Polls", value: "polls", count: polls.length },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6 lg:flex lg:items-center lg:justify-between lg:space-y-0 lg:gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Team {MOCK_TEAM_NUMBER} <span className="text-signal">{MOCK_TEAM_NAME}</span>
          </h1>
          <p className="mt-1 text-fg-mid">Members, projects, tasks, and polls in one place.</p>
        </header>
        <SegmentedTabs options={options} value={tab} onChange={handleTabChange} className="lg:shrink-0" />
      </div>

      {tab === "members" ? <TeamMembers /> : null}
      {tab === "projects" ? <TeamProjects /> : null}
      {tab === "tasks" ? <TeamTasks /> : null}
      {tab === "polls" ? <TeamPolls /> : null}
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamPageContent />
    </Suspense>
  );
}
