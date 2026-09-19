const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB conectado exitosamente: ${conn.connection.host} / DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Error al conectar con MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
