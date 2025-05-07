import React from 'react';

interface DataTableProps {
  title?: string;
  columns: string[];
  data: any[][];
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  loading?: boolean;
  emptyText?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  striped = true,
  hoverable = true,
  compact = false,
  className = '',
  loading = false,
  emptyText = '데이터가 없습니다',
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border dark:border-gray-700 overflow-hidden">
      {title && (
        <div className="card-header p-5 pb-4 flex justify-between items-center bg-card border-b border-border">
          <h3 className="text-base font-medium text-card-foreground">
            {title}
          </h3>
        </div>
      )}
      <div className="bg-card">
        {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-muted dark:bg-gray-800/60">
                  {columns.map((column, index) => (
                    <th 
                      key={index} 
                      className={`py-3 px-3 font-medium ${
                        index === 0 || column.length > 10 ? 'text-start' : 'text-center'
                      } ${index === 0 ? 'min-w-[125px]' : ''}`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border hover:bg-muted/40">
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className={`py-3 px-3 ${
                          cellIndex === 0 || String(cell).length > 10 
                            ? 'text-start' 
                            : 'text-center'
                        } ${
                          cellIndex === 0 
                            ? 'font-medium text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* 모바일용 카드 레이아웃 (md 미만 화면에서만 표시) */}
        <div className="block md:hidden">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.map((row, rowIndex) => (
                <div key={rowIndex} className="p-4 hover:bg-muted/40">
                  {row.map((cell, cellIndex) => (
                    <div key={cellIndex} className="mb-2 last:mb-0">
                      <div className="text-xs text-muted-foreground">{columns[cellIndex]}</div>
                      <div className={`mt-1 ${
                        cellIndex === 0 
                          ? 'font-medium text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-400'
                      }`}>
                        {cell}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};