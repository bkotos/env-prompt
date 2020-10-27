const bgCyan = (message: string): string => `\x1b[46m${message}\x1b[0m`
const fgRed = (message: string): string => `\x1b[31m${message}\x1b[0m`
const fgYellow = (message: string): string => `\x1b[33m${message}\x1b[0m`
const fgGreen = (message: string): string => `\x1b[32m${message}\x1b[0m`
const bold = (message: string): string => `\x1b[1m${message}\x1b[0m`

const buildQuestion = (name: string, defaultValue: string = null): string => {
    const hasDefaultValue = defaultValue && defaultValue.trim().length > 0
    const defaultValuePrompt = hasDefaultValue ? `(${fgYellow(defaultValue)})` : ''
    return `${bgCyan(name)}${defaultValuePrompt}: `
}

export const printError = (error: Error) => console.error(fgRed('ERROR: ' + error.message))
