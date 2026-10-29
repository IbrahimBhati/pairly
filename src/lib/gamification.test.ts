import { describe, it, expect } from "vitest";
import { calculateUserLevel, LEVEL_TIERS } from "../types/database";
import { validateContentSafety, BANNED_KEYWORDS } from "./safety";

describe("Gamification & Level System", () => {
  it("calculates Level 1 Newcomer for 0 to 99 points", () => {
    const res0 = calculateUserLevel(0);
    expect(res0.level).toBe(1);
    expect(res0.title).toBe("Newcomer");
    expect(res0.progressPercent).toBe(0);

    const res50 = calculateUserLevel(50);
    expect(res50.level).toBe(1);
    expect(res50.title).toBe("Newcomer");
    expect(res50.progressPercent).toBe(50);
    expect(res50.pointsToNextLevel).toBe(50);
  });

  it("calculates Level 2 Explorer for 100 to 199 points", () => {
    const res100 = calculateUserLevel(100);
    expect(res100.level).toBe(2);
    expect(res100.title).toBe("Explorer");
    expect(res100.progressPercent).toBe(0);

    const res175 = calculateUserLevel(175);
    expect(res175.level).toBe(2);
    expect(res175.progressPercent).toBe(75);
    expect(res175.pointsToNextLevel).toBe(25);
  });

  it("calculates Level 3 Contributor for 200 to 299 points", () => {
    const res250 = calculateUserLevel(250);
    expect(res250.level).toBe(3);
    expect(res250.title).toBe("Contributor");
    expect(res250.progressPercent).toBe(50);
  });

  it("calculates Level 4 Mentor for 300 to 499 points", () => {
    const res350 = calculateUserLevel(350);
    expect(res350.level).toBe(4);
    expect(res350.title).toBe("Mentor");
  });

  it("calculates Level 5 Legend for 500+ points", () => {
    const res550 = calculateUserLevel(550);
    expect(res550.level).toBe(5);
    expect(res550.title).toBe("Legend");
  });
});

describe("Trust & Content Safety Filters", () => {
  it("allows safe academic and skill-sharing messages", () => {
    const res = validateContentSafety("Hi! I would love to learn Python algorithms with you on campus library.", false);
    expect(res.isSafe).toBe(true);
    expect(res.valid).toBe(true);
  });

  it("blocks banned scam and monetary solicitation phrases", () => {
    const res = validateContentSafety("Please cashapp me $50 for this tutorial.", false);
    expect(res.isSafe).toBe(false);
    expect(res.valid).toBe(false);
    expect(res.flaggedReason).toBe("prohibited_language");
  });

  it("blocks phone numbers in initial messages", () => {
    const res = validateContentSafety("Call or text me at 555-123-4567 to schedule.", true);
    expect(res.isSafe).toBe(false);
    expect(res.valid).toBe(false);
    expect(res.flaggedReason).toBe("contact_sharing");
  });

  it("blocks emails in initial messages", () => {
    const res = validateContentSafety("Reach out to me directly at student@university.edu", true);
    expect(res.isSafe).toBe(false);
    expect(res.valid).toBe(false);
    expect(res.flaggedReason).toBe("contact_sharing");
  });

  it("allows emails in regular ongoing messages once connected", () => {
    const res = validateContentSafety("Here is my slides link or email: student@university.edu", false);
    expect(res.isSafe).toBe(true);
    expect(res.valid).toBe(true);
  });
});
