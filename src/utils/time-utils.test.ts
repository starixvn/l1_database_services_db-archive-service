import { ObjectId, Timestamp } from "@ldb/mongo";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTime } from "./time.js";

describe("Time utilities", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("[function ensureTime]", () => {
        const mockNow = 1690848000000;
        vi.setSystemTime(mockNow);

        const testCases: [...Parameters<typeof ensureTime>, number][] = [
            ["2023-01-01", 1672531200000],
            ["", mockNow],
            [new Date("2023-01-01"), 1672531200000],
            [ObjectId.createFromTime(new Date("2023-01-01").valueOf() / 1_000), 1672531200000],
            [new Timestamp({ t: 1672531200, i: 0 }), 1672531200000],
            [false as never, mockNow],
        ];

        for (const [testCase, expectResult] of testCases) {
            expect(ensureTime(testCase).valueOf()).toBe(expectResult);
        }
    });
});
