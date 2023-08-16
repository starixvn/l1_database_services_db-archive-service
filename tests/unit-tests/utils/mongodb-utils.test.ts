import { jest } from "@jest/globals";
import { ChangeStreamNameSpace } from "mongodb";
import { getNamespaceString } from "../../../src/utils/mongodb-utils";

afterAll(() => {
    jest.clearAllMocks();
});

describe("MongoDB utilities", () => {
    it("[function getNamespaceString]", () => {
        const testCases: [ChangeStreamNameSpace, string][] = [
            [{ db: "admin", coll: "system.users" }, "admin.system.users"],
            [{ db: "minigame", coll: "game_configs" }, "minigame.game_configs"],
        ];

        for (const [testCase, expectResult] of testCases) {
            const result = getNamespaceString(testCase);
            expect(result.valueOf()).toBe(expectResult);
        }
    });
});
