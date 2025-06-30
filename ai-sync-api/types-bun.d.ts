// Type definitions for Bun global
// Bun provides its own types, but this is a minimal fallback for type checking

declare const Bun: {
  serve(options: {
    port: number;
    fetch(req: Request): Promise<Response> | Response;
  }): unknown;
};
