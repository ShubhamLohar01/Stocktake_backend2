import serverless from "serverless-http";

import { createServer } from "../index";

export const handler = serverless(createServer());
