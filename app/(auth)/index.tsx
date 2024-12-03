import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const router = useRouter();

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (username && password) {
      try {
        const response = await fetch('https://auth.secompufpe.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, remember: true }),
        });

        if (response.ok) {
          const data = await response.json();
          const token = data.id_token;

          console.log(token);

          // Armazena o token no AsyncStorage
          await AsyncStorage.setItem('token', token);

          showAlert('Login bem-sucedido!', 'Bem-vindo(a) de volta!');
          router.push('/home'); // Redireciona para a página inicial
        } else {
          const errorData = await response.json();
          showAlert('Erro de autenticação', errorData.message || 'Credenciais inválidas.');
        }
      } catch (error) {
        showAlert('Erro', 'Não foi possível conectar ao servidor. Tente novamente.');
        console.log(error);
      }
    } else {
      showAlert('Erro', 'Por favor, preencha todos os campos.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#F102AE"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#F102AE"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      {/* Modal para Alerta Customizado */}
      <Modal
        transparent
        visible={alertVisible}
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000000', // Fundo preto
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EBFF08', // Título em amarelo
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#F102AE', // Borda rosa
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: '#FFFFFF', // Texto branco no campo
    backgroundColor: '#1A1A1A', // Fundo escuro no input
  },
  button: {
    backgroundColor: '#EBFF08', // Fundo do botão em amarelo
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#F102AE', // Sombra em rosa
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#000000', // Texto preto no botão
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fundo semitransparente
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    backgroundColor: '#1A1A1A', // Fundo escuro
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderColor: '#F102AE',
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EBFF08', // Título em amarelo
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#FFFFFF', // Mensagem branca
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: '#EBFF08', // Fundo do botão do alerta
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F102AE', // Borda rosa
  },
  alertButtonText: {
    color: '#000000', // Texto preto no botão do alerta
    fontWeight: 'bold',
    fontSize: 16,
  },
});
