import React, { useState, useEffect, useContext } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { SocketContext } from '../../components/socketContext';

const LoginForm = ({ setSession, setUsers }) => {
  const socket = useContext(SocketContext);

  const [password, setPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para controlar o loading
  const [error, setError] = useState(''); // Estado para exibir mensagens de erro

  // Função para lidar com o login
  const handleLogin = async () => {
    if (password.trim() === '') {
      setError('Por favor, insira um token válido.');
      return;
    }

    setLoading(true); // Ativa o loading
    setError(''); // Limpa mensagens de erro anteriores

    try {
      // Cria uma Promise para aguardar a resposta do servidor
      await new Promise((resolve, reject) => {
        socket.emit('login', password, (res) => {
          if (res.success) {
            resolve(res); // Resolve a Promise se o login for bem-sucedido
            console.log(res)
            const { token, userID } = res?.data;
            setSession({ token, userID });
            setUsers(res?.data?.users);
          } else {
            window.close();
            reject(res.message || 'Erro ao fazer login.'); // Rejeita a Promise em caso de erro
          }
        });
      });

      setLoginAttempted(true);
    } catch (err) {
      // Se houver erro no login
      console.error('Erro no login:', err);
      setError(err); // Exibe a mensagem de erro
    } finally {
      setLoading(false); // Desativa o loading, independentemente do resultado
    }
  };

  // Contagem regressiva
  useEffect(() => {
    if (timeLeft === 0) {
      window.close(); // Fecha a página após 2 minutos
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer); // Limpa o timer ao desmontar o componente
  }, [timeLeft]);

  return (
    !error ? (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
          Eai cara de cu 🤠, preencha seu token de acesso por gentileza
        </Typography>
        <TextField
          type="password"
          label="Token de acesso"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2, width: 500 }}
          error={!!error} // Exibe erro no campo se houver mensagem de erro
          helperText={error} // Exibe a mensagem de erro abaixo do campo
        />
        <Button variant="contained" onClick={handleLogin} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Acessar'}
        </Button>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Tempo restante: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </Typography>
      </Box>
    ) : (
      <>Hoje não, rs.</>
    )
  );
};

export default LoginForm;