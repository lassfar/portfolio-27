/** Builds waiting their turn. */
const queue: (() => void)[] = [];
let scheduled = false;

const runNext = () => {
  scheduled = false;
  queue.shift()?.();
  if (queue.length) schedule();
};

function schedule() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(runNext, 0);
}

/**
 * Queues a dotted figure's build (P27-95): one per task, so the figures coming near the
 * screen together (the cover and Saturn, at first) don't build in one long task. Returns
 * the cancel.
 */
export function queueDotBuild(build: () => void): () => void {
  queue.push(build);
  schedule();
  return () => {
    const i = queue.indexOf(build);
    if (i >= 0) queue.splice(i, 1);
  };
}
