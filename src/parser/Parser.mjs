class Parser {
	constructor(name) {
		this.name = name;
	}
	
	parse(tokens, start, utils, options) {
		return [];
	}
	
	get isRoot() {
		return false;
	}
}

export default Parser;
