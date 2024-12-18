import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Newspaper } from 'lucide-react'

export function EditorNewsTab() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="mr-2" />
            News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg text-gray-600">Coming Soon</h3>
            <p className="text-sm text-gray-500 mt-2">News management features will be available in a future update.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
