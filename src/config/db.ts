import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error('MONGO_URI is undefined. Check your .env file.');
    }

    // Mask password for safe logging
    const maskedURI = env.MONGO_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`⏳ Attempting to connect to MongoDB using URI: ${maskedURI}`);

    // Direct connection with explicit timeouts — no SRV needed
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🌍 Host: ${conn.connection.host}`);
    console.log(`📂 Database Name: ${conn.connection.name}`);
  } catch (error: any) {
    console.error(`\n❌ Failed to connect to MongoDB!`);
    console.error(`🔴 Error Name   : ${error.name}`);
    console.error(`🔴 Error Message: ${error.message}`);
    console.error(`🔴 Stack Trace  :\n${error.stack}`);
    console.error(`🔴 Full Error   :`, error);

    if (error.message?.includes('ECONNREFUSED')) {
      console.error(`\n💡 TIP: Connection refused — your network or Atlas firewall may be blocking port 27017.`);
      console.error(`   1. Go to MongoDB Atlas → Security → Network Access.`);
      console.error(`   2. Ensure your IP (or 0.0.0.0/0) is on the Allowlist and is 'Active'.`);
      console.error(`   3. Check if your current Wi-Fi blocks port 27017.\n`);
    }

    if (error.message?.includes('querySrv') || error.message?.includes('ENOTFOUND')) {
      console.error(`\n💡 TIP: DNS resolution failed. Confirm the host names in MONGO_URI are correct.\n`);
    }

    console.log('⚠️  Server will continue to run, but database features will be unavailable.');
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log(`✅ MongoDB Disconnected`);
  } catch (error) {
    console.error(`❌ Error disconnecting from MongoDB:`, error);
  }
};
