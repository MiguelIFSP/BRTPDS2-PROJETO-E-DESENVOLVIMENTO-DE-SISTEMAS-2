import Button from '@/components/ui/Button';

type ReenviarConviteButtonProps = {
  nome: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

// Mesmo botão em "Convites sem aceite" e na linha de cada participante: o
// rótulo de acessibilidade diz para quem o convite sai.
export default function ReenviarConviteButton({
  nome,
  onPress,
  isLoading = false,
  disabled = false,
}: ReenviarConviteButtonProps) {
  return (
    <Button
      variant="tertiary"
      icon="paper-plane-outline"
      label="Reenviar"
      loadingLabel="Reenviando..."
      accessibilityLabel={`Reenviar convite para ${nome}`}
      isLoading={isLoading}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
