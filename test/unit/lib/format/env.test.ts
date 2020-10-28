import {analyzeAndIndexContent, IndexedLexemes, Token} from "../../../../src/lib/format/env";

describe('foo', () => {
    test('bar', () => {
        const envContentWithInlineComment = analyzeAndIndexContent('HELLO=WORLD# this is a test')
        expect(envContentWithInlineComment).toMatchObject({
            lexemes: [
                { value: 'HELLO', token: Token.identifier },
                { value: '=', token: Token.assignmentOperator },
                { value: 'WORLD', token: Token.value },
                { value: ' this is a test', token: Token.comment }
            ],
            index: { HELLO: 2 }
        } as IndexedLexemes)

        const envContentWithValuesAndComments = analyzeAndIndexContent(
            '#start\n' +
            'test=1234\n' +
            '#test\n' +
            'this="is a string"'
        )
        expect(envContentWithValuesAndComments).toMatchObject({
            lexemes: [
                { value: 'start', token: Token.comment },
                { value: '\n', token: Token.lineBreak },
                { value: 'test', token: Token.identifier },
                { value: '=', token: Token.assignmentOperator },
                { value: '1234', token: Token.value },
                { value: '\n', token: Token.lineBreak },
                { value: 'test', token: Token.comment },
                { value: '\n', token: Token.lineBreak },
                { value: 'this', token: Token.identifier },
                { value: '=', token: Token.assignmentOperator },
                { value: 'is a string', token: Token.value },
            ]
        } as IndexedLexemes)

        const envContentWithMultiLineString = analyzeAndIndexContent(
            '# some random comment ###\n' +
            'this_iS="a multi-line\n' +
            '#STRING\n' +
            'and=IS \'very\' COOL"'
        )
        expect(envContentWithMultiLineString).toMatchObject({
            lexemes: [
                { value: ' some random comment ###', token: Token.comment },
                { value: '\n', token: Token.lineBreak },
                { value: 'this_iS', token: Token.identifier },
                { value: '=', token: Token.assignmentOperator },
                {
                    value:
                        'a multi-line\n' +
                        '#STRING\n' +
                        'and=IS \'very\' COOL',
                    token: Token.value
                },
            ],
            index: { this_iS: 4 }
        } as IndexedLexemes)
    })
})
