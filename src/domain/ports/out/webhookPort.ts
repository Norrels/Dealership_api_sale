export interface WebhookPort {
  notifyVehicleStatusChange(
    vehicleId: string,
    status: "available" | "sold"
  ): Promise<void>;
}
