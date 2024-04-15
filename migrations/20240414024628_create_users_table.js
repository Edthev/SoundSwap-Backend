/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
   return knex.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("spotify_id").notNullable();
      table.string("access_token").notNullable();
      table.string("refresh_token").notNullable();
      table.string("token_expiry").notNullable();
      table.string("session").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
   });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
   return knex.schema.dropTable("users");
};
