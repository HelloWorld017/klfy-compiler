import Keywords from "./Keywords.mjs";
import LexerError from "./LexerError.mjs";

class Lexer {
	constructor(source) {
		this.state = 'start';
		this.stateStack = [];
		this.source = source;
		this.current = -1;
		this.column = -1;
		this.line = 0;
		
		this.temporaryToken = '';
		this.temporaryString = '';
		this.tokens = [];
		
		this.keywords = Object.entries(Keywords).sort(([_, k1], [__, k2]) => k2.length - k1.length);
	}
	
	addToken(token) {
		token.at = {
			column: this.column,
			line: this.line
		};
		this.tokens.push(token);
	}
	
	advance(amount = 1) {
		this.current += amount;
		this.column += amount;
		
		if(this.finished) {
			const overaddedValue = this.current - this.source.length;
			this.current -= overaddedValue;
			this.column -= overaddedValue;
			
			return undefined;
		}
		
		return this.source[this.current];
	}
	
	back() {
		this.current--;
		this.column--;
	}
	
	match(targetStr, delta = 1, advance = true) {
		const matches = this.peek(targetStr.length, delta) === targetStr;
		
		if(matches) {
			if(advance) this.advance(targetStr.length - (delta + 1));
			return true;
		}
		
		return false;
	}
	
	matchRange(ranges, delta = 1, advance = true) {
		if(this.isFinished) return false;
		
		const peek = this.peek(1, delta).charCodeAt(0);
		const matches = ranges.some(charOrRange => {
			if(Array.isArray(charOrRange)) {
				const [rangeStart, rangeEnd] = charOrRange;
				return rangeStart.charCodeAt(0) <= peek && peek <= rangeEnd.charCodeAt(0);
			}
			
			return charOrRange.charCodeAt(0) === peek;
		});
		
		if(matches) {
			if(advance) this.advance(2 - delta);
			return true;
		}
		
		return false;
	}
	
	peek(amount = 1, delta = 1) {
		return this.source.substring(this.current + delta, this.current + delta + amount);
	}
	
	jumpState(newState, shouldBack = false, reset = true) {
		this.state = newState;
		
		if(reset) {
			this.temporaryToken = null;
			this.temporaryString = '';
		}
		
		if(shouldBack)
			this.back();
	}
	
	pushState(...args) {
		this.stateStack.push(this.state);
		this.jumpState(...args);
	}
	
	popState(...args) {
		const previousState = this.stateStack.pop();
		this.jumpState(previousState, ...args);
	}
	
	tokenizeSingle(c, tokenizeMap) {
		for(let key in tokenizeMap) {
			if(c === key) {
				this.addToken({
					type: tokenizeMap[key]
				});
				
				return true;
			}
		}
		
		return false;
	}
	
	scanNative(c) {
		if(this.match('endnative', 0)) {
			this.popState();
			return;
		}
		
		
	}
	
	scanAnnotation(c) {
		if(c === '\n') {
			this.popState(true);
		}
	}
	
	scanName(c) {
		if(this.matchRange([
			['0', '9'],
			['a', 'z'],
			['A', 'Z'],
			'$',
			'_'
		], 0, false)) {
			this.temporaryString += c;
		} else {
			this.addToken({
				type: 'Name',
				content: this.temporaryString
			});
			
			this.popState(true);
		}
	}
	
	scanNumber(c) {
		if(this.matchRange([['0', '9']], 0, false)) {
			this.temporaryString += c;
		} else {
			this.addToken({
				type: 'Number',
				content: parseInt(this.temporaryString)
			});
			
			this.popState(true);
		}
	}
	
	scanString(c) {
		switch(c) {
			case '\\':
				const nextChar = this.matchRange([
					'\\', 'n', 'r', 't', '"', "'"
				]);
				
				if(nextChar) {
					if(this.temporaryString.length > 0)
						this.temporaryToken.children.push({
							type: 'Text',
							content: this.temporaryString
						});
					
					this.temporaryString = '';
					
					this.push({
						type: 'Escape',
						content: this.peek(1, 0)
					});
				} else {
					throw new LexerError('Unexpected escape token', this);
				}
				
				break;
			
			case '"':
				if(this.state !== 'string') {
					this.temporaryString += '"';
					break;
				}
				
				if(this.temporaryString.length > 0)
					this.temporaryToken.children.push({
						type: 'Text',
						content: this.temporaryString
					});
				
				this.addToken(this.temporaryToken);
				this.popState();
				break;
			
			case "'":
				if(this.state !== 'charstring') {
					this.temporaryString += "'";
					break;
				}
				
				if(this.temporaryString.length > 0)
					this.temporaryToken.children.push({
						type: 'Text',
						content: this.temporaryString
					});
				
				if(this.temporaryToken.children.length !== 1 || this.temporaryString.length > 1)
					throw new LexerError('Char should contain exactly one character', this);
				
				this.addToken(this.temporaryToken);
				this.popState();
				break;
				
			case '\n':
				throw new LexerError('Unclosed string', this);
			
			default:
				this.temporaryString += c;
		}
	}
	
	scanStart(c) {
		const isKeyword = this.keywords.some(([type, keyword]) => {
			if(this.match(keyword, 0)) {
				this.addToken({
					type
				});
				return true;
			}
			
			return false;
		});
		
		if(isKeyword) {
			return;
		}
		
		if(this.match('native', 0)) {
			this.pushState('native');
		}
		
		if(this.matchRange([['a', 'z'], ['A', 'Z']], 0, false)) {
			this.pushState('name', true);
			return;
		}
		
		if(this.matchRange([['0', '9']], 0, false)) {
			this.pushState('number', true);
			return;
		}
		
		if(this.matchRange(['\r', '\t', ' '], 0, false)) {
			return;
		}
		
		if(this.tokenizeSingle(c, {
			'(': 'ParenLeft',
			')': 'ParenRight',
			'{': 'BraceLeft',
			'}': 'BraceRight',
			'<': 'AngleBracketLeft',
			'>': 'AngleBracketRight',
			',': 'Comma',
			'*': 'OperatorMultiply',
			'+': 'OperatorAdd',
			'-': 'OperatorSubtract',
			'=': 'Assignment',
			';': 'NewLine'
		})) return;
		
		switch(c) {
			case '"':
				this.pushState('string');
				this.temporaryToken = {
					type: 'String',
					children: []
				};
				break;
			
			case "'":
				this.pushState('charstring');
				this.temporaryToken = {
					type: 'Char',
					children: []
				};
				break;
			
			case '/':
				if(this.match('/')) {
					this.pushState('annotation');
					break;
				}
				
				this.addToken({
					type: 'OperatorDivide'
				});
				break;
			
			case '\n':
				this.line++;
				this.column = 0;
				break;
			
			default:
				throw new LexerError("Unexpected char : " + JSON.stringify(c), this);
		}
	}
	
	scan(c) {
		switch(this.state) {
			case 'annotation':
				this.scanAnnotation(c);
				break;
			
			case 'name':
				this.scanName(c);
				break;
			
			case 'string':
			case 'charstring':
				this.scanString(c);
				break;
			
			case 'number':
				this.scanNumber(c);
				break;
			
			case 'native':
				this.scanNative(c);
				break;
			
			case 'start':
				this.scanStart(c);
				break;
		}
	}
	
	lex() {
		let c = this.advance();
		
		while(!this.finished) {
			this.scan(c);
			c = this.advance();
		}
		
		return this.tokens;
	}
	
	get finished() {
		return this.current >= this.source.length;
	}
}

export default Lexer;
