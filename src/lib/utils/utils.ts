
export function getTargetNestKeys(obj: any, fn: (e: any) => boolean): string[] {
  if (!obj || !isObject(obj)) {
    return [];
  }
  let keys: string[] = [];
  for (const prop of Object.keys(obj)) {
    if (fn(obj[prop])) {
      keys.push(prop);
    } else if (isObject(obj[prop])) {
      const childKeys = getTargetNestKeys(obj[prop], fn).map(
        e => prop + '.' + e
      );
      keys = [...keys, ...childKeys];
    }
  }
  return keys;
}

export const isObject = (x: unknown): x is object =>
  x !== null &&
  (typeof x === 'object' || typeof x === 'function') &&
  !Array.isArray(x);

export const isObjectArray = (x: any) => Array.isArray(x) && isObject(x[0]);

export function createRawStringSwaggerParserResolver(raw: string) {

  const myResolver = {
    order: 1,
    canRead: /^static:/i,
    read(): string {
      return raw;
    },
  };
  return myResolver
}



export enum CardType {
  NORMAL = "NORMAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
}



import {
  ObjectArray,
  ColumnDefinition,
  type SelectedRoot,
  MoveDirection,
  moveSelected,
} from "$lib/utils/object-array";

export enum PAGE {
  OPERATION = "operation",
  SETTING = "setting",
  TOP = "top",
}


export function convertToDataTableHeaders(
  objectArray: ObjectArray,
  selectedColumns: SelectedRoot,
) {
  const selectedDefinition =
      objectArray.getSelectedColumnDefinition(selectedColumns);
  const headerRowSize = Math.max(
      ...selectedDefinition.map((e) => e.getKey().length),
  );
  const ret: DataTableHeaderColumn[][] = [];
  for (let rowIdx = 0; rowIdx < headerRowSize; rowIdx++) {
      ret[rowIdx] = [];
      for (let colIdx = 0; colIdx < selectedDefinition.length; colIdx++) {
          const def = selectedDefinition[colIdx];
          if (rowIdx > def.getKey().length - 1) {
              ret[rowIdx].push({
                  dummyFlag: true,
                  parentFlag: false,
              });
          } else if (rowIdx > def.getKey().length - 1) {
              ret[rowIdx].push({
                  dummyFlag: false,
                  definition: def,
                  parentFlag: false,
              });
          } else {
              let parent: ColumnDefinition = def;
              for (
                  let diffIdx = 0;
                  diffIdx < def.getKey().length - 1 - rowIdx;
                  diffIdx++
              ) {
                  parent = def.parentColumn as ColumnDefinition;
              }
              if (
                  ret[rowIdx][colIdx - 1]?.definition
                      ?.getKey()
                      .join(".") === parent.getKey().join(".")
              ) {
                  ret[rowIdx].push({
                      dummyFlag: true,
                      definition: parent,
                      parentFlag: true,
                  });
              } else {
                  ret[rowIdx].push({
                      dummyFlag: false,
                      definition: parent,
                      parentFlag: true,
                  });
              }
          }
      }
  }
  return ret;
}
export interface DataTableHeaderColumn {
  definition?: ColumnDefinition;
  dummyFlag: boolean;
  parentFlag: boolean;
}
export enum DisplayType {
  LONG_STING = "LONG_STING",
  TIMESTAMP = "TIMESTAMP",
  DEFAULT = "DEFAULT",
}
export interface DisplayTypes {
  [propertyName: string]: DisplayType;
}


/**
 * check if the item is too big by depth
 * @param item - the item to check
 * @param threshold - the threshold of the number of properties/elements
 * @param maxDepth - the maximum depth to check (0: only the current level, 1: the current level and the next level, ...)
 * @returns true if the number of properties/elements is greater than the threshold
 */
export function isTooBigByDepth(item: any, maxDepth = 2, threshold = 300) {
  let count = 0;
  const visited = new WeakSet(); // set to detect circular references

  // count the number of properties/elements recursively
  function countPropsRecursive(obj: any, currentDepth: number) {
      if (!obj || typeof obj !== 'object') return;
      if (currentDepth > maxDepth) return;
      if (visited.has(obj)) return; // skip circular references

      visited.add(obj);

      const keys = Object.keys(obj);
      count += keys.length;

      // if the number of properties/elements is greater than the threshold, stop the processing
      if (count > threshold) {
          // if the number of properties/elements is greater than the threshold, stop the processing
          return; 
      }

      // go to the next depth
      if (currentDepth < maxDepth) {
          for (const key of keys) {
              // check the elements of the array and the properties of the object recursively
              countPropsRecursive(obj[key], currentDepth + 1);

              if (count > threshold) break;
          }
      }
      
  }

  countPropsRecursive(item, 0);

  return count > threshold;
}