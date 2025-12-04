import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Table } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableBuilderProps {
  onTableChange: (tableData: TableData | null) => void;
}

export type TableBorderStyle = "none" | "all" | "horizontal" | "vertical" | "outer" | "header-only";

export interface TableData {
  headers: string[];
  rows: string[][];
  borderStyle: TableBorderStyle;
}

const borderStyleOptions: { value: TableBorderStyle; label: string }[] = [
  { value: "all", label: "All Borders" },
  { value: "outer", label: "Outer Border Only" },
  { value: "horizontal", label: "Horizontal Lines" },
  { value: "vertical", label: "Vertical Lines" },
  { value: "header-only", label: "Header Border Only" },
  { value: "none", label: "No Borders" },
];

export const TableBuilder = ({ onTableChange }: TableBuilderProps) => {
  const [includeTable, setIncludeTable] = useState(false);
  const [numRows, setNumRows] = useState(2);
  const [numCols, setNumCols] = useState(3);
  const [borderStyle, setBorderStyle] = useState<TableBorderStyle>("all");
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
      onTableChange({ headers, rows, borderStyle });
    }
  };

  const handleBorderStyleChange = (value: TableBorderStyle) => {
    setBorderStyle(value);
    onTableChange({ headers, rows, borderStyle: value });
  };

  const updateHeaders = (newHeaders: string[]) => {
    setHeaders(newHeaders);
    onTableChange({ headers: newHeaders, rows, borderStyle });
  };

  const updateRows = (newRows: string[][]) => {
    setRows(newRows);
    onTableChange({ headers, rows: newRows, borderStyle });
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
    onTableChange({ headers: newHeaders, rows: newRows, borderStyle });
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
    onTableChange({ headers, rows: newRows, borderStyle });
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

  // Helper functions for border styling
  const getTableStyles = (): React.CSSProperties => {
    switch (borderStyle) {
      case "all":
        return { borderCollapse: "collapse", border: "1px solid #d1d5db" };
      case "outer":
        return { borderCollapse: "collapse", border: "2px solid #d1d5db" };
      case "horizontal":
        return { borderCollapse: "collapse" };
      case "vertical":
        return { borderCollapse: "collapse" };
      case "header-only":
        return { borderCollapse: "collapse" };
      case "none":
        return { borderCollapse: "collapse" };
      default:
        return { borderCollapse: "collapse" };
    }
  };

  const getHeaderCellStyles = (): React.CSSProperties => {
    switch (borderStyle) {
      case "all":
        return { border: "1px solid #d1d5db", padding: "4px" };
      case "outer":
        return { padding: "4px" };
      case "horizontal":
        return { borderBottom: "2px solid #d1d5db", padding: "4px" };
      case "vertical":
        return { borderLeft: "1px solid #d1d5db", borderRight: "1px solid #d1d5db", padding: "4px" };
      case "header-only":
        return { borderBottom: "2px solid #d1d5db", padding: "4px" };
      case "none":
        return { padding: "4px" };
      default:
        return { padding: "4px" };
    }
  };

  const getCellStyles = (rowIndex: number): React.CSSProperties => {
    switch (borderStyle) {
      case "all":
        return { border: "1px solid #d1d5db", padding: "4px" };
      case "outer":
        return { padding: "4px" };
      case "horizontal":
        return { borderBottom: "1px solid #d1d5db", padding: "4px" };
      case "vertical":
        return { borderLeft: "1px solid #d1d5db", borderRight: "1px solid #d1d5db", padding: "4px" };
      case "header-only":
        return { padding: "4px" };
      case "none":
        return { padding: "4px" };
      default:
        return { padding: "4px" };
    }
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
          <div className="flex flex-wrap gap-4 items-end">
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

            <div className="flex flex-col gap-1">
              <Label className="text-sm">Border Style:</Label>
              <Select value={borderStyle} onValueChange={handleBorderStyleChange}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue placeholder="Select border" />
                </SelectTrigger>
                <SelectContent>
                  {borderStyleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={getTableStyles()}>
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} style={getHeaderCellStyles()}>
                      <Input
                        value={header}
                        onChange={(e) => handleHeaderChange(index, e.target.value)}
                        className="h-9 text-center font-semibold bg-muted border-0"
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
                      <td key={colIndex} style={getCellStyles(rowIndex)}>
                        <Input
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className="h-9 border-0"
                          placeholder={`Row ${rowIndex + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Border Style Preview */}
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className="overflow-x-auto">
              <table className="w-full" style={getTableStyles()}>
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} style={{ ...getHeaderCellStyles(), padding: "8px 12px", fontSize: "14px", fontWeight: 600 }} className="bg-muted">
                        {header || `Header ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 2).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} style={{ ...getCellStyles(rowIndex), padding: "8px 12px", fontSize: "14px" }}>
                          {cell || `Cell ${rowIndex + 1}-${colIndex + 1}`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This table will be included in your generated letter
          </p>
        </Card>
      )}
    </div>
  );
};
