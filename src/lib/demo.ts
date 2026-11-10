// The rally of 18 November 2026: "Mehr dazu" in the notice bar and its popup (src/components/DemoInfo.astro).
// The site is rebuilt every hour, so both disappear with the first build after the rally day.

export const DEMO_END = new Date('2026-11-19T00:00:00+01:00');

export const demoActive = (now: Date = new Date()): boolean => now.getTime() < DEMO_END.getTime();
