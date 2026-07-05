import { Poll, Task, TeamEvent, TeamMember, TeamTask } from "@/lib/beta/types";

export const MOCK_TEAM_NUMBER = "12345";
export const MOCK_TEAM_NAME = "Robots";

export const MOCK_MEMBERS: TeamMember[] = [
  { id: "coach-1", firstName: "David", lastName: "Chen", teamRole: "Coach", workRoles: [], isCoach: true },
  { id: "m-1", firstName: "Sarah", lastName: "Kim", teamRole: "Captain", workRoles: ["Programmer", "CAD Designer"], grade: "12th", isCoach: false },
  { id: "m-2", firstName: "Marcus", lastName: "Johnson", teamRole: "Member", workRoles: ["Programmer"], grade: "11th", isCoach: false },
  { id: "m-3", firstName: "Emily", lastName: "Rodriguez", teamRole: "Member", workRoles: ["Engineer", "Builder"], grade: "10th", isCoach: false },
  { id: "m-4", firstName: "James", lastName: "Park", teamRole: "Member", workRoles: ["Driver"], grade: "11th", isCoach: false },
  { id: "m-5", firstName: "Aisha", lastName: "Patel", teamRole: "Secretary", workRoles: ["Designer", "Outreach"], grade: "9th", isCoach: false },
  { id: "m-6", firstName: "Liam", lastName: "O'Brien", teamRole: "Member", workRoles: ["Programmer"], grade: "10th", isCoach: false },
  { id: "m-7", firstName: "Zoe", lastName: "Wang", teamRole: "Co-Captain", workRoles: ["Engineer", "Notebooker"], grade: "12th", isCoach: false },
];

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const MOCK_EVENTS: TeamEvent[] = [
  {
    id: "ev-1",
    title: "Weekly Team Meeting",
    date: dateOffset(2),
    startTime: "16:00",
    endTime: "17:30",
    type: "meeting",
    description: "Review weekly progress, assign tasks, and discuss upcoming events.",
    createdBy: "coach-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "ev-2",
    title: "Build Session — Drivetrain",
    date: dateOffset(4),
    startTime: "15:00",
    endTime: "18:00",
    type: "build",
    description: "Assemble new drivetrain prototype and run initial drive tests.",
    createdBy: "m-3",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: "ev-3",
    title: "Programming Workshop",
    date: dateOffset(6),
    startTime: "17:00",
    endTime: "19:00",
    type: "meeting",
    description: "Walkthrough of autonomous routines and PathPlanner basics.",
    createdBy: "m-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "ev-4",
    title: "Inter-Team Scrimmage",
    date: dateOffset(11),
    startTime: "09:00",
    endTime: "15:00",
    type: "scrimmage",
    description: "Practice matches with neighboring teams. Bring spare parts and the field elements.",
    createdBy: "coach-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "ev-5",
    title: "Build Session — Intake",
    date: dateOffset(15),
    startTime: "15:30",
    endTime: "18:30",
    type: "build",
    description: "Iterate on the intake mechanism and integrate with the elevator.",
    createdBy: "m-7",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "ev-6",
    title: "Regional Qualifier",
    date: dateOffset(24),
    startTime: "08:00",
    endTime: "18:00",
    type: "competition",
    description: "Official FTC qualifier. Arrive by 7:30 AM for inspection.",
    createdBy: "coach-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "ev-7",
    title: "Outreach Visit",
    date: dateOffset(8),
    startTime: "13:00",
    endTime: "14:30",
    type: "other",
    description: "Demo robot at the local middle school STEM fair.",
    createdBy: "m-5",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
];

/**
 * Seed projects, tasks, and polls for the web beta demo. The mobile app ships
 * with these empty; the local beta seeds a realistic dataset so every feature
 * is explorable on first load.
 */
export const MOCK_PROJECTS: TeamTask[] = [
  {
    id: "pr-1",
    name: "Drivetrain Redesign",
    description: "Rebuild the drivetrain for better speed and reliability ahead of the qualifier.",
    color: "#2D8CFF",
    dueDate: dateOffset(10),
    assignedMembers: ["m-1", "m-3", "m-4"],
    editors: ["m-1", "m-3"],
    createdBy: "m-1",
    subtasks: [],
    progress: 0,
  },
  {
    id: "pr-2",
    name: "Autonomous Routine",
    description: "Develop and tune the autonomous period scoring routine.",
    color: "#AF52DE",
    dueDate: dateOffset(6),
    assignedMembers: ["m-2", "m-6"],
    editors: ["m-2", "m-6"],
    createdBy: "m-2",
    subtasks: [],
    progress: 0,
  },
  {
    id: "pr-3",
    name: "Outreach Campaign",
    description: "Plan and run community demos and sponsor outreach for the season.",
    color: "#34C759",
    dueDate: dateOffset(20),
    assignedMembers: ["m-5", "m-7"],
    editors: ["m-5"],
    createdBy: "m-5",
    subtasks: [],
    progress: 30,
  },
];

export const MOCK_TASK_ITEMS: Task[] = [
  {
    id: "ti-1",
    title: "Wire up odometry pods",
    description: "Mount and wire the three dead-wheel odometry pods.",
    color: "#2D8CFF",
    dueDate: dateOffset(8),
    assignedMembers: ["m-3"],
    editors: ["m-3"],
    subtasks: [
      { id: "st-1", title: "Print pod mounts", completed: true },
      { id: "st-2", title: "Solder encoder cables", completed: false },
      { id: "st-3", title: "Verify tick counts", completed: false },
    ],
    parentProjectId: "pr-1",
    overrideFlag: false,
    progress: 0,
    createdBy: "m-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "ti-2",
    title: "CAD new gearbox mounts",
    description: "Model the updated gearbox mounting plates in Onshape.",
    color: "#FF9500",
    dueDate: dateOffset(5),
    assignedMembers: ["m-1"],
    editors: ["m-1"],
    subtasks: [],
    parentProjectId: "pr-1",
    overrideFlag: false,
    progress: 60,
    createdBy: "m-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "ti-3",
    title: "Tune PID constants",
    description: "Dial in the drive PID for the autonomous paths.",
    color: "#AF52DE",
    dueDate: dateOffset(6),
    assignedMembers: ["m-2"],
    editors: ["m-2"],
    subtasks: [],
    parentProjectId: "pr-2",
    overrideFlag: false,
    progress: 40,
    createdBy: "m-2",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "ti-4",
    title: "Order replacement wheels",
    description: "Standalone task — order spare mecanum wheels before the scrimmage.",
    color: "#34C759",
    dueDate: dateOffset(3),
    assignedMembers: ["m-4"],
    editors: ["m-4"],
    subtasks: [],
    overrideFlag: false,
    progress: 0,
    createdBy: "m-4",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "ti-5",
    title: "Draft sponsor email",
    description: "Write the outreach email to local engineering firms.",
    color: "#34C759",
    dueDate: dateOffset(12),
    assignedMembers: ["m-5"],
    editors: ["m-5"],
    subtasks: [
      { id: "st-4", title: "Collect sponsor contacts", completed: true },
      { id: "st-5", title: "Write template", completed: true },
    ],
    parentProjectId: "pr-3",
    overrideFlag: true,
    progress: 0,
    createdBy: "m-5",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
];

export const MOCK_POLLS: Poll[] = [
  {
    id: "poll-1",
    question: "What should we name the robot this season?",
    options: [
      { id: "opt-1", text: "Voltron" },
      { id: "opt-2", text: "Gearbox" },
      { id: "opt-3", text: "Rusty" },
    ],
    creatorId: "m-1",
    isOpen: true,
    closesAt: Date.now() + 1000 * 60 * 60 * 24 * 5,
    allowMultiple: false,
    votes: {
      "m-1": ["opt-1"],
      "m-3": ["opt-1"],
      "m-4": ["opt-2"],
      "m-7": ["opt-3"],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    color: "#2D8CFF",
  },
  {
    id: "poll-2",
    question: "Which subsystems should we prioritize this week?",
    options: [
      { id: "opt-4", text: "Drivetrain" },
      { id: "opt-5", text: "Intake" },
      { id: "opt-6", text: "Autonomous" },
      { id: "opt-7", text: "Outreach" },
    ],
    creatorId: "coach-1",
    isOpen: true,
    closesAt: Date.now() + 1000 * 60 * 60 * 24 * 3,
    allowMultiple: true,
    votes: {
      "m-2": ["opt-4", "opt-6"],
      "m-3": ["opt-4"],
      "m-6": ["opt-6"],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    color: "#FF9500",
  },
];
