import z from "zod";

export const getOrderSchema = z.object({
    productName: z.string().optional(),
    price: z.number().optional(),
    // date: z.date().optional()
})