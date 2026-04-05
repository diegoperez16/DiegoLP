export const albums = [
  {
    id: 'about',
    title: 'Side A — About',
    artist: 'Diego Pérez',
    year: '2027',
    color: '#7c3aed',
    accentColor: '#a78bfa',
    gradientA: '#4c1d95',
    gradientB: '#7c3aed',
    rpm: '33⅓',
    genre: 'Intro',
  },
  {
    id: 'education',
    title: 'Academic Record',
    artist: 'Diego Pérez',
    year: '2021–2027',
    color: '#1d4ed8',
    accentColor: '#60a5fa',
    gradientA: '#1e3a8a',
    gradientB: '#1d4ed8',
    rpm: '33⅓',
    genre: 'Education',
  },
  {
    id: 'experience',
    title: 'Work History',
    artist: 'Diego Pérez',
    year: '2023–2026',
    color: '#0f766e',
    accentColor: '#2dd4bf',
    gradientA: '#042f2e',
    gradientB: '#0f766e',
    rpm: '33⅓',
    genre: 'Experience',
  },
  {
    id: 'projects',
    title: 'The Lab',
    artist: 'Diego Pérez',
    year: '2023–2026',
    color: '#b45309',
    accentColor: '#fbbf24',
    gradientA: '#451a03',
    gradientB: '#b45309',
    rpm: '45',
    genre: 'Projects',
  },
  {
    id: 'skills',
    title: 'The Stack',
    artist: 'Diego Pérez',
    year: 'Ongoing',
    color: '#065f46',
    accentColor: '#34d399',
    gradientA: '#022c22',
    gradientB: '#065f46',
    rpm: '33⅓',
    genre: 'Skills',
  },
  {
    id: 'contact',
    title: 'Get In Touch',
    artist: 'Diego Pérez',
    year: '2026',
    color: '#9d174d',
    accentColor: '#f472b6',
    gradientA: '#500724',
    gradientB: '#9d174d',
    rpm: '45',
    genre: 'Contact',
  },
]

export const portfolioContent = {
  about: {
    heading: 'Hey, I\'m Diego',
    body: `Software Engineering student at UPRM with a taste for building things that feel alive. I live at the intersection of engineering and creativity — from modernizing legacy C++ systems to crafting interactive web experiences.

Based in Puerto Rico. Open to internships, freelance, and full-time opportunities.`,
    tracks: [
      { number: '01', title: 'Software Engineering @ UPRM', duration: 'May 2027' },
      { number: '02', title: 'Google Tech Exchange Alumni', duration: '2025' },
      { number: '03', title: 'Builder of Things', duration: '∞' },
    ],
  },

  education: {
    heading: 'Where I Studied',
    body: '',
    tracks: [
      {
        number: '01',
        title: 'B.S. Software Engineering — UPRM',
        duration: 'May 2027',
        detail: 'University of Puerto Rico, Mayagüez. GPA: 3.15 / 4.00',
      },
      {
        number: '02',
        title: 'Google Tech Exchange',
        duration: 'Jan–May 2025',
        detail: 'Semester-long program on data structures, software engineering, and generative AI.',
      },
    ],
  },

  experience: {
    heading: 'Where I\'ve Played',
    body: '',
    tracks: [
      {
        number: '01',
        title: 'CodePath Tech Fellow — UPRM',
        duration: 'Aug 2025–Now',
        detail: 'Lead pre-lab discussions for Intro to Python (CIIC3015). Debug, guide, and grade projects for student success.',
      },
      {
        number: '02',
        title: 'Software Engineering Intern — L3 Harris',
        duration: 'May–Jul 2025',
        detail: 'Modernized C++ codebase with smart pointers. Built a Qt GUI for custom spectral band selection. Automated image geometry file generation.',
      },
      {
        number: '03',
        title: 'ITSM Intern — Evertec Inc.',
        duration: 'Jun–Dec 2024',
        detail: 'Automated code integrity verification via Groovy/Jenkins. Cut $3k+ in costs and saved 5 hours/day. Optimized pipeline performance by 95.71%.',
      },
      {
        number: '04',
        title: 'Special Projects Intern — MCS Healthcare',
        duration: 'May–Dec 2023',
        detail: 'Built phishing automation with KnowBe4 PhishER + YARA. Integrated Azure REST API into Fortify Data. Reconfigured 60+ devices via Microsoft Intune.',
      },
    ],
  },

  projects: {
    heading: 'What I\'ve Built',
    body: '',
    tracks: [
      {
        number: '01',
        title: 'RabbitHole',
        duration: '2025–2026',
        detail: 'A personal lab of experimental projects and interactive demos — the repo you\'re looking at right now.',
      },
      {
        number: '02',
        title: 'PopcornPal',
        duration: '2024',
        detail: 'Movie discovery app with personalized recommendations and mood-based filtering.',
      },
      {
        number: '03',
        title: 'miniCTF',
        duration: '2025',
        detail: 'A self-hosted capture-the-flag challenge suite for security learning and practice.',
      },
      {
        number: '04',
        title: 'PkTypeAnalyzer',
        duration: '2024',
        detail: 'Pokémon type matchup analyzer — type coverage, weaknesses, and battle recommendations.',
      },
      {
        number: '05',
        title: 'TypeWriter',
        duration: '2024',
        detail: 'Minimal, distraction-free writing tool built for focus.',
      },
      {
        number: '06',
        title: 'Valentine 2026',
        duration: '2026',
        detail: 'An interactive love letter built as a fully animated web experience.',
      },
    ],
  },

  skills: {
    heading: 'The Stack',
    body: 'Technologies I reach for when building.',
    tracks: [
      { number: '01', title: 'Python / Java / C++', duration: 'Core' },
      { number: '02', title: 'JavaScript / HTML / CSS', duration: 'Core' },
      { number: '03', title: 'React / Three.js / WebGL', duration: 'Frontend' },
      { number: '04', title: 'Jenkins / Groovy / Nexus', duration: 'DevOps' },
      { number: '05', title: 'Qt / OpenFrameworks', duration: 'Systems' },
      { number: '06', title: 'Wireshark / Binary Ninja / BeEF', duration: 'Security' },
      { number: '07', title: 'GitHub / Jira / Bitbucket', duration: 'Workflow' },
      { number: '08', title: 'Windows / Linux / MacOS', duration: 'Environments' },
    ],
  },

  contact: {
    heading: 'Let\'s Talk',
    body: 'Open for internships, collaborations, or just a good conversation.',
    tracks: [
      { number: '✉', title: 'diego.perez16@upr.edu', duration: 'Email', link: 'mailto:diego.perez16@upr.edu' },
      { number: 'in', title: 'linkedin.com/in/diego-ganda', duration: 'LinkedIn', link: 'https://linkedin.com/in/diego-ganda/' },
      { number: 'gh', title: 'github.com/diegoperez16', duration: 'GitHub', link: 'https://github.com/diegoperez16' },
      { number: '☎', title: '(787) 604-3692', duration: 'Phone', link: 'tel:+17876043692' },
    ],
  },
}
