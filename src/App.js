import { useEffect, useState } from 'react';
import Chat from './Chat';
import LoginForm from './pages/auth/Login';
import { socket } from './components/socketController';
import { SocketContext } from './components/socketContext';
import OneSignal from 'react-onesignal';

function App() {
  const [signalID, setSignalID] = useState('');
  const [userSession, setSession] = useState({ token: '', userID: '' });
  const [users, setUsers] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: '56911354-3a45-426f-8b1e-1ef74f605a79', // Substitua pelo seu OneSignal App ID
          allowLocalhostAsSecureOrigin: true, // Permitir localhost:3000
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: true,
              timeDelay: 1,
              pageViews: 1,
            },
          },
        });

        // Verifica se as notificações estão ativadas
        const permission = await OneSignal.Notifications.permission;
        setNotificationEnabled(permission);
      } catch (error) {
        console.error('Error initializing OneSignal:', error);
      }
    };

    // Verifica se o OneSignal já foi inicializado
    if (!window.OneSignal) {
      initializeOneSignal();
    }
  }, []); // O array de dependências vazio garante que isso seja executado apenas uma vez

  useEffect(() => {
    if (userSession?.token) {
      OneSignal.User.addTag('token', userSession.userID);
    }
  }, [userSession]);

  // Inicializa a conexão do socket
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {userSession?.token ? (
        notificationEnabled ? (
          <Chat token={userSession} users={users} />
        ) : (
          <NotificationPrompt />
        )
      ) : (
        <LoginForm setSession={setSession} setUsers={setUsers} />
      )}
    </SocketContext.Provider>
  );
}

const NotificationPrompt = () => {
  const handleEnableNotifications = async () => {
    try {
      await OneSignal.Notifications.requestPermission();
      window.location.reload(); // Recarrega a página para verificar a permissão novamente
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  return (
    <div>
      <h1>Por favor, ative as notificações para continuar</h1>
      <button onClick={handleEnableNotifications}>Ativar Notificações</button>
    </div>
  );
};

export default App;