import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageProvider";

interface SortableListProps<T extends { id: string }> {
  items: T[];
  getLabel: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => ReactNode;
}

export function SortableList<T extends { id: string }>({
  items,
  getLabel,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
      >
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <SortableRow id={item.id} key={item.id} label={getLabel(item)}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      className={`flex items-stretch rounded-3xl border border-line bg-elevated ${
        isDragging ? "z-10 opacity-80 shadow-lg" : ""
      }`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        aria-label={t("dragHandle", { name: label })}
        className="flex w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-l-3xl text-fg-muted hover:bg-primary-muted active:cursor-grabbing"
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
