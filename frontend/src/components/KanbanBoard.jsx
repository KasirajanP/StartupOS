import Card from "./Card";
import StatusBadge from "./StatusBadge";

function KanbanBoard({
  columns,
  onSelectItem,
  selectedItemId,
  onDragStart,
  onDropOnColumn,
  activeDragId,
  onUnauthorizedDrag,
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {columns.map((column) => (
        <div
          key={column.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => onDropOnColumn?.(column.statusValue)}
          className={[
            "rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-4 transition",
            activeDragId ? "border-dashed border-slate-300" : "",
          ].join(" ")}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-extrabold text-slate-900">{column.title}</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                {column.storyPoints} pts
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {column.items.length}
            </span>
          </div>

          <div className="space-y-4">
            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => {
                  if (item.isDraggable) {
                    onDragStart?.(item.rawId);
                    return;
                  }
                  event.preventDefault();
                  onDragStart?.("");
                  onUnauthorizedDrag?.();
                }}
                onDragEnd={() => onDragStart?.("")}
              >
                <button
                  type="button"
                  onClick={() => onSelectItem?.(item.rawId)}
                  className="block w-full cursor-pointer text-left"
                >
                  <Card
                    className={[
                      "rounded-3xl bg-white transition",
                      selectedItemId === item.rawId ? "ring-2 ring-slate-900" : "hover:border-slate-300",
                      item.isDraggable ? "cursor-grab active:cursor-grabbing" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {item.project}
                        </p>
                        <h4 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h4>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          {item.taskType} | {item.storyPoints} pts
                        </p>
                      </div>
                      <StatusBadge status={item.priority} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                      <span>{item.id}</span>
                      <span>{item.assignee}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-1">{item.priority}</span>
                      {item.dueDate ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1">Due {item.dueDate}</span>
                      ) : null}
                    </div>
                  </Card>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;
