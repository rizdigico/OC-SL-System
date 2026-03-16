"use client";

import { SurveyData } from "@/app/onboarding/page";
import SystemSelect from "@/components/ui/SystemSelect";
import { ChevronRight } from "lucide-react";

interface Props {
    data: SurveyData;
    updateData: (fields: Partial<SurveyData>) => void;
    onNext: () => void;
}

export default function PhysicalAssessment({ data, updateData, onNext }: Props) {
    const isComplete = data.exerciseFrequency && data.sleepHours && data.fitnessLevel && data.dietQuality;

    return (
        <div className="space-y-5">
            <p className="text-sm text-system-neon/40 font-lato leading-relaxed">
                The System requires a baseline scan of your physical vessel. Answer honestly — your initial stat allocation depends on it.
            </p>

            <SystemSelect
                label="Weekly Exercise Frequency"
                value={data.exerciseFrequency}
                onChange={(val) => updateData({ exerciseFrequency: val })}
                options={[
                    { value: "rarely", label: "Rarely" },
                    { value: "1-2", label: "1–2 days" },
                    { value: "3-4", label: "3–4 days" },
                    { value: "5-6", label: "5–6 days" },
                ]}
            />

            <SystemSelect
                label="Average Sleep (Hours/Night)"
                value={data.sleepHours}
                onChange={(val) => updateData({ sleepHours: val })}
                options={[
                    { value: "<5", label: "< 5 hrs" },
                    { value: "5-6", label: "5–6 hrs" },
                    { value: "7-8", label: "7–8 hrs" },
                    { value: "9+", label: "9+ hrs" },
                ]}
            />

            <SystemSelect
                label="Current Fitness Level"
                value={data.fitnessLevel}
                onChange={(val) => updateData({ fitnessLevel: val })}
                options={[
                    { value: "poor", label: "Poor" },
                    { value: "average", label: "Average" },
                    { value: "good", label: "Good" },
                    { value: "excellent", label: "Excellent" },
                ]}
            />

            <SystemSelect
                label="Diet Quality"
                value={data.dietQuality}
                onChange={(val) => updateData({ dietQuality: val })}
                options={[
                    { value: "poor", label: "Poor" },
                    { value: "average", label: "Average" },
                    { value: "good", label: "Good" },
                    { value: "excellent", label: "Excellent" },
                ]}
            />

            <div className="pt-4">
                <button
                    onClick={onNext}
                    disabled={!isComplete}
                    className="group relative w-full flex justify-center items-center py-3.5 px-4 border text-sm font-bold font-caros rounded-sm overflow-hidden transition-all duration-300
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:border-system-neon/50 enabled:text-system-neon enabled:hover:shadow-[0_0_20px_rgba(17,210,239,0.4)]
            border-system-blue/20 text-system-neon/40 bg-transparent"
                >
                    <div className="absolute inset-0 bg-system-neon/10 transform -translate-x-full group-hover:group-enabled:translate-x-0 transition-transform duration-500 ease-out" />
                    <span className="relative z-10 flex items-center gap-2 uppercase tracking-[0.1em]">
                        Proceed to Phase 02
                        <ChevronRight className="w-4 h-4" />
                    </span>
                </button>
            </div>
        </div>
    );
}
