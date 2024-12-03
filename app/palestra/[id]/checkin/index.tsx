import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Checkin() {
  const { id } = useLocalSearchParams();
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  const [messageColor, setMessageColor] = useState<string>('#1e90ff');
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [palestra, setPalestra] = useState<any>(null);

  useEffect(() => {
    fetch(`https://api.secompufpe.com/partner/${id}`)
      .then(response => response.json())
      .then(data => setPalestra(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
        setMessage(null);
        setQrCodeData(null);
      }, 3000);
    }
  }, [message]);

  if (!permission) return <View />;
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
    if (isSubmitting) return;
    setQrCodeData(data);
    setIsSubmitting(true);

    try {
      const fetchUserInfo = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) throw new Error('Token não encontrado');
            const response = await fetch(`https://api.secompufpe.com/palestras/${id}/checkin`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ usuario_email: data }),
            });
            console.log(response);
            if (response.ok) {
              setMessage('Check-in realizado com sucesso!');
              setMessageColor('#32CD32');
            } else {
              const responseJson = await response.json();
              if (responseJson.status === 'fila') {
                setMessage('Você está na lista de espera!');
                setMessageColor('#FFA500');
              } else if (responseJson.error) {
                setMessage(responseJson.error);
              } 
              else {
                setMessage('Falha ao registrar usuário na palestra.');
                setMessageColor('#FF6347');
              }
            }
        } catch (err) {
        console.error(err);
      }
    }
    fetchUserInfo()
    } catch (error) {
      setMessage('Erro ao registrar na palestra.');
      setMessageColor('#FF6347');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTime = palestra ? new Date(palestra.timestamp * 1000).toLocaleTimeString() : '';

  return (
    <View style={styles.container}>
      {palestra && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{palestra.title}</Text>
          <Text style={styles.time}>Início: {startTime}</Text>
        </View>
      )}

      {qrCodeData ? (
        <View style={styles.resultContainer}>
          {showMessage && (
            <View style={[styles.messageContainer, { backgroundColor: messageColor }]}>
              <Text style={styles.resultText}>{message}</Text>
            </View>
          )}
          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => setQrCodeData(null)}
          >
            <Text style={styles.text}>Ler outro QR Code</Text>
          </TouchableOpacity> */}
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
    backgroundColor: 'white',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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
  titleContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  time: {
    fontSize: 18,
    color: 'white',
  },
});
