// Everything the page says about Diego. The source is his résumés: the Fall 2026 one first, the 2023-2025 ones for
// everything the one-page version had to drop. Wording stays close to theirs; nothing here is invented.
// Photos are referenced by set name: the sets live in photos.json, written by scripts/photos/export_experience.py.
export const profile = {
  name: 'Diego Pérez',
  location: 'Mayagüez, Puerto Rico',
  email: 'diego.perez16@upr.edu',
  resume: '/resume.pdf',
  github: 'https://github.com/diegoperez16',
  linkedin: 'https://linkedin.com/in/diego-ganda/',
  // The "open to roles" line: the pill under the headline and the sentence above the contact cards.
  // Switched off for now (Diego, October 2026). Set showSeeking to true to bring both back.
  seeking: 'Open to full-time software engineering roles from May 2027',
  showSeeking: false,
  education: {
    institution: 'University of Puerto Rico, Mayagüez',
    qualification: 'B.S. Software Engineering',
    period: 'Expected May 2027',
    detail: 'GPA\u00a03.30\u00a0/\u00a04.00',
    coursework: ['Data Structures', 'Advanced Programming', 'Introduction to Software Engineering', 'Cryptography', 'Foundations of Computing', 'Fundamentals of Web Design'],
  },
}

// `shots` are the extra screenshots shown in a project's sheet, after its cover. They are written by
// scripts/photos/export_project_shots.py, which also makes the NN-thumb.webp the sheet shows in its row of thumbnails.
export const projects = [
  {
    // ../PopcornPal/README.md, package.json, and .git/config.
    id: 'popcornpal',
    title: 'PopcornPal',
    description: 'A social home for the movies, shows, games, and books you love.',
    tags: ['React', 'TypeScript', 'Supabase', 'PWA'],
    details: [
      'Log your entertainment with ratings, progress, and notes.',
      'Follow friends and share discoveries through a social feed.',
      'Find titles across TMDB, RAWG, and Google Books, with offline access to your collection.',
    ],
    href: 'https://popcornpal.net',
    image: '/images/popcornpal-home.jpg', imageBackground: '#0b1a13',
    shots: [
      { src: '/images/projects/popcornpal/02.webp', alt: 'A profile’s top picks of 2026 as a ranked list, each with its rating' },
      { src: '/images/projects/popcornpal/03.webp', alt: 'The all-time top picks as a shelf of posters' },
      { src: '/images/projects/popcornpal/01.webp', alt: 'A public profile: banner, bio, badges and totals' },
      { src: '/images/projects/popcornpal/04.webp', alt: 'On a phone: the profile, its top picks, and one entry opened' },
    ],
  },
  {
    // ~/Rabbithole/DYW-godot: project.godot and README.md (Sept 2026). Screenshot from the game's own shots walker.
    id: 'dyw',
    title: 'Draw Your Wand',
    description: 'A pixel-art wizard battle royale where every spell is cast by drawing its rune.',
    tags: ['Godot 4.7', 'GDScript', 'WebSockets', 'Aseprite'],
    details: [
      '116 spells, each cast by drawing its rune with the mouse — two runes back to back for a combination.',
      'Bots, a Tower mode and a Dungeon mode, and online play in deterministic lockstep with prediction and rollback.',
      'All GDScript: the simulation, the client, and the authoritative multiplayer server.',
    ],
    image: '/images/projects/dyw.jpg', imageBackground: '#1e2a1c',
    shots: [
      { src: '/images/projects/dyw/01.webp', alt: 'A match in Ember Hollow: a ring of ice bursts around the player while a rival sits frozen in a block' },
      { src: '/images/projects/dyw/04.webp', alt: 'The rune guide open mid-match, listing each spell beside the shape that casts it' },
      { src: '/images/projects/dyw/02.webp', alt: 'The practice grounds in Frostfall Sanctuary, rivals casting around the player' },
      { src: '/images/projects/dyw/03.webp', alt: 'Tower mode: zombies closing in on the tower the player defends' },
      { src: '/images/projects/dyw/05.webp', alt: 'The spellbook, with each spell’s rune, damage, mana and cooldown' },
    ],
  },
  {
    // ../theTransporter: ports.go, resolver.go, model.go, go.mod. Screenshots of the real binary running.
    // The / filter is not listed yet: its prompt opens but does not take typing.
    id: 'transporter',
    title: 'theTransporter',
    description: 'A terminal UI for macOS that shows every process holding a port, names the project behind it, and frees it.',
    tags: ['Go', 'Bubble Tea', 'Lip Gloss', 'macOS'],
    details: [
      'Labels each port by project and stack (“Portfolio · Vite”) by reading the process’s working directory.',
      'Asks before it terminates anything, and refreshes itself every three seconds.',
      'A second tab lists which of the usual dev ports are free.',
    ],
    image: '/images/projects/transporter.jpg', imageBackground: '#1c1f26',
    shots: [
      { src: '/images/projects/transporter/01.webp', alt: 'Asking before it frees a port: “Terminate Portfolio · Vite (PID 3017) on :5173? [y/N]”' },
      { src: '/images/projects/transporter/03.webp', alt: 'After answering no: “Mission aborted.”, and the process is still listed' },
      { src: '/images/projects/transporter/02.webp', alt: 'The second tab: the usual dev ports that are free' },
    ],
  },
  {
    // ../SDShift/README.md and build.sh. Screenshot of the built app with a throwaway card image.
    id: 'sdshift',
    title: 'SDShift',
    description: 'A native Mac app for getting photos off a camera card — RAW and JPEG shown as one shot — and wiping it safely.',
    tags: ['Swift', 'SwiftUI', 'AVFoundation', 'CryptoKit'],
    details: [
      'Every copy is hashed with SHA-256 as it streams off the card and re-read after writing; only verified files can be deleted.',
      'Fills a 1,929-shot card in about five seconds by lifting the EXIF thumbnail out of each JPEG.',
      '“Make Movie…” turns the selected photos into an H.264 stop-motion clip, 2–24 fps, up to 4K.',
    ],
    image: '/images/projects/sdshift.jpg', imageBackground: '#1b1b1d',
    shots: [
      { src: '/images/projects/sdshift/01.webp', alt: 'A card’s shots in a grid, 22 of 42 selected, each RAW and JPEG pair shown as one' },
      { src: '/images/projects/sdshift/02.webp', alt: 'One shot opened beside its histogram and exposure details' },
      { src: '/images/projects/sdshift/03.webp', alt: 'Copy finished: 43 files copied and verified' },
      { src: '/images/projects/sdshift/05.webp', alt: 'The wipe dialog: delete only what was copied, and type the card’s name to confirm' },
      { src: '/images/projects/sdshift/04.webp', alt: 'The Make Movie sheet: speed, resolution and framing for the 22 selected photos' },
    ],
  },
]

