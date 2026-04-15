import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const ChiroList = () => (
  <div className="grid w-auto auto-rows-auto grid-cols-1 gap-5 md:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle>Dr. Smith</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Gonstead Specialist</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Dr. Johnson</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Activator Method</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Dr. Williams</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Sports Chiropractic</p>
      </CardContent>
    </Card>
  </div>
);
