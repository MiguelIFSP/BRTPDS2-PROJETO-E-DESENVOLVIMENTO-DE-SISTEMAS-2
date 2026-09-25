import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, ActivityIndicator, Alert, ScrollView, 
  useColorScheme, Pressable, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { comissaoService, Comissao } from '../services/comissaoService';
import { useAuthStore } from '../store/authStore'; 
import { organizacaoService, type Organization } from '../services/organizacaoService';

export default function ComissaoScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const router = useRouter();
  
  const { token } = useAuthStore(); 
  
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalCriarVisible, setModalCriarVisible] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const [comissaoSelecionada, setComissaoSelecionada] = useState<Comissao | null>(null);
  const [novoMembroId, setNovoMembroId] = useState('');
  const [novoMembroPapel, setNovoMembroPapel] = useState('MEMBRO');

  // comissao so existe em organizacao aprovada da qual o usuario e membro (regra da API).
  const [organizacoes, setOrganizacoes] = useState<Organization[]>([]);
  const [organizacaoAtualId, setOrganizacaoAtualId] = useState<number | null>(null);

  // Função auxiliar para os alertas funcionarem perfeitamente no PC e no Telemóvel
  const showAlert = (titulo: string, mensagem: string) => {
    if (Platform.OS === 'web') {
      window.alert(mensagem);
    } else {
      Alert.alert(titulo, mensagem);
    }
  };

  const carregarComissoes = async () => {
    if (!token || !organizacaoAtualId) return;
    try {
      const dados = await comissaoService.listarPorOrganizacao(organizacaoAtualId, token);
      setComissoes(dados);
      
      if (comissaoSelecionada) {
        const atualizada = dados.find(c => c.id === comissaoSelecionada.id);
        if (atualizada) setComissaoSelecionada(atualizada);
      }
    } catch (error: any) {
      showAlert('Erro', error.message || 'Não foi possível carregar as comissões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const carregarOrganizacoes = async () => {
      try {
        const aprovadas = (await organizacaoService.listMine(token)).filter((org) => org.status === 'ACEITA');
        setOrganizacoes(aprovadas);
        setOrganizacaoAtualId(aprovadas[0]?.id ?? null);
        if (aprovadas.length === 0) setLoading(false);
      } catch (error: any) {
        showAlert('Erro', error.message || 'Não foi possível carregar suas organizações.');
        setLoading(false);
      }
    };
    carregarOrganizacoes();
  }, [token]);

  useEffect(() => {
    if (!organizacaoAtualId) return;
    setLoading(true);
    setComissaoSelecionada(null);
    carregarComissoes();
  }, [organizacaoAtualId]);

  const handleCriarComissao = async () => {
    if (!nome.trim()) {
      showAlert('Atenção', 'O nome da comissão é obrigatório.');
      return;
    }
    if (!token || !organizacaoAtualId) return;

    setModalCriarVisible(false);
    setLoading(true);

    try {
      await comissaoService.criar(nome, descricao, organizacaoAtualId, token);
      setNome('');
      setDescricao('');
      await carregarComissoes(); 
    } catch (error: any) {
      showAlert('Erro', error.message || 'Ocorreu um erro ao criar a comissão.');
      setLoading(false);
    }
  };

  // Lógica de exclusão separada para garantir execução em qualquer plataforma
  const executarExclusaoComissao = async (id: number) => {
    setLoading(true);
    try {
      await comissaoService.excluir(id, token!);
      setComissaoSelecionada(null);
      await carregarComissoes();
    } catch (error: any) {
      showAlert('Acesso Negado', error.message || 'Não tem permissão para excluir.');
      setLoading(false);
    }
  };

  const handleExcluirComissao = (id: number) => {
    const mensagem = 'Apenas o Administrador pode excluir. Deseja continuar?';
    
    if (Platform.OS === 'web') {
      const confirmou = window.confirm(mensagem);
      if (confirmou) executarExclusaoComissao(id);
    } else {
      Alert.alert('Excluir Comissão', mensagem, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => executarExclusaoComissao(id) }
      ]);
    }
  };

  const handleAdicionarMembro = async () => {
    if (!comissaoSelecionada || !novoMembroId.trim() || !token) return;
    
    setLoading(true);
    try {
      await comissaoService.adicionarMembro(comissaoSelecionada.id, Number(novoMembroId), novoMembroPapel, token);
      setNovoMembroId('');
      setNovoMembroPapel('MEMBRO');
      await carregarComissoes();
    } catch (error: any) {
      showAlert('Erro', error.message || 'Não foi possível adicionar o membro.');
      setLoading(false);
    }
  };

  // Lógica de remoção de membro compatível com a web
  const executarRemocaoMembro = async (userId: number) => {
    setLoading(true);
    try {
      await comissaoService.removerMembro(comissaoSelecionada!.id, userId, token!);
      await carregarComissoes();
    } catch (error: any) {
      showAlert('Erro', error.message || 'Não foi possível remover o membro.');
      setLoading(false);
    }
  };

  const handleRemoverMembro = (userId: number) => {
    if (!comissaoSelecionada || !token) return;
    const mensagem = 'Deseja remover este utilizador da comissão?';

    if (Platform.OS === 'web') {
      const confirmou = window.confirm(mensagem);
      if (confirmou) executarRemocaoMembro(userId);
    } else {
      Alert.alert('Remover Membro', mensagem, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => executarRemocaoMembro(userId) }
      ]);
    }
  };

  const renderCard = ({ item }: { item: Comissao }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: themeColors.backgroundElement, borderColor: themeColors.backgroundElement }
      ]} 
      onPress={() => setComissaoSelecionada(item)}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.nome}</Text>
        {item.descricao ? <Text style={[styles.cardDesc, { color: themeColors.textSecondary }]}>{item.descricao}</Text> : null}
        <View style={[styles.badgeContainer, { backgroundColor: themeColors.background }]}>
           <Text style={[styles.badgeText, { color: themeColors.textSecondary }]}>Membros: {item.equipe?.length || 0}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={themeColors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      
      <View style={styles.container}>
        <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
            <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
            <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
        </Pressable>

        <Text style={[styles.pageTitle, { color: themeColors.text }]}>Comissões</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Gerencie os grupos de trabalho</Text>

        {organizacoes.length > 1 ? (
          <View style={styles.roleContainer}>
            {organizacoes.map((org) => (
              <TouchableOpacity
                key={org.id}
                style={[
                  styles.roleChip,
                  { borderColor: themeColors.textSecondary },
                  organizacaoAtualId === org.id && styles.roleChipActive
                ]}
                onPress={() => setOrganizacaoAtualId(org.id)}
              >
                <Text style={[
                  styles.roleText,
                  { color: themeColors.textSecondary },
                  organizacaoAtualId === org.id && styles.roleTextActive
                ]}>
                  {org.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        
        {loading ? (
          <ActivityIndicator size="large" color={themeColors.text} style={{ marginTop: 32 }} />
        ) : !organizacaoAtualId ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Você ainda não participa de nenhuma organização aprovada.
          </Text>
        ) : comissoes.length === 0 ? (
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Nenhuma comissão cadastrada.</Text>
        ) : (
          <FlatList
            data={comissoes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {organizacaoAtualId ? (
        <TouchableOpacity style={styles.fab} onPress={() => setModalCriarVisible(true)}>
          <Ionicons name="add" size={30} color="#0D1B1D" />
        </TouchableOpacity>
      ) : null}

      <Modal visible={modalCriarVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Nova Comissão</Text>
            
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nome *</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.textSecondary, color: themeColors.text }]}
              placeholder="Ex: Comitê de Eventos"
              placeholderTextColor={themeColors.textSecondary}
              value={nome}
              onChangeText={setNome}
            />
            
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>Descrição</Text>
            <TextInput 
              style={[styles.input, { height: 80, backgroundColor: themeColors.background, borderColor: themeColors.textSecondary, color: themeColors.text }]}
              placeholder="Objetivo da comissão..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalCriarVisible(false)}>
                <Text style={[styles.btnSecondaryText, { color: themeColors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleCriarComissao}>
                <Text style={styles.btnPrimaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!comissaoSelecionada} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%', backgroundColor: themeColors.backgroundElement }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{comissaoSelecionada?.nome}</Text>
              <TouchableOpacity onPress={() => setComissaoSelecionada(null)}>
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {comissaoSelecionada?.descricao && (
                <Text style={[styles.descricaoText, { color: themeColors.textSecondary }]}>{comissaoSelecionada.descricao}</Text>
              )}

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Equipa Atual</Text>
              {comissaoSelecionada?.equipe?.map((membro) => (
                <View key={membro.userId} style={[styles.memberRow, { backgroundColor: themeColors.background }]}>
                  <View>
                    <Text style={[styles.memberId, { color: themeColors.text }]}>ID Utilizador: {membro.userId}</Text>
                    <Text style={[styles.memberRole, { color: themeColors.textSecondary }]}>{membro.papel}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoverMembro(membro.userId)}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={[styles.separator, { backgroundColor: themeColors.textSecondary }]} />

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Adicionar Membro</Text>
              <Text style={[styles.label, { color: themeColors.textSecondary }]}>ID do Utilizador</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.textSecondary, color: themeColors.text }]}
                placeholder="Ex: 2"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={novoMembroId}
                onChangeText={setNovoMembroId}
              />

              <Text style={[styles.label, { color: themeColors.textSecondary }]}>Papel na Comissão</Text>
              <View style={styles.roleContainer}>
                {['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO'].map((papel) => (
                  <TouchableOpacity 
                    key={papel}
                    style={[
                      styles.roleChip, 
                      { borderColor: themeColors.textSecondary },
                      novoMembroPapel === papel && styles.roleChipActive
                    ]}
                    onPress={() => setNovoMembroPapel(papel)}
                  >
                    <Text style={[
                      styles.roleText, 
                      { color: themeColors.textSecondary },
                      novoMembroPapel === papel && styles.roleTextActive
                    ]}>
                      {papel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.btnPrimary} onPress={handleAdicionarMembro}>
                <Text style={[styles.btnPrimaryText, { textAlign: 'center' }]}>Adicionar à Equipa</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btnSecondary, { marginTop: 24, alignSelf: 'center' }]} 
                onPress={() => comissaoSelecionada && handleExcluirComissao(comissaoSelecionada.id)}
              >
                <Text style={[styles.btnSecondaryText, { color: '#F44336' }]}>Excluir Comissão Inteira</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing?.one || 4,
    paddingVertical: Spacing?.two || 8,
    marginTop: 10,
  },
  pressed: { opacity: 0.65 },
  backText: { ...(Typography?.body || { fontSize: 16 }), fontWeight: '600' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, marginTop: 10 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  list: { paddingBottom: 80 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardDesc: { fontSize: 14, marginTop: 4 },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#1FD5B5', 
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: { borderRadius: 16, padding: 24 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  descricaoText: { fontSize: 14, marginBottom: 24, fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberId: { fontWeight: 'bold' },
  memberRole: { fontSize: 12, marginTop: 2 },
  separator: { height: 1, marginVertical: 24, opacity: 0.3 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
  roleChip: { borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  roleChipActive: { backgroundColor: '#1FD5B5', borderColor: '#1FD5B5' },
  roleText: { fontSize: 12, fontWeight: 'bold' },
  roleTextActive: { color: '#0D1B1D' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  btnSecondary: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  btnSecondaryText: { fontWeight: '600' },
  btnPrimary: {
    backgroundColor: '#1FD5B5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnPrimaryText: { color: '#0D1B1D', fontWeight: 'bold' }
});