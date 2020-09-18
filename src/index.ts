import 'source-map-support/register'

import {HAS_ERROR} from './error'
import * as fs from 'fs'
import {Scanner} from './scanner'
import {Parser} from './parser'
import * as Ast from './ast'
import {fromAst} from './backends/bytecode/instruction'

const VALID_MODES = ['--stdin', '--file']

export async function main(args: string[]) {
	const mode = args[0]

	if (!VALID_MODES.includes(mode)) {
		console.log(`Invalid mode. Please specify one of ${VALID_MODES}`)
		process.exit(1)
	}

	let fileContent: string
	if (mode === '--stdin') {
		fileContent = await readStdin()
	} else {
		const filename = args[1]
		if (!filename) {
			console.log('Please specify <filename>')
			process.exit(1)
		}
		fileContent = fs.readFileSync(filename, 'utf8')
	}

	const tokens = Scanner.scanText(fileContent)
	const ast = Parser.parseTokens(tokens)
	if (HAS_ERROR || ast === null) {
		process.exit(1)
	}
	const nonNullStatements = ast.filter((s): s is Ast.Stmt => s !== null)
	const bytecode = fromAst(nonNullStatements)
	process.stdout.write(bytecode)
}

function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		let finalString = ''
		process.stdin.on('data', (data: Buffer) => {
			const text = data.toString('utf8')
			finalString += text
		})

		process.stdin.on('close', () => {
			resolve(finalString)
		})
	})
}

main(process.argv.slice(2))





