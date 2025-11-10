import { WebhookPort } from "../../domain/ports/out/webhookPort";
import { logger } from "../../config/logger";

export class WebhookAdapter implements WebhookPort {
  private readonly WEBHOOK_URL =
    process.env.WEBHOOK_URL || "http://localhost:3000/vehicles/webhook";

  async notifyVehicleStatusChange(
    vehicleId: string,
    status: "available" | "sold"
  ): Promise<void> {
    try {
      logger.info(
        { vehicleId, status, url: this.WEBHOOK_URL },
        "Enviando notificação de mudança de status do veículo"
      );

      const response = await fetch(this.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook retornou erro! status: ${response.status} - ${response.statusText}`
        );
      }

      logger.info(
        { vehicleId, status },
        "Webhook notificado com sucesso"
      );
    } catch (error) {
      logger.error(
        { error, vehicleId, status },
        "Erro ao notificar webhook de mudança de status"
      );
    }
  }
}
