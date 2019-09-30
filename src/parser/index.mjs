import Keywords from "../lexer/Keywords.mjs";
import ParserAssignment from "./ParserAssignment.mjs";
import ParserAtom from "./ParserAtom.mjs";
import ParserExpression from "./ParserExpression.mjs";

const getUtils = (parser, tokens, start, options) => ({
	getType(type) {
		if(!type.startsWith('KeywordType')) return null;
		
		return Keywords[type];
	},
	
	getOperatorPriority(type) {
		if(!type.startsWith('Operator')) return null;
		
		switch(type) {
			case 'OperatorAdd':
			case 'OperatorSubtract':
				return 0;
			
			case 'OperatorMultiply':
			case 'OperatorDivide':
				return 1;
		}
	},
	
	getParser(parserName) {
		return parsersMap.get(parserName);
	},
	
	parse(parserName, tokens) {
		const parser = parsersMap.get(parserName);
		return parser.parse(tokens, 0, getUtils(parser, tokens, 0, options), options);
	},
	
	find(target, pair = null, begin = start + 1, startLevel = 1) {
		for(let i = begin; i < tokens.length; i++) {
			if(tokens[i].type === target) startLevel--;
			else if(tokens[i].type === pair) startLevel++;
			
			if(startLevel === 0) return i;
		}
		
		return -1;
	}
});

const parsers = [new ParserAssignment, new ParserAtom, new ParserExpression];
const rootParsers = parsers.filter(v => v.isRoot);
const parsersMap = new Map(parsers.map(parser => [parser.name, parser]));

export default function parse(tokens, options = {}) {
	const optionsMerged = Object.assign({
		debug: false
	}, options);
	
	for(let i = 0; i < tokens.length; i++) {
		for(let parser of rootParsers) {
			const utils = getUtils(parser, tokens, i, optionsMerged);
			if(!parser.isStartOf(tokens, i, utils)) continue;
			
			const {consume, nodes} = parser.parse(tokens, i, utils, optionsMerged);
			tokens.splice(i, consume, ...nodes);
			console.log("Consumed", consume, "At index", i, tokens);
			i += nodes.length;
			break;
		}
	}
	
	return {
		name: 'Program',
		children: tokens
	};
};
