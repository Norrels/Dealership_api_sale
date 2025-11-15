import { t } from "elysia";

export const PaymentWebhookDTO = t.Object({
  saleId: t.String({
    minLength: 1,
    error: "Sale ID is required",
  }),
  paymentStatus: t.Union([t.Literal("approved"), t.Literal("rejected")], {
    error: "Payment status must be 'approved' or 'rejected'",
  }),
});

export type PaymentWebhookInput = typeof PaymentWebhookDTO.static;
