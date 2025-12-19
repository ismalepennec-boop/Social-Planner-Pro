import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Instagram, Facebook, GripVertical, Calendar, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@shared/schema";
import * as api from "@/lib/api";

const COLUMNS = [
  { id: "draft", title: "Brouillons", color: "bg-gray-50 border-gray-200", status: "draft" },
  { id: "scheduled", title: "Programmé", color: "bg-amber-50 border-amber-200", status: "scheduled" },
  { id: "published", title: "Publié", color: "bg-emerald-50 border-emerald-200", status: "sent" },
];

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "linkedin":
      return <Linkedin className="w-3 h-3 text-[#0A66C2]" />;
    case "instagram":
      return <Instagram className="w-3 h-3 text-pink-500" />;
    case "facebook":
      return <Facebook className="w-3 h-3 text-[#1877F2]" />;
    default:
      return null;
  }
};

function PostCard({ post, columnId, isDragging }: { post: Post; columnId: string; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: post.id,
    data: { columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-3 cursor-grab active:cursor-grabbing hover:border-violet-200 hover:shadow-md transition-all duration-200"
      data-testid={`kanban-card-${post.id}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-400 hover:text-gray-600 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            {post.platforms.map((p) => (
              <PlatformIcon key={p} platform={p} />
            ))}
          </div>
          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
            {post.content}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {format(new Date(post.date), "dd/MM/yy HH:mm")}
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({
  column,
  posts,
}: {
  column: typeof COLUMNS[0];
  posts: Post[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] rounded-xl border-2 ${column.color} p-3 transition-all ${
        isOver ? "ring-2 ring-indigo-400 ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {posts.length}
        </Badge>
      </div>
      <SortableContext
        items={posts.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px]">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} columnId={column.id} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              Glissez des posts ici
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activePost, setActivePost] = useState<Post | null>(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: api.getPosts,
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      api.updatePost(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du post.",
        variant: "destructive",
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getColumnPosts = (columnId: string) => {
    return posts.filter((post) => {
      switch (columnId) {
        case "draft":
          return post.status === "draft";
        case "scheduled":
          return post.status === "scheduled";
        case "published":
          return post.status === "published" || post.status === "sent";
        default:
          return post.status === "scheduled";
      }
    });
  };

  const getPostColumnId = (post: Post): string => {
    if (post.status === "draft") return "draft";
    if (post.status === "scheduled") return "scheduled";
    if (post.status === "published" || post.status === "sent") return "published";
    return "scheduled";
  };

  const handleDragStart = (event: DragStartEvent) => {
    const post = posts.find((p) => p.id === event.active.id);
    if (post) setActivePost(post);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePost(null);

    if (!over) return;

    const postId = active.id as number;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Get the target column ID - either from the droppable column or from the card's data
    let targetColumnId: string | undefined;
    
    // Check if dropped on a column directly
    const directColumn = COLUMNS.find((col) => col.id === over.id);
    if (directColumn) {
      targetColumnId = directColumn.id;
    } else {
      // Dropped on another card - get the column from the card's data
      targetColumnId = over.data?.current?.columnId as string | undefined;
    }

    if (!targetColumnId) return;

    const targetColumn = COLUMNS.find((col) => col.id === targetColumnId);
    if (!targetColumn) return;

    const currentColumnId = getPostColumnId(post);

    if (currentColumnId !== targetColumnId) {
      updatePostMutation.mutate({ id: postId, status: targetColumn.status });
      toast({
        title: "Statut mis à jour",
        description: `Le post a été déplacé vers "${targetColumn.title.replace(/[^\w\s]/g, '').trim()}"`,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vue Kanban</h1>
              <p className="text-sm text-gray-500">
                Gérez votre workflow par glisser-déposer
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto p-8">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max">
              {COLUMNS.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  posts={getColumnPosts(column.id)}
                />
              ))}
            </div>
            <DragOverlay>
              {activePost ? <PostCard post={activePost} columnId="" isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
    </div>
  );
}
