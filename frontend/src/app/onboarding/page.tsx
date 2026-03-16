"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import PhysicalAssessment from "@/components/onboarding/PhysicalAssessment";
import FinancialAssessment from "@/components/onboarding/FinancialAssessment";
import StudyHabitsAssessment from "@/components/onboarding/StudyHabitsAssessment";
import StatReveal from "@/components/onboarding/StatReveal";
import SystemModal from "@/components/ui/SystemModal";

export interface SurveyData {
    // Physical
    exerciseFrequency: string;
    sleepHours: string;
    fitnessLevel: string;
    dietQuality: string;
    // Financial
    savingsHabit: string;
    incomeStability: string;
    budgetDiscipline: string;
    investmentKnowledge: string;
    // Study
    studyHoursDaily: string;
    learningStyle: string;
    focusDuration: string;
    readingFrequency: string;
}

const INITIAL_DATA: SurveyData = {
    exerciseFrequency: "",
    sleepHours: "",
    fitnessLevel: "",
    dietQuality: "",
    savingsHabit: "",
    incomeStability: "",
    budgetDiscipline: "",
    investmentKnowledge: "",
    studyHoursDaily: "",
    learningStyle: "",
    focusDuration: "",
    readingFrequency: "",
};

function calculateStats(data: SurveyData) {
    const scoreMap: Record<string, number> = {
        low: 1, moderate: 2, high: 3, extreme: 4,
        poor: 1, average: 2, good: 3, excellent: 4,
        rarely: 1, sometimes: 2, often: 3, always: 4,
        none: 1, basic: 2, intermediate: 3, advanced: 4,
        "1-2": 1, "3-4": 2, "5-6": 3, "7+": 4,
        "<5": 1, "7-8": 3, "9+": 4,
        "<1": 1, "1-2h": 2, "3-4h": 3, "5+": 4,
        "<15min": 1, "15-30min": 2, "30-60min": 3, "60+min": 4,
        visual: 3, auditory: 2, reading: 3, kinesthetic: 4,
    };

    const score = (val: string) => scoreMap[val] || 2;

    const strength = Math.min(99, Math.round(
        (score(data.exerciseFrequency) * 6 + score(data.fitnessLevel) * 5 + score(data.dietQuality) * 3) * 1.8
    ));
    const agility = Math.min(99, Math.round(
        (score(data.exerciseFrequency) * 4 + score(data.sleepHours) * 4 + score(data.focusDuration) * 3) * 2
    ));
    const sense = Math.min(99, Math.round(
        (score(data.learningStyle) * 5 + score(data.readingFrequency) * 4 + score(data.dietQuality) * 3) * 1.9
    ));
    const vitality = Math.min(99, Math.round(
        (score(data.sleepHours) * 6 + score(data.dietQuality) * 5 + score(data.exerciseFrequency) * 4) * 1.5
    ));
    const intelligence = Math.min(99, Math.round(
        (score(data.studyHoursDaily) * 5 + score(data.readingFrequency) * 5 + score(data.investmentKnowledge) * 4) * 1.6
    ));

    return { strength, agility, sense, vitality, intelligence };
}

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<SurveyData>(INITIAL_DATA);

    const updateData = (fields: Partial<SurveyData>) => {
        setData((prev) => ({ ...prev, ...fields }));
    };

    const stats = calculateStats(data);

    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-system-black relative">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-system-blue/15 blur-[180px] rounded-full" />
                <div className="absolute top-1/4 right-1/4 w-[30vw] h-[30vw] bg-system-purple/10 blur-[120px] rounded-full animate-pulse" />
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <SystemModal key="physical" stepLabel="PHASE 01" stepTitle="Physical Assessment">
                        <PhysicalAssessment data={data} updateData={updateData} onNext={() => setStep(1)} />
                    </SystemModal>
                )}
                {step === 1 && (
                    <SystemModal key="financial" stepLabel="PHASE 02" stepTitle="Financial Assessment">
                        <FinancialAssessment data={data} updateData={updateData} onNext={() => setStep(2)} onBack={() => setStep(0)} />
                    </SystemModal>
                )}
                {step === 2 && (
                    <SystemModal key="study" stepLabel="PHASE 03" stepTitle="Study & Cognitive Assessment">
                        <StudyHabitsAssessment data={data} updateData={updateData} onNext={() => setStep(3)} onBack={() => setStep(1)} />
                    </SystemModal>
                )}
                {step === 3 && (
                    <StatReveal key="reveal" stats={stats} />
                )}
            </AnimatePresence>
        </main>
    );
}
