import { ChildArchiveConfig } from "./archive-config";

export type CopySingleCollectionDataOptions = {
    name: string;
    updateOnly: boolean;
    timeAlias: string;
};

export type CopyMultipleCollectionsDataOptions = CopySingleCollectionDataOptions & {
    localField: string;
    childArchiveConfigs: ChildArchiveConfig[];
};
