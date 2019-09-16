import Parser from "./Parser.mjs";

class RootParser extends Parser {
	isStartOf(tokens, index) {
		return false;
	}
	
	get isRoot() {
		return true;
	}
}

export default RootParser;
