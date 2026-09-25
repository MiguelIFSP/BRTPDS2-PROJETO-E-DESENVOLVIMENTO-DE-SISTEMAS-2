import React, { useCallback, useRef, useState } from 'react';
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
import { organizacaoService, type Organization } from '../services/organizacaoService';
import { useAuthStore } from '../store/authStore';

export default function ComissaoScreen() {
  const { token, user } = useAuthStore();
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  // comissão só existe dentro de organização aprovada da qual o usuário é membro
  const [organizacoes, setOrganizacoes] = useState<Organization[]>([]);
  const [organizacaoAtualId, setOrganizacaoAtualId] = useState<number | null>(null);
  // espelho em ref pra o useFocusEffect ler a escolha atual sem recarregar a cada troca
  const organizacaoAtualIdRef = useRef<number | null>(null);

  const escolherOrganizacao = (id: number | null) => {
    organizacaoAtualIdRef.current = id;
    setOrganizacaoAtualId(id);
  };

  const carregarComissoes = useCallback(async (organizacaoId: number) => {
    if (!token) return;
    try {
      setComissoes(await comissaoService.listarPorOrganizacao(token, organizacaoId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível carregar as comissões.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano e a lista ficaria desatualizada ao voltar pra cá
  // (ex.: depois de entrar numa organização nova).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        setLoading(true);
        try {
          const aceitas = (await organizacaoService.listMine(token)).filter((org) => org.status === 'ACEITA');
          if (cancelled) return;
          setOrganizacoes(aceitas);

          // mantém a organização escolhida se ela ainda existir; senão, a primeira
          const atualId =
            aceitas.find((org) => org.id === organizacaoAtualIdRef.current)?.id ?? aceitas[0]?.id ?? null;
          escolherOrganizacao(atualId);

          if (atualId === null) {
            setComissoes([]);
            setLoading(false);
            return;
          }
          await carregarComissoes(atualId);
        } catch {
          if (cancelled) return;
          Alert.alert('Erro', 'Não foi possível carregar suas organizações.');
          setLoading(false);
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, carregarComissoes])
  );

  const selecionarOrganizacao = (id: number) => {
    if (id === organizacaoAtualId) return;
    escolherOrganizacao(id);
    setLoading(true);
    void carregarComissoes(id);
  };

  const handleCriarComissao = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome da comissão é obrigatório.');
      return;
    }
    if (!token || !organizacaoAtualId) return;

    setModalVisible(false);
    setLoading(true);

    try {
      await comissaoService.criar(token, nome, descricao, organizacaoAtualId);
      setNome('');
      setDescricao('');
      await carregarComissoes(organizacaoAtualId);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Ocorreu um erro ao criar a comissão.');
      setLoading(false);
    }
  };

  const handleExcluir = (id: number) => {
    if (!token || !organizacaoAtualId) return;
    Alert.alert('Tem certeza?', 'Apenas o Administrador pode excluir. Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await comissaoService.excluir(token, id);
            await carregarComissoes(organizacaoAtualId);
          } catch (error) {
            Alert.alert('Acesso Negado', error instanceof Error ? error.message : 'Você não tem permissão para excluir esta comissão ou ocorreu um erro.');
            setLoading(false);
          }
        }
      }
    ]);
  };

  // só o ADMINISTRADOR da comissão vê o botão de excluir (a API valida de novo)
  const isAdministrador = (comissao: Comissao) =>
    comissao.equipe?.some((membro) => membro.userId === user?.id && membro.papel === 'ADMINISTRADOR') ?? false;

  const renderCard = ({ item }: { item: Comissao }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        {item.descricao ? <Text style={styles.cardDesc}>{item.descricao}</Text> : null}
      </View>
      {isAdministrador(item) ? (
        <TouchableOpacity onPress={() => handleExcluir(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Comissões</Text>

      {organizacoes.length > 1 ? (
        <View style={styles.orgSelector}>
          {organizacoes.map((org) => {
            const selected = org.id === organizacaoAtualId;
            return (
              <TouchableOpacity
                key={org.id}
                onPress={() => selecionarOrganizacao(org.id)}
                style={[styles.orgChip, selected && styles.orgChipSelected]}
              >
                <Text style={[styles.orgChipText, selected && styles.orgChipTextSelected]}>{org.nome}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      
      {loading ? (
        <ActivityIndicator size="large" color="#1FD5B5" style={{ marginTop: 20 }} />
      ) : !organizacaoAtualId ? (
        <Text style={styles.emptyText}>Você precisa participar de uma organização aprovada para ver comissões.</Text>
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
      {organizacaoAtualId ? (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      ) : null}

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
  orgSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  orgChip: {
    borderWidth: 1,
    borderColor: '#557B88',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  orgChipSelected: {
    backgroundColor: '#1FD5B5',
    borderColor: '#1FD5B5',
  },
  orgChipText: {
    color: '#B8C9D1',
    fontWeight: '600',
  },
  orgChipTextSelected: {
    color: '#0D1B1D',
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