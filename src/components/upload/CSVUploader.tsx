'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, Loader2, Download, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseCSV } from '@/lib/import/csv-parser';

interface CSVUploaderProps {
    onUploadComplete: (data: any) => void;
}

export function CSVUploader({ onUploadComplete }: CSVUploaderProps) {
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
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv')) {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('请上传 CSV 文件');
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

        try {
            const text = await file.text();
            const courses = parseCSV(text);

            if (courses.length === 0) {
                throw new Error('未能从 CSV 中解析出课程，请检查格式是否正确');
            }

            // Simulate parsing time
            await new Promise(resolve => setTimeout(resolve, 800));

            onUploadComplete({ courses });
        } catch (err) {
            setError(err instanceof Error ? err.message : '文件解析失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = '课程名称,教师,地点,星期,开始节次,结束节次,周次,日期\n';
        const examples = [
            '高等数学,张老师,教学楼 A101,1,1,2,1-8/10-16,',
            '大学英语,李老师,外语楼 201,2,3,4,1/3/5/7-11,',
            '数据结构,王老师,实验楼 302,3,5,6,1/3/5/7,',
            '操作系统,赵老师,计算机楼401,4,7,8,2-16单,',
            '补课-高数,张老师,教学楼A101,6,1,2,,2025/03/15-2025/03/22',
        ].join('\n');
        const blob = new Blob(['\ufeff' + headers + examples], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '课程导入模版.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3 text-green-900 dark:text-green-400 text-sm mb-4">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <div className="space-y-1">
                    <p className="font-medium">导入说明</p>
                    <ul className="text-xs space-y-0.5 list-disc list-inside opacity-90">
                        <li>周次支持斜杠分隔，如：1/3/5、1-8/10-16</li>
                        <li>单独以日期导入（可选）格式为 YYYY/MM/DD，多日期用 - 分隔</li>
                        <li>如：2025/03/15 - 2025/03/22</li>
                    </ul>
                </div>
            </div>

            <div className="mb-6 flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="text-sm">
                        <div className="font-medium text-foreground">课程导入模版.csv</div>
                        <div className="text-muted-foreground">支持单双周，如 1-16单、2-16双</div>
                    </div>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    下载
                </button>
            </div>

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
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {file ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3 text-green-600">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-foreground mb-1">{file.name}</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            {(file.size / 1024).toFixed(1)} KB
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
                            点击或拖拽上传 CSV
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            支持批量导入多门课程
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
                        正在解析数据...
                    </>
                ) : (
                    '开始导入'
                )}
            </button>
        </div>
    );
}
