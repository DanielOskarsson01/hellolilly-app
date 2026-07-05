import React from 'react';
import { CloverDefs } from './components/primitives.jsx';
import { ComingSoon, NAV_INDEX } from './components/shell.jsx';
import { HomeExpanded } from './screens/home.jsx';
import { CVBuilder, ActivityTracker } from './screens/cvActivity.jsx';
import { CoverLetter } from './screens/coverLetter.jsx';
import { InterviewTrainer } from './screens/interview.jsx';
import { SharedLibrary } from './screens/library.jsx';
import { MultiCoachReview } from './screens/review.jsx';
import { ImageStudio } from './screens/studio.jsx';
import { CoachWorkspace, COACH_NAV_INDEX } from './screens/coach.jsx';
import { JobMatchReview } from './screens/match.jsx';
import { CalendarView } from './screens/calendar.jsx';
import { Community } from './screens/community.jsx';
import { JobSearch } from './screens/jobSearch.jsx';
import { HelpfulNow } from './components/helpfulNow.jsx';
import { HelpfulLayover } from './components/helpfulLayover.jsx';

const LL_ROUTES = {
  home: { c: () => <HomeExpanded />, title: 'Hem' },
  cv: { c: () => <CVBuilder />, title: 'CV-byggaren' },
  letter: { c: () => <CoverLetter />, title: 'Personligt brev' },
  interview: { c: () => <InterviewTrainer />, title: 'Intervjuträning' },
  activity: { c: () => <ActivityTracker />, title: 'Min aktivitet' },
  library: { c: () => <SharedLibrary />, title: 'Bibliotek' },
  review: { c: () => <MultiCoachReview />, title: 'Granskning' },
  studio: { c: () => <ImageStudio />, title: 'Bildstudio' },
  coach: { c: () => <CoachWorkspace />, title: 'Coachvy' },
  jobbsok: { c: () => <JobSearch />, title: 'Jobbsök', template: true },
  match: { c: () => <JobMatchReview />, title: 'Matchanalys' },
  calendar: { c: () => <CalendarView />, title: 'Kalender' },
  community: { c: () => <Community />, title: 'Community' },
};

function getRoute() {
  const r = (location.hash || '#home').slice(1);
  return r || 'home';
}

function App() {
  const [route, setRoute] = React.useState(getRoute());
  const [navOpen, setNavOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  React.useEffect(() => {
    const onHash = () => {
      setRoute(getRoute());
      setNavOpen(false);
      setHelpOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  React.useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen);
    return () => document.body.classList.remove('nav-open');
  }, [navOpen]);

  React.useEffect(() => {
    document.body.classList.toggle('help-open', helpOpen);
    return () => document.body.classList.remove('help-open');
  }, [helpOpen]);

  React.useEffect(() => {
    const known = LL_ROUTES[route];
    let title;
    if (known) title = known.title;
    else if (COACH_NAV_INDEX && COACH_NAV_INDEX[route]) title = COACH_NAV_INDEX[route].label;
    else if (NAV_INDEX && NAV_INDEX[route]) title = NAV_INDEX[route].label;
    else title = 'Hem';
    document.title = 'HelloLilly · ' + title;
  }, [route]);

  const known = LL_ROUTES[route];
  const isTemplate = !!(known && known.template);
  const screen = known ? known.c() : <ComingSoon routeKey={route} />;

  // PageTemplate-based screens own their full chrome (nav + CrossColumn right rail).
  // Suppress the global burger, scrims, HelpfulNow toggle, and HelpfulNow panel so
  // those screens end up with exactly ONE right rail and a correctly-placed nav.
  if (isTemplate) {
    return (
      <React.Fragment>
        <CloverDefs />
        {screen}
        <HelpfulLayover />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <button className="ll-menu" id="llMenu" aria-label="Meny" onClick={() => setNavOpen((v) => !v)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <div className="ll-scrim" id="llScrim" onClick={() => setNavOpen(false)} />
      <button className="ll-help-toggle" id="llHelpToggle" aria-label="Öppna Helpful Now" onClick={() => setHelpOpen((v) => !v)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></svg>
        Helpful Now
      </button>
      <div className="ll-help-scrim" id="llHelpScrim" onClick={() => setHelpOpen(false)} />
      <CloverDefs />
      {screen}
      <HelpfulNow />
      <HelpfulLayover />
    </React.Fragment>
  );
}

export { App, LL_ROUTES };
