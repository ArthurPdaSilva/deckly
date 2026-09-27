import type { Scheduler, SchedulerAlgorithm } from "./domain/scheduler";
import { FsrsScheduler } from "./fsrsScheduler";
import { Sm2Scheduler } from "./sm2Scheduler";

export function createScheduler(algorithm: SchedulerAlgorithm): Scheduler {
  return algorithm === "fsrs" ? new FsrsScheduler() : new Sm2Scheduler();
}
