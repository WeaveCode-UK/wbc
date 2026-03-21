export class TeamNotFoundError extends Error {
  constructor(id: string) { super(`Team not found: ${id}`); this.name = 'TeamNotFoundError'; }
}
export class TeamMemberNotFoundError extends Error {
  constructor(id: string) { super(`Team member not found: ${id}`); this.name = 'TeamMemberNotFoundError'; }
}
export class TeamTaskNotFoundError extends Error {
  constructor(id: string) { super(`Team task not found: ${id}`); this.name = 'TeamTaskNotFoundError'; }
}
export class DuplicateTeamMemberError extends Error {
  constructor(phone: string) { super(`Team member already exists with phone: ${phone}`); this.name = 'DuplicateTeamMemberError'; }
}
