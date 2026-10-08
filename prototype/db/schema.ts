import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const lots=sqliteTable('lots',{
 owner:text('owner').notNull(),id:text('id').notNull(),body:text('body').notNull(),version:integer('version').notNull().default(1),updatedAt:text('updated_at').notNull()
},t=>[primaryKey({columns:[t.owner,t.id]}),index('lots_owner_updated').on(t.owner,t.updatedAt)]);
export const profiles=sqliteTable('profiles',{owner:text('owner').primaryKey(),body:text('body').notNull()});
export const media=sqliteTable('media',{id:text('id').primaryKey(),owner:text('owner').notNull(),mime:text('mime').notNull(),key:text('object_key').notNull(),createdAt:text('created_at').notNull()},t=>[index('media_owner').on(t.owner)]);
