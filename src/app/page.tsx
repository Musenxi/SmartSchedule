import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/schedule');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          智能课程表
        </h1>
        <p className="text-lg text-muted-foreground">
          通过PDF智能识别，轻松管理你的课程安排
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/schedule"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            开始使用
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-md hover:bg-accent transition-colors"
          >
            登录
          </a>
        </div>
      </div>
    </div>
  );
}