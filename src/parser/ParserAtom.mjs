import Parser from "./Parser.mjs";

class ParserAtom extends Parser {
	constructor() {
		super('Atom');
	}
	
	parse(tokens, start, parsers, options) {
		switch(tokens[start].type) {
			
		}
	}
}

export default ParserAtom;
