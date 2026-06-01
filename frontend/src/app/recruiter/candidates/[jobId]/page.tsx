"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  BrainCircuit, 
  Target, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

export default function CandidateRankingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobData, candidateData] = await Promise.all([
        api.recruiter.getJob(jobId),
        api.recruiter.getCandidates(jobId)
      ]);
      setJob(jobData);
      setCandidates(candidateData.candidates || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRankCandidates = async () => {
    setRanking(true);
    try {
      await api.recruiter.rankCandidates(jobId);
      await fetchData();
    } catch (error) {
      console.error("Error ranking candidates:", error);
    } finally {
      setRanking(false);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.profile?.personal_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.profile?.skills?.some((s: any) => s.skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-white -ml-4"
              onClick={() => router.push("/recruiter")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3">
                {job?.title}
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  Active Role
                </Badge>
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                {job?.raw_description?.substring(0, 150)}...
              </p>
            </div>
          </div>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
            onClick={handleRankCandidates}
            disabled={ranking}
          >
            {ranking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI Ranking in Progress...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Re-Rank Candidates
              </>
            )}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Candidates</p>
                  <h3 className="text-3xl font-black text-white">{candidates.length}</h3>
                </div>
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Top Match</p>
                  <h3 className="text-3xl font-black text-emerald-400">
                    {candidates[0]?.overall_score ? `${candidates[0].overall_score}%` : 'N/A'}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Avg. Score</p>
                  <h3 className="text-3xl font-black text-white">
                    {candidates.length > 0 
                      ? Math.round(candidates.reduce((acc, c) => acc + c.overall_score, 0) / candidates.length)
                      : 0}%
                  </h3>
                </div>
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Filter className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Critical Gaps</p>
                  <h3 className="text-3xl font-black text-orange-400">
                    {candidates.reduce((acc, c) => acc + (c.score_breakdown?.required_skills_match < 70 ? 1 : 0), 0)}
                  </h3>
                </div>
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate List */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search candidates by name, skill, or experience..." 
                className="bg-slate-900/50 border-slate-800 pl-10 h-12 text-white placeholder:text-slate-600 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-slate-800 h-12 px-6">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          <div className="grid gap-6">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((c, idx) => (
                <Card key={c.resume_id} className="bg-slate-900/30 border-slate-800 hover:bg-slate-900/50 transition-all duration-300 group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-0">
                    <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl font-black text-indigo-400 shadow-xl">
                          {c.profile?.personal_info?.name?.[0] || "?"}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {c.profile?.personal_info?.name || "Unknown Candidate"}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>{c.profile?.experience?.[0]?.job_title || "Professional"}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>{c.profile?.experience?.[0]?.company || "N/A"}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {c.profile?.skills?.slice(0, 4).map((s: any) => (
                              <Badge key={s.skill} variant="secondary" className="bg-slate-800/50 text-slate-400 border-none text-[10px] uppercase tracking-wider font-bold">
                                {s.skill}
                              </Badge>
                            ))}
                            {c.profile?.skills?.length > 4 && (
                              <span className="text-[10px] text-slate-600 font-bold">+{c.profile.skills.length - 4} MORE</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score Visualization */}
                      <div className="w-full md:w-64 space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Match Score</span>
                          <span className={`text-2xl font-black ${c.overall_score >= 90 ? 'text-emerald-400' : c.overall_score >= 80 ? 'text-indigo-400' : 'text-orange-400'}`}>
                            {c.overall_score}%
                          </span>
                        </div>
                        <Progress 
                          value={c.overall_score} 
                          className="h-2 bg-slate-800"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                          <span>Skills: {c.score_breakdown?.required_skills_match}%</span>
                          <span>Experience: {c.score_breakdown?.experience_fit}%</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
                          View Resume
                        </Button>
                        <Button className="bg-slate-800 hover:bg-indigo-600 text-white border-none">
                          Shortlist
                        </Button>
                      </div>
                    </div>

                    {/* Rationale Footer */}
                    <div className="bg-slate-950/50 p-4 px-8 border-t border-slate-800/50 flex items-center justify-between">
                      <p className="text-xs text-slate-500 italic flex items-center gap-2">
                        <BrainCircuit className="w-3 h-3 text-indigo-500" />
                        AI Rationale: {c.rationale || "No rationale provided."}
                      </p>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                           <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                           Relevant Exp.
                         </div>
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                           <XCircle className="w-3 h-3 text-orange-500" />
                           Missing Certs
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No candidates found</h3>
                <p className="text-slate-600">Try adjusting your search or ranking parameters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
