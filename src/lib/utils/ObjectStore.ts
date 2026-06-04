import { get, type Writable } from "svelte/store";

/**
 * Sync value to store using key.
 * When first call situation, value is undefined, so get value from store.
 * <code>
 * let filter:string;
 * $:{
 *   filter = syncObject(filter, filterStoreObject, mykey, "")
 * }
 * </code>
 * @param value 
 * @param store 
 * @param key key of store
 * @param defaultValue there are no data in store, then return this default value
 * @returns value or store value or default value
 */
export function syncObject<T>(
    value: T,
    store: Writable<Record<string, any>>,
    key: string,
    defaultValue: T,
): T {
    if (value == undefined) {
        // if undefined then initialize using store value or default value
        return get(store)[key] ?? defaultValue;
    }
    persistStoreValue(store, key, value);
    return value;
}

/** Read a keyed value from a record store (for Svelte 5 $effect.pre). */
export function loadStoreValue<T>(
    store: Writable<Record<string, any>>,
    key: string,
    defaultValue: T,
): T {
    return get(store)[key] ?? defaultValue;
}

/** Write a keyed value to a record store without triggering reactive read/write loops. */
export function persistStoreValue<T>(
    store: Writable<Record<string, any>>,
    key: string,
    value: T,
): void {
    store.update((storeValue) => {
        if (value) {
            storeValue[key] = value;
        } else {
            delete storeValue[key];
        }
        return storeValue;
    });
}