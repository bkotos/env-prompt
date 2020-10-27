import { Lexical } from "../../../../src/lib/format/env";

describe('foo', () => {
    test('bar', () => {
        console.log('start')
        const foo = Lexical.analyze('HELLO=WORLD#yoyoyo')
        console.log('end')
        console.log(foo)
    })
})
