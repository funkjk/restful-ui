
export interface SelecedColumnHolder {
    selected: SelectedColumn[]
}
export interface ColumnDefinitionHolder {
    childColumns: ColumnDefinition[]
}
export type SelectedColumn = string | SelectedObjectColumn
export interface SelectedObjectColumn extends SelecedColumnHolder {
    name: string
}

export enum ColumnType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    OBJECT = 'object',
    ARRAY = 'array',
    NULL = 'null',
}

export class ColumnDefinition implements ColumnDefinitionHolder {
    name: string
    childColumns: ColumnDefinition[]
    columnType: ColumnType
    objectArray: ObjectArray
    parentColumn?: ColumnDefinition
    constructor(args: { objectArray: ObjectArray, name: string, childColumns: ColumnDefinition[], columnType: ColumnType }) {
        const { objectArray, name, childColumns, columnType } = args
        this.objectArray = objectArray
        this.name = name
        this.childColumns = childColumns
        this.columnType = columnType
    }
    isExpandable(): boolean {
        return this.columnType === ColumnType.OBJECT
    }
    selectSize() {
        const selectedColumn = this.objectArray._getSelectedColumn(this.getKey())
        if (!selectedColumn) {
            return 0
        } else {
            let count = 0;
            doAllChildColumn(selectedColumn, () => count++)
            return count
        }
    }
    // findChildColumn(name: string[]): ColumnDefinition | undefined {
    //     if (name.length === 0) {
    //         return undefined
    //     }
    //     const childName = name[0]
    //     const childColumn = this.childColumns.find((column) => column.name === childName)
    //     if (childColumn) {
    //         if (name.length === 1) {
    //             return childColumn
    //         } else {
    //             return childColumn.findChildColumn(name.slice(1))
    //         }
    //     } else {
    //         return undefined
    //     }
    // }
    getKey(): string[] {
        if (this.parentColumn) {
            return [...this.parentColumn.getKey(), this.name]
        } else {
            return [this.name]
        }
    }
}

