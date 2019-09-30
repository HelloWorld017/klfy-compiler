import {displaySyntaxError, toSigmaJson} from "./utils/index.mjs";
import fs from "fs";
import parse from "./parser/index.mjs";

import Lexer from "./lexer/Lexer.mjs";

(async () => {
	const source = await fs.promises.readFile('./examples/expression.klfy', 'utf8');
	const lexer = new Lexer(source);
	
	try {
		const tokens = lexer.lex();
		const tree = parse(tokens);
		console.log(JSON.stringify(tree, null, '\t'));
		await fs.promises.writeFile('./tools/data.json', JSON.stringify(toSigmaJson(tree)));
	} catch(e) {
		if(e.type === 'LexerError' || e.type === 'ParserError') {
			console.error(displaySyntaxError(e, source));
			return;
		}
		
		console.error(e);
	}
})();
