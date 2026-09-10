import mongoose from 'mongoose';

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '\x1b[33m[MongoDB Notice]\x1b[0m MONGODB_URI is not set in .env. Running with local fallback until MongoDB Atlas connection string is provided.'
    );
    return false;
  }

  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(uri, {
      dbName: 'bazaaro',
      serverSelectionTimeoutMS: 5000,
    });

    console.log('\x1b[32m[MongoDB Connected]\x1b[0m Successfully connected to MongoDB database.');

    mongoose.connection.on('error', (err) => {
      console.error('\x1b[31m[MongoDB Error]\x1b[0m Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('\x1b[33m[MongoDB Disconnected]\x1b[0m Database disconnected.');
    });

    return true;
  } catch (error: any) {
    console.error('\x1b[31m[MongoDB Connection Failed]\x1b[0m', error.message);
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
