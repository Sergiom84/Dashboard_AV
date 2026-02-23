import { useState } from 'react';
import type { TendenciasData } from '@/hooks/useTendenciasData';
import { generateWeeklySpeech } from '@/lib/tendenciasAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquareText, Copy, Check } from 'lucide-react';

interface SpeechGeneratorProps {
  data: TendenciasData;
  selectedWeek: number;
}

export default function SpeechGenerator({ data, selectedWeek }: SpeechGeneratorProps) {
  const [format, setFormat] = useState<'Sergio' | 'Carlos'>('Sergio');
  const [speech, setSpeech] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const text = generateWeeklySpeech(data, selectedWeek, format);
    setSpeech(text);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(speech);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = speech;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="chart-container border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText size={20} className="text-primary" />
          Generador de Speech — Semana {selectedWeek}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Genera el informe completo (5 tipos de soporte) para la reunión semanal
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Badge
              variant={format === 'Sergio' ? 'default' : 'outline'}
              className="cursor-pointer py-1.5 px-4"
              onClick={() => setFormat('Sergio')}
            >
              Sergio
            </Badge>
            <Badge
              variant={format === 'Carlos' ? 'default' : 'outline'}
              className="cursor-pointer py-1.5 px-4"
              onClick={() => setFormat('Carlos')}
            >
              Carlos
            </Badge>
          </div>
          <Button onClick={handleGenerate} variant="default">
            Generar Speech
          </Button>
        </div>

        {speech && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={speech}
                readOnly
                className="w-full h-80 p-4 text-sm bg-background border border-border rounded-lg resize-y font-mono leading-relaxed"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                {copied ? <Check size={14} className="mr-1 text-green-600" /> : <Copy size={14} className="mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
