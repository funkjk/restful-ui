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
    store.update((storeValue) => {
        if (value) {
            storeValue[key] = value;
        } else {
            delete storeValue[key];
        }
        return storeValue;
    });
    return value;
}