import { client } from "../db/connectDB.js";

export const createBookingHandler = async (user_id: Number, args: any) => {
  const pckg = await  client.query("select * from package where package_name = $1",[args.packageName])
  const query = `
      insert into booking (user_id, package_id,start_date,end_date)
      values ($1,$2,$3,$4) returning*
    `;
    if(pckg.rows.length === 0) return {
      success:false,
      message:"Package not found"
    }
    console.log(pckg)
  const newBooking = await client.query(query, [
    user_id,
    pckg.rows[0].package_id,
    args.startDate,
    args.endDate,
  ]);
  return {
    success:true,
    message:"Booking created",
    newBooking:newBooking?.rows[0]
  }
};
    