window.stannetProgrammingCurriculum = {
  tracks: [
    {
      id: 'web-foundations',
      title: 'Fundamentos Web',
      level: 'Básico',
      description: 'Aprende HTML5 semántico, diseño moderno con CSS3 y programación esencial con JavaScript.',
      lessons: [
        { id: 'html-basics', title: 'Estructura semántica con HTML5' },
        { id: 'css-layout', title: 'Flexbox, Grid y diseño responsivo' },
        { id: 'js-dom', title: 'Interactividad y manipulación del DOM' }
      ]
    },
    {
      id: 'backend-core',
      title: 'Backend & APIs',
      level: 'Intermedio',
      description: 'Desarrollo de servicios backend, lógica de servidor, autenticación y consumo seguro de APIs REST.',
      lessons: [
        { id: 'node-intro', title: 'Entorno de ejecución y módulos' },
        { id: 'api-rest', title: 'Creación de endpoints y middleware' },
        { id: 'db-connect', title: 'Bases de datos y persistencia' }
      ]
    },
    {
      id: 'cyber-code',
      title: 'Programación Segura',
      level: 'Avanzado',
      description: 'Buenas prácticas de seguridad, sanitización de entradas, prevención de vulnerabilidades OWASP y auditoría.',
      lessons: [
        { id: 'owasp-top10', title: 'Prevención de inyecciones y XSS' },
        { id: 'auth-tokens', title: 'Manejo seguro de credenciales y JWT' },
        { id: 'code-review', title: 'Análisis estático de código' }
      ]
    }
  ],
  languages: [
    { id: 'js', name: 'JavaScript', category: 'Frontend / Fullstack' },
    { id: 'html-css', name: 'HTML & CSS', category: 'Frontend' },
    { id: 'python', name: 'Python', category: 'Scripting / Backend' },
    { id: 'sql', name: 'SQL', category: 'Bases de datos' }
  ],
  builds: [
    { id: 'portfolio', title: 'Portfolio Personal Interactivo' },
    { id: 'dashboard', title: 'Panel de Control y Monitorización' },
    { id: 'api-service', title: 'Microservicio RESTful Seguro' }
  ]
};