// From the first résumé (2023): the two course projects he listed.
export const courseProjects = [
  {
    title: 'Spooky Quest',
    course: 'Advanced Programming · CIIC 4010',
    text: 'A C++ game on openFrameworks: a HUD for player and map information, debug keys, immovable objects and bosses built from classes and interfaces, and a paused state through inheritance.',
  },
  {
    title: 'Fractals',
    course: 'Advanced Programming · CIIC 4010',
    text: 'Refactored every fractal into its own class, kept them in a polymorphic vector, and wrote new ones with recursion.',
  },
]

// Every entry below has the same shape, so one component draws them all:
// { id, company, role?, place?, period, current?, note?, points?, roles?: [{ title, period?, points }], tags?, photos? }

// Work, newest first.
export const experience = [
  {
    id: 'l3harris-2026',
    company: 'L3Harris Technologies',
    role: 'Software Engineering Intern · Image Science',
    place: 'Melbourne, FL',
    period: 'June 2026 – Present',
    current: true,
    note: 'Full-time over the summer, part-time since.',
    points: [
      'Write Python to process NITF imagery, electro-optical and synthetic aperture radar, alongside internal imaging tools for 3D damage detection.',
      'Cut an internal imaging tool’s runtime by close to 70% by cropping imagery to the area of interest.',
    ],
    tags: ['Python', 'NITF', 'EO and SAR imagery'],
    photos: 'l3harris-2026',
  },
  {
    id: 'codepath',
    company: 'CodePath',
    role: 'Tech Fellow',
    place: 'Remote and UPR Mayagüez',
    period: 'August 2025 – Present',
    current: true,
    roles: [
      {
        title: 'Tech Exchange · Intro to Software Engineering',
        period: 'January – May 2026, remote',
        points: [
          'Came back as a Google Tech Exchange alumnus to help teach databases, APIs, frameworks, function mocking and cloud development with Python and Google Cloud.',
          'Built a dashboard on Google Cloud (Cloud Run, Cloud SQL) that tracks student activity and course progress from EdStem data, with an LLM synthesizer (Gemini) that reads the feedback students leave in forms.',
          'Wrote program proposals, including a plan to scale the dashboard to more courses with pseudonymized student data.',
        ],
      },
      {
        title: 'Intro to Programming · CIIC3015 at UPRM',
        period: 'Fall 2025, and again since August 2026',
        points: [
          'Lead pre-lab discussions in Python, reinforcing core concepts before each lab.',
          'Help students debug and solve problems during labs.',
          'Grade projects and give feedback on code quality.',
        ],
      },
    ],
    tags: ['Python', 'Google Cloud', 'Streamlit', 'Teaching'],
  },
  {
    id: 'l3harris-2025',
    company: 'L3Harris Technologies',
    role: 'Software Engineering Intern',
    place: 'Melbourne, FL',
    period: 'May – July 2025',
    points: [
      'Modernized a C++ codebase by replacing legacy raw and deprecated pointers with smart pointers, improving memory safety and stability.',
      'Built a Qt GUI for spectral band selection, so users can work with custom image color bands beyond standard RGB.',
      'Automated the generation of image geometry files, streamlining workflows and reducing manual errors.',
      'Refactored legacy image-processing code into standardized, reusable base classes.',
    ],
    tags: ['C++', 'Qt'],
    photos: 'l3harris-2025',
  },
  {
    id: 'evertec',
    company: 'Evertec',
    role: 'Change Management Intern · ITSM Unit',
    place: 'San Juan, PR',
    period: 'June – December 2024',
    points: [
      'Automated the manual code-integrity verification between testing and production with Groovy in a Jenkins pipeline.',
      'Saved over $3,000 and 5 hours a day by streamlining that process.',
      'Optimized the code-integrity process by 95.71%.',
    ],
    tags: ['Groovy', 'Jenkins', 'Nexus'],
    photos: 'evertec',
  },
  {
    id: 'mcs',
    company: 'MCS Healthcare',
    role: 'Special Projects Intern',
    place: 'San Juan, PR',
    period: 'May – December 2023',
    roles: [
      {
        title: 'Phishing awareness program',
        points: [
          'Supervised completion of phishing training programs, a 63% improvement in compliance rates.',
          'Designed an initiative to automate phishing detection, so reported emails are identified faster.',
          'Evaluated and implemented KnowBe4 PhishER, aligned with NIST Framework requirements, with YARA rules to automate detection.',
        ],
      },
      {
        title: 'Security risk management platform',
        points: ['Integrated an Azure REST API into Fortify Data, giving visibility into Azure configuration risks.'],
      },
      {
        title: 'Device readiness for the Annual Enrollment Period',
        points: [
          'Reconfigured 60+ corporate phones to the latest security image through Microsoft Intune.',
          'Configured and deployed Windows images for laptop and tablet replacements.',
          'Set up a location-monitoring platform and wrote its user guides for supervisors and security personnel.',
        ],
      },
    ],
    tags: ['KnowBe4 PhishER', 'YARA', 'Azure', 'Microsoft Intune'],
    photos: 'mcs',
  },
]

