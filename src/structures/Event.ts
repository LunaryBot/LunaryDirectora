import DirectoraClient from './DirectoraClient';

class Event {
    public declare client: DirectoraClient;
    public event: string;
    public run?(...args: any[]): void;

    constructor(
        event: string,
        client: DirectoraClient,
    ) {
        Object.defineProperty(this, 'client', { value: client, enumerable: false });
        
        this.event = event;
    };
};

export default Event;