class Lexer {
	constructor(source) {
		this.state = 'start';
		this.source = source;
		this.current = 0;
		this.line = 0;
		
		this.temporaryToken = '';
		this.temporaryString = '';
		this.tokens = [];
	}
	
	advance(amount = 1) {
		for(let i = 0; i < amount; i++) {
			this.current++;
			if(this.finished) return undefined;
		}
		
		return this.source[this.current];
	}
	
	match(targetStr, delta = 1) {
		const matches = this.peek(targetStr.length, delta) === targetStr;
		
		if(matches) {
			return this.advance(targetStr.length + (delta - 1));
		}
		
		return false;
	}
	
	peek(amount = 1, delta = 1) {
		return this.source.substr(this.current + delta, amount);
	}
	
	scanName(c) {
		
	}
	
	scanString(c) {
		switch(c) {
			case '\\':
				const nextChar = this.match('\\') || this.match('"') ||
					this.match('n') || this.match('r') || this.match('t');
				
				if(nextChar) {
					this.temporaryToken.children.push({
						type: 'Text',
						content: this.temporaryString
					});
					
					this.temporaryString = '';
					
					this.push({
						type: 'Escape',
						content: nextChar
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
				
				this.temporaryToken.children.push({
					type: 'Text',
					content: this.temporaryString
				});
				
				this.tokens.push(this.temporaryToken);
				
				this.state = 'start';
				break;
			
			case "'":
				if(this.state !== 'charstring') {
					this.temporaryString += "'";
					break;
				}
				
			case '\n':
				throw new LexerError('Unclosed string', this);
			
			default:
				this.temporaryString += c;
		}
	}
	
	scanStart(c) {
		Object.entries(keywords).some([type, keyword] => {
			if(this.matches(keyword, 0)) {
				this.tokens.push({
					type
				});
			}
		});
		
		switch(c) {
			case '(':
				this.tokens.push({
					type: 'ParenLeft'
				});
				break;
				
			case ')':
				this.tokens.push({
					type: 'ParenRight'
				});
				break;
				
			case '{':
				this.tokens.push({
					type: 'BraceLeft'
				});
				break;
				
			case '}':
				this.tokens.push({
					type: 'BraceRight'
				});
				break;
				
			case ',':
				this.tokens.push({
					type: 'Comma'
				});
				break;
				
			case '"':
				this.state = 'string';
				this.temporaryToken = {
					type: 'String',
					children: []
				};
				this.temporaryString = '';
				break;
			
			case "'":
				this.state = 'charstring';
				this.temporaryToken = {
					type: 'Char',
					children: []
				};
				this.temporaryString = '';
				break;
		}
	}
	
	scan() {
		const c = this.advance();
		
		if (this.state ===  'name') {
			
		} else if (this.state === 'string' || this.state === 'charstring') {
			this.scanString();
		} else if (this.state === 'start') {
			
		}
	}
	
	lex() {
		
	}
	
	get finished() {
		return this.current >= this.source.length;
	}
}

export default Lexer;
