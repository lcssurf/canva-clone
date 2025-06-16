// src/features/editor/components/pages-navigation.tsx
// NOVA NAVEGAÇÃO SUPERIOR PARA PÁGINAS

"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, X, Copy, Edit3, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  title?: string | null;
  order: number;
  width?: number;
  height?: number;
  fabricState?: any; // Use 'any' for jsonb, or a more specific type if known
}

interface PagesNavigationProps {
  pages: Page[];
  activePageId: string;
  setActivePageId: (id: string) => void;
  createPage: () => void;
  projectId: string;
}

export const PagesNavigation = ({
  pages,
  activePageId,
  setActivePageId,
  createPage,
}: PagesNavigationProps) => {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleEditTitle = (page: Page) => {
    setEditingPageId(page.id);
    setEditTitle(page.title || `Page ${page.order + 1}`);
  };

  const handleSaveTitle = () => {
    // TODO: Implementar save do título
    setEditingPageId(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    // TODO: Implementar delete
    console.log("Delete page:", pageId);
  };

  const handleDuplicatePage = (page: Page) => {
    // TODO: Implementar duplicação
    console.log("Duplicate page:", page);
  };

  if (pages.length === 0) {
    return (
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
        <Loader className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
      <TooltipProvider>
        {/* Lista de Páginas */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {pages.map((page, index) => (
            <div key={page.id} className="flex items-center gap-1">
              {/* Tab da Página */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all hover:bg-gray-50",
                      activePageId === page.id
                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                        : "bg-gray-50 border border-transparent text-gray-600 hover:text-gray-900"
                    )}
                    onClick={() => setActivePageId(page.id)}
                  >
                    {/* Nome da Página */}
                    {editingPageId === page.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") setEditingPageId(null);
                        }}
                        className="h-6 w-20 text-xs px-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs font-medium truncate max-w-16">
                        {page.title || `Page ${index + 1}`}
                      </span>
                    )}

                    {/* Menu de Ações */}
                    {activePageId === page.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuItem onClick={() => handleEditTitle(page)}>
                            <Edit3 className="h-3 w-3 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePage(page)}>
                            <Copy className="h-3 w-3 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {pages.length > 1 && (
                            <DropdownMenuItem 
                              onClick={() => handleDeletePage(page.id)}
                              className="text-red-600"
                            >
                              <X className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <div className="font-medium">{page.title || `Page ${index + 1}`}</div>
                    <div className="text-xs text-gray-500">
                      {page.width} × {page.height}px
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        {/* Botão Adicionar Página */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={createPage}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 shrink-0 border border-dashed border-gray-300 hover:border-gray-400"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Page</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};