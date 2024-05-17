import { ObjectId, Timestamp } from "@ldb/mongo";

export function ensureTime(time: string | Date | ObjectId | Timestamp) {
    if (typeof time === "string") {
        const ensuredTime = new Date(Date.parse(time));
        return isNaN(ensuredTime.valueOf()) ? new Date() : ensuredTime;
    }
    if (time instanceof Date) {
        return time;
    }
    if (time instanceof ObjectId) {
        return time.getTimestamp();
    }
    if (time instanceof Timestamp) {
        const epoch = time.getHighBitsUnsigned() * 1000;
        return new Date(epoch);
    }
    return new Date();
}
