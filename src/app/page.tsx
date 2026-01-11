import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, FileText, Calendar, Sparkles, GraduationCap } from 'lucide-react';

export default async function Home() {
  const session = await auth();

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
              <Button variant="secondary" size="sm" className="gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
                <span>View on GitHub</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-blue-500" />}
            title="PDF 智能识别"
            description="直接上传学校的课程表 PDF 文件，利用先进的 AI 视觉模型精确提取课程信息。"
          />
          <FeatureCard
            icon={<Sparkles className="h-10 w-10 text-purple-500" />}
            title="AI 自动解析"
            description="无需手动录入，自定义模型API自动分析时间、教室和课程详情，一键生成日程。"
          />
          <FeatureCard
            icon={<Calendar className="h-10 w-10 text-orange-500" />}
            title="多端同步"
            description="随时随地查看您的课表。支持多种视图切换。"
          />
          <FeatureCard
            icon={<GraduationCap className="h-10 w-10 text-green-500" />}
            title="考试集合"
            description="一站式管理所有考试安排，考试时间和地点一目了然，助您轻松备考。"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t bg-background/50 backdrop-blur-md">
        <p>&copy; {new Date().getFullYear()} SmartSchedule. Built by Musenxi.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="mb-4 p-3 rounded-full bg-secondary/50">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}