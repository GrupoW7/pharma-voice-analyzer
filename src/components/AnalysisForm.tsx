import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Video } from "lucide-react";
import { toast } from "sonner";

interface AnalysisFormProps {
  onSubmit: (data: AnalysisFormData) => void;
  isLoading: boolean;
}

export interface AnalysisFormData {
  salesperson: string;
  product: string;
  objective: string;
  videoBase64: string;
  mimeType: string;
  fileName: string;
}

const AnalysisForm = ({ onSubmit, isLoading }: AnalysisFormProps) => {
  const [formData, setFormData] = useState<AnalysisFormData>({
    salesperson: "",
    product: "",
    objective: "",
    videoBase64: "",
    mimeType: "",
    fileName: "",
  });
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato de vídeo não suportado. Use MP4, WebM, MOV ou AVI.");
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error("Vídeo muito grande. Tamanho máximo: 100MB.");
      return;
    }

    setUploadProgress("Carregando vídeo...");

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1]; // Remove data URL prefix
        
        setFormData({
          ...formData,
          videoBase64: base64Data,
          mimeType: file.type,
          fileName: file.name,
        });
        setUploadProgress("");
        toast.success("Vídeo carregado com sucesso!");
      };
      reader.onerror = () => {
        toast.error("Erro ao carregar vídeo.");
        setUploadProgress("");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar vídeo:", error);
      toast.error("Erro ao processar vídeo.");
      setUploadProgress("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.salesperson && formData.product && formData.objective && formData.videoBase64;

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
            <Label htmlFor="video">Vídeo de Vendas</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="video"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                onChange={handleVideoUpload}
                disabled={isLoading}
                className="hidden"
              />
              <label
                htmlFor="video"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                {formData.videoBase64 ? (
                  <>
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Video className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{formData.fileName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique para trocar o vídeo
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-muted p-4 rounded-full">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {uploadProgress || "Clique para fazer upload do vídeo"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        MP4, WebM, MOV ou AVI (máx. 100MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>
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
                Transcrevendo e analisando...
              </>
            ) : (
              "Analisar Vídeo"
            )}
          </Button>
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center">
              Este processo pode levar de 1 a 3 minutos dependendo do tamanho do vídeo
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default AnalysisForm;
