"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormInput } from "@/components/ui/form-field"
import { FormActions } from "@/components/ui/form-actions"
import { Badge } from "@/components/ui/badge"

export function DesignSystemDocs() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sistema de Design - Controle Financeiro</h1>
        <p className="text-muted-foreground">
          Documentação dos padrões de UI/UX para manter consistência em toda a aplicação.
        </p>
      </div>

      {/* Formulários */}
      <Card>
        <CardHeader>
          <CardTitle>Padrões de Formulários</CardTitle>
          <CardDescription>Componentes e padrões para formulários consistentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Campos de Formulário</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                id="example-input"
                label="Campo de Texto"
                placeholder="Digite algo..."
                value=""
                onChange={() => {}}
                required
              />
              <FormInput
                id="example-input-error"
                label="Campo com Erro"
                placeholder="Digite algo..."
                value=""
                onChange={() => {}}
                error="Este campo é obrigatório"
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Ações de Formulário</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Layout Horizontal</h4>
                <FormActions
                  onCancel={() => {}}
                  onSubmit={() => {}}
                  submitText="Salvar"
                  cancelText="Cancelar"
                  layout="horizontal"
                />
              </div>
              <div>
                <h4 className="font-medium mb-2">Layout Vertical</h4>
                <FormActions
                  onCancel={() => {}}
                  onSubmit={() => {}}
                  submitText="Salvar"
                  cancelText="Cancelar"
                  layout="vertical"
                />
              </div>
              <div>
                <h4 className="font-medium mb-2">Estado de Carregamento</h4>
                <FormActions
                  onCancel={() => {}}
                  onSubmit={() => {}}
                  submitText="Salvar"
                  cancelText="Cancelar"
                  isSubmitting={true}
                  layout="horizontal"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cores e Estados */}
      <Card>
        <CardHeader>
          <CardTitle>Cores e Estados</CardTitle>
          <CardDescription>Paleta de cores e estados visuais padronizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <h4 className="font-medium">Sucesso</h4>
              <div className="h-12 bg-emerald-500 rounded flex items-center justify-center text-white">Emerald 500</div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Sucesso
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Erro</h4>
              <div className="h-12 bg-red-500 rounded flex items-center justify-center text-white">Red 500</div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Erro
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Aviso</h4>
              <div className="h-12 bg-amber-500 rounded flex items-center justify-center text-white">Amber 500</div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Aviso
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Info</h4>
              <div className="h-12 bg-blue-500 rounded flex items-center justify-center text-white">Blue 500</div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Info
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Espaçamento */}
      <Card>
        <CardHeader>
          <CardTitle>Espaçamento</CardTitle>
          <CardDescription>Padrões de espaçamento para consistência visual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Espaçamento entre campos de formulário</h4>
              <code className="bg-muted px-2 py-1 rounded text-sm">space-y-4</code>
            </div>
            <div>
              <h4 className="font-medium mb-2">Espaçamento interno de cards</h4>
              <code className="bg-muted px-2 py-1 rounded text-sm">p-4 ou p-6</code>
            </div>
            <div>
              <h4 className="font-medium mb-2">Espaçamento entre seções</h4>
              <code className="bg-muted px-2 py-1 rounded text-sm">space-y-6</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acessibilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Acessibilidade</CardTitle>
          <CardDescription>Diretrizes para garantir acessibilidade em todos os componentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Labels e Campos</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  Sempre usar <code>htmlFor</code> nos labels correspondendo ao <code>id</code> do campo
                </li>
                <li>
                  Marcar campos obrigatórios com asterisco (*) e <code>aria-label="obrigatório"</code>
                </li>
                <li>
                  Usar <code>aria-invalid</code> para campos com erro
                </li>
                <li>
                  Usar <code>aria-describedby</code> para associar mensagens de erro
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Feedback e Notificações</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  Usar <code>role="alert"</code> para mensagens de erro
                </li>
                <li>
                  Usar <code>aria-live="polite"</code> para atualizações não urgentes
                </li>
                <li>
                  Usar <code>aria-live="assertive"</code> para atualizações urgentes
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Navegação</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Garantir que todos os elementos interativos sejam acessíveis via teclado</li>
                <li>
                  Usar <code>aria-label</code> para botões com apenas ícones
                </li>
                <li>Implementar foco visível em todos os elementos interativos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Uso</CardTitle>
          <CardDescription>Exemplos práticos de como usar os componentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Formulário Básico</h4>
              <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                {`// Exemplo de uso do useItemForm com validação
const { formData, formErrors, handleInputChange, handleSubmit, isSubmitting } = useItemForm({
  initialState: { name: "", amount: 0 },
  validateFunction: createValidator(commonValidationSchemas.asset),
  onSubmitCallback: async (data) => {
    await saveData(data);
    toast.success("Item salvo com sucesso!");
  }
});

// No JSX
<form onSubmit={handleSubmit}>
  <FormInput
    id="name"
    label="Nome"
    value={formData.name}
    onChange={handleInputChange}
    error={formErrors.name}
    required
  />
  <FormActions
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
    submitText="Salvar"
  />
</form>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
