import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { GenericListener, TypedEventEmitter } from "@ldb/types";
import { waitMs } from "@ldb/utils";
import { logger } from "../../../src/loggers";
import { ArchiveInitiator } from "../../../src/modules/archive-initiator";
import { ArchiveProcessor } from "../../../src/modules/archive-processor";
import { ArchiveConfig } from "../../../src/types/archive-config";

afterEach(() => {
    jest.clearAllMocks();
});

describe("[class ArchiveProcessor]", () => {
    describe("Instance", () => {
        const mockEmitter = new TypedEventEmitter() as unknown as ArchiveInitiator;

        const archiveProcessor = new ArchiveProcessor();

        it("Class name", () => {
            expect(archiveProcessor.className).toEqual("ArchiveProcessor");
        });

        it("Archive data of single collection", async () => {
            const testCase1 = {
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
            } as ArchiveConfig;
            const testCase2 = {
                category: "logs",
                type: 0,
                id: 1,
                gameConfigs: { type: "log", name: "bets" },
                from: { db: "log", coll: "bets" },
                to: { db: "log_arc", coll: "bets_bk" },
                alias: { time: "requestTimeStamp" },
                filter: {
                    "__archive.eventtime": { $exists: false },
                    $expr: { $lt: [{ $toDate: "$requestTimeStamp" }, { $literal: new Date(1) }] },
                },
                config: { cutoffTime: new Date(1), localField: undefined, updateOnly: false },
                childs: [],
                log: { field: "bets", value: "id" },
            } as ArchiveConfig;

            const mockListenerSingle = jest.fn<GenericListener>();
            const mockListenerMultiple = jest.fn<GenericListener>();
            const spyLogWarning = jest.spyOn(logger, "logWarning").mockImplementation(() => null);

            archiveProcessor.addListener("COPY_SINGLE", mockListenerSingle);
            archiveProcessor.addListener("COPY_MULTIPLE", mockListenerMultiple);
            archiveProcessor.subscribe(mockEmitter);
            archiveProcessor.subscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("ARCHIVE", testCase1);
            mockEmitter.emit("ARCHIVE", testCase2);
            await waitMs(100);

            expect(mockListenerSingle).toHaveBeenCalledTimes(2);
            expect(mockListenerSingle).toHaveBeenCalledWith(
                0,
                { db: "log", coll: "audit_events" },
                { db: "log_arc", coll: "audit_events_bk" },
                {
                    "__archive.eventtime": { $exists: false },
                    $expr: { $lt: [{ $toDate: "$StartDate" }, { $literal: new Date(0) }] },
                },
                { name: "audit_events", updateOnly: false, timeAlias: "StartDate" },
                undefined
            );
            expect(mockListenerSingle).toHaveBeenCalledWith(
                1,
                { db: "log", coll: "bets" },
                { db: "log_arc", coll: "bets_bk" },
                {
                    "__archive.eventtime": { $exists: false },
                    $expr: { $lt: [{ $toDate: "$requestTimeStamp" }, { $literal: new Date(1) }] },
                },
                { name: "bets", updateOnly: false, timeAlias: "requestTimeStamp" },
                { field: "bets", value: "id" }
            );
            expect(mockListenerMultiple).toHaveBeenCalledTimes(0);

            mockListenerSingle.mockClear();
            mockListenerMultiple.mockClear();
            spyLogWarning.mockClear();

            archiveProcessor.unsubscribe(mockEmitter);
            archiveProcessor.unsubscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("ARCHIVE", testCase1);
            mockEmitter.emit("ARCHIVE", testCase2);
            await waitMs(100);

            expect(mockListenerSingle).toHaveBeenCalledTimes(0);
            expect(mockListenerMultiple).toHaveBeenCalledTimes(0);

            spyLogWarning.mockReset();
        }, 1000);

        it("Archive data of multiple collections", async () => {
            const testCase = {
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
            } as ArchiveConfig;

            const mockListenerSingle = jest.fn<GenericListener>();
            const mockListenerMultiple = jest.fn<GenericListener>();
            const spyLogWarning = jest.spyOn(logger, "logWarning").mockImplementation(() => null);

            archiveProcessor.addListener("COPY_SINGLE", mockListenerSingle);
            archiveProcessor.addListener("COPY_MULTIPLE", mockListenerMultiple);
            archiveProcessor.subscribe(mockEmitter);
            archiveProcessor.subscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("ARCHIVE", testCase);
            await waitMs(100);

            expect(mockListenerSingle).toHaveBeenCalledTimes(0);
            expect(mockListenerMultiple).toHaveBeenCalledTimes(1);
            expect(mockListenerMultiple).toHaveBeenLastCalledWith(
                0,
                { db: "minigame", coll: "taixiu_phiens" },
                { db: "minigame_arc", coll: "taixiu_phiens_bk" },
                {
                    "__archive.eventtime": { $exists: false },
                    $expr: { $lt: [{ $toDate: "$time" }, { $literal: new Date(-24 * 3_600_000) }] },
                },
                {
                    name: "taixiu",
                    updateOnly: false,
                    timeAlias: "time",
                    localField: "id",
                    childArchiveConfigs: [
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
                },
                { field: "_phiens", value: "id" }
            );

            mockListenerSingle.mockClear();
            mockListenerMultiple.mockClear();
            spyLogWarning.mockClear();

            archiveProcessor.unsubscribe(mockEmitter);
            archiveProcessor.unsubscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("ARCHIVE", testCase);
            await waitMs(100);

            expect(mockListenerSingle).toHaveBeenCalledTimes(0);
            expect(mockListenerMultiple).toHaveBeenCalledTimes(0);

            spyLogWarning.mockReset();
        }, 1000);

        it("Invalid cases", async () => {
            const spyLogError = jest.spyOn(logger, "logError").mockImplementation(() => null);

            archiveProcessor.subscribe(mockEmitter);

            const testCase = {
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
                config: { cutoffTime: new Date(-24 * 3_600_000), localField: "", updateOnly: false },
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
            } as ArchiveConfig;

            mockEmitter.emit("ARCHIVE", testCase);
            await waitMs(100);

            expect(spyLogError).toHaveBeenCalledTimes(1);

            spyLogError.mockReset();
        }, 1000);
    });
});
