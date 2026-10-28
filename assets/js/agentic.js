/* IMOBIFY: Progressive WebMCP support, exported pages only. No auto-submission of leads. */
(function () {
  'use strict';
  if (window.__IMOBIFY_EDITOR__) return;
  const labelFor = (field) => {
    const id = field.id;
    const labelled = id && Array.from(document.querySelectorAll('label[for]')).find(x => x.htmlFor === id);
    return (field.getAttribute('toolparamdescription') || field.getAttribute('aria-label') || labelled?.textContent || field.closest('label')?.textContent || field.placeholder || field.name || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  };
  function annotateForms() {
    const used = new Set();
    document.querySelectorAll('form[toolname]').forEach(f => { if (f.getAttribute('toolname')) used.add(f.getAttribute('toolname')); });
    document.querySelectorAll('form').forEach((form, index) => {
      // Do not register unrecognized or programmatic-only forms without fields.
      const fields = Array.from(form.querySelectorAll('input,select,textarea')).filter(f => !['hidden','button','submit','reset','image'].includes(f.type) && !f.disabled);
      if (!fields.length) return;
      const existingName = form.getAttribute('toolname');
      const existingDescription = form.getAttribute('tooldescription');
      if ((existingName && !existingDescription) || (!existingName && existingDescription)) return;
      // Required unnamed fields would invalidate WebMCP; do not advertise such a form.
      if (fields.some(f => f.required && !f.name)) return;
      if (fields.some(f => !f.name)) return;
      if (fields.some(f => !labelFor(f))) return;
      fields.forEach(f => { if (!f.hasAttribute('toolparamdescription')) f.setAttribute('toolparamdescription', labelFor(f)); });
      if (!existingName) {
        const base = (form.id || form.dataset.plugin || form.getAttribute('name') || 'lead_form_'+(index+1)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_]/g,'_').replace(/^([^a-zA-Z_])/,'_$1').slice(0,55);
        let name = 'imobify_'+base; let n = 2;
        while (used.has(name)) name = 'imobify_'+base+'_'+n++;
        used.add(name);
        form.setAttribute('tooldescription', 'Preencher o formulário de contato ou solicitação do empreendimento. O envio exige confirmação do visitante.');
        form.setAttribute('toolname', name);
      }
      // Never use toolautosubmit on lead or appointment forms.
      form.removeAttribute('toolautosubmit');
    });
  }
  function registerInformationTool() {
    const context = document.modelContext || navigator.modelContext;
    if (!context || typeof context.registerTool !== 'function') return;
    try {
      context.registerTool({
        name: 'consultar_informacoes_empreendimento',
        description: 'Consulta título, resumo, endereço público da página e seções informativas deste empreendimento; não envia dados ou formulários.',
        inputSchema: {type:'object', properties:{}, additionalProperties:false},
        execute: async () => ({
          title: document.title,
          url: location.href,
          description: document.querySelector('meta[name="description"]')?.content || '',
          sections: Array.from(document.querySelectorAll('main h1,main h2,main h3')).slice(0,40).map(e => e.textContent.trim()).filter(Boolean)
        })
      });
    } catch (error) { console.warn('[Imobify WebMCP] Registro indisponível:', error); }
  }
  function enhanceDynamicForms() {
    document.querySelectorAll('form').forEach((form) => {
      // Prefer existing accessible names; avoid injecting visual labels.
      Array.from(form.querySelectorAll('input, select, textarea')).forEach((field) => {
        if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') return;
        if (!field.id && field.name) field.id = 'agent-field-' + field.name.replace(/[^a-zA-Z0-9_-]/g, '-');
        if (!field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby') && !field.labels?.length) {
          const accessible = field.getAttribute('toolparamdescription') || field.placeholder || field.name;
          if (accessible) field.setAttribute('aria-label', accessible);
        }
        if (!field.name && field.id) field.setAttribute('name', field.id);
      });
    });
  }
  const start = () => {
    enhanceDynamicForms();
    annotateForms();
    registerInformationTool();
    if (typeof MutationObserver !== 'undefined') {
      let scheduled = false;
      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; enhanceDynamicForms(); annotateForms(); });
      });
      observer.observe(document.body, {subtree:true, childList:true});
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
