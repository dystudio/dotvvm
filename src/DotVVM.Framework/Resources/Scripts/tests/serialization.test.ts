﻿import dotvvm from '../dotvvm-root'
import { validateType } from '../serialization/typeValidation'
import { deserialize } from '../serialization/deserialize'
import { serialize } from '../serialization/serialize'
import { serializeDate } from '../serialization/date'

const assertObservable = (object: any): any => {
    expect(object).observable()
    return object()
}

const assertNotObservable = (object: any): any => {
    expect(object).not.observable()
    return object
}

const assertObservableArray = (object: any) => {
    expect(object).observableArray()
    return object()
}

const assertObservableString = (object: any, expected: string) => {
    assertObservable(object)
    expect(object()).toBe(expected)
}

describe("DotVVM.Serialization - deserialize", () => {

    test("Deserialize scalar number value", () => {
        expect(deserialize(10)).toBe(10)
    })

    test("Deserialize scalar string value", () => {
        expect(deserialize("aaa")).toBe("aaa")
    })

    test("Deserialize scalar boolean value", () => {
        expect(deserialize(true)).toBe(true)
    })

    test("Deserialize null value", () => {
        expect(deserialize(null)).toBe(null)
    })

    test("Deserialize object with one property", () => {
        const obj = deserialize({ a: "aaa" })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(obj.a()).toBe("aaa")
    })

    test("Deserialize object with doNotUpdate option", () => {
        const obj = deserialize({ a: "aaa", "a$options": { doNotUpdate: true } })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(obj.a()).toBeUndefined()
    })

    test("Deserialize object with isDate option", () => {
        const obj = deserialize({ a: "2015-08-01T13:56:42.000", "a$options": { isDate: true } })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(typeof obj.a()).toBe("string")
        expect(new Date(obj.a()).getTime()).toBe(new Date(2015, 7, 1, 13, 56, 42).getTime())
    })

    test("Deserialize Date scalar", () => {
        const obj = deserialize(new Date(Date.UTC(2015, 7, 1, 13, 56, 42)))
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(typeof obj).toBe("string")
        expect(obj).toBe("2015-08-01T13:56:42.0000000")
    })

    test("Deserialize object with Date (it should set the options.isDate)", () => {
        const obj = deserialize({ a: new Date(Date.UTC(2015, 7, 1, 13, 56, 42)), a$options: {} })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(typeof obj.a()).toBe("string")
        expect(obj.a()).toBe("2015-08-01T13:56:42.0000000")
        expect(obj.a$options.isDate).toBeTruthy()
    })

    test("Deserialize object with Date (it should create the options.isDate)", () => {
        const obj = deserialize({ a: new Date(Date.UTC(2015, 7, 1, 13, 56, 42)) })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(typeof obj.a()).toBe("string")
        expect(obj.a()).toBe("2015-08-01T13:56:42.0000000")
        expect(obj.a$options.isDate).toBeTruthy()
    })

    test("Deserialize object with array", () => {
        const obj = deserialize({ a: ["aaa", "bbb", "ccc"] })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(obj.a() instanceof Array).toBeTruthy()
        expect(obj.a().length).toBe(3)

        expect(ko.isObservable(obj.a()[0])).toBeTruthy()
        expect(obj.a()[0]()).toBe("aaa")

        expect(ko.isObservable(obj.a()[1])).toBeTruthy()
        expect(obj.a()[1]()).toBe("bbb")

        expect(ko.isObservable(obj.a()[2])).toBeTruthy()
        expect(obj.a()[2]()).toBe("ccc")
    })

    test("Deserialize array to target array", () => {
        const array = deserialize(["aaa", "bbb", "ccc"], ["aa", "bb"])
        assertNotObservable(array)

        expect(array instanceof Array).toBeTruthy()
        expect(array.length).toBe(3)

        expect(ko.isObservable(array[0])).toBeTruthy()
        expect(array[0]()).toBe("aaa")

        expect(ko.isObservable(array[1])).toBeTruthy()
        expect(array[1]()).toBe("bbb")

        expect(ko.isObservable(array[2])).toBeTruthy()
        expect(array[2]()).toBe("ccc")
    })

    test("Deserialize observable element array to target observable element array", () => {
        const viewmodel = [
            ko.observable("aaa"),
            ko.observable("bbb"),
            ko.observable("ccc")]

        const target = [
            ko.observable("aa"),
            ko.observable("bb")]

        const array = deserialize(viewmodel, target)
        assertNotObservable(array)

        expect(array instanceof Array).toBeTruthy()
        expect(array.length).toBe(3)

        expect(ko.isObservable(array[0])).toBeTruthy()
        expect(array[0]()).toBe("aaa")

        expect(ko.isObservable(array[1]))
        expect(array[1]()).toBe("bbb")

        expect(ko.isObservable(array[2])).toBeTruthy()
        expect(array[2]()).toBe("ccc")
    })

    test("Deserialize observable array to target observable array", () => {
        const viewmodel = ko.observableArray([
            ko.observable("aaa"),
            ko.observable("bbb"),
            ko.observable("ccc")])

        const target = ko.observableArray([
            ko.observable("aa"),
            ko.observable("bb")])

        expect(() => deserialize(viewmodel, target))
            .toThrowError("Parameter viewModel should not be an observable. Maybe you forget to invoke the observable you are passing as a viewModel parameter.")
    })

    test("Deserialize observable array inside array to target array of observable string", function () {
        const target = [
            ko.observable("a")
        ]
        const viewmodel = [
            ko.observableArray([ko.observable("bb")])
        ]

        const result = assertNotObservable(deserialize(viewmodel, target))

        const subArray = assertObservableArray(result[0])
        const element = assertObservable(subArray[0])
        expect(element).toBe("bb")
    })

    test("Deserialize array inside object to target object with observable string property", function () {
        const target = {
            Prop: ko.observable("a")
        }
        const viewmodel = {
            Prop: [ko.observable("bb")]
        }

        const result = assertNotObservable(deserialize(viewmodel, target))

        assertObservableArray(target.Prop)

        const subArray = assertObservableArray(result.Prop)
        const element = assertObservable(subArray[0])
        expect(element).toBe("bb")
    })

    test("Deserialize observable array inside array to target observable array of observable string", function () {
        const target = ko.observableArray([
            ko.observable("a")
        ])
        const viewmodel = [
            ko.observableArray([ko.observable("bb")])
        ]

        const result = assertObservable(deserialize(viewmodel, target))

        const subArray = assertObservableArray(result[0])
        const element = assertObservable(subArray[0])
        expect(element).toBe("bb")
    })

    test("Deserialize observable array inside array to target array of non-observable string", function () {
        const target = [
            "a"
        ]
        const viewmodel = [
            ko.observableArray([ko.observable("bb")])
        ]

        const result = assertNotObservable(deserialize(viewmodel, target))

        const subArray = assertObservableArray(result[0])
        const element = assertObservable(subArray[0])
        expect(element).toBe("bb")
    })

    test("Deserialize observable array inside array to target array of observable strings (2)", function () {
        const target = [
            ko.observable("a"),
            ko.observable("b")
        ]
        const viewmodel = [
            ko.observableArray([ko.observable("bb")])
        ]

        const result = assertNotObservable(deserialize(viewmodel, target))

        const subArray = assertObservableArray(result[0])
        const element = assertObservable(subArray[0])
        expect(element).toBe("bb")
    })

    test("Deserialize non-observable complex object no target", () => {
        const viewmodel = createComplexNonObservableViewmodel()

        const resultObservable = deserialize(viewmodel)

        const result = assertNotObservable(resultObservable)
        assertHierarchy(result)
    })

    test("Deserialize observable complex object to target observable complex object", () => {
        const target = createComplexObservableTarget()
        const viewmodel = createComplexObservableViewmodel()

        const resultObservable = deserialize(viewmodel, target)

        const result = assertObservable(resultObservable)
        assertHierarchy(result)

        const targetObject = assertObservable(target)
        expect(targetObject instanceof Object).toBeTruthy()
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target observable property", () => {
        const target = createComplexObservableTarget()
        const viewmodel = createComplexObservableSubViewmodel()

        const resultObservable = deserialize(viewmodel, target().Prop2)
        const result = assertObservable(resultObservable)
        assertSubHierarchy(result)

        const targetObject = assertObservable(target)
        assertObservableString(targetObject.Prop1, "a")
        let targetProp2Object = assertObservable(targetObject.Prop2)
        assertSubHierarchy(targetProp2Object)
    })

    test("Deserialize observable complex object to target observable property - target and model not linked", () => {
        const target = createComplexObservableTarget()
        const viewmodel = createComplexObservableSubViewmodel()

        deserialize(viewmodel, target().Prop2)

        assertSubHierarchiesNotLinked(viewmodel, target().Prop2!())
    })

    test("Deserialize observable complex object property to target observable property", () => {
        const target = createComplexObservableTarget()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel.Prop2!(), target().Prop2)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        expect(targetObject.Prop1()).toBe("a")
        assertSubHierarchy(targetObject.Prop2!())
    })

    test("Deserialize observable complex object to target with null property", () => {
        const target = createComplexObservableTargetWithNullSubHierarchy()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with null array element", () => {
        const target = createComplexObservableTargetWithNullArrayElement()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with array element property containing null in observable", () => {
        const target = createComplexObservableTargetWithArrayElementPropertyObservableNull()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with array element property containing null", () => {
        const target = createComplexObservableTargetWithArrayElementPropertyNull()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with array element with property missing", () => {
        const target = createComplexObservableTargetWithArrayElementPropertyMissing()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with missing array element", () => {
        const target = createComplexObservableTargetWithMissingArrayElement()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with missing and null array elements", () => {
        const target = createComplexObservableTargetWithArrayElementMissingAndNull()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object to target with missing property for sub-hierarchy", () => {
        const target = createComplexObservableTargetWithMissingSubHierarchy()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel, target)

        let targetObject = assertObservable(target) as ObservableHierarchy

        assertHierarchy(viewmodel)
        assertHierarchy(targetObject)
    })

    test("Deserialize observable complex object property to target observable property - target and model not linked", () => {
        const target = createComplexObservableTarget()
        const viewmodel = createComplexObservableViewmodel()

        deserialize(viewmodel.Prop2!(), target().Prop2)

        assertSubHierarchiesNotLinked(viewmodel.Prop2!(), target().Prop2!())
    })


    test("Deserialize object with arrays and subobjects", () => {
        const obj = deserialize({ a: [{ b: 1, c: [0, 1] }] })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(obj.a() instanceof Array).toBeTruthy()

        expect(obj.a().length).toBe(1)
        expect(ko.isObservable(obj.a()[0])).toBeTruthy()

        const inner = obj.a()[0]()
        expect(typeof inner).toBe("object")

        expect(ko.isObservable(inner.b)).toBeTruthy()
        expect(inner.b()).toBe(1)

        expect(ko.isObservable(inner.c)).toBeTruthy()
        expect(inner.c() instanceof Array).toBeTruthy()

        expect(ko.isObservable(inner.c()[0])).toBeTruthy()
        expect(inner.c()[0]()).toBe(0)

        expect(ko.isObservable(inner.c()[1])).toBeTruthy()
        expect(inner.c()[1]()).toBe(1)
    })

    test("Deserialize into an existing instance - updating the observable property", () => {
        const obj = { a: "bbb" }
        const existing = {
            a: ko.observable("aaa")
        }

        let numberOfUpdates = 0
        existing.a.subscribe(() => numberOfUpdates++)

        deserialize(obj, existing)

        expect(numberOfUpdates).toBe(1)
        expect(existing.a()).toBe("bbb")
    })

    test("Deserialize into an existing instance with hierarchy - updating only the inner the observable property", () => {
        const obj = { a: { b: "bbb" } }
        const existing = {
            a: ko.observable({
                b: ko.observable("aaa")
            })
        }

        let numberOfOuterUpdates = 0
        let numberOfInnerUpdates = 0
        existing.a.subscribe(() => numberOfOuterUpdates++)
        existing.a().b.subscribe(() => numberOfInnerUpdates++)

        deserialize(obj, existing)

        expect(numberOfOuterUpdates).toBe(0)
        expect(numberOfInnerUpdates).toBe(1)
        expect(existing.a().b()).toBe("bbb")
    })

    test("Deserialize into an existing instance - updating the observable array", () => {
        const obj = { a: ["bbb", "ccc"] }
        const existing = {
            a: ko.observableArray([ko.observable("aaa")])
        }

        let numberOfUpdates = 0
        existing.a.subscribe(() => numberOfUpdates++)

        deserialize(obj, existing)

        expect(numberOfUpdates).toBe(1)
        expect(existing.a().length).toBe(2)

        expect(ko.isObservable(existing.a()[0])).toBeTruthy()
        expect(existing.a()[0]()).toBe("bbb")

        expect(ko.isObservable(existing.a()[1])).toBeTruthy()
        expect(existing.a()[1]()).toBe("ccc")
    })

    test("Deserialize into an existing instance - updating the observable array with same number of elements - the array itself must not change", () => {
        const obj = { a: ["bbb", "ccc"] }
        const existing = {
            a: ko.observableArray([ko.observable("aaa"), ko.observable("aaa2")])
        }

        let numberOfUpdates = 0
        existing.a.subscribe(() => numberOfUpdates++)

        deserialize(obj, existing)

        expect(numberOfUpdates).toBe(0)
        expect(existing.a().length).toBe(2)

        expect(ko.isObservable(existing.a()[0])).toBeTruthy()
        expect(existing.a()[0]()).toBe("bbb")

        expect(ko.isObservable(existing.a()[1])).toBeTruthy()
        expect(existing.a()[1]()).toBe("ccc")
    })

    test("Deserialize into an existing instance - updating the observable array of objects - one element is the same as before", () => {
        const obj = { a: [{ b: 1 }, { b: 2 }] }
        const existing = {
            a: ko.observableArray([
                ko.observable({ b: ko.observable(2) }),
                ko.observable({ b: ko.observable(2) })
            ])
        }

        let numberOfUpdates = 0
        let numberOfUpdates_obj1 = 0
        let numberOfUpdates_obj2 = 0
        let numberOfUpdates_obj1_b = 0
        let numberOfUpdates_obj2_b = 0
        existing.a.subscribe(() => numberOfUpdates++)
        existing.a()[0].subscribe(() => numberOfUpdates_obj1++)
        existing.a()[1].subscribe(() => numberOfUpdates_obj2++)
        existing.a()[0]().b.subscribe(() => numberOfUpdates_obj1_b++)
        existing.a()[1]().b.subscribe(() => numberOfUpdates_obj2_b++)

        deserialize(obj, existing)

        expect(numberOfUpdates).toBe(0)
        expect(numberOfUpdates_obj1).toBe(0)
        expect(numberOfUpdates_obj2).toBe(0)
        expect(numberOfUpdates_obj1_b).toBe(1)
        expect(numberOfUpdates_obj2_b).toBe(0)     // second element is not changed, so no update should occur
        expect(existing.a().length).toBe(2)

        expect(ko.isObservable(existing.a()[0])).toBeTruthy()
        expect(ko.isObservable(existing.a()[0]().b)).toBeTruthy()
        expect(existing.a()[0]().b()).toBe(1)

        expect(ko.isObservable(existing.a()[1])).toBeTruthy()
        expect(ko.isObservable(existing.a()[1]().b)).toBeTruthy()
        expect(existing.a()[1]().b()).toBe(2)
    })

    test("Deserialize into an existing instance - doNotUpdate is ignored in the deserializeAll mode", () => {
        const obj = { a: "bbb", "a$options": { doNotUpdate: true } }
        const existing = {
            a: ko.observable("aaa")
        }

        deserialize(obj, existing, true)
        expect(existing.a()).toBe("bbb")
    })

    test("Deserialize object - check whether the options are copied", () => {
        const obj = deserialize({ a: "aaa", "a$options": { myCustomOption: 1 } })
        expect(ko.isObservable(obj)).toBeFalsy()
        expect(ko.isObservable(obj.a)).toBeTruthy()
        expect(obj["a$options"].myCustomOption).toBe(1)
    })
})

