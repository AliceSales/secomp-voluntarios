import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';

export default function Checkin() {
  const { id } = useLocalSearchParams(); // Pega o ID da palestra da URL
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  const [messageColor, setMessageColor] = useState<string>('#1e90ff'); // Cor padrão (azul)
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Evita requisições duplicadas

  console.log(id);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
        setMessage(null); // Limpa a mensagem para o próximo uso
        setQrCodeData(null); // Limpa o QR Code e volta para o scanner
      }, 3000); // Exibe a mensagem por 3 segundos
    }
  }, [message]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para usar a câmera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Conceder permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isSubmitting) return; // Evita chamadas simultâneas
    setQrCodeData(data);
    setIsSubmitting(true);

    try {
      const response = await fetch(`https://api.secompufpe.com/palestras/${id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_email: data, // e-mail do QR Code
        }),
      });

      if (response.ok) {
        setMessage('Check-in realizado com sucesso!');
        setMessageColor('#32CD32'); // Cor verde para sucesso
      } else {
        const responseJson = await response.json();
        if (responseJson.status === 'fila') {
          setMessage('Você está na lista de espera!');
          setMessageColor('#FFA500'); // Cor laranja para fila
        } else {
          setMessage('Falha ao registrar usuário na palestra.');
          setMessageColor('#FF6347'); // Cor vermelha para erro
        }
      }
    } catch (error) {
      setMessage('Erro ao registrar na palestra.');
      setMessageColor('#FF6347'); // Cor vermelha para erro
    } finally {
      setIsSubmitting(false); // Libera para novas requisições
    }
  };

  return (
    <View style={styles.container}>
      {qrCodeData ? (
        <View style={styles.resultContainer}>
          {showMessage && (
            <View style={[styles.messageContainer, { backgroundColor: messageColor }]}>
              <Text style={styles.resultText}>{message}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() => setQrCodeData(null)}
          >
            <Text style={styles.text}>Ler outro QR Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarCodeScanned}
          style={styles.cameraView}
        >
          <View style={styles.buttonContainer}></View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  messageContainer: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    opacity: 0.9,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
