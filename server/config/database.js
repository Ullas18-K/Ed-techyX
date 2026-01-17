import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+
      // But keeping them for backwards compatibility won't hurt
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.warn('⚠️ Server will continue running without MongoDB. Some features may not work.');
  }
};

export default connectDB;
