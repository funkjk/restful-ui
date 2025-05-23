
export interface SelecedColumnHolder {
    selected: SelectedColumn[]
}
export interface SelectedRoot extends SelecedColumnHolder {

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
    isShowed(selected: SelectedRoot): boolean {
        const selectedColumn = this.objectArray._getSelectedColumn(selected, this.getKey())
        if (selectedColumn != null) {
            return true
        }
        let parent = this.parentColumn
        while(parent && parent.isExpanded(selected)) {
            if (parent.isShowed(selected)) {
                return true
            }
            parent = parent.parentColumn
        }
        return false
    }
    isExpanded(selected: SelectedRoot): boolean {
        const selectedColumn = this.objectArray._getSelectedColumn(selected, this.getKey())
        return selectedColumn != null && typeof selectedColumn == "string"
    }
    getKey(): string[] {
        if (this.parentColumn) {
            return [...this.parentColumn.getKey(), this.name]
        } else {
            return [this.name]
        }
    }
}

export class ObjectArray implements ColumnDefinitionHolder {
    items: any[]
    childColumns: ColumnDefinition[]
    initialSelectedColumns: SelectedRoot
    constructor(items: any[]) {
        this.items = items
        this.childColumns = getColumnDefinitions(this, items[0])
        this.initialSelectedColumns = {
            selected: this.childColumns.map((column) => column.name)
        }
    }
    select(selected: SelectedRoot, key: string[]): SelectedRoot {
        const targetHolder = this._findTargetHolder(selected, key)
        // TODO validation
        const targetLastKey = key[key.length - 1]
        targetHolder.selected.push(targetLastKey)
        return selected
    }
    deselect(selected: SelectedRoot, key: string[]): SelectedRoot {
        const targetHolder = this._findTargetHolder(selected, key)
        const targetLastKey = key[key.length - 1]
        targetHolder.selected = targetHolder.selected.filter(e => !selectedColumnEqual(targetLastKey, e))
        // remove empty selected column
        removeEmptySelected(selected)
        return selected
    }
    expand(selected: SelectedRoot, key: string[]): SelectedRoot {
        const targetHolder = this._findTargetHolder(selected, key)
        const targetLastKey = key[key.length - 1]
        const targetLastKeyIndex = targetHolder.selected.findIndex(e => selectedColumnEqual(targetLastKey, e))
        const columnDefinition = findColumnDefinitions(key, this.childColumns)
        console.log("expand", {selected,targetHolder, key,targetLastKey,targetLastKeyIndex, columnDefinition})
        if (columnDefinition && targetLastKeyIndex >= 0) {
            targetHolder.selected[targetLastKeyIndex] = {
                name: targetLastKey,
                selected: columnDefinition.childColumns.map(e => e.name)
            }
        }
        return selected
    }
    shrink(selected: SelectedRoot, key: string[]): SelectedRoot {
        const targetHolder = this._findTargetHolder(selected, key)
        const targetLastKey = key[key.length - 1]
        const targetLastKeyIndex = targetHolder.selected.findIndex(e => selectedColumnEqual(targetLastKey, e))
        if (targetLastKeyIndex >= 0) {
            targetHolder.selected[targetLastKeyIndex] = targetLastKey
        }
        return selected
    }
    getSelectedColumnDefinition(selected: SelectedRoot): ColumnDefinition[] {
        return _getSelectedColumnDefinition(selected, this)
    }
    getFlattenDefinitons(): ColumnDefinition[] {
        return _toFlattenDefinitions(this)
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
    _getSelectedColumn(selected: SelectedRoot, key: string[]) {
        const targetHolder = this._findTargetHolder(selected, key)
        const targetLastKey = key[key.length - 1]
        if (targetHolder) {
            return targetHolder.selected.find(e => selectedColumnEqual(targetLastKey, e))
        } else {
            return null
        }
    }
    _findTargetHolder(selected: SelectedRoot, key: string[]): SelecedColumnHolder {
        let targetHolder = selected
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
function findColumnDefinitions(key: string[], columnDefinitions: ColumnDefinition[]): ColumnDefinition | null {
    const targetKey = key[0]
    for (const def of columnDefinitions) {
        if (def.name == targetKey) {
            if (key.length > 1) {
                return findColumnDefinitions(key.slice(1), def.childColumns)
            } else {
                return def
            }
        }
    }
    return null
}
function getColumnDefinitions(objectArray: ObjectArray, obj: any): ColumnDefinition[] {
    if (!obj) {
        return []
    }
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

function _getSelectedColumnDefinition(selected: SelecedColumnHolder, definitions: ColumnDefinitionHolder): ColumnDefinition[] {
    let ret: ColumnDefinition[] = []
    selected.selected.forEach(e => {
        for (const def of definitions.childColumns) {
            if (selectedColumnEqual(def.name, e)) {
                if (typeof e === "object") {
                    ret = [...ret, ..._getSelectedColumnDefinition(e, def)]
                } else {
                    ret.push(def)
                }
            }
        }
    })
    return ret
}

function _toFlattenDefinitions(definitions: ColumnDefinitionHolder): ColumnDefinition[] {
    let ret: ColumnDefinition[] = []
    definitions.childColumns.forEach(e => {
        ret = [...ret, e, ..._toFlattenDefinitions(e)]
    })
    return ret
}

export function someKeywordInObject(obj:any, keyword:string):boolean {
    if (!obj) {
        return false
    }
    const keys = Object.keys(obj)
    return keys.some(key => {
        const prop = obj[key]
        if (typeof prop === 'object') {
            return someKeywordInObject(prop, keyword)
        } else {
            return (prop + "").includes(keyword)
        }
    })
}