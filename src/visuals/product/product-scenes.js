(function(){
const CSS=":host{display:block;width:100%;pointer-events:none;user-select:none;-webkit-user-select:none;color:var(--demo-c-10161b,#10161b);--accent:var(--demo-c-008da3,#008da3);--muted:var(--demo-c-68717b,#68717b);--line:var(--demo-c-e6eaee,#e6eaee);--ratio:1257/843;--font:Inter,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Arial,sans-serif}\n:host([scene=\"results\"]),:host([scene=\"host\"]),:host([scene=\"evidence\"]),:host([scene=\"suggestions\"]){--ratio:1257/840}\n:host([fit=\"contain\"]){height:100%;min-height:0}\n*,*::before,*::after{box-sizing:border-box;pointer-events:none;user-select:none;-webkit-user-select:none}\n[hidden]{display:none!important}\n.viewport{width:100%;height:auto;aspect-ratio:var(--ratio);position:relative;overflow:hidden;isolation:isolate;background:var(--demo-c-ffffff,#fff)}\n:host([fit=\"contain\"]) .viewport{height:100%;aspect-ratio:auto}\n.frame{position:absolute;left:0;top:0;width:1257px;transform-origin:0 0;background:var(--demo-c-ffffff,#fff);overflow:hidden;font-family:var(--font);font-weight:400}\n.surface{position:absolute;inset:0;z-index:0;background:var(--demo-c-ffffff,#fff)}\nsvg{display:block;flex:none}\n.ui-icon{width:24px;height:24px;stroke-width:1.8}\n.cursor{position:absolute;left:0;top:0;width:28px;height:38px;opacity:0;z-index:20;will-change:transform}\n.cursor svg{width:28px;height:38px;fill:var(--demo-c-10171b,#10171b);stroke:var(--demo-c-ffffff,#fff);stroke-width:1.3;filter:drop-shadow(0 1px 1px var(--demo-c-163d421a,#163d421a));transform-origin:4px 4px}\n.flag{width:28px;height:20px;object-fit:cover;border-radius:1px;flex:none}\n.query-scene{padding:48px 55px 42px}\n.query-bar{height:113px;display:flex;align-items:center;gap:37px;border:2px solid var(--demo-c-dce2e7,#dce2e7);border-radius:15px;padding-left:38px;overflow:hidden}\n.query-bar>.ui-icon{width:35px;height:35px;stroke-width:1.75}\n.query-bar[data-focused=\"true\"]{border-color:var(--demo-c-99ccd4,#99ccd4)}\n.query-value-wrap{display:flex;align-items:center;min-width:0;flex:1;font-size:32px;line-height:1.4;white-space:nowrap}\n.query-value{border-radius:3px;min-height:45px}\n.query-value[data-selected=\"true\"]{background:var(--demo-c-dff2f5,#dff2f5)}\n.query-caret{height:34px;width:2px;margin-left:2px;background:var(--accent);opacity:0;flex:none}\n.query-submit{height:109px;width:124px;align-self:stretch;display:grid;place-items:center;flex:none;background:var(--accent);color:var(--demo-c-ffffff,#fff);border-radius:12px}\n.query-submit>.ui-icon{width:35px;height:35px;stroke-width:1.9}\n.query-spinner{display:none}\n.query-submit[data-loading=\"true\"] .query-arrow{display:none}\n.query-submit[data-loading=\"true\"] .query-spinner{display:block}\n.recent{margin-top:57px}\n.recent-heading{display:flex;align-items:center;justify-content:space-between;font-size:24px;line-height:1.4;color:var(--demo-c-626b73,#626b73);margin-bottom:14px}\n.clear-all{color:var(--accent)}\n.recent-row{height:84px;display:flex;align-items:center;gap:37px;border-bottom:1px solid var(--line);font-size:29px;line-height:1.4;border-radius:5px}\n.recent-row>.ui-icon{width:33px;height:33px;stroke-width:1.8;color:var(--demo-c-48565f,#48565f);margin-left:4px}\n.recent-row .recent-label{flex:1;white-space:nowrap;min-width:0}\n.recent-row .recent-action{margin-right:4px;color:var(--demo-c-69757d,#69757d)}\n.recent-action .ui-icon{width:35px;height:35px;stroke-width:1.65}\n.recent-row .recent-check{display:none;color:var(--accent)}\n.recent-row[data-complete=\"true\"] .recent-arrow{display:none}\n.recent-row[data-complete=\"true\"] .recent-check{display:block}\n.syntax{border-top:1px solid var(--demo-c-dfe5e9,#dfe5e9);margin-top:50px;padding-top:36px}\n.syntax-heading{display:flex;align-items:center;justify-content:space-between;color:var(--demo-c-68717a,#68717a);font-size:23px;line-height:1.4}\n.docs-link{display:flex;align-items:center;gap:12px;color:var(--accent)}\n.docs-link>.ui-icon{width:25px;height:25px;stroke-width:1.8}\n.syntax-chips{display:flex;align-items:center;gap:21px;margin-top:18px}\n.syntax-chip{font-size:24px;line-height:1.4;background:var(--demo-c-f4f6f8,#f4f6f8);border-radius:20px;padding:13px 24px;color:var(--demo-c-2a343d,#2a343d)}\n.syntax-chip[data-active=\"true\"]{background:var(--demo-c-e3f4f7,#e3f4f7);color:var(--accent)}\n.results-scene{padding:22px 22px 23px}\n.results-toolbar{position:relative;z-index:2;height:50px;display:flex;align-items:stretch;gap:17px;margin-bottom:24px;overflow:visible}\n.result-search{width:404px;display:flex;align-items:center;gap:19px;padding:0 17px;border:1px solid var(--demo-c-d9dfe5,#d9dfe5);background:var(--demo-c-fafbfc,#fafbfc);border-radius:10px;color:var(--muted);font-size:15px;white-space:nowrap}\n.result-search .ui-icon{width:23px;height:23px}\n.result-spinner{display:none;color:var(--accent)}\n.results-scene[data-loading=\"true\"] .result-search-icon{display:none}\n.results-scene[data-loading=\"true\"] .result-spinner{display:block}\n.filter{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;height:50px;padding:0 19px;border:1px solid var(--demo-c-ced5dc,#ced5dc);border-radius:10px;font-size:15px;white-space:nowrap;background:var(--demo-c-ffffff,#fff)}\n.filter .ui-icon{width:16px;height:16px;stroke-width:2}\n.filter-services{width:147px}.filter-technologies{width:177px}.filter-countries{width:152px;z-index:1;overflow:visible}\n.filter-sort{margin-left:auto;width:182px;font-size:14px;padding-inline:18px}\n.filter-countries[data-active=\"true\"]{border-color:var(--demo-c-99cdd5,#99cdd5);color:var(--demo-c-007f94,#007f94);font-size:14px}\n.country-menu{position:absolute;top:58px;left:0;width:210px;background:var(--demo-c-ffffff,#fff);border:1px solid var(--demo-c-e1e7eb,#e1e7eb);border-radius:11px;box-shadow:0 16px 38px -10px var(--demo-c-24374026,#24374026);padding:6px;visibility:hidden;opacity:0;z-index:25;color:var(--demo-c-242c32,#242c32)}\n.country-option{height:46px;display:flex;align-items:center;gap:11px;padding:0 11px;border-radius:6px;font-size:15px}\n.country-option:first-child{background:var(--demo-c-f2f8f9,#f2f8f9)}\n.country-option .flag{width:24px;height:17px}\n.result-rows{position:relative;z-index:0;height:655px;border-top:1px solid var(--line)}\n.result-row{height:164px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:43.3% 13% 11.7% 14.4% minmax(0,1fr);align-items:center;padding:19px 26px 20px;border-radius:3px}\n.result-row:first-child{height:160px}.result-row:nth-child(3){height:167px}\n.result-summary{min-width:0;padding-right:20px;position:relative;top:-3px}\n.result-title{display:flex;align-items:center;gap:15px;min-width:0;margin-bottom:2px}\n.result-domain{font-size:24px;line-height:1.25;font-weight:600;letter-spacing:-.045em}\n.result-title .ui-icon{width:20px;height:20px;stroke-width:1.65;color:var(--demo-c-66717c,#66717c)}\n.result-ip,.result-description{font-size:16px;line-height:1.5;color:var(--demo-c-6b727c,#6b727c)}\n.result-description{margin-top:2px}\n.result-tags{display:flex;gap:12px;margin-top:8px}\n.result-tag{padding:5px 13px;border-radius:6px;background:var(--demo-c-f0f1f3,#f0f1f3);color:var(--demo-c-535d67,#535d67);font-size:14px;line-height:1.45}\n.result-tag:first-child{background:var(--demo-c-e0f2f6,#e0f2f6);color:var(--demo-c-0087a0,#0087a0)}\n.result-metric{height:74px;border-left:1px solid var(--line);padding-left:40px;display:flex;flex-direction:column;justify-content:center;gap:6px;min-width:0}\n.metric-label{font-size:14px;line-height:1.5;color:var(--demo-c-6d7681,#6d7681);white-space:nowrap}\n.metric-value{font-size:24px;font-weight:500;line-height:1.3;font-variant-numeric:tabular-nums}\n.result-country{height:74px;border-left:1px solid var(--line);display:flex;gap:17px;padding-left:40px;align-items:center;min-width:0}\n.result-country>.flag{align-self:flex-start;margin-top:14px}\n.country-name{font-size:17px;line-height:1.5;white-space:nowrap}\n.country-city{font-size:15px;line-height:1.55;color:var(--demo-c-747c84,#747c84)}\n.results-footer{position:relative;z-index:1;height:67px;display:flex;align-items:flex-end;justify-content:space-between}\n.result-count{font-size:14px;color:var(--demo-c-71808a,#71808a);opacity:0;padding-bottom:15px}\n.load-more{height:49px;display:flex;align-items:center;gap:18px;padding:0 20px;border:1px solid var(--demo-c-ced5dc,#ced5dc);border-radius:10px;font-size:16px;background:var(--demo-c-ffffff,#fff)}\n.load-more .ui-icon{width:19px;height:19px;stroke-width:1.8}\n.host-scene{padding:53px 38px 52px 32px}\n.host-layout{height:735px;display:grid;grid-template-columns:486px minmax(0,1fr);gap:32px}\n.host-summary{border-right:1px solid var(--demo-c-ebeff1,#ebeff1);padding:48px 39px 0 0;min-width:0}\n.host-ip-heading{display:flex;align-items:center;gap:26px}\n.host-ip{font-size:38px;line-height:1.3;font-weight:600;letter-spacing:-.015em;white-space:nowrap}\n.host-copy{position:relative;width:27px;height:28px;color:var(--demo-c-192229,#192229)}\n.host-copy .ui-icon{width:27px;height:27px;stroke-width:1.8}\n.host-copy-check{display:none;color:var(--accent)}\n.host-copy[data-copied=\"true\"] .host-copy-icon{display:none}\n.host-copy[data-copied=\"true\"] .host-copy-check{display:block}\n.host-domain{display:flex;align-items:center;gap:14px;font-size:24px;line-height:1.45;margin-top:3px;letter-spacing:-.025em}\n.host-domain>.ui-icon{width:20px;height:20px;stroke-width:1.8}\n.host-metadata{margin-top:33px}\n.host-meta-row{height:61px;display:grid;grid-template-columns:160px minmax(0,1fr);align-items:center;border-bottom:1px solid var(--line);font-size:17px;line-height:1.45}\n.host-meta-row:last-child{border-bottom:0}\n.host-meta-label{color:var(--demo-c-6f767d,#6f767d)}\n.host-meta-location{display:flex;align-items:center;gap:13px;white-space:nowrap}\n.host-meta-location .flag{width:27px;height:19px}\n.host-detail{padding-top:30px;min-width:0}\n.host-panel-heading{display:flex;align-items:center;justify-content:space-between;min-height:24px}\n.host-panel-title{display:flex;align-items:center;gap:12px;font-size:19px;line-height:1.4;font-weight:600;letter-spacing:-.025em}\n.host-panel-title .ui-icon{width:18px;height:18px;color:var(--demo-c-7a838b,#7a838b);stroke-width:1.7}\n.periods{display:flex;align-items:center;gap:4px}\n.period{width:66px;height:36px;display:grid;place-items:center;background:var(--demo-c-f8f9fa,#f8f9fa);border-radius:8px;color:var(--demo-c-757e86,#757e86);font-size:15px;line-height:1.4}\n.period[data-active=\"true\"]{background:var(--demo-c-def2f6,#def2f6);color:var(--demo-c-008ba2,#008ba2)}\n.chart-panel{height:262px;border-bottom:1px solid var(--line)}\n.chart-panel>.host-panel-heading{height:36px}\n.exposure-chart{width:100%;height:188px;margin-top:12px;overflow:visible}\n.chart-axis,.chart-date{font:14px var(--font);fill:var(--demo-c-747d84,#747d84)}\n.chart-grid{stroke:var(--demo-c-e6ebef,#e6ebef);stroke-width:1;stroke-dasharray:6 5}\n.chart-area{fill:var(--demo-c-e4f3f6,#e4f3f6);opacity:.85}\n.chart-line{fill:none;stroke:var(--accent);stroke-width:2.15;stroke-linecap:round;stroke-linejoin:round}\n.chart-dot{fill:var(--accent);stroke:var(--demo-c-ffffff,#fff);stroke-width:2.5}\n.chart-tooltip{fill:var(--demo-c-ffffff,#fff);filter:drop-shadow(0 3px 9px var(--demo-c-28475010,#28475010))}\n.chart-tooltip-text{font:500 15px var(--font);fill:var(--demo-c-101920,#101920);text-anchor:middle}\n.vulnerability-panel{padding:22px 0 26px;border-bottom:1px solid var(--line)}\n.view-all{display:flex;align-items:center;gap:6px;font-size:16px;line-height:1.4;color:var(--accent)}\n.view-all .ui-icon{width:16px;height:16px;stroke-width:1.8}\n.vulnerability-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:18px}\n.vulnerability-tile{height:82px;padding:12px 20px;border-radius:8px}\n.vulnerability-value{font-size:29px;line-height:1.2;font-weight:500;font-variant-numeric:tabular-nums}\n.vulnerability-name{font-size:16px;line-height:1.5;margin-top:2px}\n.critical{background:var(--demo-c-fff1f2,#fff1f2);color:var(--demo-c-b31d31,#b31d31)}.critical .vulnerability-name{color:var(--demo-c-77454c,#77454c)}\n.high{background:var(--demo-c-fff5f0,#fff5f0);color:var(--demo-c-ca580b,#ca580b)}.high .vulnerability-name{color:var(--demo-c-7a594a,#7a594a)}\n.medium{background:var(--demo-c-fffaed,#fffaed);color:var(--demo-c-b98a04,#b98a04)}.medium .vulnerability-name{color:var(--demo-c-796c48,#796c48)}\n.low{background:var(--demo-c-f0faf5,#f0faf5);color:var(--demo-c-128251,#128251)}.low .vulnerability-name{color:var(--demo-c-247452,#247452)}\n.services-panel{padding-top:23px}\n.service-rows{margin-top:10px}\n.service-row{height:47px;display:grid;grid-template-columns:33% 41% minmax(0,1fr);align-items:center;border-bottom:1px solid var(--line);font-size:18px;line-height:1.4;border-radius:4px;padding-inline:5px}\n.service-row:last-child{border-bottom:0}\n.service-port span,.service-name{color:var(--demo-c-737b83,#737b83)}\n.service-state{justify-self:end;min-width:79px;height:31px;display:grid;place-items:center;border-radius:20px;background:var(--demo-c-e4f6ed,#e4f6ed);color:var(--demo-c-168352,#168352);font-size:15px}\n@media(prefers-reduced-motion:reduce){.cursor,.query-caret{display:none!important}}\n.evidence-scene{padding:23px 39px 0 31px}\n.evidence-layout{height:817px;display:grid;grid-template-columns:270px minmax(0,1fr) 345px}\n.evidence-services,.evidence-center,.evidence-findings{position:relative;z-index:0;min-width:0}\n.evidence-services{border-top:1px solid var(--demo-c-edf1f4,#edf1f4);border-right:1px solid var(--demo-c-edf1f4,#edf1f4);padding:24px 18px 0 11px}\n.evidence-heading{display:flex;align-items:center;gap:10px;font-size:16.5px;line-height:24px;font-weight:600;letter-spacing:-.025em}\n.evidence-services>.evidence-heading{margin-left:8px}\n.evidence-count{width:28px;height:28px;border:1px solid var(--demo-c-dce4e9,#dce4e9);border-radius:50%;display:grid;place-items:center;font-size:13.5px;line-height:1;color:var(--demo-c-596575,#596575);font-weight:400;letter-spacing:0}\n.evidence-service-list{display:grid;gap:8px;margin-top:20px}\n.evidence-service{height:73px;display:grid;grid-template-columns:minmax(0,1fr) 60px 14px;align-items:center;column-gap:17px;padding:11px 14px 11px 15px;border:1px solid var(--demo-c-e6ecf0,#e6ecf0);border-radius:5px;background:var(--demo-c-ffffff,#fff)}\n.evidence-service[data-active=\"true\"]{background:var(--demo-c-edfbfe,#edfbfe);border-color:var(--demo-c-d7f3f8,#d7f3f8)}\n.evidence-port{font-size:17px;line-height:24px;font-weight:500;white-space:nowrap;letter-spacing:-.035em}\n.evidence-port span{font-weight:400;letter-spacing:0}\n.evidence-service-name{font-size:13.5px;line-height:20px;color:var(--demo-c-76808e,#76808e);margin-top:2px}\n.evidence-open{height:26px;align-self:start;margin-top:2px;display:grid;place-items:center;background:var(--demo-c-e1f8ef,#e1f8ef);color:var(--demo-c-078267,#078267);border-radius:16px;font-size:13px;line-height:1}\n.evidence-chevron{color:var(--demo-c-6f7986,#6f7986)}\n.evidence-chevron .ui-icon{width:16px;height:16px;transform:rotate(-90deg)}\n.evidence-center{margin-left:65px;border-top:1px solid var(--demo-c-edf1f4,#edf1f4);padding:24px 24px 0 9px}\n.evidence-center-header{height:45px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}\n.evidence-center-title{font-size:18px;line-height:25px;font-weight:600;letter-spacing:-.03em}\n.evidence-source{font-size:13px;line-height:19px;color:var(--demo-c-74808d,#74808d);margin-top:2px;white-space:nowrap}\n.evidence-nav{display:flex;gap:12px}\n.evidence-nav-item{width:36px;height:36px;border:1px solid var(--demo-c-e4eaef,#e4eaef);border-radius:5px;display:grid;place-items:center;background:var(--demo-c-fafcfd,#fafcfd)}\n.evidence-nav-item .ui-icon{width:16px;height:16px;transform:rotate(-90deg)}\n.evidence-nav-prev .ui-icon{transform:rotate(90deg)}\n.evidence-cards{display:grid;gap:15px;margin-top:16px}\n.evidence-card{border:1px solid var(--demo-c-e5ebef,#e5ebef);border-radius:6px;background:var(--demo-c-ffffff,#fff);padding:13px 14px}\n.evidence-banner-card{height:118px}.evidence-tls-card{height:124px}.evidence-network-card,.evidence-geo-card{height:161px}.evidence-dns-card{height:96px}\n.evidence-card-heading{display:flex;align-items:flex-start;gap:18px;min-height:25px}\n.evidence-card-heading>.ui-icon{width:23px;height:23px;stroke-width:1.85;margin-top:2px;color:var(--demo-c-293342,#293342)}\n.evidence-card-title{font-size:14px;line-height:21px;font-weight:600;letter-spacing:-.025em}\n.evidence-card-subtitle{font-size:12.5px;line-height:18px;color:var(--demo-c-76818e,#76818e);margin-top:0}\n.evidence-raw{margin-left:auto;margin-top:2px;display:flex;gap:6px;align-items:center;justify-content:center;width:65px;height:29px;border:1px solid var(--demo-c-dce4ea,#dce4ea);border-radius:6px;background:var(--demo-c-f8fafb,#f8fafb);font-size:11px;line-height:1}\n.evidence-raw .ui-icon{width:13px;height:13px;stroke-width:1.7}\n.evidence-banner{height:41px;display:flex;align-items:center;justify-content:space-between;gap:11px;background:var(--demo-c-f6f8fa,#f6f8fa);border-radius:6px;margin-top:11px;padding:0 12px}\n.evidence-banner-text{min-width:0;white-space:nowrap;font:500 12px/1.5 ui-monospace,SFMono-Regular,Consolas,\"Liberation Mono\",monospace;color:var(--demo-c-3b4758,#3b4758);letter-spacing:-.3px}\n.evidence-banner-copy{display:grid;place-items:center;width:18px;height:22px;flex:none;color:var(--demo-c-677487,#677487)}\n.evidence-banner-copy .ui-icon{width:15px;height:15px;stroke-width:1.8}\n.evidence-banner-check{display:none!important;color:var(--accent)}\n.evidence-banner-copy[data-copied=\"true\"] .evidence-banner-copy-icon{display:none}\n.evidence-banner-copy[data-copied=\"true\"] .evidence-banner-check{display:block!important}\n.evidence-tls-status{margin-left:auto;display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:5px;background:var(--demo-c-f3f5f7,#f3f5f7);color:var(--demo-c-606c7a,#606c7a);font-size:11px;line-height:15px;white-space:nowrap}\n.evidence-tls-status .ui-icon{width:14px;height:14px;stroke-width:2}\n.evidence-tls-check{display:none!important}\n.evidence-tls-status[data-available=\"true\"]{background:var(--demo-c-e1f8ef,#e1f8ef);color:var(--demo-c-078267,#078267)}\n.evidence-tls-status[data-available=\"true\"] .evidence-tls-minus{display:none}\n.evidence-tls-status[data-available=\"true\"] .evidence-tls-check{display:block!important}\n.evidence-tls-description{height:43px;display:flex;align-items:center;margin-top:12px;padding:0 14px;border-radius:6px;background:var(--demo-c-f7f8fa,#f7f8fa);color:var(--demo-c-76818e,#76818e);font-size:12.5px;line-height:18px;white-space:nowrap}\n.evidence-meta{display:grid;grid-template-columns:114px minmax(0,1fr);row-gap:2px;margin:13px 0 0 42px;font-size:13px;line-height:21px}\n.evidence-meta-label{color:var(--demo-c-788390,#788390)}\n.evidence-meta-value{white-space:nowrap;letter-spacing:-.02em;color:var(--demo-c-273343,#273343)}\n.evidence-location{display:flex;gap:13px;align-items:center}\n.evidence-location .flag{width:20px;height:14px}\n.evidence-geo-card .evidence-meta{row-gap:4px;margin-top:10px}\n.evidence-dns-card .evidence-meta{margin-top:8px}\n.evidence-findings{border:1px solid var(--demo-c-edf1f4,#edf1f4);border-bottom:0;border-radius:0 11px 0 0;padding:24px 13px 0 19px}\n.evidence-products{display:grid;gap:10px;margin-top:12px}\n.evidence-product{height:130px;padding:13px 14px;border:1px solid var(--demo-c-e5ebef,#e5ebef);border-radius:5px;background:var(--demo-c-ffffff,#fff)}\n.evidence-product-head{display:flex;align-items:center;gap:10px;height:40px}\n.evidence-product-logo{width:36px;height:40px;object-fit:contain;flex:none}\n.evidence-product-name{font-size:16px;line-height:23px;font-weight:600;letter-spacing:-.025em;white-space:nowrap}\n.evidence-product-confidence{margin-left:auto;align-self:flex-start;margin-top:0;min-width:55px;height:25px;border-radius:16px;display:grid;place-items:center;background:var(--demo-c-e1f8ef,#e1f8ef);color:var(--demo-c-078267,#078267);font-size:12.5px}\n.evidence-product-meta{display:grid;grid-template-columns:90px minmax(0,1fr);row-gap:1px;margin-top:4px;font-size:13px;line-height:19px;color:var(--demo-c-75808e,#75808e)}\n.evidence-product-cpe{font-size:12px;white-space:nowrap;letter-spacing:-.035em}\n.evidence-linked{margin-top:23px}\n.evidence-cves{display:grid;gap:6px;margin-top:7px}\n.evidence-cve{height:63px;padding:8px 14px;border:1px solid var(--demo-c-e5ebef,#e5ebef);border-radius:5px;background:var(--demo-c-ffffff,#fff);position:relative}\n.evidence-cve-title{display:flex;align-items:center;gap:10px;font-size:14.5px;line-height:23px;font-weight:500;letter-spacing:-.035em}\n.evidence-severity{height:24px;padding:0 11px;display:grid;place-items:center;border-radius:15px;font-size:12px;line-height:1;font-weight:400;letter-spacing:0}\n.evidence-severity-critical{background:var(--demo-c-ffe1e5,#ffe1e5);color:var(--demo-c-b5233c,#b5233c)}.evidence-severity-high{background:var(--demo-c-ffead9,#ffead9);color:var(--demo-c-a84c11,#a84c11)}.evidence-severity-medium{background:var(--demo-c-fff5d8,#fff5d8);color:var(--demo-c-9b7317,#9b7317)}\n.evidence-cve-description{font-size:12.5px;line-height:19px;color:var(--demo-c-77818d,#77818d);white-space:nowrap;letter-spacing:-.025em}\n.evidence-cve>.evidence-chevron{position:absolute;right:13px;top:24px}\n.evidence-confidence{margin-top:28px}\n.evidence-confidence .evidence-heading>.ui-icon{width:14px;height:14px;stroke-width:1.9;color:var(--demo-c-7d8997,#7d8997)}\n.evidence-confidence-value{font-size:36px;line-height:47px;letter-spacing:-.02em;font-weight:500;margin-top:6px;font-variant-numeric:tabular-nums}\n.evidence-confidence-track{height:11px;border-radius:7px;background:var(--demo-c-dfe8ec,#dfe8ec);overflow:hidden;margin:7px 7px 0 0}\n.evidence-confidence-fill{height:100%;width:100%;background:var(--demo-c-009bb3,#009bb3);border-radius:inherit;transform:scaleX(.92);transform-origin:left center}\n.evidence-confidence-description{margin-top:16px;font-size:12.5px;line-height:18px;color:var(--demo-c-78818e,#78818e);letter-spacing:-.02em}\n.suggestions-scene{padding:25.5px 46.5px 18px 39px}\n.refine-label{font-size:16.5px;line-height:25px;color:var(--demo-c-697482,#697482);margin-bottom:11px}\n.refine-bar{height:70px;display:flex;align-items:center;gap:25px;border:1.5px solid var(--demo-c-dce2e9,#dce2e9);border-radius:9px;padding-left:23px;background:var(--demo-c-ffffff,#fff);overflow:hidden}\n.refine-bar>.ui-icon{width:23px;height:23px;stroke-width:1.85}\n.refine-bar[data-focused=\"true\"]{border-color:var(--demo-c-99ccd5,#99ccd5)}\n.refine-value-wrap{display:flex;align-items:center;flex:1;min-width:0;font-size:21px;line-height:30px;white-space:nowrap}\n.refine-value{border-radius:3px;min-height:30px}\n.refine-value[data-selected=\"true\"]{background:var(--demo-c-dff2f5,#dff2f5)}\n.refine-caret{width:2px;height:23px;margin-left:2px;background:var(--accent);flex:none;opacity:0}\n.refine-submit{align-self:stretch;width:86px;display:grid;place-items:center;flex:none;background:var(--accent);color:var(--demo-c-ffffff,#fff);border-radius:7px}\n.refine-submit .ui-icon{width:23px;height:23px;stroke-width:1.8}\n.refine-spinner{display:none}\n.refine-submit[data-loading=\"true\"] .refine-arrow{display:none}\n.refine-submit[data-loading=\"true\"] .refine-spinner{display:block}\n.refine-help{display:flex;align-items:center;justify-content:space-between;margin-top:17px;font-size:15px;line-height:23px;color:var(--demo-c-73808d,#73808d)}\n.refine-docs{display:flex;align-items:center;gap:11px;color:var(--demo-c-008da3,#008da3)}\n.refine-docs .ui-icon{width:17px;height:17px;stroke-width:1.75}\n.found-summary{height:150px;margin-top:25px;padding:32px 24px;background:var(--demo-c-f3fafc,#f3fafc);border-radius:11px;display:grid;grid-template-columns:650px 168px 132px minmax(0,1fr);position:relative;z-index:1}\n.found-main{display:flex;align-items:flex-start;gap:37.5px;min-width:0}\n.found-icon{width:60px;height:60px;background:var(--demo-c-e0f6fa,#e0f6fa);color:var(--demo-c-0096ad,#0096ad);border-radius:19px;display:grid;place-items:center;flex:none;margin-top:1px}\n.found-icon .ui-icon{width:26px;height:26px;stroke-width:1.8}\n.found-label{font-size:14.5px;line-height:21px;color:var(--demo-c-72818d,#72818d);letter-spacing:.055em}\n.found-title{font-size:26px;line-height:32px;font-weight:500;letter-spacing:-.035em;margin-top:7px;white-space:nowrap}\n.found-description{font-size:16.5px;line-height:23px;color:var(--demo-c-71808d,#71808d);white-space:nowrap;margin-top:6px;letter-spacing:-.01em}\n.found-metric{border-left:1px solid var(--demo-c-e0eaf0,#e0eaf0);padding-left:33px;min-width:0;height:84px}\n.found-metric-label{font-size:14.5px;line-height:21px;color:var(--demo-c-72808d,#72808d)}\n.found-metric-value{font-size:24px;line-height:30px;font-weight:600;margin-top:6px;font-variant-numeric:tabular-nums}\n.found-metric-description{font-size:15px;line-height:21px;color:var(--demo-c-73818e,#73818e);margin-top:5px;white-space:nowrap;letter-spacing:-.02em}\n.suggested-section{margin-top:31.5px;position:relative;z-index:0}\n.suggested-heading{height:30px;display:flex;align-items:center;justify-content:space-between;font-size:20px;line-height:30px;font-weight:500;letter-spacing:-.025em}\n.suggested-note{font-size:16.5px;line-height:25px;font-weight:400;color:var(--demo-c-73808d,#73808d);letter-spacing:0}\n.suggested-rows{display:grid;gap:10.5px;margin-top:13.5px}\n.suggested-row{height:72px;padding:10px 18px;border:1.5px solid var(--demo-c-e5ebf0,#e5ebf0);border-radius:11px;background:var(--demo-c-ffffff,#fff);display:grid;grid-template-columns:52.5px minmax(0,1fr) 171px 145.5px;column-gap:18px;align-items:center}\n.suggested-row[data-active=\"true\"]{border-color:var(--demo-c-c4e8ee,#c4e8ee);background:var(--demo-c-f5fcfd,#f5fcfd)}\n.suggested-number{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--demo-c-e8f9fc,#e8f9fc);color:var(--demo-c-008ea7,#008ea7);font-size:21px;line-height:1;font-weight:500}\n.suggested-title{font-size:19.5px;line-height:25px;font-weight:500;letter-spacing:-.02em;white-space:nowrap}\n.suggested-description{font-size:16.5px;line-height:22px;color:var(--demo-c-75818f,#75818f);white-space:nowrap;letter-spacing:-.01em}\n.suggested-tag{height:33px;justify-self:start;display:grid;place-items:center;padding:0 15px;background:var(--demo-c-e5f7fb,#e5f7fb);color:var(--demo-c-008fa8,#008fa8);border-radius:12px;font-size:14px;line-height:20px;white-space:nowrap}\n.suggested-run{height:43.5px;display:flex;align-items:center;justify-content:center;gap:18px;border:1.5px solid var(--demo-c-d7dfe7,#d7dfe7);border-radius:9px;background:var(--demo-c-ffffff,#fff);font-size:14px;line-height:21px;white-space:nowrap}\n.suggested-run .ui-icon{width:17px;height:17px;stroke-width:1.75;color:var(--demo-c-667786,#667786)}\n.suggested-run-check,.suggested-run-spinner{display:none!important}\n.suggested-run[data-loading=\"true\"] .suggested-run-arrow{display:none}\n.suggested-run[data-loading=\"true\"] .suggested-run-spinner{display:block!important;color:var(--accent)}\n.suggested-run[data-complete=\"true\"] .suggested-run-arrow{display:none}\n.suggested-run[data-complete=\"true\"] .suggested-run-check{display:block!important;color:var(--accent)}\n@media(prefers-reduced-motion:reduce){.refine-caret{display:none!important}}\n";
const ASSETS={"icons":{"search":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-search\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg>","clock":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-clock\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"12 6 12 12 16 14\"></polyline></svg>","arrow-up-right":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-arrow-up-right\"><line x1=\"7\" y1=\"17\" x2=\"17\" y2=\"7\"></line><polyline points=\"7 7 17 7 17 17\"></polyline></svg>","arrow-up":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-arrow-up\"><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"></line><polyline points=\"5 12 12 5 19 12\"></polyline></svg>","arrow-right":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-arrow-right\"><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line><polyline points=\"12 5 19 12 12 19\"></polyline></svg>","chevron-down":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-chevron-down\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>","external-link":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-external-link\"><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path><polyline points=\"15 3 21 3 21 9\"></polyline><line x1=\"10\" y1=\"14\" x2=\"21\" y2=\"3\"></line></svg>","copy":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-copy\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg>","info":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-info\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"></line></svg>","loader":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-loader\"><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"6\"></line><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"22\"></line><line x1=\"4.93\" y1=\"4.93\" x2=\"7.76\" y2=\"7.76\"></line><line x1=\"16.24\" y1=\"16.24\" x2=\"19.07\" y2=\"19.07\"></line><line x1=\"2\" y1=\"12\" x2=\"6\" y2=\"12\"></line><line x1=\"18\" y1=\"12\" x2=\"22\" y2=\"12\"></line><line x1=\"4.93\" y1=\"19.07\" x2=\"7.76\" y2=\"16.24\"></line><line x1=\"16.24\" y1=\"7.76\" x2=\"19.07\" y2=\"4.93\"></line></svg>","check":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-check\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>","mouse-pointer":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-mouse-pointer\"><path d=\"M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z\"></path><path d=\"M13 13l6 6\"></path></svg>","file":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"></path><path d=\"M14 2v5a1 1 0 0 0 1 1h5\"></path></svg>","file-text":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"></path><path d=\"M14 2v5a1 1 0 0 0 1 1h5\"></path><path d=\"M10 9H8\"></path><path d=\"M16 13H8\"></path><path d=\"M16 17H8\"></path></svg>","lock":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"></rect><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"></path></svg>","waypoints":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m10.586 5.414-5.172 5.172\"></path><path d=\"m18.586 13.414-5.172 5.172\"></path><path d=\"M6 12h12\"></path><circle cx=\"12\" cy=\"20\" r=\"2\"></circle><circle cx=\"12\" cy=\"4\" r=\"2\"></circle><circle cx=\"20\" cy=\"12\" r=\"2\"></circle><circle cx=\"4\" cy=\"12\" r=\"2\"></circle></svg>","map-pin":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"></path><circle cx=\"12\" cy=\"10\" r=\"3\"></circle></svg>","database":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"></ellipse><path d=\"M3 5V19A9 3 0 0 0 21 19V5\"></path><path d=\"M3 12A9 3 0 0 0 21 12\"></path></svg>","circle-minus":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M8 12h8\"></path></svg>"},"flags":{"us":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJmbGFnLWljb25zLXVzIiB2aWV3Qm94PSIwIDAgNjQwIDQ4MCI+CiAgPHBhdGggZmlsbD0iI2JkM2Q0NCIgZD0iTTAgMGg2NDB2NDgwSDAiLz4KICA8cGF0aCBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMzciIGQ9Ik0wIDU1LjNoNjQwTTAgMTI5aDY0ME0wIDIwM2g2NDBNMCAyNzdoNjQwTTAgMzUxaDY0ME0wIDQyNWg2NDAiLz4KICA8cGF0aCBmaWxsPSIjMTkyZjVkIiBkPSJNMCAwaDM2NC44djI1OC41SDAiLz4KICA8bWFya2VyIGlkPSJ1cy1hIiBtYXJrZXJIZWlnaHQ9IjMwIiBtYXJrZXJXaWR0aD0iMzAiPgogICAgPHBhdGggZmlsbD0iI2ZmZiIgZD0ibTE0IDAgOSAyN0wwIDEwaDI4TDUgMjd6Ii8+CiAgPC9tYXJrZXI+CiAgPHBhdGggZmlsbD0ibm9uZSIgbWFya2VyLW1pZD0idXJsKCN1cy1hKSIgZD0ibTAgMCAxNiAxMWg2MSA2MSA2MSA2MSA2MEw0NyAzN2g2MSA2MSA2MCA2MUwxNiA2M2g2MSA2MSA2MSA2MSA2MEw0NyA4OWg2MSA2MSA2MCA2MUwxNiAxMTVoNjEgNjEgNjEgNjEgNjBMNDcgMTQxaDYxIDYxIDYwIDYxTDE2IDE2Nmg2MSA2MSA2MSA2MSA2MEw0NyAxOTJoNjEgNjEgNjAgNjFMMTYgMjE4aDYxIDYxIDYxIDYxIDYweiIvPgo8L3N2Zz4K","de":"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJmbGFnLWljb25zLWRlIiB2aWV3Qm94PSIwIDAgNjQwIDQ4MCI+CiAgPHBhdGggZmlsbD0iI2ZjMCIgZD0iTTAgMzIwaDY0MHYxNjBIMHoiLz4KICA8cGF0aCBmaWxsPSIjMDAwMDAxIiBkPSJNMCAwaDY0MHYxNjBIMHoiLz4KICA8cGF0aCBmaWxsPSJyZWQiIGQ9Ik0wIDE2MGg2NDB2MTYwSDB6Ii8+Cjwvc3ZnPgo="},"logos":{"openssh":"data:image/webp;base64,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","ubuntu":"data:image/webp;base64,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"}};
/* Additional icon assets: Lucide.
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
/* Apcosys product animations. DOM/SVG + GSAP. No clicks, inputs or network requests. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.customElements || window.customElements.get('apcosys-product-demo')) return;
  const WIDTH = 1257;
  const live = new Set();
  let sharedGSAP = null;
  const SCENES = {
    query: { height: 843, label: 'Apcosys search demo: a query is typed, submitted, and added to recent queries.' },
    results: { height: 840, label: 'Apcosys search results demo: a country filter is applied and matching hosts appear.' },
    host: { height: 840, label: 'Apcosys host profile demo: exposure periods change, open services are reviewed, and the host analysis completes.' },
    evidence: { height: 840, label: 'Apcosys evidence demo: a service is selected, technical evidence is updated, and its banner is copied.' },
    suggestions: { height: 840, label: 'Apcosys suggested queries demo: a query is typed, results appear, and a suggested search is run.' }
  };
  const icon = function (name, extra) { return ASSETS.icons[name].replace(/\sclass="[^"]*"/,'').replace('<svg ', '<svg aria-hidden="true" class="ui-icon ' + (extra || '') + '" '); };
  const flag = function (country) { return '<img class="flag" alt="" draggable="false" src="' + ASSETS.flags[country] + '">'; };
  const rows = [
    { domain: 'example.com', ip: '93.184.216.34', description: 'Global content delivery and web services.', tags: ['Web', 'CDN', 'Cloudflare'], numbers: [6,4,8], country: 'United States', city: 'Ashburn', flag: 'us' },
    { domain: 'api.github.com', ip: '140.82.121.5', description: 'Git hosting and developer API platform.', tags: ['Web', 'API', 'GitHub'], numbers: [5,4,7], country: 'United States', city: 'San Francisco', flag: 'us' },
    { domain: '1.1.1.1', ip: '1.1.1.1', description: 'Public DNS resolver.', tags: ['DNS', 'Infrastructure', 'Cloudflare'], numbers: [2,2,3], country: 'United States', city: 'San Francisco', flag: 'us' },
    { domain: 'scanme.nmap.org', ip: '45.33.32.156', description: 'Nmap test host for scanning research.', tags: ['SSH', 'Test', 'Nmap'], numbers: [7,6,4], country: 'Germany', city: 'Falkenstein', flag: 'de' }
  ];
  // Preserve the reference curve's vertices. Both periods share an SVG topology.
  const SERIES_X = [35,55,73,81,104,125,149,170,195,211,220,243,265,287,308,329,353,375,402,422,470,493,515,537,559,583,628,642,650];
  const SERIES90 = [4.22,7.27,7.03,8.91,9.14,14.77,14.3,18.52,15.23,11.48,13.36,12.42,18.28,15.7,20.86,29.3,26.25,34.92,40.31,49.92,30.23,26.02,26.02,20.86,26.02,22.03,21.8,23.91,24.84];
  const SERIES30 = [10,10,11,12,13,16,15,17,16,16,20,18,22,21,23,27,26,29,31,35,29,27,26,24,25,23,23,23.5,24];
  function chartPoint(index, values) { return { x: SERIES_X[index], y: 145 - values[index] * 128 / 60 }; }
  function linePath(values) { return values.map(function (_, i) { const p = chartPoint(i, values); return (i ? 'L' : 'M') + p.x.toFixed(3) + ',' + p.y.toFixed(3); }).join(' '); }
  function areaPath(values) { return linePath(values) + ' L650,145 L35,145 Z'; }
  function queryMarkup() {
    const recent = ['apache country:us port:443','nginx ssl:true country:de','cve:2024-3094','ssh port:22 country:jp'];
    return '<div class="surface query-scene"><div class="query-bar">' + icon('search') +
      '<div class="query-value-wrap"><span class="query-value">apache country:us port:443</span><span class="query-caret"></span></div><div class="query-submit">' + icon('arrow-up','query-arrow') + icon('loader','query-spinner') + '</div></div>' +
      '<div class="recent"><div class="recent-heading"><span>Recent queries</span><span class="clear-all">Clear all</span></div><div class="recent-rows">' +
      recent.map(function (text, index) { return '<div class="recent-row" data-recent="' + index + '">' + icon('clock') + '<span class="recent-label">' + text + '</span><span class="recent-action">' + icon('arrow-up-right','recent-arrow') + icon('check','recent-check') + '</span></div>'; }).join('') +
      '</div></div><div class="syntax"><div class="syntax-heading"><span>Search syntax</span><span class="docs-link">View docs' + icon('external-link') + '</span></div><div class="syntax-chips">' +
      ['service:nginx','port:443','country:us','ssl:true'].map(function (text) { return '<span class="syntax-chip" data-token="' + text + '">' + text + '</span>'; }).join('') + '</div></div></div>';
  }
  function resultsMarkup() {
    return '<div class="surface results-scene"><div class="results-toolbar"><div class="result-search">' + icon('search','result-search-icon') + icon('loader','result-spinner') + '<span>Search hosts, domains, IPs...</span></div>' +
      '<div class="filter filter-services"><span>All services</span>' + icon('chevron-down') + '</div><div class="filter filter-technologies"><span>All technologies</span>' + icon('chevron-down') + '</div>' +
      '<div class="filter filter-countries"><span class="country-filter-label">All countries</span>' + icon('chevron-down') + '<div class="country-menu"><div class="country-option">All countries</div><div class="country-option country-us">' + flag('us') + '<span>United States</span></div><div class="country-option">' + flag('de') + '<span>Germany</span></div></div></div>' +
      '<div class="filter filter-sort"><span>Sort by: Relevance</span>' + icon('chevron-down') + '</div></div><div class="result-rows">' +
      rows.map(function (row, i) { return '<div class="result-row" data-row="' + i + '"><div class="result-summary"><div class="result-title"><span class="result-domain">' + row.domain + '</span>' + icon('external-link') + '</div><div class="result-ip">' + row.ip + '</div><div class="result-description">' + row.description + '</div><div class="result-tags">' +
        row.tags.map(function (text) { return '<span class="result-tag">' + text + '</span>'; }).join('') + '</div></div>' +
        row.numbers.map(function (value, j) { return '<div class="result-metric"><span class="metric-label">' + ['Open ports','Services','Technologies'][j] + '</span><span class="metric-value" data-value="' + value + '">' + value + '</span></div>'; }).join('') +
        '<div class="result-country">' + flag(row.flag) + '<div><div class="country-name">' + row.country + '</div><div class="country-city">' + row.city + '</div></div></div></div>'; }).join('') +
      '</div><div class="results-footer"><span class="result-count">3 hosts found</span><div class="load-more"><span>Load more</span>' + icon('arrow-right') + '</div></div></div>';
  }
  function hostMarkup() {
    const meta = [['Organization','Example Organization Ltd.'],['ASN','AS64500'],['Location',flag('us') + '<span>San Francisco, United States</span>'],['First seen','Jan 12, 2023'],['Last seen','Apr 26, 2025']];
    const end = chartPoint(SERIES90.length - 1, SERIES90);
    return '<div class="surface host-scene"><div class="host-layout"><div class="host-summary"><div class="host-ip-heading"><span class="host-ip">203.0.113.10</span><span class="host-copy">' + icon('copy','host-copy-icon') + icon('check','host-copy-check') + '</span></div><div class="host-domain"><span>example.com</span>' + icon('external-link') + '</div><div class="host-metadata">' +
      meta.map(function (pair, i) { return '<div class="host-meta-row"><span class="host-meta-label">' + pair[0] + '</span><span class="' + (i === 2 ? 'host-meta-location' : 'host-meta-value') + '">' + pair[1] + '</span></div>'; }).join('') +
      '</div></div><div class="host-detail"><section class="chart-panel"><div class="host-panel-heading"><div class="host-panel-title"><span>Exposure over time</span>' + icon('info') + '</div><div class="periods">' +
      ['7D','30D','90D','1Y'].map(function (text) { return '<span class="period" data-period="' + text + '" data-active="' + (text === '90D') + '">' + text + '</span>'; }).join('') +
      '</div></div><svg class="exposure-chart" viewBox="0 0 670 188" aria-hidden="true"><text class="chart-axis" x="2" y="31">60</text><text class="chart-axis" x="2" y="87">30</text><text class="chart-axis" x="11" y="140">0</text>' +
      [35,125,219,312,405,498,590,650].map(function (x) { return '<path class="chart-grid" d="M' + x + ' 17 V145"/>'; }).join('') +
      '<path class="chart-area" d="' + areaPath(SERIES90) + '"/><path class="chart-line" d="' + linePath(SERIES90) + '"/><circle class="chart-dot" cx="' + end.x + '" cy="' + end.y + '" r="6"/><g class="chart-tip" transform="translate(' + end.x + ',' + (end.y - 47) + ')"><rect class="chart-tooltip" x="-21" y="0" width="42" height="32" rx="8"/><text class="chart-tooltip-text" x="0" y="22">28</text></g>' +
      ['Jan 1','Jan 15','Feb 1','Feb 15','Mar 1','Mar 15','Apr 1'].map(function (text, i) { return '<text class="chart-date" x="' + (35 + i * 91) + '" y="175">' + text + '</text>'; }).join('') +
      '</svg></section><section class="vulnerability-panel"><div class="host-panel-heading"><div class="host-panel-title"><span>Vulnerabilities</span>' + icon('info') + '</div><span class="view-all">View all' + icon('arrow-right') + '</span></div><div class="vulnerability-tiles">' +
      [[2,'Critical','critical'],[5,'High','high'],[12,'Medium','medium'],[3,'Low','low']].map(function (tile) { return '<div class="vulnerability-tile ' + tile[2] + '"><div class="vulnerability-value" data-value="' + tile[0] + '">' + tile[0] + '</div><div class="vulnerability-name">' + tile[1] + '</div></div>'; }).join('') +
      '</div></section><section class="services-panel"><div class="host-panel-heading"><div class="host-panel-title"><span>Open services</span>' + icon('info') + '</div><span class="view-all">View all' + icon('arrow-right') + '</span></div><div class="service-rows">' +
      [['22','SSH'],['80','HTTP'],['443','HTTPS'],['3306','MySQL']].map(function (pair, i) { return '<div class="service-row" data-service="' + i + '"><span class="service-port">' + pair[0] + ' <span>/ tcp</span></span><span class="service-name">' + pair[1] + '</span><span class="service-state">Open</span></div>'; }).join('') +
      '</div></section></div></div></div>';
  }
  function evidenceMeta(items) {
    return '<div class="evidence-meta">'+items.map(function(pair){return '<div class="evidence-meta-label">'+pair[0]+'</div><div class="evidence-meta-value">'+pair[1]+'</div>';}).join('')+'</div>';
  }
  function evidenceMarkup() {
    const services=[['22','SSH'],['80','HTTP'],['443','HTTPS'],['3306','MySQL']];
    const products=[['openssh','OpenSSH','8.2p1','OpenSSH','cpe:/a:openbsd:openssh:8.2p1'],['ubuntu','Ubuntu','20.04.5 LTS','Ubuntu Linux','cpe:/o:canonical:ubuntu_linux:20.04']];
    const cves=[['CVE-2023-38408','Critical','critical','OpenSSH regreSSHion RCE vulnerability'],['CVE-2021-41617','High','high','OpenSSH privilege escalation'],['CVE-2020-15778','Medium','medium','OpenSSH information disclosure']];
    const location='<span class="evidence-location">'+flag('us')+'<span>United States</span></span>';
    return '<div class="surface evidence-scene"><div class="evidence-layout"><section class="evidence-services"><div class="evidence-heading">Open services<span class="evidence-count">4</span></div><div class="evidence-service-list">'+
      services.map(function(service){return '<div class="evidence-service" data-port="'+service[0]+'" data-active="'+(service[0]==='22')+'"><div><div class="evidence-port">'+service[0]+' <span>/ tcp</span></div><div class="evidence-service-name">'+service[1]+'</div></div><span class="evidence-open">Open</span><span class="evidence-chevron">'+icon('chevron-down')+'</span></div>';}).join('')+
      '</div></section><section class="evidence-center"><div class="evidence-center-header"><div><div class="evidence-center-title">Technical evidence</div><div class="evidence-source">Evidence collected from 203.0.113.10:22</div></div><div class="evidence-nav"><span class="evidence-nav-item evidence-nav-prev">'+icon('chevron-down')+'</span><span class="evidence-nav-item evidence-nav-next">'+icon('chevron-down')+'</span></div></div><div class="evidence-cards">'+
      '<div class="evidence-card evidence-banner-card"><div class="evidence-card-heading">'+icon('file')+'<div><div class="evidence-card-title">Service banner</div><div class="evidence-card-subtitle evidence-protocol">SSH protocol banner</div></div><span class="evidence-raw">Raw'+icon('external-link')+'</span></div><div class="evidence-banner"><span class="evidence-banner-text">SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5</span><span class="evidence-banner-copy">'+icon('copy','evidence-banner-copy-icon')+icon('check','evidence-banner-check')+'</span></div></div>'+
      '<div class="evidence-card evidence-tls-card"><div class="evidence-card-heading">'+icon('lock')+'<div><div class="evidence-card-title">SSL / TLS</div><div class="evidence-card-subtitle">Certificate details (if available)</div></div><span class="evidence-tls-status" data-available="false">'+icon('circle-minus','evidence-tls-minus')+icon('check','evidence-tls-check')+'<span class="evidence-tls-label">Not available</span></span></div><div class="evidence-tls-description">No SSL/TLS service detected on port 22.</div></div>'+
      '<div class="evidence-card evidence-network-card"><div class="evidence-card-heading">'+icon('waypoints')+'<div class="evidence-card-title">Network information</div></div>'+evidenceMeta([['ASN','AS64500'],['Organization','Example Organization Ltd.'],['IP range','203.0.113.0/24'],['',location]])+'</div>'+
      '<div class="evidence-card evidence-geo-card"><div class="evidence-card-heading">'+icon('map-pin')+'<div class="evidence-card-title">Geolocation</div></div>'+evidenceMeta([['City','San Francisco'],['Region','California'],['Country',location],['Coordinates','37.7749, -122.4194']])+'</div>'+
      '<div class="evidence-card evidence-dns-card"><div class="evidence-card-heading">'+icon('database')+'<div class="evidence-card-title">Reverse DNS</div></div>'+evidenceMeta([['PTR record','example.com'],['Resolved to','203.0.113.10']])+'</div>'+
      '</div></section><section class="evidence-findings"><div class="evidence-heading">Detected products<span class="evidence-count">2</span></div><div class="evidence-products">'+
      products.map(function(product){return '<div class="evidence-product" data-product="'+product[0]+'"><div class="evidence-product-head"><img class="evidence-product-logo" src="'+ASSETS.logos[product[0]]+'" alt="" draggable="false"><span class="evidence-product-name">'+product[1]+'</span><span class="evidence-product-confidence">High</span></div><div class="evidence-product-meta"><span>Version</span><span>'+product[2]+'</span><span>Product</span><span>'+product[3]+'</span><span>CPE</span><span class="evidence-product-cpe">'+product[4]+'</span></div></div>';}).join('')+
      '</div><div class="evidence-linked"><div class="evidence-heading">Linked CVEs<span class="evidence-count">3</span></div><div class="evidence-cves">'+
      cves.map(function(cve,i){return '<div class="evidence-cve" data-cve="'+i+'"><div class="evidence-cve-title"><span>'+cve[0]+'</span><span class="evidence-severity evidence-severity-'+cve[2]+'">'+cve[1]+'</span></div><div class="evidence-cve-description">'+cve[3]+'</div><span class="evidence-chevron">'+icon('chevron-down')+'</span></div>';}).join('')+
      '</div></div><div class="evidence-confidence"><div class="evidence-heading">Confidence'+icon('info')+'</div><div class="evidence-confidence-value"><span class="evidence-confidence-number">92</span>%</div><div class="evidence-confidence-track"><div class="evidence-confidence-fill"></div></div><div class="evidence-confidence-description">High confidence based on multiple consistent signals<br>across banner, service behavior and OS fingerprinting.</div></div></section></div></div>';
  }
  function suggestionsMarkup() {
    const suggestions=[
      ['Find known vulnerabilities','Apache hosts that may be affected by recent CVEs.','CVEs'],
      ['Same ASN','Other services on the same ASNs (e.g. related infrastructure).','Same ASN'],
      ['Same service on other ports','Find Apache on different ports (e.g. 8080, 8443).','Same service'],
      ['Same TLS certificate','Other hosts using the same TLS certificate.','Same certificate'],
      ['Related technology','Hosts running related technologies (e.g. PHP, OpenSSL).','Related technology']
    ];
    return '<div class="surface suggestions-scene"><div class="refine-label">Refine your query</div><div class="refine-bar">'+icon('search')+'<div class="refine-value-wrap"><span class="refine-value">ssl:true apache country:us</span><span class="refine-caret"></span></div><span class="refine-submit">'+icon('arrow-right','refine-arrow')+icon('loader','refine-spinner')+'</span></div><div class="refine-help"><span>Add filters, technologies, countries or ports to narrow your search.</span><span class="refine-docs">View query syntax'+icon('external-link')+'</span></div>'+
      '<div class="found-summary"><div class="found-main"><span class="found-icon">'+icon('file-text')+'</span><div><div class="found-label">WHAT WE FOUND</div><div class="found-title"><span class="found-host-count" data-value="248">248</span> internet-facing hosts</div><div class="found-description">Running Apache HTTP Server with SSL in the United States.</div></div></div><div class="found-metric"><div class="found-metric-label">Countries</div><div class="found-metric-value found-countries-value" data-value="1">1</div><div class="found-metric-description">United States</div></div><div class="found-metric"><div class="found-metric-label">ASNs</div><div class="found-metric-value found-asns-value" data-value="37">37</div></div><div class="found-metric"><div class="found-metric-label">Open ports</div><div class="found-metric-value found-ports-value" data-value="4">4</div><div class="found-metric-description found-ports-description">80, 443, 8080, 8443</div></div></div>'+
      '<section class="suggested-section"><div class="suggested-heading"><span>Suggested next queries</span><span class="suggested-note">Investigate further with one click.</span></div><div class="suggested-rows">'+
      suggestions.map(function(row,i){return '<div class="suggested-row" data-suggestion="'+i+'"><span class="suggested-number">'+(i+1)+'</span><div><div class="suggested-title">'+row[0]+'</div><div class="suggested-description">'+row[1]+'</div></div><span class="suggested-tag">'+row[2]+'</span><span class="suggested-run"><span>Run query</span>'+icon('arrow-right','suggested-run-arrow')+icon('loader','suggested-run-spinner')+icon('check','suggested-run-check')+'</span></div>';}).join('')+
      '</div></section></div>';
  }
  class ApcosysProductDemo extends HTMLElement {
    static get observedAttributes() { return ['scene','autoplay','speed','fit']; }
    constructor() {
      super(); this.attachShadow({ mode: 'open' }); this._paused = false; this._intersecting = true; this._cursorPosition = { x: 0, y: 0 };
    }
    get scene() { return SCENES[this.getAttribute('scene')] ? this.getAttribute('scene') : 'query'; }
    get ready() { return Boolean(this._ready); }
    get animated() { return Boolean(this._timeline) && !this._reduced; }
    get speed() { const n = Number(this.getAttribute('speed') || 1); return Number.isFinite(n) ? Math.min(3, Math.max(.25, n)) : 1; }
    get autoplay() { return this.getAttribute('autoplay') !== 'false'; }
    $(selector) { return this.shadowRoot.querySelector(selector); }
    $$(selector) { return Array.from(this.shadowRoot.querySelectorAll(selector)); }
    _paint(name, fallback) { const value = getComputedStyle(this).getPropertyValue(name).trim(); return value || fallback; }
    connectedCallback() {
      if (this._connected) return;
      this._connected = true; live.add(this);
      this._events = new AbortController();
      this._media = matchMedia('(prefers-reduced-motion: reduce)'); this._reduced = this._media.matches;
      this._media.addEventListener('change', (event) => { this._reduced = event.matches; this._initialize(); }, { signal: this._events.signal });
      document.addEventListener('visibilitychange', () => this._sync(), { signal: this._events.signal });
      this._observer = new IntersectionObserver((entries) => { this._intersecting = entries[0].isIntersecting; this._sync(); }); this._observer.observe(this);
      this._render();
      this._resizeObserver = new ResizeObserver(() => this._fitFrame());
      this._resizeObserver.observe(this);
      this._fitFrame();
      this._ready = true; this._initialize();
    }
    disconnectedCallback() { this._connected = false; live.delete(this); this._events?.abort(); this._observer?.disconnect(); this._resizeObserver?.disconnect(); this._context?.revert(); this._context = null; this._timeline = null; }
    attributeChangedCallback(name, previous, next) {
      if (previous === next || !this._connected) return;
      if (name === 'scene') this._render();
      if (name === 'speed') this._timeline?.timeScale(this.speed);
      if (name === 'autoplay') this._sync();
    }
    configure(options) { if (options?.gsap) this._gsap = options.gsap; if (this._connected) this._initialize(); return this; }
    play() { this._paused = false; this._sync(); return this; }
    pause() { this._paused = true; this._sync(); return this; }
    restart() { this._paused = false; this._initialize(); return this; }
    _fitFrame() {
      const viewport = this.$('.viewport'), frame = this.$('.frame'), info = SCENES[this.scene];
      if (!viewport || !frame) return;
      const width = viewport.clientWidth, height = viewport.clientHeight || (width * info.height / WIDTH);
      if (!width || !height) return;
      const scale = Math.min(width / WIDTH, height / info.height);
      const x = (width - WIDTH * scale) / 2, y = (height - info.height * scale) / 2;
      frame.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + scale + ')';
    }
    _render() {
      this._context?.revert(); this._context = null; this._timeline = null;
      const info = SCENES[this.scene];
      const markup = this.scene === 'query' ? queryMarkup() : this.scene === 'results' ? resultsMarkup() : this.scene === 'evidence' ? evidenceMarkup() : this.scene === 'suggestions' ? suggestionsMarkup() : hostMarkup();
      // Scale fixed illustrative DOM with a regular CSS transform. This avoids
      // iOS/WebKit foreignObject scaling bugs while keeping the scene itself unchanged.
      this.shadowRoot.innerHTML = '<style>' + CSS + '</style><div class="viewport" aria-hidden="true"><div class="frame" style="height:' + info.height + 'px" inert aria-hidden="true">' + markup +
        '<div class="cursor">' + icon('mouse-pointer') + '</div></div></div>';
      if (this.scene === 'host') {
        this.$('.chart-line').setAttribute('pathLength','1');
        this.$('.chart-line').setAttribute('stroke-dasharray','1');
        this.$('.chart-line').setAttribute('stroke-dashoffset','0');
        this.$$('.vulnerability-value').forEach(function (el) { el.dataset.value=el.textContent; });
      }
      requestAnimationFrame(() => this._fitFrame());
      if (this._ready) this._initialize();
    }
    _initialize() {
      this._context?.revert(); this._context = null; this._timeline = null;
      this._gsap = this._gsap || sharedGSAP || window.gsap;
      this._reset();
      if (!this._ready) return;
      if (!this._gsap || this._reduced) { this._signalReady(false); return; }
      this._context = this._gsap.context(() => {
        const tl = this._gsap.timeline({ paused: true, repeat: -1 });
        this._timeline = tl;
        if (this.scene === 'query') this._queryTimeline(tl);
        else if (this.scene === 'results') this._resultsTimeline(tl);
        else if (this.scene === 'evidence') this._evidenceTimeline(tl);
        else if (this.scene === 'suggestions') this._suggestionsTimeline(tl);
        else this._hostTimeline(tl);
      }, this.shadowRoot);
      this._timeline.timeScale(this.speed); this._sync(); this._signalReady(true);
    }
    _signalReady(animated) { this.dispatchEvent(new CustomEvent('apcosys-ready',{detail:{scene:this.scene,animated:animated}})); }
    _sync() { this._timeline?.paused(this._paused || !this.autoplay || document.hidden || !this._intersecting || this._reduced); }
    _reset() {
      this.$('.cursor').style.opacity = '0';
      if (this.scene === 'query') {
        this.$('.query-value').textContent = 'apache country:us port:443';
        this.$('.query-value').removeAttribute('data-selected');
        this.$('.query-bar').removeAttribute('data-focused');
        this.$('.query-submit').removeAttribute('data-loading');
        this.$('.query-caret').style.opacity = '0';
        this.$$('.syntax-chip').forEach(function (el) { el.removeAttribute('data-active'); });
        this.$('.recent-row').removeAttribute('data-complete');
      } else if (this.scene === 'results') {
        this.$('.country-filter-label').textContent = 'All countries';
        this.$('.filter-countries').removeAttribute('data-active');
        this.$('.results-scene').removeAttribute('data-loading');
        this.$('.country-menu').style.visibility = 'hidden'; this.$('.country-menu').style.opacity = '0';
        this.$$('.result-row').forEach(function (el) { el.style.visibility = 'visible'; el.style.opacity = '1'; });
        this.$$('.metric-value').forEach(function (el) { el.textContent = el.dataset.value; });
        this.$('.result-count').style.opacity = '0';
      } else if (this.scene === 'host') {
        this.$$('.period').forEach(function (el) { el.dataset.active = String(el.dataset.period === '90D'); });
        this.$('.chart-line').setAttribute('d',linePath(SERIES90)); this.$('.chart-area').setAttribute('d',areaPath(SERIES90));
        const point = chartPoint(SERIES90.length - 1, SERIES90);
        this.$('.chart-dot').setAttribute('cx',point.x); this.$('.chart-dot').setAttribute('cy',point.y);
        this.$('.chart-tip').setAttribute('transform','translate(' + point.x + ',' + (point.y - 47) + ')');
        this.$('.chart-tooltip-text').textContent = '28';
        this.$$('.vulnerability-value').forEach(function (el) { el.textContent=el.dataset.value; });
        ['Jan 1','Jan 15','Feb 1','Feb 15','Mar 1','Mar 15','Apr 1'].forEach((text, i) => { this.$$('.chart-date')[i].textContent = text; });
        this.$('.host-copy').removeAttribute('data-copied');
      } else if (this.scene === 'evidence') {
        this._evidenceService('22');
        this.$('.evidence-confidence-number').textContent='92';
      } else if (this.scene === 'suggestions') {
        this._suggestionsState(false);
        this.$('.refine-bar').removeAttribute('data-focused');
        this.$('.refine-value').removeAttribute('data-selected');
        this.$('.refine-submit').removeAttribute('data-loading');
        this.$('.refine-caret').style.opacity='0';
        this.$$('.suggested-run').forEach(function(el){el.removeAttribute('data-loading');el.removeAttribute('data-complete');});
      }
    }
    _evidenceService(port) {
      const tls=port==='443';
      this.$$('.evidence-service').forEach(function(el){el.dataset.active=String(el.dataset.port===port);});
      this.$('.evidence-source').textContent='Evidence collected from 203.0.113.10:'+port;
      this.$('.evidence-protocol').textContent=tls?'HTTPS response banner':'SSH protocol banner';
      this.$('.evidence-banner-text').textContent=tls?'HTTP/1.1 200 OK · Apache/2.4.41 (Ubuntu)':'SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5';
      this.$('.evidence-tls-status').dataset.available=String(tls);
      this.$('.evidence-tls-label').textContent=tls?'Available':'Not available';
      this.$('.evidence-tls-description').textContent=tls?'Valid certificate · example.com · TLS 1.3.':'No SSL/TLS service detected on port 22.';
      this.$('.evidence-banner-copy').removeAttribute('data-copied');
    }
    _suggestionsState(refined) {
      this.$('.refine-value').textContent=refined?'apache country:us port:8080':'ssl:true apache country:us';
      this.$('.found-host-count').textContent=refined?'64':'248';
      this.$('.found-description').textContent=refined?'Running Apache HTTP Server on port 8080 in the United States.':'Running Apache HTTP Server with SSL in the United States.';
      this.$('.found-asns-value').textContent=refined?'23':'37';
      this.$('.found-ports-value').textContent=refined?'1':'4';
      this.$('.found-countries-value').textContent='1';
      this.$('.found-ports-description').textContent=refined?'8080':'80, 443, 8080, 8443';
      this.$$('.suggested-row').forEach(function(el){el.dataset.active=String(refined&&el.dataset.suggestion==='2');});
    }
    _number(tl, selector, from, to, at, duration) {
      const state={value:from};
      tl.fromTo(state,{value:from},{value:to,duration:duration||.5,ease:'power2.out',immediateRender:false,onUpdate:()=>{this.$(selector).textContent=String(Math.round(state.value));}},at);
    }
    _evidenceTimeline(tl) {
      const g=this._gsap, banner=this.$('.evidence-banner');
      tl.call(()=>{this._reset();this._cursorAt('[data-port="22"]');g.set(this.$('.surface'),{opacity:1});},[],0);
      tl.to(this.$('.cursor'),{opacity:1,duration:.28},.18);
      tl.fromTo(this.$$('.evidence-card'),{opacity:.55,y:3},{opacity:1,y:0,duration:.42,stagger:.035,ease:'power2.out',immediateRender:false},.12);
      tl.fromTo(this.$$('.evidence-product'),{opacity:.55,x:3},{opacity:1,x:0,duration:.42,stagger:.07,ease:'power2.out',immediateRender:false},.25);
      this._number(tl,'.evidence-confidence-number',88,92,.2,.6);
      tl.fromTo(this.$('.evidence-confidence-fill'),{scaleX:.88},{scaleX:.92,duration:.6,ease:'power2.out',immediateRender:false},.2);
      this._move(tl,'[data-port="443"]',.32,.55);this._press(tl,.94);
      this._pulse(tl,'[data-port="443"]',.94,{scale:.99,y:0,stagger:0});
      tl.call(()=>this._evidenceService('443'),[],1.12);
      tl.fromTo([this.$('.evidence-banner-card'),this.$('.evidence-tls-card')],{opacity:.45,y:3},{opacity:1,y:0,duration:.38,stagger:.055,ease:'power2.out',immediateRender:false},1.12);
      tl.fromTo(this.$('.evidence-tls-status'),{opacity:.4,scale:.96},{opacity:1,scale:1,duration:.35,ease:'power2.out',immediateRender:false},1.24);
      this._move(tl,'.evidence-banner-copy',1.85,.62);this._press(tl,2.55);
      tl.call(()=>{this.$('.evidence-banner-copy').dataset.copied='true';},[],2.73);
      this._pulse(tl,'.evidence-banner-check',2.73,{scale:1.12,y:0,stagger:0});
      tl.to(banner,{backgroundColor:this._paint('--demo-anim-info','#eaf8fb'),duration:.28},2.73);
      tl.to(banner,{backgroundColor:this._paint('--demo-anim-banner-base','#f6f8fa'),duration:.4},3.25);
      tl.call(()=>{this.$('.evidence-banner-copy').removeAttribute('data-copied');},[],3.45);
      this._move(tl,'[data-cve="0"] .evidence-severity',3.15,.65);
      tl.to(this.$('[data-cve="0"]'),{backgroundColor:this._paint('--demo-anim-danger','#fff7f8'),duration:.3},3.7);
      this._pulse(tl,'[data-cve="0"] .evidence-severity',3.75,{scale:1.035,y:-1,stagger:0});
      tl.to(this.$('[data-cve="0"]'),{backgroundColor:this._paint('--demo-anim-base','#ffffff'),duration:.4},4.35);
      this._move(tl,'[data-port="22"]',4.5,.62);this._press(tl,5.18);
      this._pulse(tl,'[data-port="22"]',5.18,{scale:.99,y:0,stagger:0});
      tl.call(()=>this._evidenceService('22'),[],5.36);
      tl.fromTo([this.$('.evidence-banner-card'),this.$('.evidence-tls-card')],{opacity:.45,y:3},{opacity:1,y:0,duration:.38,stagger:.055,ease:'power2.out',immediateRender:false},5.36);
      this._move(tl,'.evidence-confidence-value',5.85,.6);
      this._pulse(tl,'.evidence-confidence-value',6.43,{scale:1.018,y:-1,stagger:0});
      this._loop(tl,6.85,7.8);
    }
    _suggestionsTimeline(tl) {
      const g=this._gsap,bar=this.$('.refine-bar'),text='ssl:true apache country:us',run=this.$('[data-suggestion="2"] .suggested-run');
      tl.call(()=>{this._reset();this._cursorAt('.refine-value');g.set(this.$('.surface'),{opacity:1});},[],0);
      tl.to(this.$('.cursor'),{opacity:1,duration:.28},.18);
      this._move(tl,'.refine-value',.28,.42);this._press(tl,.76);
      tl.call(()=>{bar.dataset.focused='true';this.$('.refine-value').dataset.selected='true';},[],.9);
      tl.fromTo(bar,{boxShadow:'0 0 0 0px #008da300'},{boxShadow:'0 0 0 3px #008da30b',duration:.3,ease:'power2.out',immediateRender:false},.9);
      tl.call(()=>{this.$('.refine-value').removeAttribute('data-selected');this.$('.refine-value').textContent='';},[],1.07);
      tl.fromTo(this.$('.refine-caret'),{opacity:1},{opacity:.2,duration:.2,repeat:5,yoyo:true,ease:'sine.inOut',immediateRender:false},1.07);
      let tick=1.08;
      Array.from(text).forEach((letter,index)=>{tick+=[.043,.033,.055,.04,.037,.048][index%6];const value=text.slice(0,index+1);tl.call(()=>{this.$('.refine-value').textContent=value;},[],tick);});
      tl.to(this.$('.refine-caret'),{opacity:0,duration:.12},tick+.1);
      tl.call(()=>bar.removeAttribute('data-focused'),[],tick+.16);
      this._move(tl,'.refine-submit',2.28,.48);this._press(tl,2.84);
      this._pulse(tl,'.refine-submit',2.84,{scale:.965,y:0,stagger:0});
      tl.call(()=>{this.$('.refine-submit').dataset.loading='true';},[],2.96);
      tl.fromTo(this.$('.refine-spinner'),{rotation:0},{rotation:280,duration:.46,ease:'none',immediateRender:false},2.96);
      tl.call(()=>this.$('.refine-submit').removeAttribute('data-loading'),[],3.42);
      tl.fromTo(this.$('.found-summary'),{opacity:.65,y:3},{opacity:1,y:0,duration:.4,ease:'power2.out',immediateRender:false},3.42);
      this._number(tl,'.found-host-count',210,248,3.42,.45);
      this._number(tl,'.found-asns-value',30,37,3.46,.4);
      tl.fromTo(this.$$('.suggested-row'),{opacity:.5,y:3},{opacity:1,y:0,duration:.35,stagger:.045,ease:'power2.out',immediateRender:false},3.45);
      this._move(tl,run,3.82,.6);this._press(tl,4.49);
      this._pulse(tl,run,4.49,{scale:.975,y:0,stagger:0});
      tl.call(()=>{run.dataset.loading='true';this.$('[data-suggestion="2"]').dataset.active='true';},[],4.61);
      tl.fromTo(this.$('[data-suggestion="2"] .suggested-run-spinner'),{rotation:0},{rotation:260,duration:.38,ease:'none',immediateRender:false},4.61);
      tl.to(this.$('.refine-value'),{opacity:.25,duration:.16},4.8);
      tl.call(()=>{this._suggestionsState(true);run.removeAttribute('data-loading');run.dataset.complete='true';},[],4.98);
      tl.to(this.$('.refine-value'),{opacity:1,duration:.26},4.98);
      tl.fromTo(this.$('.found-summary'),{opacity:.65,y:2},{opacity:1,y:0,duration:.35,ease:'power2.out',immediateRender:false},4.98);
      this._number(tl,'.found-host-count',248,64,4.98,.45);
      this._number(tl,'.found-asns-value',37,23,5.02,.4);
      this._pulse(tl,'[data-suggestion="2"] .suggested-tag',4.98,{scale:1.025,y:-1,stagger:0});
      tl.call(()=>run.removeAttribute('data-complete'),[],5.7);
      tl.to([this.$('.refine-value'),this.$('.found-summary')],{opacity:.25,duration:.18},6.1);
      tl.call(()=>this._suggestionsState(false),[],6.3);
      tl.to([this.$('.refine-value'),this.$('.found-summary')],{opacity:1,duration:.35},6.3);
      tl.to(bar,{boxShadow:'0 0 0 0px #008da300',duration:.3},6.3);
      this._loop(tl,6.5,7.4);
    }
    _point(selector) {
      const el = typeof selector === 'string' ? this.$(selector) : selector, frame = this.$('.frame').getBoundingClientRect(), b = el.getBoundingClientRect();
      if (frame.width <= 0 || frame.height <= 0) return Object.assign({},this._cursorPosition);
      return { x: (b.left - frame.left + b.width * .58) * WIDTH / frame.width, y: (b.top - frame.top + b.height * .58) * SCENES[this.scene].height / frame.height };
    }
    _cursorAt(selector) { this._cursorPosition = this._point(selector); this._drawCursor(); }
    _drawCursor() { this.$('.cursor').style.transform = 'translate3d(' + this._cursorPosition.x + 'px,' + this._cursorPosition.y + 'px,0)'; }
    _move(tl, selector, at, duration) {
      const progress = { p: 0 }; let from = { x: 0, y: 0 };
      tl.to(progress, { p: 1, duration: duration || .85, ease: 'power2.inOut', onStart: () => { progress.p = 0; from = Object.assign({},this._cursorPosition); }, onUpdate: () => { const to = this._point(selector), p = progress.p, arc = Math.min(14,Math.hypot(to.x-from.x,to.y-from.y)*.024)*Math.sin(Math.PI*p); this._cursorPosition = { x: from.x+(to.x-from.x)*p+arc, y: from.y+(to.y-from.y)*p }; this._drawCursor(); } }, at);
    }
    _press(tl, at) { tl.to(this.$('.cursor svg'), { scale: .91, duration: .1, ease: 'power1.out' }, at).to(this.$('.cursor svg'), { scale: 1, duration: .18, ease: 'power2.out' }, at + .1); }
    _count(tl, selector, at, duration) {
      this.$$(selector).forEach((el, i) => { const state = { value: 0 }, value = Number(el.dataset.value); tl.fromTo(state, { value: 0 }, { value, duration: duration || .7, ease: 'power2.out', immediateRender: false, onUpdate: () => { el.textContent = String(Math.round(state.value)); } }, at + i * .024); });
    }
    _pulse(tl, selector, at, options) {
      const settings=options || {}, targets=typeof selector==='string'?this.$$(selector):selector;
      const duration=settings.duration || .2, stagger=settings.stagger ?? .025;
      tl.fromTo(targets,{scale:1,y:0},{scale:settings.scale ?? 1.015,y:settings.y ?? -2,duration,stagger,ease:'power2.out',immediateRender:false},at);
      tl.to(targets,{scale:1,y:0,duration:.32,stagger,ease:'power2.inOut'},at+duration+.04);
    }
    _loop(tl, at, end) {
      tl.to(this.$('.cursor'),{opacity:0,duration:.45,ease:'power2.inOut'},at);
      if (this.scene === 'results') {
        const label=this.$('.country-filter-label'), row=this.$('[data-row="3"]');
        tl.to(label,{opacity:0,duration:.2,ease:'power2.inOut'},at+.18);
        tl.to(this.$('.result-count'),{opacity:0,duration:.35,ease:'power2.inOut'},at+.25);
        tl.call(() => {
          label.textContent='All countries'; this.$('.filter-countries').removeAttribute('data-active');
          row.style.visibility='visible'; this._gsap.set(row,{opacity:0,y:3});
        },[],at+.4);
        tl.to(label,{opacity:1,duration:.25,ease:'power2.out'},at+.4);
        tl.to(row,{opacity:1,y:0,x:0,duration:.5,ease:'power2.out'},at+.4);
      }
      tl.to({},{duration:.6},end-.6);
    }
    _queryTimeline(tl) {
      const g=this._gsap, text='apache country:us port:443', bar=this.$('.query-bar');
      tl.call(() => { this._reset(); this._cursorAt('.query-value'); g.set(this.$('.surface'),{opacity:1}); },[],0);
      tl.to(this.$('.cursor'),{opacity:1,duration:.28},.18);
      this._move(tl,'.query-value',.28,.42); this._press(tl,.75);
      tl.call(() => { bar.dataset.focused='true'; this.$('.query-value').dataset.selected='true'; },[],.85);
      tl.fromTo(bar,{boxShadow:'0 0 0 0px #008da300'},{boxShadow:'0 0 0 4px #008da30b',duration:.35,ease:'power2.out',immediateRender:false},.85);
      tl.call(() => { this.$('.query-value').removeAttribute('data-selected'); this.$('.query-value').textContent=''; },[],1.04);
      tl.fromTo(this.$('.query-caret'),{opacity:1},{opacity:.2,duration:.28,repeat:5,yoyo:true,ease:'sine.inOut',immediateRender:false},1.04);
      let tick=1.08;
      Array.from(text).forEach((letter,index) => {
        tick += [.075,.06,.085,.055,.07,.065,.08][index%7];
        const value=text.slice(0,index+1);
        tl.call(() => { this.$('.query-value').textContent=value; },[],tick);
        ['country:us','port:443'].forEach((token) => {
          if (!value.endsWith(token)) return;
          const chip=this.$('[data-token="'+token+'"]');
          tl.call(() => { chip.dataset.active='true'; },[],tick);
          this._pulse(tl,chip,tick+.03,{scale:1.025,y:-3,stagger:0});
        });
      });
      tl.to(this.$('.query-caret'),{opacity:0,duration:.12},tick+.15);
      tl.call(() => { bar.removeAttribute('data-focused'); },[],tick+.2);
      this._move(tl,'.query-submit',2.93,.47); this._press(tl,3.48);
      this._pulse(tl,'.query-submit',3.48,{scale:.965,y:0,stagger:0});
      tl.call(() => { this.$('.query-submit').dataset.loading='true'; },[],3.6);
      tl.fromTo(this.$('.query-spinner'),{rotation:0},{rotation:300,duration:.6,ease:'none',immediateRender:false},3.6);
      tl.call(() => { this.$('.query-submit').removeAttribute('data-loading'); this.$('.recent-row').dataset.complete='true'; },[],4.2);
      tl.fromTo(this.$('.query-arrow'),{opacity:.4,y:4},{opacity:1,y:0,duration:.35,ease:'power2.out',immediateRender:false},4.2);
      tl.fromTo(this.$('.recent-row'),{backgroundColor:this._paint('--demo-anim-base','#ffffff'),y:3},{backgroundColor:this._paint('--demo-anim-query-highlight','#f1fafb'),y:0,duration:.42,ease:'power2.out',immediateRender:false},4.22);
      tl.fromTo(this.$('.recent-row .recent-label'),{x:4},{x:0,duration:.45,ease:'power2.out',immediateRender:false},4.22);
      this._pulse(tl,'.recent-check',4.22,{scale:1.12,y:0,stagger:0});
      tl.to(this.$$('.recent-row').slice(1),{opacity:.82,duration:.3,stagger:.035},4.24);
      this._move(tl,'.recent-row .recent-label',4.55,.5);
      tl.to(this.$('.recent-row'),{backgroundColor:this._paint('--demo-anim-base','#ffffff'),duration:.5},5.25);
      tl.to(this.$$('.recent-row').slice(1),{opacity:1,duration:.35,stagger:.035},5.25);
      tl.to(bar,{boxShadow:'0 0 0 0px #008da300',duration:.35,ease:'power2.inOut'},5.65);
      tl.call(() => { this.$$('.syntax-chip').forEach(function (el) { el.removeAttribute('data-active'); }); this.$('.recent-row').removeAttribute('data-complete'); },[],5.75);
      this._loop(tl,5.75,6.8);
    }
    _resultsTimeline(tl) {
      const g=this._gsap, menu=this.$('.country-menu');
      tl.call(() => { this._reset(); this._cursorAt('.filter-technologies'); g.set(this.$('.surface'),{opacity:1}); g.set(this.$$('.result-row'),{x:0,y:0,backgroundColor:this._paint('--demo-anim-base','#ffffff')}); },[],0);
      tl.to(this.$('.cursor'),{opacity:1,duration:.28},.18);
      this._move(tl,'.filter-countries',.32,.5); this._press(tl,.89);
      this._pulse(tl,'.filter-countries',.89,{scale:.98,y:0,stagger:0});
      tl.to(this.$('.filter-countries>.ui-icon'),{rotation:180,duration:.3,ease:'power2.inOut'},1.05);
      tl.set(menu,{visibility:'visible'},1.05);
      tl.fromTo(menu,{opacity:0,y:5},{opacity:1,y:0,duration:.35,ease:'power2.out',immediateRender:false},1.05);
      tl.fromTo(this.$$('.country-option'),{opacity:.3,x:-3},{opacity:1,x:0,duration:.25,stagger:.045,ease:'power2.out',immediateRender:false},1.12);
      this._move(tl,'.country-us',1.45,.4); this._press(tl,1.92);
      tl.to(menu,{opacity:0,y:3,duration:.22,ease:'power2.inOut'},2.08);
      tl.to(this.$('.filter-countries>.ui-icon'),{rotation:0,duration:.3,ease:'power2.inOut'},2.08);
      tl.set(menu,{visibility:'hidden'},2.3);
      tl.call(() => { this.$('.country-filter-label').textContent='United States'; this.$('.filter-countries').dataset.active='true'; this.$('.results-scene').dataset.loading='true'; },[],2.3);
      tl.to(this.$$('.result-row'),{opacity:.35,x:4,y:1,duration:.25,ease:'power2.inOut'},2.3);
      tl.fromTo(this.$('.result-spinner'),{rotation:0},{rotation:300,duration:.58,ease:'none',immediateRender:false},2.3);
      tl.call(() => { this.$('.results-scene').removeAttribute('data-loading'); this.$('[data-row="3"]').style.visibility='hidden'; },[],2.88);
      tl.to(this.$$('.result-row').slice(0,3),{opacity:1,x:0,y:0,duration:.42,stagger:.055,ease:'power2.out'},2.9);
      tl.fromTo(this.$$('.result-row').slice(0,3).flatMap((row) => Array.from(row.querySelectorAll('.result-tag'))),{opacity:.4,x:-4},{opacity:1,x:0,duration:.32,stagger:.03,ease:'power2.out',immediateRender:false},2.95);
      tl.fromTo(this.$$('.result-row').slice(0,3).flatMap((row) => Array.from(row.querySelectorAll('.metric-value'))),{y:4},{y:0,duration:.45,stagger:.035,ease:'power2.out',immediateRender:false},2.9);
      tl.to(this.$('.result-count'),{opacity:1,duration:.3},3);
      this._count(tl,'.result-row:not([data-row="3"]) .metric-value',2.9,.5);
      this._move(tl,'[data-row="0"] .result-tags',3.58,.5);
      tl.to(this.$('[data-row="0"]'),{backgroundColor:this._paint('--demo-anim-highlight','#f5fafb'),duration:.35},3.88);
      this._pulse(tl,'[data-row="0"] .result-tag',4,{scale:1.025,y:-2,stagger:.035});
      this._move(tl,'[data-row="1"] .result-domain',4.35,.5);
      tl.to(this.$('[data-row="0"]'),{backgroundColor:this._paint('--demo-anim-base','#ffffff'),duration:.4},4.5);
      tl.to(this.$('[data-row="1"]'),{backgroundColor:this._paint('--demo-anim-highlight','#f5fafb'),duration:.3},4.62);
      this._pulse(tl,'[data-row="1"] .metric-value',4.65,{scale:1.025,y:-2,stagger:.045});
      tl.to(this.$('[data-row="1"]'),{backgroundColor:this._paint('--demo-anim-base','#ffffff'),duration:.4},5.5);
      this._loop(tl,6,7.2);
    }
    _period(tl, name, at) {
      const values=name==='30D'?SERIES30:SERIES90,point=chartPoint(values.length-1,values),state={value:name==='30D'?28:24};
      tl.call(() => { this.$$('.period').forEach(function (el) { el.dataset.active=String(el.dataset.period===name); }); },[],at);
      tl.to(this.$('.chart-line'),{attr:{d:linePath(values)},duration:.75,ease:'power2.inOut'},at);
      tl.to(this.$('.chart-area'),{attr:{d:areaPath(values)},duration:.75,ease:'power2.inOut'},at);
      tl.to(this.$('.chart-dot'),{attr:{cx:point.x,cy:point.y},duration:.75,ease:'power2.inOut'},at);
      tl.to(this.$('.chart-tip'),{attr:{transform:'translate('+point.x+','+(point.y-47)+')'},duration:.75,ease:'power2.inOut'},at);
      tl.fromTo(state,{value:name==='30D'?28:24},{value:name==='30D'?24:28,duration:.75,ease:'power2.inOut',immediateRender:false,onUpdate:()=>{this.$('.chart-tooltip-text').textContent=String(Math.round(state.value));}},at);
      this._pulse(tl,'[data-period="'+name+'"]',at,{scale:.95,y:0,stagger:0});
      tl.to(this.$$('.chart-date'),{opacity:0,duration:.15},at);
      tl.call(() => { const labels=name==='30D'?['Apr 1','Apr 5','Apr 9','Apr 13','Apr 17','Apr 21','Apr 26']:['Jan 1','Jan 15','Feb 1','Feb 15','Mar 1','Mar 15','Apr 1'];labels.forEach((text,i)=>{this.$$('.chart-date')[i].textContent=text;}); },[],at+.16);
      tl.to(this.$$('.chart-date'),{opacity:1,duration:.25},at+.18);
    }
    _hostTimeline(tl) {
      const g=this._gsap;
      tl.call(() => { this._reset(); this._cursorAt('.period[data-period="90D"]'); g.set(this.$('.surface'),{opacity:1}); },[],0);
      tl.to(this.$('.cursor'),{opacity:1,duration:.28},.18);
      tl.set(this.$('.chart-line'),{opacity:0,strokeDashoffset:1,immediateRender:true},0);
      tl.set(this.$('.chart-area'),{opacity:.3,immediateRender:true},0);
      tl.to(this.$('.chart-line'),{opacity:1,strokeDashoffset:0,duration:.8,ease:'power2.inOut'},.12);
      tl.to(this.$('.chart-area'),{opacity:.85,duration:.8,ease:'power2.inOut'},.12);
      this._move(tl,'[data-period="30D"]',.32,.5); this._press(tl,.92); this._period(tl,'30D',1.12);
      this._move(tl,'[data-period="90D"]',2.15,.5); this._press(tl,2.75); this._period(tl,'90D',2.93);
      this._move(tl,'.chart-dot',3.25,.6);
      tl.to(this.$('.chart-dot'),{attr:{r:8},duration:.22,ease:'power2.out'},3.8);
      tl.to(this.$('.chart-dot'),{attr:{r:6},duration:.4,ease:'power2.inOut'},4.06);
      tl.fromTo(this.$$('.vulnerability-tile'),{y:3,scale:.985},{y:0,scale:1,duration:.42,stagger:.045,ease:'power2.out',immediateRender:false},3.55);
      this._count(tl,'.vulnerability-value',3.55,.55);
      this._move(tl,'.vulnerability-tile.medium',4.15,.55);
      this._pulse(tl,'.vulnerability-tile.medium',4.65,{scale:1.018,y:-3,stagger:0});
      this._move(tl,'[data-service="2"] .service-state',5,.6);
      tl.fromTo(this.$$('.service-state'),{opacity:.3,scale:.93},{opacity:1,scale:1,duration:.42,stagger:.055,ease:'power2.out',immediateRender:false},5.12);
      tl.to(this.$('[data-service="2"]'),{backgroundColor:this._paint('--demo-anim-success-row','#f3faf7'),duration:.35},5.55);
      tl.to(this.$('[data-service="2"] .service-state'),{backgroundColor:this._paint('--demo-anim-success-state','#c7ecdc'),duration:.35},5.55);
      tl.to(this.$('[data-service="2"]'),{backgroundColor:this._paint('--demo-anim-base','#ffffff'),duration:.45},6.35);
      tl.to(this.$('[data-service="2"] .service-state'),{backgroundColor:this._paint('--demo-anim-success-state-base','#e4f6ed'),duration:.45},6.35);
      this._move(tl,'.host-copy',6.7,.65); this._press(tl,7.42);
      tl.call(() => { this.$('.host-copy').dataset.copied='true'; },[],7.6);
      this._pulse(tl,'.host-copy-check',7.6,{scale:1.12,y:0,stagger:0});
      tl.call(()=>{this.$('.host-copy').removeAttribute('data-copied');},[],8.3);
      tl.to(this.$('.chart-line'),{opacity:0,duration:.4,ease:'power2.inOut'},8.55);
      tl.to(this.$('.chart-area'),{opacity:.3,duration:.5,ease:'power2.inOut'},8.55);
      this._loop(tl,8.4,9.6);
    }
  }
  window.ApcosysProductScenes=Object.freeze({version:'1.0.0',configure:function(options){if(!options?.gsap)return;sharedGSAP=options.gsap;live.forEach(function(instance){instance.configure(options);});}});
  customElements.define('apcosys-product-demo',ApcosysProductDemo);
})();

})();
