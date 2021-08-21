import { Snowflake, Guild, User, Message } from 'discord.js';

const queue = new Map<Snowflake, QueueManager>();

export default queue;

export class QueueManager {
  public message: Message | null = null;
  public shouldDisablePing = false;
  public pingTimeout: NodeJS.Timeout | null = null;
  public readonly queue: User[] = [];

  private constructor(public readonly guild: Guild) {
    queue.set(guild.id, this);
  }

  public static get(guild: Guild) {
    return queue.get(guild.id) ?? new QueueManager(guild);
  }

  public get(user: User | number) {
    if (typeof user === 'number') {
      return this.queue[user] ?? null;
    } else {
      return this.queue.find(({ id }) => user.id === id) ?? null;
    }
  }

  public positionOf(user: User) {
    return this.queue.findIndex(({ id }) => user.id === id);
  }

  public has(user: User) {
    return this.positionOf(user) !== -1;
  }

  public add(user: User, at = this.queue.length) {
    if (!this.has(user))
      this.queue.splice(at, 0, user);
  }

  public remove(user: User | number) {
    if (typeof user !== 'number' && (user = this.positionOf(user)) === -1)
      return;
    
    this.queue.splice(user, 1);
  }

  public clear() {
    this.queue.splice(0, this.queue.length);
  }
}