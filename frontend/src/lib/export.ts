import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportData {
  filename: string;
  data: Record<string, string | number>[];
}

export function exportToCSV({ filename, data }: ExportData) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header as keyof typeof row];
        const stringValue = value === null || value === undefined ? '' : String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

export function exportToExcel({ filename, data }: ExportData) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

export function formatDataForExport(data: Record<string, unknown>[], fieldLabels: Record<string, string>): Record<string, string | number>[] {
  return data.map(item => {
    const formatted: Record<string, string | number> = {};
    Object.keys(fieldLabels).forEach(key => {
      formatted[fieldLabels[key]] = (item[key] ?? '—') as string | number;
    });
    return formatted;
  });
}
