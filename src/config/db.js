import dotenv from 'dotenv'
dotenv.config()


import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "../../generated/prisma/client.ts";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

const prisma = new PrismaClient({
    adapter
})

const connectDB = async () => {
    try {
       await prisma.$connect();
        console.log('Connected to DB via prisma');
        
    } catch (error) {
        console.log("Connection error...........: ", error.message);
        process.exit(1);
        
    }
}

const disconnectDB = async () => {
    await prisma.$disconnect();
}

export { prisma, connectDB, disconnectDB }