import openapi from "@elysiajs/openapi";

export const openapiConfig = openapi({
  documentation: {
    info: {
      title: "Dealership Vehicle Managing Sale API",
      version: "1.0.0",
      description: "API for managing vehicle sales in a dealership",
    },
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Sales",
        description: "Endpoints for managing vehicles",
      },
      {
        name: "Vehicles",
        description: "Endpoints for managing sales",
      },
    ],
  },
});
