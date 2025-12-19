import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, FileText, Clock, CheckCircle, PenLine, Linkedin, Instagram, Facebook } from "lucide-react";
import { format, subDays, isAfter, startOfDay, eachDayOfInterval, eachWeekOfInterval, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import * as api from "@/lib/api";
import type { Post } from "@shared/schema";

const DATE_RANGES = [
  { label: "7 jours", value: 7 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
];

const PLATFORM_COLORS = {
  linkedin: "#0A66C2",
  instagram: "#E4405F",
  facebook: "#1877F2",
};

const STATUS_COLORS = {
  draft: "#9CA3AF",
  scheduled: "#8B5CF6",
  published: "#10B981",
  sent: "#10B981",
};

const STATUS_LABELS = {
  draft: "Brouillon",
  scheduled: "Programmé",
  published: "Publié",
  sent: "Publié",
};

export default function AnalyticsView() {
  const [dateRange, setDateRange] = useState(30);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: api.getPosts,
  });

  const filteredPosts = useMemo(() => {
    const cutoffDate = startOfDay(subDays(new Date(), dateRange));
    return posts.filter((post) => isAfter(new Date(post.date), cutoffDate));
  }, [posts, dateRange]);

  const metrics = useMemo(() => {
    const total = filteredPosts.length;
    const scheduled = filteredPosts.filter((p) => p.status === "scheduled").length;
    const published = filteredPosts.filter((p) => p.status === "published" || p.status === "sent").length;
    const draft = filteredPosts.filter((p) => p.status === "draft").length;
    return { total, scheduled, published, draft };
  }, [filteredPosts]);

  const postsOverTime = useMemo(() => {
    if (filteredPosts.length === 0) return [];

    const now = new Date();
    const startDate = subDays(now, dateRange);

    if (dateRange <= 30) {
      const days = eachDayOfInterval({ start: startDate, end: now });
      return days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = filteredPosts.filter(
          (p) => format(new Date(p.date), "yyyy-MM-dd") === dayStr
        ).length;
        return {
          name: format(day, "dd MMM", { locale: fr }),
          posts: count,
        };
      });
    } else {
      const weeks = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const weekEnd = subDays(startOfWeek(subDays(weekStart, -7), { weekStartsOn: 1 }), 1);
        const count = filteredPosts.filter((p) => {
          const postDate = new Date(p.date);
          return postDate >= weekStart && postDate <= weekEnd;
        }).length;
        return {
          name: `Sem. ${format(weekStart, "dd/MM", { locale: fr })}`,
          posts: count,
        };
      });
    }
  }, [filteredPosts, dateRange]);

  const postsByPlatform = useMemo(() => {
    const platformCounts: Record<string, number> = {
      linkedin: 0,
      instagram: 0,
      facebook: 0,
    };

    filteredPosts.forEach((post) => {
      post.platforms.forEach((platform) => {
        if (platformCounts[platform] !== undefined) {
          platformCounts[platform]++;
        }
      });
    });

    return [
      { name: "LinkedIn", value: platformCounts.linkedin, color: PLATFORM_COLORS.linkedin },
      { name: "Instagram", value: platformCounts.instagram, color: PLATFORM_COLORS.instagram },
      { name: "Facebook", value: platformCounts.facebook, color: PLATFORM_COLORS.facebook },
    ];
  }, [filteredPosts]);

  const postsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      draft: 0,
      scheduled: 0,
      published: 0,
    };

    filteredPosts.forEach((post) => {
      if (post.status === "draft") {
        statusCounts.draft++;
      } else if (post.status === "scheduled") {
        statusCounts.scheduled++;
      } else if (post.status === "published" || post.status === "sent") {
        statusCounts.published++;
      }
    });

    return [
      { name: "Brouillon", value: statusCounts.draft, color: STATUS_COLORS.draft },
      { name: "Programmé", value: statusCounts.scheduled, color: STATUS_COLORS.scheduled },
      { name: "Publié", value: statusCounts.published, color: STATUS_COLORS.published },
    ].filter((item) => item.value > 0);
  }, [filteredPosts]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-6 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900" data-testid="text-analytics-title">
                  Analytics
                </h1>
                <p className="text-sm text-gray-500">
                  Statistiques de vos publications
                </p>
              </div>
            </div>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl" data-testid="date-range-selector">
              {DATE_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={dateRange === range.value ? "default" : "ghost"}
                  size="sm"
                  className={dateRange === range.value ? "shadow-md" : "text-gray-600"}
                  onClick={() => setDateRange(range.value)}
                  data-testid={`button-range-${range.value}`}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="stat-card" data-testid="card-total-posts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    Total Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900" data-testid="value-total-posts">
                    {isLoading ? "..." : metrics.total}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Sur les {dateRange} derniers jours
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card" data-testid="card-scheduled-posts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    Programmés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-amber-600" data-testid="value-scheduled-posts">
                    {isLoading ? "..." : metrics.scheduled}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    En attente de publication
                  </p>
                </CardContent>
              </Card>

              <Card className="stat-card" data-testid="card-published-posts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    Publiés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-emerald-600" data-testid="value-published-posts">
                    {isLoading ? "..." : metrics.published}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Déjà publiés
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card" data-testid="card-draft-posts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-gray-500" />
                    Brouillons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-600 font-heading" data-testid="value-draft-posts">
                    {isLoading ? "..." : metrics.draft}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En cours de rédaction
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-border bg-card" data-testid="card-posts-over-time">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 Publications dans le temps
                  </CardTitle>
                  <CardDescription>
                    Nombre de posts par {dateRange <= 30 ? "jour" : "semaine"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {postsOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={postsOverTime}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            interval={dateRange <= 7 ? 0 : "preserveStartEnd"}
                          />
                          <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [`${value} posts`, "Publications"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="posts"
                            stroke="#6366F1"
                            strokeWidth={3}
                            dot={{ fill: "#6366F1", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Aucune donnée pour cette période
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card" data-testid="card-posts-by-platform">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Posts par plateforme
                  </CardTitle>
                  <CardDescription>
                    Répartition sur les {dateRange} derniers jours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {postsByPlatform.some((p) => p.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={postsByPlatform} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={80}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [`${value} posts`, "Publications"]}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {postsByPlatform.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Aucune donnée pour cette période
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card lg:col-span-2" data-testid="card-posts-by-status">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🥧 Répartition par statut
                  </CardTitle>
                  <CardDescription>
                    Distribution des posts selon leur état
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    {postsByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={postsByStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={true}
                          >
                            {postsByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number, name: string) => [`${value} posts`, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Aucune donnée pour cette période
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
