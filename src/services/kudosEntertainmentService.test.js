const { describe, it } = require("node:test");
const assert = require("node:assert");
const kudosEntertainmentService = require("./kudosEntertainmentService");

describe("👑 Kudos Entertainment 13-Day War Room Campaign Tests", () => {
  it("Generates exactly 13 day-by-day tactical sprint steps", () => {
    const calendar = kudosEntertainmentService.generate13DaySprintCalendar();
    assert.strictEqual(calendar.length, 13);
    assert.strictEqual(calendar[0].day, "Day 1 (Aug 31)");
    assert.strictEqual(calendar[12].day, "Day 13 (Sep 12 — D-DAY)");
  });

  it("Generates multi-angle ad copy hooks with valid CTAs", () => {
    const hooks = kudosEntertainmentService.generateAdHooks();
    assert.ok(hooks.celebrityAngle.headline.includes("Celina Jaitly"));
    assert.ok(hooks.fomoAngle.headline.includes("12th September"));
    assert.ok(hooks.businessPrestigeAngle.primaryText.includes("Radisson Blu"));
  });

  it("Generates 7-slide luxury pitch presentation for Kajal Sharma", () => {
    const pitch = kudosEntertainmentService.generatePitchDeckPayload();
    assert.strictEqual(pitch.presentedTo.includes("Kajal Sharma"), true);
    assert.strictEqual(pitch.celebrityJudge.includes("Celina Jaitly"), true);
    assert.strictEqual(pitch.eventDate, "12 September 2026");
    assert.strictEqual(pitch.venue.includes("Radisson Blu"), true);
    assert.strictEqual(pitch.slides.length, 7);
  });
});
