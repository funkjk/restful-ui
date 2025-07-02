
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

