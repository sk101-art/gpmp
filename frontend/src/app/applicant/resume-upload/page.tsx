"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X,
  FileCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function ResumeUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const userId = 2; // Default applicant

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf" && 
          selectedFile.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setError("Please upload a PDF or DOCX file.");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await api.applicant.uploadResume(userId, file);
      setSuccess(true);
      setTimeout(() => {
        router.push("/applicant");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-white">Upload Your Profile</h1>
          <p className="text-slate-400 text-lg">Our AI will parse your skills and experience to find the best matches.</p>
        </div>

        <Card className="bg-slate-900/40 border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl">
          <CardContent className="p-10 space-y-8">
            {!file ? (
              <div className="border-2 border-dashed border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 hover:border-indigo-500/50 transition-colors cursor-pointer group relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                />
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">Drop your resume here</p>
                  <p className="text-sm text-slate-500">Support for PDF and DOCX files</p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950/50 rounded-3xl border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500 uppercase font-black">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {success ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Resume uploaded successfully! Redirecting...
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 h-14 rounded-2xl text-lg font-black shadow-xl shadow-indigo-600/20"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Parsing Profile...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-500 hover:text-white"
                  onClick={() => router.push("/applicant")}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
               <FileCheck className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-600">Secure Storage</p>
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
               <Zap className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-600">Instant Parsing</p>
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
               <Sparkles className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-600">AI Matching</p>
           </div>
        </div>
      </div>
    </div>
  );
}
