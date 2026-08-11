"use client";

import {
  columnSizingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";

const FEATURES = tableFeatures({
  columnSizingFeature,
});

export type PlantTableFeatures = typeof FEATURES;
export type PlantColumnDef<T extends Record<string, any>> = ColumnDef<
  PlantTableFeatures,
  T,
  unknown
>;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  getRowId,
  minWidth = 880,
  empty,
}: {
  data: T[];
  columns: PlantColumnDef<T>[];
  getRowId?: (row: T, index: number) => string;
  minWidth?: number;
  empty?: string;
}) {
  const table = useTable({
    features: FEATURES,
    data,
    columns,
    getRowId,
    defaultColumn: {
      minSize: 80,
      size: 140,
      maxSize: 400,
    },
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant">
      <table className="w-full table-fixed text-left" style={{ minWidth }}>
        <colgroup>
          {table.getAllLeafColumns().map((col) => (
            <col
              key={col.id}
              style={{
                width: col.getSize(),
                minWidth: col.columnDef.minSize ?? col.getSize(),
              }}
            />
          ))}
        </colgroup>
        <thead className="bg-surface-low text-body-sm text-on-surface-variant">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className="truncate px-3 py-3 font-medium"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-body-sm text-on-surface-variant"
              >
                {empty ?? "Nothing to show."}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-outline-variant/70">
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="overflow-hidden px-3 py-3 align-middle"
                    style={{ width: cell.column.getSize() }}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