describe("Dotvvm.Deserialization - value type validation", () => {
    const supportedTypes = [
        "int64", "int32", "int16", "int8", "uint64", "uint32", "uint16", "uint8", "decimal", "double", "single"
    ]

    test("null is invalid",
        () => {
            for (const type in supportedTypes) {
                expect(validateType(null, supportedTypes[type])).toBe(false)
            }
        })

    test("undefined is invalid",
        () => {
            for (const type in supportedTypes) {
                expect(validateType(undefined, supportedTypes[type])).toBe(false)
            }
        })

    test("null is valid for nullable",
        () => {
            for (const type in supportedTypes) {
                expect(validateType(null, supportedTypes[type] + "?")).toBe(true)
            }
        })

    test("undefined is valid for nullable",
        () => {
            for (const type in supportedTypes) {
                expect(validateType(undefined, supportedTypes[type] + "?")).toBe(true)
            }
        })

    test("string is invalid",
        () => {
            for (const type in supportedTypes) {
                expect(validateType("string123", supportedTypes[type])).toBe(false)
            }
        })
})


describe("DotVVM.Serialization - serialize", () => {

    test("Serialize scalar number value", () => {
        const obj = ko.observable(10)
        expect(serialize(obj)).toBe(10)
    })

    test("Serialize scalar string value", () => {
        const obj = ko.observable("aaa")
        expect(serialize(obj)).toBe("aaa")
    })

    test("Serialize scalar boolean value", () => {
        const obj = ko.observable(true)
        expect(serialize(obj)).toBe(true)
    })

    test("Deserialize null value", () => {
        const obj = ko.observable(null)
        expect(serialize(obj)).toBe(null)
    })

    test("Serialize object with one property", () => {
        const obj = serialize({
            a: ko.observable("aaa")
        })
        expect(obj.a).toBe("aaa")
    })

    test("Serialize object with doNotPost option", () => {
        const obj = serialize({
            a: ko.observable("aaa"),
            "a$options": { doNotPost: true }
        })
        expect(obj.a).toBeUndefined()
        expect(obj["a$options"]).toBeUndefined()
    })

    test("Serialize Date into string", () => {
        const d = serialize(new Date(Date.UTC(2015, 7, 1, 13, 56, 42)))
        expect(d).toBe("2015-08-01T13:56:42.0000000")
    })

    test("Serialize object with Date property", () => {
        const obj = serialize({
            a: ko.observable(new Date(Date.UTC(2015, 7, 1, 13, 56, 42))),
            "a$options": { isDate: true }
        })
        expect(typeof obj.a).toBe("string")
        expect(new Date(obj.a).getTime()).toBe(new Date(2015, 7, 1, 13, 56, 42).getTime())
        expect(obj["a$options"]).toBeUndefined()
    })

    test("Serialize object with Date property for REST API", () => {
        const obj = serialize({
            a: ko.observable(new Date(Date.UTC(2015, 7, 1, 13, 56, 42))),
            "a$options": { isDate: true }
        }, {
            restApiTarget: true
        })
        expect(obj.a).toBeInstanceOf(Date)
        expect(obj.a.getTime()).toBe(new Date(Date.UTC(2015, 7, 1, 13, 56, 42)).getTime())
        expect(obj["a$options"]).toBeUndefined()
    })

    test("Serialize object with array", () => {
        const obj = serialize({
            a: ko.observableArray([
                ko.observable("aaa"),
                ko.observable("bbb"),
                ko.observable("ccc")
            ])
        })
        expect(obj.a instanceof Array).toBeTruthy()
        expect(obj.a.length).toBe(3)
        expect(obj.a[0]).toBe("aaa")
        expect(obj.a[1]).toBe("bbb")
        expect(obj.a[2]).toBe("ccc")
    })

    test("Serialize object with arrays and subobjects", () => {
        const obj = serialize({
            a: ko.observableArray([
                ko.observable({
                    b: ko.observable(1),
                    c: ko.observableArray([
                        ko.observable(0),
                        ko.observable(1)
                    ])
                })
            ])
        })
        expect(obj.a instanceof Array).toBeTruthy()
        expect(obj.a.length).toBe(1)
        expect(obj.a[0].b).toBe(1)
        expect(obj.a[0].c instanceof Array).toBeTruthy()
        expect(obj.a[0].c[0]).toBe(0)
        expect(obj.a[0].c[1]).toBe(1)
    })

    test("Serialize - doNotPost is ignored in the serializeAll mode", () => {
        const obj = serialize({
            a: ko.observable("bbb"),
            "a$options": { doNotPost: true }
        }, { serializeAll: true })

        expect(obj.a).toBe("bbb")
        expect(obj["a$options"].doNotPost).toBeTruthy()
    })
    test("Serialize - zero should remain zero", () => {
        const obj = serialize({
            a: ko.observable(0)
        }, { serializeAll: true })

        expect(obj.a).toBe(0)
    })
    test("Serialize - ko.observable with undefined should be converted to null", () => {
        const obj = serialize({
            a: ko.observable(undefined)
        }, { serializeAll: true })

        expect(obj.a).toBe(null)
    })

    test("Deserialize - null replaced with object",
        () => {
            const viewModel = {
                selected: ko.observable<any>(null),
                items: ko.observable([
                    ko.observable({
                        id: ko.observable(1)
                    }),
                    ko.observable({
                        id: ko.observable(2)
                    }),
                    ko.observable({
                        id: ko.observable(3)
                    })
                ])
            }

            deserialize(viewModel.items()[0](), viewModel.selected)
            expect(viewModel.selected().id()).toBe(1)
            expect(viewModel.selected()).not.toBe(viewModel.items()[0]())
            expect(viewModel.selected().id).not.toBe(viewModel.items()[0]().id)
        })

    test("Deserialize - null replaced with object and then with another object",
        () => {
            const viewModel = {
                selected: ko.observable<any>(null),
                items: ko.observable([
                    ko.observable({
                        id: ko.observable(1)
                    }),
                    ko.observable({
                        id: ko.observable(2)
                    }),
                    ko.observable({
                        id: ko.observable(3)
                    })
                ])
            }

            deserialize(viewModel.items()[0](), viewModel.selected)
            deserialize(viewModel.items()[1](), viewModel.selected)
            expect(viewModel.selected().id()).toBe(2)
            expect(viewModel.items()[0]().id()).toBe(1)
            expect(viewModel.items()[1]().id()).toBe(2)
        })

    test("Deserialize - check that observable is returned if and only if target is observable - numeric to numeric", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getNumericTg())
        let tg = testData.getNumericTg()

        const numeralResult = assertNotObservable(deserialize(testData.numericVm, tg))
        const numeralUnwrappedResult = assertObservable(deserialize(testData.numericVm, observableTg))
        expect(numeralResult).toBe(testData.numericVm)
        expect(numeralUnwrappedResult).toBe(testData.numericVm)

        expect(observableTg()).toBe(testData.numericVm)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - boolean to boolean", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getBoolTg())
        let tg = testData.getBoolTg()

        const boolResult = assertNotObservable(deserialize(testData.boolVm, tg))
        const boolUnwrappedResult = assertObservable(deserialize(testData.boolVm, observableTg))
        expect(boolResult).toBe(testData.boolVm)
        expect(boolUnwrappedResult).toBe(testData.boolVm)

        expect(observableTg()).toBe(testData.boolVm)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - date to date", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getDateTg())
        let tg = testData.getDateTg()

        const dateResult = assertNotObservable(deserialize(testData.dateVm, tg))
        const dateUnwrappedResult = assertObservable(deserialize(testData.dateVm, observableTg))
        expect(dateResult).toBe(testData.dateVmString)
        expect(dateUnwrappedResult).toBe(testData.dateVmString)

        expect(observableTg()).toBe(testData.dateVmString)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - string to string", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getStringTg())
        let tg = testData.getStringTg()

        const stringResult = assertNotObservable(deserialize(testData.stringVm, tg))
        const stringUnwrappedResult = assertObservable(deserialize(testData.stringVm, observableTg))
        expect(stringResult).toBe(testData.stringVm)
        expect(stringUnwrappedResult).toBe(testData.stringVm)

        expect(observableTg()).toBe(testData.stringVm)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - array[2] to array[2]", () => {
        const testData = new TestData()
        let observableTg: any = ko.observable(testData.getArray2Tg())
        let tg: any = testData.getArray2Tg()

        const array2Result = assertNotObservable(deserialize(testData.array2Vm, tg))
        const array2UnwrappedResult = assertObservableArray(deserialize(testData.array2Vm, observableTg))
        testData.assertArray2Result(array2Result)
        testData.assertArray2Result(array2UnwrappedResult)

        testData.assertArray2Result(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - array[3] to array[2]", () => {
        const testData = new TestData()
        let observableTg: any = ko.observable(testData.getArray2Tg())
        let tg: any = testData.getArray2Tg()

        const array3Result = assertNotObservable(deserialize(testData.array3Vm, tg))
        const array3UnwrappedResult = assertObservableArray(deserialize(testData.array3Vm, observableTg))
        testData.assertArray3Result(array3Result)
        testData.assertArray3Result(array3UnwrappedResult)

        testData.assertArray3Result(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(tg)
        testData.assertObjectResult(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - numeric to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const numeralResult = assertNotObservable(deserialize(testData.numericVm, tg))
        const numeralUnwrappedResult = assertObservable(deserialize(testData.numericVm, observableTg))
        expect(numeralResult).toBe(testData.numericVm)
        expect(numeralUnwrappedResult).toBe(testData.numericVm)

        expect(observableTg()).toBe(testData.numericVm)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - null to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const nullResult = assertNotObservable(deserialize(null, tg))
        const nullUnwrappedResult = assertObservable(deserialize(null, observableTg))
        expect(nullResult).toBe(null)
        expect(nullUnwrappedResult).toBe(null)

        expect(observableTg()).toBe(null)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - boolean to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const boolResult = assertNotObservable(deserialize(testData.boolVm, tg))
        const boolUnwrappedResult = assertObservable(deserialize(testData.boolVm, observableTg))
        expect(boolResult).toBe(testData.boolVm)
        expect(boolUnwrappedResult).toBe(testData.boolVm)

        expect(observableTg()).toBe(testData.boolVm)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - string to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const stringResult = assertNotObservable(deserialize(testData.stringVm, tg))
        const stringUnwrappedResult = assertObservable(deserialize(testData.stringVm, observableTg))
        expect(stringResult).toBe(testData.stringVm)
        expect(stringUnwrappedResult).toBe(testData.stringVm)

        expect(observableTg()).toBe(testData.stringVm)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - date to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const dateResult = assertNotObservable(deserialize(testData.dateVm, tg))
        const dateUnwrappedResult = assertObservable(deserialize(testData.dateVm, observableTg))
        expect(dateResult).toBe(testData.dateVmString)
        expect(dateUnwrappedResult).toBe(testData.dateVmString)

        expect(observableTg()).toBe(testData.dateVmString)
    })

    test("Deserialize - check that observable is returned if and only if target is observable - array[2] to object", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getObjectTg())
        let tg = testData.getObjectTg()

        const dateResult = assertNotObservable(deserialize(testData.array2Vm, tg))
        const dateUnwrappedResult = assertObservableArray(deserialize(testData.array2Vm, observableTg))
        testData.assertArray2Result(dateResult)
        testData.assertArray2Result(dateUnwrappedResult)

        testData.assertArray2Result(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to numeric", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getNumericTg())
        let tg = testData.getNumericTg()

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to null", () => {
        const testData = new TestData()
        let observableTg = ko.observable(null)
        let tg = null

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to boolean", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getBoolTg())
        let tg = testData.getBoolTg()

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to string", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getStringTg())
        let tg = testData.getStringTg()

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to date", () => {
        const testData = new TestData()
        let observableTg = ko.observable(testData.getDateTg())
        let tg = testData.getDateTg()

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(tg)
        testData.assertObjectResult(observableTg())
    })

    test("Deserialize - check that observable is returned if and only if target is observable - object to array[2]", () => {
        const testData = new TestData()
        let tg = testData.getArray2Tg()
        let observableTg = ko.observable(testData.getArray2Tg())

        const objectResult = assertNotObservable(deserialize(testData.objectVm, tg))
        const objectUnwrappedResult = assertObservable(deserialize(testData.objectVm, observableTg))
        testData.assertObjectResult(objectResult)
        testData.assertObjectResult(objectUnwrappedResult)

        testData.assertObjectResult(tg)
        testData.assertObjectResult(observableTg())
    })
})

