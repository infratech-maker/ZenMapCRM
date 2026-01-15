"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
      // URLからクエリパラメータを削除
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      {/* アニメーション背景 */}
      <AnimatedBackground />

      {/* ログインフォーム */}
      <div className="relative z-10 w-full max-w-md">
        {/* ロゴエリア */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-purple-600 blur opacity-40 animate-pulse" />
            <div className="relative h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-inner" />
          </div>
          <span className="font-bold text-2xl tracking-widest text-white">
            Zen-Map
          </span>
        </div>

        {/* フォームカード */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-lg p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              CRM Platform
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                  placeholder="admin@zenmao.com"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                  placeholder="password123"
                />
              </div>
            </div>

            {registered && (
              <div className="rounded-md bg-green-900/50 border border-green-700/50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-green-300">
                    アカウント登録が完了しました。ログインしてください。
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-900/50 border border-red-700/50 p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full bg-white text-slate-950 hover:bg-slate-100 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            <div className="text-center text-sm text-slate-400">
              <p className="mt-4 mb-2">Test accounts:</p>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>Master Admin: admin@zenmao.com / password123</li>
                <li>Partner Admin: admin@partner.com / password123</li>
                <li>General User: user@zenmao.com / password123</li>
              </ul>
            </div>
          </form>
        </div>

        {/* トップページへのリンク */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
          <div className="text-center">
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
