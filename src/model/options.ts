export type ArgumentName = string
export type ArgumentValue = string | boolean

export type RawArgument = string
export type ParsedArgument = [ArgumentName, ArgumentValue]
export type ParsedArgumentMap = Record<ArgumentName, ArgumentValue>

export enum Format { env }

export interface Options {
    distFile: string
    localFile: string
    format: Format
}
type OptionName = keyof Options
type OptionValue = Options[OptionName]
export type Option = [OptionName, OptionValue]

export type OptionNameByArgumentName = Record<ArgumentName, OptionName>
