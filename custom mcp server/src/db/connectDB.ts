import {Pool} from "pg"
import dotenv from "dotenv"
dotenv.config()
export const client = new Pool({
    connectionString:process.env.DATABASE_URL,
    max:50,
    idleTimeoutMillis:300_000,
    connectionTimeoutMillis:5_000
})
export const connectDb = async()=>{
    const pool = await client.connect() 
    try {
       console.log("pool connected")
    } catch (error) {
        throw error
    }finally{
       await pool.release()
    }
}