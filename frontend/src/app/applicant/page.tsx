"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Target,
  Filter,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ApplicantDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resumes, setResumes] = useState<any[]>([]);
  const userId = 2; // Default applicant from seed

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsData, resumesData] = await Promise.all([
        api.applicant.getJobs(),
        api.applicant.getResumes(userId)
      ]);
      setJobs(jobsData);
      setResumes(resumesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-950 pt-16 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto px-8 relative">
          <div className="flex items-center gap-3 text-indigo-400 font-black text-2xl mb-12 tracking-tighter">
            <Sparkles className="w-8 h-8 fill-indigo-500/20" />
            <span>TALENT.AI</span>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-6xl font-black text-white leading-tight tracking-tighter">
              Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">breakthrough</span> role.
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl">
              Upload your resume once, and let our AI engine analyze your fit against top tech roles instantly.
            </p>
            
            <div className="flex gap-4 pt-4">
              <Link href="/applicant/resume-upload">
                <Button className="bg-indigo-600 hover:bg-indigo-500 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 text-lg font-bold group">
                  <Upload className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
                  {resumes.length > 0 ? "Update Resume" : "Upload Resume"}
                </Button>
              </Link>
              <Button variant="outline" className="border-slate-800 h-14 px-8 rounded-2xl text-lg font-bold text-slate-400 hover:text-white">
                View My Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-16 pb-20 space-y-12">
        {/* Search Bar */}
        <div className="bg-slate-900/50 backdrop-blur-2xl p-4 rounded-3xl border border-slate-800/50 shadow-2xl flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <Input 
              placeholder="Search by job title, skill, or keywords..." 
              className="bg-transparent border-none h-12 pl-12 text-lg text-white placeholder:text-slate-700 focus-visible:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-slate-800 hover:bg-slate-700 h-12 px-6 rounded-xl font-bold">
            <Filter className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Job List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                Latest Opportunities
                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-none px-3">
                  {jobs.length} New
                </Badge>
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-slate-900/20 rounded-3xl border border-slate-800/50">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-medium">Loading opportunities...</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map((j) => (
                  <Link key={j.job_id} href={`/applicant/jobs/${j.job_id}`} className="block group">
                    <Card className="bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-300 rounded-2xl overflow-hidden group">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-indigo-600 transition-colors">
                              {j.title[0]}
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{j.title}</h3>
                              <p className="text-slate-500 text-sm flex items-center gap-4">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Hybrid</span>
                                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Full-time</span>
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-3">New Posting</Badge>
                        </div>
                        <p className="mt-6 text-slate-400 text-sm line-clamp-2 leading-relaxed">
                          {j.raw_description}
                        </p>
                        <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-slate-800/50 text-slate-500 border-none text-[10px] font-bold uppercase">React</Badge>
                            <Badge variant="secondary" className="bg-slate-800/50 text-slate-500 border-none text-[10px] font-bold uppercase">TypeScript</Badge>
                            <Badge variant="secondary" className="bg-slate-800/50 text-slate-500 border-none text-[10px] font-bold uppercase">Python</Badge>
                          </div>
                          <div className="flex items-center text-indigo-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
                            View Analysis <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                <p className="text-slate-500 font-medium">No matching jobs found.</p>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <Card className="bg-indigo-600 rounded-3xl border-none shadow-2xl shadow-indigo-600/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <CardHeader className="relative">
                <CardTitle className="text-white text-2xl font-black">AI Gap Analysis</CardTitle>
                <CardDescription className="text-indigo-100 font-medium">
                  See how you stack up against your dream role.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="p-4 bg-white/10 rounded-2xl space-y-3">
                  <div className="flex justify-between text-sm text-white font-bold">
                    <span>Profile Strength</span>
                    <span>84%</span>
                  </div>
                  <Progress value={84} className="bg-white/20 h-2" />
                </div>
                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-black h-12 rounded-xl">
                  Analyze Matches
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/50 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Your Resumes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumes.length > 0 ? (
                  resumes.map((r: any) => (
                    <div key={r.resume_id} className="p-4 bg-slate-800/30 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-800/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white truncate max-w-[120px]">{r.filename}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{new Date(r.parsed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500">No resumes uploaded yet.</p>
                  </div>
                )}
                <Link href="/applicant/resume-upload" className="block">
                  <Button variant="ghost" className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Resume
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
