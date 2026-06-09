import React from 'react';
import { Icon, Clover, Avatar, Photo, Tag, Chip, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar, Topbar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { KNOWLEDGE_RESOURCES, FOUNDATION_TOOLS } from '../data/strategyData.js';

// HelloLilly — Bibliotek (free, communal library of templates, prompts, tips, designs)

const LIB = KNOWLEDGE_RESOURCES;

function LibCard({ item }) {
  return (
    <article className="lcard">
      <Photo tone={item.tone} clover person />
      <div className="lcard__body">
        <div className="lcard__tags">
          <Tag variant={item.type[1]}>{item.type[0]}</Tag>
          <Tag variant={item.goal[1]}>{item.goal[0]}</Tag>
        </div>
        <div className="lcard__t">{item.t}</div>
        <p className="lcard__m">{item.m}</p>
        <div className="lcard__foot">
          <Avatar name={item.by} size="xs" tone={item.av} />
          <span className="lcard__by"><b>{item.by}</b> · {item.role}</span>
          <span style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
            <span className="lcard__uses"><Icon name="thumb" size={13} />{item.uses}</span>
            <Button variant="secondary" size="sm" icon="plus">Använd</Button>
          </span>
        </div>
      </div>
    </article>
  );
}

function SharedLibrary() {
  return (
    <div className="ll app app--lively" data-screen-label="Bibliotek">
      <Sidebar active="library" />
      <div className="main">
        <ToolHeader title="Bibliotek">
          <Button variant="primary" size="sm" icon="plus">Bidra med ditt</Button>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18 }}>
          <div className="lib-hero" style={{ marginBottom:24 }}>
            <div className="lib-hero__art"><Clover size={56} color="#2B6CF0" /></div>
            <div style={{ flex:1 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:23, fontWeight:900 }}>Kunskapshubb med coach-approved material</h2>
              <p className="muted" style={{ fontSize:15, marginTop:6, maxWidth:'62ch' }}>Det här är inte ett vanligt bibliotek. Varje mall, prompt och guide kan kopplas till ett case, ett verktyg och en lucka i ansökan.</p>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:30, color:'var(--ll-blue-deep)' }}>320+</div>
              <div className="cap" style={{ fontWeight:700 }}>delade resurser</div>
            </div>
          </div>

          {/* filters */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:18, marginBottom:20, alignItems:'center' }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span className="cap" style={{ fontWeight:700, alignSelf:'center', marginRight:2 }}>Typ</span>
              <Chip on>Alla</Chip><Chip>Mallar</Chip><Chip>Prompts</Chip><Chip>Tips</Chip><Chip>Guider</Chip>
            </div>
            <div style={{ width:1, height:24, background:'var(--ll-border)' }} />
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span className="cap" style={{ fontWeight:700, alignSelf:'center', marginRight:2 }}>Mål</span>
              {FOUNDATION_TOOLS.map((tool) => <Chip key={tool.id} icon={tool.ic}>{tool.sv}</Chip>)}
            </div>
            <div style={{ marginLeft:'auto' }} className="cap"><b style={{ color:'var(--ll-ink)' }}>{LIB.length}</b> resurser</div>
          </div>

          <div className="libgrid">
            {LIB.map((item,i) => <LibCard key={i} item={item} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SharedLibrary, LibCard };
