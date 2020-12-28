enum TokenType {
    identifier,
    operator,
    literal,
    quote,
    newline,
    whitespace,
    comment,
    commentBody
}

interface Token {
    type: TokenType,
    position: number,
    length: number,
    value: string
}

const src =
`HELLO=WORLD
FOO = BAR #yeetyeetyeet
# this is a comment!
FOO="12345"
ANOTHER=thing my dude`

const main = (src: string) => {
    const tokens: Token[] = []
    for (let i = 0; i < src.length;) {
        const token = getTokenAtPosition(src, i, tokens)
        tokens.push(token)
        i += token.length
    }
    console.log(src)
    console.log(tokens)
}

const QUOTE_EXPRESSION = /^["']$/
const OPERATOR_EXPRESSION = /^=$/
const COMMENT_EXPRESSION = /^#$/
const IDENTIFIER_START_EXPRESSION = /^[a-zA-Z]$/
const IDENTIFIER_END_EXPRESSION = /^[^a-zA-Z0-9_-]$/

const getLastNonWhiteSpaceToken = (previousTokens: Token[]): Token|null => {
    for (let i = previousTokens.length - 1; i >= 0; i--) {
        const token = previousTokens[i]
        const isWhiteSpace = token.type === TokenType.whitespace
        if (!isWhiteSpace) {
            return token
        }
    }
    return null
}

const hasAssignmentOperatorOnCurrentLine = (previousTokens: Token[]) => {
    for (let i = previousTokens.length - 1; i >= 0; i--) {
        const { type, value } = previousTokens[i]

        const isAssignmentOperator = type === TokenType.operator && value === '='
        if (isAssignmentOperator) {
            return true
        }

        const isNewline = type === TokenType.newline
        if (isNewline) {
            return false
        }
    }

    return false
}

const isLastTokenComment = (previousTokens: Token[]) =>
    previousTokens.length > 0 && previousTokens[previousTokens.length - 1].type === TokenType.comment

const getTokenAtPosition = (src: string, position: number, tokens: Token[]): Token => {
    let i = position
    let value = src[i++]

    const isNewline = value === '\n'
    if (isNewline) {
        return {
            type: TokenType.newline,
            position,
            length: value.length,
            value
        }
    }

    const isComment = COMMENT_EXPRESSION.test(value)
    if (isComment) {
        return {
            type: TokenType.comment,
            position,
            length: value.length,
            value
        }
    }

    const isCommentBody = isLastTokenComment(tokens)
    if (isCommentBody) {
        for (; i < src.length; i++) {
            const char = src[i]
            const isNewline = char === '\n'
            if (isNewline) {
                break
            }

            value = `${value}${char}`
        }
        return {
            type: TokenType.commentBody,
            position,
            length: value.length,
            value
        }
    }

    const isWhiteSpace = value === ' '
    if (isWhiteSpace) {
        return {
            type: TokenType.whitespace,
            position,
            length: value.length,
            value
        }
    }

    const isQuote = QUOTE_EXPRESSION.test(value)
    if (isQuote) {
        return {
            type: TokenType.quote,
            position,
            length: value.length,
            value
        }
    }

    const isOperator = OPERATOR_EXPRESSION.test(value)
    if (isOperator) {
        return {
            type: TokenType.operator,
            position,
            length: value.length,
            value
        }
    }

    const isLiteral = hasAssignmentOperatorOnCurrentLine(tokens)
    if (isLiteral) {
        const previousToken = getLastNonWhiteSpaceToken(tokens)
        const isQuotedValue = previousToken.type === TokenType.quote

        for (; i < src.length; i++) {
            const char = src[i]
            const isClosingQuote = char === previousToken.value
            const isNewline = char === '\n'

            if ((isQuotedValue && isClosingQuote) || isNewline) {
                break
            }

            value = `${value}${char}`
        }

        return {
            type: TokenType.literal,
            position,
            length: value.length,
            value
        }
    }

    const isIdentifier = IDENTIFIER_START_EXPRESSION.test(value)
    if (isIdentifier) {
        for (; i < src.length; i++) {
            const char = src[i]
            const isEndOfIdentifier = IDENTIFIER_END_EXPRESSION.test(char)
            if (isEndOfIdentifier) {
                break
            }

            value = `${value}${char}`
        }
        return {
            type: TokenType.identifier,
            position,
            length: value.length,
            value
        }
    }
}

main(src)
