import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import FormInput from '../../components/ui/form/FormInput';
import FormButton from '../../components/ui/form/FormButton';
import toast from 'react-hot-toast';
import { login } from '../../functions/auth/AuthMethods';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { token, setToken, setProfile } = useAuth(); 
  const navigate = useNavigate();
  
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true }); 
    }
  }, [token, navigate]);

  const handlesubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
        setLoading(true);
        
        const data = await login({ email, password }); 
      
        if (data && data.token) {
            setToken(data.token);
            const userObj = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            setProfile(userObj); 
        }
        
        setLoading(false);
    } catch (err) {
        console.log(err);
        setLoading(false);
    }
  }

  return (
    // Conteneur principal : prend tout l'écran, gère le dark mode et centre la carte
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f1] dark:bg-gray-900 transition-colors duration-300 p-4">
      
      {/* Carte de connexion */}
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          
          {/* En-tête avec Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            {/* J'ai ajusté la taille de l'image pour qu'elle soit plus harmonieuse */}
            <img src="/logo.png" className="h-28 w-auto object-contain mb-4" alt="Asclépios Logo" />
            <h2 className="text-2xl font-bold text-[#003366] dark:text-white text-center tracking-tight">
              Bienvenue
            </h2>
            <p className="text-xs text-[#00a896] dark:text-teal-400 mt-1 font-medium uppercase tracking-wider text-center">
              Asclépios ERP
            </p>
          </div>
          
          {/* Formulaire */}
          {/* space-y-5 ajoute automatiquement un espacement parfait entre les inputs sans utiliser de <br> */}
          <form onSubmit={handlesubmit} className="space-y-5">
            <div>
              <FormInput 
                label="Email" 
                type="email"
                value={email} 
                setValue={setEmail} 
                placeholder="Entrez votre email" 
                error={null}
              />
            </div>
            
            <div>
              <FormInput 
                label="Mot de passe" 
                type="password" 
                value={password} 
                setValue={setPassword} 
                placeholder="Entrez votre mot de passe" 
                error={null}
              />
            </div>
            
            {/* Zone du bouton (avec un léger padding-top pour l'aérer) */}
            <div className="pt-2">
              <FormButton 
                  label='Se connecter' 
                  loading={loading} 
                  type="submit" 
                  // On donne une couleur moderne au bouton, qui s'assombrit au survol
                  classname='bg-[#00a896] hover:bg-[#008f7e] dark:bg-teal-600 dark:hover:bg-teal-500 text-white w-full py-2.5 rounded-lg transition-colors font-semibold shadow-sm'
              />
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}

export default Login;