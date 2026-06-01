"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  BrainCircuit, 
  Target, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  BookOpen,
  Trophy,
  ArrowRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

export default function JobAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const jobData = await api.applicant.getJob(jobId);
      setJob(jobData);
      
      const resumes = await api.applicant.getResumes(2); // Mock user
      if (resumes.length > 0) {
        const rId = resumes[0].resume_id;
        setResumeId(rId);
        // Try to fetch existing analysis
        try {
          const analysisData = await api.applicant.getGapAnalysis(rId, jobId);
          setAnalysis(analysisData);
        } catch (e) {
           console.log("No existing analysis found");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!resumeId) return;
    setAnalyzing(true);
    try {
      const data = await api.applicant.analyzeGap(resumeId, parseInt(jobId));
      setAnalysis(data);
    } catch (error) {
      console.error("Error running analysis:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-white -ml-4"
              onClick={() => router.push("/applicant")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Opportunities
            </Button>
            <div>
              <h1 className="text-4xl font-black text-white">{job?.title}</h1>
              <div className="flex items-center gap-4 text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Target className="w-4 h-4" /> TechCorp</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Posted 2 days ago</span>
              </div>
            </div>
          </div>
          {!analysis && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 h-14 px-8 rounded-2xl text-lg font-bold"
              onClick={handleRunAnalysis}
              disabled={analyzing || !resumeId}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI Analysis...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Analyze My Fit
                </>
              )}
            </Button>
          )}
        </div>

        {!analysis ? (
          <Card className="bg-slate-900/40 border-slate-800/50 rounded-3xl p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-bold text-white">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed">
                {job?.description}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
             {/* Score Dashboard */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-slate-900/40 border-slate-800/50 rounded-3xl p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-slate-500 uppercase font-black tracking-widest mb-1">Match Probability</p>
                        <h2 className="text-5xl font-black text-white">{analysis.match_score}%</h2>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none px-4 py-1 text-sm font-bold">Strong Match</Badge>
                    </div>
                    <Progress value={analysis.match_score} className="h-4 bg-slate-800" />
                    <div className="grid grid-cols-2 gap-8 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                          <span>Skills Fit</span>
                          <span>{analysis.match_breakdown?.required_skills_match}%</span>
                        </div>
                        <Progress value={analysis.match_breakdown?.required_skills_match} className="h-1.5 bg-slate-800" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                          <span>Experience Fit</span>
                          <span>{analysis.match_breakdown?.experience_fit}%</span>
                        </div>
                        <Progress value={analysis.match_breakdown?.experience_fit} className="h-1.5 bg-slate-800" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-indigo-600 rounded-3xl border-none p-8 flex flex-col justify-center items-center text-center space-y-4">
                   <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                     <Trophy className="w-8 h-8 text-white" />
                   </div>
                   <h3 className="text-2xl font-black text-white">Top 5%</h3>
                   <p className="text-indigo-100 font-medium">You are in the top tier of candidates for this specific role.</p>
                </Card>
             </div>

             {/* Detailed Analysis */}
             <Tabs defaultValue="gaps" className="w-full">
                <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-2xl h-14">
                  <TabsTrigger value="gaps" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold">Gap Analysis</TabsTrigger>
                  <TabsTrigger value="roadmap" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold">Upskilling Plan</TabsTrigger>
                  <TabsTrigger value="interview" className="rounded-xl px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold">Interview Prep</TabsTrigger>
                </TabsList>

                <TabsContent value="gaps" className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/40 border-slate-800/50 rounded-3xl p-6">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Met Requirements
                        </CardTitle>
                      </CardHeader>
                      <div className="flex flex-wrap gap-2">
                        {analysis.required_skills_matched?.map((s: string) => (
                          <Badge key={s} variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </Card>

                    <Card className="bg-slate-900/40 border-slate-800/50 rounded-3xl p-6">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-orange-400 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Identified Gaps
                        </CardTitle>
                      </CardHeader>
                      <div className="flex flex-wrap gap-2">
                        {analysis.required_skills_missing?.map((s: string) => (
                          <Badge key={s} variant="secondary" className="bg-orange-500/10 text-orange-500 border-none">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">Critical Gap Details</h3>
                    {analysis.gaps?.map((gap: any, idx: number) => (
                      <Card key={idx} className="bg-slate-900/20 border-slate-800/50 rounded-2xl overflow-hidden group">
                        <div className="p-6 flex items-start gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            gap.severity === 'blocking' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                          }`}>
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-bold text-white">{gap.title}</h4>
                              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest">{gap.severity}</Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{gap.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="roadmap" className="mt-8 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {analysis.advisor_plan?.map((plan: any, idx: number) => (
                       <Card key={idx} className="bg-slate-900/40 border-slate-800/50 rounded-3xl p-8 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <BookOpen className="w-12 h-12" />
                         </div>
                         <h4 className="text-2xl font-black text-white mb-6">Step {plan.priority_order}: {plan.remediation_actions?.[0]?.title}</h4>
                         <div className="space-y-4">
                           {plan.remediation_actions?.map((action: any, aIdx: number) => (
                             <div key={aIdx} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-between group/action cursor-pointer hover:border-indigo-500/50 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/action:bg-indigo-600 group-hover/action:text-white transition-all">
                                    <Zap className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{action.provider}</p>
                                    <p className="text-xs text-slate-500">{action.estimated_duration}</p>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-700 group-hover/action:text-indigo-400 group-hover/action:translate-x-1 transition-all" />
                             </div>
                           ))}
                         </div>
                       </Card>
                     ))}
                   </div>
                </TabsContent>

                <TabsContent value="interview" className="mt-8">
                  <Card className="bg-slate-900/40 border-slate-800/50 rounded-3xl p-8">
                    <h3 className="text-2xl font-black text-white mb-8">Personalized Interview Playbook</h3>
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Key Topics to Master</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.interview_preparation?.key_topics_to_study?.map((topic: string) => (
                            <Badge key={topic} variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-4 py-2 rounded-xl text-sm font-bold">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Anticipated Questions</h4>
                        {analysis.interview_preparation?.common_questions?.map((q: string, idx: number) => (
                          <div key={idx} className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all">
                            <p className="text-white font-bold mb-2">Q: {q}</p>
                            <p className="text-slate-500 text-sm italic">Strategy: Focus on your experience with {analysis.required_skills_matched?.[0]} to bridge the gap.</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </TabsContent>
             </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
