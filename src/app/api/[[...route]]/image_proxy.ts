import { z } from "zod";
import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

const app = new Hono()
  .get(
    "/",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        url: z.string().url("Invalid URL format"),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { url: imageUrl } = c.req.valid("query");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Configurações
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_CONTENT_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      try {
        // Fetch com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
            "Accept": "image/*",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return c.json(
            {
              error: "Failed to fetch image",
              status: response.status,
              statusText: response.statusText,
            },
            502
          );
        }

        // Verificar content-type
        const contentType = response.headers.get("content-type") || "";
        if (!ALLOWED_CONTENT_TYPES.some((type) => contentType.startsWith(type))) {
          return c.json(
            {
              error: "Invalid content type",
              contentType: contentType,
            },
            400
          );
        }

        // Verificar tamanho
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
          return c.json(
            {
              error: "File too large",
              maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
            },
            413
          );
        }

        const imageBuffer = await response.arrayBuffer();

        // Verificar tamanho real
        if (imageBuffer.byteLength > MAX_FILE_SIZE) {
          return c.json(
            {
              error: "File too large",
              maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
            },
            413
          );
        }

        return new Response(imageBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Length": imageBuffer.byteLength.toString(),
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch (error) {
        console.error("Image proxy error:", error);

        if (error instanceof Error && error.name === "AbortError") {
          return c.json({ error: "Request timeout" }, 504);
        }

        return c.json(
          {
            error: "Error fetching image",
            message: error instanceof Error ? error.message : String(error),
          },
          500
        );
      }
    }
  );

export default app;