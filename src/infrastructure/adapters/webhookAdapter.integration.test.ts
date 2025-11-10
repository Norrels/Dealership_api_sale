import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { WebhookAdapter } from "./webhookAdapter";
import { config } from "../../config/env";

describe("WebhookAdapter - Integration Tests", () => {
  let webhookAdapter: WebhookAdapter;
  let originalFetch: typeof global.fetch;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalEnv = config.WEBHOOK_URL;
    webhookAdapter = new WebhookAdapter();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnv) {
      process.env.WEBHOOK_URL = originalEnv;
    } else {
      delete process.env.WEBHOOK_URL;
    }
  });

  describe("notifyVehicleStatusChange - Sucesso", () => {
    test("deve enviar notificação com status 'sold' com sucesso", async () => {
      let capturedRequest: { vehicleId: string; status: string } | undefined;

      global.fetch = (async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        capturedRequest = body;

        expect(url).toBe("http://localhost:3000/vehicles/webhook");
        expect(options.method).toBe("POST");
        expect(options.headers["Content-Type"]).toBe("application/json");

        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange("vehicle-123", "sold");

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest?.vehicleId).toBe("vehicle-123");
      expect(capturedRequest?.status).toBe("sold");
    });

    test("deve enviar notificação com status 'available' com sucesso", async () => {
      let capturedRequest: { vehicleId: string; status: string } | undefined;

      global.fetch = (async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        capturedRequest = body;

        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange(
        "vehicle-456",
        "available"
      );

      expect(capturedRequest?.vehicleId).toBe("vehicle-456");
      expect(capturedRequest?.status).toBe("available");
    });

    test("deve enviar notificação para diferentes veículos", async () => {
      const capturedRequests: Array<{ vehicleId: string; status: string }> = [];

      global.fetch = (async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        capturedRequests.push(body);

        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange("vehicle-1", "sold");
      await webhookAdapter.notifyVehicleStatusChange("vehicle-2", "available");
      await webhookAdapter.notifyVehicleStatusChange("vehicle-3", "sold");

      expect(capturedRequests).toHaveLength(3);
      expect(capturedRequests[0].vehicleId).toBe("vehicle-1");
      expect(capturedRequests[1].vehicleId).toBe("vehicle-2");
      expect(capturedRequests[2].vehicleId).toBe("vehicle-3");
    });
  });

  describe("notifyVehicleStatusChange - Tratamento de Erros", () => {
    test("não deve lançar erro quando webhook retorna 500", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-error", "sold")
      ).resolves.toBeUndefined();
    });

    test("não deve lançar erro quando webhook retorna 404", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-404", "sold")
      ).resolves.toBeUndefined();
    });

    test("não deve lançar erro quando há falha de rede", async () => {
      global.fetch = (async () => {
        throw new Error("Network timeout");
      }) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-net", "sold")
      ).resolves.toBeUndefined();
    });

    test("não deve lançar erro quando há erro de conexão", async () => {
      global.fetch = (async () => {
        throw new Error("Connection refused");
      }) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-conn", "available")
      ).resolves.toBeUndefined();
    });

    test("deve continuar funcionando após um erro", async () => {
      let callCount = 0;
      global.fetch = (async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First call fails");
        }
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange("vehicle-fail", "sold");

      await webhookAdapter.notifyVehicleStatusChange("vehicle-success", "sold");

      expect(callCount).toBe(2);
    });
  });

  describe("Configuração de URL do Webhook", () => {
    test("deve usar URL padrão quando não configurada", async () => {
      delete process.env.WEBHOOK_URL;

      let capturedUrl: string | undefined;
      global.fetch = (async (url: string) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      const adapter = new WebhookAdapter();
      await adapter.notifyVehicleStatusChange("vehicle-default", "sold");

      expect(capturedUrl).toBe("http://localhost:3000/vehicles/webhook");
    });

    test("deve usar URL customizada quando configurada", async () => {
      const customUrl = "http://custom-webhook.com/notify";
      config.WEBHOOK_URL = customUrl;

      let capturedUrl: string | undefined;
      global.fetch = (async (url: string) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      const adapter = new WebhookAdapter();
      await adapter.notifyVehicleStatusChange("vehicle-custom", "sold");

      expect(capturedUrl).toBe(customUrl);
    });
  });

  describe("Formato da requisição", () => {
    test("deve enviar requisição com formato correto", async () => {
      let capturedOptions: any;

      global.fetch = (async (url: string, options: any) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange("vehicle-format", "sold");

      expect(capturedOptions.method).toBe("POST");
      expect(capturedOptions.headers["Content-Type"]).toBe("application/json");
      expect(capturedOptions.body).toBeDefined();

      const body = JSON.parse(capturedOptions.body);
      expect(body).toHaveProperty("vehicleId");
      expect(body).toHaveProperty("status");
    });

    test("deve incluir dados corretos no corpo da requisição", async () => {
      let capturedBody: any;

      global.fetch = (async (url: string, options: any) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      const vehicleId = "vehicle-data-test";
      const status = "sold";

      await webhookAdapter.notifyVehicleStatusChange(vehicleId, status);

      expect(capturedBody.vehicleId).toBe(vehicleId);
      expect(capturedBody.status).toBe(status);
    });
  });

  describe("Códigos de status HTTP", () => {
    test("deve aceitar resposta 200 OK", async () => {
      global.fetch = (async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-200", "sold")
      ).resolves.toBeUndefined();
    });

    test("deve aceitar resposta 201 Created", async () => {
      global.fetch = (async () => ({
        ok: true,
        status: 201,
        statusText: "Created",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-201", "sold")
      ).resolves.toBeUndefined();
    });

    test("deve aceitar resposta 204 No Content", async () => {
      global.fetch = (async () => ({
        ok: true,
        status: 204,
        statusText: "No Content",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-204", "sold")
      ).resolves.toBeUndefined();
    });

    test("não deve lançar erro com status 400", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-400", "sold")
      ).resolves.toBeUndefined();
    });

    test("não deve lançar erro com status 503", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      })) as any;

      expect(
        webhookAdapter.notifyVehicleStatusChange("vehicle-503", "sold")
      ).resolves.toBeUndefined();
    });
  });

  describe("Cenários em sequência", () => {
    test("deve processar múltiplas notificações em sequência", async () => {
      const requests: Array<{ vehicleId: string; status: string }> = [];

      global.fetch = (async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        requests.push(body);
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange("vehicle-seq-1", "sold");
      await webhookAdapter.notifyVehicleStatusChange(
        "vehicle-seq-2",
        "available"
      );
      await webhookAdapter.notifyVehicleStatusChange("vehicle-seq-3", "sold");
      await webhookAdapter.notifyVehicleStatusChange(
        "vehicle-seq-4",
        "available"
      );

      expect(requests).toHaveLength(4);
      expect(requests[0]).toEqual({
        vehicleId: "vehicle-seq-1",
        status: "sold",
      });
      expect(requests[1]).toEqual({
        vehicleId: "vehicle-seq-2",
        status: "available",
      });
      expect(requests[2]).toEqual({
        vehicleId: "vehicle-seq-3",
        status: "sold",
      });
      expect(requests[3]).toEqual({
        vehicleId: "vehicle-seq-4",
        status: "available",
      });
    });

    test("deve continuar funcionando mesmo com falhas intermitentes", async () => {
      const successfulRequests: string[] = [];
      let callCount = 0;

      global.fetch = (async (url: string, options: any) => {
        callCount++;
        const body = JSON.parse(options.body);

        if (callCount % 2 === 1) {
          throw new Error("Intermittent failure");
        }

        successfulRequests.push(body.vehicleId);
        return {
          ok: true,
          status: 200,
          statusText: "OK",
        } as Response;
      }) as any;

      await webhookAdapter.notifyVehicleStatusChange("vehicle-1", "sold");
      await webhookAdapter.notifyVehicleStatusChange("vehicle-2", "sold"); 
      await webhookAdapter.notifyVehicleStatusChange("vehicle-3", "sold"); 
      await webhookAdapter.notifyVehicleStatusChange("vehicle-4", "sold"); 

      expect(callCount).toBe(4);
      expect(successfulRequests).toEqual(["vehicle-2", "vehicle-4"]);
    });
  });
});