// Research first (ROCS is current), then the leadership roles.
export const research = [
  {
    // The full name is the one on Diego's own title slide (see the first photo). Say what he did, not what the research found.
    id: 'rocs',
    company: 'ROCS',
    role: 'Undergraduate Researcher · Full-stack developer',
    place: 'UPR Mayagüez',
    period: 'February 2026 – Present',
    current: true,
    note: 'Reservation Optimized Carpool System, a research project at UPR Mayagüez.',
    points: [
      'Proposed and implemented the authentication redesign: OAuth 2.0 sign-in (Authorization Code + PKCE) with Google and Microsoft across the Flask API and the React Native app, with the caller’s identity derived from session tokens.',
      'Hardened the Docker image and deployed the API to AWS (Elastic Beanstalk, RDS, S3), with releases automated through GitHub Actions and security tests added to the CI pipeline.',
      'Manage and fix bugs across the API and the app, standardizing JSON error handling and input validation: 50+ merged pull requests across four repositories.',
      'Presented the research at the 44th Puerto Rico Interdisciplinary Scientific Meeting (PRISM) and at UPRM’s Industrial Affiliates Program (IAP) meeting, talk and poster.',
      'Helped interview candidates for the team.',
    ],
    tags: ['OAuth 2.0', 'Flask', 'React Native', 'Docker', 'AWS', 'GitHub Actions'],
    photos: 'rocs',
  },
  {
    id: 'pandahat',
    company: 'PandaHat Cyber Security Group',
    role: 'Undergraduate Researcher',
    place: 'UPR Mayagüez',
    period: 'August 2022 – May 2023',
    note: 'Securing IoT Devices: A Study of the Hardware Penetration Techniques. Advisor: Dra. Nayda G. Santiago.',
    points: [
      'Researched hardware vulnerabilities in IoT devices and tested them with the Attify kit.',
      'Exploited an Orvibo smart plug through mobile app reverse engineering, native library analysis and network traffic capture, with Wireshark, Binary Ninja and Python.',
      'Got root access on an IP camera through its UART serial interface.',
    ],
    tags: ['Wireshark', 'Binary Ninja', 'Python', 'UART'],
    photos: 'pandahat',
  },
  {
    id: 'made',
    company: 'Team MADE',
    role: 'Student Counselor',
    place: 'UPR Mayagüez',
    period: 'June 2022 – December 2024',
    note: 'Student counseling group. Counselor: Dra. Madeline Rodríguez Vargas.',
    points: ['Supported the counseling of 150+ first-year students on the move from high school to university.'],
    photos: 'team-made',
  },
  {
    id: 'mentor',
    company: 'Advanced Programming Laboratory',
    role: 'Mentor · CIIC4010 / ICOM4015',
    place: 'UPR Mayagüez',
    period: 'January – May 2023',
    note: 'Prof. Bienvenido Vélez.',
    points: ['Mentored 25+ students in object-oriented C++: recursion, polymorphism, inheritance, abstraction, encapsulation and introductory data structures.'],
  },
]