function assertSubHierarchiesNotLinked(viewmodel: ObservableSubHierarchy, target: ObservableSubHierarchy) {

    viewmodel.Prop21("xx")
    expect(target.Prop21()).toBe("bb")
    //array not linked
    viewmodel.Prop23.push(ko.observable({
        Prop231: ko.observable("ff")
    }))
    expect(target.Prop23().length).toBe(2)
    //array objects not linked
    viewmodel.Prop23!()[0]!().Prop231!("yy")
    expect(target.Prop23()[0]!().Prop231!()).toBe("dd")
}

function assertHierarchy(result: ObservableHierarchy) {
    assertObservableString(result.Prop1, "aa")
    let prop2Object = assertObservable(result.Prop2)
    assertSubHierarchy(prop2Object)
}

function assertSubHierarchy(prop2Object: ObservableSubHierarchy) {
    assertObservableString(prop2Object.Prop21, "bb")
    assertObservableString(prop2Object.Prop22, "cc")
    let prop23Array = assertObservableArray(prop2Object.Prop23)
    let prop23ArrayFirst = assertObservable(prop23Array[0])
    let prop23ArraySecond = assertObservable(prop23Array[1])
    assertObservableString(prop23ArrayFirst.Prop231, "dd")
    assertObservableString(prop23ArraySecond.Prop231, "ee")
}

