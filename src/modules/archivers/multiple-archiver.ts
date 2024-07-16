import type { BaseLogger } from "@ldb/base-logger";
import type { MongoClient } from "@ldb/mongo";
import type { ArchiveOptions } from "../../types/archive-options.js";
import { ensureTime } from "../../utils/time.js";
import { BulkWriter } from "../bulk-writer.js";
import type { ArchiveProcessor } from "../processors/archive-processor.js";
import { closeCursor, DataArchiver } from "./data-archiver.js";

export class MultipleArchiver extends DataArchiver<"MULTIPLE"> {
    constructor(sourceMongo: MongoClient, targetMongo: MongoClient, logger: BaseLogger) {
        super(sourceMongo, targetMongo, logger);
        this.selfBound();
    }

    protected async executeCopy(options: ArchiveOptions<"MULTIPLE">) {
        const { from, to, filterPipeline, dataOptions, log } = options;
        const { name, timeAlias, updateOnly, childs, localField } = dataOptions;

        this.initUpdateArchiveStatus(to, { name }, log);

        const parentFromColl = this.getSourceCollection(from);
        const parentToColl = this.getTargetCollection(to);
        const bulkWriter = new BulkWriter(this.logger);
        bulkWriter.add(parentFromColl, parentToColl);

        for (const child of childs) {
            const { from: fromChild, to: toChild, log: logChild } = child;

            this.initUpdateArchiveStatus(toChild, { name }, logChild);

            const childFromColl = this.getSourceCollection(fromChild);
            const childToColl = this.getTargetCollection(toChild);
            bulkWriter.add(childFromColl, childToColl);
        }

        const parentDataCursor = parentFromColl.aggregate(filterPipeline, { allowDiskUse: true }).addCursorFlag("noCursorTimeout", true);

        for await (const parentDoc of parentDataCursor) {
            const { _id } = parentDoc;
            const eventtime = ensureTime(parentDoc[`${timeAlias}`]);

            if (!updateOnly) {
                bulkWriter.set(parentToColl, {
                    updateOne: {
                        filter: { _id },
                        update: { $set: parentDoc },
                        upsert: true,
                    },
                });
            }
            bulkWriter.set(parentFromColl, {
                updateOne: {
                    filter: { _id },
                    update: {
                        $set: {
                            "__archive.eventtime": eventtime,
                            "__archive.v": 2,
                        },
                    },
                },
            });

            for (const child of childs) {
                const { from: fromChild, to: toChild, filterPipeline: filterChild, config: configChild } = child;
                const { foreignField, updateOnly: updateOnlyChild } = configChild;

                const childFromColl = this.getSourceCollection(fromChild);
                const childToColl = this.getTargetCollection(toChild);

                const filterPipelineChild = [{ $match: { [foreignField]: parentDoc[`${localField}`] } }, ...filterChild];
                const childDataCursor = childFromColl.aggregate(filterPipelineChild, { allowDiskUse: true }).addCursorFlag("noCursorTimeout", true);

                for await (const childDoc of childDataCursor) {
                    const { _id: _idChild } = childDoc;

                    if (!updateOnlyChild) {
                        bulkWriter.set(childToColl, {
                            updateOne: {
                                filter: { _id: _idChild },
                                update: { $set: childDoc },
                                upsert: true,
                            },
                        });
                    }
                    bulkWriter.set(childFromColl, {
                        updateOne: {
                            filter: { _id: _idChild },
                            update: {
                                $set: {
                                    "__archive.eventtime": eventtime,
                                    "__archive.v": 2,
                                },
                            },
                        },
                    });
                }

                closeCursor(childDataCursor);
            }

            await bulkWriter.write();
        }

        await bulkWriter.write(0);

        closeCursor(parentDataCursor);

        this.initUpdateArchiveStatus(to, { name }, log);
        for (const child of childs) {
            const { to: toChild, log: logChild } = child;
            this.initUpdateArchiveStatus(toChild, { name }, logChild);
        }
    }

    subscribe(publisher: ArchiveProcessor) {
        return super.subscribe(publisher, "MULTIPLE");
    }

    unsubscribe(publisher: ArchiveProcessor) {
        return super.unsubscribe(publisher, "MULTIPLE");
    }
}
