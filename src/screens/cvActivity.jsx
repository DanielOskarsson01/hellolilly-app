import React from 'react';
import { Icon, Clover, Avatar, AvatarStack, Photo, Tag, Chip, Button, Rating, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { CASE_PROFILE, CASE_RECORD, PIPELINE_RUN } from '../data/strategyData.js';

// HelloLilly — CV builder & Activity tracker

/* tool header bar shared by tool screens */
function ToolHeader({ title, step, total, children }) {
  return (
    <header className="topbar" style={{ borderBottom:'1px solid var(--ll-border)', paddingTop:16, paddingBottom:16 }}>
      <button className="iconbtn" aria-label="Tillbaka"><Icon name="chevron" size={20} style={{ transform:'scaleX(-1)' }} /></button>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>{title}</h1>
        {step && <p className="cap" style={{ fontWeight:600 }}>Steg {step} av {total} · spara automatiskt</p>}
      </div>
      <div className="topbar__spacer" />
      {children}
    </header>
  );
}

/* ===================== CV BUILDER ===================== */
function VoiceWave({ bars = 18 }) {
  const hs = [8,14,20,12,18,22,10,16,21,9,15,19,11,17,13,20,8,14];
  return <div className="voicewave">{Array.from({length:bars}).map((_,i)=>(<span key={i} style={{ height:hs[i%hs.length] }} />))}</div>;
}

const CV_TEMPLATES = [
  { id:'lager', title:'Lager & logistik', tone:'ph--sky', meta:'ATS-vänlig · bild valfri', focus:'Tydlig erfarenhet, truckkort och skiftvana' },
  { id:'classic', title:'Klassisk rekryterare', tone:'ph--mint', meta:'En sida · hög läsbarhet', focus:'Profil, arbetslivserfarenhet och kompetenser först' },
  { id:'visual', title:'Bild-CV enkelt', tone:'ph--sun', meta:'Foto + sidospalt', focus:'Bra när personlig presentation hjälper' },
];

const CV_SECTIONS = [
  { title:'Profil', body:'Pålitlig lager- och logistikmedarbetare med praktik från PostNord, truck A1 och vana vid scanning, plockning och inleverans.' },
  { title:'Erfarenhet', body:'PostNord praktik, ICA-kundkontakt och daglig vana av tempo, ansvar och tydlig kommunikation.' },
  { title:'Kompetenser', body:'Truck A1, lagerhantering, handdator/scanning, plock och pack, noggrannhet, punktlighet och lagarbete.' },
  { title:'Utbildning', body:'Gymnasieutbildning samt kurser och intyg som kan kompletteras direkt när de laddas upp.' },
  { title:'Språk', body:'Svenska flytande, arabiska modersmål och enkel yrkesengelska för instruktioner och system.' },
  { title:'Referenser', body:'Referenser lämnas på begäran. Lilly hjälper till att formulera frågan till handledare eller tidigare chef.' },
];

function CVBuilder() {
  const [uploadedTemplates, setUploadedTemplates] = React.useState([]);

  const onTemplateUpload = (event) => {
    const files = Array.from(event.target.files || []).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: Math.round(file.size / 1024),
    }));
    setUploadedTemplates((current) => [...files, ...current].slice(0, 6));
    event.target.value = '';
  };

  return (
    <div className="ll app" data-screen-label="CV-byggaren">
      <Sidebar active="cv" />
      <div className="main">
        <ToolHeader title="CV-byggaren" step="4" total="7">
          <label className="btn btn--secondary btn--sm cv-upload-btn">
            <Icon name="upload" size={16} />
            Ladda upp mall
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" multiple onChange={onTemplateUpload} />
          </label>
          <Button variant="ghost" size="sm" icon="download">Ladda ner PDF</Button>
          <Button variant="primary" size="sm" icon="check">Spara</Button>
        </ToolHeader>

        <div className="cvbuilder-grid">
          {/* intake */}
          <section className="intake" style={{ borderRight:'1px solid var(--ll-border)' }}>
            <div className="intake__head">
              <Avatar name="Sara Lind" size="md" tone="av-c3" clover />
              <div>
                <div className="intake__title">Vi bygger ditt CV från case record</div>
                <div className="cap">En fråga i taget - kopplat till {PIPELINE_RUN.company}-analysen</div>
              </div>
              <span className="intake__prog">60% klart</span>
            </div>

            <div className="cv-template-panel">
              <div className="between" style={{ marginBottom:10 }}>
                <div>
                  <h3>CV-mallar</h3>
                  <p className="cap">Välj bas eller ladda upp en egen mall.</p>
                </div>
                <span className="pill">{CV_TEMPLATES.length + uploadedTemplates.length} mallar</span>
              </div>
              <div className="cv-templates">
                {CV_TEMPLATES.map((template) => (
                  <button className="cv-template-card" key={template.id} type="button">
                    <Photo tone={template.tone} clover person={template.id === 'visual'} label={template.title} />
                    <div>
                      <b>{template.title}</b>
                      <span>{template.meta}</span>
                      <p>{template.focus}</p>
                    </div>
                  </button>
                ))}
                {uploadedTemplates.map((template) => (
                  <button className="cv-template-card cv-template-card--uploaded" key={template.id} type="button">
                    <div className="filetype ft-doc">DOC</div>
                    <div>
                      <b>{template.name}</b>
                      <span>{template.size} KB · uppladdad</span>
                      <p>Redo att mappas mot HelloLillys CV-sektioner.</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="intake__feed">
              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div>
                  <div className="msg__bubble">Hej {CASE_PROFILE.person.split(' ')[0]}! Vi tar det lugnt och bygger ditt CV tillsammans. Jag har redan hämtat intake, aktivitet och matchanalysen - du behöver inte börja om.</div>
                </div>
              </div>

              <div className="intake__reassure"><Icon name="check" size={16} sw={2.6} />Jag hittade praktik, truck A1 och dagens Application Check. Nu fyller vi bara luckorna.</div>

              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                  <div className="msg__bubble">Pipeline-fråga: <b>har du använt handdator, scanning eller inleveranssystem?</b> Det kan täcka WMS-luckan ärligt.</div>
              </div>

              <div className="msg msg--me">
                <div className="msg__bubble">Ja, jag scannade paket och registrerade inleveranser på praktiken.</div>
              </div>

              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div>
                  <div className="msg__bubble">Perfekt. Då skriver vi det som handdator och inleverans, inte som SAP-expertis. Det blir sant och användbart.</div>
                  <div className="msg__hint">Fråga 4 av 7 · du kan alltid gå tillbaka</div>
                </div>
              </div>
            </div>

            <div className="cv-section-panel">
              <div className="between" style={{ marginBottom:10 }}>
                <h3>CV-sektioner</h3>
                <span className="cap">Allt innehåll är redigerbart</span>
              </div>
              <div className="cv-section-grid">
                {CV_SECTIONS.map((section) => (
                  <div className="cv-section-card" key={section.title}>
                    <div className="cv-section-card__icon"><Icon name="doc" size={16} /></div>
                    <div>
                      <b>{section.title}</b>
                      <p>{section.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="intake__composer">
              <div className="intake__inputrow">
                <input placeholder="Skriv ditt svar…" aria-label="Ditt svar" />
                <button className="intake__mic" aria-label="Spela in röst"><Icon name="mic" size={20} /></button>
                <button className="intake__send" aria-label="Skicka"><Icon name="send" size={19} /></button>
              </div>
              <div className="intake__quick">
                <Chip icon="voice">Jag scannade paket</Chip>
                <Chip>Jag använde handdator</Chip>
                <Chip>Fråga Sara</Chip>
              </div>
            </div>
          </section>

          {/* live preview */}
          <section className="cvframe">
            <div style={{ width:'100%', maxWidth:560 }}>
              <div className="between" style={{ marginBottom:14 }}>
                  <span className="tag tag--green" style={{ gap:6 }}><Icon name="sparkle" size={14} />Pipeline-kopplat</span>
                <span className="cap" style={{ fontWeight:700 }}>Förhandsvisning · ansökningsklar</span>
              </div>
              <div className="cvpaper">
                <div className="cvpaper__photo">
                  <Photo tone="ph--sky" clover person label="CV-bild" />
                </div>
                <h2>{CASE_PROFILE.person}</h2>
                <div className="cv-role">Lager &amp; logistik · Truckförare</div>
                <div className="cv-contact">
                  <span>📍 Västerås</span><span>✉ amir.hassan@mail.se</span><span>✆ 070-123 45 67</span>
                </div>

                <div className="cv-sec">
                  <h3>Profil</h3>
                  <p style={{ marginTop:8 }}>Pålitlig lager- och logistikmedarbetare med praktik från PostNord, truck A1 och vana vid scanning, plockning och inleverans. Söker en roll där noggrannhet, tempo och ansvar räknas.</p>
                </div>

                <div className="cv-sec">
                  <h3>Erfarenhet</h3>
                  <div className="cv-item">
                    <div className="r"><span className="t">Lagerpraktik</span><span className="d">2025</span></div>
                    <div className="c">PostNord, Västerås</div>
                    <p>Plockning, packning, scanning och inleverans. Körde truck A1 och fick beröm för noggrannhet och punktlighet.</p>
                  </div>
                  <div className="cv-item">
                    <div className="r"><span className="t">Butiksbiträde</span><span className="d">2021–2023</span></div>
                    <div className="c">ICA Maxi, Västerås</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}><span className="cv-typing" style={{ fontSize:13 }}>Sara skriver klart den här raden åt dig</span><VoiceWave bars={10} /></div>
                  </div>
                </div>

                <div className="cv-sec">
                  <h3>Kompetenser</h3>
                  <div className="cv-skills">
                    <span className="cv-skill">Truck A1</span>
                    <span className="cv-skill">Lagerhantering</span>
                    <span className="cv-skill">Noggrann</span>
                    <span className="cv-skill">Lagspelare</span>
                    <span className="cv-skill">Handdator/scanning</span>
                    <span className="cv-skill" style={{ background:'var(--ll-blue-tint-2)', color:'var(--ll-ink-mute)', border:'1px dashed var(--ll-border-strong)' }}>+ truckkort B som nästa steg</span>
                  </div>
                </div>

                <div className="cv-sec">
                  <h3>Språk</h3>
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
                    <div className="between" style={{ fontSize:12.5 }}><span>Svenska</span><span className="muted">Flytande</span></div>
                    <div className="cv-fillbar"><span style={{ width:'85%' }} /></div>
                    <div className="between" style={{ fontSize:12.5 }}><span>Arabiska</span><span className="muted">Modersmål</span></div>
                    <div className="cv-fillbar"><span style={{ width:'100%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ===================== ACTIVITY TRACKER ===================== */
function WeekRing({ pct = 72 }) {
  const r = 34, c = 2 * Math.PI * r, off = c * (1 - pct/100);
  return (
    <svg className="ring" width="86" height="86" viewBox="0 0 86 86">
      <circle className="bg" cx="43" cy="43" r={r} />
      <circle className="fg" cx="43" cy="43" r={r} strokeDasharray={c} strokeDashoffset={off} />
    </svg>
  );
}

const ACTIVITY = CASE_RECORD.timeline;

function ActivityTracker() {
  return (
    <div className="ll app app--warm" data-screen-label="Min aktivitet">
      <Sidebar active="activity" />
      <div className="main">
        <ToolHeader title="Min aktivitet">
          <Button variant="secondary" size="sm" icon="share">Dela med Sara</Button>
          <Button variant="primary" size="sm" icon="download">Exportera rapport</Button>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18, maxWidth:980, margin:'0 auto', width:'100%' }}>
          {/* export banner — the report writes itself */}
          <div className="export" style={{ marginBottom:22 }}>
            <div className="stat__ic" style={{ width:52, height:52, background:'rgba(255,255,255,.22)', color:'#fff', marginBottom:0 }}><Icon name="sparkle" size={26} /></div>
            <div style={{ flex:1 }}>
              <h3>Din aktivitetsrapport skriver sig själv</h3>
              <p>Varje verktyg uppdaterar case record automatiskt: analys, CV-andring, brev, traning och coachnasta steg. Rapporten blir en biprodukt av verklig hjalp.</p>
            </div>
            <Button variant="primary" size="lg" icon="download">Hämta som PDF</Button>
          </div>

          {/* summary + filters */}
          <div className="grid" style={{ gridTemplateColumns:'1fr 320px', alignItems:'start' }}>
            <div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
                <Chip on icon="filter">Allt</Chip>
                <Chip icon="briefcase">Ansökningar</Chip>
                <Chip icon="mic">Intervjuer</Chip>
                <Chip icon="users">Möten</Chip>
                <Chip icon="grad">Kurser</Chip>
              </div>

              <div className="atimeline">
                {ACTIVITY.map((g, gi) => (
                  <div className="aday" key={gi}>
                    <div className="aday__label">{g.day}<span className="pill">{g.pill}</span></div>
                    {g.items.map((a, ai) => (
                      <div className="aitem" key={ai}>
                        <div className="aitem__rail"><div className={`aitem__ic ${a.tint}`}><Icon name={a.ic} size={20} /></div></div>
                        <div className="aitem__card">
                          <div className="aitem__top">
                            <span className="aitem__t">{a.t}</span>
                            <span className="aitem__time">{a.time}</span>
                          </div>
                          <p className="aitem__m">{a.m}</p>
                          {a.auto && <div style={{ marginTop:10 }}><span className="aitem__auto"><Icon name="sparkle" size={12} />Loggades automatiskt</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* right rail summary */}
            <div className="stack">
              <div className="card card--pad" style={{ textAlign:'center' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:14 }}>Din vecka i siffror</h3>
                <div style={{ position:'relative', width:86, height:86, margin:'0 auto 8px' }}>
                  <WeekRing pct={72} />
                  <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center' }}>
                    <div><div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:22, lineHeight:1 }}>{CASE_RECORD.activityCount}</div><div className="cap" style={{ fontSize:11 }}>aktiviteter</div></div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize:13.5 }}>Du har varit aktiv <b style={{ color:'var(--ll-ink)' }}>{CASE_RECORD.activeDays}</b>. Nästa steg: {CASE_RECORD.nextStep}.</p>
              </div>

              <div className="card card--pad">
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                  <Clover size={24} color="#2B6CF0" />
                  <strong style={{ fontFamily:'var(--font-display)', fontSize:15 }}>Det här räknas</strong>
                </div>
                <p style={{ fontSize:13.5, color:'var(--ll-ink-soft)' }}>Den här vyn finns för att <b>visa hur långt du kommit</b> - inte för att kontrollera dig. Saras notering: {CASE_RECORD.coachNote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CVBuilder, ActivityTracker, ToolHeader, WeekRing };
