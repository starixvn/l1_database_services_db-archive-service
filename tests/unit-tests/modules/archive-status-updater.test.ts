import { afterEach, describe, jest } from "@jest/globals";
import { TypedEventEmitter } from "@ldb/types";
import { waitMs } from "@ldb/utils";
import { ChangeStreamNameSpace, Collection, Document, MongoClient } from "mongodb";
import { logger } from "../../../src/loggers";
import { ArchiveStatusUpdater } from "../../../src/modules/archive-status-updater";
import { DataArchiver } from "../../../src/modules/data-archiver";
import { ArchiveStatusConfig } from "../../../src/types/archive-config";

afterEach(() => {
    jest.clearAllMocks();
});

describe("[class ArchiveStatusUpdater]", () => {
    describe("Instance", () => {
        const mockEmitter = new TypedEventEmitter() as unknown as DataArchiver;
        const mockFindOne = jest.fn();
        const mockUpdateOne = jest.fn();
        const mockCollection = { findOne: mockFindOne, updateOne: mockUpdateOne } as unknown as Collection;
        const mockMongoCollection = jest.fn().mockReturnValue({ findOne: mockFindOne });
        const mockMongoDb = jest.fn().mockReturnValue({ collection: mockMongoCollection });
        const mockMongoClient = { db: mockMongoDb } as unknown as MongoClient;

        const archiveStatusUpdater = new ArchiveStatusUpdater(mockCollection, mockMongoClient);

        it("Class name", () => {
            expect(archiveStatusUpdater.className).toEqual("ArchiveStatusUpdater");
        });

        it("Update when has archive status", async () => {
            const testCase: [ChangeStreamNameSpace, Document, ArchiveStatusConfig] = [{ db: "test", coll: "case" }, { filter: true }, { field: "_phiens", value: "id" }];
            mockFindOne.mockReturnValue({ value: 12345 });
            mockUpdateOne.mockReturnValue({ modifiedCount: 1, upsertedCount: 0 });

            const spyLogWarning = jest.spyOn(logger, "logWarning").mockImplementation(() => null);

            archiveStatusUpdater.subscribe(mockEmitter);
            archiveStatusUpdater.subscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("UPDATE_ARCHIVE_STATUS", ...testCase);
            await waitMs(100);

            expect(mockMongoDb).toHaveBeenCalledTimes(1);
            expect(mockMongoDb).toHaveBeenLastCalledWith("test");
            expect(mockMongoCollection).toHaveBeenCalledTimes(1);
            expect(mockMongoCollection).toHaveBeenLastCalledWith("case");
            expect(mockFindOne).toHaveBeenCalledTimes(1);
            expect(spyLogWarning).toHaveBeenCalledTimes(1);
            expect(mockUpdateOne).toHaveBeenCalledTimes(1);
            expect(mockUpdateOne).toHaveBeenLastCalledWith(testCase[1], { $set: { "lastArcId._phiens": 12345 } }, expect.anything());

            [spyLogWarning, mockMongoDb, mockMongoCollection, mockFindOne, mockUpdateOne].forEach((_) => _.mockClear());

            archiveStatusUpdater.unsubscribe(mockEmitter);
            archiveStatusUpdater.unsubscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("UPDATE_ARCHIVE_STATUS", ...testCase);
            await waitMs(100);

            expect(mockMongoDb).toHaveBeenCalledTimes(0);
            expect(mockMongoCollection).toHaveBeenCalledTimes(0);
            expect(mockFindOne).toHaveBeenCalledTimes(0);
            expect(spyLogWarning).toHaveBeenCalledTimes(1);
            expect(mockUpdateOne).toHaveBeenCalledTimes(0);
        }, 1000);

        it("Warning when does not have archive status", async () => {
            const testCase: [ChangeStreamNameSpace, Document, ArchiveStatusConfig] = [{ db: "test", coll: "case" }, { filter: true }, { field: "_phiens", value: "id" }];
            mockFindOne.mockReturnValue({});

            const spyLogWarning = jest.spyOn(logger, "logWarning").mockImplementation(() => null);

            archiveStatusUpdater.subscribe(mockEmitter);
            archiveStatusUpdater.subscribe(mockEmitter);

            expect(spyLogWarning).toHaveBeenCalledTimes(1);

            mockEmitter.emit("UPDATE_ARCHIVE_STATUS", ...testCase);
            await waitMs(100);

            expect(mockMongoDb).toHaveBeenCalledTimes(1);
            expect(mockMongoDb).toHaveBeenLastCalledWith("test");
            expect(mockMongoCollection).toHaveBeenCalledTimes(1);
            expect(mockMongoCollection).toHaveBeenLastCalledWith("case");
            expect(mockFindOne).toHaveBeenCalledTimes(1);
            expect(spyLogWarning).toHaveBeenCalledTimes(2);
            expect(mockUpdateOne).toHaveBeenCalledTimes(0);
        }, 1000);
    });
});
