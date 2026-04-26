export const ISSUE_STATUSES = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "IN_REVIEW", label: "In review" },
  { id: "DONE", label: "Done" },
] as const;

export type IssueStatusId = (typeof ISSUE_STATUSES)[number]["id"];

export const PRIORITIES = [
  { id: "LOW", label: "Low" },
  { id: "MEDIUM", label: "Medium" },
  { id: "HIGH", label: "High" },
  { id: "CRITICAL", label: "Critical" },
] as const;

export function isStatus(s: string): s is IssueStatusId {
  return ISSUE_STATUSES.some((c) => c.id === s);
}

export function isPriority(s: string) {
  return PRIORITIES.some((p) => p.id === s);
}
