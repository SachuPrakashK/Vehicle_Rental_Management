/// <reference path="../server/src/types/express.d.ts" />

import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../server/src/app.js';

export default function handler(request: IncomingMessage, response: ServerResponse): void {
  const rewritten = new URL(request.url ?? '/api', 'http://localhost');
  const apiPath = rewritten.searchParams.get('__fleetline_api_path');

  if (apiPath !== null) {
    rewritten.searchParams.delete('__fleetline_api_path');
    rewritten.searchParams.delete('path');
    const query = rewritten.searchParams.toString();
    request.url = '/api/' + apiPath.replace(/^\/+/, '') + (query ? '?' + query : '');
  }

  app(request, response);
}
