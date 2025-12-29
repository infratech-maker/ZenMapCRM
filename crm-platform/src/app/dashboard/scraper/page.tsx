import { createScrapingJob, getScrapingJobs } from "@/features/scraper/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrapingJobForm } from "@/features/scraper/scraping-job-form";
import { ScrapingJobList } from "@/features/scraper/scraping-job-list";

export default async function ScraperPage() {
  const jobs = await getScrapingJobs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scraper</h1>
        <p className="mt-2 text-sm text-gray-600">
          URLを入力してスクレイピングジョブを登録します
        </p>
      </div>

      {/* Job Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>新しいスクレイピングジョブ</CardTitle>
          <CardDescription>
            スクレイピング対象のURLを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrapingJobForm />
        </CardContent>
      </Card>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle>スクレイピングジョブ一覧</CardTitle>
          <CardDescription>
            最新のジョブ実行履歴を表示します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrapingJobList initialJobs={jobs} />
        </CardContent>
      </Card>
    </div>
  );
}

