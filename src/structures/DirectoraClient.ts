import { Client, ClientOptions } from 'eris';
import fs from 'fs';
import Command, { CommandGroup, SubCommand } from './Command';
import Logger from '../utils/Looger';
import Event from './Event';

export interface IClientCommands {
    slash: Array<Command>,
    vanilla: Array<Command>,
    user: Array<Command>,
}

class DirectoraClient extends Client {
    public commands: IClientCommands;
    public logger: Logger;
    public events: Array<Event>;

    public config = {
        prefix: ['directora.', 'direc.'],
        owners: ['452618703792766987', '343778106340802580'],
    }

    constructor(token: string, options?: ClientOptions) {
        super(token, options);

        this.commands = {
            slash: [],
            vanilla: [],
            user: [],
        };
        this.events = [];

        this.logger = new Logger();
    }

    private async _loadCommands(): Promise<IClientCommands> {
        const fileRegex = /^(.*)(Command|SubCommand|CommandGroup)(\.(j|t)s)?$/;
        
        let types = fs.readdirSync(__dirname + '/../commands') as Array<'slash' | 'vanilla' | 'user'>;

        for (let type of types) {
            let categeries = fs.readdirSync(`${__dirname}/../commands/${type}`);

            for (let category of categeries) {
                let commands = fs.readdirSync(`${__dirname}/../commands/${type}/${category}`).filter(file => fileRegex.test(file));

                for (let command of commands) {
                    if(fs.lstatSync(`${__dirname}/../commands/${type}/${category}/${command}`).isDirectory()) {
                        const client = this;
                        const _Command = require(`${__dirname}/Command`);
                        let _command: Command = this.commands[type].find(cmd => cmd.name === splitCommandName(command)) || eval(`new (class ${command.replace(fileRegex, '$1$2')} extends _Command.default { constructor() { 
                                super(client, { 
                                    name: '${splitCommandName(command)}', 
                                }) 
                            } 
                        })`)

                        if(!this.commands[type].find(cmd => cmd.name === splitCommandName(command))) {
                            this.commands[type].push(_command);
                        }

                        if(!_command.subcommands?.length) { _command.subcommands = []; }

                        let subcommands = fs.readdirSync(`${__dirname}/../commands/${type}/${category}/${command}`).filter(file => fileRegex.test(file));;

                        for (let subcommand of subcommands) {
                            if(fs.lstatSync(`${__dirname}/../commands/${type}/${category}/${command}/${subcommand}`).isDirectory()) {
                                let _subcommand: CommandGroup = _command.subcommands.find(cmd => cmd.name === splitCommandName(subcommand)) as CommandGroup || eval(`new (class ${subcommand.replace(fileRegex, '$1$2')} extends _Command.CommandGroup { constructor() { 
                                    super(client, { 
                                        name: '${splitCommandName(subcommand)}', 
                                    }, _command) 
                                } 
                            })`)

                                let subsubcommands = fs.readdirSync(`${__dirname}/../commands/${type}/${category}/${command}/${subcommand}`).filter(file => fileRegex.test(file));;

                                for (let subsubcommand of subsubcommands) {
                                    let { default: base } = require(__dirname + `/../commands/${type}/${category}/${command}/${subcommand}/${subsubcommand}`);

                                    this.logger.log(`Loading ${type} command ${subsubcommand.replace(fileRegex, '$1$2')} for command group ${subcommand.replace(fileRegex, '$1$2')} on command ${command.replace(fileRegex, '$1$2')}`, { tags: ['Client', 'Commands Loader'], date: true, info: true });

                                    const instance  = new base(this, _subcommand) as SubCommand;

                                    _subcommand.subcommands.push(instance);
                                }

                                _command.subcommands.push(_subcommand);
                            } else {
                                let { default: base } = require(__dirname + `/../commands/${type}/${category}/${command}/${subcommand}`);
                                this.logger.log(`Loading ${type} command ${subcommand.replace(fileRegex, '$1$2')} on command ${command.replace(fileRegex, '$1$2')}`, { tags: ['Client', 'Commands Loader'], date: true, info: true });
                                const instance  = new base(this, _command) as SubCommand;

                                _command.subcommands.push(instance);
                            }
                        }
                    } else {
                        let { default: base } = require(`${__dirname}/../commands/${type}/${category}/${command}`);

                        this.logger.log(`Loading ${type} command ${command.replace(fileRegex, '$1$2')}`, { tags: ['Client', 'Commands Loader'], date: true, info: true });
                        
                        const instance  = new base(this) as Command;

                        this.commands[type].push(instance);
                    }
                }
            }
        }

        return this.commands;

        function splitCommandName(name: string) {
            let split = name.replace(fileRegex, '$1').match(/[A-Z][a-z]*/g) as string[];

            return split[split.length - 1].toLowerCase();
        }
    }

    private async _loadEvents(): Promise<Event[]> {
        const regex = /^(.*)Event\.(t|j)s$/;
        let events = fs.readdirSync(__dirname + '/../events').filter(file => regex.test(file));
        for (let event of events) {
            this.logger.log(`Loading event ${event.replace(regex, '$1Event')}`, { tags: ['Client', 'Event Loader'], date: true });

            let { default: base } = require(__dirname + `/../events/${event}`);
            
            const instance = new base(this) as Event;

            this.events.push(instance);

            this.on(instance.event, (...args) => instance.run? instance.run(...args) : Logger.log(`Event ${instance.event} has no run function.`, { tags: ['Client', 'Event Loader'], date: true, error: true }));
        };

        this.logger.log(`Loaded ${this.events.length} events of ${events.length}`, { tags: ['Client', 'Events Loader'], date: true });

        return this.events;
    }

    public async init() {
        await this._loadCommands();
        await this._loadEvents();
        await this.connect();
    }
}

export default DirectoraClient;