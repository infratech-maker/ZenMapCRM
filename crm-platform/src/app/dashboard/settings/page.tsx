import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          システム設定を管理します
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>設定</CardTitle>
          <CardDescription>
            設定機能は今後実装予定です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

