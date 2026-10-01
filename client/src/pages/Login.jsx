import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import api from '../services/api';

function Login({ setAuthUser }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { phone, password });
            localStorage.setItem('userInfo', JSON.stringify(res.data));
            setAuthUser(res.data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-transparent">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10 glass-panel rounded-[2.5rem] p-10 border border-white/10"
            >
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 border border-primary/30">
                        <Sprout size={32} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Welcome Back</h2>
                    <p className="text-on-surface-variant font-body mt-2">Log in to manage your smart farm</p>
                </div>

                {error && (
                    <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl mb-6 text-xs font-bold text-center uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary text-sm h-12 uppercase tracking-widest font-black mt-2">
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-on-surface-variant text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:text-primary/80 font-bold transition-colors">
                        Create an account
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Login;
