'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { X, Upload, FileText, Clipboard, Loader2, Check, AlertCircle, Download } from 'lucide-react';
import { ExamParser, ParsedTask } from '@/lib/parsers/ExamParser';
import { Task } from '@/types/task';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isSameMinute } from 'date-fns';
// import { BrowserGrabber } from '@/components/upload/BrowserGrabber'; // Unused
import { read, utils, writeFile } from 'xlsx';

interface TaskImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
    existingTasks?: Task[];
}

export function TaskImportModal({ isOpen, onClose, onImported, existingTasks = [] }: TaskImportModalProps) {
    const [activeTab, setActiveTab] = useState<'text' | 'file' | 'ai'>('file');
    const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Duplicate check state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [duplicateTasks, setDuplicateTasks] = useState<ParsedTask[]>([]);

    // Constants
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Drag and Drop State
    const [isDragging, setIsDragging] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('file');
            setParsedTasks([]);
            setLoading(false);
            setError(null);
            setTextInput('');
            setSuccessMessage(null);
            setConfirmDialogOpen(false);
            setDuplicateTasks([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen]);

    // Helpers to handle parsing
    const handleTextParse = () => {
        setError(null);
        if (!textInput.trim()) return;

        let tasks: ParsedTask[] = [];

        // Try HTML first (simple heuristic: contains tags)
        if (textInput.includes('<html') || textInput.includes('<table') || textInput.includes('id="tabGrid"')) {
            try {
                tasks = ExamParser.parseHtml(textInput);
            } catch (e) {
                console.error('HTML parse failed', e);
            }
        }

        // If HTML returned nothing or failed, try TXT
        if (tasks.length === 0) {
            tasks = ExamParser.parseTxt(textInput);
        }

        if (tasks.length === 0) {
            setError('未能识别出有效的考试信息，请检查格式');
        } else {
            setParsedTasks(tasks);
        }
    };

    const processFile = async (file: File) => {
        setError(null);

        if (file.size > MAX_FILE_SIZE) {
            setError('文件大小不能超过 10MB');
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            let tasks: ParsedTask[] = [];

            if (file.name.endsWith('.xlsx')) {
                tasks = ExamParser.parseExcel(buffer);
            } else if (file.name.endsWith('.txt')) {
                const text = new TextDecoder().decode(buffer);
                tasks = ExamParser.parseTxt(text);
            } else if (file.name.endsWith('.csv')) {
                const text = new TextDecoder().decode(buffer);
                tasks = ExamParser.parseCsv(text);
            } else {
                setError('不支持的文件格式，请上传 .xlsx, .csv 或 .txt');
                return;
            }

            if (tasks.length === 0) {
                setError('文件解析为空，请检查文件内容是否符合格式');
            } else {
                setParsedTasks(tasks);
            }
        } catch (err: any) {
            console.error('File parse error', err);
            setError('文件解析失败: ' + err.message);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    // AI Handlers
    const [file, setFile] = useState<File | null>(null);

    const handleAiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > MAX_FILE_SIZE) {
                setError('文件大小不能超过 10MB');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setFile(selected);
        }
    };

    const handleAiUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'exam'); // Specify exam type

            const res = await fetch('/api/ai/recognize', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'AI 识别失败');
            }

            const data = await res.json();
            if (data.courses && Array.isArray(data.courses)) {
                // Map AI response to ParsedTask
                const mappedTasks: ParsedTask[] = data.courses.map((c: any) => ({
                    title: c.title || c.name, // Support both fields
                    description: c.description || '',
                    startTime: new Date(`${c.date}T${c.startTime}:00`).toISOString(),
                    endTime: new Date(`${c.date}T${c.endTime}:00`).toISOString(),
                    location: c.seatNumber ? `${c.location} 座号:${String(c.seatNumber).replace(/[()（）]/g, '')}` : c.location,
                    type: 'EXAM'
                }));
                setParsedTasks(mappedTasks);
            } else {
                setError('AI 未能识别到有效的考试信息');
            }
        } catch (err: any) {
            console.error('AI Recognition error:', err);
            setError(err.message || '识别过程中发生错误');
        } finally {
            setLoading(false);
            setFile(null); // Clear file after processing attempt
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'file' | 'ai') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;

        if (droppedFile.size > MAX_FILE_SIZE) {
            setError('文件大小不能超过 10MB');
            return;
        }

        if (type === 'file') {
            // Validate file type
            if (!droppedFile.name.endsWith('.xlsx') && !droppedFile.name.endsWith('.txt') && !droppedFile.name.endsWith('.csv')) {
                setError('不支持的文件格式，请上传 .xlsx, .csv 或 .txt');
                return;
            }
            processFile(droppedFile);
        } else if (type === 'ai') {
            // Validate file type for AI
            if (!['image/jpeg', 'image/png', 'application/pdf'].includes(droppedFile.type)) {
                setError('不支持的文件格式，请上传 JPG, PNG 或 PDF');
                return;
            }
            setFile(droppedFile);
            setError(null);
        }
    };

    const processImport = async (tasksToImport: ParsedTask[]) => {
        setLoading(true);
        try {
            const res = await fetch('/api/tasks/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: tasksToImport }),
            });

            if (!res.ok) throw new Error('Import failed');

            const data = await res.json();
            setSuccessMessage(`成功导入 ${data.count} 个考试任务`);
            setTimeout(() => {
                onImported();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError('导入失败: ' + err.message);
        } finally {
            setLoading(false);
            setConfirmDialogOpen(false);
        }
    };

    const handleBatchImport = async () => {
        if (parsedTasks.length === 0) return;

        // Check for duplicates
        if (existingTasks && existingTasks.length > 0) {
            const duplicates = parsedTasks.filter(pTask => {
                return existingTasks.some(existing => {
                    // Check if title is same OR start time is same minute (User Request)
                    const isExam = existing.type === 'EXAM';
                    const sameTitle = existing.title === pTask.title;
                    const sameTime = existing.startTime && isSameMinute(new Date(existing.startTime), new Date(pTask.startTime));

                    return isExam && (sameTitle || sameTime);
                });
            });

            if (duplicates.length > 0) {
                setDuplicateTasks(duplicates);
                setConfirmDialogOpen(true);
                return;
            }
        }

        await processImport(parsedTasks);
    };

    const removeTask = (index: number) => {
        setParsedTasks(prev => prev.filter((_, i) => i !== index));
    };

    if (successMessage) {
        return (
            <Modal isOpen={isOpen} onClose={() => { }} zIndex={60} className="w-full max-w-sm bg-card p-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="rounded-full bg-green-100 p-3 mb-4 dark:bg-green-900/30">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">导入成功</h3>
                <p className="text-muted-foreground text-center">{successMessage}</p>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} zIndex={60} className="w-full max-w-4xl bg-card p-0 flex flex-col h-[80vh]">
            <ConfirmDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                title="发现重复任务"
                description={`检测到 ${duplicateTasks.length} 个任务与现有任务重复或冲突（标题相同 或 时间相同）。\n\n示例：${duplicateTasks[0]?.title} (${new Date(duplicateTasks[0]?.startTime).toLocaleString()})\n\n是否继续导入？这将创建可能的重复任务。`}
                confirmText="继续导入"
                cancelText="取消"
                onConfirm={() => processImport(parsedTasks)}
            />
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    批量导入考试任务
                </h3>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-muted rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {parsedTasks.length > 0 ? (
                    // Preview Mode
                    <div className="flex-1 flex flex-col p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">识别结果确认 ({parsedTasks.length})</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setParsedTasks([])}
                                    className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                                >
                                    重新导入
                                </button>
                                <button
                                    onClick={handleBatchImport}
                                    disabled={loading}
                                    className="px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:opacity-90 rounded-lg flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    确认导入
                                </button>
                            </div>
                        </div>
                        <div className="border border-border rounded-lg overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">课程名称</th>
                                        <th className="px-4 py-3 font-medium">时间</th>
                                        <th className="px-4 py-3 font-medium">地点</th>
                                        <th className="px-4 py-3 font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {parsedTasks.map((task, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{task.title}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(task.startTime).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{task.location}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => removeTask(idx)} className="text-destructive hover:underline">删除</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Input Mode
                    <div className="flex-1 flex flex-col">
                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setActiveTab('file')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'file' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    文件导入
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clipboard className="w-4 h-4" />
                                    文本/HTML
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('ai')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    AI 识别
                                </div>
                            </button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            {activeTab === 'file' && (
                                <div className="h-full flex flex-col">
                                    <div
                                        className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 p-8 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'file')}
                                    >
                                        <FileText className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <h3 className="text-lg font-medium mb-2">
                                            {isDragging ? '松开鼠标以上传' : '拖拽文件到此处，或点击上传'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                                            支持格式：.xlsx, .txt, .csv | 最大文件大小：10MB<br />
                                            <span className="text-xs opacity-70">推荐使用教务系统导出的 XLSX 格式</span>
                                        </p>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".xlsx,.txt,.csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 pointer-events-auto"
                                        >
                                            选择文件
                                        </button>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-between gap-4 shrink-0 transition-all hover:bg-blue-100/50 dark:hover:bg-blue-900/30">
                                        <div className="flex gap-3 items-start">
                                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                            <div className="text-sm space-y-1">
                                                <p className="font-semibold">需要帮助？</p>
                                                <p className="opacity-90 text-xs">如果教务系统导出的文件无法自动识别，您可以下载标准模版，按格式填写后上传。</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const headers = ["课程名称", "考试日期", "考试地点", "座号", "考试名称"];
                                                const data = ["高等数学", "2026-06-20(09:00-11:00)", "一教101", "15", "期末考试"];
                                                const ws = utils.aoa_to_sheet([headers, data]);
                                                const wb = utils.book_new();
                                                utils.book_append_sheet(wb, ws, "考试任务模版");
                                                writeFile(wb, "exam_template.xlsx");
                                            }}
                                            className="px-4 py-2.5 bg-white dark:bg-blue-950/50 hover:bg-blue-50 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Download className="w-4 h-4" />
                                            下载模版 (.xlsx)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'text' && (
                                <div className="h-full flex flex-col gap-4">
                                    <textarea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="在此处粘贴 HTML 源码或文本内容..."
                                        className="flex-1 w-full bg-background border border-input rounded-lg p-4 font-mono text-xs resize-none focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleTextParse}
                                            disabled={!textInput.trim()}
                                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                                        >
                                            识别内容
                                        </button>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>您可以直接粘贴教务系统【考试信息查询】页面的完整 HTML 源码，或者复制导出的 TXT 内容。</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="h-full flex flex-col p-6 overflow-y-auto">
                                    <div
                                        className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 p-8 space-y-4 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'ai')}
                                    >

                                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            {file ? <FileText className="w-6 h-6 text-primary" /> : <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />}
                                        </div>

                                        <h3 className="text-lg font-medium mb-2">
                                            {file ? file.name : (isDragging ? '松开以上传图片/PDF' : '拖拽图片/PDF到此处，或点击上传')}
                                        </h3>

                                        {!file && (
                                            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                                                支持格式：.jpg, .png, .pdf | 最大文件大小：10MB<br />
                                                <span className="text-xs opacity-70">AI 将自动识别课程名称、时间和地点</span>
                                            </p>
                                        )}

                                        {file && !loading && (
                                            <div className="flex flex-col items-center gap-2">
                                                <button
                                                    onClick={handleAiUpload}
                                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
                                                >
                                                    <Loader2 className="w-4 h-4 animate-spin hidden" />
                                                    开始识别
                                                </button>
                                                <button
                                                    onClick={() => setFile(null)}
                                                    className="text-xs text-destructive hover:underline mt-2"
                                                >
                                                    移除文件
                                                </button>
                                            </div>
                                        )}

                                        {loading && (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                <span className="text-sm">AI 正在分析考试安排...</span>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={handleAiFileSelect}
                                            className="hidden"
                                            disabled={loading}
                                        />

                                        {!file && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                                            >
                                                选择文件
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>提示：AI 识别可能存在误差，请务必在识别后仔细核对考试时间、地点等信息。</p>
                                    </div>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
