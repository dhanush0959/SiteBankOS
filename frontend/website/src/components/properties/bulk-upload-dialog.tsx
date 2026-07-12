'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBulkUploadProperty, type BulkUploadResult } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';

interface BulkUploadDialogProps {
  onClose: () => void;
}

export function BulkUploadDialog({ onClose }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { mutate: upload, isPending } = useBulkUploadProperty();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an Excel (.xlsx, .xls) or CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    upload(file, {
      onSuccess: (data) => {
        setResult(data);
        if (data.success > 0) {
          toast({
            title: 'Upload Complete',
            description: `Successfully uploaded ${data.success} properties.`,
          });
        }
      },
      onError: (err: any) => {
        toast({
          title: 'Upload Failed',
          description: err.message || 'Something went wrong during the upload.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl shadow-2xl border-primary/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <CardHeader className="relative border-b bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Bulk Property Upload
          </CardTitle>
          <CardDescription>
            Upload an Excel or CSV file to add multiple properties at once.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {!result ? (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                  ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-4 rounded-full ${file ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <FileText className="h-8 w-8" />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-semibold text-lg">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-lg">Click to select or drag and drop</p>
                      <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, and .csv</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg border border-primary/5">
                <div className="text-sm">
                  <p className="font-medium">Need a template?</p>
                  <p className="text-muted-foreground">Download our standard format to ensure data matches perfectly.</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/templates/property_import_template.xlsx" download>Download Template</a>
                </Button>
              </div>

              {/* Formatting Guide */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Import Guide</h4>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <p className="font-bold">Required Columns</p>
                    <p className="text-muted-foreground">title, address, city</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">Smart Location</p>
                    <p className="text-muted-foreground">googleMapsLink (extracts coordinates automatically)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!file || isPending} className="min-w-[120px]">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Start Upload'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Rows</p>
                  <p className="text-3xl font-bold text-primary">{result.total}</p>
                </div>
                <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-green-600">Success</p>
                  <p className="text-3xl font-bold text-green-600">{result.success}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-red-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Error Summary
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto border rounded-lg bg-red-50/30">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold">Row</th>
                          <th className="text-left p-2 font-semibold">Title</th>
                          <th className="text-left p-2 font-semibold">Issue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-muted/50">
                            <td className="p-2 font-medium">{err.row}</td>
                            <td className="p-2 truncate max-w-[150px]">{err.title}</td>
                            <td className="p-2 text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.success > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 rounded-lg border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm">
                    <strong>{result.success}</strong> properties have been added to your inventory.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={onClose} className="w-full sm:w-auto">Finish</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
