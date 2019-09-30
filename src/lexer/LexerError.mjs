class LexerError extends Error{
	constructor(message, lexer) {
		super(message);
		
		this.type = 'LexerError';
		
		this.message = message;
		this.row = lexer.line + 1;
		this.column = lexer.column;
	}
}

export default LexerError;
