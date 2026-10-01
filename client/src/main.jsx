import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:red;color:white;font-size:24px;z-index:99999;padding:40px;box-sizing:border-box;white-space:pre-wrap;';
  errDiv.innerHTML = `FATAL ERROR: ${msg}\nLine: ${lineNo}\nCol: ${columnNo}\nURL: ${url}\n\nStack:\n${error && error.stack ? error.stack : 'N/A'}`;
  document.body.appendChild(errDiv);
  return false;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
