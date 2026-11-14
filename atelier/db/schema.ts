import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const riotConnections=sqliteTable('riot_connections',{userId:text('user_id').primaryKey(),encryptedKey:text('encrypted_key').notNull(),updatedAt:integer('updated_at').notNull(),lastRequest:integer('last_request').notNull().default(0)});
