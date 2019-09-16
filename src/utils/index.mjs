import chalk from 'chalk';
import stringWidth from 'string-width';

export function displaySyntaxError(error) {
	const errorPre = `${error.row} |    ` +
		error.text.slice(0, error.column).replace(/^\s+/, '');

	const errorColored = chalk.red(error.text.slice(error.column, error.column + 1));

	const errorText =
		errorPre +
		errorColored +
		error.text.slice(error.column + 1)

	return chalk.red(error.message + ` at ${error.row}:${error.column + 1}`) + '\n' +
		errorText + '\n' +
		' '.repeat(stringWidth(errorPre) - 1) + chalk.red('^^^');
};

export function getInvalidTokenError(token) {
	const error = new Error(`Unexpected token: ${token.string}`);
	error.type = 'InvalidToken';
	error.token = token;

	return error;
};

export function toSigmaJson(tree) {
	let index = 0;
	const nodes = [];
	const edges = [];

	const traverse = (node, level=0, prev=undefined) => {
		let connectionList = node.connectionList;
		let label = `${node.name},${node.value || ''}`;

		if(node.type === 'Token') {
			connectionList = [];
			label = `${node.name},${node.string}`;
		}

		const thisId = Math.random().toString(36).slice(2);

		if(prev) {
			edges.push({
				id: Math.random().toString(36).slice(2),
				source: prev,
				target: thisId
			});
		}

		nodes.push({
			x: index * 2,
			y: level * 4,
			id: thisId,
			label,
			size: 2
		});

		for(let nextNode of connectionList) {
			traverse(nextNode, level + 1, thisId);
		}

		index++
	};

	for(let statement of tree.connectionList) {
		traverse(statement);
	}

	return {nodes, edges};
};
