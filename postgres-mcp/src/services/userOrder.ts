import { client } from "../db/connectDB.js";

export const getUserOrder = async (args, extra) => {
  const userId = Number(extra?._meta?.userId);
  if(!userId){
    return  {
    success: false,
    message:"User id is missing"
  }
  }
  console.error("args",args)
  console.error("extra////////",extra)
  const { productName, price,  } = args;
  const orders = await client.query(
    `select * from orders  as o
    left join products as p
    on  o.product_id = p.product_id
    WHERE o.user_id = $1
    AND (
         ($2::text IS NULL AND $3::numeric IS NULL)
         OR p.product_name = $2
         OR p.original_price = $3
       )`,
    [userId,productName ?? null ,price ?? null]
  );
  if(orders.rows.length === 0){
    return {
        success:false,
        message:"No order found"
    }
  }
  return {
    success:true,
    message:"orders fetched",
    orders :orders.rows
  }
};
