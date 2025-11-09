import { t } from "elysia";

export const CreateSaleDTO = t.Object({
  vehicleId: t.String(),
  customerName: t.String(),
  customerCPF: t.String(),
  salePrice: t.String({
    pattern: "^\\d+(\\.\\d{1,2})?$",
    error: "Price must be a valid decimal number with up to 2 decimal places",
  }),
});

export type CreateSaleInput = typeof CreateSaleDTO.static;
