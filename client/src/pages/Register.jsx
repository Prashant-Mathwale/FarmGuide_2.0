import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import api from '../services/api';

function Register({ setAuthUser }) {
    const [formData, setFormData] = useState({
        fullName: '', phone: '', password: '', state: '', district: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/register', formData);
            localStorage.setItem('userInfo', JSON.stringify(res.data));
            setAuthUser(res.data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 py-12 bg-transparent">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-lg z-10 glass-panel rounded-[2.5rem] p-10 border border-white/10"
            >
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20 border border-primary/30">
                        <Sprout size={24} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Create an Account</h2>
                    <p className="text-on-surface-variant font-body mt-2 text-sm uppercase tracking-widest font-bold">Join the next generation of farming</p>
                </div>

                {error && (
                    <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl mb-6 text-xs font-bold text-center uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">Full Name</label>
                        <input name="fullName" type="text" onChange={handleChange} required className="input-field" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                        <input name="phone" type="text" onChange={handleChange} required className="input-field" placeholder="9876543210" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">Password</label>
                        <input name="password" type="password" onChange={handleChange} required className="input-field" placeholder="Create a strong password" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">State</label>
                            <input name="state" type="text" onChange={handleChange} required className="input-field" placeholder="Maharashtra" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">District</label>
                            <input name="district" type="text" onChange={handleChange} required className="input-field" placeholder="Pune" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary text-sm h-12 uppercase tracking-widest font-black mt-2">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-8 text-center text-on-surface-variant text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                        Log in instead
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Register;
