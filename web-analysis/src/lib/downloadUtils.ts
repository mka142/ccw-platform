import { ProcessedRecord } from './types';

/**
 * Downloads processed data as JSON file
 * @param data - Array of processed records to download
 * @param filename - Name of the file (without extension)
 */
export function downloadProcessedData(data: ProcessedRecord[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to download');
    return;
  }

  // Convert data to JSON
  const jsonContent = JSON.stringify(data, null, 2);
  
  // Create blob and download
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Add date to filename
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `${filename}-${dateStr}.json`;
  
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads processed data as CSV file
 * @param data - Array of processed records to download
 * @param filename - Name of the file (without extension)
 */
export function downloadProcessedDataAsCSV(data: ProcessedRecord[], filename: string) {
  if (data.length === 0) {
    console.warn('No data to download');
    return;
  }

  // Convert data to CSV format
  // Header: timestamp, record_id, value, label
  let csvContent = 'timestamp,record_id,value,label\n';
  
  data.forEach(record => {
    const label = record.label || record.id;
    record.data.forEach(point => {
      csvContent += `${point.timestamp},${record.id},${point.value},"${label}"\n`;
    });
  });
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Add date to filename
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `${filename}-${dateStr}.csv`;
  
  a.click();
  URL.revokeObjectURL(url);
}
