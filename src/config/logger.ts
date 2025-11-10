import pino from "pino";
import { config } from "./env";

const logLevel = config.LOG_LEVEL;

export const logger = pino({
  level: logLevel,
  transport:
    logLevel === "silent"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
});
