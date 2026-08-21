"use client";

import {
  columnSizingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

const FEATURES = tableFeatures({
  columnSizingFeature,
});

export type PlantTableFeatures = typeof FEATURES;
export type PlantColumnDef<T extends RowData> = ColumnDef<
  PlantTableFeatures,
  T,
  unknown
>;

export function DataTable<T extends RowData>({
  data,
  columns,
  getRowId,
  getRowClassName,
  minWidth = 880,
  empty,
  dense = false,
  /** Don’t stretch a sparse table across the full card width. */
  fit = false,
}: {
  data: T[];
  columns: PlantColumnDef<T>[];
  getRowId?: (row: T, index: number) => string;
  /** Extra row classes (e.g. risk / inactive tint). */
  getRowClassName?: (row: T) => string | undefined;
  minWidth?: number;
  empty?: string;
  /** Tighter padding for editable forms (labour, tooling, …). */
  dense?: boolean;
  fit?: boolean;
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

  const headPad = dense ? "px-2.5 py-2" : "px-3 py-3";
  const cellPad = dense ? "px-2.5 py-2" : "px-3 py-3";
  const colCount = columns.length;

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-outline-variant ${
        fit ? "max-w-2xl" : ""
      }`}
    >
      <table
        className={`text-left ${fit ? "w-auto min-w-0" : "w-full table-fixed"}`}
        style={fit ? undefined : { minWidth }}
      >
        {!fit ? (
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
        ) : null}
        <thead className="bg-surface-low text-body-sm text-on-surface-variant">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className={`truncate font-medium ${headPad}`}
                  style={fit ? undefined : { width: header.getSize() }}
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
                colSpan={colCount}
                className="px-3 py-8 text-center text-body-sm text-on-surface-variant"
              >
                {empty ?? "Nothing to show."}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-t border-outline-variant/70 hover:bg-surface-low/40 ${
                  getRowClassName?.(row.original) ?? ""
                }`}
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`overflow-hidden align-middle ${cellPad}`}
                    style={fit ? undefined : { width: cell.column.getSize() }}
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

/** Compact text/number cell for editable grids. */
export function TableCellInput({
  type = "text",
  value,
  onChange,
  step,
  placeholder,
  className = "",
  "aria-label": ariaLabel,
}: {
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
  step?: number;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 w-full min-w-0 rounded-sm border border-outline-variant bg-surface px-2 text-body-sm text-on-surface focus:border-primary ${
        type === "number" ? "font-mono tabular-nums" : ""
      } ${className}`}
    />
  );
}
