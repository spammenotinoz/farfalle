// Cross-browser smoke test for the Deep Research streaming UI.
//
// Manual cross-browser checklist (kept here so it lives next to the spec it
// complements; do not move to a separate doc that nobody reads):
//
//   For each of: Chrome on Windows, Edge on Windows, Safari on macOS, Chrome on macOS
//     1. Submit a Brief query and confirm:
//        - The elapsed timer ticks every second.
//        - The source counter grows as steps complete.
//        - "Reading source N of M" appears during page-read phase.
//        - Final answer markdown renders.
//        - DevTools console shows zero errors.
//     2. Mid-stream, switch the tab to background for ~10s, then return.
//        - The run completes without stalling.
//        - The timer reflects accurate elapsed time (not paused at the value
//          from when you backgrounded).
//     3. Force an error (kill backend) and confirm the Try-again button appears
//        and recovers the query when clicked.

import { test, expect } from "@playwright/test";
import {
  buildFixture,
  FIXTURE_QUERY,
  FIXTURE_REPORT_TEXT,
  FIXTURE_SOURCE_HOST,
  FIXTURE_FAILED_COUNT,
  FIXTURE_PAGES_TOTAL,
} from "./fixtures/sse-stream";

test.describe("Deep Research streaming UI", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the SSE backend. We use route.fulfill with a pre-built body —
    // fetch-event-source parses the entire payload once it arrives. If you
    // need to test inter-event timing (e.g. stall detection), swap to a
    // chunked stream via route.continue() with a custom Response.
    await page.route("**/chat", async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          "x-accel-buffering": "no",
        },
        body: buildFixture(),
      });
    });
  });

  test("renders streaming progress, sources, failed-source count, and final report", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");

    // Submit the query through the ask-input.
    const input = page.getByRole("textbox").first();
    await input.fill(FIXTURE_QUERY);
    await input.press("Enter");

    // Research card appears.
    const researchCard = page.getByTestId("research-card");
    await expect(researchCard).toBeVisible();

    // Eventually completes.
    await expect(researchCard).toHaveAttribute(
      "data-research-complete",
      "true",
      { timeout: 15_000 },
    );

    // Source count badge is populated.
    const sourceCount = page.getByTestId("source-count");
    await expect(sourceCount).toContainText(/\d+ sources/);

    // Failed-source disclosure is surfaced.
    await expect(sourceCount).toContainText(
      `${FIXTURE_FAILED_COUNT} unavailable`,
    );

    // Elapsed timer rendered in m:ss format (only on viewports >= sm; the
    // Playwright default desktop viewport satisfies this).
    const elapsed = page.getByTestId("elapsed-timer");
    await expect(elapsed).toBeVisible();
    await expect(elapsed).toHaveText(/^\d+:\d{2}$/);

    // Final report content rendered.
    const answer = page.getByTestId("research-answer");
    await expect(answer).toContainText("Reciprocal Rank Fusion");
    await expect(answer).toContainText(FIXTURE_REPORT_TEXT.split(" ")[0]);

    // No retry button on the success path.
    await expect(page.getByTestId("retry-button")).toHaveCount(0);

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });

  test("renders Try again button when an error message arrives", async ({
    page,
  }) => {
    // Override the route just for this test: emit a single ERROR event.
    await page.route("**/chat", async (route) => {
      const body =
        `event: error\ndata: ${JSON.stringify({
          event: "error",
          data: { event_type: "error", detail: "Search provider unavailable." },
        })}\n\n`;
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body,
      });
    });

    await page.goto("/");
    const input = page.getByRole("textbox").first();
    await input.fill(FIXTURE_QUERY);
    await input.press("Enter");

    const retry = page.getByTestId("retry-button");
    await expect(retry).toBeVisible({ timeout: 10_000 });
    await expect(retry).toBeFocused();
  });
});
