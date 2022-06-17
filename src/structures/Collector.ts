import { Message, MessageCollector, MessageCollectorOptions, TextBasedChannel, UserResolvable } from "discord.js";

type options = Pick<MessageCollectorOptions, "dispose" | "idle" | "max" | "maxProcessed" | "time">;

interface MessageCollectorOptionsExp extends options {
    filter: UserResolvable[];
}

export class MessageCollectorExp {
    public readonly collector: MessageCollector;
    constructor(channel: TextBasedChannel, options: MessageCollectorOptionsExp){
        const args: MessageCollectorOptions = {...options, filter: m => options.filter.includes(m.author.id) || options.filter.includes(m.author)};
        this.collector = new MessageCollector(channel, args);
    }

    on(content: string | string[], toDo: (m: Message)=>any){
        this.collector.on("collect", async (m) => {
            const c = m.content;
            if (c) {
                if (!content || c === content || content.includes(c)) await toDo(m)
            }
        })
    }
    
    end(toDo: ()=>any) {
        this.collector.on("end", toDo)
    }

    resetTimer () {
        this.collector.resetTimer();
    }

    stop () {
        this.collector.stop();
    }
    
}