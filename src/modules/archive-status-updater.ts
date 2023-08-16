import { stringify } from "@ldb/utils";
import { ChangeStreamNameSpace, Collection, Document, FindOptions, MongoClient, UpdateOptions } from "mongodb";
import { logger } from "../loggers";
import { ArchiveStatusConfig } from "../types/archive-config";
import { getNamespaceString } from "../utils/mongodb-utils";
import { DataArchiver } from "./data-archiver";

/** Listen for signal from `DataArchiver` to update latest archive status */
export class ArchiveStatusUpdater {
    private readonly emitters: Set<DataArchiver> = new Set();

    constructor(private readonly archiveStatusCollection: Collection, private readonly targetMongoClient: MongoClient) {
        this.selfBound();
    }

    private get className() {
        return "ArchiveStatusUpdater";
    }

    private selfBound() {
        this.updateArchiveStatus = this.updateArchiveStatus.bind(this);
    }

    async updateArchiveStatus(targetNamespace: ChangeStreamNameSpace, filter: Document, archiveStatusConfig: ArchiveStatusConfig) {
        const { db, coll } = targetNamespace;
        const targetCollection = this.targetMongoClient.db(db).collection(coll);

        const { field, value } = archiveStatusConfig;

        const logValueFindOptions: FindOptions = { projection: { _id: 0, value: `$${value}` }, sort: { [value]: -1 } };
        const logValue = await targetCollection.findOne({}, logValueFindOptions);

        if (!logValue || !logValue.value) {
            logger.logWarning(this.className, `Skip archive status update [${targetCollection.namespace}] = ${stringify(logValue)}`);
            return;
        }
        const archiveStatusValue = logValue.value;
        const updateOptions: UpdateOptions = { upsert: true, willRetryWrite: true, retryWrites: true };
        const updateArchiveStatusResult = await this.archiveStatusCollection.updateOne(filter, { $set: { [`lastArcId.${field}`]: archiveStatusValue } }, updateOptions);

        const { modifiedCount, upsertedCount } = updateArchiveStatusResult;
        if (modifiedCount + upsertedCount > 0) {
            logger.logDebug("", { title: this.className, subject: `${getNamespaceString(targetNamespace)} => ${archiveStatusValue}` });
        }
    }

    subscribe(emitter: DataArchiver): boolean {
        if (this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.subscribe`, "Already subscribed");
            return false;
        }

        this.emitters.add(emitter);
        emitter.addListener("UPDATE_ARCHIVE_STATUS", this.updateArchiveStatus);
        return true;
    }

    unsubscribe(emitter: DataArchiver): boolean {
        if (!this.emitters.has(emitter)) {
            logger.logWarning(`${this.className}.unsubscribe`, "Currently unsubscribed");
            return false;
        }

        emitter.removeListener("UPDATE_ARCHIVE_STATUS", this.updateArchiveStatus);
        this.emitters.delete(emitter);
        return true;
    }
}
