class Parser {
	constructor(name) {
		this.name = name;
	}
	
	parse(tokens, start, parsers, options) {
		return [];
	}
	
	get isRoot() {
		return false;
	}
}

export default Parser;