export class ObjectArray implements SelecedColumnHolder, ColumnDefinitionHolder {
    items: any[]
    childColumns: ColumnDefinition[]
    selected: SelectedColumn[]
    constructor(items: any[], selectedColumns?: SelectedColumn[]) {
        this.items = items
        this.childColumns = getColumnDefinitions(this, items[0])
        if (selectedColumns && selectedColumns.length > 0) {
            this.selected = selectedColumns
        } else {
            this.selected = this.childColumns.map((column) => column.name)
        }
    }
    select(key: string[]): void {
        const targetHolder = this._findTargetHolder(key)
        // TODO validation
        const targetLastKey = key[key.length - 1]
        targetHolder.selected.push(targetLastKey)
    }
    deselect(key: string[]): void {
        const targetHolder = this._findTargetHolder(key)
        const targetLastKey = key[key.length - 1]
        targetHolder.selected = targetHolder.selected.filter(e => !selectedColumnEqual(targetLastKey, e))
        // remove empty selected column
        removeEmptySelected(this)
    }
    expand(key: string[]): void {
        const targetHolder = this._findTargetHolder(key)
        const targetLastKey = key[key.length - 1]
        const targetLastKeyIndex = targetHolder.selected.findIndex(e => selectedColumnEqual(targetLastKey, e))
        const ColumnDefinition = findColumnDefinitions(key, this.childColumns)
        if (ColumnDefinition && targetLastKeyIndex >= 0) {
            targetHolder.selected[targetLastKeyIndex] = {
                name: targetLastKey,
                selected: ColumnDefinition.childColumns.map(e => e.name)
            }
        }

    }
    shrink(key: string[]): void {
        const targetHolder = this._findTargetHolder(key)
        const targetLastKey = key[key.length - 1]
        const targetLastKeyIndex = targetHolder.selected.findIndex(e => selectedColumnEqual(targetLastKey, e))
        if (targetLastKeyIndex >= 0) {
            targetHolder.selected[targetLastKeyIndex] = targetLastKey
        }
    }
    getSelectedColumnDefinition(): ColumnDefinition[] {
        return toColumnDefinition(this, this)
    }
    toColumnDefinition(key: string[]) {
        let currentHolder = this as ColumnDefinitionHolder;
        for (const k of key) {
            let found = false
            for (const column of currentHolder.childColumns) {
                if (column.name === k) {
                    currentHolder = column
                    found = true
                    break
                }
            }
            if (!found) {
                return null
            }
        }
        return currentHolder;

    }
    _getSelectedColumn(key: string[]) {
        const targetHolder = this._findTargetHolder(key)
        const targetLastKey = key[key.length - 1]
        if (targetHolder) {
            return targetHolder.selected.find(e => selectedColumnEqual(targetLastKey, e))
        } else {
            return null
        }
    }
    _findTargetHolder(key: string[]): SelecedColumnHolder {
        let targetHolder = this as SelecedColumnHolder
        for (let keyIdx = 0; keyIdx < key.length - 1; keyIdx++) {
            for (const column of targetHolder.selected) {
                if (typeof column == "object") {
                    const objectColumn = column as SelectedObjectColumn
                    if (objectColumn.name == key[keyIdx]) {
                        targetHolder = objectColumn
                    }
                }
            }
        }
        return targetHolder
    }
}
function findColumnDefinitions(key: string[], ColumnDefinitions: ColumnDefinition[]): ColumnDefinition | null {
    const targetKey = key[0]
    for (let ColumnDefinition of ColumnDefinitions) {
        if (ColumnDefinition.name == targetKey) {
            if (key.length > 1) {
                return findColumnDefinitions(key.slice(0), ColumnDefinition.childColumns)
            } else {
                return ColumnDefinition
            }
        }
    }
    return null
}
function getColumnDefinitions(objectArray: ObjectArray, obj: any): ColumnDefinition[] {
    const columns = Object.keys(obj).map((key) => {
        const column = obj[key]
        if (typeof column === 'object' && !Array.isArray(column)) {
            const childColumns = getColumnDefinitions(objectArray, column)
            const definition = new ColumnDefinition(
                {
                    objectArray,
                    name: key,
                    childColumns: childColumns,
                    columnType: getColumnType(column)
                })
            for (const childColumn of childColumns) {
                childColumn.parentColumn = definition
            }
            return definition
        } else {
            return new ColumnDefinition(
                {
                    objectArray,
                    name: key,
                    childColumns: [],
                    columnType: getColumnType(column)
                })
        }
    })
    return columns
}
function getColumnType(obj: any): ColumnType {
    if (obj === null) {
        return ColumnType.NULL
    } else if (Array.isArray(obj)) {
        return ColumnType.ARRAY
    } else if (typeof obj === 'object') {
        return ColumnType.OBJECT
    } else if (typeof obj === 'string') {
        return ColumnType.STRING
    } else if (typeof obj === 'number') {
        return ColumnType.NUMBER
    } else if (typeof obj === 'boolean') {
        return ColumnType.BOOLEAN
    } else {
        return ColumnType.NULL
    }
}

function removeEmptySelected(holder: SelecedColumnHolder): boolean {
    holder.selected = holder.selected.filter(column => {
        if (typeof column === "object") {
            return removeEmptySelected(column)
        } else {
            return true
        }
    })
    return holder.selected.length !== 0

}
function selectedColumnEqual(name: string, column: SelectedColumn) {
    if (typeof column === "object") {
        return column.name === name
    } else {
        return column === name
    }
}

function doAllChildColumn(column: SelectedColumn, fn: (name: string) => void) {
    if (typeof column === "object") {
        for (let child of column.selected) {
            doAllChildColumn(child, fn)
        }
    } else {
        fn(column)
    }
}

function toColumnDefinition(selected: SelecedColumnHolder, definitions: ColumnDefinitionHolder): ColumnDefinition[] {
    let ret: ColumnDefinition[] = []
    selected.selected.forEach(e => {
        for (const def of definitions.childColumns) {
            if (selectedColumnEqual(def.name, e)) {
                if (typeof e === "object") {
                    ret = [...ret, ...toColumnDefinition(e, def)]
                } else {
                    ret.push(def)
                }
            }
        }
    })
    return ret
}