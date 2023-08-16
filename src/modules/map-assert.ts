import { stringify } from "@ldb/utils";

export class MapAssert<K, V> extends Map<K, V> {
    get(key: K, assertMessage?: string) {
        return super.get(key) ?? this.assertNonNull(assertMessage ?? `Failed to get value of ${stringify(key)}`);
    }

    private assertNonNull(errorMessage: string): never {
        throw new TypeError(errorMessage);
    }
}
