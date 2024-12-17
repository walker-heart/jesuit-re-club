import { Card, CardContent } from "@/components/ui/card";

export function ActivityTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Activity Log</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recent user activities and system events will be displayed here.
            </p>
            <div className="border rounded-md p-4 bg-muted/50">
              <p>No activities to display.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
