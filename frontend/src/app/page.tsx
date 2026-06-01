import Link from "next/link";
import { ArrowRight, Briefcase, UserSearch, Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#020617] text-slate-50 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 blur-[100px] rounded-full -z-10" />
      
      <div className="max-w-6xl w-full text-center space-y-12 relative z-10">
        <div className="space-y-6 animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-indigo-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Talent Matching V1.0</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
            Hire Faster. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
              Apply Smarter.
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            The intelligent bridge between talent and opportunity. Choose your portal to experience the future of recruitment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">
          <Link 
            href="/recruiter"
            className="group relative p-10 rounded-3xl bg-slate-900/40 border border-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-500 overflow-hidden backdrop-blur-sm shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 space-y-6 text-left">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-indigo-500/20">
                <UserSearch className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Recruiter Portal</h2>
                <p className="text-slate-400 leading-relaxed">
                  Define job specs with AI, rank candidates by semantic similarity, and find your next lead engineer in seconds.
                </p>
              </div>
              <div className="flex items-center text-indigo-400 font-bold group-hover:translate-x-2 transition-transform duration-300">
                Manage Openings <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link 
            href="/applicant"
            className="group relative p-10 rounded-3xl bg-slate-900/40 border border-slate-800/50 hover:border-violet-500/50 hover:bg-slate-900/60 transition-all duration-500 overflow-hidden backdrop-blur-sm shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 space-y-6 text-left">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-violet-500/20">
                <Briefcase className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Applicant Portal</h2>
                <p className="text-slate-400 leading-relaxed">
                  Get a deep gap analysis of your resume against any job. Receive custom advice on how to improve your match score.
                </p>
              </div>
              <div className="flex items-center text-violet-400 font-bold group-hover:translate-x-2 transition-transform duration-300">
                Analyze Resume <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-500 text-sm font-medium">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant Matching</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Privacy Secured</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>AI-Driven Insights</span>
          </div>
        </div>
      </div>
    </main>
  );
}
