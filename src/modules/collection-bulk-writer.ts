import { AnyBulkWriteOperation, BulkWriteOptions, Collection } from "mongodb";
import { logger } from "../loggers";

export class CollectionBulkWriter {
    private operations: AnyBulkWriteOperation[] = [];

    constructor(private readonly collection: Collection, private readonly bulkWriteOptions: BulkWriteOptions, private readonly sizeThreshold: number = 10_000) {}

    get className() {
        return "CollectionBulkWriter";
    }

    get length() {
        return this.operations.length;
    }

    isThresholdReached(sizeThreshold = this.sizeThreshold) {
        return this.operations.length >= sizeThreshold;
    }

    push(operation: AnyBulkWriteOperation, ignore = false) {
        if (ignore) {
            return;
        }
        this.operations.push(operation);
    }

    async write(extraCondition = true, sizeThreshold = this.sizeThreshold) {
        if (!extraCondition || !this.isThresholdReached(sizeThreshold)) {
            return;
        }

        const applyingOperations = this.operations;
        this.operations = [];

        try {
            const bulkWriteResult = await this.collection.bulkWrite(applyingOperations, this.bulkWriteOptions);

            const { matchedCount, insertedCount, upsertedCount, modifiedCount, deletedCount } = bulkWriteResult;
            logger.logDebug("", {
                title: `${this.collection.namespace}.bulkWrite`,
                subject: `#-${matchedCount}  I-${insertedCount}  U-${upsertedCount}  M-${modifiedCount}  D-${deletedCount}`,
            });

            if (bulkWriteResult.hasWriteErrors()) {
                logger.logError(`${this.collection.namespace}.bulkWrite`, bulkWriteResult.getWriteErrors());
            }
        } catch (error: unknown) {
            logger.logError(`${this.className}.write`, error);
        }
    }
}
