"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ExtractedSpec {
  job_title?: string;
  required_skills?: Array<{ skill: string; years_required?: number }>;
  experience_requirements?: { minimum_years?: number };
  required_education?: { minimum_degree?: string };
  deal_breakers?: Array<{ criterion: string; description?: string }>;
}

export default function JobBuilder() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedSpec, setExtractedSpec] = useState<ExtractedSpec | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleCreateJob = async () => {
    if (!jobTitle || !jobDescription) {
      setError("Job title and description are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription,
          company_id: 1, // TODO: get from context
        }),
      });

      if (!response.ok) throw new Error("Failed to create job");

      const data = await response.json();
      setExtractedSpec(data.extracted_spec);
      setSuccess(true);

      // Redirect to job details after 2 seconds
      setTimeout(() => {
        window.location.href = `/recruiter/jobs/${data.id}`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/recruiter" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Create Job Posting</CardTitle>
            <CardDescription>
              Define your job opening. Our AI will extract structured requirements and match candidates automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Job Title *</label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Job Description *</label>
              <Textarea
                placeholder="Paste the full job description here. Include responsibilities, requirements, skills, qualifications, nice-to-haves, etc."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={15}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <p className="text-xs text-slate-400 mt-2">
                The more detailed the description, the better our AI can match candidates.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Job posting created successfully! Redirecting...
              </div>
            )}

            {/* Preview of Extracted Spec */}
            {extractedSpec && (
              <Card className="border-slate-600 bg-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-lg">Extracted Job Specification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedSpec.required_skills && extractedSpec.required_skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {extractedSpec.required_skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">
                            {skill.skill}
                            {skill.years_required && ` (${skill.years_required}y)`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {extractedSpec.experience_requirements?.minimum_years && (
                    <p className="text-sm">
                      <strong>Minimum Experience:</strong> {extractedSpec.experience_requirements.minimum_years} years
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleCreateJob}
              disabled={loading || !jobTitle || !jobDescription}
              size="lg"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job Posting
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
