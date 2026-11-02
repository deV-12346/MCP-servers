import { inputSchema } from "../schema/booking.schema.js";
import { client } from "../db/connectDB.js";

export const seachPackagesHandler = async(args: any) => {
  const result = inputSchema.safeParse(args);
  console.log("me chaala  ........ handler")
  if (!result.success) {
    return {
      success: false,
      message: "Invalid package search arguments",
    };
  }
  console.log("step4")
  const { packageName, destinationName, maxBudget, minBudget, days } =
    result.data;

  //DB OPERATION
  const query = `
    SELECT
      package_id,
      package_name,
      destination_name,
      days,
      price
    FROM package
    WHERE destination_name ILIKE $1
      AND ($2::integer IS NULL OR price <= $2)
      AND ($3::integer IS NULL OR price >= $3)
      AND ($4::integer IS NULL OR days = $4)
      AND ($5::text IS NULL OR package_name ILIKE $5)
    ORDER BY price ASC
    LIMIT 10;
  `;

  const values = [
    `%${destinationName}%`,
    maxBudget ?? null,
    minBudget ?? null,
    days ?? null,
    packageName ? `%${packageName}%` : null,
  ];

  const dbResult = await client.query(query, values);
  return {
    success: true,
    message: dbResult.rows.length > 0 ? "Packages fetched successfully":"No matched package found",
    data: dbResult.rows,
  };
};
