"use client";
import { useCallback, useEffect, useRef } from "react";

/**
 * Accumulates partial-update patches and flushes them through `commit` on a
 * trailing debounce, so a stream of edits (e.g. typing into a text field)
 * collapses into a single write instead of one per keystroke. Patches are
 * merged, so editing several fields within the debounce window persists them
 * together. Any pending patch is flushed on unmount so the last edit is never
 * lost when navigating away or switching tabs.
 *
 * `commit` is always read from a ref, so an inline (unstable) callback from the
 * parent still works without resetting the timer.
 */
export function useDebouncedUpdater<T extends object>(
  commit: (patch: Partial<T>) => void | Promise<void>,
  delay = 600,
) {
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  const pending = useRef<Partial<T>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (Object.keys(pending.current).length === 0) return;
    const patch = pending.current;
    pending.current = {};
    void commitRef.current(patch);
  }, []);

  const push = useCallback(
    (patch: Partial<T>) => {
      pending.current = { ...pending.current, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  // Flush whatever is pending when the component unmounts.
  useEffect(() => () => flush(), [flush]);

  return { push, flush };
}