function createComplexObservableTarget(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                ko.observable({
                    Prop231: ko.observable("d")
                }),
                ko.observable({
                    Prop231: ko.observable("e")
                })
            ])
        })
    })
}

function createComplexObservableTargetWithNullArrayElement(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                null,
                ko.observable({
                    Prop231: ko.observable("e")
                })
            ])
        })
    })
}

function createComplexObservableTargetWithArrayElementPropertyMissing(): KnockoutObservable<any> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                ko.observable({
                }),
                ko.observable({
                    Prop231: ko.observable("e")
                })
            ])
        })
    })
}

function createComplexObservableTargetWithArrayElementPropertyNull(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                ko.observable({
                    Prop231: null
                }),
                ko.observable({
                    Prop231: ko.observable("e")
                })
            ])
        })
    })
}

function createComplexObservableTargetWithArrayElementMissingAndNull(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                null
            ])
        })
    })
}

function createComplexObservableTargetWithArrayElementPropertyObservableNull(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                ko.observable({
                    Prop231: ko.observable(null)
                }),
                ko.observable({
                    Prop231: ko.observable("e")
                })
            ])
        })
    })
}

function createComplexObservableTargetWithMissingArrayElement(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: ko.observable({
            Prop21: ko.observable("b"),
            Prop22: ko.observable("c"),
            Prop23: ko.observableArray([
                ko.observable({
                    Prop231: ko.observable("e")
                })
            ])
        })
    })
}

