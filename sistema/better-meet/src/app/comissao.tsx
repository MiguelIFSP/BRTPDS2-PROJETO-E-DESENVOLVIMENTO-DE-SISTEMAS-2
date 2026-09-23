// better-meet/src/app/comissao.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { comissaoService, Comissao } from '../services/comissaoService';

export default function ComissaoScreen() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true); // A tela JÁ COMEÇA carregando
  const [modalVisible, setModalVisible] = useState(false);
  
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  // Simulação de um ID de organização que viria do Contexto/Login (Zustand)
  const organizacaoAtualId = 1; 

  // Função de carregar só finaliza o loading no final para evitar o erro do ESLint
  const carregarComissoes = useCallback(async () => {
    try {
      const dados = await comissaoService.listarPorOrganizacao(organizacaoAtualId);
      setComissoes(dados);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as comissões.');
    } finally {
      setLoading(false);
    }
  }, [organizacaoAtualId]);

 // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
 // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
 // deixaria a lista desatualizada ao voltar pra cá depois de criar/excluir comissão.
 useFocusEffect(
   useCallback(() => {
     carregarComissoes();
   }, [carregarComissoes])
 );

  
  const handleCriarComissao = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome da comissão é obrigatório.');
      return;
    }

    setModalVisible(false);
    setLoading(true); // Ativa o loading manualmente

    try {
      await comissaoService.criar(nome, descricao, organizacaoAtualId);
      setNome('');
      setDescricao('');
      carregarComissoes(); // A função vai recarregar a lista e tirar o loading
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro ao criar a comissão.');
      setLoading(false);
    }
  };

  const handleExcluir = (id: number) => {
    Alert.alert('Tem certeza?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          setLoading(true); // Ativa o loading para o usuário ver que está processando
          try {
            await comissaoService.excluir(id);
            carregarComissoes();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
            setLoading(false);
          }
        }
      }
    ]);
  };

  const renderCard = ({ item }: { item: Comissao }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        {item.descricao ? <Text style={styles.cardDesc}>{item.descricao}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => handleExcluir(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Comissões</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#1FD5B5" style={{ marginTop: 20 }} />
      ) : comissoes.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma comissão cadastrada.</Text>
      ) : (
        <FlatList
          data={comissoes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Botão Flutuante (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal de Criação */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Comissão</Text>
            
            <Text style={styles.label}>Nome *</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ex: Comitê de Eventos"
              placeholderTextColor="#557B88"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput 
              style={[styles.input, { height: 80 }]}
              placeholder="Objetivo da comissão..."
              placeholderTextColor="#557B88"
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleCriarComissao}>
                <Text style={styles.btnPrimaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B1D', // Fundo Escuro Primário
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderColor: '#557B88',
  },
  list: {
    padding: 16,
  },
  emptyText: {
    color: '#557B88',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#162126', // Fundo Escuro Secundário
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#557B88', // Cinza Médio
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardDesc: {
    color: '#B8C9D1',
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#F44336', // Cor de Erro
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#1FD5B5', // Verde-Água
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: {
    fontSize: 24,
    color: '#0D1B1D',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 27, 29, 0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#162126',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  label: {
    color: '#557B88',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0D1B1D',
    borderWidth: 1,
    borderColor: '#557B88',
    borderRadius: 8,
    color: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  btnSecondaryText: {
    color: '#1FD5B5',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#1FD5B5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#0D1B1D',
    fontWeight: 'bold',
  }
});