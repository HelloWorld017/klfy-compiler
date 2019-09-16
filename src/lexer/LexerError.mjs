class LexerError extends Error{
	constructor(message, lexer) {
		super(message);
		
		this.type = 'LexerError';
		
		this.message = message;
		this.row = lexer.line + 1;
		this.column = lexer.column;
		this.text = lexer.source.split('\n')[lexer.line];
	}
}

export default LexerError;
