import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { contractService } from "@/services/contractService";
import { FileText, Plus, Edit, Eye, Copy, CheckCircle, XCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ContractTemplate = Tables<"contract_templates">;

export default function TemplatesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    documentType: "enrollment_contract",
    templateContent: "",
  });

  const mergeFields = contractService.getMergeFields();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const data = await contractService.getTemplates();
    setTemplates(data);
  }

  function insertMergeField(fieldName: string) {
    setFormData(prev => ({
      ...prev,
      templateContent: prev.templateContent + `{{${fieldName}}}`,
    }));
  }

  async function handleCreate() {
    if (!formData.name || !formData.templateContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { template, error } = await contractService.createTemplate({
        name: formData.name,
        documentType: formData.documentType,
        templateContent: formData.templateContent,
      });

      if (error) throw error;

      toast({
        title: "Template Created",
        description: "Contract template has been created successfully",
      });

      setShowCreateDialog(false);
      setFormData({ name: "", documentType: "enrollment_contract", templateContent: "" });
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!selectedTemplate || !formData.name || !formData.templateContent) return;

    setLoading(true);
    try {
      const { template, error } = await contractService.updateTemplate(selectedTemplate.id, {
        name: formData.name,
        documentType: formData.documentType,
        templateContent: formData.templateContent,
      });

      if (error) throw error;

      toast({
        title: "Template Updated",
        description: "Contract template has been updated successfully",
      });

      setShowEditDialog(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(template: ContractTemplate) {
    setLoading(true);
    try {
      await contractService.updateTemplate(template.id, {
        isActive: !template.is_active,
      });

      toast({
        title: template.is_active ? "Template Deactivated" : "Template Activated",
        description: `Template has been ${template.is_active ? "deactivated" : "activated"}`,
      });

      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openEdit(template: ContractTemplate) {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      documentType: template.document_type,
      templateContent: template.template_content,
    });
    setShowEditDialog(true);
  }

  function openPreview(template: ContractTemplate) {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  }

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    inactive: templates.filter(t => !t.is_active).length,
  };

  return (
    <>
      <SEO 
        title="Contract Templates - Admin"
        description="Manage contract and agreement templates with merge fields"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Contract Templates</h1>
              <p className="text-slate-600">Create and manage contract templates with merge fields</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-600">{stats.inactive}</div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {template.document_type.replace(/_/g, " ")}
                        </Badge>
                        {template.is_active ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPreview(template)}>
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(template)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={template.is_active ? "ghost" : "default"}
                      onClick={() => toggleActive(template)}
                      disabled={loading}
                    >
                      {template.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No contract templates yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedTemplate(null);
          setFormData({ name: "", documentType: "enrollment_contract", templateContent: "" });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? "Edit" : "Create"} Contract Template</DialogTitle>
            <DialogDescription>
              Use merge fields to auto-populate contract details from booking data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Course Enrollment Agreement"
                />
              </div>
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger id="documentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrollment_contract">Enrollment Contract</SelectItem>
                    <SelectItem value="liability_waiver">Liability Waiver</SelectItem>
                    <SelectItem value="terms_of_service">Terms of Service</SelectItem>
                    <SelectItem value="consent_form">Consent Form</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Available Merge Fields</Label>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg mb-2">
                {mergeFields.map((field) => (
                  <Button
                    key={field.name}
                    size="sm"
                    variant="outline"
                    onClick={() => insertMergeField(field.name)}
                    title={field.description}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {field.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Click a field to insert it into your template. Use the format {"{{"} field_name {"}}"}
              </p>
            </div>

            <div>
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                value={formData.templateContent}
                onChange={(e) => setFormData({ ...formData, templateContent: e.target.value })}
                placeholder={"ENROLLMENT AGREEMENT\n\nThis agreement is made between:\nTraining Centre (Provider)\nand\n{{student_name}} (Student)\n\nCourse: {{course_name}} ({{course_code}})\nStart Date: {{class_start_date}}\nLocation: {{location}}\n\nTotal Fee: ${{total_amount}}\n\nBy signing this agreement, the student agrees to..."}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={showEditDialog ? handleUpdate : handleCreate}
              disabled={loading}
              className="w-full"
            >
              {showEditDialog ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview showing merge field placeholders (actual values filled at generation)
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="bg-white p-8 border rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedTemplate.template_content}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}