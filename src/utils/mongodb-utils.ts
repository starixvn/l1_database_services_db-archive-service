import { ChangeStreamNameSpace } from "mongodb";

export function getNamespaceString(namespace: ChangeStreamNameSpace) {
    const { db, coll } = namespace;
    return `${db}.${coll}`;
}
