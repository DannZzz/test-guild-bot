import { MessageCommandOptions } from "../typings/interfaces";

export class MessageCommand {
    constructor (options: MessageCommandOptions) {
        Object.assign(this, options);
    }
}