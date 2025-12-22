import { ReactNode } from "react";

type Props = {
  columns: string[];
  rows: (string | number | null | ReactNode)[][];
  actions?: string[];
  onAction?: (action: string, rowIndex: number) => void;
  dense?: boolean;
};

export function DataTable({ columns, rows, actions, onAction, dense }: Props) {
  const rowClass = dense ? "border-b border-[#1E1E20]" : "border-t border-[#2A2A2E]";
  const cellPadding = dense ? "px-4 py-3" : "px-4 py-2";

  return (
    <div className="overflow-hidden rounded-xl border border-[#1F1F22] bg-[#0F0F10]">
      <table className="min-w-full text-sm text-[#C5C5C5]">
        <thead className="bg-[#0B0B0D] text-xs uppercase tracking-wide text-white">
          <tr>
            {columns.map((col) => (
              <th key={col} className={`${cellPadding} text-left`}>
                {col}
              </th>
            ))}
            {actions && <th className={`${cellPadding} text-left`}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={rowClass}>
              {row.map((cell, cidx) => (
                <td key={cidx} className={cellPadding}>
                  {cell ?? "—"}
                </td>
              ))}
              {actions && (
                <td className={cellPadding}>
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <button
                        key={action}
                        className="rounded border border-[#2A2A2E] px-2 py-1 text-xs text-white hover:border-[#E10600]"
                        onClick={() => onAction?.(action, idx)}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
