import Command, { ContextCommand, IContextMessageCommand } from '../../../structures/Command';
let coderegex = /^```(?:js)?\s(.+[^\\])```$/is;
const { exec } = require('child_process');
const { default: CommandInteractionOptions } = require('../../../utils/CommandInteractionOptions');
import DirectoraClient from '../../../structures/DirectoraClient';
import { inspect } from 'util';

let commands;

try {
    commands = require('../../../../data/commands.json');
} catch (_) {
    commands = {};
}

class EvalCommand extends Command {
    constructor(client: DirectoraClient) {
        super(client, {
            name: 'eval',
            aliases: ['ev', 'e', 'evl'],
            requirements: {
                ownerOnly: true,
            },
            dirname: __dirname,
        });
    };

    async run(context: IContextMessageCommand) {
		if (!context.args[0]) {
            return this.replyMessage(context, {
                content: 'Você precisa informar o código a ser executado!',
            });
        };

        const Eris = require('eris');

        let evalAsync = false;
		let evalBash = false;

        if (context.args[0].toLowerCase() == '--async') {
			evalAsync = true;
			context.args.shift();
		};

		if (context.args[0].toLowerCase() == '--terminal') {
			evalBash = true;
			context.args.shift();
		};

        let conteudo = context.args.join(' ');
		if (coderegex.test(conteudo)) conteudo = conteudo.replace(coderegex, '$1');

		const start = Date.now();
        const regext = new RegExp(
            // @ts-ignore
            this.client._token, 'g'
        );

        let result;
		try {
			if (evalBash == true) result = consoleRun(conteudo);
			else if (evalAsync == true) result = await eval(`(async() => { ${conteudo} })()`);
			else result = await eval(conteudo);

			if (result instanceof Promise) {
				result = await result;
			};

			if (typeof result !== 'string') result = await inspect(result, { depth: 0 });
			let end = Date.now() - start;

		} catch (e) {
            result = `${e}`;
		};

        await this.replyMessage(context, {
            content: `\`\`\`js\n${result.replace(regext, '🙃').replace(/```/g, '\\`\\`\\`').slice(0, 1990)}\`\`\``,
        });
    }
}

function consoleRun(command: string) {
	return new Promise((resolve, reject) => {
        // @ts-ignore
		exec(command, (err, stout, sterr) => (err || sterr ? reject(err || sterr) : resolve(stout)));
	});
}

export default EvalCommand;