const envFile = `#Brian
hello=world
hello = world
hello  =  "world"
`

enum Token {
    identifier,
    assignmentOperator,
    value,
    comment,
    lineBreak
}

interface Statement {
    lexemes: Lexeme[]
}

type LexemeValueIndicesByIdentifier = Record<string, number>

interface IndexedLexemes {
    lexemes: Lexeme[]
    index: LexemeValueIndicesByIdentifier
}

export const analyzeAndIndexContent = (content: string): IndexedLexemes => {
    const lexemes = Lexical.analyze(content)
    const index = indexLexemes(lexemes)

    return { lexemes, index }
}

const indexLexemes = (lexemes: Lexeme[]): LexemeValueIndicesByIdentifier => {
    const line = 0
    const index: LexemeValueIndicesByIdentifier = {}

    lexemes.forEach((lexeme, i) => {
        const isValue = lexeme.token === Token.value
        if (isValue) {
            const identifier = lexemes[i - 2].value
            index[identifier] = i
        }
    })

    return index
}

interface Lexeme {
    value: string
    token: Token
}

export namespace Lexical {
    export const analyze = (content: string): Lexeme[] => {
        console.log(content)
        console.log('\n-----')
        const lexemeList: Lexeme[] = []

        let isEnd
        let lastToken: Token = null
        let remainingContent = content
        do {
            const {lexeme, remainingString} = matchToken(remainingContent, lastToken)
            remainingContent = remainingString
            lexemeList.push(lexeme)
            lastToken = lexeme.token
            isEnd = !remainingString
        } while (!isEnd)

        return lexemeList
    }

    const matchToken = (content: string, lastToken: Token = null): TokenAnalysis => {
        const isFirstLexeme = lastToken === null
        if (isFirstLexeme) return getStatementStartLexeme(content)

        return {
            [Token.identifier]: () => getAssignmentOperatorLexeme(content),
            [Token.assignmentOperator]: () => getValueLexeme(content),
            [Token.value]: () => getStatementStartLexeme(content),
            [Token.comment]: () => getStatementStartLexeme(content),
            [Token.lineBreak]: () => getStatementStartLexeme(content),
        }[lastToken]()
    }

    const getStatementStartLexeme = (string: string): TokenAnalysis => {
        let lexeme: TokenAnalysis
        const analyzers = [getLineBreakLexeme, getIdentifierLexeme, getCommentLexeme]
        analyzers.some((f, i) => {
            try {
                lexeme = f(string)
            } catch (e) {
                const isLast = i + 1 === analyzers.length
                if (isLast) {
                    throw e
                }
                return false
            }
            return true
        })
        return lexeme
    }

    const getIdentifierLexeme = (string: string): TokenAnalysis =>
        parseToken(Token.identifier).fromString(string, (char, i, stop) => {
            const isFirstChar = i === 0
            if (isFirstChar) {
                const isValidFirstChar = /^[a-zA-Z_]$/.test(char)
                if (!isValidFirstChar) {
                    throw new Error('Variable names can only start with letters or underscores.')
                }
            } else {
                const isValidChar = /^[a-zA-Z_0-9]$/.test(char)
                if (!isValidChar) {
                    const isEnd = /^[=# ]$/.test(char)
                    if (!isEnd) {
                        throw new Error('Variables can only be named with letters, numbers, and underscores.')
                    }
                    stop()
                }
            }
            return char
        })

    const getAssignmentOperatorLexeme = (string: string): TokenAnalysis =>
        parseToken(Token.assignmentOperator).fromString(string, (char, i, stop) => {
            const isFirstChar = i === 0
            if (isFirstChar) {
                const isAssignmentOperator = char === '='
                if (!isAssignmentOperator) {
                    throw new Error('Expected =')
                }
                return char
            } else {
                stop()
            }
        })

    const getValueLexeme = (string: string): TokenAnalysis => {
        let isValueStarted, isQuotedValue = false, outerQuoteChar = null

        return parseToken(Token.value).fromString(string, (char, i, stop) => {
            const isSpace = char === ' '
            const isBeginningOfValue = !isValueStarted && !isSpace

            if (isBeginningOfValue) {
                isValueStarted = true
                const isQuote = /^["']^/.test(char)
                if (isQuote) {
                    isQuotedValue = true
                    outerQuoteChar = char
                    return
                }
            }

            const isEndingOuterQuote = isQuotedValue && char === outerQuoteChar
            const isComment = char === '#' && !isQuotedValue
            const isQuotedLineBreak = isQuotedValue && isLineBreak(string, i)
            if (isQuotedValue) {
                if (isEndingOuterQuote) {
                    stop()
                } else {
                    return char
                }
            } else if (isComment || isQuotedLineBreak) {
                stop()
            } else {
                return char
            }
        })
    }

    const getCommentLexeme = (string: string): TokenAnalysis =>
        parseToken(Token.comment).fromString(string, (char, i, stop) => {
            const isFirstChar = i === 0
            if (isFirstChar) {
                const isValidFirstChar = char === '#'
                if (!isValidFirstChar) {
                    throw new Error('Expected #')
                }
            } else if (isLineBreak(string, i)) {
                stop()
            } else {
                return char
            }
        })

    const getLineBreakLexeme = (string: string): TokenAnalysis => {
        let isUnixLineBreak = false
        let isWindowsLineBreak = false

        // unix = \n
        // windows = \r\n OR \r
        return parseToken(Token.lineBreak).fromString(string, (char, i, stop) => {
            const isFirstChar = i === 0
            const isSecondChar = i === 1
            const isLineFeed = char === '\n'
            const isCarriageReturn = char === '\r'
            const isFullWindowsLineBreak = isSecondChar && isWindowsLineBreak && isCarriageReturn

            if (isFirstChar) {
                const isValidFirstChar = isLineFeed || isCarriageReturn
                if (isValidFirstChar) {
                    if (isLineFeed) {
                        isUnixLineBreak = true
                    } else if (isCarriageReturn) {
                        isWindowsLineBreak = true
                    }
                    return char
                }
                throw new Error('Expected line break')
            } else if (isFullWindowsLineBreak) {
                return char
            } else {
                stop()
            }
        })
    }

    const isLineBreak = (string: string, i: number): boolean => /^\n|(?:\r\n?)/.test(string.slice(i, i + 2))

    interface TokenAnalysis {
        lexeme: Lexeme,
        remainingString: string
    }

    type LexicalAnalyst = (char: string, index: number, stop: () => void) => string | void

    const parseToken = (token: Token) => ({
        fromString: (string: string, analyst: LexicalAnalyst): TokenAnalysis => {
            let value = ''

            let i, endIndex = 0, stop = false
            for (i = 0; i < string.length; i++) {
                const char = string[i]
                const analyzedChar = analyst(char, i, () => stop = true)
                if (stop) {
                    break
                }
                endIndex = i

                const isCharOmmitted = !analyzedChar
                if (!isCharOmmitted) {
                    value += analyzedChar
                }
            }
            const remainingString = string.slice(endIndex + 1)

            const lexeme: Lexeme = {value, token}
            return {lexeme, remainingString}
        }
    })

    const forEachChar = (
        content: string,
        iterator: (
            char: string,
            index: number,
            stop: () => void
        ) => void | boolean
    ) => {
        let stop = false
        for (let i = 0; i < content.length; i++) {
            const char = content[i]
            iterator(char, i, () => stop = true)
            if (stop) {
                break
            }
        }
    }
}
