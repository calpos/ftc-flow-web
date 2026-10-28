import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetRemoteWriteSequencerForTests,
  sequenceWrite,
  settleAll,
} from "@/lib/beta/store/remoteWriteSequencer";

const A = "3c7a9e15-2b8d-4f6a-9e1c-8d4b2a7f5e03";
const B = "7e2b4d91-5c6a-4f38-a1d7-9b3e8c2f6a14";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Lets queued writes start.
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  resetRemoteWriteSequencerForTests();
});

describe("sequenceWrite", () => {
  it("calls the write synchronously, once, when nothing is pending", async () => {
    const write = vi.fn(async () => "done");
    const result = sequenceWrite([A], write);
    expect(write).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toBe("done");
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("waits for the previous write to the same key", async () => {
    const first = deferred<void>();
    sequenceWrite([A], () => first.promise);
    const second = vi.fn(async () => {});
    const result = sequenceWrite([A], second);

    await settle();
    expect(second).not.toHaveBeenCalled();

    first.resolve();
    await result;
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("runs the next write after a rejected one, and resolves it", async () => {
    const first = deferred<void>();
    const failed = sequenceWrite([A], () => first.promise);
    const second = vi.fn(async () => "second");
    const result = sequenceWrite([A], second);

    first.reject(new Error("boom"));
    await expect(failed).rejects.toThrow("boom");
    await expect(result).resolves.toBe("second");
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("runs writes to different keys in parallel", () => {
    sequenceWrite([A], () => deferred<void>().promise);
    const other = vi.fn(async () => {});
    sequenceWrite([B], other);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("waits for the previous write to every key", async () => {
    const a = deferred<void>();
    const b = deferred<void>();
    sequenceWrite([A], () => a.promise);
    sequenceWrite([B], () => b.promise);
    const both = vi.fn(async () => {});
    sequenceWrite([A, B], both);

    a.resolve();
    await settle();
    expect(both).not.toHaveBeenCalled();

    b.resolve();
    await settle();
    expect(both).toHaveBeenCalledTimes(1);
  });

  it("ignores undefined and empty keys", () => {
    sequenceWrite([undefined, ""], () => deferred<void>().promise);
    const unkeyed = vi.fn(async () => {});
    sequenceWrite([undefined, ""], unkeyed);
    expect(unkeyed).toHaveBeenCalledTimes(1);

    sequenceWrite([A, undefined], () => deferred<void>().promise);
    const elsewhere = vi.fn(async () => {});
    sequenceWrite([B, undefined], elsewhere);
    expect(elsewhere).toHaveBeenCalledTimes(1);
  });

  it("frees a key once its last write settles, while a later write still holds another", async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    sequenceWrite([A, B], () => first.promise);
    const secondWrite = vi.fn(() => second.promise);
    sequenceWrite([B], secondWrite);

    first.resolve();
    await settle();
    expect(secondWrite).toHaveBeenCalledTimes(1);

    const onA = vi.fn(async () => {});
    sequenceWrite([A], onA);
    expect(onA).toHaveBeenCalledTimes(1);

    const onB = vi.fn(async () => {});
    sequenceWrite([B], onB);
    await settle();
    expect(onB).not.toHaveBeenCalled();

    second.resolve();
    await settle();
    expect(onB).toHaveBeenCalledTimes(1);
  });

  it("cleans up settled keys, so a later write starts synchronously", async () => {
    await sequenceWrite([A, B], async () => {});
    await sequenceWrite([A], () => Promise.reject(new Error("boom"))).catch(() => {});

    const later = vi.fn(async () => {});
    sequenceWrite([A, B], later);
    expect(later).toHaveBeenCalledTimes(1);
  });

  it("turns a synchronous throw into a rejection", async () => {
    const throws = () => {
      throw new Error("sync");
    };
    let result: Promise<unknown> | undefined;
    expect(() => {
      result = sequenceWrite([A], throws);
    }).not.toThrow();
    await expect(result).rejects.toThrow("sync");

    const first = deferred<void>();
    sequenceWrite([B], () => first.promise);
    const queued = sequenceWrite([B], throws);
    first.resolve();
    await expect(queued).rejects.toThrow("sync");
  });
});

describe("settleAll", () => {
  it("waits for every promise after an early rejection, then rejects with the first", async () => {
    const slow = deferred<void>();
    const late = deferred<void>();
    let done = false;
    const all = settleAll([slow.promise, Promise.reject(new Error("first")), late.promise]).finally(
      () => {
        done = true;
      },
    );
    all.catch(() => {});

    await settle();
    expect(done).toBe(false);

    late.reject(new Error("second"));
    await settle();
    expect(done).toBe(false);

    slow.resolve();
    await expect(all).rejects.toThrow("first");
  });

  it("resolves when every promise resolves", async () => {
    await expect(settleAll([Promise.resolve(1), Promise.resolve()])).resolves.toBeUndefined();
  });
});
