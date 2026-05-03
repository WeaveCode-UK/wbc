import { describe, it, expect } from "vitest";
import {
  TeamNotFoundError,
  TeamMemberNotFoundError,
  TeamTaskNotFoundError,
  DuplicateTeamMemberError,
} from "../errors";

describe("TeamNotFoundError", () => {
  it("includes the team id in the message", () => {
    const e = new TeamNotFoundError("team-1");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TeamNotFoundError");
    expect(e.message).toBe("Team not found: team-1");
  });
});

describe("TeamMemberNotFoundError", () => {
  it("includes the member id in the message", () => {
    const e = new TeamMemberNotFoundError("m-1");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TeamMemberNotFoundError");
    expect(e.message).toBe("Team member not found: m-1");
  });
});

describe("TeamTaskNotFoundError", () => {
  it("includes the task id in the message", () => {
    const e = new TeamTaskNotFoundError("task-1");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TeamTaskNotFoundError");
    expect(e.message).toBe("Team task not found: task-1");
  });
});

describe("DuplicateTeamMemberError", () => {
  it("includes the offending phone in the message", () => {
    const e = new DuplicateTeamMemberError("+5511999999999");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DuplicateTeamMemberError");
    expect(e.message).toContain("+5511999999999");
  });
});
