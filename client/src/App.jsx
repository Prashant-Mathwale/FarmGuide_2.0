import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CropRec from './pages/CropRec';
import DiseaseDetect from './pages/DiseaseDetect';
import MarketPrices from './pages/MarketPrices';
import Weather from './pages/Weather';
import Irrigation from './pages/Irrigation';
import Schemes from './pages/Schemes';
import Fertilizer from './pages/Fertilizer';
import PestPrediction from './pages/PestPrediction';
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (e) {
      console.error("Local storage parsing failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="bg-transparent min-h-screen text-white flex items-center justify-center">Loading FarmGuide...</div>;

  return (
    <Router>
      <div className="bg-transparent min-h-screen text-slate-200 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" replace />} />
          <Route path="/login" element={!user ? <Login setAuthUser={setUser} /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <Register setAuthUser={setUser} /> : <Navigate to="/dashboard" replace />} />

          {/* Protected Routes directly rendering Layouts */}
          <Route path="/dashboard" element={user ? <Layout user={user} setUser={setUser}><Dashboard /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/crop-rec" element={user ? <Layout user={user} setUser={setUser}><CropRec /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/disease-detect" element={user ? <Layout user={user} setUser={setUser}><DiseaseDetect /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/market-prices" element={user ? <Layout user={user} setUser={setUser}><MarketPrices /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/weather" element={user ? <Layout user={user} setUser={setUser}><Weather /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/irrigation" element={user ? <Layout user={user} setUser={setUser}><Irrigation /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/schemes" element={user ? <Layout user={user} setUser={setUser}><Schemes /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/fertilizer" element={user ? <Layout user={user} setUser={setUser}><Fertilizer /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/pest-predict" element={user ? <Layout user={user} setUser={setUser}><PestPrediction /></Layout> : <Navigate to="/login" replace />} />
          
          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
        </Routes>
        
        {user && <Chatbot />}
      </div>
    </Router>
  );
}

export default App;
