import { Link } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";
import logo from "../assets/logo-uce.png"; // Asegúrate de que exista la imagen en esta ruta

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      {/* Logo y Título */}
      <div className="navbar-logo">
        <img src={logo} alt="Logo Proyecto" className="navbar-logo-img" />
        <h1 className="navbar-title">
          Predicción de Precipitación y Disponibilidad de Agua - Calderón
        </h1>
      </div>

      {/* Botón Hamburguesa Animado */}
      <button
        className={`navbar-toggle ${isOpen ? "open" : ""}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Enlaces de Navegación */}
      <ul className={`navbar-links ${isOpen ? "active" : ""}`}>
        <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
        <li><Link to="/forecast" onClick={closeMenu}>Predicción</Link></li>
        <li><Link to="/data" onClick={closeMenu}>Datos Históricos</Link></li>
        <li><Link to="/about" onClick={closeMenu}>Acerca</Link></li>
        <li><Link to="/team" onClick={closeMenu}>Equipo</Link></li>
        <li><Link to="/contact" onClick={closeMenu}>Contacto</Link></li>
      </ul>
    </nav>
  );
}
