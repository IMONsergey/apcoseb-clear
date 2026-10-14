/* Apcosys API product animation. Noninteractive DOM / SVG / GSAP. No network requests. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.customElements) return;
  if (window.customElements.get('api-developer-demo')) return;

  let sharedGSAP = null;
  const instances = new Set();
  // Exact composition ratio of the supplied 2048 × 1511 reference.
  const FRAME = Object.freeze({ width: 1440, height: 1440 * 1511 / 2048 });
  const dataset = { id: 'ds_01H8Z6K3F9Q2', name: 'Revenue Transactions', status: 'ready', rows: 128450 };
  const listResponse = { data: [dataset], total: 1 };
  const detailResponse = { ...dataset, updated_at: '2026-10-05T14:12:09Z' };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paths = {
    chevron: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    copy: '<rect x="9" y="9" width="11" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    spinner: '<path d="M20 12a8 8 0 1 1-8-8"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  const highlightedJSON = object => JSON.stringify(object, null, 2).split('\n').map((line, i) => {
    const tokens = escape(line).replace(/(&quot;.*?&quot;)(\s*:)?|\b(\d+|true|false|null)\b/g, (match, str, colon, number) => str ? `<span class="${colon ? 'code-key' : 'code-string'}">${str}</span>${colon || ''}` : `<span class="code-number">${number}</span>`);
    return `<div class="code-line json-line"><span class="line-number" aria-hidden="true">${i + 1}</span><span class="code-text">${tokens}</span></div>`;
  }).join('');

  const styles = `
    :host{aspect-ratio:2048/1511;pointer-events:none;user-select:none;-webkit-user-select:none;display:block;width:100%;color:var(--api-c-172126,#172126);background:var(--api-c-ffffff,#fff);--api-accent:var(--api-c-008fa3,#008fa3);--api-accent-solid:var(--api-c-0799ae,#0799ae);--api-font:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;--api-mono:"SFMono-Regular",Consolas,"Liberation Mono",monospace}
    :host([fit="contain"]){height:100%;min-height:0;aspect-ratio:auto}
    *,*::before,*::after{box-sizing:border-box;pointer-events:none;user-select:none;-webkit-user-select:none}
    [hidden]{display:none!important}
    .viewport{width:100%;aspect-ratio:2048/1511;position:relative;overflow:hidden}
    .sizer{container-type:inline-size;container-name:apco-api;position:absolute;left:0;top:0;width:${FRAME.width}px;height:${FRAME.height}px;transform-origin:0 0}
    :host([fit="contain"]) .viewport{height:100%;aspect-ratio:auto}
    .shell{position:relative;height:100%;display:grid;grid-template-columns:25.1% minmax(0,1fr);background:var(--api-c-ffffff,#fff);font:clamp(14px,1.181cqw,17px)/1.5 var(--api-font);isolation:isolate;text-align:left;overflow:clip}
    button,input{font:inherit;color:inherit}
    button{cursor:default;background:none;border:0;padding:0;text-align:inherit}
    button:disabled{cursor:default}
    svg{display:block;width:20px;height:20px;flex:none}
    .sidebar{min-width:0;padding:clamp(22px,2.08cqw,30px);background:var(--api-c-fbfcfc,#fbfcfc);border-right:1px solid var(--api-c-e7ecee,#e7ecee)}
    .sidebar-top{display:flex;justify-content:space-between;align-items:center;min-height:28px;margin-bottom:clamp(18px,2.2cqw,32px)}
    .api-label{font-size:.83em;letter-spacing:.16em;color:var(--api-c-727d82,#727d82)}
    .group-title{display:flex;align-items:center;gap:12px;font-weight:600;font-size:1.05em;margin-bottom:18px}
    .group-title svg{width:16px;height:16px}
    .endpoints{position:relative;display:grid;gap:5px;margin-inline:-5px}
    .nav-highlight{position:absolute;inset:0 0 auto;height:50px;background:var(--api-c-e9f7f8,#e9f7f8);border-radius:7px;pointer-events:none}
    .nav-item{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:50px;padding:11px 15px 11px 35px;border-radius:7px;font-size:1.04em;white-space:nowrap}
    .nav-item .verb{font-size:.81em;font-weight:600;color:var(--api-c-727d82,#727d82);letter-spacing:.01em}
    .nav-item[aria-current="page"] .verb{color:var(--api-accent)}
    .passive{color:var(--api-c-455054,#455054)}
    .other-groups{display:grid;gap:25px;margin-top:47px}
    .other-groups .group-title{margin:0}
    .main{min-width:0;min-height:0;height:100%;display:grid;grid-template-rows:116px 65px 294px 191px minmax(0,1fr);padding:clamp(26px,2.64cqw,38px) clamp(24px,3.2cqw,46px) clamp(26px,2.64cqw,38px)}
    .header{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:80px 26px;align-items:start;gap:10px 20px;min-height:0}
    .endpoint-heading{display:flex;align-items:flex-start;gap:clamp(16px,2cqw,29px);min-width:0}
    .method{display:inline-flex;align-items:center;justify-content:center;flex:none;background:var(--api-accent-solid);color:var(--api-c-ffffff,#fff);border-radius:6px;width:clamp(54px,5.76cqw,83px);height:39px;font-size:.94em;font-weight:650;line-height:1;margin-top:9px}
    .route-stack{min-width:0;padding-top:3px}
    h1{font-size:clamp(25px,2.91cqw,42px);font-weight:500;letter-spacing:-.035em;line-height:1.25;margin:0;overflow-wrap:anywhere}
    .route-suffix{display:block;font:400 14px/1.6 var(--api-mono);letter-spacing:0;color:var(--api-c-727d82,#727d82);min-height:1.6em}
    .description{grid-column:1/-1;color:var(--api-c-727d82,#727d82);margin:0;min-height:1.5em;margin-top:0;align-self:end;font-size:1em}
    .send{display:flex;align-items:center;justify-content:space-between;gap:20px;min-width:clamp(154px,13.05cqw,188px);min-height:54px;padding:12px 20px;background:var(--api-accent-solid);color:var(--api-c-ffffff,#fff);border-radius:6px;font-size:1em;transition:background .2s ease}
    .send .send-icon{position:relative;width:20px;height:20px}
    .send .spinner{display:none}
    .send[data-busy="true"] .arrow{display:none}
    .send[data-busy="true"] .spinner{display:block}
    .tabs{position:relative;display:flex;align-items:stretch;gap:clamp(20px,2.4cqw,35px);border-bottom:1px solid var(--api-c-e7ecee,#e7ecee);margin:14px 0 0}
    .tab{position:relative;padding:10px 0 12px;color:var(--api-c-727d82,#727d82);white-space:nowrap;font-size:1em}
    .tab[aria-selected="true"]{color:var(--api-c-172126,#172126);font-weight:600}
    .tab-underline{position:absolute;bottom:-1px;height:3px;width:98px;border-radius:2px;background:var(--api-accent-solid);pointer-events:none}
    .panels{position:relative;display:grid;min-height:0;border-bottom:1px solid var(--api-c-e7ecee,#e7ecee)}
    .panel{grid-area:1/1;min-width:0;min-height:0;padding:26px 0 21px;visibility:hidden;opacity:0;pointer-events:none}
    .panel.active{visibility:visible;opacity:1}
    .panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
    h2{font-size:1.05em;font-weight:600;line-height:1.4;margin:0}
    .add-param{display:flex;align-items:center;gap:8px;color:var(--api-accent);font-size:.94em}
    .add-param svg{width:17px;height:17px}
    .column-labels,.param-row{display:grid;grid-template-columns:18% 17.6% minmax(0,1fr) 22%;gap:clamp(10px,1.5cqw,22px);align-items:center}
    .column-labels{color:var(--api-c-727d82,#727d82);font-size:.75em;letter-spacing:.06em;margin-bottom:14px}
    .param-row+.param-row{margin-top:13px}
    .param-name,.param-type{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--api-c-dce4e7,#dce4e7);border-radius:6px;min-height:46px;padding:9px 15px;min-width:0}
    .param-type svg{width:15px;height:15px;color:var(--api-c-727d82,#727d82)}
    .param-description{min-width:0;color:var(--api-c-727d82,#727d82);font-size:.94em;line-height:1.4}
    .field{position:relative;min-width:0;border-radius:6px}
    .field input{display:block;width:100%;min-width:0;background:var(--api-c-ffffff,#fff);border:1px solid var(--api-c-dce4e7,#dce4e7);border-radius:6px;min-height:46px;padding:9px 15px;transition:border-color .25s,box-shadow .25s;font-size:1em}
    .field input::placeholder{color:var(--api-c-7f8b90,#7f8b90);opacity:1}
    .field[data-focused="true"] input{border-color:var(--api-accent);box-shadow:0 0 0 3px var(--api-c-008fa310,#008fa310)}
    .field input[data-id]{font-family:var(--api-mono);font-size:.85em;padding-inline:12px}
    .caret{position:absolute;top:12px;left:15px;width:1.5px;height:22px;background:var(--api-accent);opacity:0;pointer-events:none}
    .input-measure{position:absolute;visibility:hidden;white-space:pre;font:inherit}
    .auth-grid{display:grid;grid-template-columns:minmax(140px,.35fr) minmax(0,1fr);gap:30px}
    .field-label{display:block;color:var(--api-c-727d82,#727d82);font-size:.75em;letter-spacing:.06em;margin-bottom:14px}
    .connected{display:flex;align-items:center;gap:9px;margin-top:26px;font-size:.94em}
    .connected svg{width:16px;height:16px;color:var(--api-c-25965a,#25965a)}
    .auth-note{margin:14px 0 0;color:var(--api-c-727d82,#727d82);font-size:.94em;line-height:1.5}
    .headers-table{display:grid;grid-template-columns:1fr 1.4fr;gap:16px;color:var(--api-c-727d82,#727d82);font-size:.94em}
    .headers-table .value{color:var(--api-c-172126,#172126);overflow-wrap:anywhere;font-family:var(--api-mono);font-size:.9em}
    .example-note{margin:0 0 18px;color:var(--api-c-727d82,#727d82);font-size:.94em}
    .section-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:18px 0 10px;min-height:28px;flex:none}
    .section-title{display:flex;align-items:center;flex-wrap:wrap;gap:22px;min-width:0}
    .section-tools{display:flex;align-items:center;gap:20px;color:var(--api-c-727d82,#727d82);font-size:.84em}
    .language{display:flex;align-items:center;gap:14px}
    .language svg{width:14px;height:14px}
    .copy{display:grid;place-items:center;width:28px;height:28px;border-radius:5px;color:var(--api-c-253034,#253034)}
    .copy svg{width:17px;height:17px}
    .copy .check{display:none;color:var(--api-accent)}
    .copy[data-copied="true"] .copy-icon{display:none}
    .copy[data-copied="true"] .check{display:block}
    .code-box{position:relative;background:var(--api-c-f5f7f8,#f5f7f8);border:1px solid var(--api-c-f0f3f4,#f0f3f4);border-radius:8px;min-width:0;overflow:hidden}
    .main>section{display:flex;flex-direction:column;min-height:0}
    .request-code{padding:14px 22px;min-height:0;flex:1}
    .code-line{display:grid;grid-template-columns:20px minmax(0,1fr);gap:24px;min-height:21px;font:14px/1.5 var(--api-mono);font-variant-ligatures:none}
    .code-text{white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}
    .line-number{font:400 .88em/1.8 var(--api-font);color:var(--api-c-89959b,#89959b);text-align:right;user-select:none}
    .code-key,.code-string,.code-value{color:var(--api-accent)}
    .code-number{color:var(--api-c-37565f,#37565f)}
    .status{display:flex;align-items:center;gap:9px;font-size:.95em;color:var(--api-c-727d82,#727d82)}
    .status-mark{position:relative;width:12px;height:12px;flex:none}
    .status-dot{position:absolute;left:2px;top:2px;width:8px;height:8px;border-radius:50%;background:var(--api-c-c4ccd0,#c4ccd0)}
    .status-spin{width:12px;height:12px;opacity:0;color:var(--api-accent)}
    .status[data-state="sending"] .status-dot{opacity:0}
    .status[data-state="sending"] .status-spin{opacity:1}
    .status[data-state="success"]{color:var(--api-c-243b30,#243b30)}
    .status[data-state="success"] .status-dot{background:var(--api-c-27a363,#27a363)}
    .timing{color:var(--api-c-7f8b90,#7f8b90);font-size:.84em;font-variant-numeric:tabular-nums;opacity:0}
    .response-body{display:grid;min-height:0;flex:1;padding:14px 22px}
    .response-code,.response-empty,.skeleton{grid-area:1/1;min-width:0}
    .response-code{visibility:hidden;opacity:0;pointer-events:none}
    .response-empty{align-self:center;justify-self:center;color:var(--api-c-88969b,#88969b);font-size:.85em}
    .skeleton{display:grid;align-content:start;gap:16px;padding:7px 0 0 44px;visibility:hidden;opacity:0}
    .skeleton i{display:block;height:10px;border-radius:3px;background:var(--api-c-e2e8ea,#e2e8ea);width:65%}
    .skeleton i:nth-child(2){width:81%;background:var(--api-c-e9edef,#e9edef)}
    .skeleton i:nth-child(3){width:51%}
    .skeleton i:nth-child(4){width:72%;background:var(--api-c-e9edef,#e9edef)}
    .skeleton i:nth-child(5){width:38%}
    .json-line .code-text{border-radius:3px}
    .json-line[data-highlight="true"] .code-text{background:var(--api-c-e1f2f4,#e1f2f4)}
    .cursor{position:absolute;left:0;top:0;width:23px;height:31px;z-index:5;pointer-events:none;opacity:0;will-change:transform}
    .cursor svg{width:23px;height:31px;filter:drop-shadow(0 1px 1px var(--api-c-10232c16,#10232c16));transform-origin:4px 4px}
    .completion-layer{position:absolute;inset:0;z-index:8;display:grid;place-items:center;visibility:hidden}
    .completion-veil{position:absolute;inset:0;background:rgba(247,250,250,.64);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0}
    .completion-card{position:relative;width:456px;padding:32px;background:var(--api-c-ffffff,#fff);border:1px solid var(--api-c-e0e9e9,#e0e9e9);border-radius:14px;box-shadow:0 24px 70px -20px var(--api-c-173d4430,#173d4430),0 4px 16px -6px var(--api-c-173d4414,#173d4414);opacity:0;transform:translateY(12px) scale(.985);transform-origin:50% 55%}
    .completion-heading{display:flex;align-items:center;gap:18px}
    .completion-icon{position:relative;flex:none;width:52px;height:52px;display:grid;place-items:center;background:var(--api-c-eff8f5,#eff8f5);border-radius:50%;color:var(--api-c-229b75,#229b75)}
    .completion-icon svg{width:48px;height:48px}
    .completion-ring{stroke:var(--api-c-c2e6d9,#c2e6d9);stroke-width:1.25;stroke-dasharray:1;stroke-dashoffset:1;transform:rotate(-90deg);transform-origin:24px 24px}
    .completion-check{stroke:currentColor;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}
    .completion-title{font-size:24px;line-height:1.35;font-weight:500;letter-spacing:-.025em;margin:0 0 5px}
    .completion-description{font-size:15px;line-height:1.6;color:var(--api-c-77848a,#77848a);margin:0}
    .completion-meta{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid var(--api-c-edf1f2,#edf1f2);margin-top:26px;padding-top:18px}
    .completion-route{font:13px/1.5 var(--api-mono);color:var(--api-c-7b898f,#7b898f);white-space:nowrap}
    .completion-route b{font-weight:500;color:var(--api-accent);margin-right:8px}
    .completion-status{display:flex;align-items:center;gap:7px;color:var(--api-c-248760,#248760);font-size:13px;line-height:1.5;white-space:nowrap}
    .completion-status::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--api-c-35a772,#35a772)}
    @media(prefers-reduced-motion:reduce){.cursor,.caret{display:none!important}button,input{transition:none!important}}
  `;

  class ApiDeveloperDemo extends HTMLElement {
    static get observedAttributes() { return ['autoplay', 'speed', 'fit']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `<style>${styles}</style>
        <div class="viewport" role="img" aria-label="Animated Apcosys API demo: parameters update the cURL request, a successful JSON response appears, then the next endpoint opens and a success confirmation completes the loop."><div class="sizer"><section class="shell" inert aria-hidden="true">
          <aside class="sidebar">
            <div class="sidebar-top"><span class="api-label">API</span></div>
            <div class="group-title">${icon('chevron')}<span>Datasets</span></div>
            <nav class="endpoints" aria-label="Dataset endpoints">
              <div class="nav-highlight" aria-hidden="true"></div>
              <button tabindex="-1" class="nav-item" data-endpoint="list" aria-current="page" type="button"><span>List datasets</span><span class="verb">GET</span></button>
              <button tabindex="-1" class="nav-item" data-endpoint="detail" type="button"><span>Get dataset</span><span class="verb">GET</span></button>
              <span class="nav-item passive"><span>Create dataset</span><span class="verb">POST</span></span>
              <span class="nav-item passive"><span>Update dataset</span><span class="verb">PATCH</span></span>
              <span class="nav-item passive"><span>Delete dataset</span><span class="verb">DELETE</span></span>
            </nav>
            <div class="other-groups">${['Queries', 'Exports', 'Jobs', 'Organization'].map(label => `<div class="group-title">${icon('right')}<span>${label}</span></div>`).join('')}</div>
          </aside>
          <div class="main">
            <header class="header">
              <div class="endpoint-heading"><span class="method">GET</span><div class="route-stack"><h1><span class="route">/v1/datasets</span><span class="route-suffix"></span></h1></div></div>
              <button tabindex="-1" class="send" type="button"><span class="send-label">Send request</span><span class="send-icon"><span class="arrow">${icon('arrow')}</span><span class="spinner">${icon('spinner')}</span></span></button>
              <p class="description">Returns a list of datasets in your organization.</p>
            </header>
            <div class="tabs" role="tablist" aria-label="Request configuration">
              ${[['parameters','Parameters'],['headers','Headers'],['authorization','Authorization'],['examples','Code examples']].map(([id, label], i) => `<button tabindex="-1" type="button" class="tab" id="tab-${id}" role="tab" aria-controls="panel-${id}" aria-selected="${i === 0}" data-tab="${id}">${label}</button>`).join('')}
              <span class="tab-underline" aria-hidden="true"></span>
            </div>
            <div class="panels">
              <div class="panel active" id="panel-parameters" role="tabpanel" aria-labelledby="tab-parameters">
                <div class="panel-heading"><h2 class="params-heading">Query parameters</h2><span class="add-param" aria-hidden="true">${icon('plus')}<span>Add parameter</span></span></div>
                <div class="column-labels" aria-hidden="true"><span>NAME</span><span>TYPE</span><span>DESCRIPTION</span><span>VALUE</span></div>
                <div class="query-rows">
                  ${[['limit','integer','Maximum number of results (1–100)','50',''],['offset','integer','Number of results to skip','0',''],['q','string','Filter by name or description','','e.g. revenue']].map(([name,type,description,value,placeholder]) => `<div class="param-row"><span class="param-name">${name}</span><span class="param-type">${type}${icon('chevron')}</span><span class="param-description">${description}</span><div class="field" data-field="${name}"><input readonly tabindex="-1" aria-label="${name} parameter" name="${name}" value="${value}" placeholder="${placeholder}" autocomplete="off" spellcheck="false" ${type === 'integer' ? `type="number" inputmode="numeric" min="${name === 'limit' ? '1' : '0'}" step="1"` : 'type="text"'} ${name === 'limit' ? 'max="100"' : ''}><span class="caret" aria-hidden="true"></span></div></div>`).join('')}
                </div>
                <div class="path-row param-row" hidden><span class="param-name">dataset_id</span><span class="param-type">string${icon('chevron')}</span><span class="param-description">Unique identifier of the dataset</span><div class="field" data-field="dataset_id"><input readonly tabindex="-1" name="dataset_id" data-id aria-label="Dataset identifier" placeholder="ds_…" value="" autocomplete="off" spellcheck="false"><span class="caret" aria-hidden="true"></span></div></div>
              </div>
              <div class="panel" id="panel-authorization" role="tabpanel" aria-labelledby="tab-authorization" aria-hidden="true" inert>
                <div class="panel-heading"><h2>Authorization</h2></div>
                <div class="auth-grid"><div><span class="field-label">SCHEME</span><span class="param-type">Bearer token${icon('chevron')}</span></div><div><span class="field-label">API KEY</span><span class="param-name">YOUR_API_KEY</span></div></div>
                <div class="connected">${icon('check')}<span>API key connected</span></div><p class="auth-note">The Authorization header is included in every request.</p>
              </div>
              <div class="panel" id="panel-headers" role="tabpanel" aria-labelledby="tab-headers" aria-hidden="true" inert>
                <div class="panel-heading"><h2>Request headers</h2></div><div class="headers-table"><span>Accept</span><span class="value">application/json</span><span>Authorization</span><span class="value">Bearer YOUR_API_KEY</span></div>
              </div>
              <div class="panel" id="panel-examples" role="tabpanel" aria-labelledby="tab-examples" aria-hidden="true" inert>
                <div class="panel-heading"><h2>Code examples</h2></div><p class="example-note">Use the cURL request below with your API key.</p><div class="headers-table"><span>Base URL</span><span class="value">https://api.apcosys.com</span><span>Method</span><span class="value">GET</span><span>Response format</span><span class="value">application/json</span></div>
              </div>
            </div>
            <section aria-label="cURL request">
              <div class="section-header"><h2>Request</h2><div class="section-tools"><span class="language">cURL${icon('chevron')}</span><button tabindex="-1" class="copy copy-request" type="button" aria-label="Copy cURL request"><span class="copy-icon">${icon('copy')}</span><span class="check">${icon('check')}</span></button></div></div>
              <div class="code-box request-code"><div class="request-lines"></div></div>
            </section>
            <section aria-label="JSON response">
              <div class="section-header"><div class="section-title"><h2>Response</h2><span class="status" data-state="idle"><span class="status-mark" aria-hidden="true"><span class="status-dot"></span><span class="status-spin">${icon('spinner')}</span></span><span class="status-label">Not sent</span></span><span class="timing">184 ms</span></div><div class="section-tools"><span class="language">JSON${icon('chevron')}</span><button tabindex="-1" class="copy copy-response" type="button" aria-label="Copy JSON response"><span class="copy-icon">${icon('copy')}</span><span class="check">${icon('check')}</span></button></div></div>
              <div class="code-box response-body" aria-busy="false"><div class="response-empty">Send a request to see the response.</div><div class="skeleton" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="response-code response-list" aria-hidden="true" inert>${highlightedJSON(listResponse)}</div><div class="response-code response-detail" aria-hidden="true" inert>${highlightedJSON(detailResponse)}</div></div>
            </section>
          </div>
          <div class="completion-layer" aria-hidden="true">
            <div class="completion-veil"></div>
            <div class="completion-card">
              <div class="completion-heading">
                <div class="completion-icon"><svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle class="completion-ring" cx="24" cy="24" r="21" pathLength="1"/><path class="completion-check" d="m15.5 24 6 6 11-12" pathLength="1"/></svg></div>
                <div><h2 class="completion-title">Request successful</h2><p class="completion-description">Your dataset is ready to use.</p></div>
              </div>
              <div class="completion-meta"><span class="completion-route"><b>GET</b>/v1/datasets/…</span><span class="completion-status">200 OK</span></div>
            </div>
          </div>
          <div class="cursor" aria-hidden="true"><svg viewBox="0 0 23 31"><path d="M2 1v23l6-5 5 10 4-2-5-10 9-1Z" fill="#10191c" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg></div>
        </section></div></div>`;
      this.$ = selector => this.shadowRoot.querySelector(selector);
      this.$$ = selector => [...this.shadowRoot.querySelectorAll(selector)];
      this._endpoint = 'list';
      this._tab = 'parameters';
      this._paused = false;
      this._intersecting = true;
      this._cursorAnchor = null;
      this._cursorPosition = { x: 0, y: 0 };
      this._reduced = false;
    }

    connectedCallback() {
      if (this._connected) return;
      this._connected = true;
      instances.add(this);
      this._events = new AbortController();
      const signal = this._events.signal;
      this._media = matchMedia('(prefers-reduced-motion: reduce)');
      this._reduced = this._media.matches;
      this._media.addEventListener('change', e => { this._reduced = e.matches; this._initialize(); }, { signal });
      document.addEventListener('visibilitychange', () => this._syncPlayback(), { signal });
      this._resize = new ResizeObserver(() => this._layout());
      this._resize.observe(this);
      this._resize.observe(this.$('.shell'));
      this._intersection = new IntersectionObserver(entries => { this._intersecting = entries[0].isIntersecting; this._syncPlayback(); }, { threshold: 0 });
      this._intersection.observe(this);
      this._initialize();
    }

    disconnectedCallback() {
      this._connected = false;
      instances.delete(this);
      this._events?.abort();
      this._resize?.disconnect();
      this._intersection?.disconnect();
      this._context?.revert();
      this._timeline = null;
    }

    attributeChangedCallback(name, previous, next) {
      if (previous === next || !this._connected) return;
      if (name === 'fit') this._layout();
      if (name === 'speed' && this._timeline) this._timeline.timeScale(this.speed);
      if (name === 'autoplay') this._syncPlayback();
    }
    get speed() { const value = Number(this.getAttribute('speed') || 1); return Number.isFinite(value) ? Math.min(3, Math.max(.25, value)) : 1; }
    get autoplay() { return this.getAttribute('autoplay') !== 'false'; }
    get response() { return this._endpoint === 'detail' ? detailResponse : listResponse; }
    get request() {
      if (this._endpoint === 'detail') return `curl "https://api.apcosys.com/v1/datasets/${encodeURIComponent(this.$('[name="dataset_id"]').value || '{dataset_id}')}" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`;
      const values = ['limit', 'offset', 'q'].map(name => [name, this.$(`[name="${name}"]`).value]);
      return `curl -G "https://api.apcosys.com/v1/datasets" \\\n  -H "Authorization: Bearer YOUR_API_KEY"` + values.filter(([, value]) => value !== '').map(([key, value]) => ` \\\n  --data-urlencode "${key}=${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/\x60/g, '\\`')}"`).join('');
    }

    configure({ gsap } = {}) { if (gsap) this._gsap = gsap; if (this._connected) this._initialize(); return this; }
    play() {
      this._paused = false;
      if (!this.autoplay) this.setAttribute('autoplay','true');
      if (this._timeline && this._timeline.time() > .45 && this._timeline.time() < 22 && !this._reduced) this.$('.cursor').style.opacity = '1';
      this._syncPlayback();
      return this;
    }
    pause() { this._paused = true; this._syncPlayback(); return this; }
    restart() { this._paused = false; this._initialize(); return this; }

    _initialize() {
      this._context?.revert();
      this._timeline = null;
      this._busy = false;
      this._cursorMoving = false;
      this._cursorMove = null;
      this._cursorAnchor = null;
      this._gsap = this._gsap || sharedGSAP || window.gsap;
      this._renderEndpoint('list', true);
      this._switchTab('parameters', true);
      this._clearResponse();
      this.$('.cursor').style.opacity = '0';
      this._layout();
      if (!this._gsap || this._reduced) {
        this.$('[name="q"]').value = 'revenue';
        this._updateRequest();
        this._showStaticResponse();
        return;
      }
      this._context = this._gsap.context(() => { this._buildTimeline(); }, this.shadowRoot);
      this._timeline.timeScale(this.speed);
      this._syncPlayback();
    }

    _syncPlayback() {
      const hidden = document.hidden || !this._intersecting;
      this._timeline?.paused(this._paused || !this.autoplay || hidden || this._reduced);
      const paused = this._paused || !this.autoplay;
      if (this._paused) { this.$('.cursor').style.opacity = '0'; this.$$('.caret').forEach(el => el.style.opacity = '0'); this.$$('.field').forEach(el => el.removeAttribute('data-focused')); }
      this.dispatchEvent(new CustomEvent('playbackchange', { detail: { paused }, bubbles: true }));
    }

    _layout() {
      const viewport = this.$('.viewport');
      const bounds = getComputedStyle(viewport);
      const width = parseFloat(bounds.width) || 0;
      const height = parseFloat(bounds.height) || 0;
      const scale = Math.min(width / FRAME.width, height / FRAME.height);
      this.$('.sizer').style.transform = `translate(${(width - FRAME.width * scale) / 2}px,${(height - FRAME.height * scale) / 2}px) scale(${scale})`;
      this._positionUnderline();
      this._positionNav();
      if (this._cursorMoving && this._cursorMove) this._updateCursorMove();
      else if (this._cursorAnchor) this._setCursor(this._point(this._cursorAnchor));
    }

    _point(element) {
      const root = this.$('.shell');
      const bounds = root.getBoundingClientRect();
      const target = element.getBoundingClientRect();
      const sx = bounds.width / root.offsetWidth || 1;
      const sy = bounds.height / root.offsetHeight || 1;
      return { x: (target.left - bounds.left + target.width * (element.tagName === 'INPUT' ? .28 : .58)) / sx, y: (target.top - bounds.top + target.height * .58) / sy };
    }
    _setCursor(point) { this._cursorPosition = point; this.$('.cursor').style.transform = `translate3d(${point.x}px,${point.y}px,0)`; }
    _updateCursorMove() {
      const move = this._cursorMove;
      if (!move) return;
      const shell = this.$('.shell');
      const from = move.previous ? this._point(move.previous) : { x: move.start.x * shell.offsetWidth / move.width, y: move.start.y * shell.offsetHeight / move.height };
      const to = this._point(move.target);
      const p = move.state.p;
      const arc = Math.min(15, Math.hypot(to.x - from.x, to.y - from.y) * .025) * Math.sin(p * Math.PI);
      this._setCursor({ x: from.x + (to.x - from.x) * p + arc, y: from.y + (to.y - from.y) * p });
    }
    _cursorTo(timeline, selector, at, duration = .75) {
      const target = this.$(selector);
      const state = { p: 0 };
      timeline.to(state, { p: 1, duration, ease: 'power2.inOut', onStart: () => {
        state.p = 0;
        this._cursorMove = { state, target, start: { ...this._cursorPosition }, previous: this._cursorAnchor, width: this.$('.shell').offsetWidth, height: this.$('.shell').offsetHeight };
        this._cursorMoving = true;
      }, onUpdate: () => this._updateCursorMove(), onComplete: () => { this._cursorAnchor = target; this._cursorMoving = false; this._cursorMove = null; this._setCursor(this._point(target)); } }, at);
    }
    _press(timeline, at) {
      timeline.to(this.$('.cursor svg'), { scale: .90, duration: .09, ease: 'power1.out' }, at)
        .to(this.$('.cursor svg'), { scale: 1, duration: .17, ease: 'power2.out' }, at + .09);
    }
    _positionNav(animated = false) {
      const target = this.$(`[data-endpoint="${this._endpoint}"]`);
      const highlight = this.$('.nav-highlight');
      if (!target || !highlight) return;
      const position = { width: target.offsetWidth, height: target.offsetHeight, x: target.offsetLeft, y: target.offsetTop };
      if (this._gsap) {
        if (animated && !this._reduced && this._context) this._context.add(() => this._gsap.to(highlight, { ...position, duration: .42, ease: 'power2.inOut', overwrite: true }));
        else this._gsap.set(highlight, { ...position, overwrite: true });
      } else { highlight.style.width = `${position.width}px`; highlight.style.height = `${position.height}px`; highlight.style.transform = `translate(${position.x}px,${position.y}px)`; }
    }
    _positionUnderline() {
      const tab = this.$(`[data-tab="${this._tab}"]`);
      const underline = this.$('.tab-underline');
      if (!tab) return;
      if (this._gsap) this._gsap.set(underline, { x: tab.offsetLeft, width: tab.offsetWidth, overwrite: true });
      else { underline.style.width = `${tab.offsetWidth}px`; underline.style.transform = `translateX(${tab.offsetLeft}px)`; }
    }

    _switchTab(name, instant = false) {
      const previous = this.$(`#panel-${this._tab}`);
      const panel = this.$(`#panel-${name}`);
      this._tab = name;
      this.$$('.tab').forEach(tab => { const active = tab.dataset.tab === name; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = -1; });
      this.$$('.panel').forEach(el => { const active = el === panel; el.inert = !active; el.setAttribute('aria-hidden', String(!active)); el.classList.toggle('active', active); });
      const engine = this._gsap;
      if (engine && !instant && !this._reduced) {
        const animate = () => {
          engine.to(this.$('.tab-underline'), { x: this.$(`[data-tab="${name}"]`).offsetLeft, width: this.$(`[data-tab="${name}"]`).offsetWidth, duration: .38, ease: 'power2.inOut', overwrite: true });
          if (previous !== panel) engine.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: .26, ease: 'power1.out', overwrite: true });
        };
        if (this._context) this._context.add(animate); else animate();
      } else {
        if (engine) engine.set(panel, { opacity: 1, overwrite: true });
        this._positionUnderline();
      }
    }
    _renderEndpoint(name, reset = false, animateNav = false) {
      this._endpoint = name;
      this.$('.route').textContent = name === 'detail' ? '/v1/datasets/' : '/v1/datasets';
      this.$('.route-suffix').textContent = name === 'detail' ? '{dataset_id}' : '';
      this.$('.description').textContent = name === 'detail' ? 'Returns one dataset by its unique identifier.' : 'Returns a list of datasets in your organization.';
      this.$('.params-heading').textContent = name === 'detail' ? 'Path parameters' : 'Query parameters';
      this.$('.query-rows').hidden = name !== 'list';
      this.$('.path-row').hidden = name !== 'detail';
      this.$('.add-param').hidden = name === 'detail';
      this.$$('.nav-item[data-endpoint]').forEach(el => { if (el.dataset.endpoint === name) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
      if (reset) { this.$('[name="limit"]').value = '50'; this.$('[name="offset"]').value = '0'; this.$('[name="q"]').value = ''; this.$('[name="dataset_id"]').value = ''; }
      this._updateRequest();
      this._positionNav(animateNav);
    }

    _updateRequest() {
      const lines = this.request.split('\n');
      const root = this.$('.request-lines');
      while (root.children.length > lines.length) root.lastElementChild.remove();
      lines.forEach((line, i) => {
        let row = root.children[i];
        if (!row) { row = document.createElement('div'); row.className = 'code-line'; row.innerHTML = '<span class="line-number" aria-hidden="true"></span><span class="code-text"></span>'; root.append(row); }
        row.firstElementChild.textContent = i + 1;
        row.lastElementChild.innerHTML = escape(line).replace(/(&quot;.*?&quot;)/g, '<span class="code-value">$1</span>');
      });
    }
    _focusField(name, focused) {
      const field = this.$(`[data-field="${name}"]`);
      if (focused) field.setAttribute('data-focused', 'true'); else field.removeAttribute('data-focused');
      const caret = field.querySelector('.caret');
      caret.style.opacity = focused ? '1' : '0';
      if (focused) {
        const input = field.querySelector('input');
        const measure = this.$('.input-measure') || document.createElement('span');
        measure.className = 'input-measure';
        measure.setAttribute('aria-hidden', 'true');
        measure.style.font = getComputedStyle(input).font;
        measure.textContent = input.value;
        if (!measure.isConnected) field.append(measure);
        const left = parseFloat(getComputedStyle(input).paddingLeft) + measure.offsetWidth;
        caret.style.left = `${Math.min(left, field.offsetWidth - 8)}px`;
      }
    }
    _type(timeline, name, text, at, intervals) {
      let time = at;
      timeline.call(() => { this.$(`[name="${name}"]`).value = ''; this._focusField(name, true); }, [], time);
      [...text].forEach((letter, i) => {
        time += intervals?.[i] || .105;
        timeline.call(() => { this.$(`[name="${name}"]`).value = text.slice(0, i + 1); this._focusField(name, true); this._updateRequest(); }, [], time);
      });
      timeline.call(() => this._focusField(name, false), [], time + .38);
    }

    _clearResponse() {
      this._busy = false;
      this.$('.send').disabled = false;
      this.$('.send').dataset.busy = 'false';
      this.$('.send-label').textContent = 'Send request';
      this.$('.response-body').setAttribute('aria-busy', 'false');
      this.$('.status').dataset.state = 'idle';
      this.$('.status-label').textContent = 'Not sent';
      this.$('.timing').style.opacity = '0';
      this.$('.response-empty').style.opacity = '1';
      this.$('.skeleton').style.visibility = 'hidden';
      this.$('.skeleton').style.opacity = '0';
      this.$$('.response-code').forEach(el => { el.style.visibility = 'hidden'; el.style.opacity = '0'; el.setAttribute('aria-hidden', 'true'); el.inert = true; });
      this.$$('.json-line').forEach(el => { el.style.opacity = '1'; el.style.transform = ''; el.removeAttribute('data-highlight'); });
      this.$$('.copy').forEach(el => el.removeAttribute('data-copied'));
      this.$('.copy-response').disabled = true;
    }
    _sending() {
      this._clearResponse();
      this._busy = true;
      this.$('.send').disabled = true;
      this.$('.send').dataset.busy = 'true';
      this.$('.send-label').textContent = 'Sending…';
      this.$('.status').dataset.state = 'sending';
      this.$('.status-label').textContent = 'Sending…';
      this.$('.response-body').setAttribute('aria-busy', 'true');
      this.$('.response-empty').style.opacity = '0';
      this.$('.skeleton').style.visibility = 'visible';
      this.$('.skeleton').style.opacity = '1';
    }
    _success(endpoint) {
      this._busy = false;
      this.$('.send').disabled = false;
      this.$('.send').dataset.busy = 'false';
      this.$('.send-label').textContent = 'Send request';
      this.$('.status').dataset.state = 'success';
      this.$('.status-label').textContent = '200 OK';
      this.$('.timing').textContent = endpoint === 'list' ? '184 ms' : '132 ms';
      this.$('.response-body').setAttribute('aria-busy', 'false');
      this.$('.skeleton').style.visibility = 'hidden';
      this.$('.skeleton').style.opacity = '0';
      const response = this.$(`.response-${endpoint}`);
      response.style.visibility = 'visible';
      response.style.opacity = '1';
      response.setAttribute('aria-hidden', 'false');
      response.inert = false;
      this.$('.copy-response').disabled = false;
    }
    _showStaticResponse() { this._clearResponse(); this.$('.response-empty').style.opacity = '0'; this._success(this._endpoint); this.$('.timing').style.opacity = '1'; }

    _requestSequence(timeline, endpoint, at) {
      const engine = this._gsap;
      const lines = this.$(`.response-${endpoint}`).children;
      timeline.call(() => this._sending(), [], at);
      timeline.fromTo(this.$('.send .spinner svg'), { rotation: 0 }, { rotation: 540, duration: 1.2, ease: 'none', immediateRender: false }, at);
      timeline.fromTo(this.$('.status-spin svg'), { rotation: 0 }, { rotation: 540, duration: 1.2, ease: 'none', immediateRender: false }, at);
      timeline.fromTo(this.$('.skeleton'), { opacity: 0 }, { opacity: .85, duration: .25, immediateRender: false, ease: 'power1.out' }, at);
      timeline.call(() => { this._success(endpoint); engine.set(lines, { opacity: 0, y: 1.5 }); }, [], at + 1.2);
      timeline.to(lines, { opacity: 1, y: 0, duration: .35, stagger: .065, ease: 'power1.out' }, at + 1.23);
      timeline.fromTo(this.$('.timing'), { opacity: 0 }, { opacity: 1, duration: .32, immediateRender: false }, at + 1.45);
    }

    _buildTimeline() {
      const g = this._gsap;
      const content = this.$$('.route-stack,.description,.panels,.request-lines,.status');
      const resetContent = this.$$('.route-stack,.description,.panels,.request-lines,.response-body,.section-title,.endpoints');
      const completion = this.$('.completion-layer');
      const card = this.$('.completion-card');
      const veil = this.$('.completion-veil');
      const tl = g.timeline({ paused: true, repeat: -1, onRepeat: () => { this._cursorAnchor = null; } });
      this._timeline = tl;
      tl.call(() => { this._renderEndpoint('list', true); this._switchTab('parameters', true); this._clearResponse(); g.set([...content,...resetContent],{opacity:1}); this._cursorAnchor = this.$('.route-stack'); this._setCursor(this._point(this._cursorAnchor)); }, [], 0);
      tl.to(this.$('.cursor'), { opacity: 1, duration: .45 }, .45);
      this._cursorTo(tl, '[data-tab="authorization"]', .7, .75);
      this._press(tl, 1.5);
      tl.call(() => this._switchTab('authorization'), [], 1.65);
      this._cursorTo(tl, '[data-tab="parameters"]', 2.85, .68);
      this._press(tl, 3.57);
      tl.call(() => this._switchTab('parameters'), [], 3.71);
      this._cursorTo(tl, '[name="limit"]', 4.25, .72);
      this._press(tl, 5.02);
      this._type(tl, 'limit', '25', 5.18, [.13,.11]);
      this._cursorTo(tl, '[name="q"]', 5.9, .70);
      this._press(tl, 6.64);
      this._type(tl, 'q', 'revenue', 6.81, [.13,.1,.15,.09,.13,.11,.16]);
      this._cursorTo(tl, '.send', 8.34, .82);
      this._press(tl, 9.2);
      this._requestSequence(tl, 'list', 9.38);
      this._cursorTo(tl, '.response-list .json-line:nth-child(4) .code-text', 11.92, .78);
      tl.call(() => this.$('.response-list .json-line:nth-child(4)').setAttribute('data-highlight','true'), [], 12.75);
      this._cursorTo(tl, '.copy-response', 13.25, .72);
      this._press(tl, 14.02);
      tl.call(() => this.$('.copy-response').setAttribute('data-copied','true'), [], 14.14);
      tl.call(() => { this.$('.copy-response').removeAttribute('data-copied'); this.$('.response-list .json-line:nth-child(4)').removeAttribute('data-highlight'); }, [], 15.0);
      this._cursorTo(tl, '[data-endpoint="detail"]', 15.1, .95);
      this._press(tl, 16.12);
      tl.to(content, { opacity: .15, duration: .22, ease: 'power1.inOut' }, 16.25);
      tl.call(() => { this._renderEndpoint('detail',false,true); this._clearResponse(); this._switchTab('parameters',true); }, [], 16.48);
      tl.to(content, { opacity: 1, duration: .34, ease: 'power1.out' }, 16.49);
      this._cursorTo(tl, '[name="dataset_id"]', 17.03, .73);
      this._press(tl, 17.81);
      tl.call(() => this._focusField('dataset_id', true), [], 17.95);
      tl.call(() => { this.$('[name="dataset_id"]').value = dataset.id; this._focusField('dataset_id',true); this._updateRequest(); }, [], 18.18);
      tl.call(() => this._focusField('dataset_id',false), [], 18.67);
      this._cursorTo(tl, '.send', 18.90, .82);
      this._press(tl, 19.77);
      this._requestSequence(tl, 'detail', 19.94);
      tl.to(this.$('.cursor'), { opacity: 0, duration: .6 }, 22.0);
      // A restrained final confirmation; no user controls or actual API call.
      tl.set(completion, { visibility: 'visible' }, 22.6);
      tl.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.inOut', immediateRender: false }, 22.6);
      tl.fromTo(card, { opacity: 0, y: 12, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power3.out', immediateRender: false }, 22.72);
      tl.fromTo(this.$('.completion-icon'), { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .7, ease: 'power2.out', immediateRender: false }, 22.89);
      tl.fromTo(this.$('.completion-ring'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .85, ease: 'power2.out', immediateRender: false }, 23.02);
      tl.fromTo(this.$('.completion-check'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .55, ease: 'power2.out', immediateRender: false }, 23.22);
      tl.fromTo(this.$$('.completion-title,.completion-description,.completion-meta'), { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: .65, stagger: .08, ease: 'power2.out', immediateRender: false }, 22.98);
      // Reset behind the held confirmation. The loop seam is the same resting frame.
      tl.to(resetContent, { opacity: 0, duration: .5, ease: 'power2.inOut' }, 26.8);
      tl.call(() => { this._renderEndpoint('list',true); this._clearResponse(); this._switchTab('parameters',true); this._cursorAnchor = null; }, [], 27.31);
      tl.to(resetContent, { opacity: 1, duration: .7, ease: 'power2.inOut' }, 27.33);
      tl.to(card, { opacity: 0, y: -6, scale: 1.003, duration: .8, ease: 'power2.inOut' }, 28.25);
      tl.to(veil, { opacity: 0, duration: .95, ease: 'power2.inOut' }, 28.35);
      tl.set(completion, { visibility: 'hidden' }, 29.3);
      tl.to({}, { duration: .9 }, 29.3);

    }


  }

  window.ApcosysApiWidget = Object.freeze({
    configure({ gsap } = {}) { if (!gsap) return; sharedGSAP = gsap; instances.forEach(instance => instance.configure({ gsap })); },
    version: '2.2.0'
  });
  window.customElements.define('api-developer-demo', ApiDeveloperDemo);
})();
