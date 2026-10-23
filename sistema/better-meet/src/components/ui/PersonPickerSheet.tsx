import { useEffect, useRef, useState } from 'react';
import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Avatar from '@/components/ui/Avatar';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/utils/apiClient';

export type Person = { id: number; name: string; email: string };

export type PersonChoice<R extends string> = {
  person: Person;
  role: R | null;
};

type PersonPickerSheetProps<R extends string> = {
  visible: boolean;
  title: string;
  // devolve quem pode ser adicionado e corresponde ao termo (nome ou e-mail).
  searchPeople: (term: string) => Promise<Person[]>;
  roles?: readonly { value: R; label: string }[];
  defaultRole?: R;
  // aviso embaixo da busca (ex.: "entra como Membro").
  hint?: string;
  submitLabel: string;
  submitIcon?: IoniconsIconName;
  submitLoadingLabel?: string;
  onClose: () => void;
  // resolve com a mensagem de erro, ou null quando deu certo (o painel fecha).
  onSubmit: (choice: PersonChoice<R>) => Promise<string | null>;
};

const MIN_SEARCH_LENGTH = 2;
// espera o usuário parar de digitar antes de buscar, para não disparar uma
// requisição por letra.
const SEARCH_DELAY_MS = 300;

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; people: Person[] }
  | { status: 'error'; message: string };

// Busca de pessoa por nome ou e-mail, escolha na lista de resultados, papel e
// confirmação, num painel que sobe do rodapé. Usado para adicionar membros e
// para escolher o novo administrador na exclusão de conta.
export default function PersonPickerSheet<R extends string>({
  visible,
  title,
  searchPeople,
  roles,
  defaultRole,
  hint,
  submitLabel,
  submitIcon = 'person-add-outline',
  submitLoadingLabel = 'Adicionando...',
  onClose,
  onSubmit,
}: PersonPickerSheetProps<R>) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [selected, setSelected] = useState<Person | null>(null);
  const [role, setRole] = useState<R | null>(defaultRole ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // só a resposta da busca mais recente é exibida; as anteriores são ignoradas.
  const searchIdRef = useRef(0);

  const cancelSearch = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    searchIdRef.current += 1;
  };

  useEffect(() => cancelSearch, []);

  const runSearch = async (term: string, searchId: number) => {
    try {
      const people = await searchPeople(term);
      if (searchId === searchIdRef.current) {
        setSearch({ status: 'done', people });
      }
    } catch (searchError) {
      if (searchId === searchIdRef.current) {
        setSearch({
          status: 'error',
          message: getErrorMessage(
            searchError,
            'Não foi possível buscar usuários.',
          ),
        });
      }
    }
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setError(null);
    cancelSearch();

    const term = value.trim();
    if (term.length < MIN_SEARCH_LENGTH) {
      setSearch({ status: 'idle' });
      return;
    }
    setSearch({ status: 'loading' });
    const searchId = searchIdRef.current;
    timerRef.current = setTimeout(
      () => void runSearch(term, searchId),
      SEARCH_DELAY_MS,
    );
  };

  const reset = () => {
    cancelSearch();
    setQuery('');
    setSearch({ status: 'idle' });
    setSelected(null);
    setRole(defaultRole ?? null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!selected) {
      setError('Busque e escolha uma pessoa da lista.');
      return;
    }
    if (roles && !role) {
      setError('Escolha o papel.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({ person: selected, role });
    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    close();
  };

  const renderPerson = (person: Person, isSelected: boolean) => (
    <Pressable
      key={person.id}
      accessibilityRole="radio"
      accessibilityLabel={`${person.name}, ${person.email}`}
      accessibilityState={{ selected: isSelected }}
      onPress={() => {
        setSelected(isSelected ? null : person);
        setError(null);
      }}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: isSelected
            ? withAlpha(colors.primary, 0.15)
            : colors.background,
          borderColor: isSelected
            ? colors.primary
            : withAlpha(colors.primary, 0.2),
        },
        pressed && styles.pressed,
      ]}
    >
      <Avatar name={person.name} size="sm" />
      <View style={styles.optionInfo}>
        <Text
          style={[styles.optionName, { color: colors.text }]}
          numberOfLines={1}
        >
          {person.name}
        </Text>
        <Text
          style={[styles.optionDetail, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {person.email}
        </Text>
      </View>
      <Ionicons
        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={isSelected ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );

  const renderStatus = (message: string) => (
    <Text style={[styles.status, { color: colors.textSecondary }]}>
      {message}
    </Text>
  );

  const renderResults = () => {
    if (search.status === 'idle') {
      return renderStatus(
        'Digite pelo menos 2 letras do nome ou do e-mail para buscar.',
      );
    }
    if (search.status === 'loading') {
      return (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Buscando pessoas"
        />
      );
    }
    if (search.status === 'error') return renderStatus(search.message);

    // a pessoa escolhida já aparece em destaque acima da lista.
    const people = search.people.filter((person) => person.id !== selected?.id);
    if (people.length === 0) {
      return renderStatus(
        selected
          ? 'Ninguém mais encontrado com esse nome ou e-mail.'
          : 'Ninguém encontrado com esse nome ou e-mail.',
      );
    }
    return people.map((person) => renderPerson(person, false));
  };

  return (
    <BottomSheet visible={visible} title={title} onClose={close}>
      <View style={styles.field}>
        <SectionLabel label="Buscar pessoa" />
        <TextField
          accessibilityLabel="Buscar por nome ou e-mail"
          placeholder="Nome ou e-mail"
          autoCapitalize="none"
          autoCorrect={false}
          value={query}
          onChangeText={changeQuery}
        />
        {hint ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View accessibilityRole="radiogroup" style={styles.results}>
        {selected ? (
          <>
            <SectionLabel label="Selecionada" />
            {renderPerson(selected, true)}
            <SectionLabel label="Resultados" />
          </>
        ) : null}
        {renderResults()}
      </View>

      {roles ? (
        <View style={styles.field}>
          <SectionLabel label="Papel" />
          <View style={styles.chips}>
            {roles.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={role === item.value}
                onPress={() => {
                  setRole(item.value);
                  setError(null);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <FeedbackBanner
        feedback={error ? { type: 'error', message: error } : null}
      />

      <Button
        label={submitLabel}
        loadingLabel={submitLoadingLabel}
        icon={submitIcon}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  hint: { ...Typography.bodySmall },
  results: { gap: Spacing.sm },
  option: {
    minHeight: TouchTarget.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  pressed: { opacity: PressedOpacity },
  optionInfo: { flex: 1, minWidth: 0 },
  optionName: { ...Typography.body, fontFamily: FontFamily.semiBold },
  optionDetail: { ...Typography.bodySmall },
  status: { ...Typography.body, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
