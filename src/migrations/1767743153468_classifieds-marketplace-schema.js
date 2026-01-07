/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Aircraft Listings Table
  pgm.createTable('aircraft_listings', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    title: { type: 'varchar(200)', notNull: true },
    manufacturer: { type: 'varchar(100)', notNull: true },
    model: { type: 'varchar(100)', notNull: true },
    year: { type: 'integer', notNull: true },
    registration: { type: 'varchar(20)' },
    serial_number: { type: 'varchar(50)' },
    category: { type: 'varchar(50)', notNull: true },
    total_time: { type: 'integer' },
    engine_time: { type: 'integer' },
    price: { type: 'decimal(12,2)', notNull: true },
    location_city: { type: 'varchar(100)', notNull: true },
    location_state: { type: 'varchar(2)', notNull: true },
    location_country: { type: 'varchar(2)', notNull: true, default: "'BR'" },
    description: { type: 'text' },
    avionics: { type: 'text' },
    interior_condition: { type: 'varchar(20)' },
    exterior_condition: { type: 'varchar(20)' },
    logs_status: { type: 'varchar(50)' },
    damage_history: { type: 'boolean', default: false },
    financing_available: { type: 'boolean', default: false },
    partnership_available: { type: 'boolean', default: false },
    status: { type: 'varchar(20)', notNull: true, default: "'draft'" },
    featured: { type: 'boolean', default: false },
    featured_until: { type: 'timestamp' },
    views: { type: 'integer', default: 0 },
    inquiries_count: { type: 'integer', default: 0 },
    expires_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Parts Listings Table
  pgm.createTable('parts_listings', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    title: { type: 'varchar(200)', notNull: true },
    part_number: { type: 'varchar(100)' },
    manufacturer: { type: 'varchar(100)' },
    category: { type: 'varchar(50)', notNull: true },
    condition: { type: 'varchar(30)', notNull: true },
    time_since_overhaul: { type: 'integer' },
    price: { type: 'decimal(10,2)', notNull: true },
    location_city: { type: 'varchar(100)', notNull: true },
    location_state: { type: 'varchar(2)', notNull: true },
    description: { type: 'text' },
    compatible_aircraft: { type: 'text' },
    has_certification: { type: 'boolean', default: false },
    has_logbook: { type: 'boolean', default: false },
    shipping_available: { type: 'boolean', default: true },
    return_policy: { type: 'varchar(100)' },
    status: { type: 'varchar(20)', notNull: true, default: "'active'" },
    featured: { type: 'boolean', default: false },
    views: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Avionics Listings Table
  pgm.createTable('avionics_listings', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    title: { type: 'varchar(200)', notNull: true },
    manufacturer: { type: 'varchar(100)', notNull: true },
    model: { type: 'varchar(100)', notNull: true },
    category: { type: 'varchar(50)', notNull: true },
    condition: { type: 'varchar(30)', notNull: true },
    software_version: { type: 'varchar(50)' },
    tso_certified: { type: 'boolean', default: false },
    panel_mount: { type: 'boolean', default: true },
    price: { type: 'decimal(10,2)', notNull: true },
    location_city: { type: 'varchar(100)', notNull: true },
    location_state: { type: 'varchar(2)', notNull: true },
    description: { type: 'text' },
    compatible_aircraft: { type: 'text' },
    includes_installation: { type: 'boolean', default: false },
    warranty_remaining: { type: 'varchar(50)' },
    status: { type: 'varchar(20)', notNull: true, default: "'active'" },
    featured: { type: 'boolean', default: false },
    views: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Shop Products Table
  pgm.createTable('shop_products', {
    id: { type: 'serial', primaryKey: true },
    seller_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    title: { type: 'varchar(200)', notNull: true },
    sku: { type: 'varchar(50)', unique: true },
    brand: { type: 'varchar(100)' },
    category: { type: 'varchar(50)', notNull: true },
    price: { type: 'decimal(10,2)', notNull: true },
    compare_at_price: { type: 'decimal(10,2)' },
    description: { type: 'text' },
    short_description: { type: 'varchar(500)' },
    stock_quantity: { type: 'integer', default: 0 },
    low_stock_threshold: { type: 'integer', default: 5 },
    weight_grams: { type: 'integer' },
    shipping_required: { type: 'boolean', default: true },
    featured: { type: 'boolean', default: false },
    active: { type: 'boolean', default: true },
    views: { type: 'integer', default: 0 },
    sales_count: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Listing Photos Table
  pgm.createTable('listing_photos', {
    id: { type: 'serial', primaryKey: true },
    listing_type: { type: 'varchar(20)', notNull: true },
    listing_id: { type: 'integer', notNull: true },
    url: { type: 'varchar(500)', notNull: true },
    thumbnail_url: { type: 'varchar(500)' },
    display_order: { type: 'integer', default: 0 },
    is_primary: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Listing Inquiries Table
  pgm.createTable('listing_inquiries', {
    id: { type: 'serial', primaryKey: true },
    listing_type: { type: 'varchar(20)', notNull: true },
    listing_id: { type: 'integer', notNull: true },
    sender_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    seller_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(100)', notNull: true },
    phone: { type: 'varchar(20)' },
    message: { type: 'text', notNull: true },
    status: { type: 'varchar(20)', default: "'new'" },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Listing Payments Table
  pgm.createTable('listing_payments', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    listing_type: { type: 'varchar(20)', notNull: true },
    listing_id: { type: 'integer', notNull: true },
    amount: { type: 'decimal(10,2)', notNull: true },
    fee_type: { type: 'varchar(30)', notNull: true },
    duration_days: { type: 'integer' },
    stripe_payment_intent_id: { type: 'varchar(100)' },
    status: { type: 'varchar(20)', notNull: true, default: "'pending'" },
    paid_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Create indexes
  pgm.createIndex('aircraft_listings', 'user_id');
  pgm.createIndex('aircraft_listings', 'status');
  pgm.createIndex('aircraft_listings', 'category');
  pgm.createIndex('aircraft_listings', ['location_state', 'location_city']);
  pgm.createIndex('aircraft_listings', 'featured');
  pgm.createIndex('aircraft_listings', 'created_at');

  pgm.createIndex('parts_listings', 'user_id');
  pgm.createIndex('parts_listings', 'status');
  pgm.createIndex('parts_listings', 'category');
  pgm.createIndex('parts_listings', 'part_number');

  pgm.createIndex('avionics_listings', 'user_id');
  pgm.createIndex('avionics_listings', 'status');
  pgm.createIndex('avionics_listings', 'category');

  pgm.createIndex('shop_products', 'seller_id');
  pgm.createIndex('shop_products', 'category');
  pgm.createIndex('shop_products', 'active');
  pgm.createIndex('shop_products', 'sku');

  pgm.createIndex('listing_photos', ['listing_type', 'listing_id']);
  pgm.createIndex('listing_inquiries', ['listing_type', 'listing_id']);
  pgm.createIndex('listing_inquiries', 'sender_id');
  pgm.createIndex('listing_inquiries', 'seller_id');
  pgm.createIndex('listing_payments', 'user_id');
  pgm.createIndex('listing_payments', ['listing_type', 'listing_id']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('listing_payments');
  pgm.dropTable('listing_inquiries');
  pgm.dropTable('listing_photos');
  pgm.dropTable('shop_products');
  pgm.dropTable('avionics_listings');
  pgm.dropTable('parts_listings');
  pgm.dropTable('aircraft_listings');
};
