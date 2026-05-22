import { motion } from 'framer-motion';
import {
  BarChart3, Users, FileText, Globe, TrendingUp, ArrowUpRight,
  Activity, Eye, MousePointerClick, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stats = [
  { title: 'Total Websites', value: '5', change: '+2 this month', icon: Globe, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { title: 'Published Blogs', value: '24', change: '+8 this week', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { title: 'Total Leads', value: '1,204', change: '+12% vs last month', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { title: 'SEO Score', value: '94', change: 'Excellent', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const recentActivity = [
  { action: 'Blog published', target: 'Top 10 HRMS Features 2025', website: 'HRMS', time: '2 min ago', icon: FileText },
  { action: 'New lead', target: 'john@example.com', website: 'Fleet', time: '15 min ago', icon: Users },
  { action: 'SEO updated', target: '/pricing page', website: 'Inventory', time: '1 hour ago', icon: BarChart3 },
  { action: 'Sitemap pinged', target: 'Google + Bing', website: 'Transport', time: '3 hours ago', icon: Activity },
];

const topPages = [
  { path: '/blog/hrms-guide', views: 2340, clicks: 187 },
  { path: '/pricing', views: 1890, clicks: 234 },
  { path: '/blog/fleet-tips', views: 1456, clicks: 98 },
  { path: '/features', views: 1230, clicks: 156 },
];

export default function PremiumTestDashboard() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Mavro Admin — Premium UI Test</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-300 group">
              {/* Glassmorphism accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-60 -mr-8 -mt-8 group-hover:opacity-80 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest actions across all websites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((act, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <act.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{act.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{act.target}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{act.website}</Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {act.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Pages</CardTitle>
              <CardDescription>Most visited this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.map((page, i) => (
                  <motion.div
                    key={page.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{page.path}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {page.views.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" /> {page.clicks}
                        </span>
                      </div>
                    </div>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(page.views / 2500) * 100}%` }}
                        transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm">New Blog</Button>
              <Button size="sm" variant="outline">View Leads</Button>
              <Button size="sm" variant="secondary">SEO Audit</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
