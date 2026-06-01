"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Users, LayoutDashboard, Briefcase, ChevronRight, Star, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function RecruiterDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const companyId = 1; // Default for V1

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.recruiter.getJobs(companyId);
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-800/50 p-8 space-y-10 hidden md:block min-h-screen bg-slate-950/20 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-indigo-400 font-black text-2xl mb-12 tracking-tighter">
            <Sparkles className="w-8 h-8 fill-indigo-500/20" />
            <span>TALENT.AI</span>
          </div>
          
          <nav className="space-y-2">
            <Link href="/recruiter" className="flex items-center gap-3 text-white bg-indigo-600/10 p-4 rounded-xl border border-indigo-500/20 group transition-all">
              <LayoutDashboard className="w-5 h-5 text-indigo-400" />
              <span className="font-bold">Dashboard</span>
            </Link>
            <Link href="/recruiter/job-builder" className="flex items-center gap-3 text-slate-500 hover:text-white hover:bg-slate-800/50 p-4 rounded-xl transition-all group">
              <Plus className="w-5 h-5 group-hover:text-indigo-400" />
              <span className="font-medium">New Job Spec</span>
            </Link>
            <Link href="#" className="flex items-center gap-3 text-slate-500 hover:text-white hover:bg-slate-800/50 p-4 rounded-xl transition-all group">
              <Users className="w-5 h-5 group-hover:text-indigo-400" />
              <span className="font-medium">Candidate Pool</span>
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-10 max-w-7xl mx-auto">
          <header className="flex justify-between items-end mb-16">
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-white tracking-tight">Active Roles</h1>
              <p className="text-slate-500 text-lg font-medium">Manage and rank talent for your open positions</p>
            </div>
            <Link href="/recruiter/job-builder">
              <Button className="bg-indigo-600 hover:bg-indigo-500 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 text-lg font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Create Job Posting
              </Button>
            </Link>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md rounded-3xl p-4 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Briefcase className="w-6 h-6 text-indigo-400" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">+4 New</Badge>
                </div>
                <p className="text-sm text-slate-500 uppercase font-black tracking-widest mb-1">Open Positions</p>
                <h3 className="text-4xl font-black text-white">{jobs.length}</h3>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md rounded-3xl p-4 overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-fuchsia-500/10 transition-colors" />
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-fuchsia-500/10 rounded-2xl">
                    <Users className="w-6 h-6 text-fuchsia-400" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 uppercase font-black tracking-widest mb-1">Total Applicants</p>
                <h3 className="text-4xl font-black text-white">428</h3>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md rounded-3xl p-4 overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-amber-500/10 rounded-2xl">
                    <Star className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 uppercase font-black tracking-widest mb-1">Avg. Quality</p>
                <h3 className="text-4xl font-black text-white">84%</h3>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <Input 
                  placeholder="Filter by job title..." 
                  className="bg-slate-900/40 border-slate-800 h-16 pl-12 rounded-2xl text-lg text-white placeholder:text-slate-700 focus:ring-indigo-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium">Fetching your active roles...</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map((j) => (
                  <Link 
                    key={j.id} 
                    href={`/recruiter/candidates/${j.id}`}
                    className="group"
                  >
                    <Card className="bg-slate-900/20 border-slate-800/50 hover:bg-slate-900/40 hover:border-indigo-500/30 transition-all duration-300 rounded-2xl overflow-hidden">
                      <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20 group-hover:scale-110 transition-transform">
                            {j.title[0]}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{j.title}</h3>
                            <div className="flex items-center gap-4 text-slate-500 text-sm mt-1">
                              <span>Posted {new Date(j.created_at).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-800" />
                              <span className="capitalize">{j.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-slate-600 uppercase font-black tracking-widest mb-1">Ranked Candidates</p>
                            <p className="text-white font-bold">View List →</p>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-800/50 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-800">
                <Briefcase className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-400 mb-2">No active jobs found</h3>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">Create your first job posting to start receiving AI-ranked candidate lists.</p>
                <Link href="/recruiter/job-builder">
                  <Button variant="outline" className="border-slate-800 hover:bg-slate-800 text-indigo-400">
                    <Plus className="w-4 h-4 mr-2" />
                    New Job Spec
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