// Programs and conferences: only what the photos and the résumé show.
export const programs = [
  {
    id: 'tech-exchange',
    company: 'Google Tech Exchange',
    period: 'January – May 2025',
    role: 'A semester-long program on data structures, software engineering and the correct use of generative AI.',
    photos: 'tech-exchange',
  },
  { id: 'gmis-2026', company: 'Great Minds in STEM Conference', period: 'September 2026', place: 'Albuquerque, NM', photos: 'gmis-2026' },
  { id: 'gmis-2025', company: 'Great Minds in STEM Conference', period: 'October 2025', photos: 'gmis-2025' },
]

export const skills = [
  { group: 'Languages', items: ['Python', 'C++', 'Java', 'JavaScript', 'TypeScript', 'SQL', 'Groovy', 'Swift', 'Go', 'HTML', 'CSS'] },
  { group: 'Cloud and DevOps', items: ['AWS', 'Google Cloud', 'Docker', 'GitHub Actions', 'Jenkins', 'Nexus'] },
  { group: 'Frameworks and data', items: ['Flask', 'React', 'React Native', 'Qt', 'Streamlit', 'Three.js', 'openFrameworks', 'MySQL', 'PostgreSQL'] },
  { group: 'Security', items: ['Wireshark', 'Binary Ninja', 'BeEF', 'KnowBe4 PhishER', 'YARA'] },
  { group: 'Tools and systems', items: ['Git', 'Jira', 'Bitbucket', 'VMware', 'Microsoft Intune', 'Linux', 'Windows', 'macOS'] },
  { group: 'Spoken', items: ['Spanish (native)', 'English (advanced)'] },
]
