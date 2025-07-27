import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-info">© {new Date().getFullYear()} - Universidad Central del Ecuador - Legislación Informática</p>
    </footer>
  );
}
