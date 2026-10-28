import { describe, expect, it } from "vitest";
import {
  accessRoleLabel,
  canEditMembership,
  canLeave,
  canRegenerateJoinCode,
  canRemove,
  countOwners,
  resolveViewerRole,
  roleOptions,
} from "./permissions";

const ALL = ["owner", "admin", "member"];

describe("countOwners", () => {
  it("counts only owners", () => {
    expect(
      countOwners([
        { accessRole: "owner" },
        { accessRole: undefined },
        { accessRole: "admin" },
        { accessRole: "owner" },
      ]),
    ).toBe(2);
  });
});

describe("resolveViewerRole", () => {
  const members = [
    { id: "a", accessRole: "admin" as const },
    { id: "b", accessRole: undefined },
  ];

  it("prefers the store member's role", () => {
    expect(resolveViewerRole(members, "a", "owner")).toBe("admin");
  });

  it("falls back for a missing member, an undefined role or a null id", () => {
    expect(resolveViewerRole(members, "z", "member")).toBe("member");
    expect(resolveViewerRole(members, "b", "owner")).toBe("owner");
    expect(resolveViewerRole(members, null, "admin")).toBe("admin");
    expect(resolveViewerRole(members, null, null)).toBeNull();
  });
});

describe("roleOptions", () => {
  it("offers nothing to a non-owner", () => {
    expect(roleOptions("admin", "member", 1)).toEqual([]);
    expect(roleOptions("member", "member", 1)).toEqual([]);
    expect(roleOptions(null, "member", 1)).toEqual([]);
  });

  it("never offers demoting the last owner", () => {
    expect(roleOptions("owner", "owner", 1)).toEqual(["owner"]);
  });

  it("offers every role for an owner when another owner remains", () => {
    expect(roleOptions("owner", "owner", 2)).toEqual(ALL);
  });

  it("offers every role for a non-owner target", () => {
    expect(roleOptions("owner", "member", 1)).toEqual(ALL);
    expect(roleOptions("owner", undefined, 1)).toEqual(ALL);
  });
});

describe("canRemove", () => {
  it("is false for self", () => {
    expect(canRemove("owner", "owner", true, 2)).toBe(false);
    expect(canRemove("admin", "admin", true, 1)).toBe(false);
  });

  it("lets an owner remove anyone but the last owner", () => {
    expect(canRemove("owner", "admin", false, 1)).toBe(true);
    expect(canRemove("owner", "member", false, 1)).toBe(true);
    expect(canRemove("owner", "owner", false, 2)).toBe(true);
    expect(canRemove("owner", "owner", false, 1)).toBe(false);
  });

  it("lets an admin remove only members", () => {
    expect(canRemove("admin", "member", false, 1)).toBe(true);
    expect(canRemove("admin", "admin", false, 1)).toBe(false);
    expect(canRemove("admin", "owner", false, 2)).toBe(false);
    expect(canRemove("admin", undefined, false, 1)).toBe(false);
  });

  it("never lets a member remove anyone", () => {
    for (const target of ["owner", "admin", "member", undefined] as const) {
      expect(canRemove("member", target, false, 2)).toBe(false);
    }
  });
});

describe("canLeave", () => {
  it("blocks only the last owner and a viewer without a role", () => {
    expect(canLeave("owner", 1)).toBe(false);
    expect(canLeave("owner", 2)).toBe(true);
    expect(canLeave("admin", 1)).toBe(true);
    expect(canLeave("member", 1)).toBe(true);
    expect(canLeave(null, 1)).toBe(false);
  });
});

describe("canEditMembership", () => {
  it("lets anyone edit their own", () => {
    for (const role of ["owner", "admin", "member", null] as const) {
      expect(canEditMembership(role, true)).toBe(true);
    }
  });

  it("lets only managers edit others", () => {
    expect(canEditMembership("owner", false)).toBe(true);
    expect(canEditMembership("admin", false)).toBe(true);
    expect(canEditMembership("member", false)).toBe(false);
    expect(canEditMembership(null, false)).toBe(false);
  });
});

describe("canRegenerateJoinCode", () => {
  it("is managers only", () => {
    expect(canRegenerateJoinCode("owner")).toBe(true);
    expect(canRegenerateJoinCode("admin")).toBe(true);
    expect(canRegenerateJoinCode("member")).toBe(false);
    expect(canRegenerateJoinCode(null)).toBe(false);
  });
});

describe("accessRoleLabel", () => {
  it("capitalizes each role", () => {
    expect(accessRoleLabel("owner")).toBe("Owner");
    expect(accessRoleLabel("admin")).toBe("Admin");
    expect(accessRoleLabel("member")).toBe("Member");
  });
});
