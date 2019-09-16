import {displaySyntaxError} from "./utils/index.mjs";
import fs from "fs";

import Lexer from "./lexer/Lexer.mjs";

(async () => {
	const source = await fs.promises.readFile('./examples/99class.klfy', 'utf8');
	const lexer = new Lexer(source);
	
	try {
		const tokens = lexer.lex();
		console.log(tokens);
	} catch(e) {
		if(e.type === 'LexerError') {
			console.log(lexer.tokens);
			console.error(displaySyntaxError(e));
			return;
		}
		
		console.error(e);
	}
})();
