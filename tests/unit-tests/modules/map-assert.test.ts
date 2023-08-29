import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { MapAssert } from "../../../src/modules/map-assert";

afterEach(() => {
    jest.clearAllMocks();
});

describe("[class MapAssert]", () => {
    it("MapAssert return value just like Map", () => {
        const mapAssert = new MapAssert();
        const map = new Map();

        const testCases = [
            ["keyNum", 12345],
            ["keyString", "aabbcc"],
            ["keyBool", true],
            ["keyObject", { a: 1 }],
        ];

        for (const [key, value] of testCases) {
            mapAssert.set(key, value);
            map.set(key, value);
        }

        for (const [key] of testCases) {
            expect(mapAssert.get(key)).toBe(map.get(key));
        }
    });

    it("MapAssert throws when access non-set data", () => {
        const mapAssert = new MapAssert();

        const data = [
            ["keyNum", 12345],
            ["keyString", "aabbcc"],
            ["keyBool", true],
            ["keyObject", { a: 1 }],
        ];

        for (const [key, value] of data) {
            mapAssert.set(key, value);
        }

        const testCases = ["nonExistKeyNum", "nonExistKeyString", "nonExistKeyBool", "nonExistKeyObject", "keynum", "keystring", "keybool", "keyobject"];
        for (const [key] of testCases) {
            expect(() => mapAssert.get(key)).toThrow(TypeError);
            expect(() => mapAssert.get(key)).toThrow(`Failed to get value of ${key}`);

            expect(() => mapAssert.get(key, key)).toThrow(TypeError);
            expect(() => mapAssert.get(key, key)).toThrow(key);
        }
    });
});
