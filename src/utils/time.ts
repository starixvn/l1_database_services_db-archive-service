export function ensureTime(time: string) {
    const ensuredTime = new Date(Date.parse(time));
    return isNaN(ensuredTime.valueOf()) ? new Date() : ensuredTime;
}
