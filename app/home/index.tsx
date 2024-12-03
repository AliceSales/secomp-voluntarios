import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Tab } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type Evento = {
  id: string;
  minutes: number;
  timestamp: number;
  title: string;
  description: string;
  vinculo: string;
  active: boolean;
  speaker: string;
  image: string;
  sala: {
    id: number;
    title: string;
    capacity: number;
  };
};

type Usuario = {
  email: string;
  name: string;
  family_name: string;
  password: string;
  vinculo: string;
  genero: string;
  cpf: string;
};

type EventosPorData = { date: string; eventos: Evento[] };

export default function HomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0); // Para controle da aba selecionada
  const [eventosPorData, setEventosPorData] = useState<EventosPorData[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<Usuario | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');
  
        const response = await fetch('https://api.secompufpe.com/usuarios/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) throw new Error('Erro ao carregar informações do usuário');
  
        const userData = await response.json();
        setMe(userData);
  
        // Salva os dados do usuário no AsyncStorage
        await AsyncStorage.setItem('me', JSON.stringify(userData));
  
        // Condicional de navegação
        if (userData.is_partner) {
          const partnerResponse = await fetch('https://api.secompufpe.com/partner/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
  
          if (partnerResponse.ok) {
            const partnerData = await partnerResponse.json();
            router.push(`/partner`);
          }
        }
  
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
      }
    };
  
    fetchUserInfo();
  }, []);
  
  
  console.log(me,'euuu')
  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado');

        const response = await fetch(
          'https://api.secompufpe.com/palestras?only_active=true&group_by_date=true&dict=false',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error('Erro ao carregar eventos');

        const data = await response.json();

        // Processa a resposta para estruturar os eventos agrupados por data
        const eventosAgrupados: EventosPorData[] = [];
        for (const year in data) {
          for (const month in data[year]) {
            for (const day in data[year][month]) {
              const eventos = data[year][month][day];
              const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              eventosAgrupados.push({ date, eventos });
            }
          }
        }
        setEventosPorData(eventosAgrupados);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  useEffect(() => {
    const filterByDay = () => {
      if (eventosPorData.length === 0) return;
  
      const diasExibidos = ['2024-12-02', '2024-12-03', '2024-12-04','2024-12-05','2024-12-06'];
  
      const diaSelecionado = diasExibidos[index];
  
      // Filtra eventos da data correspondente
      const eventosFiltrados = eventosPorData.find((entry) => entry.date === diaSelecionado)?.eventos || [];
      setFilteredEventos(eventosFiltrados);
    };
  
    filterByDay();
  }, [index, eventosPorData]);
  
  const handleEventoPress = (id: string, title: string) => {
    router.push(`/palestra/${id}/checkin`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EBFF08" />
        <Text style={{ color: '#EBFF08' }}>Carregando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
<Tab
  value={index}
  onChange={(e) => setIndex(e)}
  indicatorStyle={{
    backgroundColor: '#EBFF08', // Cor do indicador abaixo da aba selecionada
    height: 2,
    width: '20%', // Reduz a largura do indicador
    marginHorizontal: '2.5%',
  }}
  containerStyle={{
    backgroundColor: '#000000', // Fundo das abas
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%', // Largura máxima do container das abas
    alignSelf: 'center', // Centraliza o Tab na tela
    borderRadius: 10, // Arredonda o fundo
    marginVertical: 10, // Margem entre as abas e o conteúdo
  }}
>
  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day, tabIndex) => (
    <Tab.Item
      key={tabIndex}
      title={day}
      titleStyle={{
        fontSize: 14,
        fontWeight: 'bold',
        color: index === tabIndex ? '#EBFF08' : '#FFFFFF', // Texto amarelo para selecionada, branco para não selecionada
      }}
      buttonStyle={{
        backgroundColor: index === tabIndex ? '#1A1A1A' : '#000000', // Fundo cinza escuro na selecionada, preto nas outras
        borderColor: index === tabIndex ? '#F102AE' : 'transparent', // Borda rosa na aba selecionada
        borderWidth: index === tabIndex ? 2 : 0,
        borderRadius: 5, // Borda arredondada
        marginHorizontal: 5, // Espaço entre as abas
        width: 125, // Largura fixa para cada aba
        marginTop:25,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  ))}
</Tab>

<FlatList
  data={filteredEventos}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.eventoItem} onPress={() => handleEventoPress(item.id, item.title)}>
      <View style={styles.imageBackground}>
        <Image
          source={{ uri: `https://secomp.cin.ufpe.br/photos/${item.id}${item.image}` }}
          style={styles.eventoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.eventoTitle}>{item.title}</Text>
      <Text style={styles.eventoSpeaker}>{item.speaker}</Text>
      <Text style={styles.eventoDescription}>{item.description}</Text>
      <Text style={styles.eventoHorario}>Duração: {item.minutes} minutos</Text>
      <Text style={styles.eventoSala}>Sala: {item.sala.title}</Text>
    </TouchableOpacity>
  )}
  ListEmptyComponent={<Text style={styles.noEventos}>Nenhum evento encontrado para este dia.</Text>}
/>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000', // Cor de fundo do app
  },
  eventoItem: {
    padding: 15,
    borderColor: '#F102AE', // Borda rosa vibrante
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#1A1A1A', // Fundo escuro para os itens
  },
  imageBackground: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden', // Garante que a borda arredondada funcione
    marginBottom: 10,
    backgroundColor: '#EBFF08', // Cor de fundo inicial (amarelo)
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // Necessário para sobreposição de camadas
  },
  eventoImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 1, // Garante que a imagem fique acima do fundo
    borderRadius: 8,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject, // Camada para simular gradiente
    backgroundColor: 'linear-gradient(180deg, #EBFF08, #F102AE)', // Amarelo para rosa
    opacity: 0.8, // Sutil transparência
  },
  eventoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto em branco
  },
  eventoSpeaker: {
    fontSize: 16,
    color: '#EBFF08', // Texto em amarelo
  },
  eventoDescription: {
    fontSize: 14,
    color: '#CCCCCC', // Texto em cinza claro
  },
  eventoHorario: {
    fontSize: 14,
    color: '#FFFFFF', // Texto em branco
  },
  eventoSala: {
    fontSize: 14,
    color: '#F102AE', // Texto em rosa
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEventos: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888', // Texto para quando não houver eventos
  },
});
