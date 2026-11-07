import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CONNECT_OPTIONS = { serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS) || 15000 };
const DNS_FALLBACK_SERVERS = (process.env.DNS_FALLBACK_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

const isDnsFailure = (error) =>
  ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEOUT', 'ESERVFAIL'].includes(error?.code) ||
  /query(Srv|Txt|A|Aaaa)|dns/i.test(error?.message || '');

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-restorant';

  try {
    const conn = await mongoose.connect(uri, CONNECT_OPTIONS);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (isDnsFailure(error) && DNS_FALLBACK_SERVERS.length) {
      console.warn(
        `⚠️ System DNS failed (${error.message}). Retrying with ${DNS_FALLBACK_SERVERS.join(', ')}`
      );
      try {
        dns.setServers(DNS_FALLBACK_SERVERS);
        const conn = await mongoose.connect(uri, CONNECT_OPTIONS);
        console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (retryError) {
        console.error(`⚠️ MongoDB Connection Warning: ${retryError.message}`);
        throw retryError;
      }
    }

    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log(`👉 Please set a valid MONGODB_URI in backend/.env.`);
    throw error;
  }
};
