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
  pgm.createTable('career_profiles', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
      unique: true,
    },
    
    // Resume file
    resume_file_url: { type: 'text' },
    resume_file_name: { type: 'varchar(255)' },
    resume_uploaded_at: { type: 'timestamp' },
    
    // Professional summary
    professional_summary: { type: 'text' },
    
    // Certifications & Licenses
    pilot_licenses: { type: 'text' }, // JSON array
    type_ratings: { type: 'text' }, // JSON array
    medical_class: { type: 'varchar(50)' },
    medical_expiry: { type: 'date' },
    
    // Flight hours
    total_flight_hours: { type: 'integer' },
    pic_hours: { type: 'integer' },
    multi_engine_hours: { type: 'integer' },
    turbine_hours: { type: 'integer' },
    jet_hours: { type: 'integer' },
    ifr_hours: { type: 'integer' },
    night_hours: { type: 'integer' },
    
    // Work experience (JSON array of positions)
    work_experience: { type: 'text' },
    
    // Education (JSON array)
    education: { type: 'text' },
    
    // Skills & languages
    skills: { type: 'text' }, // JSON array
    languages: { type: 'text' }, // JSON array with proficiency levels
    
    // Availability
    available_for_work: { type: 'boolean', default: true },
    willing_to_relocate: { type: 'boolean', default: false },
    preferred_locations: { type: 'text' }, // JSON array
    preferred_aircraft_types: { type: 'text' }, // JSON array
    preferred_operation_types: { type: 'text' }, // JSON array
    
    // Contact preferences
    contact_phone: { type: 'varchar(50)' },
    contact_email: { type: 'varchar(255)' },
    linkedin_url: { type: 'text' },
    
    // Visibility
    profile_visibility: { type: 'varchar(50)', default: 'private' }, // private, public, employers-only
    
    // Metadata
    profile_completed_percentage: { type: 'integer', default: 0 },
    last_updated: { type: 'timestamp', default: pgm.func('CURRENT_TIMESTAMP') },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
  });

  // Indexes
  pgm.createIndex('career_profiles', 'user_id');
  pgm.createIndex('career_profiles', 'available_for_work');
  pgm.createIndex('career_profiles', 'profile_visibility');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('career_profiles');
};
