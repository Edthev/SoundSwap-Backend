/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
   return knex.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("spotify_id").notNullable();
      table.string("spotify_access_token").notNullable();
      table.string("spotify_refresh_token").notNullable();
      table.string("spotify_token_expiry").notNullable();
      table.string("spotify_session").notNullable();
      table.string("google_access_token").notNullable();
      table.string("google_refresh_token").notNullable();
      table.string("google_token_expiry").notNullable();
      table.string("google_session").notNullable();
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
