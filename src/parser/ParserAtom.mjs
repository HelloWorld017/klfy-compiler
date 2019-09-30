import Parser from "./Parser.mjs";
import UnexpectedTokenError from "./errors/UnexpectedTokenError.mjs";

class ParserAtom extends Parser {
	constructor() {
		super('Atom');
	}
	
	getEscape(code) {
		switch(code) {
			case 'r': return '\r';
			case 'n': return '\n';
			case 't': return '\t';
			case '"': return '"';
			case "'": return "'";
			case '\\': return '\\';
		}
	}
	
	get handlingTokens() {
		return [
			'String', 'Char', 'Number', 'Name',
			'KeywordTrue', 'KeywordFalse', 'KeywordNil',
			'AngleBracketLeft'
		];
	}
	
	parse(tokens, start, {parse, find}, options) {
		const token = tokens[start];
		let atom = null;
		
		switch(token.type) {
			case 'String':
				atom = {
					name: 'Atom',
					atomType: 'Literal',
					type: 'str',
					content: token.children.reduce((string, childToken) => {
						if(childToken.type === 'Escape') return string + this.getEscape(childToken.content);
						return string + childToken.content;
					}, '')
				};
				break;
			
			case 'Char':
				atom = {
					name: 'Atom',
					atomType: 'Literal',
					type: 'uint'
				};
				
				const childToken = token.children[0];
				
				if(childToken.type === 'Escape') atom.content = this.getEscape(childToken.content);
				else atom.content = childToken.content;
				
				atom.content = atom.content.codePointAt(0);
				break;

			case 'Number':
				atom = {
					name: 'Atom',
					atomType: 'Literal',
					type: 'uint',
					content: token.content
				};
				break;
			
			case 'Name':
				atom = {
					name: 'Atom',
					atomType: 'Variable',
					content: token.content
				};
				break;
				
			case 'KeywordTrue':
				atom = {
					name: 'Atom',
					atomType: 'Literal',
					type: 'bool',
					content: true
				};
				break;
				
			case 'KeywordFalse':
				atom = {
					name: 'Atom',
					atomType: 'Literal',
					type: 'bool',
					content: false
				};
				break;
			
			case 'KeywordNil':
				atom = {
					name: 'Atom',
					atomType: 'Nil'
				};
				break;
		}
		
		if(atom) {
			atom.token = tokens[start];
			
			return {
				consume: 1,
				nodes: [atom]
			};
		}
		
		if(token.type !== 'AngleBracketLeft')
			throw new UnexpectedTokenError(tokens[start]);
		
		const matching = find('AngleBracketRight', 'AngleBracketLeft');
		if(matching < 0)
			throw new UnexpectedTokenError(tokens[start]);
		
		tokens.slice(start + 1, matching);
		
		return {
			consume: matching - start + 1,
			nodes: [{
				name: 'Atom',
				atomType: 'Memory',
				children: parse('Expression', tokens).nodes,
				token: tokens[start + 1]
			}]
		};
	}
}

export default ParserAtom;
