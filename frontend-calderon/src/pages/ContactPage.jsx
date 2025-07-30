import "./PageStyles.css";

export default function ContactPage() {
  return (
    <div className="page">
      <div className="card">
        <h1>Equipo de Trabajo</h1>
        <ul>
          <li>Karen Milene Amaguaña Cangás</li>
          <li>Carlos Daniel Hernandez Cabeza</li>
          <li>Bryan Alejandro Lara Izurieta</li>
          <li>Maikol Isaac Llanda Huatatoca</li>
        </ul>
      </div>
      <div className="card">
        <h1>Contacto</h1>
        <p>Si deseas más información, puedes escribirnos a:</p>
        <ul>
          <li>kmamaguana@uce.edu.ec</li>
          <li>cdhernandezc@uce.edu.ec</li>
          <li>balarai@uce.edu.ec</li>
          <li>millanda@uce.edu.ec</li>
        </ul>
      </div>
    </div>
  );
}