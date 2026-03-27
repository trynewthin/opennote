/**
 * Debounced persist utility for graphStore.
 *
 * schedulePersist(fn) - debounce file writes; only the last call within the
 *   delay window is actually executed.
 * flushPendingSave()  - cancel the pending timer and execute immediately.
 *   Call this on beforeunload / visibilitychange to ensure no data is lost.
 */

let pendingFn: (() => Promise<void>) | null = null;
let timerId: ReturnType<typeof setTimeout> | null = null;

export function schedulePersist(fn: () => Promise<void>, delayMs = 600): void {
    pendingFn = fn;
    if (timerId !== null) {
        clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
        timerId = null;
        const toRun = pendingFn;
        pendingFn = null;
        if (toRun) void toRun();
    }, delayMs);
}

export async function flushPendingSave(): Promise<void> {
    if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
    }
    const toRun = pendingFn;
    pendingFn = null;
    if (toRun) await toRun();
}
