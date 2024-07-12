import type { BaseLogger } from "@ldb/base-logger";
import type { MongoClient } from "@ldb/mongo";
import type { ArchiveOptions } from "../../types/archive-options.js";
import { ensureTime } from "../../utils/time.js";
import { BulkWriter } from "../bulk-writer.js";
import type { ArchiveProcessor } from "../processors/archive-processor.js";
import { DataArchiver, FIND_OPTIONS } from "./data-archiver.js";

export class SingleArchiver extends DataArchiver<"SINGLE"> {
    constructor(sourceMongo: MongoClient, targetMongo: MongoClient, logger: BaseLogger) {
        super(sourceMongo, targetMongo, logger);
        this.selfBound();
    }

    protected async executeCopy(options: ArchiveOptions<"SINGLE">) {
        const { from, to, filter, dataOptions, log } = options;
        const { name, timeAlias, updateOnly } = dataOptions;

        const fromCollection = this.getSourceCollection(from);
        const toCollection = this.getTargetCollection(to);

        this.initUpdateArchiveStatus(to, { name }, log);
        const bulkWriter = new BulkWriter(this.logger);
        bulkWriter.add(fromCollection, toCollection);

        const fromDataCursor = fromCollection.find(filter, FIND_OPTIONS);

        for await (const document of fromDataCursor) {
            const { _id } = document;
            const eventtime = ensureTime(document[`${timeAlias}`]);

            if (!updateOnly) {
                bulkWriter.set(toCollection, { updateOne: { filter: { _id }, update: { $set: document }, upsert: true } });
            }
            bulkWriter.set(fromCollection, { updateOne: { filter: { _id }, update: { $set: { "__archive.eventtime": eventtime } } } });

            await bulkWriter.write();
        }

        await bulkWriter.write(0);

        if (!fromDataCursor.closed) {
            fromDataCursor.close();
        }

        this.initUpdateArchiveStatus(to, { name }, log);
    }

    subscribe(publisher: ArchiveProcessor) {
        return super.subscribe(publisher, "SINGLE");
    }

    unsubscribe(publisher: ArchiveProcessor) {
        return super.unsubscribe(publisher, "SINGLE");
    }
}
