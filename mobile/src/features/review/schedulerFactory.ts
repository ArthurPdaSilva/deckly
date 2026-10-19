import type { Scheduler, SchedulerAlgorithm } from "./domain/scheduler";
import { FsrsScheduler } from "./fsrsScheduler";
import { Sm2Scheduler } from "./sm2Scheduler";

export interface SchedulerOptions {
  retention?: number;
}

export function createScheduler(
  algorithm: SchedulerAlgorithm,
  options: SchedulerOptions = {},
): Scheduler {
  return algorithm === "fsrs"
    ? new FsrsScheduler(options.retention)
    : new Sm2Scheduler();
}
