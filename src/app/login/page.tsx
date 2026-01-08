export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">登录</h2>
          <p className="text-sm text-muted-foreground mt-2">
            使用邮箱和密码登录
          </p>
        </div>
        
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}