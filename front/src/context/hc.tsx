import { hc } from "hono/client";
import type { App } from "../../../back/src/app";

export const client = hc<App>(new URL("/", location.href).toString());
