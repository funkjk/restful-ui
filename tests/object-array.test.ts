import { expect, test } from 'vitest'
import { ObjectArray } from "$lib/utils/object-array";

test('simple object array', () => {
    const items = [
        { name: 'John', age: 30, obj: { a: 1, b: 2 } },
        { name: 'John', age: 30, obj: { a: 1, b: 2 } },
        { name: 'John', age: 30, obj: { a: 1, b: 2 } },
    ]
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

test('complex object array', () => {
    const items = [
        {
            p1: [1, 2, 3],
            p2: {
                item1: {
                    name: "aaa",
                    item2: {
                        name: "bbb"
                    },
                    arr: ["a", "b", "c"]
                },
                item2: {
                    name: "aa1",
                }
            },
            p3: [{ name: "ccc" }]
        }
    ]
    const target = new ObjectArray(items)
    let selectedRoot = target.initialSelectedColumns
    expect(target.getFlattenDefinitons().map(e => e.getKey().join("."))).toEqual(["p1", "p2", "p2.item1", "p2.item1.name", "p2.item1.item2", "p2.item1.item2.name", "p2.item1.arr", "p2.item2", "p2.item2.name", "p3"])
    expect(selectedRoot.selected).toEqual(["p1", "p2", "p3"])
    selectedRoot = target.expand(selectedRoot, ["p2"])
    expect(selectedRoot.selected).toEqual(["p1", { name: "p2", selected: ["item1", "item2"] }, "p3"])
    selectedRoot = target.expand(selectedRoot, ["p2", "item1"])
    expect(selectedRoot.selected).toEqual(["p1", { name: "p2", selected: [{ name: "item1", selected: ["name", "item2", "arr"] }, "item2"] }, "p3"])

})
