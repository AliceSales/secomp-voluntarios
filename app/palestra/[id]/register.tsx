import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PartnerCheckIn() {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(true);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isSending) return;

    setQrData(data);
    setIsSending(true);

    try {
      const fetchUserInfo = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) throw new Error('Token não encontrado');
            const response = await fetch(`https://api.secompufpe.com/palestras/checkin`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qrCode: data }),
          });
          console.log(response)
          if (response.ok) {
            setModalMessage('Check-in realizado com sucesso!');
          } else {
            const errorData = await response.json();
            setModalMessage(
              errorData.status === 'fila'
                ? 'Você está na lista de espera!'
                : 'Erro ao realizar check-in. Tente novamente.'
            );
          }
        } catch(error) {
          console.log(error);
        }
        fetchUserInfo();
      }
    } catch (error) {
      setModalMessage('Erro ao enviar os dados. Verifique sua conexão.');
    } finally {
      setIsSending(false);
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {isCameraActive ? (
        <View style={styles.cameraWrapper}>
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
            style={styles.cameraView}
          />
          {/* Sobreposição para criar o recorte com borda */}
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleOverlay}>
              <View style={styles.sideOverlay} />
              <View style={styles.transparentHole} />
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay} />
          </View>
        </View>
      ) : (
        <View style={styles.cameraOff}>
          <Text style={styles.cameraOffText}>Câmera Desativada</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { marginBottom: 10 }]}
        onPress={() => setIsCameraActive(!isCameraActive)}
      >
        <Text style={styles.text}>
          {isCameraActive ? 'Desativar Câmera' : 'Ativar Câmera'}
        </Text>
      </TouchableOpacity>

      {qrData && (
        <Text style={styles.qrText}>Último QR Code lido: {qrData}</Text>
      )}

      {isSending && <ActivityIndicator size="large" color="#000" />}

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.text}>OK</Text>
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
    backgroundColor: '#000',
    padding: 20,
  },
  cameraWrapper: {
    position: 'relative',
    width: '100%',
    height: '50%',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Parte superior escura
  },
  middleOverlay: {
    flexDirection: 'row',
    height: 200, // Altura do "buraco"
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Lados escuros
  },
  transparentHole: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent', // Centro transparente
    borderWidth: 2,
    borderColor: '#1e90ff', // Borda azul
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Parte inferior escura
  },
  cameraOff: {
    width: '100%',
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  cameraOffText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  qrText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#000'
  },
});
