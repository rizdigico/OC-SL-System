"use client";

import { SurveyData } from "@/app/onboarding/page";
import SystemSelect from "@/components/ui/SystemSelect";
import { ChevronLeft, Zap } from "lucide-react";

interface Props {
    data: SurveyData;
    updateData: (fields: Partial<SurveyData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function StudyHabitsAssessment({ data, updateData, onNext, onBack }: Props) {
    const isComplete = data.studyHoursDaily && data.learningStyle && data.focusDuration && data.readingFrequency;

    return (
        <div className="space-y-5">
            <p className="text-sm text-system-neon/40 font-lato leading-relaxed">
                Cognitive capacity determines your Intelligence and Sense stats. The System is analysing your neural pathways.
            </p>

            <SystemSelect
                label="Daily Study / Learning Hours"
                value={data.studyHoursDaily}
                onChange={(val) => updateData({ studyHoursDaily: val })}
                options={[
                    { value: "<1", label: "< 1 hour" },
                    { value: "1-2h", label: "1–2 hours" },
                    { value: "3-4h", label: "3–4 hours" },
                    { value: "5+", label: "5+ hours" },
                ]}
            />

            <SystemSelect
                label="Primary Learning Style"
                value={data.learningStyle}
                onChange={(val) => updateData({ learningStyle: val })}
                options={[
                    { value: "visual", label: "Visual" },
                    { value: "auditory", label: "Auditory" },
                    { value: "reading", label: "Reading/Writing" },
                    { value: "kinesthetic", label: "Hands-on" },
                ]}
            />

            <SystemSelect
                label="Sustained Focus Duration"
                value={data.focusDuration}
                onChange={(val) => updateData({ focusDuration: val })}
                options={[
                    { value: "<15min", label: "< 15 min" },
                    { value: "15-30min", label: "15–30 min" },
                    { value: "30-60min", label: "30–60 min" },
                    { value: "60+min", label: "60+ min" },
                ]}
            />

            <SystemSelect
                label="Book / Article Reading Frequency"
                value={data.readingFrequency}
                onChange={(val) => updateData({ readingFrequency: val })}
                options={[
                    { value: "rarely", label: "Rarely" },
                    { value: "sometimes", label: "Monthly" },
                    { value: "often", label: "Weekly" },
                    { value: "always", label: "Daily" },
                ]}
            />

            <div className="pt-4 flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-shrink-0 flex items-center justify-center py-3.5 px-4 border border-system-blue/30 text-sm font-caros rounded-sm text-system-neon/40 hover:text-system-neon/70 hover:border-system-blue/50 transition-all duration-200"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={onNext}
                    disabled={!isComplete}
                    className="group relative flex-1 flex justify-center items-center py-3.5 px-4 border text-sm font-bold font-caros rounded-sm overflow-hidden transition-all duration-300
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:border-system-blue/80 enabled:text-system-neon enabled:hover:shadow-[0_0_25px_rgba(1,27,222,0.5)]
            border-system-blue/20 text-system-neon/40 bg-transparent"
                >
                    <div className="absolute inset-0 bg-system-blue/15 transform -translate-x-full group-hover:group-enabled:translate-x-0 transition-transform duration-500 ease-out" />
                    <span className="relative z-10 flex items-center gap-2 uppercase tracking-[0.1em]">
                        Reveal My Stats
                        <Zap className="w-4 h-4" />
                    </span>
                </button>
            </div>
        </div>
    );
}
