"use client";

import { SurveyData } from "@/app/onboarding/page";
import SystemSelect from "@/components/ui/SystemSelect";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
    data: SurveyData;
    updateData: (fields: Partial<SurveyData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function FinancialAssessment({ data, updateData, onNext, onBack }: Props) {
    const isComplete = data.savingsHabit && data.incomeStability && data.budgetDiscipline && data.investmentKnowledge;

    return (
        <div className="space-y-5">
            <p className="text-sm text-system-neon/40 font-lato leading-relaxed">
                Financial discipline directly affects your resource regeneration rate. The System calculates your economic resilience.
            </p>

            <SystemSelect
                label="Savings Habit"
                value={data.savingsHabit}
                onChange={(val) => updateData({ savingsHabit: val })}
                options={[
                    { value: "rarely", label: "Rarely save" },
                    { value: "sometimes", label: "Sometimes" },
                    { value: "often", label: "Consistently" },
                    { value: "always", label: "Aggressively" },
                ]}
            />

            <SystemSelect
                label="Income Stability"
                value={data.incomeStability}
                onChange={(val) => updateData({ incomeStability: val })}
                options={[
                    { value: "poor", label: "Unstable" },
                    { value: "average", label: "Fluctuating" },
                    { value: "good", label: "Stable" },
                    { value: "excellent", label: "Very Stable" },
                ]}
            />

            <SystemSelect
                label="Budget Discipline"
                value={data.budgetDiscipline}
                onChange={(val) => updateData({ budgetDiscipline: val })}
                options={[
                    { value: "none", label: "No budget" },
                    { value: "basic", label: "Rough budget" },
                    { value: "intermediate", label: "Tracked" },
                    { value: "advanced", label: "Strict system" },
                ]}
            />

            <SystemSelect
                label="Investment Knowledge"
                value={data.investmentKnowledge}
                onChange={(val) => updateData({ investmentKnowledge: val })}
                options={[
                    { value: "none", label: "None" },
                    { value: "basic", label: "Basic" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
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
            enabled:border-system-neon/50 enabled:text-system-neon enabled:hover:shadow-[0_0_20px_rgba(17,210,239,0.4)]
            border-system-blue/20 text-system-neon/40 bg-transparent"
                >
                    <div className="absolute inset-0 bg-system-neon/10 transform -translate-x-full group-hover:group-enabled:translate-x-0 transition-transform duration-500 ease-out" />
                    <span className="relative z-10 flex items-center gap-2 uppercase tracking-[0.1em]">
                        Proceed to Phase 03
                        <ChevronRight className="w-4 h-4" />
                    </span>
                </button>
            </div>
        </div>
    );
}
