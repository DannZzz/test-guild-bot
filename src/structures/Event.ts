import { EventOptions, EventRunOptions } from "../typings/interfaces";

export class Event {
    constructor(options: EventOptions) {
        Object.assign(this, options);
    }
}