function createComplexObservableTargetWithNullSubHierarchy(): KnockoutObservable<ObservableHierarchy> {
    return ko.observable({
        Prop1: ko.observable("a"),
        Prop2: null
    })
}

function createComplexObservableTargetWithMissingSubHierarchy(): KnockoutObservable<any> {
    return ko.observable({
        Prop1: ko.observable("a")
    })
}

function createComplexObservableViewmodel(): ObservableHierarchy {
    return {
        Prop1: ko.observable("aa"),
        Prop2: ko.observable(createComplexObservableSubViewmodel())
    }
}

function createComplexObservableSubViewmodel(): ObservableSubHierarchy {
    return {
        Prop21: ko.observable("bb"),
        Prop22: ko.observable("cc"),
        Prop23: ko.observableArray([
            ko.observable({
                Prop231: ko.observable("dd")
            }),
            ko.observable({
                Prop231: ko.observable("ee")
            })
        ])
    }
}

function createComplexNonObservableViewmodel() {
    return {
        Prop1: "aa",
        Prop2: {
            Prop21: "bb",
            Prop22: "cc",
            Prop23: [
                {
                    Prop231: "dd"
                },
                {
                    Prop231: "ee"
                }
            ]
        }
    }
}


class TestData {
    numericVm: number = 5
    boolVm: boolean = true
    stringVm: string = "viewmodel"
    dateVm: Date = new Date(1995, 11, 17)
    dateVmString: string = serializeDate(new Date(1995, 11, 17))!   // "new Date(1995, 11, 17)" depends on the local timezone, we need the the string representation to correspond with that
    array2Vm = ["aa", "bb"]
    array3Vm = ["aa", "bb", "cc"]
    objectVm = { Prop1: "aa", Prop2: "bb" }

