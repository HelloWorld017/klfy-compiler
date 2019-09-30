import Parser from "./Parser.mjs";
import UnexpectedTokenError from "./errors/UnexpectedTokenError.mjs";

class ParserArgument extends Parser {
	constructor() {
		super('Argument');
	}
	
	parse(tokens, start, {parse, find, getType}, options) {
		let i = start;
		const nodes = [];
		
		if(tokens[start].type !== 'KeywordParenLeft')
			throw new UnexpectedTokenError(tokens[start], 'ParenLeft');
		
		i++;
		const end = find()
		
		while(true) {
			if(tokens[i].type === 'KeywordParenRight') {
				break;
			}
			
			let tempNode = {
				name: 'ArgumentDefinitionItem'
			};
			
			if(!tokens[i])
				throw new UnexpectedTokenError(tokens[i], 'ParenRight');
			
			if(tokens[i].type === 'KeywordOut') {
				tempNode.out = true;
				i++;
			}
			
			tempNode.type = getType((tokens[i] || {}).type);
			if(!tempNode.type)
				throw new UnexpectedTokenError(tokens[i], 'Type');
			i++
			
			if(!tokens[i] || tokens[i].type !== 'Name')
				throw new UnexpectedTokenError(tokens[i], 'Name');
			
			tempNode.name = token[i].content;
			nodes.push(tempNode);
		}
		
		return {
			consume: consume,
			nodes: [
				{
					name: 'ArgumentDefinition',
					children: nodes
				}
			]
		};
	}
}

export default ParserArgumentDefinition;
