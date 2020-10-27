import { getOptionsFromRawArguments } from "@/lib/options";
import {printError} from "@/lib/user-interaction";
import {analyzeAndIndexContent, Lexical} from "@/lib/format/env";

const errorHandler = (e: Error) => {
    printError(e)
    process.exit(1)
}

process
    .on('unhandledRejection', errorHandler)
    .on('uncaughtException', errorHandler)

const options = getOptionsFromRawArguments(process.argv)
console.log({ options })


const foo = analyzeAndIndexContent(
`# FOO BAR
HELLO=WORLD # HELLO WORLD
foo=123
FOO="bar
#dude`
)

// const foo = Lexical.analyze(
// `HELLO=WORLD#yoyoyo`
// )
console.log(foo)
