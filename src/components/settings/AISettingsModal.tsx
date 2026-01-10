'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { X, Sparkles, Eye, EyeOff, ExternalLink, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

interface AIConfig {
    provider: string | null;
    enabled: boolean;
    apiKey: string | null;
    hasApiKey: boolean;
    model: string | null;
}

export function AISettingsModal({ isOpen, onClose, onSaved }: AISettingsModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [config, setConfig] = useState<AIConfig>({
        provider: 'gemini',
        enabled: false,
        apiKey: null,
        hasApiKey: false,
        model: null,
    });
    // Start with empty list - will be populated from API after key validation
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    const fetchModels = async (key?: string, useSavedKey?: boolean) => {
        if (!key && !useSavedKey) return;
        setLoadingModels(true);
        try {
            const res = await fetch('/api/ai/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: key || undefined,
                    useSavedKey: useSavedKey || false,
                }),
            });
            const data = await res.json();
            if (data.models && Array.isArray(data.models)) {
                // Use API response directly - trust the server
                const fetchedModels = data.models.map((m: any) => ({
                    id: m.id,
                    name: m.name || m.id
                }));
                setModels(fetchedModels);

                // Auto-select gemini-3-flash if available, otherwise first model
                if (!config.model && fetchedModels.length > 0) {
                    const preferred = fetchedModels.find((m: any) => m.id.includes('gemini-3') && m.id.includes('flash'));
                    setConfig(prev => ({ ...prev, model: preferred?.id || fetchedModels[0].id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setLoadingModels(false);
        }
    };

    useEffect(() => {
        if (apiKey && config.provider === 'gemini') {
            const timer = setTimeout(() => fetchModels(apiKey), 500);
            return () => clearTimeout(timer);
        }
    }, [apiKey, config.provider]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setApiKey(''); // Don't populate with masked key

                // Auto-fetch models if user has saved API key
                if (data.hasApiKey) {
                    fetchModels(undefined, true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch AI config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey && !config.hasApiKey) {
            alert('请输入 API Key');
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                provider: config.provider,
                enabled: config.enabled,
                model: config.model,
            };

            // Only send API key if user entered a new one
            if (apiKey) {
                payload.apiKey = apiKey;
            }

            const res = await fetch('/api/ai/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Save failed');

            if (onSaved) {
                onSaved();
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Failed to save AI config:', error);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        // Allow testing with either new key or saved key
        if (!apiKey && !config.hasApiKey) {
            alert('请先输入 API Key');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            console.log('[Frontend] Testing API key...');

            const res = await fetch('/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: apiKey.trim() || undefined, // Send new key if provided
                    useSavedKey: !apiKey && config.hasApiKey, // Flag to use saved key
                    provider: config.provider || 'gemini',
                    model: config.model,
                }),
            });

            const data = await res.json();
            console.log('[Frontend] Test response:', data);
            console.log('[Frontend] Full error if any:', data.error);

            if (data.success) {
                setTestResult('success');
                // Refresh models list on successful test
                if (apiKey) {
                    fetchModels(apiKey);
                } else if (config.hasApiKey) {
                    fetchModels(undefined, true); // Use saved key
                }
                setTimeout(() => setTestResult(null), 3000);
            } else {
                setTestResult('error');
                console.error('[Frontend] Test failed with error:', data.error);
                alert('测试失败：\n' + (data.error || '连接失败'));
                setTimeout(() => setTestResult(null), 3000);
            }
        } catch (error: any) {
            console.error('Test failed:', error);
            setTestResult('error');
            alert('测试失败：' + error.message);
            setTimeout(() => setTestResult(null), 3000);
        } finally {
            setTesting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('确定要删除 AI 配置吗？')) return;

        setSaving(true);
        try {
            const res = await fetch('/api/ai/config', {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Delete failed');

            setConfig({
                provider: 'gemini',
                enabled: false,
                apiKey: null,
                hasApiKey: false,
                model: null,
            });
            setApiKey('');
            alert('已删除配置');
        } catch (error) {
            console.error('Failed to delete AI config:', error);
            alert('删除失败');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} zIndex={70} className="w-full max-w-md bg-card p-0 flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    AI 助手配置
                </h3>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-muted rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Provider Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">服务提供商</label>
                            <select
                                value={config.provider || 'gemini'}
                                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="openai" disabled>OpenAI (即将支持)</option>
                            </select>
                        </div>

                        {/* Model Selection - show for Gemini (or when provider not set, default to Gemini) */}
                        {(config.provider === 'gemini' || !config.provider) && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">选择模型</label>
                                <select
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                                    value={config.model || ''}
                                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                    disabled={models.length === 0}
                                >
                                    {models.length === 0 ? (
                                        <option value="" disabled>请先测试 API Key 以获取模型列表</option>
                                    ) : (
                                        <>
                                            <option value="" disabled>选择模型...</option>
                                            {models.map(model => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    {models.length === 0
                                        ? '输入 API Key 并点击测试以加载可用模型'
                                        : `已加载 ${models.length} 个可用模型`}
                                </p>
                            </div>
                        )}

                        {/* API Key Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">API Key</label>
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    获取 API Key
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={config.hasApiKey ? '输入新 Key 以更新（留空保持不变）' : '粘贴您的 API Key'}
                                    className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {config.hasApiKey && !apiKey && (
                                <p className="text-xs text-muted-foreground">
                                    当前已配置：{config.apiKey}
                                </p>
                            )}
                        </div>

                        {/* Model Selection */}


                        {/* Test Connection */}
                        <button
                            onClick={handleTest}
                            disabled={testing || (!apiKey && !config.hasApiKey)}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                testResult === 'success'
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                                    : testResult === 'error'
                                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                        : "bg-muted hover:bg-muted/70 text-foreground border border-border",
                                (testing || (!apiKey && !config.hasApiKey)) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    测试连接中...
                                </>
                            ) : testResult === 'success' ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    连接成功
                                </>
                            ) : testResult === 'error' ? (
                                <>
                                    <X className="w-4 h-4" />
                                    连接失败
                                </>
                            ) : (
                                '测试连接'
                            )}
                        </button>

                        {/* Enable Toggle */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                            <div>
                                <div className="text-sm font-medium">启用 AI 助手</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    开启后可使用 AI 辅助解析课表和安排任务
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    config.enabled ? "bg-primary" : "bg-muted-foreground/30"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                                    config.enabled ? "translate-x-4" : ""
                                )} />
                            </button>
                        </div>

                        {/* Delete Config */}
                        {config.hasApiKey && (
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="w-full text-sm text-destructive hover:bg-destructive/10 py-2 rounded-lg transition-colors"
                            >
                                删除配置
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
                >
                    取消
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg disabled:opacity-50"
                >
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>
        </Modal>
    );
}
