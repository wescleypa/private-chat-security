import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Send as SendIcon, Error as ErrorIcon } from '@mui/icons-material';
import { SocketContext } from './components/socketContext';

const Chat = ({ token, users }) => {
  const socket = useContext(SocketContext);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = () => {
      return new Promise((resolve, reject) => {
        socket.emit('getMessages', token, (response) => {
          if (response.success) {
            resolve(response.message);
          } else {
            reject(response.error || 'Erro ao buscar mensagens.');
          }
        });
      });
    };

    fetchMessages()
      .then((messages) => {
        if (messages && messages.length > 0) {
          const formattedMessages = messages.map(m => ({
            id: m?.id,
            text: m?.message,
            to: m?.to,
            from: m?.from,
            isMe: token?.userID === m?.from,
          }));
          setMessages(formattedMessages);
          console.log('Messages:', formattedMessages);
        }
      })
      .catch((error) => {
        setError(error);
      });
  }, [socket]);

  // Seleciona um usuário
  const handleUserClick = (user) => {
    setSelectedUser(user);
    console.log(user);
  };

  // Envia uma mensagem
  const handleSendMessage = async () => {
    if (newMessage.trim() !== '') {
      const newMessageObj = {
        id: Date.now(), // ID temporário
        text: newMessage,
        to: selectedUser?.token,
        from: token?.userID,
        isMe: true,
        loading: true,
        isError: false,
        errorMessage: '',
      };
      setMessages((prevMessages) => [...prevMessages, newMessageObj]);
      setNewMessage('');
      setLoading(true);

      try {
        await new Promise((resolve, reject) => {
          socket.emit('message', { from: token?.userID, to: selectedUser?.token, message: newMessage, token }, (res) => {
            if (res.success) {
              resolve(res);
            } else {
              reject(res.message || 'Erro ao enviar mensagem.');
            }
          });
        });

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newMessageObj.id ? { ...msg, loading: false } : msg
          )
        );
      } catch (error) {
        if (error === "IP bloqueado") {
          socket.disconnect();
          window.close();
        }

        setError(error);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newMessageObj.id ? { ...msg, loading: false, isError: true, errorMessage: error } : msg
          )
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtra as mensagens para exibir apenas as relevantes
  const filteredMessages = messages.filter(m => 
    (m.from === token?.userID && m.to === selectedUser?.token) || // Mensagens enviadas pelo usuário atual para o usuário selecionado
    (m.to === token?.userID && m.from === selectedUser?.token) // Mensagens recebidas pelo usuário atual do usuário selecionado
  );

  return (
    <Box display="flex" height="100vh" bgcolor="#f5f5f5">
      {/* Lado esquerdo: Lista de usuários */}
      <Box width="25%" bgcolor="#ffffff" boxShadow={2}>
        <Typography variant="h6" padding={2} color="primary">
          Usuários
        </Typography>
        <Divider />
        <List>
          {users.map((user, index) => (
            <ListItem
              button
              key={index}
              onClick={() => handleUserClick(user)}
              selected={selectedUser?.token === user.token}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemAvatar>
                <Avatar>0{user.id}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={`0${user.id}`} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Lado direito: Área de conversa */}
      <Box width="75%" display="flex" flexDirection="column">
        {/* Cabeçalho da conversa */}
        <Box padding={2} bgcolor="#ffffff" boxShadow={2}>
          <Typography variant="h6">
            {selectedUser ? `Conversando com 0${selectedUser.id}` : 'Selecione um usuário'}
          </Typography>
        </Box>

        {/* Mensagens */}
        <Box flex={1} padding={2} overflow="auto" bgcolor="#f5f5f5">
          {filteredMessages.map((msg, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection="column"
              alignItems={msg.isMe ? 'flex-end' : 'flex-start'}
              marginBottom={2}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
              >
                {!msg.isMe && (
                  <Avatar sx={{ marginRight: 1 }}>0{selectedUser?.id}</Avatar>
                )}
                <Box
                  bgcolor={msg.isError ? '#ffebee' : msg.isMe ? '#1976d2' : '#ffffff'}
                  color={msg.isError ? '#d32f2f' : msg.isMe ? '#ffffff' : '#000000'}
                  padding={1.5}
                  borderRadius={2}
                  boxShadow={1}
                  maxWidth="60%"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {msg.isError && <ErrorIcon fontSize="small" color="error" />}
                  <Typography variant="body1">{msg.text ?? (msg?.message ?? 'Mensagem desconhecida')}</Typography>
                  {msg.loading && (
                    <CircularProgress size={20} sx={{ marginLeft: 1, color: '#ffffff' }} />
                  )}
                </Box>
                {msg.isMe && (
                  <Avatar sx={{ marginLeft: 1 }}>Eu</Avatar>
                )}
              </Box>
              {msg.isError && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ marginTop: 0.5, marginLeft: msg.isMe ? 0 : 6 }}
                >
                  {msg.errorMessage}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Campo de entrada de mensagem */}
        <Box padding={2} bgcolor="#ffffff" boxShadow={2}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Digite uma mensagem"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedUser || loading}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              disabled={!selectedUser || newMessage.trim() === '' || loading}
              endIcon={<SendIcon />}
            >
              Enviar
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Snackbar para exibir mensagens de erro */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;