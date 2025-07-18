import { z } from "zod";
import { Hono } from "hono";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { pages, projects, projectsInsertSchema } from "@/db/schema";

const app = new Hono()

  // ##### ROTAS PAGES ##### -------------------------------------------------------

  // Listar páginas de um projeto
  .get(
    "/:projectId/pages",
    verifyAuth(),
    zValidator("param", z.object({ projectId: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { projectId } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verificar se o projeto pertence ao usuário
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
        );

      if (!project) {
        return c.json({ error: "Project not found or unauthorized" }, 404);
      }

      const data = await db
        .select()
        .from(pages)
        .where(eq(pages.projectId, projectId))
        .orderBy(asc(pages.order));

      return c.json({ data });
    }
  )

  // Criar uma nova página em um projeto
  .post(
    "/:projectId/pages",
    verifyAuth(),
    zValidator("param", z.object({ projectId: z.string() })),
    zValidator(
      "json",
      z.object({
        title: z.string().optional(),
        width: z.number().min(1),
        height: z.number().min(1),
        fabricState: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { projectId } = c.req.valid("param");
      const { title, width, height, fabricState  } = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verificar se o projeto pertence ao usuário
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
        );

      if (!project) {
        return c.json({ error: "Project not found or unauthorized" }, 404);
      }

      // Buscar o maior order existente
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`MAX(${pages.order})` })
        .from(pages)
        .where(eq(pages.projectId, projectId));
      const nextOrder = (maxOrder ?? -1) + 1;

      console.log("Fabric State:", fabricState);
      
      // Inserir a nova página
      const [newPage] = await db
        .insert(pages)
        .values({
          projectId,
          order: nextOrder,
          title: title ?? `Page ${nextOrder + 1}`,
          width,
          height,
          fabricState: fabricState ?? "",//{ version: "5.3.0", objects: [] },
          thumbnailUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ data: newPage }, 201);
    }
  )
   // Reordenar páginas
