import React from 'react';

interface DataTableProps {
  title?: string;
  columns: string[];
  data: any[][];
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  striped = true,
  hoverable = true,
  compact = false,
  className = '',
}) => {
  const tableClasses = [
    'table',
    'align-middle',
    'table-row-dashed',
    'fs-6',
    'gy-4',
    striped ? 'table-striped' : '',
    hoverable ? 'table-hover' : '',
    compact ? 'table-compact' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="card">
      {title && (
        <div className="card-header border-0 pt-5">
          <h3 className="card-title align-items-start flex-column">
            <span className="card-label fw-bold fs-3 mb-1">{title}</span>
          </h3>
        </div>
      )}
      <div className="card-body py-3">
        <div className="table-responsive">
          <table className={tableClasses}>
            <thead>
              <tr className="fw-bold text-gray-600 bg-light">
                {columns.map((column, index) => (
                  <th key={index} className={`ps-4 min-w-125px rounded-start ${index === 0 || column.length > 10 ? 'text-start' : 'text-center'}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`ps-4 ${cellIndex === 0 || String(cell).length > 10 ? 'text-start' : 'text-center'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};