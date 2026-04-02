export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  maxSize: number;
  concurrency: number;
}

export class IngestionQueue {
  private pending: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  private activeCount = 0;
  private completedCount = 0;
  private failedCount = 0;
  private readonly concurrency: number;
  private readonly maxSize: number;

  constructor(options: { concurrency: number; maxSize: number }) {
    this.concurrency = options.concurrency;
    this.maxSize = options.maxSize;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    if (this.pending.length >= this.maxSize) {
      const error = new Error("Queue is full");
      (error as Error & { status: number }).status = 429;
      throw error;
    }

    return new Promise<T>((resolve, reject) => {
      this.pending.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.process();
    });
  }

  stats(): QueueStats {
    return {
      pending: this.pending.length,
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      maxSize: this.maxSize,
      concurrency: this.concurrency,
    };
  }

  private process(): void {
    while (this.activeCount < this.concurrency && this.pending.length > 0) {
      const item = this.pending.shift();
      if (!item) break;

      this.activeCount++;
      item
        .fn()
        .then((result) => {
          this.completedCount++;
          item.resolve(result);
        })
        .catch((error) => {
          this.failedCount++;
          item.reject(error);
        })
        .finally(() => {
          this.activeCount--;
          this.process();
        });
    }
  }
}
