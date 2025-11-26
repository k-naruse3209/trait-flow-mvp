"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TIPI_QUESTIONS, TipiResponse, validateTipiResponses, getTipiQuestionText } from "@/lib/tipi";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "@/components/translation-provider";

import { CheckCircle, AlertCircle } from "lucide-react";

type AssessmentStep = 'intro' | 'assessment' | 'submitting' | 'complete' | 'error';

export function TipiAssessment() {
    const [step, setStep] = useState<AssessmentStep>('intro');
    const [responses, setResponses] = useState<TipiResponse[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations();
    const locale = useLocale();


    const handleStartAssessment = () => {
        setStep('assessment');
        setCurrentQuestion(0);
        setResponses([]);
        setError(null);
    };

    const handleResponse = (score: number) => {
        const questionId = TIPI_QUESTIONS[currentQuestion].id;
        const newResponses = [...responses];

        // Update or add response
        const existingIndex = newResponses.findIndex(r => r.questionId === questionId);
        if (existingIndex >= 0) {
            newResponses[existingIndex] = { questionId, score };
        } else {
            newResponses.push({ questionId, score });
        }

        setResponses(newResponses);

        // Auto-advance to next question
        if (currentQuestion < TIPI_QUESTIONS.length - 1) {
            setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
            }, 300);
        }
    };



    const handleSubmit = async () => {
        // Validate responses
        const validationErrors = validateTipiResponses(responses);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        setStep('submitting');
        setError(null);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No active session');
            }

            const response = await fetch('/api/tipi-submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ responses }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit assessment');
            }

            setStep('complete');

            console.log('Assessment completed successfully');

            // Redirect to results page after a delay with force refresh
            setTimeout(() => {
                // Force a full page refresh to ensure fresh data from database
                window.location.href = `/${locale}/results`;
            }, 3000);

        } catch (err) {
            console.error('Submission error:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit assessment');
            setStep('error');
        }
    };

    const getCurrentResponse = () => {
        const questionId = TIPI_QUESTIONS[currentQuestion].id;
        return responses.find(r => r.questionId === questionId)?.score;
    };

    const getQuestionResponse = (questionIndex: number) => {
        const questionId = TIPI_QUESTIONS[questionIndex].id;
        return responses.find(r => r.questionId === questionId)?.score;
    };

    const handleQuestionJump = (questionIndex: number) => {
        setCurrentQuestion(questionIndex);
    };

    const progress = (responses.length / TIPI_QUESTIONS.length) * 100;
    const isComplete = responses.length === TIPI_QUESTIONS.length;

    if (step === 'intro') {
        return (
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">{t('assessment.title')}</CardTitle>
                    <CardDescription className="text-lg">
                        {t('assessment.subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose prose-sm max-w-none">
                        <h3 className="text-xl font-semibold mb-4">{t('assessment.intro.purpose')}</h3>
                        <p className="text-muted-foreground mb-4">
                            {t('assessment.intro.description')}
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                            <li><strong>Extraversion:</strong> {t('assessment.intro.traits.extraversion')}</li>
                            <li><strong>Agreeableness:</strong> {t('assessment.intro.traits.agreeableness')}</li>
                            <li><strong>Conscientiousness:</strong> {t('assessment.intro.traits.conscientiousness')}</li>
                            <li><strong>Neuroticism:</strong> {t('assessment.intro.traits.neuroticism')}</li>
                            <li><strong>Openness:</strong> {t('assessment.intro.traits.openness')}</li>
                        </ul>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">{t('assessment.intro.instructions.title')}</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>{t('assessment.intro.instructions.items.0')}</li>
                                <li>{t('assessment.intro.instructions.items.1')}</li>
                                <li>{t('assessment.intro.instructions.items.2')}</li>
                                <li>{t('assessment.intro.instructions.items.3')}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="text-center">
                        <Button onClick={handleStartAssessment} size="lg" className="px-8">
                            {t('assessment.intro.startButton')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 'assessment') {
        const question = TIPI_QUESTIONS[currentQuestion];
        const currentResponse = getCurrentResponse();

        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <CardTitle>{t('assessment.questions.progress').replace('{current}', (currentQuestion + 1).toString()).replace('{total}', TIPI_QUESTIONS.length.toString())}</CardTitle>
                        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full mb-4" />

                    {/* Progress Overview */}
                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                            {TIPI_QUESTIONS.map((_, index) => {
                                const isAnswered = getQuestionResponse(index) !== undefined;
                                const isCurrent = index === currentQuestion;
                                const responseScore = getQuestionResponse(index);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleQuestionJump(index)}
                                        className={`
                                            relative w-10 h-10 rounded-full text-xs font-medium transition-all duration-200 
                                            hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                                            ${isCurrent
                                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 shadow-lg'
                                                : isAnswered
                                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                                    : 'bg-background text-muted-foreground hover:bg-accent border-2 border-border hover:border-primary/50'
                                            }
                                        `}
                                        title={`${t('assessment.questions.progress').replace('{current}', (index + 1).toString()).replace('{total}', '')}${isAnswered ? ` (${t('assessment.questions.answered')}: ${responseScore})` : ` (${t('assessment.questions.unanswered')})`}`}
                                    >
                                        {index + 1}
                                        {isAnswered && !isCurrent && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-primary ring-1 ring-primary ring-offset-1"></div>
                                <span>{t('assessment.questions.current')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>{t('assessment.questions.answered')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-background border-2 border-border"></div>
                                <span>{t('assessment.questions.unanswered')}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold mb-4">
                            {t('assessment.questions.prompt')}
                        </h3>
                        <p className="text-lg font-medium text-primary">
                            {getTipiQuestionText(question.id, locale)}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-center text-sm text-muted-foreground">
                            {t('assessment.questions.instruction')}
                        </p>

                        <RadioGroup
                            key={currentQuestion} // Force re-render when question changes
                            value={currentResponse?.toString() || ""}
                            onValueChange={(value) => handleResponse(parseInt(value))}
                            className="grid grid-cols-7 gap-2"
                        >
                            {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                                <div key={score} className="flex flex-col items-center space-y-2">
                                    <RadioGroupItem value={score.toString()} id={`score-${score}`} />
                                    <Label
                                        htmlFor={`score-${score}`}
                                        className="text-xs text-center cursor-pointer"
                                    >
                                        {t(`assessment.questions.scale.${score}`)}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {isComplete && (
                        <div className="flex justify-center pt-6">
                            <Button
                                onClick={handleSubmit}
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 px-8"
                            >
                                {t('assessment.questions.completeButton')}
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (step === 'submitting') {
        return (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <h3 className="text-xl font-semibold mb-2">{t('assessment.submitting.title')}</h3>
                    <p className="text-muted-foreground text-center">
                        {t('assessment.submitting.message')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (step === 'complete') {
        return (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">{t('assessment.completion.title')}</h3>
                    <p className="text-muted-foreground text-center mb-4">
                        {t('assessment.completion.message')}
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                        {t('assessment.completion.redirect')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (step === 'error') {
        return (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">{t('assessment.error.title')}</h3>
                    <p className="text-muted-foreground text-center mb-4">
                        {error || t('assessment.error.message')}
                    </p>
                    <Button onClick={() => setStep('assessment')}>
                        {t('assessment.error.retryButton')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null;
}