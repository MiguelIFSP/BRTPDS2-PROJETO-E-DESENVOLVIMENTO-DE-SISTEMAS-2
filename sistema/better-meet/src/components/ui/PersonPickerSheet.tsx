import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { emailRule } from '@/schemas/commonSchema';
import { normalizeSearch } from '@/utils/format';

export type Person = { id: number; name: string; email: string };

export type PersonChoice<R extends string> = {
  // null quando a escolha foi um e-mail digitado, fora da lista.
  person: Person | null;
  email: string;
  role: R | null;
};

type PersonPickerSheetProps<R extends string> = {
  visible: boolean;
  title: string;
  people: Person[];
  // aceita um e-mail digitado que não está na lista (convite por e-mail).
  allowEmail?: boolean;
  roles?: readonly { value: R; label: string }[];
  defaultRole?: R;
  // aviso embaixo da busca (ex.: "entra como Membro").
  hint?: string;
  submitLabel: string;
  onClose: () => void;
  // resolve com a mensagem de erro, ou null quando deu certo (o painel fecha).
  onSubmit: (choice: PersonChoice<R>) => Promise<string | null>;
};

const MAX_RESULTS = 8;

// Busca de pessoa por nome ou e-mail, escolha do papel e confirmação, num
// painel que sobe do rodapé. Usado para adicionar membros.
export default function PersonPickerSheet<R extends string>({
  visible,
  title,
  people,
  allowEmail = false,
  roles,
  defaultRole,
  hint,
  submitLabel,
  onClose,
  onSubmit,
}: PersonPickerSheetProps<R>) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [useTypedEmail, setUseTypedEmail] = useState(false);
  const [role, setRole] = useState<R | null>(defaultRole ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const term = normalizeSearch(query);
  const results = people
    .filter(
      (person) =>
        normalizeSearch(person.name).includes(term) ||
        normalizeSearch(person.email).includes(term),
    )
    .slice(0, MAX_RESULTS);
  const typedEmail = query.trim().toLowerCase();
  const canUseTypedEmail =
    allowEmail &&
    emailRule().isValidSync(typedEmail) &&
    !people.some((person) => person.email.toLowerCase() === typedEmail);
  const selected = people.find((person) => person.id === selectedId) ?? null;

  const reset = () => {
    setQuery('');
    setSelectedId(null);
    setUseTypedEmail(false);
    setRole(defaultRole ?? null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    const email = selected?.email ?? (useTypedEmail ? typedEmail : '');
    if (!email) {
      setError(
        allowEmail
          ? 'Escolha uma pessoa da lista ou digite o e-mail completo.'
          : 'Escolha uma pessoa da lista.',
      );
      return;
    }
    if (roles && !role) {
      setError('Escolha o papel.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({ person: selected, email, role });
    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    close();
  };

  const renderOption = (
    key: string,
    label: string,
    detail: string,
    isSelected: boolean,
    onPress: () => void,
    avatarName?: string,
  ) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${detail}`}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
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
      {avatarName ? (
        <Avatar name={avatarName} size="sm" />
      ) : (
        <View
          style={[
            styles.mailIcon,
            { backgroundColor: withAlpha(colors.primary, 0.18) },
          ]}
        >
          <Ionicons name="mail-outline" size={16} color={colors.primary} />
        </View>
      )}
      <View style={styles.optionInfo}>
        <Text
          style={[styles.optionName, { color: colors.text }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[styles.optionDetail, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {detail}
        </Text>
      </View>
      <Ionicons
        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={isSelected ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );

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
          onChangeText={(value) => {
            setQuery(value);
            setUseTypedEmail(false);
            setError(null);
          }}
        />
        {hint ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View accessibilityRole="radiogroup" style={styles.results}>
        {results.map((person) =>
          renderOption(
            String(person.id),
            person.name,
            person.email,
            selectedId === person.id,
            () => {
              setSelectedId(person.id);
              setUseTypedEmail(false);
              setError(null);
            },
            person.name,
          ),
        )}
        {canUseTypedEmail
          ? renderOption(
              'typed-email',
              'Adicionar por e-mail',
              typedEmail,
              useTypedEmail,
              () => {
                setSelectedId(null);
                setUseTypedEmail(true);
                setError(null);
              },
            )
          : null}
        {results.length === 0 && !canUseTypedEmail ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {people.length === 0 && !allowEmail
              ? 'Não há ninguém disponível para adicionar.'
              : allowEmail
                ? 'Ninguém encontrado. Digite o e-mail completo para adicionar quem já tem conta.'
                : 'Ninguém encontrado com esse nome ou e-mail.'}
          </Text>
        ) : null}
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
        loadingLabel="Adicionando..."
        icon="person-add-outline"
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
  pressed: { opacity: 0.8 },
  mailIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: { flex: 1, minWidth: 0 },
  optionName: { ...Typography.body, fontFamily: FontFamily.semiBold },
  optionDetail: { ...Typography.bodySmall },
  empty: { ...Typography.body, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
