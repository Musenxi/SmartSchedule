'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFUploaderProps {
    onUploadComplete: (data: any) => void;
}

export function PDFUploader({ onUploadComplete }: PDFUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('请上传 PDF 文件');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload/pdf', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('上传失败');
            }

            const data = await res.json();
            onUploadComplete(data);
        } catch (err) {
            setError('文件解析失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[200px]",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    file ? "bg-muted/30" : ""
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {file ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
                            <FileText className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-foreground mb-1">{file.name}</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="font-medium text-foreground mb-1">
                            点击或拖拽上传 PDF
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            支持自动识别课程信息
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="w-full mt-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        正在智能解析...
                    </>
                ) : (
                    '开始识别'
                )}
            </button>
        </div>
    );
}
