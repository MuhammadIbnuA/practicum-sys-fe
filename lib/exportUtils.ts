import * as XLSX from 'xlsx';

export interface GradeExportData {
  name: string;
  nim: string;
  theory_class: string;
  practicum_class: string;
  grades: Record<string, number | null>;
  average: number;
}

export interface SessionInfo {
  id: number;
  session_number: number;
  topic?: string;
  type: string;
}

export function exportGradesToExcel(
  data: GradeExportData[],
  sessions: SessionInfo[],
  className: string,
  courseName: string
) {
  // Prepare data for Excel
  const excelData = data.map(student => {
    const row: any = {
      'Nama': student.name,
      'NIM': student.nim,
      'Kelas Teori': student.theory_class || '-',
      'Kelas Praktikum': student.practicum_class,
    };
    
    // Add grade columns
    sessions.forEach(session => {
      const columnName = `P${session.session_number}`;
      const grade = student.grades[session.id];
      row[columnName] = grade !== null && grade !== undefined ? grade : '-';
    });
    
    // Add average
    row['Rata-rata'] = student.average > 0 ? student.average.toFixed(1) : '-';
    
    return row;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const colWidths = [
    { wch: 25 }, // Nama
    { wch: 15 }, // NIM
    { wch: 12 }, // Kelas Teori
    { wch: 15 }, // Kelas Praktikum
  ];
  sessions.forEach(() => colWidths.push({ wch: 8 })); // Grade columns
  colWidths.push({ wch: 12 }); // Rata-rata
  ws['!cols'] = colWidths;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Nilai_${courseName}_${className}_${timestamp}.xlsx`;
  
  // Download
  XLSX.writeFile(wb, filename);
}
