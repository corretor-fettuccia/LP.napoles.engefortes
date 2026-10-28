NÁPOLES – correções de navegação agêntica (28/10/2026)

Correções: IDs contato duplicados (agora somente o formulário final usa #contato), nome acessível do botão de planta, link de salto, catálogo ARD nos caminhos legado e atual, Agentmap no robots.txt, aprimoramento progressivo de nomes de campos para formulários criados pelo JS.

IMPORTANTE: Publicar TODOS os arquivos na raiz do domínio (incluindo a pasta OCULTA .well-known). GitHub Pages exige que .well-known seja publicado; arquivo .nojekyll incluído. Validar HTTP 200 e application/json em /.well-known/ai-catalog.json e /.well-known/ard.json.

O catálogo possui entries=[] intencionalmente: site não expõe servidor MCP/A2A público real; não se devem anunciar ferramentas inexistentes. O WebMCP imperativo segue em assets/js/agentic.js; os formulários são gerados por site.js.

Verificar em Chrome compatível, Lighthouse categoria Navegação Agêntica após publicar. A aprovação não pode ser garantida por inspeção estática.
