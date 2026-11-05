export const ORDER_PAYMENT_MIGRATION_HINT = "Төлбөрийн дүн хадгалахын тулд Supabase дээр 20261106000000_order_payment.sql migration-ийг ажиллуулна уу.";

/** Tokens are 24 random bytes in base64url; anything else is rejected before a database read. */
export const isPaymentToken = (value: string) => /^[A-Za-z0-9_-]{32}$/.test(value);

export const formatMnt = (amount: number) => `${amount.toLocaleString("en-US")}₮`;
