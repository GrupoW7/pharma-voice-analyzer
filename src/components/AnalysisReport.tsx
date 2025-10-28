import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface AnalysisReportProps {
  report: string;
}

const AnalysisReport = ({ report }: AnalysisReportProps) => {
  // Parse the report to extract structured data
  const parseScore = (section: string): number => {
    const match = report.match(new RegExp(`${section}[:\\s]*(\\d+(?:\\.\\d+)?)`));
    return match ? parseFloat(match[1]) : 0;
  };

  const overallScore = parseScore("Nota Geral");
  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const extractSection = (sectionName: string): string => {
    const regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
    const match = report.match(regex);
    return match ? match[1].trim() : "";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overall Score Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle className="text-3xl">Nota Geral</CardTitle>
          </div>
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)} mb-2`}>
            {overallScore.toFixed(1)}
          </div>
          <Progress value={overallScore * 20} className="h-3 mb-2" />
          <CardDescription>
            {overallScore >= 4 && "Excelente desempenho!"}
            {overallScore >= 3 && overallScore < 4 && "Bom desempenho, com espaço para melhoria"}
            {overallScore < 3 && "Requer melhorias significativas"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Strengths Section */}
      {extractSection("Pontos Fortes") && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-xl text-green-800">Pontos Fortes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {extractSection("Pontos Fortes").split('\n').map((line, idx) => (
                line.trim() && <p key={idx} className="text-green-900 mb-2">{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {extractSection("Pontos de Melhoria") && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-xl text-amber-800">Pontos de Melhoria</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {extractSection("Pontos de Melhoria").split('\n').map((line, idx) => (
                line.trim() && <p key={idx} className="text-amber-900 mb-2">{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Relatório Completo</CardTitle>
          <CardDescription>Análise detalhada baseada no modelo AIDA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {report}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisReport;
