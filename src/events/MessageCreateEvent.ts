import Eris from 'eris';
import Event from '../structures/Event';
import { ContextCommand, IContextMessageCommand } from '../structures/Command';
import DirectoraClient from '../structures/DirectoraClient';

class MessageCreateEvent extends Event {
    constructor(client: DirectoraClient) {
        super('messageCreate', client);
    }

    async run(message: Eris.Message) {
        if(message.author.bot || message.webhookID) return;
        
        const regexp = new RegExp(`^(${this.client.config.prefix.map(prefix => prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')}|<@!?${this.client.user.id}>)( )*`, 'gi');
        if(!message.content.match(regexp)) return;

        const args = message.content.replace(regexp, '').trim().split(/ +/g);
        if(!args.length) return;

        const commandName = args.shift()?.toLowerCase();
		const command = commandName ? this.client.commands.vanilla.find(c => c.name == commandName || (Array.isArray(c.aliases) && c.aliases?.includes(commandName))) : undefined;
		if (!command) return;


        const context = new ContextCommand({
            client: this.client,
            command,
            args,
            message,
            user: message.author,
            channel: message.channel,
        }) as IContextMessageCommand;

        if(command.requirements?.guildOnly && !message.guildID) return;

        if(command.requirements?.guildOnly && !this.client.config.owners.includes(message.author.id)) return;

        command.run(context as IContextMessageCommand);
    }
}

export default MessageCreateEvent;