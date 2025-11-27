import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Table, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface TableBuilderProps {
  onTableChange: (tableData: TableData | null) => void;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export const TableBuilder = ({ onTableChange }: TableBuilderProps) => {
  const [includeTable, setIncludeTable] = useState(false);
  const [numRows, setNumRows] = useState(2);
  const [numCols, setNumCols] = useState(3);
  const [headers, setHeaders] = useState<string[]>(["Column 1", "Column 2", "Column 3"]);
  const [rows, setRows] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
  ]);

  const handleToggleTable = (checked: boolean) => {
    setIncludeTable(checked);
    if (!checked) {
      onTableChange(null);
    } else {
      onTableChange({ headers, rows });
    }
  };

  const updateHeaders = (newHeaders: string[]) => {
    setHeaders(newHeaders);
    onTableChange({ headers: newHeaders, rows });
  };

  const updateRows = (newRows: string[][]) => {
    setRows(newRows);
    onTableChange({ headers, rows: newRows });
  };

  const handleColChange = (newCols: number) => {
    if (newCols < 1 || newCols > 10) return;
    
    const diff = newCols - numCols;
    let newHeaders = [...headers];
    let newRows = rows.map(row => [...row]);

    if (diff > 0) {
      // Add columns
      for (let i = 0; i < diff; i++) {
        newHeaders.push(`Column ${numCols + i + 1}`);
        newRows = newRows.map(row => [...row, ""]);
      }
    } else {
      // Remove columns
      newHeaders = newHeaders.slice(0, newCols);
      newRows = newRows.map(row => row.slice(0, newCols));
    }

    setNumCols(newCols);
    setHeaders(newHeaders);
    setRows(newRows);
    onTableChange({ headers: newHeaders, rows: newRows });
  };

  const handleRowChange = (newRowCount: number) => {
    if (newRowCount < 1 || newRowCount > 20) return;
    
    const diff = newRowCount - numRows;
    let newRows = [...rows];

    if (diff > 0) {
      // Add rows
      for (let i = 0; i < diff; i++) {
        newRows.push(Array(numCols).fill(""));
      }
    } else {
      // Remove rows
      newRows = newRows.slice(0, newRowCount);
    }

    setNumRows(newRowCount);
    setRows(newRows);
    onTableChange({ headers, rows: newRows });
  };

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    updateHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = rows.map((row, rIdx) => 
      rIdx === rowIndex 
        ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
        : [...row]
    );
    updateRows(newRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-primary" />
          <Label htmlFor="include-table" className="text-base font-semibold">
            Include Table in Letter
          </Label>
        </div>
        <Switch
          id="include-table"
          checked={includeTable}
          onCheckedChange={handleToggleTable}
        />
      </div>

      {includeTable && (
        <Card className="p-4 space-y-4 border-dashed">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Columns:</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleColChange(numCols - 1)}
                  disabled={numCols <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{numCols}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleColChange(numCols + 1)}
                  disabled={numCols >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">Rows:</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRowChange(numRows - 1)}
                  disabled={numRows <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{numRows}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRowChange(numRows + 1)}
                  disabled={numRows >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} className="p-1">
                      <Input
                        value={header}
                        onChange={(e) => handleHeaderChange(index, e.target.value)}
                        className="h-9 text-center font-semibold bg-muted"
                        placeholder={`Header ${index + 1}`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="p-1">
                        <Input
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className="h-9"
                          placeholder={`Row ${rowIndex + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground">
            This table will be included in your generated letter
          </p>
        </Card>
      )}
    </div>
  );
};
