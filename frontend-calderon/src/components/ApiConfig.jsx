import React, { useState, useEffect } from 'react';
import { getApiConfig } from '../config/api.js';

const ApiConfig = () => {
  const [config, setConfig] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setConfig(getApiConfig());
  }, []);

  if (!config) {
    return null;
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="api-config">
      <button 
        onClick={toggleVisibility}
        className="btn-config"
        title="Mostrar/Ocultar configuración de API"
      >
        {isVisible ? '🔽' : '🔼'} Configuración API
      </button>
      
      {isVisible && (
        <div className="config-panel">
          <h4>Configuración de la API</h4>
          
          <div className="config-section">
            <strong>URL Base:</strong> 
            <span className={config.validation.isValid ? 'valid' : 'invalid'}>
              {config.BASE_URL}
            </span>
          </div>
          
          <div className="config-section">
            <strong>Timeout:</strong> {config.TIMEOUT}ms
          </div>
          
          <div className="config-section">
            <strong>Estado:</strong>
            <span className={config.validation.isValid ? 'status-valid' : 'status-invalid'}>
              {config.validation.isValid ? '✅ Válida' : '❌ Inválida'}
            </span>
          </div>
          
          {!config.validation.isValid && (
            <div className="config-errors">
              <strong>Problemas detectados:</strong>
              <ul>
                {config.validation.issues.map((issue, index) => (
                  <li key={index} className="error-item">{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="config-section">
            <strong>Variables de entorno:</strong>
            <div className="env-vars">
              <div>VITE_API_BASE_URL: {import.meta.env.VITE_API_BASE_URL || 'No configurada'}</div>
              <div>REACT_APP_API_URL: {import.meta.env.REACT_APP_API_URL || 'No configurada'}</div>
            </div>
          </div>
          
          <div className="config-section">
            <strong>Endpoints disponibles:</strong>
            <div className="endpoints-list">
              {Object.entries(config.ENDPOINTS).map(([category, endpoints]) => (
                <div key={category} className="endpoint-category">
                  <strong>{category}:</strong>
                  <ul>
                    {Object.entries(endpoints).map(([name, path]) => (
                      <li key={name}>
                        {name}: <code>{path}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiConfig; 