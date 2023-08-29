import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Scheduler } from "@ldb/scheduler";
import { GenericListener, TypedEventEmitter } from "@ldb/types";
import { waitMs } from "@ldb/utils";
import { Collection, Document } from "mongodb";
import { logger } from "../../../src/loggers";
import { ArchiveInitiator } from "../../../src/modules/archive-initiator";
import { AliasConfig, ArchiveConfig, ChildArchiveConfig, GameConfigInfo, SchemaArchiveConfig, SchemaChildArchiveConfig } from "../../../src/types/archive-config";

afterEach(() => {
    jest.clearAllMocks();
});

interface TestArchiveInitiator {
    getCutoffTime: (arg1?: number) => Date;
    buildFilter: (arg1?: Document, arg2?: string, arg3?: Date) => Document;
    parseArchiveConfig: (arg1: SchemaArchiveConfig) => ArchiveConfig;
    parseChildArchiveConfigs: (arg1: SchemaChildArchiveConfig[], arg2: GameConfigInfo) => ChildArchiveConfig[];
}

const TestArchiveInitiator = ArchiveInitiator as unknown as TestArchiveInitiator;

describe("[class ArchiveInitiator]", () => {
    describe("[static function getCutoffTime]", () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(0);
        });
        afterEach(() => {
            jest.useRealTimers();
        });

        it("Default parameter", () => {
            expect(TestArchiveInitiator.getCutoffTime().valueOf()).toEqual(0);
        });

        it("With paramteter", () => {
            const testCases = [-24, -2, -1, 0, 1, 2, 24];

            for (const testCase of testCases) {
                expect(TestArchiveInitiator.getCutoffTime(testCase).valueOf()).toEqual(testCase * 3_600_000);
            }
        });
    });

    describe("[static function buildFilter]", () => {
        const staticFilter = { "__archive.eventtime": { $exists: false } };

        it("Empty parameters", () => {
            expect(TestArchiveInitiator.buildFilter()).toEqual(staticFilter);
        });

        it("With custom filter only", () => {
            const testCases = [{ time: { $lt: new Date("2023-08-01") } }, { playerId: { $gt: 0 } }];

            for (const testCase of testCases) {
                expect(TestArchiveInitiator.buildFilter(testCase)).toEqual({ ...staticFilter, ...testCase });
            }
        });

        it("With time filter config only", () => {
            const testCases: [string, Date][] = [
                ["time", new Date("2023-08-01")],
                ["hitTime", new Date("2023-08-02")],
            ];

            for (const [field, value] of testCases) {
                expect(TestArchiveInitiator.buildFilter(undefined, field, value)).toEqual({ ...staticFilter, $expr: { $lt: [{ $toDate: `$${field}` }, { $literal: value }] } });
                expect(TestArchiveInitiator.buildFilter({}, field, value)).toEqual({ ...staticFilter, $expr: { $lt: [{ $toDate: `$${field}` }, { $literal: value }] } });
            }
        });

        it("With both custom filter & time filter config", () => {
            const testFilters = [{ time: { $lt: new Date("2023-08-01") } }, { playerId: { $gt: 0 } }];
            const testTimeConfigs: [string, Date][] = [
                ["time", new Date("2023-08-01")],
                ["hitTime", new Date("2023-08-02")],
            ];

            for (const testFilter of testFilters) {
                for (const [field, value] of testTimeConfigs) {
                    expect(TestArchiveInitiator.buildFilter(testFilter, field, value)).toEqual({
                        ...staticFilter,
                        ...testFilter,
                        $expr: { $lt: [{ $toDate: "$" + field }, { $literal: value }] },
                    });
                }
            }
        });

        it("Invalid time filter config", () => {
            expect(TestArchiveInitiator.buildFilter(undefined, "time")).toEqual(staticFilter);
            expect(TestArchiveInitiator.buildFilter(undefined, "", new Date())).toEqual(staticFilter);
            expect(TestArchiveInitiator.buildFilter(undefined, undefined, new Date())).toEqual(staticFilter);
        });
    });

    describe("[static function parseArchiveConfig]", () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(0);
        });
        afterEach(() => {
            jest.useRealTimers();
        });

        it("Correctly parse archive config", () => {
            const testCases: [SchemaArchiveConfig, ArchiveConfig][] = [
                [
                    {
                        category: "logs",
                        type: 0,
                        id: 0,
                        gameConfigs: { type: "log", name: "audit_events" },
                        from: { db: "log", postfix: "" },
                        to: { db: "log_arc", postfix: "_bk" },
                        alias: { time: "StartDate" },
                    },
                    {
                        category: "logs",
                        type: 0,
                        id: 0,
                        gameConfigs: { type: "log", name: "audit_events" },
                        from: { db: "log", coll: "audit_events" },
                        to: { db: "log_arc", coll: "audit_events_bk" },
                        alias: { time: "StartDate" },
                        filter: {
                            "__archive.eventtime": { $exists: false },
                            $expr: { $lt: [{ $toDate: "$StartDate" }, { $literal: new Date(0) }] },
                        },
                        config: { cutoffTime: new Date(0), localField: undefined, updateOnly: false },
                        childs: [],
                    } as ArchiveConfig,
                ],
                [
                    {
                        category: "games",
                        type: 0,
                        id: 5,
                        gameConfigs: { gameId: 1, name: "taixiu" },
                        from: { db: "minigame", postfix: "_cuocs" },
                        to: { db: "minigame_arc", postfix: "_cuocs_bk" },
                        alias: { time: "time" },
                        config: { cutOffsetHours: -24 * 8, updateOnly: true },
                        filter: '{"playerId":null}',
                    },
                    {
                        category: "games",
                        type: 0,
                        id: 5,
                        gameConfigs: { gameId: 1, name: "taixiu" },
                        from: { db: "minigame", coll: "taixiu_cuocs" },
                        to: { db: "minigame_arc", coll: "taixiu_cuocs_bk" },
                        alias: { time: "time" },
                        filter: {
                            "__archive.eventtime": { $exists: false },
                            playerId: null,
                            $expr: { $lt: [{ $toDate: "$time" }, { $literal: new Date(-192 * 3_600_000) }] },
                        },
                        config: { cutoffTime: new Date(-192 * 3_600_000), localField: undefined, updateOnly: true },
                        childs: [],
                    } as ArchiveConfig,
                ],
                [
                    {
                        category: "games",
                        type: 0,
                        id: 0,
                        gameConfigs: { gameId: 1, name: "taixiu" },
                        from: { db: "minigame", postfix: "_phiens" },
                        to: { db: "minigame_arc", postfix: "_phiens_bk" },
                        alias: { time: "time" },
                        config: { cutOffsetHours: -24, localField: "id" },
                        childs: [
                            {
                                from: { db: "minigame", postfix: "_cuocs" },
                                to: { db: "minigame_arc", postfix: "_cuocs_bk" },
                                config: { foreignField: "roundId" },
                                filter: '{"playerId":{"$gt":0}}',
                            },
                            {
                                from: { db: "minigame", postfix: "_ones" },
                                to: { db: "minigame_arc", postfix: "_ones_bk" },
                                config: { foreignField: "roundId" },
                                filter: '{"playerId":{"$gt":0}}',
                                log: { field: "_ones", value: "id" },
                            },
                            { from: { db: "minigame", postfix: "_results" }, to: { db: "minigame_arc", postfix: "_results_bk" }, config: { foreignField: "roundId" } },
                        ],
                        log: { field: "_phiens", value: "id" },
                    },
                    {
                        category: "games",
                        type: 0,
                        id: 0,
                        gameConfigs: { gameId: 1, name: "taixiu" },
                        from: { db: "minigame", coll: "taixiu_phiens" },
                        to: { db: "minigame_arc", coll: "taixiu_phiens_bk" },
                        alias: { time: "time" },
                        filter: {
                            "__archive.eventtime": { $exists: false },
                            $expr: { $lt: [{ $toDate: "$time" }, { $literal: new Date(-24 * 3_600_000) }] },
                        },
                        config: { cutoffTime: new Date(-24 * 3_600_000), localField: "id", updateOnly: false },
                        childs: [
                            {
                                from: { db: "minigame", coll: "taixiu_cuocs" },
                                to: { db: "minigame_arc", coll: "taixiu_cuocs_bk" },
                                filter: {
                                    "__archive.eventtime": { $exists: false },
                                    playerId: { $gt: 0 },
                                },
                                config: { foreignField: "roundId", updateOnly: false },
                            },
                            {
                                from: { db: "minigame", coll: "taixiu_ones" },
                                to: { db: "minigame_arc", coll: "taixiu_ones_bk" },
                                filter: {
                                    "__archive.eventtime": { $exists: false },
                                    playerId: { $gt: 0 },
                                },
                                config: { foreignField: "roundId", updateOnly: false },
                                log: { field: "_ones", value: "id" },
                            },
                            {
                                from: { db: "minigame", coll: "taixiu_results" },
                                to: { db: "minigame_arc", coll: "taixiu_results_bk" },
                                filter: {
                                    "__archive.eventtime": { $exists: false },
                                },
                                config: { foreignField: "roundId", updateOnly: false },
                            },
                        ],
                        log: { field: "_phiens", value: "id" },
                    } as ArchiveConfig,
                ],
            ];

            for (const [input, output] of testCases) {
                expect(TestArchiveInitiator.parseArchiveConfig(input)).toEqual(output);
            }
        });

        it("Default values", () => {
            const testCases: [SchemaArchiveConfig, ArchiveConfig][] = [
                [
                    {
                        category: "test-default",
                        type: 0,
                        id: 0,
                        gameConfigs: { name: "collection" },
                        from: { db: "test_from", postfix: "" },
                        to: { db: "test_to", postfix: "_bk" },
                    },
                    {
                        category: "test-default",
                        type: 0,
                        id: 0,
                        gameConfigs: { name: "collection" },
                        from: { db: "test_from", coll: "collection" },
                        to: { db: "test_to", coll: "collection_bk" },
                        alias: { time: "" },
                        filter: {
                            "__archive.eventtime": { $exists: false },
                        },
                        config: { cutoffTime: new Date(0), localField: undefined, updateOnly: false },
                        childs: [],
                    } as ArchiveConfig,
                ],
                [
                    {
                        category: "test-default",
                        type: 0,
                        id: 0,
                        gameConfigs: { name: "collection" },
                        from: { db: "test_from", postfix: "" },
                        to: { db: "test_to", postfix: "_bk" },
                        alias: {} as AliasConfig,
                    },
                    {
                        category: "test-default",
                        type: 0,
                        id: 0,
                        gameConfigs: { name: "collection" },
                        from: { db: "test_from", coll: "collection" },
                        to: { db: "test_to", coll: "collection_bk" },
                        alias: {} as AliasConfig,
                        filter: {
                            "__archive.eventtime": { $exists: false },
                        },
                        config: { cutoffTime: new Date(0), localField: undefined, updateOnly: false },
                        childs: [],
                    } as ArchiveConfig,
                ],
            ];

            for (const [input, output] of testCases) {
                expect(TestArchiveInitiator.parseArchiveConfig(input)).toEqual(output);
            }
        });
    });

    describe("[static function parseChildArchiveConfigs]", () => {
        it("Correctly parse child archive config", () => {
            const testCases: [SchemaChildArchiveConfig[], GameConfigInfo, ChildArchiveConfig[]][] = [
                [
                    [{ from: { db: "minigame", postfix: "_results" }, to: { db: "minigame_arc", postfix: "_results_bk" }, config: { foreignField: "roundId" } }],
                    { gameId: 1, name: "taixiu" },
                    [
                        {
                            from: { db: "minigame", coll: "taixiu_results" },
                            to: { db: "minigame_arc", coll: "taixiu_results_bk" },
                            filter: {
                                "__archive.eventtime": { $exists: false },
                            },
                            config: { foreignField: "roundId", updateOnly: false },
                        },
                    ],
                ],
                [
                    [
                        {
                            from: { db: "minigame", postfix: "_cuocs" },
                            to: { db: "minigame_arc", postfix: "_cuocs_bk" },
                            config: { foreignField: "roundId" },
                            filter: '{"playerId":{"$gt":0}}',
                        },
                        {
                            from: { db: "minigame", postfix: "_ones" },
                            to: { db: "minigame_arc", postfix: "_ones_bk" },
                            config: { foreignField: "roundId" },
                            filter: '{"playerId":{"$gt":0}}',
                            log: { field: "_ones", value: "id" },
                        },
                    ],
                    { gameId: 1, name: "taixiu" },
                    [
                        {
                            from: { db: "minigame", coll: "taixiu_cuocs" },
                            to: { db: "minigame_arc", coll: "taixiu_cuocs_bk" },
                            filter: {
                                "__archive.eventtime": { $exists: false },
                                playerId: { $gt: 0 },
                            },
                            config: { foreignField: "roundId", updateOnly: false },
                        },
                        {
                            from: { db: "minigame", coll: "taixiu_ones" },
                            to: { db: "minigame_arc", coll: "taixiu_ones_bk" },
                            filter: {
                                "__archive.eventtime": { $exists: false },
                                playerId: { $gt: 0 },
                            },
                            config: { foreignField: "roundId", updateOnly: false },
                            log: { field: "_ones", value: "id" },
                        },
                    ],
                ],
            ];

            for (const [input, gameConfig, output] of testCases) {
                expect(TestArchiveInitiator.parseChildArchiveConfigs(input, gameConfig)).toEqual(output);
            }
        });

        it("Default values", () => {
            const testCases: [SchemaChildArchiveConfig[], GameConfigInfo, ChildArchiveConfig[]][] = [
                [
                    [
                        {
                            from: { db: "test_from", postfix: "" },
                            to: { db: "test_to", postfix: "_bk" },
                            config: { foreignField: "joined" },
                        },
                    ],
                    { name: "collection" },
                    [
                        {
                            from: { db: "test_from", coll: "collection" },
                            to: { db: "test_to", coll: "collection_bk" },
                            filter: { "__archive.eventtime": { $exists: false } },
                            config: { foreignField: "joined", updateOnly: false },
                        },
                    ],
                ],
            ];

            for (const [input, gameConfig, output] of testCases) {
                expect(TestArchiveInitiator.parseChildArchiveConfigs(input, gameConfig)).toEqual(output);
            }
        });

        it("Empty input", () => {
            expect(TestArchiveInitiator.parseChildArchiveConfigs([], { name: "test" })).toEqual([]);
        });
    });

    describe("Instance", () => {
        const mockFind = jest.fn().mockReturnValue([
            {
                category: "summaries",
                type: 0,
                id: 0,
                gameConfigs: { type: "sum", name: "round_summaries" },
                from: { db: "summary", postfix: "" },
                to: { db: "summary_arc", postfix: "_bk" },
                alias: { time: "time" },
                config: { cutOffsetHours: -24 * 8 },
            },
            {
                category: "summaries",
                type: 0,
                id: 0,
                gameConfigs: { type: "sum", name: "hourly_summaries" },
                from: { db: "summary", postfix: "" },
                to: { db: "summary_arc", postfix: "_bk" },
                alias: { time: "time" },
                config: { cutOffsetHours: -24 * 8 },
            },
        ]);
        const mockCollection = { find: mockFind } as unknown as Collection;
        const mockListener = jest.fn<GenericListener>();
        const mockScheduler = new TypedEventEmitter() as unknown as Scheduler;

        const archiveInitiator = new ArchiveInitiator(mockCollection);

        it("Class name", () => {
            expect(archiveInitiator.className).toEqual("ArchiveInitiator");
        });

        it("Triggered on event", async () => {
            jest.spyOn(Date, "now").mockReturnValue(0);
            const spyLogWarning = jest.spyOn(logger, "logWarning").mockImplementation(() => null);
            const expectDate = new Date(-192 * 3_600_000);

            archiveInitiator.addListener("ARCHIVE", mockListener);
            archiveInitiator.subscribe(mockScheduler);
            archiveInitiator.subscribe(mockScheduler);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockScheduler.emit("RUN_ARCHIVE");
            await waitMs(100);

            expect(mockFind).toHaveBeenCalledTimes(1);
            expect(mockListener).toHaveBeenCalledTimes(2);
            expect(mockListener).toHaveBeenNthCalledWith(1, {
                category: "summaries",
                type: 0,
                id: 0,
                gameConfigs: { type: "sum", name: "round_summaries" },
                from: { db: "summary", coll: "round_summaries" },
                to: { db: "summary_arc", coll: "round_summaries_bk" },
                alias: { time: "time" },
                filter: { "__archive.eventtime": { $exists: false }, $expr: { $lt: [{ $toDate: "$time" }, { $literal: expectDate }] } },
                config: { cutoffTime: expectDate, localField: undefined, updateOnly: false },
                childs: [],
            });
            expect(mockListener).toHaveBeenNthCalledWith(2, {
                category: "summaries",
                type: 0,
                id: 0,
                gameConfigs: { type: "sum", name: "hourly_summaries" },
                from: { db: "summary", coll: "hourly_summaries" },
                to: { db: "summary_arc", coll: "hourly_summaries_bk" },
                alias: { time: "time" },
                filter: { "__archive.eventtime": { $exists: false }, $expr: { $lt: [{ $toDate: "$time" }, { $literal: expectDate }] } },
                config: { cutoffTime: expectDate, localField: undefined, updateOnly: false },
                childs: [],
            });

            mockFind.mockClear();
            mockListener.mockClear();
            spyLogWarning.mockClear();

            archiveInitiator.unsubscribe(mockScheduler);
            archiveInitiator.unsubscribe(mockScheduler);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockScheduler.emit("RUN_ARCHIVE");
            await waitMs(100);

            expect(mockFind).toHaveBeenCalledTimes(0);
            expect(mockListener).toHaveBeenCalledTimes(0);
        }, 1000);
    });
});