.patch(
  "/:projectId/pages/reorder",
  verifyAuth(),
  zValidator("param", z.object({ projectId: z.string() })),
  zValidator(
    "json",
    z.object({
      pages: z.array(z.object({
        id: z.string(),
        order: z.number()
      }))
    })
  ),
  async (c) => {
    const auth = c.get("authUser");
    const { projectId } = c.req.valid("param");
    const { pages: pageUpdates } = c.req.valid("json");

    if (!auth.token?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Verificar se o projeto pertence ao usuário
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
      );

    if (!project) {
      return c.json({ error: "Project not found or unauthorized" }, 404);
    }

    // Atualizar ordem de cada página
    try {
      for (const pageUpdate of pageUpdates) {
        await db
          .update(pages)
          .set({
            order: pageUpdate.order,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(pages.id, pageUpdate.id),
              eq(pages.projectId, projectId)
            )
          );
      }

      return c.json({ success: true }, 200);
    } catch (error) {
      console.error("Error reordering pages:", error);
      return c.json({ error: "Failed to reorder pages" }, 500);
    }
  }
)


  // Obter dados completos de uma página específica
  .get(
    "/:projectId/pages/:pageId",
    verifyAuth(),
    zValidator(
      "param",
      z.object({ projectId: z.string(), pageId: z.string() })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { projectId, pageId } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verificar se o projeto pertence ao usuário
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
        );

      if (!project) {
        return c.json({ error: "Project not found or unauthorized" }, 404);
      }

      const [page] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)));

      if (!page) {
        return c.json({ error: "Page not found" }, 404);
      }

      return c.json({ data: page });
    }
  )

  // Atualizar uma página (fabricState, title, etc.)
  .patch(
    "/:projectId/pages/:pageId",
    verifyAuth(),
    zValidator(
      "param",
      z.object({ projectId: z.string(), pageId: z.string() })
    ),
    zValidator(
      "json",
      z.object({
        fabricState: z.any().optional(),
        title: z.string().optional(),
        width: z.number().min(1).optional(),
        height: z.number().min(1).optional(),
        thumbnailUrl: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { projectId, pageId } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verificar se o projeto pertence ao usuário
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
        );

      if (!project) {
        return c.json({ error: "Project not found or unauthorized" }, 404);
      }

      // Atualizar a página
      const [updatedPage] = await db
        .update(pages)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)))
        .returning();

      if (!updatedPage) {
        return c.json({ error: "Page not found" }, 404);
      }

      return c.json({ data: updatedPage } satisfies { data: typeof updatedPage });

    }
  )

  // Deletar uma página
  .delete(
    "/:projectId/pages/:pageId",
    verifyAuth(),
    zValidator(
      "param",
      z.object({ projectId: z.string(), pageId: z.string() })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { projectId, pageId } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verificar se o projeto pertence ao usuário
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
        );

      if (!project) {
        return c.json({ error: "Project not found or unauthorized" }, 404);
      }

      // Verificar se não é a última página
      const pagesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(pages)
        .where(eq(pages.projectId, projectId));

      if (pagesCount[0].count <= 1) {
        return c.json({ error: "Cannot delete the last page" }, 400);
      }

      // Deletar a página
      const [deletedPage] = await db
        .delete(pages)
        .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)))
        .returning();

      if (!deletedPage) {
        return c.json({ error: "Page not found" }, 404);
      }

      return c.json({ data: { id: pageId } });
    }
  )
 
  // ##### ROTAS PROJECT ##### -------------------------------------------------------
  .get(
    "/templates",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      })
    ),
    async (c) => {
      const { page, limit } = c.req.valid("query");

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.isTemplate, true))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(asc(projects.isPro), desc(projects.updatedAt));

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)))
        .returning();

      if (data.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data: { id } });
    }
  )
  // .post(
  //   "/:id/duplicate",
  //   verifyAuth(),
  //   zValidator("param", z.object({ id: z.string() })),
  //   async (c) => {
  //     const auth = c.get("authUser");
  //     const { id } = c.req.valid("param");

  //     if (!auth.token?.id) {
  //       return c.json({ error: "Unauthorized" }, 401);
  //     }

  //     const data = await db
  //       .select()
  //       .from(projects)
  //       .where(
  //         and(
  //           eq(projects.id, id),
  //           eq(projects.userId, auth.token.id),
  //         ),
  //       );

  //     if (data.length === 0) {
  //       return c.json({ error:" Not found" }, 404);
  //     }

  //     const project = data[0];

  //     const duplicateData = await db
  //       .insert(projects)
  //       .values({
  //         name: `Copy of ${project.name}`,
  //         // json: project.json,
  //         width: project.width,
  //         height: project.height,
  //         userId: auth.token.id,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       })
  //       .returning();

  //     return c.json({ data: duplicateData[0] });
  //   },
  // )
  .post(
    "/:id/duplicate",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser")!;
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // 1) Busca projeto e suas páginas
      const [origProj] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)));

      const origPages = await db
        .select()
        .from(pages)
        .where(eq(pages.projectId, id));

      // 2) Duplica projeto
      const [dupProj] = await db
        .insert(projects)
        .values({
          name: `Copy of ${origProj.name}`,
          width: origProj.width,
          height: origProj.height,
          userId: auth.token.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 3) Duplica cada página
      for (const p of origPages) {
        await db.insert(pages).values({
          projectId: dupProj.id,
          order: p.order,
          title: p.title,
          width: dupProj.width,
          height: dupProj.height,
          fabricState: p.fabricState,
          thumbnailUrl: p.thumbnailUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 4) Retorna o novo projeto (você pode também querer retornar as páginas clonadas)
      return c.json({ data: dupProj });
    }
  )
  .get(
    "/",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { page, limit } = c.req.valid("query");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, auth.token.id))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(projects.updatedAt));

      return c.json({
        data,
        nextPage: data.length === limit ? page + 1 : null,
      });
    }
  )
  .patch(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      projectsInsertSchema
        .omit({
          id: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        })
        .partial()
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .update(projects)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)))
        .returning();

      if (data.length === 0) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: data[0] });
    }
  )
  .get(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Busca o projeto
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)));

      if (!project) {
        return c.json({ error: "Not found" }, 404);
      }

      // Busca todas as páginas do projeto
      const projectPages = await db
        .select()
        .from(pages)
        .where(eq(pages.projectId, id))
        .orderBy(asc(pages.order));

      const data = [{ ...project, pages: projectPages }];

      if (data.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }

      console.log("Project data:", data[0]);

      return c.json({ data: data[0] });
    }
  )
  .post(
    "/",
    verifyAuth(),
    zValidator(
      "json",
      projectsInsertSchema.pick({
        name: true,
        // json: true,
        width: true,
        height: true,
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const {
        name,
        // json,
        height,
        width,
      } = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // 1) Cria o projeto
      const [newProj] = await db
        .insert(projects)
        .values({
          name,
          // json,
          width,
          height,
          userId: auth.token.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newProj) {
        return c.json({ error: "Something went wrong" }, 400);
      }

      // 2) Cria a página inicial (order = 0)
      const defaultState = {
        version: "5.3.0",
        objects: [],
        clipPath: {
          type: "rect",
          version: "5.3.0",
          originX: "left",
          originY: "top",
          left: 0,
          top: 0,
          width, // vem do seu parâmetro
          height, // vem do seu parâmetro
          fill: "white",
          selectable: false,
          hasControls: false,
          shadow: {
            color: "rgba(0,0,0,0.8)",
            blur: 5,
            offsetX: 0,
            offsetY: 0,
            affectStroke: false,
            nonScaling: false,
          },
        },
      };

      const [firstPage] = await db
        .insert(pages)
        .values({
          projectId: newProj.id,
          order: 0,
          title: "Página 1",
          width,
          height,
          // Se sua coluna é TEXT ou JSON, stringify; se for JSONB, basta o objeto
          fabricState: "",
          thumbnailUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ data: newProj }, 201);

      // 3) Retorna ambos
      // return c.json({ data: { project: newProj, firstPage } }, 201);
    }
  );

export default app;
