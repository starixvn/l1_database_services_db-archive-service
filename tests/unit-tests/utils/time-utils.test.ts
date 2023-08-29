import { jest } from "@jest/globals";
import { ensureTime } from "../../../src/utils/time-utils";

afterAll(() => {
    jest.clearAllMocks();
});

describe("Time utilities", () => {
    it("[function ensureTime]", () => {
        const mockNow = 1690848000000;
        jest.useFakeTimers().setSystemTime(mockNow);

        const testCases: [string, number][] = [
            ["2023-01-01", 1672531200000],
            ["", mockNow],
        ];

        for (const [testCase, expectResult] of testCases) {
            const result = ensureTime(testCase).valueOf();
            expect(result.valueOf()).toBe(expectResult);
        }

        jest.useRealTimers();
    });
});
