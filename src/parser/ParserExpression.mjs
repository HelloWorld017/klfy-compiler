import RootParser from "./RootParser.mjs";
import UnexpectedTokenError from "./errors/UnexpectedTokenError.mjs";

class ParserExpression extends RootParser {
	constructor() {
		super('Expression');
	}
	
	isStartOf(tokens, index, {getParser}) {
		const type = tokens[index].type
		return type === 'OperatorSubtract' ||
			type === 'ParenLeft' ||
			getParser('Atom').handlingTokens.includes(type);
	}
	
	parse(tokens, start, {parse, getOperatorPriority, getParser}, options) {
		const atomTokens = getParser('Atom').handlingTokens;
		const operators = [];
		let postfix = [];
		let isExpressionPart = true;
		let end = -1;
		
		if(tokens[start].type === 'OperatorSubtract') {
			postfix.push({
				name: 'AtomLiteral',
				type: 'uint',
				content: 0
			});
		}
		
		let i = start;
		while(isExpressionPart) {
			let token = tokens[i];
			if(!token) {
				end = i;
				break;
			}
			
			if(atomTokens.includes(token.type)) {
				const {consume, nodes} = parse('Atom', tokens.slice(i));
				i += consume;
				
				postfix.push(...nodes);
			} else if(getOperatorPriority(token.type) !== null) {
				i++;
				const operatorNode = {
					name: 'Operator',
					operatorType: token.type,
					priority: getOperatorPriority(token.type),
					token
				};
				
				if(operators.length === 0) {
					operators.push(operatorNode);
					continue;
				}
				
				let topPriority = operators[operators.length - 1].priority;
				if(topPriority === null)
					throw new UnexpectedTokenError(operators[operators.length - 1]);
				
				while(topPriority >= operatorNode.priority) {
					postfix.push(operators.pop());
					
					if(operators.length > 0) {
						topPriority = operators[operators.length - 1].priority;
						if(topPriority === null)
							throw new UnexpectedTokenError(operators[operators.length - 1]);
					} else break;
				}
				
				operators.push(operatorNode);
			} else if(token.type === 'ParenLeft') {
				operators.push(token);
				i++;
			} else if(token.type === 'ParenRight') {
				while(true) {
					if(operators.length === 0)
						throw new UnexpectedTokenError(tokens[i]);
					
					const lastOperator = operators.pop();
					if(lastOperator.type === 'ParenLeft') break;
					
					postfix.push(lastOperator);
				}
				i++;
			} else {
				isExpressionPart = false;
				end = i;
			}
		}
		
		postfix = postfix.concat(operators.reverse()).filter(token => token.type !== 'ParenLeft');
		
		const treeStack = [];
		for(let i = 0; i < postfix.length; i++) {
			const node = postfix[i];
			if(node.name === 'Atom') {
				treeStack.push(node);
				continue;
			}
			
			if(node.name !== 'Operator') throw new UnexpectedTokenError(node.token);
			if(treeStack.length < 2) throw new UnexpectedTokenError(node.token);

			const childA = treeStack.pop();
			const childB = treeStack.pop();

			node.children = [
				childB, childA
			];

			treeStack.push(node);
		}

		if(treeStack.length > 1) {
			throw new UnexpectedTokenError(treeStack[1].token || treeStack[1]);
		}

		return {
			nodes: [{
				name: 'Expression',
				children: [treeStack[0]]
			}],
			consume: end - start 
		};
	}
}

export default ParserExpression;
