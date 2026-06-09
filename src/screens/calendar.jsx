import React from 'react';
import { Icon, Avatar, Tag, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar, Topbar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';

// HelloLilly — Kalender (week schema)
// Calm 7-day grid: coach meetings, interviews, practice, seminars, deadlines.
// Right rail: upcoming events, type legend, coach availability.

const DAYS = [
  { dow:'Mån', dn:8 },{ dow:'Tis', dn:9 },{ dow:'Ons', dn:10 },
  { dow:'Tor', dn:11, today:true },{ dow:'Fre', dn:12 },{ dow:'Lör', dn:13 },{ dow:'Sön', dn:14 },
];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

// day = 0..6 (Mon..Sun), startHour = 8..17, span = hours
const EVENTS = [
  { day:0, startH:10, span:1, t:'Coachsamtal',          who:'Sara Lind',     type:'ev-coach',     ic:'users' },
  { day:1, startH:13, span:1, t:'Intervjuövning',       who:'3 frågor',      type:'ev-practice',  ic:'mic' },
  { day:2, startH:9,  span:1, t:'Planeringssamtal',     who:'Sara Lind',     type:'ev-coach',     ic:'users' },
  { day:2, startH:15, span:1, t:'Lugn inför intervjun', who:'Seminarium',    type:'ev-seminar',   ic:'grad' },
  { day:3, startH:11, span:1, t:'Coach Sara',           who:'Förbered fredag',type:'ev-coach',    ic:'users' },
  { day:3, startH:14, span:1, t:'Intervjuövning',       who:'5 frågor',      type:'ev-practice',  ic:'mic' },
  { day:4, startH:10, span:2, t:'Intervju · PostNord',  who:'På plats Västerås', type:'ev-interview', ic:'briefcase' },
  { day:4, startH:17, span:1, t:'Ansökan stänger',      who:'DHL truckförare',type:'ev-deadline',  ic:'clock' },
];

// upcoming list (sorted soon → later)
const UPCOMING = [
  { d:11, m:'jun', t:'Coach Sara · Förbered intervjun', when:'Idag 11:00', tone:'ic-blue', clr:'var(--ll-blue)' },
  { d:11, m:'jun', t:'Intervjuövning · 5 frågor',       when:'Idag 14:00', tone:'ic-lilac', clr:'var(--ll-lilac)' },
  { d:12, m:'jun', t:'Intervju · PostNord',             when:'Fredag 10:00', tone:'ic-coral', clr:'var(--ll-coral)' },
  { d:12, m:'jun', t:'Deadline · DHL truckförare',      when:'Fredag 17:00', tone:'ic-green', clr:'var(--ll-green)' },
  { d:18, m:'jun', t:'Workshop · Hitta dolda jobb',     when:'Tor 18 jun',  tone:'ic-amber', clr:'var(--ll-amber)' },
];

function CalendarView() {
  return (
    <div className="ll app app--warm" data-screen-label="Kalender">
      <Sidebar active="calendar" />
      <div className="main">
        <ToolHeader title="Kalender">
          <Button variant="secondary" size="sm" icon="plus">Lägg till händelse</Button>
          <Button variant="primary" size="sm" icon="calendar">Boka med Sara</Button>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:14 }}>

          {/* top bar */}
          <div className="calbar">
            <div className="calbar__nav">
              <button className="cal-nav" aria-label="Förra veckan"><Icon name="chevron" size={18} style={{ transform:'scaleX(-1)' }} /></button>
              <button className="cal-nav" aria-label="Nästa vecka"><Icon name="chevron" size={18} /></button>
            </div>
            <div className="cal-month">8 – 14 juni 2026</div>
            <Tag variant="tag--green" dot>Idag är torsdag</Tag>
            <div style={{ marginLeft:'auto' }} className="seg">
              <button className="on"><Icon name="calendar" size={14} />Vecka</button>
              <button><Icon name="grad" size={14} />Månad</button>
            </div>
          </div>

          <div className="calview">
            {/* week grid */}
            <div className="calgrid">
              {/* corner */}
              <div className="cal-corner" />
              {/* day headers */}
              {DAYS.map((d,i) => (
                <div key={i} className={`cal-head ${d.today?'today':''}`} style={{ gridColumn:i+2, gridRow:1 }}>
                  <span className="dow">{d.dow}</span><span className="dn">{d.dn}</span>
                </div>
              ))}
              {/* time labels */}
              {HOURS.map((h,i) => (
                <div key={`h${i}`} className="cal-time" style={{ gridColumn:1, gridRow:i+2 }}>{h}</div>
              ))}
              {/* empty cells (drawn for gridlines) */}
              {Array.from({ length: 7*11 }).map((_,i) => {
                const col = (i%7)+2, row = Math.floor(i/7)+2;
                const today = DAYS[col-2] && DAYS[col-2].today;
                return <div key={`c${i}`} className={`cal-cell ${today?'today':''}`} style={{ gridColumn:col, gridRow:row }} />;
              })}
              {/* events */}
              {EVENTS.map((e,i) => (
                <div key={`e${i}`} className={`calev ${e.type}`}
                     style={{ gridColumn:e.day+2, gridRow:`${e.startH-6} / ${e.startH-6 + e.span}` }}>
                  <b><Icon name={e.ic} size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:5 }} />{e.t}</b>
                  <span className="t">{e.who}</span>
                </div>
              ))}
            </div>

            {/* right rail */}
            <div className="calrail" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="upnext">
                <h3>Kommande</h3>
                {UPCOMING.map((u,i) => (
                  <div className="unrow" key={i}>
                    <div className="unrow__dot" style={{ background:u.clr, color:'#fff' }}><div className="d">{u.d}</div><div className="m">{u.m}</div></div>
                    <div className="unrow__b">
                      <div className="unrow__t">{u.t}</div>
                      <div className="unrow__when">{u.when}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card card--pad">
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, marginBottom:6 }}>Typer av händelser</h3>
                <div className="caltype">
                  <span><span className="d" style={{ background:'var(--ll-blue)' }} />Coachsamtal &amp; möten</span>
                  <span><span className="d" style={{ background:'var(--ll-coral)' }} />Intervjuer</span>
                  <span><span className="d" style={{ background:'var(--ll-lilac)' }} />Träning &amp; övningar</span>
                  <span><span className="d" style={{ background:'var(--ll-amber)' }} />Seminarier &amp; kurser</span>
                  <span><span className="d" style={{ background:'var(--ll-green)' }} />Ansökningsdeadlines</span>
                </div>
              </div>

              <div className="availcard">
                <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:8 }}>
                  <Avatar name="Sara Lind" size="md" tone="av-c3" clover />
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:14.5, color:'#1c7a48' }}>Sara har tid</div>
                    <div style={{ fontSize:12, color:'#1c7a48', fontWeight:600 }}>Välj en tid som passar dig</div>
                  </div>
                </div>
                <div className="avail-slot">Idag · 16:00<button className="btn btn--secondary btn--sm">Välj</button></div>
                <div className="avail-slot">Imorgon · 09:00<button className="btn btn--secondary btn--sm">Välj</button></div>
                <div className="avail-slot">Måndag · 11:00<button className="btn btn--secondary btn--sm">Välj</button></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export { CalendarView };
