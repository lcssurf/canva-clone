"use client";

// app/editor/[projectId]/page.tsx

import Link from "next/link";
import { Loader, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useGetPages } from "@/features/pages/api/use-get-pages";
import { useCreatePage } from "@/features/pages/api/use-create-page";

import { Editor } from "@/features/editor/components/editor";
import { Button } from "@/components/ui/button";

interface EditorProjectIdPageProps {
  params: {
    projectId: string;
  };
}

const EditorProjectIdPage = ({
  params,
}: EditorProjectIdPageProps) => {
  // Dados do projeto
  const { 
    data: projectData, 
    isLoading: isLoadingProject, 
    isError: isErrorProject
  } = useGetProject(params.projectId);

  // Lista de páginas
  const {
    data: pages,
    isLoading: loadingPages,
    isError: errorPages,
  } = useGetPages(params.projectId);

  // Mutação para criar nova página
  const createPageMutation = useCreatePage(params.projectId);

  // Página ativa
  const [activePageId, setActivePageId] = useState<string | undefined>(undefined);

  // Set active page when pages load
  useEffect(() => {
    if (!activePageId && pages && pages.length > 0) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId]);

  // Create first page if none exist
  useEffect(() => {
    if (projectData && pages && pages.length === 0 && !loadingPages && !createPageMutation.isPending) {
      createPageMutation.mutate({
        title: "Page 1",
        width: projectData.width,
        height: projectData.height,
      });
    }
  }, [projectData, pages, loadingPages, createPageMutation]);

  // Handle create page
  const handleCreatePage = (req: { title?: string; width: number; height: number }) => {
    createPageMutation.mutate(req, {
      onSuccess: (data) => {
        // Switch to the newly created page
        setActivePageId(data.data.id);
      },
    });
  };

  if (isLoadingProject || loadingPages || !projectData) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isErrorProject || errorPages) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Failed to fetch project
        </p>
        <Button asChild variant="secondary">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  // Don't render editor until we have pages and an active page
  if (!pages || pages.length === 0 || !activePageId) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">
          Setting up your project...
        </p>
      </div>
    );
  }

  return (
    <Editor
      initialData={projectData} 
      pages={pages}
      activePageId={activePageId}
      setActivePageId={setActivePageId}
      createPage={handleCreatePage}
    />
  );
};
 
export default EditorProjectIdPage;