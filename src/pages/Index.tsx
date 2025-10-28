import { useState } from "react";
import { toast } from "sonner";
import AnalysisForm, { AnalysisFormData } from "@/components/AnalysisForm";
import AnalysisReport from "@/components/AnalysisReport";
import { supabase } from "@/integrations/supabase/client";
import { FileVideo, Brain } from "lucide-react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async (data: AnalysisFormData) => {
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-sales-video', {
        body: {
          salesperson: data.salesperson,
          product: data.product,
          objective: data.objective,
          transcript: data.transcript,
        },
      });

      if (error) {
        console.error('Erro ao analisar:', error);
        toast.error('Erro ao processar análise. Tente novamente.');
        return;
      }

      if (result?.analysis) {
        setAnalysisResult(result.analysis);
        toast.success('Análise concluída com sucesso!');
      } else {
        toast.error('Nenhuma análise retornada.');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Analista de Performance de Vendas IA
              </h1>
              <p className="text-muted-foreground">
                Coaching inteligente para a indústria farmacêutica
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {!analysisResult ? (
            <div className="space-y-6">
              <div className="text-center space-y-4 mb-12">
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-2xl">
                    <FileVideo className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Análise Avançada de Vídeos de Vendas
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Receba feedback profissional e acionável baseado no modelo AIDA e critérios
                  comportamentais comprovados para melhorar suas apresentações de vendas.
                </p>
              </div>
              <AnalysisForm onSubmit={handleAnalyze} isLoading={isLoading} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Resultado da Análise</h2>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Nova Análise
                </button>
              </div>
              <AnalysisReport report={analysisResult} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Focado em resultados práticos e mensuráveis</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
