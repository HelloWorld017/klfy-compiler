import RootParser from "./RootParser.mjs";
import UnexpectedTokenError from "./errors/UnexpectedTokenError.mjs";

class ParserAssignment extends RootParser {
	constructor() {
		super('Assignment');
	}
	
	isStartOf(tokens, index) {
		return tokens.length >= 2 &&
			((tokens[index].type === 'Name') && (tokens[index + 1].type === 'Assignment')) ||
			(tokens[index].type === 'KeywordLet');
	}
	
	parse(tokens, start, {parse, find, getType}, options) {
		let consume = 0;
		const nodes = [];
		
		if(tokens[start].type === 'KeywordLet') {
			const variableType = getType(tokens[start + 1].type);
			
			if(!tokens[start + 1] || !variableType)
				throw new UnexpectedTokenError(tokens[start + 1], 'Type');
			
			if(!tokens[start + 2] || tokens[start + 2].type !== 'Name')
				throw new UnexpectedTokenError(tokens[start + 2], 'Name');
			
			consume += 2;
			nodes.push({
				name: 'VariableDeclaration',
				content: {
					type: variableType,
					name: tokens[start + 2].content
				},
				token: tokens[start]
			});
		}
		
		if(tokens[start + consume + 1] && tokens[start + consume + 1].type === 'Assignment') {
			const newLine = find('NewLine', null, start + consume + 2);
			if(newLine === -1)
				throw new UnexpectedTokenError(tokens[tokens.length - 1], 'Semicolon');
			
			const {consume: childrenConsume, nodes: children}
				= parse('Expression', tokens.slice(start + consume + 2, newLine));
			
			nodes.push({
				name: 'Assignment',
				content: {
					name: tokens[start + consume].content
				},
				children,
				token: tokens[start + consume + 1]
			});
			
			consume += 2 + childrenConsume;
			
		} else if (tokens[start + consume + 1].type !== 'NewLine') {
			throw new UnexpectedTokenError(tokens[start + consume + 1], 'Semicolon');
		} else {
			consume++;
		}
		
		return {
			consume: consume,
			nodes
		};
	}
}

export default ParserAssignment;
