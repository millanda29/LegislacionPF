// src/pages/HomePage.jsx
import "./HomePage.css";
import uceLogo from "../assets/logo-uce.png";
import { projectInfo } from "../constants/projectInfo";

export default function HomePage() {
  const {
    university,
    faculty,
    career,
    course,
    teacher,
    period,
    deliveryDate,
    project,
    objectives,
    dataset,
    methodology,
    stack,
    architecture,
    team,
    legal,
    contact,
    routes
  } = projectInfo;

  return (
    <div className="home">
      {/* Encabezado */}
      <header className="home-header card">
        <img src={uceLogo} alt="Logo UCE" className="uce-logo" />
        <h1>{university}</h1>
        <h2>{faculty}</h2>
        <h3>{career}</h3>
        <p className="course">{course}</p>
        <p className="teacher">{teacher}</p>
        <p className="meta">{period}</p>
        <p className="meta">{deliveryDate}</p>
      </header>

      {/* Proyecto */}
      <section className="home-project card">
        <h2>Proyecto</h2>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-desc">{project.description}</p>
      </section>

      {/* Objetivos */}
      <section className="home-objectives card">
        <h2>Objetivo General</h2>
        <p>{objectives.general}</p>

        <h3>Objetivos Específicos</h3>
        <ul>
          {objectives.specifics.map((obj, idx) => (
            <li key={idx}>{obj}</li>
          ))}
        </ul>
      </section>

      {/* Dataset */}
      <section className="home-dataset card">
        <h2>Datos & Fuentes</h2>
        <h4>Fuentes:</h4>
        <ul>
          {dataset.sources.map((s, i) => (
          <li key={i}>{s}</li>
          ))}
        </ul>
        <p><strong>Rango temporal:</strong> {dataset.temporalRange}</p>
        <p><strong>Frecuencia:</strong> {dataset.frequency}</p>

        <h4>Variables Consideradas:</h4>
        <ul className="tags">
          {dataset.variables.map((v, i) => (
            <li key={i} className="tag">{v}</li>
          ))}
        </ul>
        <p className="note">{dataset.notes}</p>
      </section>

      {/* Metodología */}
      <section className="home-methodology card">
        <h2>Metodología</h2>
        <ol>
          {methodology.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <h3>Modelos candidatos</h3>
        <ul className="tags">
          {methodology.candidateModels.map((m, i) => (
            <li key={i} className="tag">{m}</li>
          ))}
        </ul>

        <h3>Métricas</h3>
        <ul className="tags">
          {methodology.metrics.map((m, i) => (
            <li key={i} className="tag">{m}</li>
          ))}
        </ul>
      </section>

      {/* Arquitectura & Stack */}
      <section className="home-architecture card">
        <h2>Arquitectura General</h2>
        <ul>
          {architecture.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>

        <h3>Stack Tecnológico</h3>
        <div className="stack-grid">
          <div>
            <h4>Frontend</h4>
            <ul>
              {stack.frontend.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div>
          <h4>Backend</h4>
            <ul>
              {stack.backend.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div>
            <h4>ML / Data</h4>
            <ul>
              {stack.ml.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          <div>
            <h4>DevOps</h4>
            <ul>
              {stack.devops.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* Rutas del Frontend */}
      <section className="home-routes card">
        <h2>Rutas del Frontend</h2>
        <ul className="tags">
          {routes.map((r) => (
            <li key={r.path} className="tag">
              {r.label} <span className="path">({r.path})</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Integrantes */}
      <section className="home-team card">
        <h2>Integrantes</h2>
        <ul>
          {team.map((member, i) => (
            <li key={i}>{member}</li>
          ))}
        </ul>
      </section>

      {/* Legal */}
      <section className="home-legal card">
        <h2>Licenciamiento & Aspectos Legales</h2>
        <p><strong>Licencia del código:</strong> {legal.licenseCode}</p>
        <p><strong>Licencia(s) de los datos:</strong> {legal.dataLicense}</p>
        <p className="note">{legal.notes}</p>
      </section>

      {/* Contacto */}
      <section className="home-contact card">
        <h2>Contacto</h2>
        <p>Correos:</p>
        <ul>
          {contact.emails.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        {contact.github && (
          <p>
            Repositorio:{" "}
            <a href={contact.github} target="_blank" rel="noreferrer">
              {contact.github}
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
