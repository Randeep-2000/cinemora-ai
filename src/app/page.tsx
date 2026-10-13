import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="landing">
      <header className="landing-nav shell">
        <Link href="/" className="brand"><span className="brand-mark">C</span><span><strong>CINEMORA</strong><small>AI FILMMAKER STUDIO</small></span></Link>
        <nav aria-label="Main navigation"><a href="#studio">The studio</a><a href="#workflow">How it works</a><Link href="/sign-in">Sign in</Link><Link className="button button-small button-primary" href="/sign-in?mode=register">Create your first movie <span>↗</span></Link></nav>
      </header>

      <section className="landing-hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> YOUR STORY, FRAME BY FRAME</div>
          <h1>Make the film<br />you can <em>see.</em></h1>
          <p className="hero-lede">From a spark of an idea to a finished cut. Write the screenplay, shape your characters, build every shot, and bring your story together in one thoughtful creative studio.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/sign-in?mode=register">Create your first movie <span>↗</span></Link><a className="text-link" href="#workflow">Explore the workflow <span>↓</span></a></div>
          <div className="hero-footnote"><span className="tiny-bars"><i /><i /><i /><i /><i /></span> SCRIPT · STORYBOARD · EDIT · EXPORT</div>
        </div>
        <div className="studio-visual" aria-label="Illustration of the CINEMORA film editing studio">
          <div className="visual-glow" />
          <div className="floating-tag tag-top"><span className="tag-orb">✦</span><span><b>SCENE 02</b><small>The crossing</small></span></div>
          <div className="screen-frame">
            <div className="screen-top"><span className="screen-brand">CINEMORA <i>AI</i></span><span className="screen-dots">● ● ●</span></div>
            <div className="screen-content">
              <div className="screen-sidebar"><span className="sidebar-lamp active"/><span className="sidebar-lamp"/><span className="sidebar-lamp"/><span className="sidebar-lamp"/></div>
              <div className="preview-window"><div className="film-sun"/><div className="film-moon"/><div className="film-building b1"/><div className="film-building b2"/><div className="film-building b3"/><div className="film-road"/><div className="film-figure"/><div className="preview-caption">A CITY REMEMBERS</div><span className="preview-time">00:14 / 01:32</span></div>
              <div className="shot-list"><span className="shot-label">SHOT LIST <i>03</i></span><div className="shot-mini selected"><b>01</b><span>Opening image<small>Wide · 8 sec</small></span></div><div className="shot-mini"><b>02</b><span>The crossing<small>Tracking · 6 sec</small></span></div><div className="shot-mini"><b>03</b><span>First meeting<small>Medium · 12 sec</small></span></div></div>
            </div>
            <div className="timeline-mock"><div className="timeline-toolbar"><span>TIMELINE</span><span>24 FPS&nbsp;&nbsp; · &nbsp;&nbsp;16:9</span></div><div className="timeline-ruler"><span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span><span>01:00</span></div><div className="track-row"><small>VIDEO</small><div><i className="clip clip-a"/><i className="clip clip-b"/><i className="clip clip-c"/></div></div><div className="track-row"><small>MUSIC</small><div><i className="audio-wave"/></div></div><div className="playhead"/></div>
          </div>
          <div className="floating-tag tag-bottom"><span className="live-pulse"/><span><b>YOUR STORYBOARD</b><small>Taking shape</small></span></div>
          <div className="visual-caption">A complete creative workflow, in one place.</div>
        </div>
      </section>

      <section className="value-strip shell" id="studio"><div><b>ONE IDEA</b><span>Start with a prompt, a script, or a blank page.</span></div><div><b>YOUR CREATIVE CONTROL</b><span>Refine scenes, shots, characters, and pacing.</span></div><div><b>ONE FINISHED FILM</b><span>Arrange your media, then export when it is ready.</span></div></section>
      <section className="workflow-section shell" id="workflow"><div className="section-heading"><div><div className="eyebrow">THE CINEMORA WORKFLOW</div><h2>From first thought<br />to final frame.</h2></div><p>Keep the creative decisions close. CINEMORA brings writing, visual development, generation, sound, and editing into one connected workspace.</p></div><div className="workflow-grid"><article><span className="step-number">01</span><div className="step-icon">✎</div><h3>Write the story</h3><p>Turn a story prompt into a structured screenplay with scenes, characters, dialogue, and shot directions.</p></article><article><span className="step-number">02</span><div className="step-icon">◉</div><h3>Build the world</h3><p>Keep character references, locations, visual notes, and storyboard shots organized with your project.</p></article><article><span className="step-number">03</span><div className="step-icon">▤</div><h3>Shape the film</h3><p>Bring your own video and audio into a timeline, arrange the cut, and export with FFmpeg.</p></article></div></section>
      <section className="closing-band shell"><div><div className="eyebrow">THE NEXT FRAME IS YOURS</div><h2>What do you want<br />to make today?</h2></div><Link className="button button-primary" href="/sign-in?mode=register">Start a new project <span>↗</span></Link><div className="closing-orb" aria-hidden="true">C</div></section>
      <footer className="landing-footer shell"><Link href="/" className="brand"><span className="brand-mark">C</span><span><strong>CINEMORA</strong><small>AI FILMMAKER STUDIO</small></span></Link><span>Make room for the story.</span><span>© {new Date().getFullYear()} CINEMORA AI</span></footer>
    </main>
  );
}
