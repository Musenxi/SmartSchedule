import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, FileText, Calendar, Sparkles, GraduationCap, Shield, Smartphone, Server } from 'lucide-react';
import { WidgetPreview } from '@/components/home/WidgetPreview';

export default async function Home() {
  const session = await auth();

  // Fetch GitHub stars
  let stars = 0;
  try {
    const res = await fetch('https://api.github.com/repos/Musenxi/SmartSchedule', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await res.json();
    stars = data.stargazers_count || 0;
  } catch (err) {
    console.error('Failed to fetch stars:', err);
  }

  if (session?.user) {
    redirect('/schedule');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-24 px-6 text-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

        <div className="max-w-4xl space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-secondary/50 px-3 py-1 text-sm font-medium text-secondary-foreground backdrop-blur-xl">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span className="text-primary">AI 驱动的智能课程表</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent drop-shadow-sm">
            智能课程表
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            告别繁琐的手动输入。上传您的课程表 PDF，让 AI 为您自动识别并生成完美的日程安排。
            高效、智能、优雅。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 pt-4">
            <Link href="/schedule">
              <Button size="lg" className="h-12 px-8 text-lg shadow-lg hover:shadow-primary/25 transition-all duration-300">
                开始使用
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg backdrop-blur-sm">
                登录账号
              </Button>
            </Link>
          </div>

          <div className="pt-8">
            <a
              href="https://github.com/Musenxi/SmartSchedule"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm" className="gap-2 text-muted-foreground hover:text-foreground transition-colors pr-1">
                <Github className="h-5 w-5" />
                <span>Star</span>
                <span className="ml-1 bg-muted px-2 py-0.5 rounded-md text-[10px] font-bold">
                  {stars > 0 ? (stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars) : '-'}
                </span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* iOS Widget Section */}
      <section className="py-24 px-6 border-y border-border/40 bg-muted/20 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl font-bold sm:text-4xl text-foreground">精心设计的 iOS 桌面小组件</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              无需反复打开 App，一眼即览。支持智能双视图、单视图展示，完美适配深色模式，让您的课表在主屏幕熠熠生辉。
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Badge text="自动刷新" color="blue" />
              <Badge text="深色模式" color="purple" />
              <Badge text="一键导入" color="orange" />
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <WidgetPreview />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold sm:text-5xl">更多强大特性</h2>
            <p className="text-muted-foreground text-lg">全方位的日程管理，保护您的隐私并提升效率</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-blue-500" />}
              title="AI 智能识别"
              description="直接上传学校课程表 PDF，利用先进 AI 模型提取课程、教室与时间，一键生成日程。"
            />
            <FeatureCard
              icon={<Smartphone className="h-10 w-10 text-cyan-500" />}
              title="PWA 原生体验"
              description="支持 PWA 应用，您可以将课程表安装到手机或电脑桌面，享受如原生 App 般的流畅操作。"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-green-500" />}
              title="安全与私有"
              description="数据完全掌握在您手中。支持私有化部署，确保个人课表隐私安全。"
            />
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-orange-500" />}
              title="多端实时同步"
              description="数据实时云端同步，无论在电脑端网页还是手机端小组件，您的日程总是保持最新。"
            />
            <FeatureCard
              icon={<GraduationCap className="h-10 w-10 text-purple-500" />}
              title="考试与任务管理"
              description="一站式管理考试安排与 DDLine，倒计时提醒重要事项，助您轻松掌控学业进度。"
            />
            <FeatureCard
              icon={<Server className="h-10 w-10 text-red-500" />}
              title="自托管支持"
              description="开源且易于自托管。只需简单的命令即可拥有属于您自己的智能课表服务。"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-sm text-muted-foreground border-t bg-background/50 backdrop-blur-md">
        <p>&copy; {new Date().getFullYear()} 智能课程表. Built by Musenxi.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 ring-1 ring-border/50">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200/50",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200/50",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {text}
    </span>
  );
}