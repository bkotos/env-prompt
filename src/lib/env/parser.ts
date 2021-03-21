import { getColumn, getLine, Token, TokenType } from "lib/env/lexer"

enum NodeType {
    literal = 'literal',
    quotedLiteral = 'quotedLiteral',
    identifier = 'identifier',
    variableDeclaration = 'variableDeclaration',
    comment = 'comment',
    newline = 'newline',
    document = 'document'
}

enum QuoteType {
    single = '\'',
    double = '"'
}

interface Node {
    type: NodeType
}

interface RawLiteralNode extends Node {
    value: string
}

interface QuotedLiteralNode extends Node {
    quoteType: QuoteType
    content: RawLiteralNode|null
}

type LiteralNode = RawLiteralNode | QuotedLiteralNode

interface IdentifierNode extends Node {
    name: string
}

interface VariableDeclarationNode extends Node {
    identifier: IdentifierNode
    value?: LiteralNode
}

interface CommentNode extends Node {
    body: string|null
}

interface NewlineNode extends Node {}

type StatementNode = NewlineNode | CommentNode | VariableDeclarationNode

interface DocumentNode extends Node {
    statements: StatementNode[]
}

type VariablesByName = Record<IdentifierNode['name'], VariableDeclarationNode>

export interface ParsedEnvDocument {
    variablesByName: VariablesByName
    abstractSyntaxTree: DocumentNode
}

export const parseEnvTokens = (tokens: Token[]): ParsedEnvDocument => {
    const document: DocumentNode = {
        type: NodeType.document,
        statements: []
    }
    const variablesByName: VariablesByName = {}

    for (let i = 0; i < tokens.length;) {
        const firstToken = tokens[i++]

        const isWhiteSpace = firstToken.type === TokenType.whitespace
        if (isWhiteSpace) continue

        const isNewline = firstToken.type === TokenType.newline
        if (isNewline) {
            const newline: NewlineNode = {
                type: NodeType.newline
            }
            document.statements.push(newline)
            continue
        }

        const isComment = firstToken.type === TokenType.comment
        if (isComment) {
            const secondToken = tokens[i++]
            const isLastToken = !secondToken
            const isNewline = secondToken && secondToken.type === TokenType.newline

            const isCommentWithoutBody = isLastToken || isNewline
            if (isCommentWithoutBody) {
                if (isNewline) i--

                const comment: CommentNode = {
                    type: NodeType.comment,
                    body: null
                }
                document.statements.push(comment)
                continue
            }

            const isCommentWithBody = secondToken.type === TokenType.commentBody
            if (isCommentWithBody) {
                const comment: CommentNode = {
                    type: NodeType.comment,
                    body: secondToken.value
                }
                document.statements.push(comment)

                const thirdToken = tokens[i]
                const isLastToken = !thirdToken
                const isNewline = thirdToken && thirdToken.type === TokenType.newline
                const isCorrectlyTerminated = isLastToken || isNewline
                if (isCorrectlyTerminated) continue
            }
            
            throw new Error(`Expected newline or end of document after comment ${getPositionDescription(firstToken)}.`)
        }

        const isVariableDeclaration = firstToken.type === TokenType.identifier
        if (isVariableDeclaration) {
            const variableName = firstToken.value

            const secondToken = tokens[i++]
            const hasAssignmentOperator = secondToken && secondToken.type === TokenType.operator && secondToken.value === '='
            if (!hasAssignmentOperator) throw new Error(`Expected = after variable "${variableName}" ${getPositionDescription(firstToken)}.`)

            let value: LiteralNode | QuotedLiteralNode
            for (; i < tokens.length;) {
                const token = tokens[i++]

                const isWhitespace = token.type === TokenType.whitespace
                const isLiteral = token.type === TokenType.literal
                const isQuote = token.type === TokenType.quote
                const isNewline = token.type === TokenType.newline
                const isComment = token.type === TokenType.comment

                if (isWhitespace) continue

                if (isQuote) {
                    const isOpeningQuote = !value || value.type !== NodeType.quotedLiteral
                    const isClosingQuote = value && value.type === NodeType.quotedLiteral
                    
                    if (isOpeningQuote) {
                        value = {
                            type: NodeType.quotedLiteral,
                            quoteType: token.value === '"' ? QuoteType.double : QuoteType.single,
                            content: null
                        }
                        continue
                    }

                    if (isClosingQuote) continue
                    
                    throw new Error(`Unexpected ${token.value} ${getPositionDescription(firstToken)}.`)
                }

                if (isLiteral) {
                    const literal: LiteralNode = {
                        type: NodeType.literal,
                        value: token.value
                    }

                    const isQuotedLiteral = value && value.type === NodeType.quotedLiteral
                    if (isQuotedLiteral) (value as QuotedLiteralNode).content = literal
                    else value = literal
                    continue
                }

                if (isNewline || isComment) {
                    i--
                    break
                }

                throw new Error(`Expected line break or comment after variable declaration ${getPositionDescription(firstToken)}.`)
            }

            const variableDeclaration: VariableDeclarationNode = {
                type: NodeType.variableDeclaration,
                identifier: {
                    type: NodeType.identifier,
                    name: variableName
                },
                value
            }
            // TODO throw error if variable already declared... also add option for it
            variablesByName[variableDeclaration.identifier.name] = variableDeclaration
            document.statements.push(variableDeclaration)
            continue
        }
    }

    return {
        variablesByName,
        abstractSyntaxTree: document
    }
}

const getNextLine = (token: Token): number => getLine([token])
const getNextColumn = (token: Token): number => getColumn([token])
const getPositionDescription = (token: Token): string => `at line ${getNextLine(token)} column ${getNextColumn(token)}`