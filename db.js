const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('petitions', 'postgres', 'admin', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false,   pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error);
  }
}

testConnection();

module.exports = sequelize;

