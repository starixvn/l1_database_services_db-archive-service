import { ChangeStreamNameSpace, Document } from "mongodb";
import { ArchiveStatusConfig, ChildArchiveConfig } from "./archive-config";

export type CopyMode = "SINGLE" | "MULTIPLE";

type MultipleCollectionOptions = {
    localField: string;
    childs: ChildArchiveConfig[];
};

export type CopyDataOptions<T extends CopyMode> = {
    name: string;
    updateOnly: boolean;
    timeAlias: string;
} & (T extends "MULTIPLE" ? MultipleCollectionOptions : {});

export type ArchiveOptions<T extends CopyMode> = {
    id: number;
    from: ChangeStreamNameSpace;
    to: ChangeStreamNameSpace;
    filter: Document;
    dataOptions: CopyDataOptions<T>;
    log?: ArchiveStatusConfig;
};

export type ArchiveStatusOptions = {
    target: ChangeStreamNameSpace;
    filter: Document;
    options: ArchiveStatusConfig;
};
