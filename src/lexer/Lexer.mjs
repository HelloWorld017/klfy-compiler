import Keywords from "./Keywords.mjs";
import LexerError from "./LexerError.mjs";

class Lexer {
	constructor(source) {
		this.state = 'start';
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
		if(!this.tokens[this.line]) this.tokens[this.line] = [];
		this.tokens[this.line].push(token);
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
	
	scanAnnotation(c) {
		if(c === '\n') {
			this.jumpState('start', true);
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
			
			this.jumpState('start', true);
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
			
			this.jumpState('start', true);
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
				this.jumpState('start');
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
				
				if(this.temporaryToken.children.length > 1 || this.temporaryString.length > 1)
					throw new LexerError('Too Large Char', this);
				
				this.addToken(this.temporaryToken);
				this.jumpState('start');
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
		
		if(this.matchRange([['a', 'z'], ['A', 'Z']], 0, false)) {
			this.jumpState('name', true);
			return;
		}
		
		if(this.matchRange([['0', '9']], 0, false)) {
			this.jumpState('number', true);
			return;
		}
		
		if(this.matchRange(['\r', '\t', ' '], 0, false)) {
			return;
		}
		
		switch(c) {
			case '(':
				this.addToken({
					type: 'ParenLeft'
				});
				break;
				
			case ')':
				this.addToken({
					type: 'ParenRight'
				});
				break;
				
			case '{':
				this.addToken({
					type: 'BraceLeft'
				});
				break;
				
			case '}':
				this.addToken({
					type: 'BraceRight'
				});
				break;
				
			case ',':
				this.addToken({
					type: 'Comma'
				});
				break;
				
			case '"':
				this.jumpState('string');
				this.temporaryToken = {
					type: 'String',
					children: []
				};
				break;
			
			case "'":
				this.jumpState('charstring');
				this.temporaryToken = {
					type: 'Char',
					children: []
				};
				break;
			
			case '/':
				if(this.match('/')) {
					this.jumpState('annotation');
					break;
				}
				
				this.addToken({
					type: 'OperatorDivide'
				});
				break;
			
			case '*':
				this.addToken({
					type: 'OperatorMultiply'
				});
				break;
			
			case '+':
				this.addToken({
					type: 'OperatorPlus'
				});
				break;
			
			case '-':
				this.addToken({
					type: 'OperatorSubtract'
				});
				break;
			
			case '=':
				this.addToken({
					type: 'Assignment'
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
