import { Connection, createConnection, escape, escapeId, OkPacket } from 'mysql';
import Util from './Util';
import ClientConfig from './ClientConfig';
import { Snowflake } from 'discord.js';

export interface SQLQueryOptions {
  where?: Record<string, unknown>;
  limit?: number;
}

export enum ConfigSettings {
  AmongUsCategoryId = 'among_us_category_id',
  QueueChannelId = 'queue_channel_id'
}

export default class Database extends null {
  private static _database: Connection;
  private static _keepAlive: NodeJS.Timeout | null = null;

  public static get connected() {
    return this._database.state === 'connected';
  }

  public static connect() {
    return new Promise<void>((resolve, reject) => {
      const db = this._database = createConnection(ClientConfig.database);
      db.connect(error => {
        if (error) reject(error);
        else {
          this._keepAlive = setInterval(() => {
            if (!this.connected) {
              clearInterval(this._keepAlive!);
              this._keepAlive = null;
            } else {
              this._select1().catch(error => {
                Util.client?.emit('error', error);
              });
            }
          }, 15_000).unref();
          resolve();
        }
      });
    });
  }

  public static select<T>(table: string, values: '*' | string[], { where, limit }: SQLQueryOptions = {}) {
    return new Promise<T[]>((resolve, reject) => {
      let query = `SELECT ${values === '*' ? '*' : values.join(',')} FROM ${table}`;
      if (where) {
        query += ` WHERE ${this._mapValues(where, ' AND ')}`;
      }

      if (typeof limit === 'number') {
        query += ` LIMIT ${limit}`;
      }
      this._database.query(`${query};`, (error, rows) => {
        if (error) reject(error);
        else resolve(rows);
      });
    });
  }

  public static update(table: string, values: Record<string, unknown>, { where }: Omit<SQLQueryOptions, 'limit'> = {}) {
    return new Promise<OkPacket>((resolve, reject) => {
      let query = `UPDATE ${table} SET ${this._mapValues(values)}`;
      if (where) {
        query += ` WHERE ${this._mapValues(where, ' AND ')}`;
      }
      this._database.query(`${query};`, (error, okPacket) => {
        if (error) reject(error);
        else resolve(okPacket);
      });
    });
  }

  public static insert(table: string, values: Record<string, unknown>) {
    return new Promise<OkPacket>((resolve, reject) => {
      const rows = Object.keys(values);
      this._database.query(
        `INSERT INTO ${table} (${rows.join(',')}) VALUES (${rows.map(row => escape(values[row])).join(',')});`,
        (error, okPacket) => {
          if (error) reject(error);
          else resolve(okPacket);
        }
      );
    });
  }

  public static delete(table: string, { where }: Omit<SQLQueryOptions, 'limit'> = {}) {
    return new Promise<OkPacket>((resolve, reject) => {
      let query = `DELETE FROM ${table}`;
      if (where) {
        query += ` WHERE ${this._mapValues(where, ' AND ')}`;
      }
      this._database.query(`${query};`, (error, okPacket) => {
        if (error) reject(error);
        else resolve(okPacket);
      });
    });
  }

  public static async fetchSetting(id: ConfigSettings, guildId: string): Promise<string | undefined> {
    const [setting] = await this.select<DatabaseSetting>('settings', ['value'], {
      where: { guild_id: guildId, setting_id: id },
      limit: 1
    });
    return setting?.value;
  }

  public static async changeSetting(id: ConfigSettings, guildId: string, newValue: string) {
    const [existing] = await this.select('settings', ['guild_id'], {
      where: { guild_id: guildId, setting_id: id }
    });
    if (!existing) {
      await this.insert('settings', {
        guild_id: guildId,
        setting_id: id,
        value: newValue
      });
    } else {
      await this.update('settings', {
        value: newValue
      }, { where: {
        guild_id: guildId,
        setting_id: id
      } });
    }
  }

  private static _mapValues(values: Record<string, unknown>, delimiter = ',') {
    return Object.entries(values).map(([key, value]) => {
      let operator: '=' | 'like' = '=';
      let escaped: string;
      if (key.startsWith('like_')) {
        operator = 'like';
        key = key.slice(5);
        escaped = `'%${escape(value).slice(1, -1)}%'`;
      } else {
        escaped = escape(value);
      }
      return `${escapeId(key)} ${operator} ${escaped}`;
    }).join(delimiter);
  }

  private static _select1() {
    return new Promise<void>((resolve, reject) => {
      this._database.query('SELECT 1', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

export interface DatabaseSetting {
  guild_id: Snowflake;
  setting_id: ConfigSettings;
  value: string;
}