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
import { useUpdatePage } from "@/features/pages/api/use-update-page";
import { useDeletePage } from "@/features/pages/api/use-delete-page";
import { toast } from "sonner";
import { useCreatePage } from "@/features/pages/api/use-create-page";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { useReorderPages } from "@/features/pages/api/use-reorder-pages";

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
  pending?: boolean;
  initialData: { width: number; height: number };
}

export const PagesNavigation = ({
  projectId,
  pending = false,
  pages,
  activePageId,
  setActivePageId,
  createPage,
  initialData,
}: PagesNavigationProps) => {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const updatePageMutation  = useUpdatePage(projectId);
  const deletePageMutation = useDeletePage(projectId);
  const createPageMutation = useCreatePage(projectId);
  const reorderPagesMutation = useReorderPages(projectId);

  const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);



const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (active && over && active.id !== over.id) {
    const oldIndex = pages.findIndex(p => p.id === active.id);
    const newIndex = pages.findIndex(p => p.id === over.id);
    
    const reorderedPages = arrayMove(pages, oldIndex, newIndex);
    
    // ✅ Chamar API para salvar nova ordem
    try {
      await reorderPagesMutation.mutateAsync({
        pages: reorderedPages.map((page, index) => ({
          id: page.id,
          order: index
        }))
      });
    } catch (error) {
      console.error("Error reordering pages:", error);
    }
  }
};

  const handleEditTitle = (page: Page) => {
    setEditingPageId(page.id);
    setEditTitle(page.title || `Page ${page.order + 1}`);
  };
const handleSaveTitle = async () => {
  if (!editingPageId || !editTitle.trim()) return;
  
  // ✅ Fechar o input imediatamente (optimistic)
  const pageIdToUpdate = editingPageId;
  const titleToSave = editTitle.trim();
  setEditingPageId(null);
  
  try {
    await updatePageMutation.mutateAsync({
      pageId: pageIdToUpdate,
      data: { title: titleToSave }
    });
    // ✅ Sucesso! UI já foi atualizada otimisticamente
  } catch (error) {
    // ✅ Erro! Hook já fez rollback automático
    // Reabrir o input para o usuário tentar novamente
    setEditingPageId(pageIdToUpdate);
    setEditTitle(titleToSave);
  }
};

  const handleDeletePage = async (pageId: string) => {
  if (pages.length <= 1) {
    toast.error("Cannot delete the last page");
    return;
  }
  
  try {
    await deletePageMutation.mutateAsync({ pageId });
    
    // Se deletou a página ativa, mudar para primeira página
    if (activePageId === pageId) {
      const remainingPages = pages.filter(p => p.id !== pageId);
      if (remainingPages.length > 0) {
        setActivePageId(remainingPages[0].id);
      }
    }
  } catch (error) {
    console.error("Error deleting page:", error);
  }
};

const handleDuplicatePage = async (page: Page) => {
  try {
    await createPageMutation.mutateAsync({
      title: `Copy of ${page.title || `Page ${page.order + 1}`}`,
      width: page.width || initialData.width,
      height: page.height || initialData.height,
      fabricState: page.fabricState, // ← Copia o conteúdo da página
    });
  } catch (error) {
    console.error("Error duplicating page:", error);
  }
};

  if (pages.length === 0) {
    return (
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto overflow-y-hidden">
        <Loader className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto overflow-y-hidden">
      <TooltipProvider>
        {/* Lista de Páginas */}
        {/* <div className="flex items-center gap-1 flex-1 min-w-0">
          {pages.map((page, index) => (
            <div key={page.id} className="flex items-center gap-1"> */}
              {/* Tab da Página */}
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all hover:bg-gray-50",
                      activePageId === page.id
                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                        : "bg-gray-50 border border-transparent text-gray-600 hover:text-gray-900"
                    )}
                    onClick={() => setActivePageId(page.id)}
                  > */}
                    {/* Nome da Página */}
                    {/* {editingPageId === page.id ? (
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
                        disabled={updatePageMutation.isPending}
                      />
                    ) : (
                      <span className="text-xs font-medium truncate max-w-16">
                        {page.title || `Page ${index + 1}`}
                      </span>
                    )} */}

                    {/* Menu de Ações */}
                    {/* {activePageId === page.id && (
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
                              disabled={deletePageMutation.isPending}
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
        </div> */}

        {/* Lista de Páginas */}
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
  modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
>
  <div className="flex items-center gap-1 flex-1 min-w-0 h-full">
    <SortableContext
      items={pages.map(p => p.id)}
      strategy={horizontalListSortingStrategy}
    >
      {pages.map((page, index) => (
        <SortablePageTab
          key={page.id}
          page={page}
          index={index}
          activePageId={activePageId}
          setActivePageId={setActivePageId}
          editingPageId={editingPageId}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          handleSaveTitle={handleSaveTitle}
          handleEditTitle={handleEditTitle}
          handleDuplicatePage={handleDuplicatePage}
          handleDeletePage={handleDeletePage}
          updatePageMutation={updatePageMutation}
          deletePageMutation={deletePageMutation}
          setEditingPageId={setEditingPageId}
        />
      ))}
    </SortableContext>
  </div>
</DndContext>

        {/* Botão Adicionar Página */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={createPage}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 shrink-0 border border-dashed border-gray-300 hover:border-gray-400"
              disabled={pending}
            >
              {!pending ? <Plus className="h-4 w-4" /> : <Loader className="h-4 w-4 animate-spin" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Page</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};


interface SortablePageTabProps {
  page: Page;
  index: number;
  activePageId: string;
  setActivePageId: (id: string) => void;
  editingPageId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  handleSaveTitle: () => void;
  handleEditTitle: (page: Page) => void;
  handleDuplicatePage: (page: Page) => void;
  handleDeletePage: (pageId: string) => void;
  updatePageMutation: any;
  deletePageMutation: any;
  setEditingPageId: (id: string | null) => void;
}

const SortablePageTab = ({ 
  page, 
  index, 
  activePageId, 
  setActivePageId,
  editingPageId,
  editTitle,
  setEditTitle,
  handleSaveTitle,
  handleEditTitle,
  handleDuplicatePage,
  handleDeletePage,
  updatePageMutation,
  deletePageMutation,
  setEditingPageId 
}: SortablePageTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-1"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div
          className={cn(
            "group relative flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all hover:bg-gray-50",
            activePageId === page.id
              ? "bg-blue-50 border border-blue-200 text-blue-700"
              : "bg-gray-50 border border-transparent text-gray-600 hover:text-gray-900"
          )}
          onClick={() => setActivePageId(page.id)} // ← Click funciona aqui
        >
          {/* ✅ ÁREA DE DRAG - só um pequeno handle */}
          <div 
            {...listeners} // ← Drag listeners APENAS nesta área
            className="flex items-center justify-center w-2 h-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
          >
            <div className="w-1 h-full bg-gray-400 rounded-full"></div>
          </div>
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
                disabled={updatePageMutation.isPending}
              />
            ) : (
              <span className="text-xs font-medium truncate max-w-20">
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
                  {/* Resto igual... */}
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
  );
};