import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import FileUploadBox from '@/components/FileUploadBox';
import { transactionService } from '@/services/api';
import { toast } from 'sonner';

const splitCsvLine = (line: string): string[] =>
  line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.trim().replace(/^"|"$/g, ''));

const normalizeCsvForUpload = async (inputFile: File): Promise<File> => {
  const raw = await inputFile.text();
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return inputFile;
  }

  const firstHeader = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const alreadyCanonical =
    firstHeader.includes('date') && firstHeader.includes('description') && firstHeader.includes('amount');

  if (alreadyCanonical && firstHeader.length <= 4) {
    return inputFile;
  }

  const headerRowIndex = lines.findIndex((line) => {
    const cols = splitCsvLine(line).map((c) => c.toLowerCase());
    return cols.includes('date') && cols.includes('description') && cols.includes('amount');
  });

  if (headerRowIndex < 0) {
    return inputFile;
  }

  const headerCols = splitCsvLine(lines[headerRowIndex]).map((c) => c.toLowerCase());
  const dateIdx = headerCols.indexOf('date');
  const descIdx = headerCols.indexOf('description');
  const amountIdx = headerCols.indexOf('amount');

  if (dateIdx < 0 || descIdx < 0 || amountIdx < 0) {
    return inputFile;
  }

  const normalizedRows = ['date,description,amount'];

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= Math.max(dateIdx, descIdx, amountIdx)) {
      continue;
    }

    const date = cols[dateIdx]?.trim();
    const description = cols[descIdx]?.trim();
    const amount = cols[amountIdx]?.trim();

    if (!date || !description || !amount) {
      continue;
    }

    const escapedDescription = description.replace(/"/g, '""');
    normalizedRows.push(`${date},"${escapedDescription}",${amount}`);
  }

  if (normalizedRows.length === 1) {
    return inputFile;
  }

  return new File([normalizedRows.join('\n')], inputFile.name, {
    type: 'text/csv',
    lastModified: Date.now(),
  });
};

const UploadTransactions = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setSuccess(false);
    setUploadMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(0, 6).map(r => r.split(','));
      setPreview(rows);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const normalizedFile = await normalizeCsvForUpload(file);
      const response = await transactionService.upload(normalizedFile);
      const result = response.data.data;

      setUploading(false);
      setSuccess(true);
      setUploadMessage(
        `Processed ${result.parsedSuccessfully}/${result.totalRows} rows` +
        (result.failedRows ? ` (${result.failedRows} failed)` : '')
      );
      localStorage.setItem('fintwin_last_upload_success', String(Date.now()));

      if (normalizedFile !== file) {
        toast.success('CSV converted to supported format and uploaded successfully');
      }
      toast.success(response.data.message || 'Upload and analysis completed');
    } catch (error: any) {
      setUploading(false);
      localStorage.removeItem('fintwin_last_upload_success');
      const message = error?.response?.data?.message || 'Upload failed. Please login again and verify CSV format.';
      setUploadMessage(message);
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Upload Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your CSV bank statement to analyze spending</p>
        <p className="text-xs text-muted-foreground mt-1">Expected columns: date, description, amount</p>
      </div>

      <div className="max-w-2xl">
        <FileUploadBox onFileSelect={handleFileSelect} uploading={uploading} success={success} />

        {uploadMessage && (
          <p className={`mt-3 text-sm ${success ? 'text-success' : 'text-destructive'}`}>
            {uploadMessage}
          </p>
        )}

        {preview.length > 0 && !success && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
            <div className="bg-card rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={`${i === 0 ? 'bg-accent/50 font-medium' : ''} border-b border-border last:border-0`}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3 text-foreground whitespace-nowrap">{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleUpload} disabled={uploading} className="btn-primary mt-4">
              {uploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadTransactions;
