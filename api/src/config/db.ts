import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('Falta MONGODB_URI en las variables de entorno');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error en la conexion a MongoDB: ${error}`);
    process.exit(1);
  }
};
