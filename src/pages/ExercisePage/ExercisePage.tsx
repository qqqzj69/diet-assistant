import { useState } from 'react';
import { Dumbbell, Flame, Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EXERCISES, calcExerciseKcal, minutesToBurn } from '@/data/exercises';
import { useProfile } from '@/hooks/use-profile';

const CHART_TEAL = '#15928B';
const CHART_ORANGE = '#E8892D';
const CHART_BLUE = '#4A7FB5';
const CHART_GOLD = '#D9A441';
const CHART_TERRA = '#C97064';

const CATEGORY_COLOR: Record<string, string> = {
  有氧: CHART_TEAL,
  力量: CHART_BLUE,
  球类: CHART_GOLD,
  舒缓: CHART_TERRA,
  高强度: CHART_ORANGE,
};

export default function ExercisePage() {
  const { profile } = useProfile();
  const [exId, setExId] = useState('e2');
  const [weightStr, setWeightStr] = useState(String(profile?.weight ?? 60));
  const [minutesStr, setMinutesStr] = useState('30');
  const [burnStr, setBurnStr] = useState('300');

  const weight = Math.max(1, Number(weightStr) || 0);
  const minutes = Math.max(1, Number(minutesStr) || 0);
  const burnInput = Math.max(1, Number(burnStr) || 0);

  const exercise = EXERCISES.find((e) => e.id === exId) ?? EXERCISES[0];
  const kcal = calcExerciseKcal(exercise.met, weight, minutes);

  const reverseData = EXERCISES.map((e) => ({
    name: e.name,
    minutes: minutesToBurn(e.met, weight, burnInput),
    category: e.category,
  }))
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">运动消耗</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          按 MET 代谢当量估算消耗，或反推"吃多了要练多久"
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              计算运动消耗
            </CardTitle>
            <CardDescription>消耗（千卡）= 代谢当量 × 体重 × 时长</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>运动项目</Label>
              <Select value={exId} onValueChange={setExId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISES.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}（MET {e.met}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ex-weight">体重（kg）</Label>
                <Input
                  id="ex-weight"
                  type="number"
                  min={1}
                  value={weightStr}
                  onChange={(e) => setWeightStr(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-minutes">时长（分钟）</Label>
                <Input
                  id="ex-minutes"
                  type="number"
                  min={1}
                  value={minutesStr}
                  onChange={(e) => setMinutesStr(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-xl bg-accent/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {exercise.name} · {minutes} 分钟 · {weight}kg
              </p>
              <p className="mt-1 text-4xl font-bold text-primary">
                {kcal}
                <span className="ml-1 text-base font-normal text-muted-foreground">千卡</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              反推运动时长
            </CardTitle>
            <CardDescription>吃多了 X 千卡，需要练多久才能消耗掉</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="burn-input">需要消耗的热量（千卡）</Label>
                <Input
                  id="burn-input"
                  type="number"
                  min={1}
                  value={burnStr}
                  onChange={(e) => setBurnStr(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={() => setBurnStr(String(kcal))}>
                用上方结果
              </Button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reverseData}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" unit=" 分" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={104}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} 分钟`, '所需时长']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={16}>
                    {reverseData.map((d) => (
                      <Cell key={d.name} fill={CATEGORY_COLOR[d.category]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              按 {weight}kg 体重估算（{burnInput} 千卡），越往上越费时；搭配饮食控制，减脂效率更高
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            MET 参考表
          </CardTitle>
          <CardDescription>代谢当量：1 MET ≈ 静息状态下的能耗速率</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">运动</TableHead>
                  <TableHead className="whitespace-nowrap">类型</TableHead>
                  <TableHead className="whitespace-nowrap">MET</TableHead>
                  <TableHead className="whitespace-nowrap">60kg 30 分钟消耗（约）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EXERCISES.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          color: CATEGORY_COLOR[e.category],
                          borderColor: `${CATEGORY_COLOR[e.category]}66`,
                          backgroundColor: `${CATEGORY_COLOR[e.category]}14`,
                        }}
                      >
                        {e.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{e.met}</TableCell>
                    <TableCell>约 {calcExerciseKcal(e.met, 60, 30)} 千卡</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
