import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './styles/index.css';
import App from './App';
import { installDeploymentRecovery } from './utils/deploymentRecovery';
installDeploymentRecovery(import.meta.url);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
