class UnexpectedTokenError extends Error {
	constructor(token, expected = null) {
		super(`Unexpected token: ${token.type}${expected ? `, expected ${expected}` : ''}`);
		
		this.type = 'ParserError';
		this.row = token.at.line + 1;
		this.column = token.at.column;
	}
}

export default UnexpectedTokenError;
