import { expect, test } from 'vitest'
import { ObjectArray } from "$lib/utils/object-array";

test('simple object array', () => {
    const target = new ObjectArray(items)
    let selectedRoot = target.initialSelectedColumns
    expect(target.getFlattenDefinitons().map(e => e.getKey().join("."))).toEqual(["name", "age", "obj", "obj.a", "obj.b"])
    expect(selectedRoot.selected).toEqual(["name", "age", "obj"])
    selectedRoot = target.deselect(selectedRoot, ["name"])
    expect(selectedRoot.selected).toEqual(["age", "obj"])
    selectedRoot = target.deselect(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age"])
    selectedRoot = target.select(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", "obj"])
    selectedRoot = target.select(selectedRoot, ["name"])
    expect(selectedRoot.selected).toEqual(["age", "obj", "name"])
    selectedRoot = target.expand(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", { name: "obj", selected: ["a", "b"] }, "name"])
    selectedRoot = target.deselect(selectedRoot, ["obj", "a"])
    expect(selectedRoot.selected).toEqual(["age", { name: "obj", selected: ["b"] }, "name"])
    expect(target.getSelectedColumnDefinition(selectedRoot).map(e => e.getKey().join("."))).toEqual(["age", "obj.b", "name"])
    selectedRoot = target.select(selectedRoot, ["obj", "a"])
    expect(selectedRoot.selected).toEqual(["age", { name: "obj", selected: ["b", "a"] }, "name"])
    selectedRoot = target.deselect(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", "name"])
    selectedRoot = target.select(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", "name", "obj"])
    selectedRoot = target.expand(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", "name", { name: "obj", selected: ["a", "b"] }])
    selectedRoot = target.deselect(selectedRoot, ["obj", "a"])
    selectedRoot = target.deselect(selectedRoot, ["obj", "b"])
    expect(selectedRoot.selected).toEqual(["age", "name"])
    expect(target.getSelectedColumnDefinition(selectedRoot).map(e => e.getKey().join("."))).toEqual(["age", "name"])
    selectedRoot = target.select(selectedRoot, ["obj"])
    selectedRoot = target.expand(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", "name", { name: "obj", selected: ["a", "b"] }])
    expect(target.getSelectedColumnDefinition(selectedRoot).map(e => e.getKey().join("."))).toEqual(["age", "name", "obj.a", "obj.b"])
    selectedRoot = target.shrink(selectedRoot, ["obj"])
    expect(selectedRoot.selected).toEqual(["age", "name", "obj"])
    expect(target.getSelectedColumnDefinition(selectedRoot).map(e => e.getKey().join("."))).toEqual(["age", "name", "obj"])

})


const items = [
    { name: 'John', age: 30, obj: { a: 1, b: 2 } },
    { name: 'John', age: 30, obj: { a: 1, b: 2 } },
    { name: 'John', age: 30, obj: { a: 1, b: 2 } },
]
