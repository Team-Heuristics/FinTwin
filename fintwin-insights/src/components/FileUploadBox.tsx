import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';

interface FileUploadBoxProps {
  onFileSelect: (file: File) => void;
  uploading?: boolean;
  success?: boolean;
}

const FileUploadBox = ({ onFileSelect, uploading, success }: FileUploadBoxProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
        dragOver ? 'border-primary bg-primary/5' : success ? 'border-success bg-success/5' : 'border-border hover:border-primary/40'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {success ? (
        <>
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <p className="text-sm font-medium text-success">Upload successful!</p>
        </>
      ) : selectedFile ? (
        <>
          <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
        </>
      ) : (
        <>
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground">Drop your CSV bank statement here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        </>
      )}
    </div>
  );
};

export default FileUploadBox;
