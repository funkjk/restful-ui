import { expect, test } from 'vitest'
import { ObjectArray } from "$lib/utils/object-array";

test('simple object array', () => {
    const target = new ObjectArray(items)
    expect(target.selected).toEqual(["name", "age", "obj"])
    target.deselect(["name"])
    expect(target.selected).toEqual(["age", "obj"])
    target.deselect(["obj"])
    expect(target.selected).toEqual(["age"])
    target.select(["obj"])
    expect(target.selected).toEqual(["age", "obj"])
    target.select(["name"])
    expect(target.selected).toEqual(["age", "obj", "name"])
    target.expand(["obj"])
    expect(target.selected).toEqual(["age", { name: "obj", selected: ["a", "b"] }, "name"])
    target.deselect(["obj", "a"])
    expect(target.selected).toEqual(["age", { name: "obj", selected: ["b"] }, "name"])
    expect(target.getSelectedColumnDefinition().map(e => e.getKey().join("."))).toEqual(["age", "obj.b", "name"])
    target.select(["obj", "a"])
    expect(target.selected).toEqual(["age", { name: "obj", selected: ["b", "a"] }, "name"])
    target.deselect(["obj"])
    expect(target.selected).toEqual(["age", "name"])
    target.select(["obj"])
    expect(target.selected).toEqual(["age", "name", "obj"])
    target.expand(["obj"])
    expect(target.selected).toEqual(["age", "name", { name: "obj", selected: ["a", "b"] }])
    target.deselect(["obj", "a"])
    target.deselect(["obj", "b"])
    expect(target.selected).toEqual(["age", "name"])
    expect(target.getSelectedColumnDefinition().map(e => e.getKey().join("."))).toEqual(["age", "name"])
    target.select(["obj"])
    target.expand(["obj"])
    expect(target.selected).toEqual(["age", "name", { name: "obj", selected: ["a", "b"] }])
    expect(target.getSelectedColumnDefinition().map(e => e.getKey().join("."))).toEqual(["age", "name", "obj.a", "obj.b"])
    target.shrink(["obj"])
    expect(target.selected).toEqual(["age", "name", "obj"])
    expect(target.getSelectedColumnDefinition().map(e => e.getKey().join("."))).toEqual(["age", "name", "obj"])

})


const items = [
    { name: 'John', age: 30, obj: { a: 1, b: 2 } },
    { name: 'John', age: 30, obj: { a: 1, b: 2 } },
    { name: 'John', age: 30, obj: { a: 1, b: 2 } },
]
