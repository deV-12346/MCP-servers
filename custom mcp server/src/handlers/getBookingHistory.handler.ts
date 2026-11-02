import { client } from "../db/connectDB.js";
export const getBookingHistoryHandler = async(userId:number) =>{
       if(!userId) {
        throw new Error("User id is missing ")
       }
       const query = `
          select * from booking as b
          inner join package as p 
          on b.package_id = p.package_id 
          where b.user_id = $1
          order by created desc
        `
        const booking = await client.query(query,[userId])
            return {
                success:true,
                message:booking.rows.length === 0  ? "No booking found" : "Booking fecthed",
                bookings:booking
            }
}