/**
 * Database migration script
 * Run with: npm run db:migrate
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import database (this will auto-initialize the schema)
import('../lib/database.js').then(({ default: db }) => {
  console.log('✅ Database initialized successfully');
  console.log(`📁 Database location: ${process.env.DATABASE_PATH || path.join(__dirname, '../data/cms.db')}`);
  
  // Show table info
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('\n📋 Tables created:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   - ${table.name}: ${count.count} rows`);
  });
  
  console.log('\n🚀 Database ready for use!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

