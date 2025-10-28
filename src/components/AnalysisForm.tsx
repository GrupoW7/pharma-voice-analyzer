import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AnalysisFormProps {
  onSubmit: (data: AnalysisFormData) => void;
  isLoading: boolean;
}

export interface AnalysisFormData {
  salesperson: string;
  product: string;
  objective: string;
  transcript: string;
}

const AnalysisForm = ({ onSubmit, isLoading }: AnalysisFormProps) => {
  const [formData, setFormData] = useState<AnalysisFormData>({
    salesperson: "",
    product: "",
    objective: "",
    transcript: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.salesperson && formData.product && formData.objective && formData.transcript;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Análise de Performance de Vendas</CardTitle>
        <CardDescription>
          Insira os detalhes do vídeo para receber uma análise detalhada baseada no modelo AIDA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="salesperson">Nome do Vendedor</Label>
            <Input
              id="salesperson"
              value={formData.salesperson}
              onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
              placeholder="Ex: João Silva"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Produto/Tema</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              placeholder="Ex: Medicamento XYZ"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo do Vídeo</Label>
            <Input
              id="objective"
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              placeholder="Ex: Apresentação de produto para médicos"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">Transcrição Completa</Label>
            <Textarea
              id="transcript"
              value={formData.transcript}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
              placeholder="Cole aqui a transcrição completa do vídeo de vendas..."
              className="min-h-[200px] resize-y"
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar Vídeo"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AnalysisForm;
