export type Screenshot = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Real app captures (1206px wide, heights vary per screen).
 * Alt text describes what is actually on screen, in the product voice.
 */
export const shots = {
  home1: {
    src: "/screenshots/home-1.jpg",
    width: 1206,
    height: 2496,
    alt: "FTC Flow home dashboard: a team meeting two days away, the Regional Qualifier competition 24 days away, and the signed-in member's own task list",
  },
  home2: {
    src: "/screenshots/home-2.jpg",
    width: 1206,
    height: 2468,
    alt: "Home dashboard sections for My Tasks, My Projects with live progress bars, and the team's upcoming events",
  },
  teamProjects: {
    src: "/screenshots/team-projects.jpg",
    width: 1206,
    height: 2477,
    alt: "Team Projects tab: searchable project cards with target dates, owner avatars, progress bars, and completion status",
  },
  teamTasks: {
    src: "/screenshots/team-tasks.jpg",
    width: 1206,
    height: 2468,
    alt: "Team Tasks tab: task cards linked to their parent project, each with an assignee, target date, progress bar, and status",
  },
  calendarMonth: {
    src: "/screenshots/calendar-month.jpg",
    width: 1206,
    height: 2464,
    alt: "Calendar month view for June 2026 with color-coded dots marking projects, tasks, polls, and events on each day",
  },
  calendarUpcoming: {
    src: "/screenshots/calendar-upcoming.jpg",
    width: 1206,
    height: 2471,
    alt: "Calendar upcoming view: an agenda of meetings and build sessions with event type badges, times, and descriptions",
  },
  teamPolls: {
    src: "/screenshots/team-polls.jpg",
    width: 1206,
    height: 2470,
    alt: "Team Polls tab: an open poll with live result bars and vote counts above a closed poll, with search and filters",
  },
  teamMembers: {
    src: "/screenshots/team-members.jpg",
    width: 1206,
    height: 2470,
    alt: "Team Members roster: coach, captain, and members with grade levels and work role tags like Programmer, Driver, and CAD Designer",
  },
  accounts: {
    src: "/screenshots/accounts.jpg",
    width: 1206,
    height: 2436,
    alt: "Account perspective switcher: choose which team member's view of the app is active",
  },
} as const satisfies Record<string, Screenshot>;
