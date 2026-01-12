'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISmartUploaderProps {
    onUploadComplete: (data: any) => void;
}

type UploadTab = 'pdf' | 'image';

export function AISmartUploader({ onUploadComplete }: AISmartUploaderProps) {
    const [activeTab, setActiveTab] = useState<UploadTab>('pdf');
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Model selection state
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [loadingModels, setLoadingModels] = useState(false);

    // Fetch models on mount
    useEffect(() => {
        const fetchModels = async () => {
            setLoadingModels(true);
            try {
                // First get user config to see default model
                const configRes = await fetch('/api/ai/settings');
                let defaultModel = '';
                if (configRes.ok) {
                    const configData = await configRes.json();
                    defaultModel = configData.model || '';
                }

                // Then fetch models list using saved key
                const res = await fetch('/api/ai/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ useSavedKey: true }),
                });
                const data = await res.json();
                if (data.models && Array.isArray(data.models)) {
                    const fetchedModels = data.models.map((m: any) => ({
                        id: m.id,
                        name: m.name || m.id
                    }));
                    setModels(fetchedModels);

                    // Set default model from config or first available
                    if (defaultModel && fetchedModels.find((m: any) => m.id === defaultModel)) {
                        setSelectedModel(defaultModel);
                    } else if (fetchedModels.length > 0) {
                        // Prefer gemini-3-flash
                        const preferred = fetchedModels.find((m: any) => m.id.includes('gemini-3') && m.id.includes('flash'));
                        setSelectedModel(preferred?.id || fetchedModels[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch models:', error);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, []);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setError(null);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, [handleFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    }, [handleFileSelect]);

    const handleUpload = async () => {
        if (!file) {
            setError('请先选择文件');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (selectedModel) {
                formData.append('model', selectedModel);
            }

            const res = await fetch('/api/ai/recognize', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || '识别失败');
            }

            const data = await res.json();
            onUploadComplete(data);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'AI识别失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    const acceptedFormats = activeTab === 'pdf'
        ? '.pdf'
        : '.jpg,.jpeg,.png,.webp';

    const maxSize = activeTab === 'pdf' ? '10MB' : '5MB';

    return (
        <div className="space-y-6">
            {/* Model Selection */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground whitespace-nowrap">AI 模型：</label>
                <div className="relative flex-1">
                    <select
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm appearance-none pr-8"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={loadingModels || models.length === 0}
                    >
                        {loadingModels ? (
                            <option value="">加载模型列表中...</option>
                        ) : models.length === 0 ? (
                            <option value="">请先配置 API Key</option>
                        ) : (
                            models.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name}
                                </option>
                            ))
                        )}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => {
                        setActiveTab('pdf');
                        setFile(null);
                        setPreview(null);
                        setError(null);
                    }}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'pdf'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        PDF上传
                    </div>
                </button>
                <button
                    onClick={() => {
                        setActiveTab('image');
                        setFile(null);
                        setPreview(null);
                        setError(null);
                    }}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'image'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        图片上传
                    </div>
                </button>
            </div>

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all",
                    file
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50"
                )}
            >
                <input
                    type="file"
                    accept={acceptedFormats}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />

                <div className="text-center space-y-4">
                    {preview && activeTab === 'image' ? (
                        <div className="space-y-3">
                            <img
                                src={preview}
                                alt="Preview"
                                className="max-h-64 mx-auto rounded-lg border border-border shadow-sm"
                            />
                            <p className="text-sm text-muted-foreground">{file?.name}</p>
                        </div>
                    ) : file ? (
                        <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    拖拽{activeTab === 'pdf' ? 'PDF' : '图片'}文件到此处，或点击上传
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    支持格式：{acceptedFormats} | 最大文件大小：{maxSize}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                    !file || uploading
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
                )}
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI 识别中...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        开始 AI 识别
                    </>
                )}
            </button>

            {/* Info Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-6 text-blue-900 dark:text-blue-400 text-sm">
                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-medium">AI 智能识别提示</p>
                    <ul className="text-xs space-y-1 list-disc list-inside opacity-90">
                        <li>确保图片或PDF清晰可见，包含完整的课表信息</li>
                        <li>支持各类教务系统导出的课表格式</li>
                        <li>AI将自动提取课程名称、教师、地点、时间等信息</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