    getNumericTg(): number {
        return 7
    }
    getBoolTg(): boolean {
        return false
    }
    getDateTg(): Date {
        return new Date(2019, 1, 1)
    }
    getStringTg(): string {
        return "target"
    }
    getArray2Tg(): string[] {
        return ["a", "b"]
    }
    getObjectTg(): any {
        return {
            Prop1: "a",
            Prop2: "b"
        }
    }

    assertArray2Result(array2: KnockoutObservable<string>[]): void {
        expect(array2 instanceof Array).toBeTruthy()
        expect(array2.length).toBe(2)

        const item0 = assertObservable(array2[0])
        expect(item0).toBe("aa")

        const item1 = assertObservable(array2[1])
        expect(item1).toBe("bb")
    }

    assertArray3Result(array3: KnockoutObservable<string>[]): void {
        expect(array3 instanceof Array).toBeTruthy()
        expect(array3.length).toBe(3)

        const item0 = assertObservable(array3[0])
        expect(item0).toBe("aa")

        const item1 = assertObservable(array3[1])
        expect(item1).toBe("bb")

        const item2 = assertObservable(array3[2])
        expect(item2).toBe("cc")
    }

    assertObjectResult(object: any): void {
        expect(object instanceof Object).toBeTruthy()

        const prop1 = assertObservable(object.Prop1)
        expect(prop1).toBe("aa")

        const prop2 = assertObservable(object.Prop2)
        expect(prop2).toBe("bb")
    }
}

interface ObservableHierarchy {
    Prop1: KnockoutObservable<string>
    Prop2: null | KnockoutObservable<ObservableSubHierarchy>
}

interface ObservableSubHierarchy {
    Prop21: KnockoutObservable<string>
    Prop22: KnockoutObservable<string>
    Prop23: KnockoutObservableArray<null | KnockoutObservable<{ Prop231: null | KnockoutObservable<null | string> }>>
}
