import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportData {
  filename: string;
  data: Record<string, string | number>[];
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

export function formatDataForExport<T extends object>(data: T[], fieldLabels: Record<string, string>): Record<string, string | number>[] {
  return data.map(item => {
    const formatted: Record<string, string | number> = {};
    const itemRecord = item as Record<string, unknown>;
    Object.keys(fieldLabels).forEach(key => {
      formatted[fieldLabels[key]] = (itemRecord[key] ?? '—') as string | number;
    });
    return formatted;
  });
}
